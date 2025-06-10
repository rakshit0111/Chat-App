import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { 
    createGroup, 
    getGroups, 
    getGroupById,
    addMember, 
    removeMember, 
    getGroupMessages,
    updateGroup 
} from "../controllers/group.controller.js";

const router = express.Router();

// Group management routes
router.post("/", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
router.get("/:id", protectRoute, getGroupById);
router.put("/:id", protectRoute, updateGroup);

// Group members management
router.post("/:id/members", protectRoute, addMember);
router.delete("/:id/members", protectRoute, removeMember);

// Group messages
router.get("/:id/messages", protectRoute, getGroupMessages);

export default router;
