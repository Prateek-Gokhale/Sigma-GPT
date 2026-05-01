import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async(req, res, next) => {
    try {
        const header = req.headers.authorization;
        const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

        if(!token) {
            return res.status(401).json({error: "Authentication required"});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if(!user) {
            return res.status(401).json({error: "User not found"});
        }

        req.user = user;
        next();
    } catch(err) {
        return res.status(401).json({error: "Invalid or expired token"});
    }
};

export default auth;
