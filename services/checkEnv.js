/**
 * Validates that all required environment variables are present.
 * This helps identify missing configuration early in development or deployment.
 */
const REQUIRED_ENV_VARS = [
  "PORT",
  "DB_HOST",
  "DB_USER",
  "DB_PASS",
  "DB_NAME",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "MISTRAL_API_KEY",
  "CLIPDROP_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "HUGGING_FACE_TOKEN"
];

const checkEnv = () => {
  const missingVars = [];

  REQUIRED_ENV_VARS.forEach((key) => {
    if (!process.env[key]) {
      missingVars.push(key);
    }
  });

  if (missingVars.length > 0) {
    console.error("\n❌ MISSING ENVIRONMENT VARIABLES:");
    console.error("----------------------------------");
    missingVars.forEach((v) => console.error(` - ${v}`));
    console.error("----------------------------------");
    console.error("Please add these keys to your .env file (local) or your platform's environment settings (live).\n");
    
    // We only exit if we're in production to prevent a broken deployment
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  } else {
    console.log("✅ Environment validation successful.");
  }
};

export default checkEnv;
