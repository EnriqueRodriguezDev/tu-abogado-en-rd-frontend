import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_LINK = Deno.env.get("RESEND_LINK") || "https://api.resend.com";

const getEmailTemplate = (appointment: any, payment: any) => {
  const isTransfer = payment.method === 'transfer';
  const isConfirmed = appointment.status === 'confirmed';
  
  const title = isConfirmed ? '¡Cita Confirmada!' : 'Confirmación de Solicitud de Cita';
  const message = isConfirmed 
    ? 'Su cita ha sido confirmada exitosamente. A continuación encontrará los detalles.'
    : 'Hemos recibido su solicitud de cita. Su pago vía transferencia está en proceso de validación. Una vez confirmado, recibirá un correo definitivo.';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Inter', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f0f4f8; padding-bottom: 60px; }
    .main-table { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .top-accent { height: 6px; background: linear-gradient(90deg, #d4af37 0%, #0a192f 100%); width: 100%; }
    .header { padding: 40px; text-align: center; }
    .logo { color: #0a192f; font-size: 26px; font-family: 'Playfair Display', serif; font-weight: 700; text-decoration: none; }
    .content { padding: 0 48px 48px 48px; color: #233554; }
    h2 { color: #0a192f; font-size: 24px; font-weight: 700; margin-bottom: 16px; font-family: 'Playfair Display', serif; text-align: center; }
    p { font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center; }
    .details-box { background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    .detail-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .label { font-weight: 600; color: #64748b; font-size: 14px; }
    .value { font-weight: 500; color: #0f172a; font-size: 14px; text-align: right; }
    .footer { background-color: #f0f4f8; padding: 24px; text-align: center; font-size: 12px; color: #64748b; }
    .status-badge { display: inline-block; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 20px; background-color: ${isConfirmed ? '#dcfce7' : '#fef9c3'}; color: ${isConfirmed ? '#166534' : '#854d0e'}; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" border="0" cellpadding="0" cellspacing="0">
      <tr><td class="top-accent"></td></tr>
      <tr><td class="header"><a href="#" class="logo">TuAbogadoEnRD<span style="color:#0a192f">.</span></a></td></tr>
      <tr>
        <td class="content">
          <div style="text-align: center;"><span class="status-badge">${isConfirmed ? 'Confirmada' : 'Pendiente de Validación'}</span></div>
          <h2>${title}</h2>
          <p>${message}</p>
          
          <div class="details-box">
            <div class="detail-row"><span class="label">Cliente</span><span class="value">${appointment.client_name}</span></div>
            <div class="detail-row"><span class="label">Fecha</span><span class="value">${appointment.date}</span></div>
            <div class="detail-row"><span class="label">Hora</span><span class="value">${appointment.time}</span></div>
            <div class="detail-row"><span class="label">Duración</span><span class="value">${appointment.duration_minutes} min</span></div>
            <div class="detail-row"><span class="label">Tipo</span><span class="value">${appointment.meeting_type === 'whatsapp' ? 'Vía WhatsApp' : 'Google Meet'}</span></div>
          </div>

          <div class="details-box" style="background-color: #fffbeb; border-color: #fcd34d;">
            <div class="detail-row"><span class="label">Total Pagado</span><span class="value">$${payment.amount} ${payment.currency}</span></div>
            <div class="detail-row"><span class="label">Método</span><span class="value">${payment.method === 'paypal' ? 'PayPal' : 'Transferencia Bancaria'}</span></div>
             ${isTransfer ? '<div class="detail-row" style="margin-top:8px; border-top:1px solid #e2e8f0; padding-top:8px;"><span class="value" style="text-align:left; font-size:12px;">El comprobante ha sido recibido y será validado en breves momentos.</span></div>' : ''}
          </div>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p style="margin: 0;">Gracias por confiar en nuestros servicios legales.<br>&copy; ${new Date().getFullYear()} TuAbogadoEnRD</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    const { appointment, payment } = await req.json();

    if (!appointment || !payment) {
      throw new Error("Missing appointment or payment data");
    }

    const res = await fetch(`${RESEND_LINK}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TuAbogadoEnRD <info@tuabogadoenrd.com>",
        to: [appointment.client_email, "admin@tuabogadoenrd.com"],
        subject: `Confirmación de Cita - ${appointment.date}`,
        html: getEmailTemplate(appointment, payment),
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error sending email');

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
