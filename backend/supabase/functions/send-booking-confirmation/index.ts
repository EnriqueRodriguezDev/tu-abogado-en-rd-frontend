import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// const RESEND_LINK = Deno.env.get("RESEND_LINK"); // Not strictly needed if using standard API, but user had it.

interface Appointment {
    client_name: string;
    client_email: string;
    date: string;
    time: string;
    duration_minutes: number;
    meeting_type: 'whatsapp' | 'meet';
    status: string;
    appointment_code?: string;
}

interface Payment {
    method: 'paypal' | 'transfer' | 'azul' | 'cardnet';
    amount: number;
    currency: string;
    ncf_number?: string;
}

const getEmailTemplate = (appointment: Appointment, payment: Payment) => {
    const isConfirmed = appointment.status === 'confirmed';
    const RNC_EMISOR = "131866671"; // Example RNC - Ideally from DB but hardcoded for template
    const COMPANY_NAME = "TuAbogadoEnRD";

    // Date Formatting
    const dateObj = new Date(appointment.date);
    const formattedDate = dateObj.toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' });

    // Calculations
    // Assuming amount is total inclusive. 
    // If ITBIS is 18%, Base = Total / 1.18
    const itbisRate = 0.18;
    const total = payment.amount;
    const subtotal = total / (1 + itbisRate);
    const itbis = total - subtotal;

    const meetingLink = appointment.meeting_type === 'whatsapp'
        ? '#'
        : 'https://meet.google.com/new'; // Placeholder or actual link logic

    const statusColor = isConfirmed ? '#10b981' : '#f59e0b';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprobante de Pago</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937;">
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        
        <!-- Header -->
        <div style="background-color: #1e293b; padding: 40px 40px 20px 40px; text-align: center;">
            <div style="color: #fbbf24; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px;">${COMPANY_NAME}</div>
            <div style="color: #94a3b8; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Servicios Legales Premium</div>
        </div>

        <!-- Receipt Header -->
        <div style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <div style="display: inline-block; background-color: ${isConfirmed ? '#d1fae5' : '#fef3c7'}; color: ${isConfirmed ? '#065f46' : '#92400e'}; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 99px; margin-bottom: 16px;">
                ${isConfirmed ? 'PAGO COMPLETADO' : 'PAGO PENDIENTE'}
            </div>
            ${appointment.appointment_code ? `<div style="color: #6b7280; font-size: 14px; font-weight: 600; margin-bottom: 4px;">CODIGO DE CITA</div><div style="color: #111827; font-size: 20px; font-weight: 800; letter-spacing: 2px; margin-bottom: 16px;">${appointment.appointment_code}</div>` : ''}
            <h1 style="color: #111827; font-size: 28px; font-weight: 700; margin: 0; margin-bottom: 8px;">${payment.amount.toFixed(2)} USD</h1>
            <p style="color: #6b7280; font-size: 16px; margin: 0;">Total Pagado</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px;">
            
            <!-- Metadata Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
                <div>
                    <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;">Fecha de Emisión</div>
                    <div style="color: #111827; font-weight: 600;">${formattedDate}</div>
                </div>
                <div style="text-align: right;">
                    <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;">Método de Pago</div>
                    <div style="color: #111827; font-weight: 600; text-transform: capitalize;">${payment.method}</div>
                </div>
                ${payment.ncf_number ? `
                <div style="grid-column: span 2; background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px dashed #cbd5e1; margin-top: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #64748b; font-size: 12px; font-weight: 600;">NCF (Comprobante Fiscal)</span>
                        <span style="color: #1e293b; font-family: monospace; font-weight: 700; font-size: 14px;">${payment.ncf_number}</span>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Invoice Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                <thead>
                    <tr style="border-bottom: 2px solid #f3f4f6;">
                        <th style="padding: 12px 0; text-align: left; color: #4b5563; font-size: 12px; text-transform: uppercase;">Descripción</th>
                        <th style="padding: 12px 0; text-align: right; color: #4b5563; font-size: 12px; text-transform: uppercase;">Monto</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #f3f4f6;">
                        <td style="padding: 16px 0;">
                            <div style="color: #111827; font-weight: 600;">Consulta Legal</div>
                            <div style="color: #6b7280; font-size: 14px;">Asesoría ${appointment.meeting_type === 'whatsapp' ? 'WhatsApp' : 'Google Meet'} (${appointment.duration_minutes} min)</div>
                        </td>
                        <td style="padding: 16px 0; text-align: right; color: #111827; font-weight: 600;">
                            ${total.toFixed(2)}
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                     <tr>
                        <td style="padding-top: 16px; color: #6b7280; text-align: right;">Subtotal</td>
                        <td style="padding-top: 16px; text-align: right; color: #374151;">${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding-top: 8px; color: #6b7280; text-align: right;">ITBIS (18%)</td>
                        <td style="padding-top: 8px; text-align: right; color: #374151;">${itbis.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding-top: 16px; color: #111827; font-weight: 700; text-align: right;">Suma Total</td>
                        <td style="padding-top: 16px; text-align: right; color: #111827; font-weight: 700; font-size: 18px;">${total.toFixed(2)} USD</td>
                    </tr>
                </tfoot>
            </table>

            <!-- Actions -->
            <div style="text-align: center; margin-top: 40px;">
                <a href="https://tuabogadoenrd.com/admin" style="display: inline-block; background-color: #1e293b; color: #ffffff; padding: 14px 32px; font-weight: 600; text-decoration: none; border-radius: 8px; transition: background-color 0.2s;">
                    Descargar PDF Original
                </a>
                <p style="margin-top: 16px; color: #9ca3af; font-size: 13px;">
                    ¿Dudas? Responde a este correo o contáctanos por WhatsApp.
                </p>
            </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este correo es un comprobante de pago generado automáticamente.<br>
                ${COMPANY_NAME} &bull; RNC ${RNC_EMISOR}<br>
                Santo Domingo, República Dominicana
            </p>
        </div>
    </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
    const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
    if (req.method === "OPTIONS") return new Response("ok", { headers });

    try {
        const { appointment, payment } = await req.json();
        if (!appointment || !payment) throw new Error("Missing data [appointment, payment]");

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
                from: "TuAbogadoEnRD <info@tuabogadoenrd.com>",
                to: [appointment.client_email],
                subject: `Confirmación de Cita - ${payment.ncf_number ? `NCF: ${payment.ncf_number}` : 'Pendiente'}`,
                html: getEmailTemplate(appointment, payment),
            }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error sending email');

        return new Response(JSON.stringify(data), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...headers, "Content-Type": "application/json" } });
    }
};

serve(handler);
