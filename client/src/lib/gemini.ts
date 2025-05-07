import { apiRequest } from "@/lib/queryClient";
import { StoryGenerationRequest, ReadingEvent } from "@/types";

export async function generateStory(data: StoryGenerationRequest) {
  const response = await apiRequest('POST', '/api/books/new', data);
  return await response.json();
}

export async function assessReading(data: ReadingEvent) {
  const response = await apiRequest('POST', '/api/reading-event', data);
  return await response.json();
}
