import Invitation from "../models/invitation.js";
import Group from "../models/group.js";
import User from "../models/users.js";
import crypto from "crypto";

// Send invitation (email/sms/whatsapp)
export const handleSendInvitation = async (req, res) => {
  try {
    const { groupId, email, phone, method } = req.body;
    const invitedBy = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    const isMember = group.members.some((m) => m.toString() === invitedBy);
    if (!isMember) {
      return res.status(403).json({ message: "Only members can send invitations", success: false });
    }

    // Check if user already exists
    let invitedUser = null;
    if (email) {
      invitedUser = await User.findOne({ email: email.toLowerCase() });
    }

    // Check if already invited
    const existingInvite = await Invitation.findOne({
      group: groupId,
      $or: [
        { invitedEmail: email?.toLowerCase() },
        { invitedPhone: phone },
      ],
      status: "pending",
    });

    if (existingInvite) {
      return res.status(400).json({ message: "Invitation already sent", success: false });
    }

    // Check if user is already a member
    if (invitedUser && group.members.includes(invitedUser._id)) {
      return res.status(400).json({ message: "User is already a member", success: false });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const invitation = await Invitation.create({
      group: groupId,
      invitedBy,
      invitedUser: invitedUser?._id || null,
      invitedEmail: email?.toLowerCase() || null,
      invitedPhone: phone || null,
      method: method || "email",
      token,
    });

    // Generate invitation link
    const inviteLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/invite/${token}`;

    // Generate share messages based on method
    let shareMessage = "";
    const inviter = await User.findById(invitedBy).select("name");

    if (method === "whatsapp") {
      shareMessage = `Hey! ${inviter.name} invited you to join "${group.name}" on SplitEase for splitting expenses. Join here: ${inviteLink}`;
    } else if (method === "sms") {
      shareMessage = `${inviter.name} invited you to "${group.name}" on SplitEase. Join: ${inviteLink}`;
    } else {
      shareMessage = `You've been invited to join "${group.name}" on SplitEase by ${inviter.name}. Click to join: ${inviteLink}`;
    }

    const populatedInvite = await Invitation.findById(invitation._id)
      .populate("group", "name")
      .populate("invitedBy", "name email")
      .populate("invitedUser", "name email");

    return res.status(201).json({
      message: "Invitation created successfully",
      invitation: populatedInvite,
      inviteLink,
      shareMessage,
      success: true,
    });
  } catch (error) {
    console.log("error in send invitation", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Accept invitation
export const handleAcceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    const invitation = await Invitation.findOne({ token, status: "pending" });

    if (!invitation) {
      return res.status(404).json({ message: "Invalid or expired invitation", success: false });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired";
      await invitation.save();
      return res.status(400).json({ message: "Invitation has expired", success: false });
    }

    // Add user to group
    const group = await Group.findById(invitation.group);
    if (!group) {
      return res.status(404).json({ message: "Group no longer exists", success: false });
    }

    if (group.members.includes(userId)) {
      invitation.status = "accepted";
      await invitation.save();
      return res.status(200).json({ message: "You are already a member", success: true, groupId: group._id });
    }

    group.members.push(userId);
    await group.save();

    invitation.status = "accepted";
    invitation.invitedUser = userId;
    await invitation.save();

    return res.status(200).json({
      message: "Invitation accepted! You are now a member.",
      groupId: group._id,
      success: true,
    });
  } catch (error) {
    console.log("error in accept invitation", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Decline invitation
export const handleDeclineInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token, status: "pending" });
    if (!invitation) {
      return res.status(404).json({ message: "Invalid invitation", success: false });
    }

    invitation.status = "declined";
    await invitation.save();

    return res.status(200).json({
      message: "Invitation declined",
      success: true,
    });
  } catch (error) {
    console.log("error in decline invitation", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Get pending invitations for current user
export const handleGetMyInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const invitations = await Invitation.find({
      $or: [
        { invitedUser: userId },
        { invitedEmail: user.email },
      ],
      status: "pending",
    })
      .populate("group", "name description category")
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Invitations fetched",
      invitations,
      success: true,
    });
  } catch (error) {
    console.log("error in get invitations", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Get invitation details by token (for public accept page)
export const handleGetInvitationByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token })
      .populate("group", "name description")
      .populate("invitedBy", "name");

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found", success: false });
    }

    return res.status(200).json({
      message: "Invitation details",
      invitation,
      success: true,
    });
  } catch (error) {
    console.log("error in get invitation by token", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};
