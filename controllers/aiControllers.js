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

    const prompt = `You are an expert career coach and resume reviewer. 
    Review the following resume content and provide a detailed, highly structured report in Markdown.
    
    Use the following sections:
    # 📊 Overall Score (0-100)
    ## 🚀 Key Strengths
    ## 💡 Areas for Improvement
    ## 🛠️ Actionable Tips
    ## 🎯 Keywords to Add
    
    Resume Content: ${pdfData.text}`;

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
// ✅ FREE - AI Chatbot
export const chatBot = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { messages } = req.body; // Expecting an array of { role, content }

    if (!messages || !Array.isArray(messages)) {
      return res.json({ success: false, message: "Invalid message format." });
    }

    const systemMsg = { 
      role: "system", 
      content: "You are Nero AI, a professional assistant. Always structure your responses beautifully using Markdown. Use headings, lists, and bold text where appropriate to make information easy to read." 
    };

    const response = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [systemMsg, ...messages], // Prepend system instruction
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;

    // Persist to database
    await Creation.create({ 
      user_id: userId, 
      prompt: messages[messages.length - 1].content, 
      content, 
      type: "chat" 
    });

    res.json({ success: true, content });
  } catch (error) {
    console.error("Chat Error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ FREE - Get Chat History
export const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.auth();

    const history = await Creation.findAll({
      where: { user_id: userId, type: "chat" },
      order: [["created_at", "ASC"]],
    });

    res.json({ success: true, history });
  } catch (error) {
    console.error("Fetch History Error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ FREE - Delete ALL Chat History
export const deleteChatHistory = async (req, res) => {
  try {
    const { userId } = req.auth();

    await Creation.destroy({
      where: { user_id: userId, type: "chat" }
    });

    res.json({ success: true, message: "Chat history cleared." });
  } catch (error) {
    console.error("Delete History Error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ FREE - Delete Single Chat Item
export const deleteChatItem = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;

    const result = await Creation.destroy({
      where: { id, user_id: userId, type: "chat" }
    });

    if (result) {
      res.json({ success: true, message: "Message deleted." });
    } else {
      res.json({ success: false, message: "Item not found or unauthorized." });
    }
  } catch (error) {
    console.error("Delete Item Error:", error.message);
    res.json({ success: false, message: error.message });
  }
};
