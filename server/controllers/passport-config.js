import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/users.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
      scope: ["profile", "email", "https://www.googleapis.com/auth/contacts.readonly"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        let user = await User.findOne({ email });

        if (!user) {
          // Create new user from Google profile
          user = await User.create({
            name: profile.displayName,
            username: email.split("@")[0] + "_" + Date.now().toString(36),
            email,
            password: "google_oauth_" + profile.id, // placeholder, user won't use password login
            profileImage: profile.photos?.[0]?.value || "",
            googleId: profile.id,
            googleAccessToken: accessToken,
          });
        } else {
          // Update Google tokens
          user.googleId = profile.id;
          user.googleAccessToken = accessToken;
          if (profile.photos?.[0]?.value && !user.profileImage) {
            user.profileImage = profile.photos[0].value;
          }
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
