import {useState} from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import "./Chat.css";

function Chat({messages, streaming, streamingText, onEditMessage, onDeleteMessage, onRateMessage}) {
    const [editingId, setEditingId] = useState("");
    const [draft, setDraft] = useState("");

    const startEdit = (message) => {
        setEditingId(message._id);
        setDraft(message.content);
    };

    const saveEdit = async() => {
        if(!draft.trim()) return;
        await onEditMessage(editingId, draft);
        setEditingId("");
        setDraft("");
    };

    return (
        <div className="messages">
            {messages.map((message) => {
                const isStreamingPlaceholder = message._id === "pending-assistant";
                const content = isStreamingPlaceholder ? streamingText : message.content;

                return (
                    <article className={`messageRow ${message.role}`} key={message._id}>
                        <div className="messageAvatar">{message.role === "user" ? "U" : "S"}</div>
                        <div className="messageBody">
                            {editingId === message._id ? (
                                <div className="editBox">
                                    <textarea value={draft} onChange={(event) => setDraft(event.target.value)} />
                                    <div>
                                        <button onClick={saveEdit}>Save</button>
                                        <button onClick={() => setEditingId("")}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                    {content || (streaming ? " " : "")}
                                </ReactMarkdown>
                            )}

                            {!isStreamingPlaceholder && (
                                <div className="messageActions">
                                    {message.role === "user" && (
                                        <button onClick={() => startEdit(message)} aria-label="Edit message" title="Edit">
                                            Edit
                                        </button>
                                    )}
                                    {message.role === "assistant" && (
                                        <>
                                            <button
                                                className={message.rating === "up" ? "selected" : ""}
                                                onClick={() => onRateMessage(message._id, message.rating === "up" ? null : "up")}
                                                aria-label="Mark as good"
                                                title="Good response"
                                            >
                                                Up
                                            </button>
                                            <button
                                                className={message.rating === "down" ? "selected" : ""}
                                                onClick={() => onRateMessage(message._id, message.rating === "down" ? null : "down")}
                                                aria-label="Mark as bad"
                                                title="Bad response"
                                            >
                                                Down
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => onDeleteMessage(message._id)} aria-label="Delete message" title="Delete">
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

export default Chat;
