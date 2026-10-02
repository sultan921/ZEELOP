import React, { useState } from "react";

// 🌐 LIVE BACKEND URL
const BACKEND_URL = "https://my-react-backend-production-84e7.up.railway.app";

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim() || !phone.trim() || !password.trim()) {
      setErrorMsg("⚠️ Meherbani karke saari fields bharein!");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(`⚠️ ${data.error || "Registration failed!"}`);
        return;
      }

      localStorage.setItem("currentUser", JSON.stringify(data.user));
      if (typeof data.user.coins === "number") {
        localStorage.setItem("goovoCoins", data.user.coins);
      }

      setSuccessMsg("✅ Account successfully created!");
      setTimeout(() => {
        onLoginSuccess(data.user);
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg("❌ Server se connection nahi ho saka. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg("");
    setSuccessMsg("");

    if (!phone.trim() || !password.trim()) {
      setErrorMsg("⚠️ Phone number aur password dono likhein!");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(`❌ ${data.error || "Ghalat Phone Number ya Password!"}`);
        return;
      }

      localStorage.setItem("currentUser", JSON.stringify(data.user));
      if (typeof data.user.coins === "number") {
        localStorage.setItem("goovoCoins", data.user.coins);
      }

      setSuccessMsg("✅ Login successful!");
      setTimeout(() => {
        onLoginSuccess(data.user);
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg("❌ Server se connection nahi ho saka. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeSwitch = () => {
    if (isSubmitting) return;
    setIsLoginMode(!isLoginMode);
    setErrorMsg("");
    setSuccessMsg("");
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.card}>
        <div style={modalStyles.header}>
          <div>
            <div style={modalStyles.badge}>
              {isLoginMode ? "🔐 SECURE ACCESS" : "✨ CREATE ACCOUNT"}
            </div>
            <h3 style={modalStyles.title}>
              {isLoginMode ? "Welcome Back" : "Join Us"}
            </h3>
            <p style={modalStyles.subtitle}>
              {isLoginMode
                ? "Apne account mein securely login karein."
                : "Apna account create karein aur shuru karein."}
            </p>
          </div>

          <button
            onClick={onClose}
            style={modalStyles.closeBtn}
            disabled={isSubmitting}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={isLoginMode ? handleLogin : handleRegister}>
          {!isLoginMode && (
            <div style={modalStyles.fieldGroup}>
              <label style={modalStyles.label}>Aapka Naam</label>
              <div style={modalStyles.inputWrap}>
                <span style={modalStyles.inputIcon}>👤</span>
                <input
                  type="text"
                  placeholder="Misal: Amir"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={modalStyles.input}
                  disabled={isSubmitting}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div style={modalStyles.fieldGroup}>
            <label style={modalStyles.label}>Phone Number</label>
            <div style={modalStyles.inputWrap}>
              <span style={modalStyles.inputIcon}>📱</span>
              <input
                type="text"
                placeholder="03001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={modalStyles.input}
                disabled={isSubmitting}
                autoComplete="tel"
              />
            </div>
          </div>

          <div style={modalStyles.fieldGroup}>
            <label style={modalStyles.label}>Password</label>
            <div style={modalStyles.inputWrap}>
              <span style={modalStyles.inputIcon}>🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={modalStyles.input}
                disabled={isSubmitting}
                autoComplete={isLoginMode ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={modalStyles.eyeBtn}
                disabled={isSubmitting}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div style={modalStyles.errorBox}>
              <span style={modalStyles.messageIcon}>!</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={modalStyles.successBox}>
              <span style={modalStyles.messageIcon}>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            style={{
              ...modalStyles.submitBtn,
              ...(isSubmitting ? modalStyles.submitBtnLoading : {})
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span style={modalStyles.loadingContent}>
                <span style={modalStyles.spinner}></span>
                <span>{isLoginMode ? "Signing in..." : "Creating account..."}</span>
              </span>
            ) : (
              <span>{isLoginMode ? "🔐 Login" : "✨ Create Account"}</span>
            )}
          </button>
        </form>

        <div style={modalStyles.divider}>
          <span style={modalStyles.dividerLine}></span>
          <span style={modalStyles.dividerText}>OR</span>
          <span style={modalStyles.dividerLine}></span>
        </div>

        <div style={modalStyles.switchArea}>
          <span style={modalStyles.switchLabel}>
            {isLoginMode ? "Account nahi hai?" : "Pehle se account hai?"}
          </span>
          <button
            type="button"
            onClick={handleModeSwitch}
            style={modalStyles.switchTextBtn}
            disabled={isSubmitting}
          >
            {isLoginMode ? "Create Account" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background:
      "radial-gradient(circle at 50% 0%, rgba(14,165,233,0.14), transparent 34%), rgba(2,6,23,0.86)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "18px",
    boxSizing: "border-box",
    zIndex: 2000,
    backdropFilter: "blur(7px)",
    WebkitBackdropFilter: "blur(7px)"
  },
  card: {
    width: "100%",
    maxWidth: "430px",
    maxHeight: "calc(100vh - 36px)",
    overflowY: "auto",
    boxSizing: "border-box",
    background:
      "linear-gradient(145deg, rgba(30,41,59,0.98), rgba(15,23,42,0.99))",
    color: "#fff",
    padding: "24px",
    borderRadius: "22px",
    border: "1px solid rgba(125,211,252,0.16)",
    boxShadow:
      "0 30px 80px rgba(0,0,0,0.55), 0 0 45px rgba(14,165,233,0.08)",
    animation: "authModalIn 0.28s ease-out"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "22px"
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 9px",
    borderRadius: "999px",
    background: "rgba(14,165,233,0.10)",
    border: "1px solid rgba(56,189,248,0.18)",
    color: "#7dd3fc",
    fontSize: "9px",
    fontWeight: "800",
    letterSpacing: "1px",
    marginBottom: "8px"
  },
  title: {
    margin: 0,
    color: "#fff",
    fontSize: "25px",
    lineHeight: 1.15,
    fontWeight: "900",
    letterSpacing: "-0.4px"
  },
  subtitle: {
    margin: "7px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: 1.5
  },
  closeBtn: {
    flexShrink: 0,
    width: "36px",
    height: "36px",
    borderRadius: "11px",
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(148,163,184,0.15)",
    color: "#cbd5e1",
    fontSize: "15px",
    cursor: "pointer"
  },
  fieldGroup: {
    marginBottom: "15px"
  },
  label: {
    display: "block",
    fontSize: "11px",
    marginBottom: "7px",
    color: "#cbd5e1",
    fontWeight: "750"
  },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "rgba(2,6,23,0.62)"
  },
  inputIcon: {
    flexShrink: 0,
    width: "40px",
    textAlign: "center",
    fontSize: "14px",
    opacity: 0.85
  },
  input: {
    width: "100%",
    minWidth: 0,
    padding: "12px 42px 12px 0",
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box"
  },
  eyeBtn: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "32px",
    height: "32px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    fontSize: "15px",
    borderRadius: "8px"
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    background: "rgba(127,29,29,0.48)",
    color: "#fca5a5",
    padding: "10px 11px",
    borderRadius: "11px",
    marginBottom: "13px",
    border: "1px solid rgba(248,113,113,0.18)",
    fontSize: "12px",
    lineHeight: 1.4
  },
  successBox: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    background: "rgba(20,83,45,0.46)",
    color: "#86efac",
    padding: "10px 11px",
    borderRadius: "11px",
    marginBottom: "13px",
    border: "1px solid rgba(74,222,128,0.18)",
    fontSize: "12px",
    lineHeight: 1.4
  },
  messageIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    fontWeight: "900",
    fontSize: "11px"
  },
  submitBtn: {
    width: "100%",
    minHeight: "48px",
    background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
    color: "#fff",
    border: "1px solid rgba(125,211,252,0.22)",
    padding: "12px 15px",
    borderRadius: "12px",
    fontWeight: "850",
    cursor: "pointer",
    fontSize: "14px",
    boxShadow: "0 10px 25px rgba(14,165,233,0.20)"
  },
  submitBtnLoading: {
    opacity: 0.92,
    cursor: "wait",
    boxShadow: "0 7px 18px rgba(14,165,233,0.14)"
  },
  loadingContent: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px"
  },
  spinner: {
    width: "17px",
    height: "17px",
    border: "2px solid rgba(255,255,255,0.30)",
    borderTop: "2px solid #fff",
    borderRight: "2px solid #fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "authButtonSpin 0.72s linear infinite"
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "20px 0 14px"
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "rgba(148,163,184,0.13)"
  },
  dividerText: {
    color: "#64748b",
    fontSize: "9px",
    fontWeight: "800",
    letterSpacing: "1px"
  },
  switchArea: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "5px",
    textAlign: "center"
  },
  switchLabel: {
    color: "#94a3b8",
    fontSize: "12px"
  },
  switchTextBtn: {
    background: "transparent",
    border: "none",
    color: "#38bdf8",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: "800",
    padding: "2px"
  }
};

if (
  typeof document !== "undefined" &&
  !document.getElementById("auth-modal-animations")
) {
  const style = document.createElement("style");
  style.id = "auth-modal-animations";
  style.textContent = `
    @keyframes authButtonSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes authModalIn {
      from {
        opacity: 0;
        transform: translateY(10px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;
  document.head.appendChild(style);
}
