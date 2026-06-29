import express from "express";
import {
  handleGetProfileDetails,
  handleUpdateProfileDetails,
  handleDeleteUserProfile,
  handleUploadProfileImage,
  handleSearchUsers,
} from '../controllers/profile.js'

import { verifyToken } from "../middlewares/authorization.js";
import { uploadProfileImage } from "../utils/upload.js";

const router = express.Router();

router.get("/profile-details", verifyToken, handleGetProfileDetails);
router.get("/users/search", verifyToken, handleSearchUsers);

router.patch("/edit-profile", verifyToken, handleUpdateProfileDetails);

router.post("/upload-profile-image", verifyToken, uploadProfileImage.single("profileImage"), handleUploadProfileImage);

router.delete('/delete-profile', verifyToken, handleDeleteUserProfile);

export default router;