import express from "express";
import passport from "../controllers/passport-config.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { verifyToken } from "../middlewares/authorization.js";

const router = express.Router();

// Initiate Google OAuth - request contacts access too
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/contacts.readonly"],
    accessType: "offline",
    prompt: "consent",
  })
);

// Google OAuth callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  async (req, res) => {
    try {
      const user = req.user;

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
        sameSite: "lax",
        path: "/",
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
        path: "/",
      });

      // Redirect to frontend dashboard
      res.redirect(process.env.CLIENT_URL || "http://localhost:5173/dashboard");
    } catch (error) {
      console.log("Google auth callback error:", error);
      res.redirect(process.env.CLIENT_URL || "http://localhost:5173/login");
    }
  }
);

// Get Google contacts (requires contacts scope)
router.get("/auth/google/contacts", verifyToken, async (req, res) => {
  try {
    // verifyToken sets req.user.id, load full user doc for googleAccessToken
    const User = (await import("../models/users.js")).default;
    const user = await User.findById(req.user.id);
    if (!user || !user.googleAccessToken) {
      return res.status(401).json({
        message: "Google authentication required for contacts access",
        success: false,
      });
    }

    // Fetch contacts from Google People API
    const response = await fetch(
      "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=100",
      {
        headers: {
          Authorization: `Bearer ${user.googleAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      return res.status(400).json({
        message: "Failed to fetch contacts. Please re-authenticate with Google.",
        success: false,
      });
    }

    const data = await response.json();
    const contacts = (data.connections || []).map((person) => ({
      name: person.names?.[0]?.displayName || "",
      email: person.emailAddresses?.[0]?.value || "",
      phone: person.phoneNumbers?.[0]?.value || "",
    })).filter((c) => c.email || c.phone);

    return res.status(200).json({
      message: "Contacts fetched successfully",
      contacts,
      success: true,
    });
  } catch (error) {
    console.log("error fetching google contacts", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
});

export default router;
