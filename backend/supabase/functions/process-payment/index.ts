import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID")!;
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET")!;
const PAYPAL_API_BASE = Deno.env.get("PAYPAL_ENV") === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { orderID, paymentMethod, appointmentData, paymentData, client_rnc } = await req.json();

        let transactionId = orderID;
        let paymentStatus = "pending";
        let ncfNumber = null;
        let ncfPrefix = client_rnc ? 'B01' : 'B02'; // B01 for Tax Credit (with RNC), B02 for Consumer Final

        // Generate Appointment Code (6 chars: Uppercase + numbers)
        const generateAppointmentCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        };
        const appointmentCode = generateAppointmentCode();

        // 1. Validation Logic
        if (paymentMethod === "paypal") {
            if (!orderID) throw new Error("Missing PayPal Order ID");

            // Verify with PayPal
            const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`);
            const tokenRes = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
                method: "POST",
                body: "grant_type=client_credentials",
                headers: { Authorization: `Basic ${auth}` },
            });
            const tokenData = await tokenRes.json();

            const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}`, {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const orderJson = await orderRes.json();

            if (orderJson.status !== "COMPLETED" && orderJson.status !== "APPROVED") {
                throw new Error(`PayPal Order status is ${orderJson.status}`);
            }

            paymentStatus = "confirmed";
            transactionId = orderJson.id; // Confirm ID
        } else if (paymentMethod === "transfer") {
            // Skip validation for now, manual review
            paymentStatus = "pending";
        }

        // 2. Fiscal Generation (NCF)
        if (paymentStatus === "confirmed" || paymentMethod === "transfer") {
            // Logic: If client_rnc is present, use Tax Credit (01), else Consumer Final (02)
            // Check config/env for Electronic (E) vs Standard (B) - Defaulting to B for now as per requirements unless 'E' specified.
            // User prompt: "Standard: B01. Electronic: E31... If client_rnc is null -> Standard: B02. Electronic: E32."
            // We will assume "Standard" by default unless we detect we are in "Electronic" mode. 
            // Ideally this should be an ENV var. Let's assume standard 'B' unless we add an env for 'E'.

            const IS_ELECTRONIC = Deno.env.get("ENABLE_ELECTRONIC_NCF") === "true";

            if (client_rnc) {
                ncfPrefix = IS_ELECTRONIC ? 'E31' : 'B01';
            } else {
                ncfPrefix = IS_ELECTRONIC ? 'E32' : 'B02';
            }

            const { data: ncf, error: ncfError } = await supabase.rpc('get_next_ncf', { p_prefix: ncfPrefix });

            if (ncfError || !ncf) {
                console.error("NCF Error:", ncfError);
                throw new Error("Error generando comprobante fiscal (NCF). Secuencia agotada o error de sistema.");
            }
            ncfNumber = ncf;
        }

        // Fetch Company Snapshot
        let companyRncSnapshot = null;
        if (paymentStatus === "confirmed") {
            const { data: settings } = await supabase.from('company_settings').select('rnc').limit(1).single();
            if (settings) companyRncSnapshot = settings.rnc;
        }

        // --- NEW: ASSIGN DEFAULT LAWYER ---
        // Find the first active lawyer to assign
        let assignedLawyerId = null;
        const { data: activeLawyer } = await supabase
            .from('lawyers')
            .select('id')
            .eq('is_active', true)
            .limit(1)
            .single();

        if (activeLawyer) {
            assignedLawyerId = activeLawyer.id;
        }
        // -----------------------------------

        // 3. Database Transaction
        // Insert Appointment
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
            .select()
            .single();

        if (appError) throw new Error(`Error saving appointment: ${appError.message}`);

        // Insert Payment
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
                ncf_type: ncfNumber ? ncfPrefix : null, // Store the 3-char prefix
                proof_url: paymentData?.proof_url,
                company_rnc_snapshot: companyRncSnapshot,
                client_rnc: client_rnc || null
            }])
            .select() // Select to get ID for logging
            .single();

        if (payError) throw new Error(`Error saving payment: ${payError.message}`);

        // 4. Log NCF Issuance
        if (ncfNumber) {
            const { error: logError } = await supabase
                .from('ncf_issuance_log')
                .insert([{
                    ncf_code: ncfNumber,
                    ncf_type: ncfPrefix,
                    client_rnc: client_rnc || null,
                    client_name: appointmentData.client_name,
                    payment_id: newPayment.id,
                    issued_at: new Date().toISOString(),
                    amount: appointmentData.total_price
                }]);

            if (logError) console.error("Error logging NCF:", logError);
            // Non-blocking error for log
        }



        // 4. Trigger Integrations (Async)

        // Email (Fire and forget, or await if critical)
        // We already have send-booking-confirmation. Let's invoke it.
        await supabase.functions.invoke('send-booking-confirmation', {
            body: {
                appointment: newAppointment,
                payment: {
                    method: paymentMethod,
                    amount: appointmentData.total_price,
                    currency: 'USD',
                    ncf_number: ncfNumber
                }
            }
        });

        // Zoho Sync (Fire and forget)
        // Calling the function we are about to create
        if (paymentStatus === "confirmed") {
            supabase.functions.invoke('zoho-sync', {
                body: {
                    appointment: newAppointment
                }
            });
        }

        return new Response(
            JSON.stringify({ success: true, appointmentId: newAppointment.id, ncf: ncfNumber, appointmentCode: appointmentCode }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );

    } catch (error: any) {
        console.error(error);

        let errorMessage = error.message;

        // Catch specific NCF exhausted error from database function
        if (errorMessage.includes("Secuencia NCF agotada") || errorMessage.includes("Sequences exhausted") || errorMessage.includes("agotada")) {
            errorMessage = "No hay facturas disponibles para este tipo de cliente. Por favor contacte a soporte.";
        }

        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
});
