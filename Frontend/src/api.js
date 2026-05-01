const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api";

const parseError = async(response) => {
    try {
        const data = await response.json();
        return data.error || "Request failed";
    } catch {
        return "Request failed";
    }
};

export const apiRequest = async(path, {method = "GET", token, body} = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? {Authorization: `Bearer ${token}`} : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });

    if(!response.ok) {
        const error = new Error(await parseError(response));
        error.status = response.status;
        throw error;
    }

    return response.json();
};

export const streamAssistant = async({token, chatId, message, regenerate = false, onChunk}) => {
    const response = await fetch(`${API_BASE_URL}/ai/stream`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({chatId, message, regenerate})
    });

    if(!response.ok) {
        throw new Error(await parseError(response));
    }

    const streamedChatId = response.headers.get("X-Chat-Id");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while(true) {
        const {done, value} = await reader.read();

        if(done) {
            break;
        }

        onChunk(decoder.decode(value, {stream: true}));
    }

    return streamedChatId;
};
