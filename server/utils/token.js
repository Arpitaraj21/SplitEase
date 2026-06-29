import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";

dotenv.config();

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.SECRETKEY,
    { expiresIn: "7d" },
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.SECRETKEY, { expiresIn: "30d" });
};
