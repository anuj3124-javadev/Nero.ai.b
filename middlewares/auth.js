export const auth = async (req, res, next) => {
  try {
    const { userId } = await req.auth();

    if (!userId) {
      return res.json({ success: false, message: "Unauthorized. Please sign in." });
    }

    req.userId = userId;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.json({ success: false, message: "Authentication internal error." });
  }
};