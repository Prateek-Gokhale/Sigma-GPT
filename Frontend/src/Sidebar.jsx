import {useState} from "react";
import "./Sidebar.css";

function Sidebar({
    user,
    chats,
    activeChatId,
    isOpen,
    onNewChat,
    onSelectChat,
    onRenameChat,
    onDeleteChat,
    onLogout,
    onClose
}) {
    const [editingId, setEditingId] = useState("");
    const [draftTitle, setDraftTitle] = useState("");

    const startRename = (chat) => {
        setEditingId(chat._id);
        setDraftTitle(chat.title);
    };

    const submitRename = async(event) => {
        event.preventDefault();
        await onRenameChat(editingId, draftTitle);
        setEditingId("");
        setDraftTitle("");
    };

    return (
        <aside className={`sidebar ${isOpen ? "open" : ""}`}>
            <div className="sidebarTop">
                <div className="sidebarHeader">
                    <button className="newChatButton" onClick={onNewChat}>
                        <span>+</span>
                        New chat
                    </button>
                    <button className="closeSidebarButton" onClick={onClose} aria-label="Close sidebar">
                        x
                    </button>
                </div>
                
                <button className="newChatButton desktopOnly" onClick={onNewChat}>
                    <span>+</span>
                    New chat
                </button>

                <nav className="chatHistory" aria-label="Previous chats">
                    {chats.length === 0 && <p className="emptyHistory">No chats yet</p>}

                    {chats.map((chat) => (
                        <div className={`historyItem ${chat._id === activeChatId ? "active" : ""}`} key={chat._id}>
                            {editingId === chat._id ? (
                                <form onSubmit={submitRename} className="renameForm">
                                    <input
                                        value={draftTitle}
                                        onChange={(event) => setDraftTitle(event.target.value)}
                                        onBlur={submitRename}
                                        autoFocus
                                    />
                                </form>
                            ) : (
                                <button className="historyTitle" onClick={() => onSelectChat(chat._id)}>
                                    {chat.title}
                                </button>
                            )}

                            <div className="historyActions">
                                <button title="Rename chat" onClick={() => startRename(chat)}>Edit</button>
                                <button title="Delete chat" onClick={() => onDeleteChat(chat._id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            <div className="sidebarUser">
                <div>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                </div>
                <button onClick={onLogout}>Log out</button>
            </div>
        </aside>
    );
}

export default Sidebar;
