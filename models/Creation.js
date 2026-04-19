import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize.js";

const Creation = sequelize.define(
  "Creation",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    prompt: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    secure_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    publish: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Store likes as a JSON string (array of userId strings)
    likes: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        const raw = this.getDataValue("likes");
        try {
          return JSON.parse(raw || "[]");
        } catch {
          return [];
        }
      },
      set(value) {
        this.setDataValue("likes", JSON.stringify(value || []));
      },
    },
    type: {
      type: DataTypes.ENUM(
        "article",
        "blog-title",
        "image",
        "remove-background",
        "remove-object",
        "resume-review"
      ),
      defaultValue: "article",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "creations",
    timestamps: false, // Handle them manually to avoid Sequelize's default zero-date issues during sync
  }
);

export default Creation;
