import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.SECRETKEY);

    req.user = decoded;
    next();
  } catch (error) {
    console.log("error", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};