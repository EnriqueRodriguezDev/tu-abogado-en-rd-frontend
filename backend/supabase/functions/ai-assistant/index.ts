import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = Deno.env.get('GEMINI_API_URL');
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { mode, context, currentContent } = await req.json();

    if (!GEMINI_API_KEY || !GEMINI_API_URL || !GEMINI_MODEL) {
      throw new Error('Missing environment variables: GEMINI_API_KEY, GEMINI_API_URL, or GEMINI_MODEL');
    }

    let prompt = '';
    let systemInstruction = '';

    switch (mode) {
      case 'generate-blog-content':
        systemInstruction = "You are an expert legal copywriter for a law firm in Dominican Republic. ALWAYS RESPOND IN SPANISH. Write professional, informative, and engaging blog posts in HTML format (use <p>, <strong>, <ul>, <li>, <h3>). Do NOT include <html>, <head>, or <body> tags. Just the content.";
        prompt = `Write a blog post about: "${context}". Tone: Professional, authoritative, but accessible.`;
        break;

      case 'generate-image-prompt':
        systemInstruction = "You are an expert AI art prompter. Create detailed, photorealistic, cinematic prompts in English for image generation models.";
        prompt = `Create a prompt for an image representing: "${context}". The image should be suitable for a law firm's blog. Focus on lighting, composition, and mood. Return ONLY the prompt text, nothing else.`;
        break;

      case 'correct-text':
        systemInstruction = "You are an expert legal editor for a law firm. ALWAYS RESPOND IN SPANISH. Improve the grammar, flow, and professional tone of the provided text. Keep it concise.";
        prompt = `Improve this text: "${currentContent || context}".`;
        break;

      case 'generate-service-description':
        systemInstruction = "You are an expert legal copywriter. ALWAYS RESPOND IN SPANISH. Create a detailed, persuasive, and professional description of a legal service for a law firm website.";
        prompt = `Write a detailed service description for: "${context}". Length: approx 2 paragraphs. Tone: Professional, reassuring, and authoritative. Highlight benefits and expertise.`;
        break;

      case 'pick-icon':
        systemInstruction = "You are a UI designer. Select the best matching icon from this list: [Briefcase, Scale, Gavel, FileText, Shield, Users, Landmark, DollarSign]. Return ONLY the icon name.";
        prompt = `Select an icon for a service named: "${context}".`;
        break;

      case 'translate':
        systemInstruction = "You are a professional legal translator. You will receive a JSON object with Spanish content. You must return a JSON object with the exact same keys but with the values translated to English. Keep the tone professional and legal. Return ONLY the JSON object, no markdown formatting.";
        prompt = `Translate this JSON content to English:\n\n${JSON.stringify(context.content || context)}`;
        break;

      case 'translate-content':
        systemInstruction = "You are a professional legal translator. Detect the input language. If the input is in Spanish, translate it to English. If the input is in English, translate it to Spanish. Maintain the exact same HTML structure if present (preserve all tags like <p>, <strong>, <ul>, <li>, <h3>, etc.). Do not add markdown code blocks. Return ONLY the translated text. Tone: Professional and Legal.";
        prompt = `Translate this text (detect language first):\n\n${currentContent || context}`;
        break;

      case 'generate-service-slug':
        systemInstruction = "You are an expert SEO specialist. Generate a URL slug based on the provided text. Return ONLY the slug, lowercase, with hyphens.";
        prompt = `Generate a SEO-friendly URL slug in English based on this title: "${context}". Lowercase, hyphens only. Return ONLY the slug.`;
        break;

      default:
        throw new Error('Invalid mode');
    }

    const url = `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemInstruction + "\n\n" + prompt }]
        }],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
        ]
      })
    });

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      console.error('Gemini Error:', JSON.stringify(data));
      // Return the actual error or safety feedback if available
      const errorMsg = data.error?.message || (data.promptFeedback ? `Blocked: ${JSON.stringify(data.promptFeedback)}` : 'No candidates returned');
      throw new Error(errorMsg);
    }

    let resultText = data.candidates[0].content.parts[0].text.trim();

    // Cleanup for specific modes
    if (mode === 'pick-icon') {
      // Ensure only the icon name is returned, strip quotes or extra text
      const match = resultText.match(/(Briefcase|Scale|Gavel|FileText|Shield|Users|Landmark|DollarSign)/i);
      if (match) {
        // Normalize casing to match the list exactly (Title Case)
        const map: Record<string, string> = {
          'briefcase': 'Briefcase',
          'scale': 'Scale',
          'gavel': 'Gavel',
          'filetext': 'FileText',
          'shield': 'Shield',
          'users': 'Users',
          'landmark': 'Landmark',
          'dollarsign': 'DollarSign'
        };
        resultText = map[match[0].toLowerCase()] || 'Briefcase';
      } else {
        resultText = 'Briefcase'; // Fallback
      }
    } else if (mode === 'translate') {
      try {
        // Remove any markdown code block syntax if present
        const jsonStr = resultText.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        return new Response(JSON.stringify({ result: parsed }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        console.error("Failed to parse JSON translation", e);
        // Return raw text if parsing fails (fallback) or error
      }
    }

    return new Response(JSON.stringify({ result: resultText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
