import User from "../models/user.model";
import bcrypt, { hash } from "bcryptjs";

export const signup = async (req,res) =>{
    const {fullName,email,password} = req.body;
    try {
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
        }
        else{
            res.status(400).json({message : "Invalid credentials"})
        }
    } catch (error) {
        
    }
}

export const login = (req,res) =>{
    res.send("login route")
}

export const logout = (req,res) =>{
    res.send("logut route")
}