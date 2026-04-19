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
    const { messages, threadId } = req.body; 

    if (!messages || !Array.isArray(messages)) {
      return res.json({ success: false, message: "Invalid message format." });
    }

    const systemMsg = { 
      role: "system", 
      content: `You are Nero AI, the official intelligent assistant for the Nero AI platform. 

### About Nero AI
Nero AI is a high-performance AI ecosystem designed for productivity and creativity. Your specific tools include:
- **AI Chat Studio**: Advanced context-aware conversations with conversational history selection.
- **Resume Review**: Sophisticated PDF analysis, scoring, and career optimization.
- **Image Studio**: Professional-grade text-to-image generation.
- **Remove Background**: Instant, AI-powered background removal from any photo.
- **Remove Objects**: Generative AI tool to erase unwanted objects from images.
- **Blog Title Generator**: Creative brainstorming for viral and engaging content titles.
- **Article Writing**: High-quality, long-form professional article generation.

### Developer Information
Your developer is **Anuj Yadav**, a dedicated AI and Full-Stack Developer. If users ask about your creator or developer, provide the following details:
- **Name**: Anuj Yadav (Java & AI Specialist)
- **LinkedIn**: [Anuj Yadav Profile](https://www.linkedin.com/in/anuj-yadav-69b50b263)
- **GitHub**: [anuj3124-javadev](https://github.com/anuj3124-javadev)

Always respond in a professional tone and use beautiful Markdown formatting (headings, bold text, and lists) to make every answer clear and premium.` 
    };

    const response = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [systemMsg, ...messages], 
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;

    // Persist to database with thread_id
    const finalThreadId = threadId || `thread_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    await Creation.create({ 
      user_id: userId, 
      prompt: messages[messages.length - 1].content, 
      content, 
      type: "chat",
      thread_id: finalThreadId
    });

    res.json({ success: true, content, threadId: finalThreadId });
  } catch (error) {
    console.error("Chat Error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ FREE - Get Chat History (Grouped by Threads)
export const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.auth();

    // To group by thread_id and get the most recent message:
    // This is easier with raw SQL but can be done with findAndCountAll or just fetching all and grouping
    const history = await Creation.findAll({
      where: { user_id: userId, type: "chat" },
      order: [["created_at", "DESC"]],
    });

    // Grouping by thread_id on the server to keep sidebar clean
    const threadsMap = {};
    const groupedHistory = [];

    history.forEach(item => {
      // If thread_id is null (old chat), treat each as its own thread or group them
      const id = item.thread_id || `legacy_${item.id}`;
      if (!threadsMap[id]) {
        threadsMap[id] = true;
        groupedHistory.push(item);
      }
    });

    res.json({ success: true, history: groupedHistory, allMessages: history });
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
