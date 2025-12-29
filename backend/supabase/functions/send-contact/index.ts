//import { serve } from "std/http/server.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// RECUPERAR VARIABLES DE ENTORNO
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_LINK = Deno.env.get("RESEND_LINK") || "https://api.resend.com";

const getEmailTemplate = (name: string, email: string, message: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Mensaje de Contacto</title>
  <style>
    /* Reset */
    body { margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Inter', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    
    .wrapper { width: 100%; table-layout: fixed; background-color: #f0f4f8; padding-bottom: 60px; }
    .main-table { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); }
    
    .top-accent { height: 6px; background: linear-gradient(90deg, #d4af37 0%, #0a192f 100%); width: 100%; }
    .header { padding: 40px 40px 20px 40px; text-align: center; }
    
    /* Logo Navy 900 */
    .logo { color: #0a192f; font-size: 26px; font-family: 'Playfair Display', serif; font-weight: 700; text-decoration: none; letter-spacing: -0.5px; }
    
    .content { padding: 20px 48px 48px 48px; color: #233554; text-align: left; }
    
    /* Headings */
    h2 { color: #0a192f; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 24px; font-family: 'Playfair Display', serif; text-align: center; }
    
    /* Field Cards using Palette */
    .field-card { background-color: #f0f4f8; border-radius: 8px; padding: 16px; margin-bottom: 16px; border-left: 4px solid #d4af37; /* Gold 400 */ }
    
    .label { color: #233554; /* Navy 700 */ font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; display: block; }
    
    .value { color: #0a192f; /* Navy 900 */ font-size: 16px; font-weight: 500; line-height: 1.5; display: block; }
    
    /* Footer */
    .footer { background-color: #f0f4f8; padding: 24px; text-align: center; font-size: 12px; color: #233554; border-top: 1px solid #e2e8f0; }
    
    @media only screen and (max-width: 600px) {
      .content { padding: 20px 24px 40px 24px; }
      .header { padding: 30px 20px 10px 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td class="top-accent"></td>
      </tr>
      
      <tr>
        <td class="header">
          <a href="#" class="logo">
            TuAbogadoEnRD<span style="color:#0a192f">.</span>
          </a>
        </td>
      </tr>
      
      <tr>
        <td class="content">
          <h2>Nuevo Mensaje de Contacto</h2>
          
          <div class="field-card">
            <span class="label">Nombre del Cliente</span>
            <span class="value">${name}</span>
          </div>
          
          <div class="field-card">
            <span class="label">Correo Electrónico</span>
            <span class="value">${email}</span>
          </div>
          
          <div class="field-card">
            <span class="label">Mensaje</span>
            <span class="value" style="white-space: pre-wrap;">${message}</span>
          </div>
        </td>
      </tr>
      
      <tr>
        <td class="footer">
          <p style="margin: 0;">
            Este mensaje fue enviado desde el formulario de contacto web.<br>
            &copy; ${new Date().getFullYear()} TuAbogadoEnRD
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Faltan campos requeridos" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // USANDO RESEND_LINK
    const res = await fetch(`${RESEND_LINK}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TuAbogadoEnRD <info@tuabogadoenrd.com>", // Cambia esto a info@tuabogadoenrd.com cuando valides el dominio
        to: ["admin@tuabogadoenrd.com"],
        subject: `Nuevo Mensaje: ${name}`,
        html: getEmailTemplate(name, email, message),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Error sending email');
    }

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