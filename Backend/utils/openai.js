import "dotenv/config";
import OpenAI from "openai";

let client;

const getClient = () => {
    if(!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is missing. Add it to Backend/.env");
    }

    if(!client) {
        client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
            defaultHeaders: {
                ...(process.env.OPENAI_APP_URL ? {"HTTP-Referer": process.env.OPENAI_APP_URL} : {}),
                ...(process.env.OPENAI_APP_NAME ? {"X-Title": process.env.OPENAI_APP_NAME} : {})
            }
        });
    }

    return client;
};

const normalizeMessages = (messages) => [
    {
        role: "system",
        content: "You are SigmaGPT, a concise and helpful AI assistant. Use Markdown when it improves clarity."
    },
    ...messages.map(({role, content}) => ({role, content}))
];

export const createAssistantStream = async(messages) => {
    if(!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is missing. Add it to Backend/.env");
    }

    const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const requestBody = JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: normalizeMessages(messages),
        stream: true
    });
    const requestHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        ...(process.env.OPENAI_APP_URL ? {"HTTP-Referer": process.env.OPENAI_APP_URL} : {}),
        ...(process.env.OPENAI_APP_NAME ? {"X-Title": process.env.OPENAI_APP_NAME} : {})
    };

    let response;
    let lastError;

    for(let attempt = 1; attempt <= 2; attempt += 1) {
        try {
            response = await fetch(`${baseURL}/chat/completions`, {
                method: "POST",
                headers: requestHeaders,
                body: requestBody,
                signal: AbortSignal.timeout(45000)
            });
            break;
        } catch(err) {
            lastError = err;
            if(attempt === 2) {
                throw new Error("AI provider timeout. Please retry in a moment.");
            }
            await new Promise((resolve) => setTimeout(resolve, 1200));
        }
    }

    if(!response) {
        throw new Error(lastError?.message || "Failed to connect to AI provider");
    }

    if(!response.ok) {
        let message = `AI provider request failed with status ${response.status}`;

        try {
            const error = await response.json();
            message = error.error?.message || error.error || message;
        } catch {
            message = await response.text();
        }

        throw new Error(message);
    }

    return response.body;
};

export const readAssistantStream = async function*(body) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while(true) {
        const {done, value} = await reader.read();

        if(done) {
            break;
        }

        buffer += decoder.decode(value, {stream: true});
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for(const line of lines) {
            const trimmed = line.trim();

            if(!trimmed.startsWith("data:")) {
                continue;
            }

            const data = trimmed.slice(5).trim();

            if(data === "[DONE]") {
                return;
            }

            try {
                const event = JSON.parse(data);
                const content = event.choices?.[0]?.delta?.content;

                if(content) {
                    yield content;
                }
            } catch {
                // Ignore keepalive or provider-specific non-JSON chunks.
            }
        }
    }
};

export const streamAssistantResponse = async function*(messages) {
    const body = await createAssistantStream(messages);

    for await (const chunk of readAssistantStream(body)) {
        yield chunk;
    }
};

export const getOpenAIAPIResponse = async(messages) => {
    const response = await getClient().chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: normalizeMessages(messages)
    });

    return response.choices[0]?.message?.content?.trim() || "I could not generate a response.";
};
