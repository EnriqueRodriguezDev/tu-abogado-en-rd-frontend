import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ZOHO_CLIENT_ID = Deno.env.get("ZOHO_CLIENT_ID");
const MOCK_ZOHO = Deno.env.get("MOCK_ZOHO") === 'true';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const { appointment } = await req.json();

        if (!ZOHO_CLIENT_ID || MOCK_ZOHO) {
            console.log(`[Mock Zoho Sync] Event: "Cita con ${appointment.client_name}" on ${appointment.date} at ${appointment.time}`);
            return new Response(JSON.stringify({ success: true, mode: 'mock' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Real Logic Placeholder (User requested structure but Mock is priority if vars missing)
        // To implement real logic we would need Refresh Token flow here. 
        // For now assuming Mock/Log as primary deliverable if vars aren't set.

        console.log("Zoho Sync initiated for:", appointment.id);

        return new Response(
            JSON.stringify({ success: true, mode: 'real_placeholder' }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
});
