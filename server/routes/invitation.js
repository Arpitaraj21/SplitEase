import express from "express";
import {
  handleSendInvitation,
  handleAcceptInvitation,
  handleDeclineInvitation,
  handleGetMyInvitations,
  handleGetInvitationByToken,
} from "../controllers/invitation.js";
import { verifyToken } from "../middlewares/authorization.js";

const router = express.Router();

router.post("/invitations", verifyToken, handleSendInvitation);
router.get("/invitations/mine", verifyToken, handleGetMyInvitations);
router.get("/invitations/:token", handleGetInvitationByToken);
router.post("/invitations/:token/accept", verifyToken, handleAcceptInvitation);
router.post("/invitations/:token/decline", verifyToken, handleDeclineInvitation);

export default router;
