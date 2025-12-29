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

// Validación de seguridad
if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltan variables de entorno críticas en el servidor.");
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const getNewsletterTemplate = (title: string, content: string, imageUrl: string | null, slug: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* Reset & Base using Navy 50 (#f0f4f8) */
    body { margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Inter', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    
    .wrapper { width: 100%; table-layout: fixed; background-color: #f0f4f8; padding-bottom: 60px; }
    .main-table { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); }
    
    /* Elements */
    .top-accent { height: 6px; background: linear-gradient(90deg, #d4af37 0%, #0a192f 100%); width: 100%; }
    .header { padding: 40px 40px 20px 40px; text-align: center; }
    
    /* Logo Navy 900 */
    .logo { color: #0a192f; font-size: 26px; font-family: 'Playfair Display', serif; font-weight: 700; text-decoration: none; letter-spacing: -0.5px; }
    
    .content { padding: 0 48px 48px 48px; color: #233554; text-align: left; }
    
    /* Hero Image */
    .hero-container { margin-bottom: 32px; text-align: center; }
    .hero { width: 100%; max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: block; }
    
    /* Typography */
    .post-title { color: #0a192f; font-size: 24px; font-weight: 700; margin-bottom: 16px; font-family: 'Playfair Display', serif; line-height: 1.3; }
    p { font-size: 16px; line-height: 1.7; margin-bottom: 24px; color: #233554; }
    
    /* Button: Bg Navy 900, Text White -> Hover: Bg Navy 800, Text Gold */
    .btn-container { text-align: center; margin-top: 32px; margin-bottom: 10px; }
    .btn { 
      background-color: #0a192f; 
      color: #ffffff; 
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
    .btn:hover { 
      background-color: #112240 !important; 
      color: #d4af37 !important; 
      border-color: #d4af37 !important;
    }
    
    /* Footer */
    .footer { background-color: #f0f4f8; padding: 32px; text-align: center; font-size: 12px; color: #233554; border-top: 1px solid #e2e8f0; }
    .footer a { color: #233554; text-decoration: none; margin: 0 5px; font-weight: 600; }
    
    .social-links { margin-bottom: 24px; }
    .social-icon { width: 36px; height: 36px; margin: 0 10px; border: none; outline: none; text-decoration: none; display: inline-block; transition: opacity 0.3s; }
    
    @media only screen and (max-width: 600px) {
      .content { padding: 0 24px 40px 24px; }
      .header { padding: 30px 20px 10px 20px; }
      .post-title { font-size: 22px; }
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
          ${imageUrl ? `<div class="hero-container"><img src="${imageUrl}" alt="${title}" class="hero" /></div>` : ''}
          
          <div class="post-title">${title}</div>
          <p>${content.substring(0, 300)}...</p>
          
          <div class="btn-container">
            <a href="${PROJECT_URL}/blog/${slug}" class="btn">Leer Artículo Completo</a>
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
          
          <p style="margin-bottom: 15px;">
            Estás recibiendo este correo porque te suscribiste a nuestro boletín.
          </p>
          <p style="margin-bottom: 15px;">
            <a href="${PROJECT_URL}">Sitio Web</a> • 
            <a href="${PROJECT_URL}/contacto">Contacto</a> • 
            <a href="#">Darse de baja</a>
          </p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} TuAbogadoEnRD. Todos los derechos reservados.</p>
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
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const { postId } = await req.json();

    if (!postId) {
      throw new Error("Missing postId");
    }

    // 1. Fetch Post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    // 2. Fetch Subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('subscriptions')
      .select('email')
      .eq('is_active', true);

    if (subError) throw subError;

    const emails = subscribers.map(s => s.email);

    if (emails.length === 0) {
      return new Response(JSON.stringify({ message: "No subscribers found" }), {
        status: 200, headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    // 3. Prepare Batch
    const batchData = emails.map(email => ({
      from: "TuAbogadoEnRD <info@tuabogadoenrd.com>",
      to: [email],
      subject: `Nuevo Artículo: ${post.title}`,
      html: getNewsletterTemplate(post.title, post.content, post.image_url, post.slug),
    }));

    // 4. Send Batch (USANDO RESEND_LINK y agregando /emails/batch)
    const res = await fetch(`${RESEND_LINK}/emails/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(batchData),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend Error:', data);
      throw new Error(data.message || 'Error sending batch emails');
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