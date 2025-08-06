import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('gemini');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoBase64, challengeTitle, challengeDescription } = await req.json();

    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not configured');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!videoBase64 || !challengeTitle) {
      return new Response(
        JSON.stringify({ error: 'Video data and challenge title required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are an AI video verification system. Analyze this video and determine if it shows someone genuinely performing the challenge: "${challengeTitle}".

Challenge Description: ${challengeDescription}

Please analyze the video for:
1. Is the person actually performing the described challenge activity?
2. Does the video show genuine effort and movement related to the challenge?
3. Is this a real attempt or a fake/mock video?
4. Are they following the challenge requirements properly?

Respond with a JSON object containing:
{
  "isValid": boolean,
  "confidence": number (0-100),
  "reason": "detailed explanation of why the video is valid/invalid",
  "suggestions": "feedback for improvement if needed"
}

Be strict but fair in your assessment. The video should clearly show the person performing the challenge activity.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                },
                {
                  inline_data: {
                    mime_type: "video/mp4",
                    data: videoBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status}`);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    // Parse the JSON response
    let verification;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verification = JSON.parse(jsonMatch[0]);
      } else {
        verification = {
          isValid: false,
          confidence: 0,
          reason: "Unable to analyze video properly",
          suggestions: "Please try recording a clearer video showing the challenge activity"
        };
      }
    } catch (parseError) {
      verification = {
        isValid: false,
        confidence: 0,
        reason: "Unable to analyze video properly",
        suggestions: "Please try recording a clearer video showing the challenge activity"
      };
    }

    return new Response(
      JSON.stringify({ verification }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-challenge-video function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to verify challenge video',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});