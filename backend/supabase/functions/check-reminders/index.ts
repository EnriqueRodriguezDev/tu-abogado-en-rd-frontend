import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend";
import { formatTime } from "../utils/formatters.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        // 1. Obtener Configuración de Marca (Logo, Nombre)
        const { data: company } = await supabase
            .from("company_settings")
            .select("*")
            .single();

        const logoUrl = company?.logo_url || "";
        const companyName = company?.name || "Bufete Legal";
        const companyPhone = company?.phone || "";

        // 2. Obtener citas CONFIRMADAS de HOY que NO se han enviado
        // IMPORTANTE: Usamos '!inner' para traer solo citas que tengan un abogado asignado válido
        const todayStr = new Date().toISOString().split('T')[0];

        const { data: appointments, error: apptErr } = await supabase
            .from("appointments")
            .select("*, lawyer:lawyers!inner(*)") // <--- AQUÍ SE OBTIENE EL EMAIL DEL ABOGADO
            .eq("status", "confirmed")
            .eq("reminder_sent", false)
            .eq("date", todayStr);

        if (apptErr) throw new Error(`Error buscando citas: ${apptErr.message}`);

        const sentIds: string[] = [];
        const emailsToSend: any[] = [];
        const now = new Date();

        console.log(`Procesando ${appointments?.length || 0} citas confirmadas para hoy...`);

        // 3. Iterar y Verificar Tiempos
        for (const appt of (appointments || [])) {
            // Si por alguna razón la relación vino vacía, saltamos
            if (!appt.lawyer || !appt.lawyer.email) {
                console.log(`Cita ${appt.id} no tiene abogado o email válido.`);
                continue;
            }

            // Preferencia del abogado (o 20 min por defecto)
            const reminderMinutes = appt.lawyer.reminder_minutes_before || 20;

            // Construir fecha completa
            const dateTimeString = `${appt.date} ${appt.time}`;
            const apptTime = new Date(dateTimeString);

            if (isNaN(apptTime.getTime())) continue;

            const diffMs = apptTime.getTime() - now.getTime();
            const diffMins = Math.round(diffMs / 60000);

            // Ventana de Tiempo [Preferencia - 5, Preferencia + 5]
            if (diffMins >= (reminderMinutes - 5) && diffMins <= (reminderMinutes + 5)) {

                // --- EMAIL TEMPLATE ---
                const htmlContent = `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f8fafc;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                        
                        <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                            ${logoUrl
                        ? `<img src="${logoUrl}" alt="${companyName}" style="max-height: 50px;" />`
                        : `<h2 style="color: #d4af37; margin: 0;">${companyName}</h2>`
                    }
                        </div>

                        <div style="padding: 30px;">
                            <h2 style="color: #0f172a; margin-top: 0;">Recordatorio de Consulta</h2>
                            <p style="color: #64748b;">Hola <strong>${appt.lawyer.name}</strong>,</p>
                            <p style="color: #334155;">Tu próxima cita comienza en aproximadamente <strong>${diffMins} minutos</strong>.</p>

                            <div style="background-color: #f1f5f9; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">CÓDIGO DE CITA</p>
                                <p style="margin: 5px 0 0 0; font-size: 24px; font-family: monospace; font-weight: bold; color: #0f172a;">
                                    ${appt.appointment_code || '---'}
                                </p>
                            </div>

                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Cliente:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #0f172a; text-align: right;">${appt.client_name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Hora:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #0f172a; text-align: right;">${formatTime(appt.time)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Tema:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #0f172a; text-align: right;">${appt.reason}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Modalidad:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #0f172a; text-align: right;">${appt.meeting_type === 'whatsapp' ? 'WhatsApp' : 'Google Meet'}</td>
                                </tr>
                            </table>

                            <div style="text-align: center; margin-top: 30px;">
                                <a href="https://tuabogadoenrd.com/admin" style="background-color: #0f172a; color: #d4af37; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ir al Panel</a>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                `;

                // Agregar a la cola de envíos
                emailsToSend.push({
                    from: "TuAbogadoEnRD <citas@tuabogadoenrd.com>",
                    to: [appt.lawyer.email], // <--- ENVÍO AL EMAIL DEL ABOGADO
                    subject: `🔔 Recordatorio: ${diffMins} min para cita con ${appt.client_name}`,
                    html: htmlContent
                });
                sentIds.push(appt.id);
            }
        }

        // 4. Enviar Correos y Actualizar DB
        if (emailsToSend.length > 0) {
            // Enviar en bucle (seguro para plan gratuito)
            for (const email of emailsToSend) {
                await resend.emails.send(email);
            }

            // Marcar como enviados
            const { error: updateError } = await supabase
                .from("appointments")
                .update({ reminder_sent: true })
                .in("id", sentIds);

            if (updateError) console.error("Error actualizando status:", updateError);

            console.log(`Enviados ${sentIds.length} correos.`);
        } else {
            console.log("No se encontraron citas en la ventana de tiempo.");
        }

        return new Response(JSON.stringify({ success: true, processed: sentIds.length }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Critical Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});