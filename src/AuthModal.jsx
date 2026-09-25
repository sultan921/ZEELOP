import React, { useState } from "react";

// 🌐 UPDATED LIVE BACKEND URL
const BACKEND_URL = "https://goovo-backend-production-5cc4.up.railway.app/";

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLoginMode, setIsLoginMode] = useState(false); // false = Signup, true = Login
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Eye toggle state
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  // 🔗 Sign Up / Register Handler via Backend API
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim() || !phone.trim() || !password.trim()) {
      setErrorMsg("⚠️ Meherbani karke saari fields bharein!");
      return;
    }

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

      // Save user locally for session persistence
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      if (typeof data.user.coins === "number") {
        localStorage.setItem("goovoCoins", data.user.coins);
      }

      setSuccessMsg("✅ Account permanently database me register ho gaya!");
      setTimeout(() => {
        onLoginSuccess(data.user);
        onClose();
      }, 1500);

    } catch (err) {
      setErrorMsg("❌ Backend server se connection nahi ho saka! Check karein.");
    }
  };

  // 🔗 Login Handler via Backend API
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!phone.trim() || !password.trim()) {
      setErrorMsg("⚠️ Phone number aur password dono likhein!");
      return;
    }

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

      // Save user locally for session persistence
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      if (typeof data.user.coins === "number") {
        localStorage.setItem("goovoCoins", data.user.coins);
      }

      setSuccessMsg("✅ Login Successful from Database!");
      setTimeout(() => {
        onLoginSuccess(data.user);
        onClose();
      }, 1200);

    } catch (err) {
      setErrorMsg("❌ Backend server se connection nahi ho saka!");
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#fff" }}>
            {isLoginMode ? "🔑 Database Login" : "📝 Permanent Sign Up"}
          </h3>
          <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        </div>

        <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "20px" }}>
          {isLoginMode 
            ? "Apne registered phone number aur password se database se login karein." 
            : "Naya account direct backend database me save hoga."}
        </p>

        <form onSubmit={isLoginMode ? handleLogin : handleRegister}>
          {!isLoginMode && (
            <div style={{ marginBottom: "12px" }}>
              <label style={modalStyles.label}>Aapka Naam (Name)</label>
              <input
                type="text"
                placeholder="Misal: Amir"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={modalStyles.input}
              />
            </div>
          )}

          <div style={{ marginBottom: "12px" }}>
            <label style={modalStyles.label}>Phone Number</label>
            <input
              type="text"
              placeholder="Misal: 03001234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={modalStyles.input}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={modalStyles.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...modalStyles.input, paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  fontSize: "16px"
                }}
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>

          {errorMsg && <div style={modalStyles.errorBox}>{errorMsg}</div>}
          {successMsg && <div style={modalStyles.successBox}>{successMsg}</div>}

          <button type="submit" style={modalStyles.submitBtn}>
            {isLoginMode ? "Login via Database" : "Register Permanently"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <button 
            type="button"
            onClick={() => { setIsLoginMode(!isLoginMode); setErrorMsg(""); setSuccessMsg(""); }}
            style={modalStyles.switchTextBtn}
          >
            {isLoginMode ? "Account nahi hai? Sign Up karein" : "Pehle se account hai? Login karein"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline Styles Object
const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  card: {
    background: "#1e293b",
    color: "#fff",
    padding: "25px",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "400px",
    boxShadow: "0 15px 30px rgba(0,0,0,0.5)",
    border: "1px solid #334155",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "18px",
    cursor: "pointer",
  },
  label: {
    display: "block",
    fontSize: "12px",
    marginBottom: "5px",
    color: "#cbd5e1",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #475569",
    background: "#0f172a",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  submitBtn: {
    width: "100%",
    background: "#0284c7",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
  },
  switchTextBtn: {
    background: "transparent",
    border: "none",
    color: "#38bdf8",
    fontSize: "13px",
    cursor: "pointer",
    textDecoration: "underline",
  },
  errorBox: {
    background: "#7f1d1d",
    color: "#fca5a5",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "15px",
    fontSize: "13px",
  },
  successBox: {
    background: "#14532d",
    color: "#86efac",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "15px",
    fontSize: "13px",
  }
};