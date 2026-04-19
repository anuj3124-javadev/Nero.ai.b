import { Mistral } from "@mistralai/mistralai";
import Creation from "../models/Creation.js";
import FormData from "form-data";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import fs from "fs";
import Pdf from "pdf-parse/lib/pdf-parse.js";

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

// ✅ FREE - Generate Article (no plan check)
export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;

    const response = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      maxTokens: length,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;

    await Creation.create({ user_id: userId, prompt, content, type: "article" });

    res.json({ success: true, content });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ FREE - Generate Blog Titles (no plan check)
export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;

    const response = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 100,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;

    await Creation.create({ user_id: userId, prompt, content, type: "blog-title" });

    res.json({ success: true, content });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ FREE - Generate Image
export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: { "x-api-key": process.env.CLIPDROP_API_KEY },
        responseType: "arraybuffer",
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(
      data,
      "binary"
    ).toString("base64")}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    await Creation.create({
      user_id: userId,
      prompt,
      secure_url,
      publish: publish || false,
      type: "image",
    });

    res.json({ success: true, imageUrl: secure_url });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ FREE - Remove Image Background
export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;

    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: "background_removal",
          background_removal: "remove_the_background",
        },
      ],
    });

    await Creation.create({
      user_id: userId,
      prompt: "Remove background from image",
      secure_url,
      type: "remove-background",
    });

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ FREE - Remove Object from Image
export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;

    if (!image) return res.json({ success: false, message: "No image uploaded." });
    if (!object) return res.json({ success: false, message: "No object description provided." });

    // Perform the upload with the generative removal transformation
    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        { effect: `gen_remove:prompt_${object}` }
      ],
    });

    await Creation.create({
      user_id: userId,
      prompt: `Remove object: ${object}`,
      secure_url,
      type: "remove-object",
    });

    res.json({ success: true, imageUrl: secure_url });
  } catch (error) {
    console.error("Remove Object Error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ FREE - Review Resume
export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({
        success: false,
        message: "Resume file size exceeds allowed size (5MB).",
      });
    }

    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await Pdf(dataBuffer);

    const prompt = `Review my resume and suggest improvements. Here is the content: ${pdfData.text}`;

    const response = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 1000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;

    await Creation.create({
      user_id: userId,
      prompt: "Review the uploaded resume",
      content,
      type: "resume-review",
    });

    res.json({ success: true, content });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};
