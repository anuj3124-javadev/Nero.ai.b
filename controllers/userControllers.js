import Creation from "../models/Creation.js";
import { Op } from "sequelize";

// Get all creations of the logged-in user
export const getUserCreations = async (req, res) => {
  try {
    const { userId } = req.auth();
    const creations = await Creation.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, creations });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get all published creations (community gallery)
export const getPublishedCreations = async (req, res) => {
  try {
    const creations = await Creation.findAll({
      where: { publish: true },
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, creations });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Toggle like for a creation
export const toggleLikeCreation = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const creation = await Creation.findByPk(id);

    if (!creation) {
      return res.json({ success: false, message: "Creation not found" });
    }

    // likes is auto-parsed to array by the model getter
    const currentLikes = creation.likes || [];
    let updatedLikes;
    let message;

    if (currentLikes.includes(userId)) {
      updatedLikes = currentLikes.filter((like) => like !== userId);
      message = "Like removed";
    } else {
      updatedLikes = [...currentLikes, userId];
      message = "Like added";
    }

    // setter will JSON.stringify it back
    creation.likes = updatedLikes;
    await creation.save();

    res.json({ success: true, message, likes: updatedLikes });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

