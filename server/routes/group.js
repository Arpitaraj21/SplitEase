import express from "express";
import {
  handleCreateGroup,
  handleGetGroups,
  handleGetGroupById,
  handleUpdateGroup,
  handleDeleteGroup,
  handleAddMember,
  handleRemoveMember,
} from "../controllers/group.js";
import { verifyToken } from "../middlewares/authorization.js";
import { validate, createGroupValidation } from "../middlewares/validate.js";

const router = express.Router();

router.post("/groups", verifyToken, validate(createGroupValidation), handleCreateGroup);
router.get("/groups", verifyToken, handleGetGroups);
router.get("/groups/:groupId", verifyToken, handleGetGroupById);
router.patch("/groups/:groupId", verifyToken, handleUpdateGroup);
router.delete("/groups/:groupId", verifyToken, handleDeleteGroup);
router.post("/groups/:groupId/members", verifyToken, handleAddMember);
router.delete("/groups/:groupId/members/:memberId", verifyToken, handleRemoveMember);

export default router;
