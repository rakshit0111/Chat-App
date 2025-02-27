import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js"

export const signup = async (req,res) =>{
    const {fullName,email,password} = req.body;
    try {
        
        if(!fullName || !password || !email)
        {
            return res.status(400).json({message : "Some credential missing"})
        }
        if(password.length < 6)
        {
            return res.status(400).json({message : "Password length should be more than 6 characters"})
        }

        const user = await User.findOne({email});

        if(user)
            return res.status(400).json({message : "User with this email already exists"});

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = new User(
            {
                fullName,
                email,
                password : hashedPassword,
            }
        );

        if(newUser)
        {
            //JWT Token generation code
            generateToken(newUser._id,res);
            await newUser.save();

            res.status(201).json({
                _id : newUser._id,
                fullName : newUser.fullName,
                email : newUser.email,
                profilePic : newUser.profilePic,
            })
        }
        else{
            res.status(400).json({message : "Invalid credentials"})
        }
    } catch (error) {
        console.log("Error in signup controller");
        res.status(500).json({message : "Internal Server Error"});
    }
}

export const login = async (req,res) =>{
    try
    {
        const {email,password} = req.body;

        const user = await User.findOne({email}); // find document with the target email

        if(!user)
        {
            return res.status(400).json({message : "Invalid Email"});
        }

        const isPassword = await bcrypt.compare(password,user.password); // compare hashed password with user input

        if(!isPassword)
        {
            return res.status(400).json({message : "Invalid Password"})
        }

        generateToken(user._id,res);// login successfull generate new token

        res.status(200).json({
            _id : user._id,
            fullName : user.fullName,
            email : user.email,
            profilePic : user.profilePic,
        });

    }
    catch(err)
    {
        console.log("Error in login controller");
        res.status(500).json({message : "Internal Server Error"});
    }
}

export const logout = (req,res) =>{
    try{
        res.cookie("jwt","",{maxAge : 0}); // set jwt cookie empty
        res.status(200).json({message : "Logged Out"});
    }
    catch(err)
    {
        console.log("Error in logout controller");
        res.status(500).json({message : "Internal Server Error"});
    }
}

export const updateProfile = async (req,res) =>{
    try {
        const {profilePic} = req.body;
        const userId = req.user._id;// possible due to protectRoute middleware

        if(!profilePic)
        {
            return res.status(400).json({message : "Profile picture not provided"});
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic);// upload new pic in cloudinary bucket
        const updatedUser = await User.findByIdAndUpdate(userId,{profilePic : uploadResponse.secure_url},{new : true});

        return res.status(200).json(updatedUser);
    } catch (error) {
        console.log("Error in update Profile controller");
        return res.status(500).json({message : "Internal Server Error"});
    }
}

//Displaying final end result of protectRoute middleware
export const checkAuth = (req,res) =>{
    try {
        return res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in check auth controller");
        return res.status(500).json({message : "Internal Server Error"});
    }
}
