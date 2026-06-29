import Group from "../models/group.js";
import User from "../models/users.js";
import Invitation from "../models/invitation.js";
import crypto from "crypto";

// Create a new group
export const handleCreateGroup = async (req, res) => {
  try {
    const { name, description, category, memberEmails } = req.body;
    const adminId = req.user.id;

    const newGroup = await Group.create({
      name,
      description,
      category: category || "other",
      admin: adminId,
      members: [adminId],
    });

    // If memberEmails provided, send invitations
    if (memberEmails && memberEmails.length > 0) {
      for (const email of memberEmails) {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        const token = crypto.randomBytes(32).toString("hex");

        await Invitation.create({
          group: newGroup._id,
          invitedBy: adminId,
          invitedUser: existingUser?._id || null,
          invitedEmail: email.toLowerCase(),
          method: "email",
          token,
        });

        // If user already exists in system, add them directly
        if (existingUser) {
          newGroup.members.push(existingUser._id);
        }
      }
      await newGroup.save();
    }

    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members", "name email username profileImage")
      .populate("admin", "name email username");

    return res.status(201).json({
      message: "Group created successfully",
      group: populatedGroup,
      success: true,
    });
  } catch (error) {
    console.log("error in create group", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Get all groups for current user
export const handleGetGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await Group.find({ members: userId })
      .populate("members", "name email username profileImage")
      .populate("admin", "name email username")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      message: "Groups fetched successfully",
      groups,
      success: true,
    });
  } catch (error) {
    console.log("error in get groups", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Get single group details
export const handleGetGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId)
      .populate("members", "name email username profileImage")
      .populate("admin", "name email username");

    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    const isMember = group.members.some(
      (member) => member._id.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied", success: false });
    }

    return res.status(200).json({
      message: "Group details fetched",
      group,
      success: true,
    });
  } catch (error) {
    console.log("error in get group by id", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Update group
export const handleUpdateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const { name, description, category } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    if (group.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can update group", success: false });
    }

    const updatedFields = {};
    if (name) updatedFields.name = name;
    if (description !== undefined) updatedFields.description = description;
    if (category) updatedFields.category = category;

    const updatedGroup = await Group.findByIdAndUpdate(groupId, updatedFields, { new: true })
      .populate("members", "name email username profileImage")
      .populate("admin", "name email username");

    return res.status(200).json({
      message: "Group updated successfully",
      group: updatedGroup,
      success: true,
    });
  } catch (error) {
    console.log("error in update group", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Delete group
export const handleDeleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    if (group.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can delete group", success: false });
    }

    await Group.findByIdAndDelete(groupId);

    return res.status(200).json({
      message: "Group deleted successfully",
      success: true,
    });
  } catch (error) {
    console.log("error in delete group", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Add member to group
export const handleAddMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    if (group.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can add members", success: false });
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase() });

    if (!userToAdd) {
      // User doesn't exist — create invitation
      const token = crypto.randomBytes(32).toString("hex");
      await Invitation.create({
        group: group._id,
        invitedBy: userId,
        invitedEmail: email.toLowerCase(),
        method: "email",
        token,
      });

      return res.status(200).json({
        message: "Invitation sent. User will be added once they join.",
        success: true,
        invited: true,
      });
    }

    if (group.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: "User is already a member", success: false });
    }

    group.members.push(userToAdd._id);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "name email username profileImage")
      .populate("admin", "name email username");

    return res.status(200).json({
      message: "Member added successfully",
      group: updatedGroup,
      success: true,
    });
  } catch (error) {
    console.log("error in add member", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Remove member from group
export const handleRemoveMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    if (group.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can remove members", success: false });
    }

    if (memberId === userId) {
      return res.status(400).json({ message: "Admin cannot remove themselves", success: false });
    }

    group.members = group.members.filter((m) => m.toString() !== memberId);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "name email username profileImage")
      .populate("admin", "name email username");

    return res.status(200).json({
      message: "Member removed successfully",
      group: updatedGroup,
      success: true,
    });
  } catch (error) {
    console.log("error in remove member", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};
