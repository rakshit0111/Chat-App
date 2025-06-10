import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";

// Create a new group
export const createGroup = async (req, res) => {
    try {
        const { name, description, members, profilePic } = req.body;
        const admin = req.user._id;

        let profilePicUrl = "";
        if (profilePic) {
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            profilePicUrl = uploadResponse.secure_url;
        }

        // Ensure admin is not counted twice
        const uniqueMembers = [...new Set([...members, admin.toString()])];

        const newGroup = new Group({
            name,
            description,
            members: uniqueMembers,
            admin,
            profilePic: profilePicUrl,
        });

        await newGroup.save();

        // Populate members info for frontend
        const populatedGroup = await Group.findById(newGroup._id).populate("members", "fullName profilePic");

        res.status(201).json(populatedGroup);
    } catch (error) {
        console.log("Error in createGroup controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get all groups for a user
export const getGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const groups = await Group.find({ members: userId })
            .populate("members", "fullName profilePic")
            .populate("admin", "fullName");

        res.status(200).json(groups);
    } catch (error) {
        console.log("Error in getGroups controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get a specific group
export const getGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const group = await Group.findOne({ _id: id, members: userId })
            .populate("members", "fullName profilePic")
            .populate("admin", "fullName");

        if (!group) {
            return res.status(404).json({ message: "Group not found or you don't have access" });
        }

        res.status(200).json(group);
    } catch (error) {
        console.log("Error in getGroupById controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Add member to group
export const addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { memberId } = req.body;
        const userId = req.user._id;

        // Check if user is admin
        const group = await Group.findOne({ _id: id, admin: userId });
        if (!group) {
            return res.status(403).json({ message: "Only group admin can add members" });
        }

        // Check if user is already a member
        if (group.members.includes(memberId)) {
            return res.status(400).json({ message: "User is already a member of this group" });
        }

        // Add member while preserving all existing fields
        const updatedGroup = await Group.findByIdAndUpdate(
            id,
            { $addToSet: { members: memberId } },
            { new: true }
        ).populate("members", "fullName profilePic");

        // Notify members about new addition
        io.to(id).emit("groupUpdated", updatedGroup);

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.log("Error in addMember controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Remove member from group
export const removeMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { memberId } = req.body;
        const userId = req.user._id;

        // Check if user is admin or removing self
        const group = await Group.findById(id);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        const isAdmin = group.admin.toString() === userId.toString();
        const isSelfRemoval = memberId === userId.toString();

        if (!isAdmin && !isSelfRemoval) {
            return res.status(403).json({ message: "Only group admin can remove other members" });
        }

        // Prevent admin from being removed
        if (memberId === group.admin.toString() && !isSelfRemoval) {
            return res.status(400).json({ message: "Group admin cannot be removed" });
        }

        // Update while preserving all other fields
        const updatedGroup = await Group.findByIdAndUpdate(
            id,
            { $pull: { members: memberId } },
            { new: true }
        ).populate("members", "fullName profilePic");

        // Notify members about member removal
        io.to(id).emit("groupUpdated", updatedGroup);

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.log("Error in removeMember controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get messages for a specific group
export const getGroupMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Verify user is a member of the group
        const isMember = await Group.exists({ _id: id, members: userId });
        if (!isMember) {
            return res.status(403).json({ message: "You're not a member of this group" });
        }

        const messages = await Message.find({ groupId: id })
            .populate("senderId", "fullName profilePic") // Populate sender info
            .sort({ createdAt: 1 }); // Sort messages by creation time

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getGroupMessages controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Update group details
export const updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, profilePic } = req.body;
        const userId = req.user._id;

        // Check if user is admin
        const group = await Group.findOne({ _id: id, admin: userId });
        if (!group) {
            return res.status(403).json({ message: "Only group admin can update the group" });
        }

        const updateData = { name, description };

        if (profilePic && profilePic !== group.profilePic) {
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            updateData.profilePic = uploadResponse.secure_url;
        }

        const updatedGroup = await Group.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate("members", "fullName profilePic");

        // Notify members about group update
        io.to(id).emit("groupUpdated", updatedGroup);

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.log("Error in updateGroup controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
