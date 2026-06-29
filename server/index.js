import express from "express";
import dotenv from "dotenv";
import connectDb from "./connection.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./controllers/passport-config.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import userRouter from "./routes/authenticationRoute.js";
import profileRouter from "./routes/profile.js";
import groupRouter from "./routes/group.js";
import expenseRouter from "./routes/expense.js";
import invitationRouter from "./routes/invitation.js";
import googleAuthRouter from "./routes/googleAuth.js";
import directExpenseRouter from "./routes/directExpense.js";

dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDb();

// API routes
app.use("/api", userRouter);
app.use("/api", profileRouter);
app.use("/api", groupRouter);
app.use("/api", expenseRouter);
app.use("/api", invitationRouter);
app.use("/api", googleAuthRouter);
app.use("/api", directExpenseRouter);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
