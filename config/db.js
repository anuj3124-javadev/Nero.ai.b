import sequelize from "./sequelize.js";

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected successfully.");

    // Auto-create tables if they don't exist
    await sequelize.sync({ alter: true });
    console.log("✅ Database tables synced.");
  } catch (error) {
    console.error("\n❌ DATABASE CONNECTION FAILED");
    console.error("------------------------------");
    console.error(`Host: ${process.env.DB_HOST}`);
    console.error(`Database: ${process.env.DB_NAME}`);
    console.error(`Error: ${error.message}`);
    console.error("------------------------------\n");
    process.exit(1);
  }
};

export default connectDB;
