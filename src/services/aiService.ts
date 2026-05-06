const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export interface AIInsight {
  summary: string;
  strengths: string[];
  suggestions: string[];
  motivationalMessage: string;
}

// caching implementation
let cachedInsight: AIInsight | null = null;


// retry logic: reduces load on system and fails after tiring system out
async function fetchWithRetry(url: string, options: RequestInit, retries = 5): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);

    if ((response.status === 429 || response.status === 503) && i < retries - 1) {
      const waitTime = 2000 * (i + 1);
      console.log(`Rate limited, retrying in ${waitTime / 1000}s... (attempt ${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }

    return response;
  }
  throw new Error('Max retries reached');
}

export const generateAIInsights = async (
  totalCompletions: number,
  weeklyCompletions: number,
  completionRate: number,
  longestStreak: number,
  topHabits: { title: string; count: number }[],
): Promise<AIInsight | null> => {

  if (cachedInsight) return cachedInsight;
  try {
    if (!GEMINI_API_KEY) {
      console.error("Gemini API key not found in environment");
      return null;
    }


    // prompt engineering: allows for a wider variety of answers
    const prompt = `You are a supportive habit-building coach analysing user progress data. Based on the following statistics, provide personalised insights:

        **User Statistics:**
        - Total Completions: ${totalCompletions}
        - This Week: ${weeklyCompletions} completions
        - 7-Day Completion Rate: ${completionRate.toFixed(1)}%
        - Longest Streak: ${longestStreak} days

        **Top Habits:**
        ${topHabits.map((h, i) => `${i + 1}. ${h.title}: ${h.count} completions`).join("\n")}

        Provide a JSON response with this EXACT structure (no markdown, no code blocks, just pure JSON):
        {
        "summary": "A brief 2-3 sentence overview of their progress and what stands out",
        "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
        "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
        "motivationalMessage": "An encouraging, personalized message based on their data (1 sentence)"
        }

        Be specific, reference their actual numbers, and keep it positive and actionable.`;

    const response = await fetchWithRetry(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 5000,
          response_mime_type: "application/json",
        },
      }),
    });

    // error handling: ensures status code is returned 
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const rawText = await response.text();
    console.log("Gemini RAW response:", rawText);

    const data = JSON.parse(rawText);

    if (!data.candidates || data.candidates.length === 0) {
      console.error("Gemini returned no candidates:", data);
      return null;
    }

    const generatedText = data.candidates[0]?.content?.parts[0]?.text;

    if (!generatedText) {
      throw new Error("No response from Gemini API");
    }

    // format returned text from API
    const cleanedText = generatedText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    console.log("AI Response:", cleanedText);

    const insight: AIInsight = JSON.parse(cleanedText);
    cachedInsight = insight;
    return insight;
  } catch (error: any) {
    console.log("AI Insights Error message:", error?.message);
    console.log("AI Insights Error stack:", error?.stack);
    console.log("AI Insights Full Error:", error);
    return null;
  }
};
