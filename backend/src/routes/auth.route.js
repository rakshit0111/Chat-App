import express from "express"
import { login, logout, signup, updateProfile,checkAuth} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup",signup)

router.post("/login",login)

router.post("/logout",logout)

router.put("/update-profile",protectRoute,updateProfile)

router.get("/check",protectRoute,checkAuth);//Main authentication check done by protectRoute middleware only end result shown by check Auth

export default router;