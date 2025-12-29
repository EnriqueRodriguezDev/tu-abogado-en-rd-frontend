//import { serve } from "std/http/server.ts";
//import { createClient } from "@supabase/supabase-js";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// RECUPERAR VARIABLES DE ENTORNO
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_LINK = Deno.env.get("RESEND_LINK") || "https://api.resend.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PROJECT_URL = Deno.env.get("PROJECT_URL") || "https://tuabogadoenrd.com";

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const getWelcomeTemplate = (email: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a TuAbogadoEnRD</title>
  <style>
    /* Reset & Base */
    body { margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Inter', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    
    /* Container */
    .wrapper { width: 100%; table-layout: fixed; background-color: #f0f4f8; padding-bottom: 60px; }
    .main-table { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); }
    
    /* Elements */
    /* Gradiente usando Gold 400 y Navy 900 */
    .top-accent { height: 6px; background: linear-gradient(90deg, #d4af37 0%, #0a192f 100%); width: 100%; }
    .header { padding: 40px 40px 20px 40px; text-align: center; }
    
    /* LOGO: Navy 900 */
    .logo { color: #0a192f; font-size: 26px; font-family: 'Playfair Display', serif; font-weight: 700; text-decoration: none; letter-spacing: -0.5px; }
    
    .content { padding: 20px 48px 48px 48px; color: #233554; text-align: left; }
    
    /* Typography */
    h1 { color: #0a192f; font-size: 24px; font-weight: 700; margin-bottom: 24px; font-family: 'Playfair Display', serif; line-height: 1.3; text-align: center; }
    p { font-size: 16px; line-height: 1.7; margin-bottom: 24px; color: #233554; }
    
    /* Button Styles */
    .btn-container { text-align: center; margin-top: 32px; margin-bottom: 10px; }
    
    .btn { 
      background-color: #0a192f; /* Navy 900 */
      color: #ffffff; /* Blanco */
      padding: 14px 32px; 
      border-radius: 50px; 
      text-decoration: none; 
      font-weight: 600; 
      font-size: 15px; 
      display: inline-block; 
      box-shadow: 0 4px 6px rgba(10, 25, 47, 0.2); 
      transition: all 0.3s ease; 
      border: 1px solid #0a192f; 
    }
    
    /* Hover Simulation (Note: Email clients support varies for hover) */
    .btn:hover { 
      background-color: #112240 !important; /* Navy 800 */
      color: #d4af37 !important; /* Gold 400 */
      border-color: #d4af37 !important;
      box-shadow: 0 6px 8px rgba(10, 25, 47, 0.3);
    }
    
    /* Footer & Icons */
    .footer { background-color: #f0f4f8; padding: 32px; text-align: center; font-size: 12px; color: #233554; }
    .social-links { margin-bottom: 24px; }
    .social-icon { width: 36px; height: 36px; margin: 0 10px; border: none; outline: none; text-decoration: none; display: inline-block; transition: opacity 0.3s; }
    .social-icon:hover { opacity: 0.7; }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .content { padding: 20px 24px 40px 24px; }
      .header { padding: 30px 20px 10px 20px; }
      h1 { font-size: 22px; }
      .btn { display: block; width: 100%; box-sizing: border-box; }
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
          <a href="${PROJECT_URL}" class="logo">
            TuAbogadoEnRD<span style="color:#0a192f">.</span>
          </a>
        </td>
      </tr>
      
      <tr>
        <td class="content">
          <h1>Bienvenido a nuestra comunidad</h1>
          
          <p>Hola,</p>
          
          <p>
            Gracias por unirte a <strong>TuAbogadoEnRD</strong>. Es un placer tenerte con nosotros.
            A partir de hoy, recibirás información jurídica clara, relevante y pensada para proteger tus intereses en República Dominicana.
          </p>
          
          <p>
            Nuestro compromiso es mantenerte al día con consejos prácticos y novedades legales, explicados con la excelencia y cercanía que nos caracteriza.
          </p>
          
          <div class="btn-container">
            <a href="${PROJECT_URL}/blog" class="btn">Leer Artículos Recientes</a>
          </div>
        </td>
      </tr>
      
      <tr>
        <td class="footer">
          <div class="social-links">
            <a href="https://instagram.com" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" class="social-icon" /></a>
            <a href="https://facebook.com" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" class="social-icon" /></a>
            <a href="https://linkedin.com" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="LinkedIn" class="social-icon" /></a>
          </div>
          
          <p style="margin: 0;">
            © ${new Date().getFullYear()} TuAbogadoEnRD. Todos los derechos reservados.<br>
            Estás recibiendo este correo porque te suscribiste en nuestro sitio web.
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
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

    // 3. Send Email (USANDO RESEND_LINK)
    const res = await fetch(`${RESEND_LINK}/emails`, {
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
      // No fallamos la petición completa si solo falló el email, pero lo registramos
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