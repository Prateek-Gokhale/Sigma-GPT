import express from "express";
import mongoose from "mongoose";
import Chat from "../models/Chat.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.get("/", async(req, res) => {
    try {
        const chats = await Chat.find({userId: req.user._id})
            .select("title createdAt updatedAt messages")
            .sort({updatedAt: -1});

        res.json(chats.map((chat) => ({
            _id: chat._id,
            title: chat.title,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            messageCount: chat.messages.length
        })));
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch chats"});
    }
});

router.post("/", async(req, res) => {
    try {
        const title = req.body.title?.trim() || "New chat";
        const chat = await Chat.create({
            userId: req.user._id,
            title,
            messages: []
        });

        res.status(201).json(chat);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to create chat"});
    }
});

router.get("/:chatId", async(req, res) => {
    try {
        if(!mongoose.Types.ObjectId.isValid(req.params.chatId)) {
            return res.status(400).json({error: "Invalid chat id"});
        }

        const chat = await Chat.findOne({_id: req.params.chatId, userId: req.user._id});

        if(!chat) {
            return res.status(404).json({error: "Chat not found"});
        }

        res.json(chat);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch chat"});
    }
});

router.patch("/:chatId", async(req, res) => {
    try {
        if(!mongoose.Types.ObjectId.isValid(req.params.chatId)) {
            return res.status(400).json({error: "Invalid chat id"});
        }

        const title = req.body.title?.trim();

        if(!title) {
            return res.status(400).json({error: "Title is required"});
        }

        const chat = await Chat.findOneAndUpdate(
            {_id: req.params.chatId, userId: req.user._id},
            {title: title.slice(0, 80), updatedAt: new Date()},
            {new: true}
        );

        if(!chat) {
            return res.status(404).json({error: "Chat not found"});
        }

        res.json(chat);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to rename chat"});
    }
});

router.delete("/:chatId", async(req, res) => {
    try {
        if(!mongoose.Types.ObjectId.isValid(req.params.chatId)) {
            return res.status(400).json({error: "Invalid chat id"});
        }

        const chat = await Chat.findOneAndDelete({_id: req.params.chatId, userId: req.user._id});

        if(!chat) {
            return res.status(404).json({error: "Chat not found"});
        }

        res.json({success: true});
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to delete chat"});
    }
});

router.patch("/:chatId/messages/:messageId", async(req, res) => {
    try {
        if(!mongoose.Types.ObjectId.isValid(req.params.chatId) || !mongoose.Types.ObjectId.isValid(req.params.messageId)) {
            return res.status(400).json({error: "Invalid id"});
        }

        const content = req.body.content?.trim();
        const rating = req.body.rating;
        const chat = await Chat.findOne({_id: req.params.chatId, userId: req.user._id});

        if(!chat) {
            return res.status(404).json({error: "Chat not found"});
        }

        const message = chat.messages.id(req.params.messageId);

        if(!message) {
            return res.status(404).json({error: "Message not found"});
        }

        if(content !== undefined) {
            if(message.role !== "user") {
                return res.status(400).json({error: "Only user messages can be edited"});
            }

            message.content = content;
            const index = chat.messages.findIndex((item) => item._id.toString() === req.params.messageId);
            chat.messages.splice(index + 1);
        }

        if(rating !== undefined) {
            if(message.role !== "assistant") {
                return res.status(400).json({error: "Only assistant messages can be rated"});
            }

            message.rating = ["up", "down"].includes(rating) ? rating : null;
        }

        chat.updatedAt = new Date();
        await chat.save();
        res.json(chat);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to update message"});
    }
});

router.delete("/:chatId/messages/:messageId", async(req, res) => {
    try {
        if(!mongoose.Types.ObjectId.isValid(req.params.chatId) || !mongoose.Types.ObjectId.isValid(req.params.messageId)) {
            return res.status(400).json({error: "Invalid id"});
        }

        const chat = await Chat.findOne({_id: req.params.chatId, userId: req.user._id});

        if(!chat) {
            return res.status(404).json({error: "Chat not found"});
        }

        const message = chat.messages.id(req.params.messageId);

        if(!message) {
            return res.status(404).json({error: "Message not found"});
        }

        message.deleteOne();
        chat.updatedAt = new Date();
        await chat.save();
        res.json(chat);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to delete message"});
    }
});

export default router;
