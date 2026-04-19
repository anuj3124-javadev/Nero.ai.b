import { clerkClient } from "../config/clerk.js";
import User from "../models/User.js";

export const auth = async (req, res, next) => {
  try {
    const { userId } = await req.auth();

    if (!userId) {
      return res.json({ success: false, message: "Unauthorized. Please sign in." });
    }

    req.userId = userId;

    // Synchronize User Data to local database
    // We do this in the background (or foreground) to ensure user details are stored
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      
      const [userRecord] = await User.upsert({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        image: clerkUser.imageUrl,
        updatedAt: new Date()
      });

      req.localUser = userRecord;
    } catch (syncError) {
      console.error("User Sync Error:", syncError.message);
      // We don't block the request if sync fails, but we log it
    }

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.json({ success: false, message: "Authentication internal error." });
  }
};