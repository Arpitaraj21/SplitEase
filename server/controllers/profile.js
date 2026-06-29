import bcrypt, { hash } from "bcrypt";
import User from "../models/users.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import multer from "multer";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";


export const handleGetProfileDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(userId);
        const user = await User.findById(userId).select("-password -refreshToken");

        if (!user) {
            return res.status(401).json({
                message: "User not found",
                success: false
            })
        }

        res.status(200).json({
            message: "Profile details fetched successfully",
            user,
            success: true,
        })
    } catch (error) {
        console.log("error in get profile controller", error);
        res.status(500).json({
            message: "Internal Server Error!",
            success: false
        })
    }
}


export const handleUpdateProfileDetails = async (req, res) => {
    try {
        const userId = req.user.id;

        const { name, username, password, profileImage } = req.body;
        let updatedFields = {};

        if (name) updatedFields.name = name;
        if (username) updatedFields.username = username;
        if (profileImage) updatedFields.profileImage = profileImage;
        if (password) updatedFields.password = await bcrypt.hash(password, 12);

        const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, { new: true }).select("-password -refreshToken");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        return res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
            success: true
        });
    } catch (error) {
        console.log("error in update profile controller", error);
        res.status(500).json({
            message: "Internal Server Error",
            success: false
        })
    }
}


export const handleUploadProfileImage = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({
                message: "No image file provided",
                success: false
            });
        }

        // Build the URL path for the uploaded file
        const profileImage = `/uploads/profiles/${req.file.filename}`;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profileImage },
            { new: true }
        ).select("-password -refreshToken");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        return res.status(200).json({
            message: "Profile image uploaded successfully",
            user: updatedUser,
            profileImage,
            success: true
        });
    } catch (error) {
        console.log("error in upload profile image", error);
        res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
};


export const handleDeleteUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(401).json({
                message: "User not found",
                status: false
            })
        }

        return res.status(200).json({
            message: "Deleted the user successfully",
            success: true
        })

    } catch (error) {
        console.log("error in deleting the data", error);
        res.status(500).json({
            message: 'Internal servr error',
            success: false
        })
    }
}


// Search users by name or email (for contacts/invitations)
export const handleSearchUsers = async (req, res) => {
    try {
        const userId = req.user.id;
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(200).json({
                message: "Provide at least 2 characters to search",
                users: [],
                success: true,
            });
        }

        const query = q.trim();
        const users = await User.find({
            _id: { $ne: userId }, // exclude current user
            $or: [
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
                { username: { $regex: query, $options: "i" } },
            ],
        })
            .select("name email username profileImage")
            .limit(10);

        return res.status(200).json({
            message: "Users found",
            users,
            success: true,
        });
    } catch (error) {
        console.log("error in search users", error);
        res.status(500).json({
            message: "Internal Server Error",
            success: false,
        });
    }
};
