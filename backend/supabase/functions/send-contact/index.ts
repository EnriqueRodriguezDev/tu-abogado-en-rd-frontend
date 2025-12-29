import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const getEmailTemplate = (name: string, email: string, message: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0d1b2a; padding: 20px; text-align: center; }
    .header h1 { color: #d4af37; margin: 0; font-size: 24px; font-family: serif; }
    .content { padding: 40px 20px; color: #333333; line-height: 1.6; }
    .field { margin-bottom: 20px; }
    .label { font-weight: bold; color: #0d1b2a; font-size: 14px; text-transform: uppercase; }
    .value { background: #f8f9fa; padding: 10px; border-left: 3px solid #d4af37; margin-top: 5px; }
    .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TuAbogadoEnRD</h1>
    </div>
    <div class="content">
      <h2 style="color: #0d1b2a; margin-top: 0;">Nuevo Mensaje de Contacto</h2>
      
      <div class="field">
        <div class="label">Nombre</div>
        <div class="value">${name}</div>
      </div>
      
      <div class="field">
        <div class="label">Correo Electrónico</div>
        <div class="value">${email}</div>
      </div>
      
      <div class="field">
        <div class="label">Mensaje</div>
        <div class="value">${message}</div>
      </div>
    </div>
    <div class="footer">
      <p>Este mensaje fue enviado desde el formulario de contacto de TuAbogadoEnRD.com</p>
      <p>&copy; ${new Date().getFullYear()} TuAbogadoEnRD. Todos los derechos reservados.</p>
    </div>
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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TuAbogadoEnRD <onboarding@resend.dev>",
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
