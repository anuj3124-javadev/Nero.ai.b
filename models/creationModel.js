import mongoose from "mongoose";

const creationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  prompt: { type: String, required: true },
  imageUrl: { type: String }, 
  content: { type: String },
  secure_url: { type: String },
  publish: { type: Boolean, default: false },
  likes: { type: [String], default: [] },
  type: { 
    type: String, 
    enum: ["article", "blog-title", "image", "remove-background", "remove-object", "resume-review"], 
    default: "article" 
  },

  createdAt: { type: Date, default: Date.now },
});

const Creation = mongoose.model("Creation", creationSchema);

export default Creation;
