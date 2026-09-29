import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
// import "./App.css";

import Earn from "./Earn";
import Wallet from "./Wallet";
import Profile from "./Profile";
import LuckyDraw from "./LuckyDraw";
import Winner from "./Winner";
import PrivacyPolicy, { Terms, RefundPolicy } from "./PolicyPages";
import { LanguageProvider, useLanguage } from "./LanguageContext";
import Bannerad from "./Bannerad";
// import NativeBanner from "./NativeBanner";

// 🌐 LIVE BACKEND URL CONFIGURED
const BACKEND_URL = "https://my-react-backend-production-84e7.up.railway.app";

function MainApp() {
  const { lang, setLang, currency, setCurrency, t, activeCurrency, convertCoins } = useLanguage();
  const navigate = useNavigate ? useNavigate() : null;

  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [legalDropdownOpen, setLegalDropdownOpen] = useState(false); // 📂 For Desktop Legal Dropdown
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);

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
      setUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, coins };
        updateUserCoinsInDatabase(updated.phone, coins);
        return updated;
      });
    }
  }, [coins]);

  useEffect(() => {
    localStorage.setItem("goovoPendingPayments", JSON.stringify(pendingPayments));
  }, [pendingPayments]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = viewportWidth <= 700;
  const isTablet = viewportWidth > 700 && viewportWidth <= 1100;
  const navStyles = getResponsiveNavStyles(isMobile, isTablet);

  const updateUserCoinsInDatabase = async (phone, newCoins) => {
    try {
      await fetch(`${BACKEND_URL}/api/user/update-coins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, coins: newCoins })
      });
    } catch (err) {
      console.error("Failed to sync coins with backend:", err);
    }
  };

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
      setAuthError("❌ Backend server se connection nahi ho saka!");
    }
  };

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
    setLegalDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app">
      {/* RESPONSIVE PROFESSIONAL NAVBAR */}
      <nav className="navbar" style={navStyles.navbar}>
        <div className="nav-left-group" style={navStyles.navLeftGroup}>
          <div
            className="brand"
            onClick={() => navigateToPage("home")}
            style={navStyles.brand}
          >
            <span style={navStyles.brandMark}>Z</span>
            <span>SAMATKAAR</span>
          </div>

          {!isMobile && (
            <div className="header-controls" style={navStyles.headerControls}>
              <div className="compact-pill" style={navStyles.compactPill}>
                <span style={navStyles.pillIcon}>🌐</span>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="compact-select"
                  style={navStyles.compactSelect}
                  aria-label="Language"
                >
                  <option value="UR">UR</option>
                  <option value="EN">EN</option>
                  <option value="HI">HI</option>
                </select>
              </div>

              <div className="compact-pill" style={navStyles.compactPill}>
                <span style={navStyles.pillIcon}>💱</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="compact-select"
                  style={navStyles.compactSelect}
                  aria-label="Currency"
                >
                  <option value="PKR">PKR</option>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {!isMobile ? (
          <div className="nav-links" style={navStyles.navLinks}>
            <button className={page === "home" ? "active" : ""} style={navStyles.navBtn} onClick={() => navigateToPage("home")}>
              {t.home}
            </button>
            <button className={page === "earn" ? "active" : ""} style={navStyles.navBtn} onClick={() => navigateToPage("earn")}>
              {t.earn}
            </button>
            <button className={page === "luckyDraw" ? "active" : ""} style={navStyles.navBtn} onClick={() => navigateToPage("luckyDraw")}>
              {t.luckyDraw}
            </button>
            <button className={page === "winner" ? "active" : ""} style={navStyles.navBtn} onClick={() => navigateToPage("winner")}>
              Winners
            </button>
            <button className={page === "wallet" ? "active" : ""} style={navStyles.navBtn} onClick={() => navigateToPage("wallet")}>
              {t.wallet}
            </button>
            <button className={page === "profile" ? "active" : ""} style={navStyles.navBtn} onClick={() => navigateToPage("profile")}>
              {t.profile}
            </button>

            {/* 📂 Grouped About Us / Legal Dropdown for Desktop */}
            <div style={{ position: "relative" }}>
              <button
                style={navStyles.navBtn}
                onClick={() => setLegalDropdownOpen(!legalDropdownOpen)}
              >
                About Us ▾
              </button>
              {legalDropdownOpen && (
                <div style={navStyles.dropdownMenu}>
                  <button style={navStyles.dropdownItem} onClick={() => navigateToPage("privacy")}>🛡️ Privacy Policy</button>
                  <button style={navStyles.dropdownItem} onClick={() => navigateToPage("terms")}>📄 Terms & Conditions</button>
                  <button style={navStyles.dropdownItem} onClick={() => navigateToPage("refund")}>🔄 Refund Policy</button>
                </div>
              )}
            </div>

            {user ? (
              <div style={navStyles.userArea}>
                <span style={navStyles.userName}>👤 {user.name}</span>
                <button onClick={handleLogout} style={navStyles.logoutBtn}>
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsLoginMode(false);
                  setShowAuthModal(true);
                }}
                style={navStyles.loginNavBtn}
              >
                Login / Signup
              </button>
            )}
          </div>
        ) : (
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            style={navStyles.menuToggle}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span style={navStyles.menuIcon}>{menuOpen ? "✕" : "☰"}</span>
          </button>
        )}
      </nav>

      {/* 📱 FLUID MOBILE MENU (Fixed overlay wrapper ensuring instant access right near the top) */}
      {menuOpen && isMobile && (
        <div className="mobile-menu" style={navStyles.mobileMenu}>
          <div style={navStyles.mobileMenuHeader}>
            <div>
              <div style={navStyles.mobileMenuTitle}>SAMATKAAR</div>
              <div style={navStyles.mobileMenuSub}>Quick Navigation</div>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              style={navStyles.mobileCloseBtn}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <div style={navStyles.mobileMenuGrid}>
            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("home")}>🏠 <span>{t.home}</span></button>
            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("earn")}>🎮 <span>{t.earn}</span></button>
            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("luckyDraw")}>🎁 <span>{t.luckyDraw}</span></button>
            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("winner")}>🏆 <span>Winners</span></button>
            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("wallet")}>💰 <span>{t.wallet}</span></button>
            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("profile")}>👤 <span>{t.profile}</span></button>
            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("privacy")}>🛡️ <span>Privacy</span></button>
            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("terms")}>📄 <span>Terms</span></button>
            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("refund")}>🔄 <span>Refund</span></button>
          </div>

          <div style={navStyles.mobileSettings}>
            <div style={navStyles.mobileSettingItem}>
              <span>🌐 Language</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                style={navStyles.mobileSelect}
              >
                <option value="UR">UR</option>
                <option value="EN">EN</option>
                <option value="HI">HI</option>
              </select>
            </div>

            <div style={navStyles.mobileSettingItem}>
              <span>💱 Currency</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={navStyles.mobileSelect}
              >
                <option value="PKR">PKR</option>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {user ? (
            <button onClick={handleLogout} style={navStyles.mobileLogoutBtn}>
              🚪 Logout <span>({user.name})</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setMenuOpen(false);
                setIsLoginMode(false);
                setShowAuthModal(true);
              }}
              style={navStyles.mobileLoginBtn}
            >
              🔑 Login / Signup
            </button>
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

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div style={navStyles.modalOverlay}>
          <div style={navStyles.modalCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, color: "#fff", fontSize: "18px" }}>
                {isLoginMode ? "🔑 Database Login" : "📝 Database Sign Up"}
              </h3>
              <button onClick={() => setShowAuthModal(false)} style={navStyles.closeBtn}>✕</button>
            </div>

            <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "18px", lineHeight: "1.4" }}>
              {isLoginMode
                ? "Apne registered phone number aur password se database se login karein."
                : "Naya account direct backend database me save hoga."}
            </p>

            <form onSubmit={isLoginMode ? handleLoginSubmit : handleRegisterSubmit}>
              {!isLoginMode && (
                <div style={{ marginBottom: "12px" }}>
                  <label style={navStyles.label}>Aapka Naam (Name)</label>
                  <input
                    type="text"
                    placeholder="Misal: Amir"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    style={navStyles.input}
                  />
                </div>
              )}

              <div style={{ marginBottom: "12px" }}>
                <label style={navStyles.label}>Phone Number</label>
                <input
                  type="text"
                  placeholder="Misal: 03001234567"
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value)}
                  style={navStyles.input}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={navStyles.label}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    style={{ ...navStyles.input, paddingRight: "40px" }}
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

              {authError && <div style={navStyles.errorBox}>{authError}</div>}
              {authSuccess && <div style={navStyles.successBox}>{authSuccess}</div>}

              <button type="submit" style={navStyles.submitBtn}>
                {isLoginMode ? "Login via Database" : "Register to Database"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(""); setAuthSuccess(""); }}
                style={navStyles.switchTextBtn}
              >
                {isLoginMode ? "Account nahi hai? Sign Up karein" : "Pehle se account hai? Login karein"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div>

        <div style={{ width: "100%", background: "#0f172a", padding: "10px 0" }}>
          <p style={{ textAlign: "center", fontSize: "10px", color: "#64748b", margin: "0 0 5px 0" }}>Sponsored Ad</p>
          <Bannerad />
        </div>
      </div>

      <div>
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <a
            href="https://www.profitableratecpmnetwork.com/swuv1uz8?key=5fec83873e63f363d7048230b2d1b7ef"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#22c55e",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "15px",
              display: "inline-block",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
            }}
          >
            🎁 Bonus Reward Claim Karein (Smartlink)
          </a>
        </div>
      </div>

      <footer>
        <div className="footer-brand"><strong>SAMATKAAR</strong></div>
        <p>{t.footerSub}</p>
        <small>© 2026 SAMATKAAR. Official App Version</small>
      </footer>
    </div>
  );
}

const getResponsiveNavStyles = (isMobile, isTablet) => {
  return {
    navbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 16px",
      background: "#1e293b",
      borderBottom: "1px solid #334155",
      position: "sticky",
      top: 0,
      zIndex: 1000,
    },
    navLeftGroup: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    brand: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
      fontWeight: "800",
      fontSize: "18px",
      color: "#38bdf8",
    },
    brandMark: {
      background: "#0284c7",
      color: "#fff",
      width: "28px",
      height: "28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "6px",
      fontSize: "14px",
    },
    headerControls: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    compactPill: {
      display: "flex",
      alignItems: "center",
      background: "rgba(255, 255, 255, 0.06)",
      borderRadius: "4px",
      padding: "2px 6px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
    pillIcon: {
      fontSize: "11px",
      marginRight: "4px",
    },
    compactSelect: {
      background: "transparent",
      border: "none",
      color: "#fff",
      fontSize: "11px",
      cursor: "pointer",
      outline: "none",
    },
    navLinks: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    navBtn: {
      background: "transparent",
      border: "none",
      color: "#cbd5e1",
      fontSize: "12px",
      cursor: "pointer",
      padding: "6px 10px",
      borderRadius: "4px",
      fontWeight: "500",
    },
    dropdownMenu: {
      position: "absolute",
      top: "100%",
      right: 0,
      background: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "6px",
      boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
      display: "flex",
      flexDirection: "column",
      minWidth: "150px",
      padding: "6px",
      zIndex: 1100,
    },
    dropdownItem: {
      background: "transparent",
      border: "none",
      color: "#cbd5e1",
      textAlign: "left",
      padding: "8px 10px",
      fontSize: "12px",
      cursor: "pointer",
      borderRadius: "4px",
    },
    loginNavBtn: {
      background: "#0284c7",
      color: "#fff",
      borderRadius: "5px",
      border: "none",
      padding: "6px 12px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "11px",
    },
    userArea: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    userName: {
      fontSize: "12px",
      color: "#38bdf8",
      fontWeight: "600",
    },
    logoutBtn: {
      background: "#ef4444",
      color: "#fff",
      borderRadius: "5px",
      border: "none",
      padding: "5px 10px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "11px",
    },
    menuToggle: {
      background: "transparent",
      border: "none",
      color: "#fff",
      fontSize: "22px",
      cursor: "pointer",
      outline: "none",
    },
    menuIcon: {
      display: "inline-block",
    },
    mobileMenu: {
      display: "flex",
      flexDirection: "column",
      background: "#1e293b",
      padding: "16px",
      gap: "12px",
      borderBottom: "1px solid #334155",
      position: "fixed", // 📌 Fixed directly under the top navbar for instant chipka hua layout
      top: "50px",
      left: 0,
      right: 0,
      zIndex: 1500,
      boxShadow: "0 10px 20px rgba(0,0,0,0.4)",
    },
    mobileMenuHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid #334155",
      paddingBottom: "8px",
    },
    mobileMenuTitle: {
      fontWeight: "800",
      fontSize: "15px",
      color: "#38bdf8",
    },
    mobileMenuSub: {
      fontSize: "10px",
      color: "#94a3b8",
    },
    mobileCloseBtn: {
      background: "transparent",
      border: "none",
      color: "#fff",
      fontSize: "18px",
      cursor: "pointer",
    },
    mobileMenuGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr", // 📌 3 column grid taake saare options aik hi screen par compactly fit ho jayein bagair lambe scroll ke
      gap: "6px",
    },
    mobileMenuBtn: {
      background: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      color: "#fff",
      textAlign: "center",
      padding: "8px 4px",
      fontSize: "11px",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
    },
    mobileSettings: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      background: "rgba(0, 0, 0, 0.2)",
      padding: "8px",
      borderRadius: "6px",
    },
    mobileSettingItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      color: "#cbd5e1",
      fontSize: "11px",
    },
    mobileSelect: {
      background: "#0f172a",
      border: "1px solid #475569",
      color: "#fff",
      borderRadius: "4px",
      padding: "3px 6px",
      fontSize: "11px",
      outline: "none",
    },
    mobileLoginBtn: {
      background: "#0284c7",
      color: "#fff",
      border: "none",
      padding: "8px",
      borderRadius: "6px",
      fontWeight: "bold",
      fontSize: "12px",
      cursor: "pointer",
      textAlign: "center",
    },
    mobileLogoutBtn: {
      background: "#ef4444",
      color: "#fff",
      border: "none",
      padding: "8px",
      borderRadius: "6px",
      fontWeight: "bold",
      fontSize: "12px",
      cursor: "pointer",
      textAlign: "center",
    },
    modalOverlay: {
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      justifyContext: "center",
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
      color: " #fff",
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