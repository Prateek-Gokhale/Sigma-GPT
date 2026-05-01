import {useEffect, useRef, useState} from "react";
import Chat from "./Chat";
import "./ChatWindow.css";

function ChatWindow({
    chat,
    loading,
    streaming,
    streamingText,
    error,
    onSendMessage,
    onRegenerate,
    onEditMessage,
    onDeleteMessage,
    onRateMessage,
    onToggleSidebar
}) {
    const [message, setMessage] = useState("");
    const bottomRef = useRef(null);
    const messages = chat?.messages || [];

    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages.length, streamingText]);

    const submit = (event) => {
        event.preventDefault();
        onSendMessage(message);
        setMessage("");
    };

    return (
        <main className="chatWindow">
            <header className="chatHeader">
                <button className="menuButton" onClick={onToggleSidebar} aria-label="Open sidebar">
                    <span />
                    <span />
                    <span />
                </button>
                <div>
                    <p>{chat ? "ChatGPT clone" : "New chat"}</p>
                    <h1>{chat?.title || "Ask SigmaGPT anything"}</h1>
                </div>

                <div className="chatHeaderActions">
                    <button disabled={!chat?._id || streaming} onClick={onRegenerate}>
                        Regenerate
                    </button>
                </div>
            </header>

            <section className="chatScroller">
                {!chat && messages.length === 0 && (
                    <div className="welcomeState">
                        <h2>How can I help?</h2>
                        <p>Start a conversation. Your chats are saved to your account.</p>
                    </div>
                )}

                {loading ? (
                    <div className="statusText">Loading chat...</div>
                ) : (
                    <Chat
                        messages={messages}
                        streaming={streaming}
                        streamingText={streamingText}
                        onEditMessage={onEditMessage}
                        onDeleteMessage={onDeleteMessage}
                        onRateMessage={onRateMessage}
                    />
                )}

                {error && <div className="errorBanner">{error}</div>}
                <div ref={bottomRef} />
            </section>

            <form className="composer" onSubmit={submit}>
                <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(event) => {
                        if(event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            submit(event);
                        }
                    }}
                    placeholder="Message SigmaGPT"
                    disabled={streaming}
                    rows={1}
                />
                <button disabled={streaming || !message.trim()}>
                    {streaming ? "..." : ">"}
                </button>
            </form>
        </main>
    );
}

export default ChatWindow;
