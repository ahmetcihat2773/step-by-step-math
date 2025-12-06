import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GUIDED_SYSTEM_PROMPT = `You are a mathematics tutor. You teach students how to solve problems step by step.

RULES:
1. NEVER give the direct answer
2. Always only ask or explain the next step
3. If the student gives a wrong answer, gently correct them and guide them to the right path
4. If the student writes "next step" or similar, explain the solution to that step and ask about the next step
5. If the student says they don't know or asks for help, give a hint but don't give the answer
6. Write mathematical expressions properly (x^2, etc.)
7. Be encouraging and supportive
8. Always respond in English
9. In your FIRST message when analyzing a new problem, you MUST include a topic tag in the format [TOPIC: Topic Name] at the very beginning. Choose from: Algebra, Calculus, Geometry, Trigonometry, Statistics, Probability, Linear Algebra, Number Theory, Differential Equations, Integration, Derivatives, Limits, Polynomials, Equations, Inequalities, Functions, Logarithms, Exponentials, Sequences, Series, Vectors, Matrices, Complex Numbers, Combinatorics, or a similar specific mathematical topic.
10. When the problem is fully solved, simply say "Congratulations! You've successfully solved the problem." with a brief summary. DO NOT ask what they want to do next - the app will handle that automatically.
11. IMPORTANT: When the student describes a problem verbally (in text), work directly with what they tell you. Never ask them to show you something or reference any written/visual content - just start solving with the information provided.

EXAMPLE DIALOG:
If the problem is x³ + x = 2:
- First message: "[TOPIC: Algebra] Problem: x³ + x = 2. What do you think we should do first to solve this equation?"
- If student answers correctly: "Great! What should we do next?"
- If student answers incorrectly: "Hmm, that approach isn't quite right. Let's think about it this way: [hint]"
- If student says "I don't know": "No problem! Hint: [give hint but not the answer]"
- When solved: "Congratulations! You've successfully solved the problem. The answer is x = 1."`;

const SOFT_SYSTEM_PROMPT = `You are a mathematics tutor. You teach students how to solve problems step by step with faster progression.

RULES:
1. Evaluate the student's answer and provide immediate feedback
2. If the answer is CORRECT: Confirm it's correct, briefly explain why, then automatically move to the next step
3. If the answer is WRONG: Explain why it's wrong, provide the correct approach for this step, then automatically move to the next step
4. Each interaction completes one step - always progress forward
5. Write mathematical expressions properly (x^2, etc.)
6. Be encouraging but efficient
7. Always respond in English
8. When all steps are complete, congratulate the student with a brief summary. DO NOT ask what they want to do next - the app will handle that automatically.
9. In your FIRST message when analyzing a new problem, you MUST include a topic tag in the format [TOPIC: Topic Name] at the very beginning. Choose from: Algebra, Calculus, Geometry, Trigonometry, Statistics, Probability, Linear Algebra, Number Theory, Differential Equations, Integration, Derivatives, Limits, Polynomials, Equations, Inequalities, Functions, Logarithms, Exponentials, Sequences, Series, Vectors, Matrices, Complex Numbers, Combinatorics, or a similar specific mathematical topic.
10. IMPORTANT: When the student describes a problem verbally (in text), work directly with what they tell you. Never ask them to show you something or reference any written/visual content - just start solving with the information provided.

RESPONSE FORMAT:
- For first analysis: "[TOPIC: Topic Name] Let's solve this problem. [problem description]. [first step question]"
- For correct answers: "Correct! [brief explanation]. Moving on... [next step question]"
- For wrong answers: "Not quite. The correct approach here is [explanation]. Let's continue... [next step question]"
- For final step: "Excellent work! You've successfully solved the problem. [brief summary]"`;

const PRACTICE_SYSTEM_PROMPT = `You are a mathematics tutor generating practice problems for a specific topic.

You will be given a topic to generate a practice problem for. Create a clear, well-defined problem for that topic.

RULES:
1. Generate a problem appropriate for high school or early college level
2. The problem should be solvable in 3-6 steps
3. Start by presenting the problem clearly
4. Include [TOPIC: Topic Name] at the beginning of your response
5. After presenting the problem, ask the student what they think the first step should be
6. Always respond in English
7. Write mathematical expressions properly (x^2, etc.)
8. MAKE PROBLEMS VISUALLY ENGAGING:
   - Use relevant emojis liberally in word problems (🍌 for bananas, 🚗 for cars, 🏠 for houses, 📦 for boxes, 🍎 for apples, 💰 for money, ⏱️ for time, 📏 for distance, 🚶 for walking, 🏃 for running, ✈️ for planes, 🚂 for trains, 🛒 for shopping, 🎂 for cakes, 🍕 for pizza, 🌳 for trees, 🌺 for flowers, 📚 for books, etc.)
   - Create vivid, relatable scenarios that students can visualize
   - For motion problems, describe the scene (e.g., "🚗➡️ Car A is speeding ahead while 🚙➡️ Car B tries to catch up")
   - For quantity problems, use emoji quantities when reasonable (e.g., "🍎🍎🍎 + 🍎🍎 = ?")
   - Make the problem feel like an illustrated practice book, not just plain text

EXAMPLES:

For topic "Algebra" (word problem):
"[TOPIC: Algebra] 🎯 Practice Problem:

🍌 Maria has a basket of bananas! She gives half of them to her friend 👧, then eats 3 bananas 😋. Now she has 7 bananas left.

🍌❓ How many bananas did Maria start with?

What do you think we should do first to solve this problem?"

For topic "Algebra" (motion problem):
"[TOPIC: Algebra] 🎯 Practice Problem:

🚗💨 ➡️ ➡️ ➡️ 🏁
Car A leaves the city at 60 km/h

⏱️ 2 hours later...

🚙💨💨 ➡️ ➡️ ➡️ 🏁
Car B leaves from the same point at 80 km/h, trying to catch up!

❓ How long will it take Car B to catch Car A?

What's your first step to solve this?"

For topic "Integration":
"[TOPIC: Integration] 🎯 Practice Problem:

📐 Find the integral: ∫(3x² + 2x - 5)dx

What do you think we should do first to solve this integral?"`;

interface ChatMessage {
  role: string;
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, imageBase64, guidanceMode = 'guided', practiceMode = false, practiceTopic = '' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt: string;
    
    if (practiceMode && practiceTopic) {
      systemPrompt = PRACTICE_SYSTEM_PROMPT;
    } else {
      systemPrompt = guidanceMode === 'soft' ? SOFT_SYSTEM_PROMPT : GUIDED_SYSTEM_PROMPT;
    }

    const apiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    // Practice mode - generate a problem for the topic
    if (practiceMode && practiceTopic && messages.length === 0) {
      apiMessages.push({
        role: "user",
        content: `Generate a practice problem for the topic: ${practiceTopic}. Present the problem and ask the student how to start solving it.`
      });
    } else {
      const imagePrompt = guidanceMode === 'soft' 
        ? "Analyze the math problem in this image and start teaching the student step by step. First explain the problem, then ask what the first step should be. Progress efficiently through each step."
        : "Analyze the math problem in this image and start teaching the student step by step. First explain the problem, then ask what they think the first step should be.";

      // If there's an image, add it as the first user message with vision
      if (imageBase64 && messages.length === 0) {
        apiMessages.push({
          role: "user",
          content: [
            {
              type: "text",
              text: imagePrompt
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
              text: imagePrompt
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
