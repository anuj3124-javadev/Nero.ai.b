import { createClerkClient } from "@clerk/express";
import dotenv from "dotenv";
dotenv.config();

export const clerkClient = createClerkClient({ 
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY
});
