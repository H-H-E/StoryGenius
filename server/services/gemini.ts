import { ReadingAssessment } from "@/types";
import { GoogleGenerativeAI } from '@google/generative-ai';

interface StoryBookSchema {
  title: string;
  readingLevel: string;
  pages: Array<{
    pageNumber: number;
    words: Array<{
      text: string;
      phonemes: string[];
    }>;
    imagePrompt: string;
  }>;
}

interface ReadingAssessmentSchema {
  sentence: string;
  analysis: Array<{
    word: string;
    phonemeBreakdown: Array<{
      phoneme: string;
      hit: boolean;
    }>;
    correct: boolean;
  }>;
  scores: {
    accuracyPct: number;
    fryHitPct: number;
    phonemeHitPct: number;
  };
}

/**
 * Call the Gemini API for generation
 * @param data The input data for Gemini
 * @param type The type of generation: "storybook" or "assessment"
 */
export async function callGemini(data: any, type: string = "storybook"): Promise<StoryBookSchema | ReadingAssessmentSchema> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Different configurations based on request type
  if (type === "storybook") {
    // Generate a storybook with structured output
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8000,
      },
    });

    const prompt = `Generate a storybook titled "${data.theme}" at readingLevel "${data.reading_level}" with ${data.num_pages} pages.
Each page must include:
- pageNumber (1–${data.num_pages})
- words: an array of objects { text: string, phonemes: [string,…] }
- imagePrompt: a rich prompt for the illustration

Make sure the complexity matches the reading level. Break down each word into correct phonemes in ARPABET format.
The story should be related to the theme: ${data.theme}.

Output ONLY valid JSON.`;

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const responseText = result.response.text();
      
      // Look for JSON content - it may be embedded in markdown code blocks or directly returned
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/```\n([\s\S]*?)\n```/) ||
                        responseText.match(/{[\s\S]*}/);
                        
      if (jsonMatch) {
        jsonText = jsonMatch[1] || jsonMatch[0];
      }
      
      try {
        return JSON.parse(jsonText);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        throw new Error("Failed to parse storybook JSON response");
      }
    } catch (error) {
      console.error("Error generating storybook:", error);
      throw error;
    }
  } else if (type === "assessment") {
    // Generate a reading assessment with structured output
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
      },
    });

    const prompt = `Analyze a child's reading accuracy.
Expected Text: "${data.expected}"
Actual Reading: "${data.actual}"

Provide a detailed analysis with:
1. Word-by-word comparison
2. Phoneme breakdown for each word
3. Identify correct/incorrect pronunciations
4. Calculate accuracy percentages

Format as JSON with:
{
  "sentence": "original sentence",
  "analysis": [
    {
      "word": "word from text",
      "phonemeBreakdown": [
        {"phoneme": "phoneme", "hit": boolean}
      ],
      "correct": boolean
    }
  ],
  "scores": {
    "accuracyPct": number (0-100),
    "fryHitPct": number (0-100),
    "phonemeHitPct": number (0-100)
  }
}

Output ONLY valid JSON.`;

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const responseText = result.response.text();
      
      // Look for JSON content - it may be embedded in markdown code blocks or directly returned
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/```\n([\s\S]*?)\n```/) ||
                        responseText.match(/{[\s\S]*}/);
                        
      if (jsonMatch) {
        jsonText = jsonMatch[1] || jsonMatch[0];
      }
      
      try {
        return JSON.parse(jsonText);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        throw new Error("Failed to parse assessment JSON response");
      }
    } catch (error) {
      console.error("Error generating assessment:", error);
      throw error;
    }
  } else {
    throw new Error(`Invalid generation type: ${type}`);
  }
}
