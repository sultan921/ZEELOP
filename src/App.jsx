import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";

import Earn from "./Earn";
import Wallet from "./Wallet";
import Profile from "./Profile";
import LuckyDraw from "./LuckyDraw";
import Winner from "./Winner";import PrivacyPolicy, { Terms, RefundPolicy } from "./PolicyPages";
import { LanguageProvider, useLanguage } from "./LanguageContext";

// 🌐 LIVE BACKEND URL CONFIGURED
const BACKEND_URL = "https://zeelop-production.up.railway.app";

function MainApp() {
  const { lang, setLang, currency, setCurrency, t, activeCurrency, convertCoins } = useLanguage();
  const navigate = useNavigate ? useNavigate() : null;

  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false); // false = Signup, true = Login

  // Password Show/Hide Toggle State
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [inputName, setInputName] = useState("");
  const [inputPhone, setInputPhone] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Persistent User Session
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("goovoCurrentUser");
    return saved ? JSON.parse(saved) : null;
  });

  // Updated starting coins to 0 instead of 1000
  const [coins, setCoins] = useState(() => {
    const savedUser = localStorage.getItem("goovoCurrentUser");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return parsed.coins ?? Number(localStorage.getItem("goovoCoins")) ?? 0;
    }
    return Number(localStorage.getItem("goovoCoins")) || 0;
  });

  const [pendingPayments, setPendingPayments] = useState(() => {
    const saved = localStorage.getItem("goovoPendingPayments");
    return saved ? JSON.parse(saved) : [];
  });

  const [message, setMessage] = useState({ text: "", type: "success" });

  // Save session & coins
  useEffect(() => {
    if (user) {
      localStorage.setItem("goovoCurrentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("goovoCurrentUser");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("goovoCoins", coins);
    if (user) {
      setUser((prev) => (prev ? { ...prev, coins } : null));
    }
  }, [coins]);

  useEffect(() => {
    localStorage.setItem("goovoPendingPayments", JSON.stringify(pendingPayments));
  }, [pendingPayments]);

  // 🔗 BACKEND LINKED: Permanent Sign Up Handler via Live Railway Backend API
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!inputName.trim() || !inputPhone.trim() || !inputPassword.trim()) {
      setAuthError("⚠️ Meherbani karke saari fields bharein!");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inputName.trim(),
          phone: inputPhone.trim(),
          password: inputPassword.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(`⚠️ ${data.error || "Registration failed!"}`);
        return;
      }

      setUser(data.user);
      if (typeof data.user.coins === "number") {
        setCoins(data.user.coins);
      }

      setAuthSuccess("✅ Account permanently database me register ho gaya!");
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthSuccess("");
        setInputName("");
        setInputPhone("");
        setInputPassword("");
      }, 1200);

    } catch (err) {
      setAuthError("❌ Backend server se connection nahi ho saka! Check karein server chal raha hai ya nahi.");
    }
  };

  // 🔗 BACKEND LINKED: Login Handler via Live Railway Backend API
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!inputPhone.trim() || !inputPassword.trim()) {
      setAuthError("⚠️ Phone number aur password dono likhein!");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: inputPhone.trim(),
          password: inputPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(`❌ ${data.error || "Ghalat Phone Number ya Password!"}`);
        return;
      }

      setUser(data.user);
      if (typeof data.user.coins === "number") {
        setCoins(data.user.coins);
      }

      setAuthSuccess("✅ Login Successful from Database!");
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthSuccess("");
        setInputPhone("");
        setInputPassword("");
      }, 1000);

    } catch (err) {
      setAuthError("❌ Backend server se connection nahi ho saka!");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("goovoCurrentUser");
    triggerNotification("👋 Logged out successfully!", "info");
    setPage("home");
  };

  const addCoins = (amount, customMessage) => {
    setCoins((prev) => prev + amount);
    triggerNotification(customMessage || `🎉 You earned ${amount} coins!`, "success");
  };

  const deductCoins = (amount, customMessage) => {
    if (coins < amount) {
      triggerNotification("⚠️ Insufficient coins balance!", "error");
      return false;
    }
    setCoins((prev) => prev - amount);
    triggerNotification(customMessage || `💸 Paid ${amount} coins successfully!`, "info");
    return true;
  };

  const submitPaymentProof = (paymentData) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const newEntry = {
      id: "TRX-" + Date.now(),
      userName: user.name || "User",
      userPhone: user.phone || "N/A",
      ...paymentData,
      status: "pending_verification",
      createdAt: new Date().toISOString()
    };
    setPendingPayments((prev) => [newEntry, ...prev]);
    triggerNotification("🚀 Receipt submitted successfully!", "success");
  };

  const triggerNotification = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "success" }), 3000);
  };

  const navigateToPage = (newPage) => {
    if (!user && (newPage === "earn" || newPage === "wallet" || newPage === "luckyDraw")) {
      triggerNotification("🔒 Feature access ke liye pehle Login / Signup karein!", "error");
      setShowAuthModal(true);
      return;
    }
    setPage(newPage);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="navbar" style={inlineStyles.navbar}>
        <div className="nav-left-group" style={inlineStyles.navLeftGroup}>
          <div className="brand" onClick={() => navigateToPage("home")} style={{ cursor: "pointer" }}>
            <span>ZEELOP</span>
          </div>

          <div className="header-controls" style={inlineStyles.headerControls}>
            <div className="compact-pill" style={inlineStyles.compactPill}>
              <span className="pill-icon">🌐</span>
              <select value={lang} onChange={(e) => setLang(e.target.value)} className="compact-select" style={inlineStyles.compactSelect}>
                <option value="UR">UR</option>
                <option value="EN">EN</option>
                <option value="HI">HI</option>
              </select>
            </div>

            <div className="compact-pill" style={inlineStyles.compactPill}>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="compact-select" style={inlineStyles.compactSelect}>
                <option value="PKR">PKR</option>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
        </div>

        <div className="nav-links" style={inlineStyles.navLinks}>
          <button className={page === "home" ? "active" : ""} style={inlineStyles.navBtn} onClick={() => navigateToPage("home")}>{t.home}</button>
          <button className={page === "earn" ? "active" : ""} style={inlineStyles.navBtn} onClick={() => navigateToPage("earn")}>{t.earn}</button>
          <button className={page === "luckyDraw" ? "active" : ""} style={inlineStyles.navBtn} onClick={() => navigateToPage("luckyDraw")}>{t.luckyDraw}</button>
          <button className={page === "winner" ? "active" : ""} style={inlineStyles.navBtn} onClick={() => navigateToPage("winner")}>Winners</button>
          <button className={page === "wallet" ? "active" : ""} style={inlineStyles.navBtn} onClick={() => navigateToPage("wallet")}>{t.wallet}</button>
          <button className={page === "profile" ? "active" : ""} style={inlineStyles.navBtn} onClick={() => navigateToPage("profile")}>{t.profile}</button>
          <button className={page === "privacy" ? "active" : ""} style={inlineStyles.navBtn} onClick={() => navigateToPage("privacy")}>Privacy</button>
          <button className={page === "terms" ? "active" : ""} style={inlineStyles.navBtn} onClick={() => navigateToPage("terms")}>Terms</button>
          <button className={page === "refund" ? "active" : ""} style={inlineStyles.navBtn} onClick={() => navigateToPage("refund")}>Refund</button>

          {/* AUTH BUTTONS IN NAVBAR */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: "bold" }}>👤 {user.name}</span>
              <button onClick={handleLogout} style={inlineStyles.logoutBtn}>Logout</button>
            </div>
          ) : (
            <button onClick={() => { setIsLoginMode(false); setShowAuthModal(true); }} style={inlineStyles.loginNavBtn}>
              Login / Signup
            </button>
          )}
        </div>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} style={inlineStyles.menuToggle}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="mobile-menu" style={inlineStyles.mobileMenu}>
          <button style={inlineStyles.mobileMenuBtn} onClick={() => navigateToPage("home")}>🏠 {t.home}</button>
          <button style={inlineStyles.mobileMenuBtn} onClick={() => navigateToPage("earn")}>🎮 {t.earn}</button>
          <button style={inlineStyles.mobileMenuBtn} onClick={() => navigateToPage("luckyDraw")}>🎁 {t.luckyDraw}</button>
          <button style={inlineStyles.mobileMenuBtn} onClick={() => navigateToPage("winner")}>🏆 Winners</button>
          <button style={inlineStyles.mobileMenuBtn} onClick={() => navigateToPage("wallet")}>💰 {t.wallet}</button>
          <button style={inlineStyles.mobileMenuBtn} onClick={() => navigateToPage("profile")}>👤 {t.profile}</button>
          <button style={inlineStyles.mobileMenuBtn} onClick={() => navigateToPage("privacy")}>🛡️ Privacy Policy</button>
          <button style={inlineStyles.mobileMenuBtn} onClick={() => navigateToPage("terms")}>📄 Terms & Conditions</button>
          <button style={inlineStyles.mobileMenuBtn} onClick={() => navigateToPage("refund")}>🔄 Refund Policy</button>
          {user ? (
            <button onClick={handleLogout} style={{ ...inlineStyles.mobileMenuBtn, color: "#ef4444" }}>🚪 Logout ({user.name})</button>
          ) : (
            <button onClick={() => { setMenuOpen(false); setIsLoginMode(false); setShowAuthModal(true); }} style={{ ...inlineStyles.mobileMenuBtn, color: "#38bdf8" }}>🔑 Login / Signup</button>
          )}
        </div>
      )}

      {/* TOAST */}
      {message.text && (
        <div className={`toast-notification ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* PAGES ROUTING */}
      {page === "home" && (
        <main>
          <section className="hero">
            <div className="hero-content">
              <p className="small-title">{t.welcome}</p>
              <h1>{t.heroTitle1}<span>{t.heroTitle2}</span></h1>
              <p className="description">{t.heroSub}</p>
            </div>
          </section>

          <section className="balance-section">
            <div className="balance-card">
              <div>
                <p className="card-label">{t.yourBalance}</p>
                <h2>🪙 {coins.toLocaleString()} Coins</h2>
                <p className="usd">≈ {activeCurrency.symbol}{convertCoins(coins)} {currency}</p>
              </div>
              <div className="coin-icon">🪙</div>
            </div>
          </section>

          <section className="section">
            <div className="cards">
              <div className="action-card">
                <div className="card-icon">🎮</div>
                <h3>{t.earnCoinsTitle}</h3>
                <p>{t.earnCoinsDesc}</p>
                <button className="primary-button" onClick={() => navigateToPage("earn")}>{t.startEarning}</button>
              </div>

              <div className="action-card">
                <div className="card-icon">🎁</div>
                <h3>{t.luckyDrawTitle}</h3>
                <p>{t.luckyDrawDesc}</p>
                <button className="primary-button" onClick={() => navigateToPage("luckyDraw")}>{t.enterLuckyDraw}</button>
              </div>

              <div className="action-card">
                <div className="card-icon">🏆</div>
                <h3>Recent Winners</h3>
                <p>Check out our latest lucky draw winners!</p>
                <button className="primary-button" onClick={() => navigateToPage("winner")}>View Winners</button>
              </div>
            </div>
          </section>
        </main>
      )}

      {page === "earn" && <Earn addCoins={addCoins} user={user} navigate={navigateToPage} />}

      {page === "luckyDraw" && (
        <LuckyDraw
          coins={coins}
          deductCoins={deductCoins}
          submitPaymentProof={submitPaymentProof}
          user={user}
          navigate={navigateToPage}
          currency={currency}
        />
      )}

      {page === "winner" && <Winner />}

      {page === "wallet" && (
        <Wallet
          coins={coins}
          user={user}
          pendingPayments={pendingPayments}
          deductCoins={deductCoins}
          navigate={navigateToPage}
        />
      )}

      {page === "profile" && (
        <Profile
          user={user || { name: "Guest User", phone: "Not Logged In", coins: coins }}
          setUser={setUser}
          coins={coins}
          navigate={navigateToPage}
          onOpenAuth={() => setShowAuthModal(true)}
        />
      )}

      {page === "privacy" && <PrivacyPolicy navigate={navigateToPage} />}
      {page === "terms" && <Terms navigate={navigateToPage} />}
      {page === "refund" && <RefundPolicy navigate={navigateToPage} />}

      {/* PROFESSIONAL SIGN UP / LOGIN MODAL WITH EYE ICON */}
      {showAuthModal && (
        <div style={inlineStyles.modalOverlay}>
          <div style={inlineStyles.modalCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, color: "#fff", fontSize: "18px" }}>
                {isLoginMode ? "🔑 Database Login" : "📝 Database Sign Up"}
              </h3>
              <button onClick={() => setShowAuthModal(false)} style={inlineStyles.closeBtn}>✕</button>
            </div>

            <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "18px", lineHeight: "1.4" }}>
              {isLoginMode 
                ? "Apne registered phone number aur password se MongoDB se login karein." 
                : "Naya account direct backend database me save hoga."}
            </p>

            <form onSubmit={isLoginMode ? handleLoginSubmit : handleRegisterSubmit}>
              {!isLoginMode && (
                <div style={{ marginBottom: "12px" }}>
                  <label style={inlineStyles.label}>Aapka Naam (Name)</label>
                  <input
                    type="text"
                    placeholder="Misal: Amir"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    style={inlineStyles.input}
                  />
                </div>
              )}

              <div style={{ marginBottom: "12px" }}>
                <label style={inlineStyles.label}>Phone Number</label>
                <input
                  type="text"
                  placeholder="Misal: 03001234567"
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value)}
                  style={inlineStyles.input}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={inlineStyles.label}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    style={{ ...inlineStyles.input, paddingRight: "40px" }}
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

              {authError && <div style={inlineStyles.errorBox}>{authError}</div>}
              {authSuccess && <div style={inlineStyles.successBox}>{authSuccess}</div>}

              <button type="submit" style={inlineStyles.submitBtn}>
                {isLoginMode ? "Login via Database" : "Register to Database"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "14px" }}>
              <button 
                type="button"
                onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(""); setAuthSuccess(""); }}
                style={inlineStyles.switchTextBtn}
              >
                {isLoginMode ? "Account nahi hai? Sign Up karein" : "Pehle se account hai? Login karein"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer>
        <div className="footer-brand"><strong>ZEELOP</strong></div>
        <p>{t.footerSub}</p>
        <small>© 2026 ZEELOP. Official App Version</small>
      </footer>
    </div>
  );
}

// Inline Styles Object for Compact Header and Professional Layout
const inlineStyles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 16px",
    flexWrap: "wrap",
    gap: "8px"
  },
  navLeftGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  headerControls: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  compactPill: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "4px",
    padding: "2px 4px",
    border: "1px solid rgba(255,255,255,0.1)"
  },
  compactSelect: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "11px",
    cursor: "pointer",
    outline: "none"
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexWrap: "wrap"
  },
  navBtn: {
    background: "transparent",
    border: "none",
    color: "#cbd5e1",
    fontSize: "12px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
    fontWeight: "500",
    transition: "all 0.2s"
  },
  loginNavBtn: {
    background: "#0284c7",
    color: "#fff",
    borderRadius: "5px",
    border: "none",
    padding: "5px 10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "11px",
  },
  logoutBtn: {
    background: "#ef4444",
    color: "#fff",
    borderRadius: "5px",
    border: "none",
    padding: "4px 8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "11px",
  },
  menuToggle: {
    display: "none",
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "20px",
    cursor: "pointer"
  },
  mobileMenu: {
    display: "flex",
    flexDirection: "column",
    background: "#1e293b",
    padding: "10px",
    borderRadius: "8px",
    gap: "6px",
    marginTop: "6px",
    border: "1px solid #334155"
  },
  mobileMenuBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    textAlign: "left",
    padding: "8px 10px",
    fontSize: "13px",
    borderRadius: "4px",
    cursor: "pointer"
  },
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  modalCard: {
    background: "#1e293b",
    color: "#fff",
    padding: "24px",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "380px",
    boxShadow: "0 15px 30px rgba(0,0,0,0.5)",
    border: "1px solid #334155",
    boxSizing: "border-box",
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
    padding: "11px",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
  },
  switchTextBtn: {
    background: "transparent",
    border: "none",
    color: "#38bdf8",
    fontSize: "12px",
    cursor: "pointer",
    textDecoration: "underline",
  },
  errorBox: {
    background: "#7f1d1d",
    color: "#fca5a5",
    padding: "9px",
    borderRadius: "6px",
    marginBottom: "12px",
    fontSize: "12px",
  },
  successBox: {
    background: "#14532d",
    color: "#86efac",
    padding: "9px",
    borderRadius: "6px",
    marginBottom: "12px",
    fontSize: "12px",
  }
};

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainApp />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}