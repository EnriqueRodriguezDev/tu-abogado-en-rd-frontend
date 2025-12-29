import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PROJECT_URL = Deno.env.get("PROJECT_URL") || "https://tuabogadoenrd.com";

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const getNewsletterTemplate = (title: string, content: string, imageUrl: string | null, slug: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0d1b2a; padding: 25px; text-align: center; }
    .header h1 { color: #d4af37; margin: 0; font-size: 24px; font-family: serif; letter-spacing: 1px; }
    .hero { width: 100%; height: auto; display: block; background-color: #ddd; }
    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
    .title { color: #0d1b2a; font-size: 24px; font-weight: bold; margin-bottom: 15px; font-family: serif; }
    .btn-container { text-align: center; margin-top: 30px; }
    .btn { background-color: #d4af37; color: #0d1b2a; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; }
    .footer { background-color: #0d1b2a; padding: 30px; text-align: center; font-size: 12px; color: #aaaaaa; }
    .footer a { color: #d4af37; text-decoration: none; margin: 0 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TuAbogadoEnRD</h1>
    </div>
    
    ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="hero" />` : ''}
    
    <div class="content">
      <div class="title">${title}</div>
      <p>${content.substring(0, 300)}...</p>
      
      <div class="btn-container">
        <a href="${PROJECT_URL}/blog/${slug}" class="btn">Leer Artículo Completo</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Estás recibiendo este correo porque te suscribiste a nuestro boletín.</p>
      <p>
        <a href="${PROJECT_URL}">Sitio Web</a> | 
        <a href="${PROJECT_URL}/contacto">Contacto</a> | 
        <a href="#">Darse de baja</a>
      </p>
      <p>&copy; ${new Date().getFullYear()} TuAbogadoEnRD. Todos los derechos reservados.</p>
    </div>
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

    // 4. Send (Chunking logic assumed not needed for small scale, but Resend limits 100/batch)
    // NOTE: For MVP we send 1 batch. In prod, implementation needs to chunk 'batchData' into arrays of 100.
    const res = await fetch("https://api.resend.com/emails/batch", {
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
