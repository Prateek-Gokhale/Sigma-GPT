import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const createToken = (userId) => {
    return jwt.sign({id: userId}, process.env.JWT_SECRET, {expiresIn: "7d"});
};

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
});

router.post("/register", async(req, res) => {
    try {
        const {name, email, password} = req.body;

        if(!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({error: "Name, email, and password are required"});
        }

        if(password.length < 6) {
            return res.status(400).json({error: "Password must be at least 6 characters"});
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({email: normalizedEmail});

        if(existingUser) {
            return res.status(409).json({error: "An account with this email already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        res.status(201).json({
            user: publicUser(user),
            token: createToken(user._id)
        });
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to create account"});
    }
});

router.post("/login", async(req, res) => {
    try {
        const {email, password} = req.body;

        if(!email?.trim() || !password) {
            return res.status(400).json({error: "Email and password are required"});
        }

        const user = await User.findOne({email: email.toLowerCase().trim()});

        if(!user) {
            return res.status(401).json({error: "Invalid email or password"});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.status(401).json({error: "Invalid email or password"});
        }

        res.json({
            user: publicUser(user),
            token: createToken(user._id)
        });
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to sign in"});
    }
});

router.get("/me", auth, (req, res) => {
    res.json({user: publicUser(req.user)});
});

export default router;
