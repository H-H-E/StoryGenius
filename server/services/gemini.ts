import { ReadingAssessment } from "@/types";

interface StoryBookSchema {
  title: string;
  readingLevel: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    imagePrompt: string;
    fryWords: string[];
    phonemes: string[];
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

  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

  let prompt;
  let schema;

  if (type === "storybook") {
    prompt = `storybook.v1\n${JSON.stringify(data)}`;
    schema = "StoryBookSchema";
  } else if (type === "assessment") {
    prompt = `assessment.v1\n${JSON.stringify(data)}`;
    schema = "ReadingAssessmentSchema";
  } else {
    throw new Error(`Invalid generation type: ${type}`);
  }

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      response_format: {
        type: "json_schema",
        schema: schema
      }
    }
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // Extract the generated content
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON string from the response
    try {
      const parsedResponse = JSON.parse(generatedText);
      return parsedResponse;
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      throw new Error("Failed to parse Gemini response");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}
