import React, { useState } from "react";

const USERS_DB_KEY = "goovo_registered_users_db";

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLoginMode, setIsLoginMode] = useState(false); // false = Signup, true = Login
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  // Sign Up / Register Handler
  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim() || !phone.trim() || !password.trim()) {
      setErrorMsg("⚠️ Meherbani karke saari fields bharein!");
      return;
    }

    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY)) || [];

    // Check karein kya yeh naam ya phone number pehle se registered hai
    const existingUser = users.find(
      (u) => 
        (u.phone && u.phone.trim() === phone.trim()) || 
        (u.name && u.name.trim().toLowerCase() === name.trim().toLowerCase())
    );

    if (existingUser) {
      setErrorMsg("⚠️ Yeh Name ya Phone Number pehle se permanent registered hai! Dubara account nahi ban sakta.");
      return;
    }

    // Naya user create karein
    const newUser = {
      name: name.trim(),
      phone: phone.trim(),
      password: password.trim(),
      coins: 1000, // Starting bonus coins
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(newUser));

    setSuccessMsg("✅ Account permanently register ho gaya!");
    setTimeout(() => {
      onLoginSuccess(newUser);
      onClose();
    }, 1500);
  };

  // Login Handler
  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY)) || [];

    const foundUser = users.find(
      (u) => u.phone.trim() === phone.trim() && u.password === password
    );

    if (!foundUser) {
      setErrorMsg("❌ Ghalat Phone Number ya Password! Pehle Sign Up karein.");
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(foundUser));
    setSuccessMsg("✅ Login Successful!");
    setTimeout(() => {
      onLoginSuccess(foundUser);
      onClose();
    }, 1200);
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#fff" }}>
            {isLoginMode ? "🔑 Account Login" : "📝 Permanent Sign Up"}
          </h3>
          <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        </div>

        <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "20px" }}>
          {isLoginMode 
            ? "Apne registered phone number se login karein." 
            : "Google ki tarah aik naam aur number se sirf aik hi permanent account ban sakta hai."}
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
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={modalStyles.input}
            />
          </div>

          {errorMsg && <div style={modalStyles.errorBox}>{errorMsg}</div>}
          {successMsg && <div style={modalStyles.successBox}>{successMsg}</div>}

          <button type="submit" style={modalStyles.submitBtn}>
            {isLoginMode ? "Login Now" : "Register Permanently"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <button 
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