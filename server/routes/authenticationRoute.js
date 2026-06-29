import express from "express";
import {
  handleSignup,
  handleLogin,
  handleLogout,
  handleRefreshToken,
} from "../controllers/user.js";
import { verifyToken } from "../middlewares/authorization.js";
import { validate, signupValidation, loginValidation } from "../middlewares/validate.js";

const router = express.Router();

router.post("/signup", validate(signupValidation), handleSignup);
router.post("/login", validate(loginValidation), handleLogin);
router.post("/logout", handleLogout);
router.post("/refresh-token", handleRefreshToken);

export default router;
