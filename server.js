import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables immediately
dotenv.config();

import connectDB from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import aiRouter from "./routes/aiRoutes.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoutes.js";
import imageRouter from "./routes/imageRoutes.js";



const app = express();

// Connect MySQL Database and sync tables
await connectDB();

// Connect Cloudinary
await connectCloudinary();

// Middleware
app.use(cors({
  origin: true, // Allow all origins or specify your frontend port
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(clerkMiddleware());

// Health check
app.get("/", (req, res) => {
  res.send("✅ AI-SaaS Server is running! All features are FREE.");
});

// Routes
app.use("/api/ai", aiRouter);
app.use("/api/user", userRouter);
app.use("/api/image", imageRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
