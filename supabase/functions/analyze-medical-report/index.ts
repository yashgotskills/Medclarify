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
    const { text, language = 'en', isChat = false } = await req.json();

    // If this is a chat request, redirect to gemini-chat function
    if (isChat) {
      return new Response(
        JSON.stringify({ error: 'Please use gemini-chat function for chat messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are a medical AI assistant specializing in analyzing medical reports. Please analyze the following medical report text and provide:

1. A comprehensive summary in ${language === 'hi' ? 'Hindi' : 'English'} that a patient can understand
2. Key health metrics extracted with their values and normal ranges
3. Any concerning findings that need attention
4. Simple lifestyle recommendations based on the results
5. Suggestions for follow-up care if needed

Important: 
- Use simple, non-medical language that patients can understand
- Highlight any critical values that need immediate attention
- Be encouraging and supportive in tone
- Include disclaimers about consulting healthcare providers
- If the text appears to be poorly written or has OCR errors, try to interpret it based on medical context

Medical Report Text:
${text}

Please provide your analysis in JSON format with the following structure:
{
  "summary": "Patient-friendly summary of the report",
  "keyFindings": [
    {
      "metric": "Test name",
      "value": "Result value",
      "normalRange": "Normal range",
      "status": "normal/low/high/critical",
      "explanation": "Simple explanation"
    }
  ],
  "concerns": ["List of any concerning findings"],
  "recommendations": ["Lifestyle and health recommendations"],
  "followUp": "Follow-up care suggestions",
  "disclaimer": "Medical disclaimer text"
}`;

    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not configured');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    // Try to parse the JSON response from Gemini
    let analysis;
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured response from raw text
        analysis = {
          summary: generatedText,
          keyFindings: [],
          concerns: [],
          recommendations: [],
          followUp: "Please consult with your healthcare provider for detailed interpretation.",
          disclaimer: "This analysis is for informational purposes only and should not replace professional medical advice."
        };
      }
    } catch (parseError) {
      // If JSON parsing fails, return the raw text in a structured format
      analysis = {
        summary: generatedText,
        keyFindings: [],
        concerns: [],
        recommendations: [],
        followUp: "Please consult with your healthcare provider for detailed interpretation.",
        disclaimer: "This analysis is for informational purposes only and should not replace professional medical advice."
      };
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-medical-report function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze medical report',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});