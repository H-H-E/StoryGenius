import { Express, Request, Response } from 'express';
import { generateImage } from '../services/replicate';
import { isAuthenticated } from '../services/auth';

export function registerImageRoutes(app: Express) {
  const apiPrefix = '/api';

  // Generate an image using Replicate API
  app.post(`${apiPrefix}/generate-image`, async (req: Request, res: Response) => {
    try {
      const { prompt, width = 768, height = 768 } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Missing image prompt" });
      }

      const imageResponse = await generateImage({
        prompt,
        width,
        height
      });

      res.json({ imageUrl: imageResponse.imageUrl });
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({ message: "Failed to generate image", error: error.message || String(error) });
    }
  });
}