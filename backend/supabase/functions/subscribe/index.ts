import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PROJECT_URL = Deno.env.get("PROJECT_URL") || "https://tuabogadoenrd.com";

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const getWelcomeTemplate = (email: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0d1b2a; color: #ffffff; }
    .header { padding: 40px 20px; text-align: center; border-bottom: 1px solid #1a2c3d; }
    .logo { color: #d4af37; font-size: 28px; font-family: serif; font-weight: bold; letter-spacing: 1px; text-decoration: none; }
    .content { padding: 50px 30px; line-height: 1.8; text-align: center; }
    .welcome-title { font-size: 24px; color: #d4af37; margin-bottom: 20px; font-family: serif; }
    .text { color: #e0e0e0; font-size: 16px; margin-bottom: 30px; }
    .btn { background-color: #d4af37; color: #0d1b2a; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; transition: background 0.3s; }
    .btn:hover { background-color: #b5952f; }
    .footer { padding: 30px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #1a2c3d; }
    .social-link { color: #d4af37; margin: 0 10px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${PROJECT_URL}" class="logo">TuAbogadoEnRD</a>
    </div>
    
    <div class="content">
      <h1 class="welcome-title">Bienvenido a nuestra comunidad legal</h1>
      <p class="text">
        Gracias por suscribirte a nuestro boletín. A partir de ahora recibirás actualizaciones exclusivas, 
        consejos legales prácticos y noticias relevantes sobre el mundo jurídico en República Dominicana.
      </p>
      <p class="text">
        Nos comprometemos a proteger tus intereses y mantenerte informado con la excelencia que nos caracteriza.
      </p>
      
      <div style="margin-top: 40px;">
        <a href="${PROJECT_URL}/blog" class="btn">Explorar Artículos Recientes</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Estás recibiendo este correo porque te suscribiste en TuAbogadoEnRD.com</p>
      <div style="margin: 20px 0;">
        <a href="#" class="social-link">Instagram</a>
        <a href="#" class="social-link">Facebook</a>
        <a href="#" class="social-link">LinkedIn</a>
      </div>
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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400, headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    // 1. Check if exists
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ message: "Already subscribed" }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    // 2. Insert
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert([{ email }]);

    if (insertError) throw insertError;

    // 3. Send Email
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TuAbogadoEnRD <info@tuabogadoenrd.com>",
        to: [email],
        subject: "Bienvenido a TuAbogadoEnRD - Confirmación de Suscripción",
        html: getWelcomeTemplate(email),
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Resend Error:", errorData);
      // Don't fail the request if email fails, but log it
    }

    return new Response(JSON.stringify({ message: "Subscribed successfully" }), {
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
