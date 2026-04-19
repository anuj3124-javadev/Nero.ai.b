import sequelize from "./sequelize.js";

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected successfully.");

    // Auto-create tables if they don't exist
    await sequelize.sync({ alter: true });
    console.log("✅ Database tables synced.");
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
