import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, signup, refresh } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // login | signup
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);

    try {
      if (mode === "signup") {
        await signup(email, pass, name);
      } else {
        await login(email, pass);
      }

      await refresh();

      // ✅ send user to landing page
      navigate("/", { replace: true });
    } catch (err) {
      setMsg(err?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-light" style={{ minHeight: "100vh" }}>
      <div className="container py-5" style={{ maxWidth: 560 }}>
        <div className="text-center mb-4">
          <span className="badge text-bg-dark">HireFind</span>
          <h2 className="fw-bold mt-3 mb-1">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <div className="text-muted">
            Login to continue. Your role is managed in your profile.
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            {/* Mode Toggle */}
            <div className="d-flex gap-2 mb-4">
              <button
                type="button"
                className={`btn w-50 ${mode === "login" ? "btn-dark" : "btn-outline-dark"}`}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={`btn w-50 ${mode === "signup" ? "btn-dark" : "btn-outline-dark"}`}
                onClick={() => setMode("signup")}
              >
                Sign up
              </button>
            </div>

            {/* Info line */}
            <div className="alert alert-warning py-2 px-3 small mb-3">
              🚧 Under production — roles: <b>candidate</b> / <b>company</b> / <b>admin</b>
            </div>

            <form onSubmit={submit} className="d-grid gap-3">
              {mode === "signup" && (
                <div className="input-group">
                  <span className="input-group-text bg-white">👤</span>
                  <input
                    className="form-control"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="input-group">
                <span className="input-group-text bg-white">📧</span>
                <input
                  className="form-control"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-group-text bg-white">🔒</span>
                <input
                  className="form-control"
                  placeholder="Password"
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
              </div>

              <button className="btn btn-primary btn-lg" disabled={busy}>
                {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Login"}
              </button>
            </form>

            {msg && (
              <div className="alert alert-danger mt-3 mb-0 py-2 small">
                {msg}
              </div>
            )}

            <div className="text-center mt-4 small text-muted">
              By continuing you agree this is a demo project built but soon will become commercial. No data is shared with third parties. Use fake info if you want.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}