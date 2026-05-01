import {useState} from "react";
import {apiRequest} from "./api";
import "./AuthPage.css";

function AuthPage({onAuth}) {
    const [mode, setMode] = useState("login");
    const [form, setForm] = useState({name: "", email: "", password: ""});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async(event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await apiRequest(`/auth/${mode}`, {
                method: "POST",
                body: form
            });

            onAuth(data);
        } catch(err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="authPage">
            <section className="authPanel">
                <div>
                    <p className="eyebrow">SigmaGPT</p>
                    <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
                </div>

                <form onSubmit={handleSubmit} className="authForm">
                    {mode === "register" && (
                        <label>
                            Name
                            <input
                                value={form.name}
                                onChange={(event) => setForm({...form, name: event.target.value})}
                                placeholder="Ada Lovelace"
                                autoComplete="name"
                            />
                        </label>
                    )}

                    <label>
                        Email
                        <input
                            type="email"
                            value={form.email}
                            onChange={(event) => setForm({...form, email: event.target.value})}
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            value={form.password}
                            onChange={(event) => setForm({...form, password: event.target.value})}
                            placeholder="Minimum 6 characters"
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                        />
                    </label>

                    {error && <p className="formError">{error}</p>}

                    <button className="primaryButton" disabled={loading}>
                        {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
                    </button>
                </form>

                <button
                    className="textButton"
                    onClick={() => {
                        setError("");
                        setMode(mode === "login" ? "register" : "login");
                    }}
                >
                    {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
                </button>
            </section>
        </main>
    );
}

export default AuthPage;
