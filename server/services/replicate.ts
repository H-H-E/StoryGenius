/**
 * Interface for image generation request to Replicate API
 */
interface ReplicateImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  num_outputs?: number;
}

/**
 * Interface for image generation response from Replicate API
 */
interface ReplicateImageResponse {
  imageUrl: string;
}

/**
 * Generate an image using the Replicate Flux-Schnell model
 * @param options Options for image generation
 * @returns Promise with the URL of the generated image
 */
export async function generateImage(options: ReplicateImageRequest): Promise<ReplicateImageResponse> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN environment variable is not set");
  }

  const { 
    prompt, 
    width = 768, 
    height = 768, 
    steps = 8, // Increased for better quality 
    num_outputs = 1 
  } = options;
  
  // Enhance prompt with consistency guidelines if not already included
  let enhancedPrompt = prompt;
  if (!prompt.toLowerCase().includes('style:')) {
    enhancedPrompt = `${prompt}. Style: children's book illustration, vibrant colors, detailed.`;
  }

  const apiUrl = "https://api.replicate.com/v1/predictions";
  const requestBody = {
    version: "black-forest-labs/flux-schnell",
    input: {
      prompt,
      steps,
      num_outputs,
      width,
      height
    }
  };

  try {
    // Start the prediction
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const predictionId = data.id;

    // Poll for the prediction result
    let result;
    let maxRetries = 30; // Maximum number of retries (30 * 2 seconds = 60 seconds)

    while (maxRetries > 0) {
      const statusResponse = await fetch(`${apiUrl}/${predictionId}`, {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        throw new Error(`Replicate API status error (${statusResponse.status}): ${errorText}`);
      }

      result = await statusResponse.json();

      if (result.status === "succeeded") {
        // Return the first output image URL
        return { imageUrl: result.output[0] };
      } else if (result.status === "failed") {
        throw new Error(`Image generation failed: ${result.error || "Unknown error"}`);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
      maxRetries--;
    }

    throw new Error("Image generation timed out");
  } catch (error) {
    console.error("Error generating image with Replicate:", error);
    throw error;
  }
}
