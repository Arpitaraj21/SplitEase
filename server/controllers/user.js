import bcrypt from "bcrypt";
import User from "../models/users.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

dotenv.config();

// Sign up
export const handleSignup = async (req, res) => {
  const { name, username, email, password, role, profileImage } = req.body;

  try {
    const isExistingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (isExistingUser) {
      const field = isExistingUser.email === email.toLowerCase() ? "email" : "username";
      return res.status(409).json({
        message: `User with this ${field} already exists!`,
        success: false,
      });
    }

    const hashPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      username,
      email: email.toLowerCase(),
      password: hashPassword,
      role: role || "user",
      profileImage,
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    newUser.refreshToken = refreshToken;
    await newUser.save();

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

    return res.status(201).json({
      message: "User created successfully!",
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      success: true,
    });
  } catch (error) {
    console.log("signup error", error);
    return res.status(500).json({
      message: "Internal Server Error!",
      success: false,
    });
  }
};

// Login
export const handleLogin = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const isUserExisting = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    });

    if (!isUserExisting) {
      return res.status(400).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, isUserExisting.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    const accessToken = generateAccessToken(isUserExisting);
    const refreshToken = generateRefreshToken(isUserExisting);

    isUserExisting.refreshToken = refreshToken;
    await isUserExisting.save();

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

    return res.status(200).json({
      message: "Login successful",
      success: true,
    });
  } catch (error) {
    console.log("error in login", error);
    return res.status(500).json({
      message: "Internal Server Error!",
      success: false,
    });
  }
};

// Logout
export const handleLogout = async (req, res) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Logout successful",
      success: true,
    });
  } catch (error) {
    console.log("error in logout handler", error);
    return res.status(500).json({
      message: "Internal Server Error!",
      success: false,
    });
  }
};

// Refresh token
export const handleRefreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token", success: false });
    }

    const decoded = jwt.verify(refreshToken, process.env.SECRETKEY);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token", success: false });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
      sameSite: "lax",
      path: "/",
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Token refreshed",
      success: true,
    });
  } catch (error) {
    console.log("error in refresh token", error);
    return res.status(401).json({
      message: "Invalid or expired refresh token",
      success: false,
    });
  }
};
