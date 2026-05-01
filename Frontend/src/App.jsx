import {useCallback, useEffect, useMemo, useState} from "react";
import AuthPage from "./AuthPage";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import {apiRequest, streamAssistant} from "./api";
import "./App.css";

const storedSession = () => {
    try {
        return JSON.parse(localStorage.getItem("sigmagpt-session")) || {};
    } catch {
        return {};
    }
};

function App() {
    const initialSession = useMemo(storedSession, []);
    const [token, setToken] = useState(initialSession.token || "");
    const [user, setUser] = useState(initialSession.user || null);
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const [error, setError] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isAuthed = Boolean(token && user);

    const saveSession = (data) => {
        localStorage.setItem("sigmagpt-session", JSON.stringify(data));
        setToken(data.token);
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem("sigmagpt-session");
        setToken("");
        setUser(null);
        setChats([]);
        setActiveChat(null);
    };

    const loadChats = useCallback(async() => {
        if(!token) return;
        const data = await apiRequest("/chats", {token});
        setChats(data);
    }, [token]);

    const loadChat = async(chatId) => {
        setError("");
        setLoading(true);

        try {
            const data = await apiRequest(`/chats/${chatId}`, {token});
            setActiveChat(data);
        } catch(err) {
            if(err.status === 400 || err.status === 404) {
                setActiveChat(null);
                await loadChats();
            }

            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(!token) return;

        loadChats().catch((err) => {
            if(err.status === 401) {
                logout();
                return;
            }

            setError(err.message);
        });
    }, [token, loadChats]);

    const sendMessage = async(message) => {
        const cleanMessage = message.trim();
        if(!cleanMessage || streaming) return;

        setError("");
        setStreaming(true);
        setStreamingText("");

        const tempChat = activeChat || {
            _id: null,
            title: cleanMessage.slice(0, 60),
            messages: []
        };

        setActiveChat({
            ...tempChat,
            messages: [
                ...tempChat.messages,
                {_id: "pending-user", role: "user", content: cleanMessage},
                {_id: "pending-assistant", role: "assistant", content: ""}
            ]
        });

        try {
            let fullReply = "";
            const chatId = await streamAssistant({
                token,
                chatId: activeChat?._id,
                message: cleanMessage,
                onChunk: (chunk) => {
                    fullReply += chunk;
                    setStreamingText(fullReply);
                }
            });

            const savedChat = await apiRequest(`/chats/${chatId}`, {token});
            setActiveChat(savedChat);
            await loadChats();
        } catch(err) {
            setError(err.message);
        } finally {
            setStreaming(false);
            setStreamingText("");
        }
    };

    const regenerate = async() => {
        if(!activeChat?._id || streaming) return;

        setError("");
        setStreaming(true);
        setStreamingText("");

        const messages = [...activeChat.messages];
        if(messages[messages.length - 1]?.role === "assistant") {
            messages.pop();
        }
        setActiveChat({...activeChat, messages: [...messages, {_id: "pending-assistant", role: "assistant", content: ""}]});

        try {
            let fullReply = "";
            const chatId = await streamAssistant({
                token,
                chatId: activeChat._id,
                regenerate: true,
                onChunk: (chunk) => {
                    fullReply += chunk;
                    setStreamingText(fullReply);
                }
            });

            const savedChat = await apiRequest(`/chats/${chatId}`, {token});
            setActiveChat(savedChat);
            await loadChats();
        } catch(err) {
            setError(err.message);
        } finally {
            setStreaming(false);
            setStreamingText("");
        }
    };

    const createChat = () => {
        setActiveChat(null);
        setError("");
        setSidebarOpen(false);
    };

    const renameChat = async(chatId, title) => {
        if(!title.trim()) return;

        try {
            const updated = await apiRequest(`/chats/${chatId}`, {
                method: "PATCH",
                token,
                body: {title}
            });

            setChats((items) => items.map((chat) => chat._id === chatId ? {...chat, title: updated.title} : chat));
            if(activeChat?._id === chatId) {
                setActiveChat(updated);
            }
        } catch(err) {
            setError(err.message);
        }
    };

    const deleteChat = async(chatId) => {
        try {
            await apiRequest(`/chats/${chatId}`, {method: "DELETE", token});
            setChats((items) => items.filter((chat) => chat._id !== chatId));

            if(activeChat?._id === chatId) {
                setActiveChat(null);
            }
        } catch(err) {
            setError(err.message);
        }
    };

    const updateMessage = async(messageId, content) => {
        if(!activeChat?._id) return;

        const updated = await apiRequest(`/chats/${activeChat._id}/messages/${messageId}`, {
            method: "PATCH",
            token,
            body: {content}
        });
        setActiveChat(updated);
        await loadChats();
    };

    const rateMessage = async(messageId, rating) => {
        if(!activeChat?._id) return;

        const updated = await apiRequest(`/chats/${activeChat._id}/messages/${messageId}`, {
            method: "PATCH",
            token,
            body: {rating}
        });
        setActiveChat(updated);
    };

    const deleteMessage = async(messageId) => {
        if(!activeChat?._id) return;

        const updated = await apiRequest(`/chats/${activeChat._id}/messages/${messageId}`, {
            method: "DELETE",
            token
        });
        setActiveChat(updated);
        await loadChats();
    };

    if(!isAuthed) {
        return <AuthPage onAuth={saveSession} />;
    }

    const selectChat = async(chatId) => {
        await loadChat(chatId);
        setSidebarOpen(false);
    };

    return (
        <div className="appShell">
            <div
                className={`sidebarBackdrop ${sidebarOpen ? "open" : ""}`}
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
            />
            <Sidebar
                user={user}
                chats={chats}
                activeChatId={activeChat?._id}
                isOpen={sidebarOpen}
                onNewChat={createChat}
                onSelectChat={selectChat}
                onRenameChat={renameChat}
                onDeleteChat={deleteChat}
                onLogout={logout}
                onClose={() => setSidebarOpen(false)}
            />
            <ChatWindow
                chat={activeChat}
                loading={loading}
                streaming={streaming}
                streamingText={streamingText}
                error={error}
                onSendMessage={sendMessage}
                onRegenerate={regenerate}
                onEditMessage={updateMessage}
                onDeleteMessage={deleteMessage}
                onRateMessage={rateMessage}
                onToggleSidebar={() => setSidebarOpen((open) => !open)}
            />
        </div>
    );
}

export default App;
