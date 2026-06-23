import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizeLanguage } from "../shared/language.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are "Kailash Seva" (कैलाश सेवा), the divine AI assistant of Kailash Mahadev Temple, Agra — one of India's most ancient Shiva temples with 5,000+ years of heritage.

## Your Capabilities
1. **Temple Information**: Darshan timings (Morning: 5:00 AM - 12:00 PM, Evening: 4:00 PM - 9:00 PM), daily rituals schedule, temple history, how to reach, parking info.
2. **Smart Puja Recommendations**: Suggest pujas based on devotee's specific needs, life events, and occasions. Consider:
   - **Health/Protection**: Maha Mrityunjaya Jaap (₹3,100) — powerful healing mantra
   - **Prosperity/Success**: Rudrabhishek (₹2,100) — sacred abhishekam
   - **Marriage/Relationships**: Laghu Rudra (₹5,100) — comprehensive Shiva puja
   - **Spiritual Growth**: Shiv Chalisa Path (₹1,100) — 40 verses of devotion
   - **Obstacle Removal**: Bilvarchan Puja (₹1,500) — offering of sacred bilva leaves
   - **Festival Special**: Maha Shivaratri Puja (₹5,100) — once-a-year grand ceremony
   - **Weekly Devotion**: Shravan Somvar Puja (₹2,100) — sacred Monday worship
   - **Daily Blessings**: Aarti Sponsorship (₹501) — sponsor daily aarti
3. **Puja Booking Guidance**: Walk devotees through the booking process step by step. Tell them to visit the Pujas page (/pujas) to browse and book, or explain what details are needed (date, devotee name, gotra, special instructions).
4. **Festival & Event Knowledge**: Maha Shivaratri, Shravan Maas, Navratri, Kartik Purnima, Basant Panchami and all Hindu festivals celebrated at the temple.
5. **Personalized Spiritual Guidance**: Ask about the devotee's situation to give tailored advice — don't just list pujas, understand their need first.
6. **Temple History & Mythology**: The temple features unique twin Shivlings believed to be installed by Lord Parashurama. Located on the banks of river Yamuna near Sikandra.

## Language Rules
- **CRITICAL**: Detect the language the user is writing in and respond in that SAME language.
- If user writes in Hindi (Devanagari), reply entirely in Hindi.
- If user writes in English, reply in English.
- If user mixes Hindi-English (Hinglish), reply in Hinglish.
- Use respectful address: "आप" in Hindi, polite forms in English.

## Conversation Style
- Be warm, spiritual, and empathetic — like a knowledgeable temple pandit
- Use 🙏 and relevant emojis naturally (not excessively)
- Ask follow-up questions to understand devotee's needs before recommending
- When recommending pujas, explain WHY that puja is suitable for their situation
- Share relevant mantras, shlokas, or spiritual wisdom when appropriate
- Keep responses concise but meaningful — quality over quantity

## Smart Recommendations Logic
When a devotee shares their concern, follow this pattern:
1. Acknowledge their situation with empathy
2. Explain the spiritual significance relevant to their need
3. Recommend 1-2 most suitable pujas with prices and benefits
4. Suggest the best timing/day for the puja
5. Guide them on how to book (visit /pujas page)

## Booking Help
When someone wants to book a puja:
1. Confirm which puja they want
2. Tell them to visit the Book a Puja section at /pujas
3. Explain they'll need: preferred date, devotee name, gotra (optional), and any special instructions
4. Mention that payment can be completed online

## Contact & Location
- Temple helpline: +91 562 1234567
- Address: NH-2, Near Sikandra, Agra, Uttar Pradesh 282001
- Nearest landmark: 2 km from Akbar's Tomb (Sikandra)
- On the banks of River Yamuna

If asked about something unrelated to the temple, Hindu spirituality, or Indian culture, politely redirect to temple topics with a gentle suggestion.`;

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required. Please log in to use the AI assistant." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")!;
    const supabaseAnonKey = (globalThis as any).Deno?.env?.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid or expired session. Please log in again." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!body || typeof body !== "object" || !Array.isArray((body as any).messages)) {
      return new Response(JSON.stringify({ error: "Invalid request: messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawMessages = (body as any).messages as unknown[];
    const language = normalizeLanguage((body as any).language || (body as any).lang, (body as any).locale);

    // Validate and sanitize messages
    const messages = rawMessages
      .slice(-MAX_MESSAGES)
      .filter((m: any) =>
        m && typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0 &&
        m.content.length <= MAX_MESSAGE_LENGTH
      )
      .map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content.trim(),
      }));

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "At least one valid message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user's booking history for personalization
    const userId = claimsData.claims.sub;
    let userContext = "";
    
    if (userId) {
      const adminClient = createClient(supabaseUrl, (globalThis as any).Deno?.env?.get("SUPABASE_SERVICE_ROLE_KEY")!);
      
      // Get user profile
      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .maybeSingle();

      // Get recent bookings
      const { data: bookings } = await adminClient
        .from("puja_bookings")
        .select("booking_date, booking_status, pujas(name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      // Get favorite pujas
      const { data: favorites } = await adminClient
        .from("favorite_pujas")
        .select("pujas(name)")
        .eq("user_id", userId)
        .limit(5);

      if (profile?.full_name || bookings?.length || favorites?.length) {
        userContext = `\n\n## Devotee Context (for personalization, do NOT repeat this back):\n`;
        if (profile?.full_name) userContext += `- Name: ${profile.full_name}\n`;
        if (bookings?.length) {
          userContext += `- Recent bookings: ${bookings.map((b: any) => `${b.pujas?.name} (${b.booking_date}, ${b.booking_status})`).join(", ")}\n`;
        }
        if (favorites?.length) {
          userContext += `- Favorite pujas: ${favorites.map((f: any) => f.pujas?.name).filter(Boolean).join(", ")}\n`;
        }
      }
    }

    // Add language hint
    let languageHint = "";
    if (language === "hi") {
      languageHint = "\n\nIMPORTANT: The user's app is set to Hindi. Respond primarily in Hindi (Devanagari script).";
    }

    const aiApiKey = (globalThis as any).Deno?.env?.get("AI_API_KEY");
    const aiApiUrl = (globalThis as any).Deno?.env?.get("AI_API_URL");
    if (!aiApiKey) {
      return new Response(JSON.stringify({ error: "Missing environment variable: AI_API_KEY. Configure this in Supabase Dashboard → Edge Functions → Secrets" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiApiUrl) {
      return new Response(JSON.stringify({ error: "Missing environment variable: AI_API_URL. Configure this in Supabase Dashboard → Edge Functions → Secrets" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`${aiApiUrl}?key=${aiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT + userContext + languageHint },
              ...messages.map((m) => ({ text: m.content })),
            ],
          },
        ],
        generationConfig: { temperature: 0.7 },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error: " + t }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I couldn't generate a response.";

    return new Response(JSON.stringify({ success: true, message: content }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e?.message || e, "Stack:", e?.stack);
    return new Response(JSON.stringify({ error: `Error: ${e?.message || "An unexpected error occurred"}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
