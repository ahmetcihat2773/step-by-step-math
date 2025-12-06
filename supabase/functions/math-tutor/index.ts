import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Sen bir matematik öğretmenisin. Öğrencilere adım adım problem çözmeyi öğretiyorsun.

KURALLAR:
1. ASLA doğrudan cevabı verme
2. Her zaman sadece bir sonraki adımı sor veya açıkla
3. Öğrenci yanlış cevap verirse, nazikçe düzelt ve doğru yola yönlendir
4. Öğrenci "next step", "sonraki adım" veya benzeri bir şey yazarsa, o adımın çözümünü açıkla ve sonraki adımı sor
5. Öğrenci bilemedim veya yardım isterse, ipucu ver ama cevabı verme
6. Matematiksel ifadeleri düzgün yaz (x^2 gibi)
7. Teşvik edici ve destekleyici ol
8. Türkçe konuş

ÖRNEK DİYALOG:
Eğer problem x³ + x = 2 ise:
- İlk mesaj: "Problem: x³ + x = 2. Bu denklemi çözmek için ilk olarak ne yapmamız gerektiğini düşünüyorsun?"
- Öğrenci doğru cevap verirse: "Harika! Şimdi bir sonraki adımda ne yapmalıyız?"
- Öğrenci yanlış cevap verirse: "Hmm, bu yaklaşım doğru değil. Şöyle düşünelim: [ipucu]"
- Öğrenci "bilemedim" derse: "Sorun değil! İpucu: [ipucu vermek ama cevabı vermemek]"`;

interface ChatMessage {
  role: string;
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const apiMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // If there's an image, add it as the first user message with vision
    if (imageBase64 && messages.length === 0) {
      apiMessages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: "Bu resimdeki matematik problemini analiz et ve öğrenciye adım adım çözmeyi öğretmeye başla. İlk olarak problemi açıkla ve ilk adım için ne yapması gerektiğini sor."
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64
            }
          }
        ]
      });
    } else if (imageBase64) {
      // Image with existing conversation
      apiMessages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: "Bu resimdeki matematik problemini analiz et ve öğrenciye adım adım çözmeyi öğretmeye başla."
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64
            }
          }
        ]
      });
      
      // Add rest of the conversation
      for (const msg of messages) {
        apiMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    } else {
      // No image, just conversation
      for (const msg of messages) {
        apiMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    console.log("Sending request to AI with messages:", JSON.stringify(apiMessages, null, 2));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Math tutor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
