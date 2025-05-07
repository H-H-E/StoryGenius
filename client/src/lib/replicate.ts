import { apiRequest } from "@/lib/queryClient";

export interface ImageGenerationRequest {
  prompt: string;
  width?: number;
  height?: number;
}

export async function generateImage(data: ImageGenerationRequest) {
  const response = await apiRequest('POST', '/api/generate-image', {
    prompt: data.prompt,
    width: data.width || 768,
    height: data.height || 768
  });
  return await response.json();
}
