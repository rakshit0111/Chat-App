import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import {v2 as cloudinary} from "cloudinary";
import { getReceiverSocketId,io } from "../lib/socket.js";

// get all user documents from collection except the curr authenticated one
export const getUsersForSidebar = async(req,res) =>{
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({_id : {$ne : loggedInUserId}}).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log("Error in getUsersForSidebar",error.message);
        res.status(500).json({message : "Internal Server Error"});
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params; // User with whom the current user wants to chat
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        })
        .populate("senderId", "fullName profilePic") // Populate sender info
        .populate("receiverId", "fullName profilePic") // Populate receiver info
        .sort({ createdAt: 1 }); // Sort messages by creation time

        return res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image, groupId } = req.body;
        const { id } = req.params; // receiverId or unused if it's a group message
        const senderId = req.user._id;

        let imageUrl;

        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const messageData = {
            senderId,
            text,
            image: imageUrl,
        };

        // If it's a group message
        if (groupId) {
            messageData.groupId = groupId;
        } else {
            // If it's a direct message
            messageData.receiverId = id;
        }

        const newMessage = new Message(messageData);
        await newMessage.save();

        // Get populated message with sender info
        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "fullName profilePic") // Populate senderId
            .populate("receiverId", "fullName profilePic"); // Populate receiverId

        // Socket.io functionality
        if (groupId) {
            // Broadcast to all members in the group
            io.to(groupId).emit("newGroupMessage", populatedMessage);
        } else {
            // Send to specific receiver
            const receiverSocketId = getReceiverSocketId(id);
            
            if (receiverSocketId) {
                // Important: Also emit to sender's socket to update their own UI
                io.to(receiverSocketId).emit("newMessage", populatedMessage);
            }
            
            // Additionally, emit to sender's socket to update their own UI
            const senderSocketId = getReceiverSocketId(senderId.toString());
            if (senderSocketId) {
                io.to(senderSocketId).emit("newMessage", populatedMessage);
            }
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.log("Error in sendMessage controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};