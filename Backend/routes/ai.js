import express from "express";
import Chat from "../models/Chat.js";
import auth from "../middleware/auth.js";
import {aiLimiter} from "../middleware/rateLimiter.js";
import {createAssistantStream, readAssistantStream} from "../utils/openai.js";

const router = express.Router();

router.post("/stream", auth, aiLimiter, async(req, res) => {
    try {
        const {chatId, message, regenerate} = req.body;
        const cleanMessage = message?.trim();
        let chat = chatId ? await Chat.findOne({_id: chatId, userId: req.user._id}) : null;

        if(chatId && !chat) {
            return res.status(404).json({error: "Chat not found"});
        }

        if(!chat) {
            if(!cleanMessage) {
                return res.status(400).json({error: "Message is required"});
            }

            chat = await Chat.create({
                userId: req.user._id,
                title: cleanMessage.slice(0, 60),
                messages: []
            });
        }

        if(regenerate) {
            const lastMessage = chat.messages[chat.messages.length - 1];

            if(lastMessage?.role === "assistant") {
                chat.messages.pop();
            }

            if(!chat.messages.some((item) => item.role === "user")) {
                return res.status(400).json({error: "No user message to regenerate from"});
            }
        } else {
            if(!cleanMessage) {
                return res.status(400).json({error: "Message is required"});
            }

            chat.messages.push({role: "user", content: cleanMessage});

            if(chat.messages.length === 1) {
                chat.title = cleanMessage.slice(0, 60);
            }
        }

        if(!process.env.OPENAI_API_KEY) {
            return res.status(500).json({error: "OPENAI_API_KEY is missing on the server"});
        }

        const streamBody = await createAssistantStream(chat.messages);

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "X-Chat-Id": chat._id.toString()
        });

        let assistantContent = "";

        for await (const chunk of readAssistantStream(streamBody)) {
            assistantContent += chunk;
            res.write(chunk);
        }

        chat.messages.push({
            role: "assistant",
            content: assistantContent || "I could not generate a response."
        });
        chat.updatedAt = new Date();
        await chat.save();
        res.end();
    } catch(err) {
        console.log(err);

        if(res.headersSent) {
            res.write("\n\n[Error: AI response failed]");
            return res.end();
        }

        res.status(500).json({error: err.message || "AI response failed"});
    }
});

export default router;
