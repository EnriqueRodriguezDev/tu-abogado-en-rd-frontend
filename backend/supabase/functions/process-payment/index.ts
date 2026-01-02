import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// NOTA: Deno busca estas variables SIN el prefijo VITE_
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID")!;
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET")!;
const PAYPAL_API_BASE = Deno.env.get("PAYPAL_ENV") === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const { orderID, paymentMethod, appointmentData, paymentData, client_rnc } = await req.json();

        let transactionId = orderID;
        let paymentStatus = "pending";
        let ncfNumber = null;
        let ncfPrefix = client_rnc ? 'B01' : 'B02';

        // Generador de Código de Cita
        const generateAppointmentCode = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = '';
            for (let i = 0; i < 6; i++) { code += chars.charAt(Math.floor(Math.random() * chars.length)); }
            return code;
        };
        const appointmentCode = generateAppointmentCode();

        // 1. Lógica de Validación (PayPal)
        if (paymentMethod === "paypal") {
            if (!orderID) throw new Error("Missing PayPal Order ID");
            if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) throw new Error("Server PayPal credentials missing");

            console.log(`Verifying PayPal Order: ${orderID} in ${PAYPAL_API_BASE}`);

            // A. Obtener Token
            const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`);
            const tokenRes = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
                method: "POST",
                body: "grant_type=client_credentials",
                headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
            });

            if (!tokenRes.ok) {
                const errText = await tokenRes.text();
                console.error("PayPal Token Error:", errText);
                throw new Error("Error autenticando con PayPal. Revise credenciales del servidor.");
            }
            const tokenData = await tokenRes.json();

            // B. Obtener Detalles de la Orden
            const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}`, {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const orderJson = await orderRes.json();

            // C. Validación Estricta
            if (!orderRes.ok) {
                console.error("PayPal API Error Response:", JSON.stringify(orderJson));
                throw new Error(`PayPal rechazó la verificación: ${orderJson.message || 'Error desconocido'}`);
            }

            console.log("PayPal Status:", orderJson.status);

            if (orderJson.status !== "COMPLETED" && orderJson.status !== "APPROVED") {
                throw new Error(`El pago no está completado. Estado actual: ${orderJson.status}`);
            }

            paymentStatus = "confirmed";
            transactionId = orderJson.id;
        }

        // 2. Generación Fiscal (NCF)
        if (paymentStatus === "confirmed" || paymentMethod === "transfer") {
            const IS_ELECTRONIC = Deno.env.get("ENABLE_ELECTRONIC_NCF") === "true";
            ncfPrefix = client_rnc ? (IS_ELECTRONIC ? 'E31' : 'B01') : (IS_ELECTRONIC ? 'E32' : 'B02');

            const { data: ncf, error: ncfError } = await supabase.rpc('get_next_ncf', { p_prefix: ncfPrefix });
            
            if (ncfError) {
                console.error("NCF Error:", ncfError);
                throw new Error("Error generando NCF: Secuencia agotada o error interno.");
            }
            if (!ncf) throw new Error("No se pudo obtener una secuencia NCF válida.");
            
            ncfNumber = ncf;
        }

        // 3. Asignar Abogado
        let assignedLawyerId = null;
        const { data: activeLawyer } = await supabase.from('lawyers').select('id').eq('is_active', true).limit(1).single();
        if (activeLawyer) assignedLawyerId = activeLawyer.id;

        // Snapshot RNC Empresa
        let companyRncSnapshot = null;
        if (paymentStatus === "confirmed") {
            const { data: settings } = await supabase.from('company_settings').select('rnc').single();
            if (settings) companyRncSnapshot = settings.rnc;
        }

        // 4. Guardar Cita
        const { data: newAppointment, error: appError } = await supabase
            .from('appointments')
            .insert([{
                created_at: new Date().toISOString(),
                date: appointmentData.date,
                time: appointmentData.time,
                duration_minutes: appointmentData.duration_minutes,
                meeting_type: appointmentData.meeting_type,
                status: paymentStatus === 'confirmed' ? 'confirmed' : 'pending',
                client_name: appointmentData.client_name,
                client_email: appointmentData.client_email,
                client_phone: appointmentData.client_phone,
                reason: appointmentData.reason,
                total_price: appointmentData.total_price,
                appointment_code: appointmentCode,
                lawyer_id: assignedLawyerId
            }])
            .select().single();

        if (appError) throw new Error(`Error guardando cita: ${appError.message}`);

        // 5. Guardar Pago
        const { data: newPayment, error: payError } = await supabase
            .from('payments')
            .insert([{
                appointment_id: newAppointment.id,
                amount: appointmentData.total_price,
                currency: 'USD',
                method: paymentMethod,
                status: paymentStatus,
                transaction_id: transactionId,
                ncf_number: ncfNumber,
                ncf_type: ncfNumber ? ncfPrefix : null,
                proof_url: paymentData?.proof_url,
                company_rnc_snapshot: companyRncSnapshot,
                client_rnc: client_rnc || null
            }])
            .select().single();

        if (payError) throw new Error(`Error guardando pago: ${payError.message}`);

        // 6. Log y Hooks
        if (ncfNumber) {
            await supabase.from('ncf_issuance_log').insert([{
                ncf_code: ncfNumber, ncf_type: ncfPrefix, client_rnc: client_rnc || null,
                client_name: appointmentData.client_name, payment_id: newPayment.id,
                issued_at: new Date().toISOString(), amount: appointmentData.total_price
            }]);
        }

        await supabase.functions.invoke('send-booking-confirmation', {
            body: { appointment: newAppointment, payment: { method: paymentMethod, amount: appointmentData.total_price, currency: 'USD', ncf_number: ncfNumber } }
        });

        if (paymentStatus === "confirmed") {
            supabase.functions.invoke('zoho-sync', { body: { appointment: newAppointment } });
        }

        return new Response(
            JSON.stringify({ success: true, appointmentId: newAppointment.id, ncf: ncfNumber, appointmentCode: appointmentCode }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );

    } catch (error: any) {
        console.error("Process Payment Error:", error);
        let errorMessage = error.message;
        if (errorMessage.includes("Secuencia NCF agotada") || errorMessage.includes("agotada")) {
            errorMessage = "No hay facturas disponibles. Contacte soporte.";
        }
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
});