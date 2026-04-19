import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

const hf = new HfInference(process.env.HUGGING_FACE_TOKEN);

export const generateImageService = async (prompt) => {
    try {
        const response = await hf.textToImage({
            model: "black-forest-labs/FLUX.1-schnell",
            inputs: prompt,
            parameters: {
                negative_prompt: "blurry, low quality, distorted",
            },
        }, {
            // Explicitly set provider to suppress the "Auto selected provider" log
            provider: "hf-inference",
        });

        // The response is a Blob. Convert it to a Base64 string.
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");
        
        return `data:image/png;base64,${base64Image}`;
    } catch (error) {
        console.error("Hugging Face API Error Details:");
        console.error("- Status:", error.status);
        console.error("- Message:", error.message);
        console.error("- Original Error:", error);
        throw new Error(`Hugging Face Error: ${error.message || "Unknown error"}`);
    }
};
