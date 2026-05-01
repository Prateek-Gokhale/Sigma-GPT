import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chats.js";
import aiRoutes from "./routes/ai.js";
import {apiLimiter} from "./middleware/rateLimiter.js";

const app = express();
const PORT = process.env.PORT || 8080;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(express.json({limit: "1mb"}));
app.use(cors({
    origin: CLIENT_URL,
    credentials: true,
    exposedHeaders: ["X-Chat-Id"]
}));
app.use(apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/ai", aiRoutes);

app.get("/health", (req, res) => {
    res.json({status: "ok"});
});

const connectDB = async() => {
    if(!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is missing. Add it to Backend/.env");
    }

    if(!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is missing. Add it to Backend/.env");
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected with Database!");
    } catch(err) {
        console.log("Failed to connect with DB", err);
        throw err;
    }
};

const startServer = async() => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch(err) {
        console.error("Server failed to start:", err.message);
        process.exit(1);
    }
};

startServer();
