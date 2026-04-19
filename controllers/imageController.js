import { generateImageService } from "../services/imageService.js";
import Creation from "../models/Creation.js";
import cloudinary from "cloudinary";

export const generateImage = async (req, res) => {
    try {
        const { prompt, publish } = req.body;
        const userId = req.userId;

        if (!prompt) {
            return res.json({ success: false, message: "Prompt is required." });
        }

        // Image generation is now FREE and UNLIMITED.
        // Removed subscription and usage limit checks.

        // Generate image using Hugging Face
        const imageBase64 = await generateImageService(prompt);

        // Upload to Cloudinary
        const uploadResponse = await cloudinary.v2.uploader.upload(imageBase64, {
            folder: "nero-ai/generated-images",
        });

        const imageUrl = uploadResponse.secure_url;

        // Save to database
        const creation = await Creation.create({
            user_id: userId,
            prompt,
            content: imageUrl,
            type: "image",
            publish: publish || false,
            likes: "[]",
        });

        res.json({ success: true, imageUrl, creationId: creation.id });
    } catch (error) {
        console.error("Image Generation Controller Error:", error);
        res.json({ success: false, message: error.message });
    }
};
