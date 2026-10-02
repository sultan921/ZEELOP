import React, { useState, useEffect } from "react";

import InviteBonusSection from "./InviteBonusSection";

import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

// import "./App.css";



import Earn from "./Earn";

import Wallet from "./Wallet";

import Profile from "./Profile";

import LuckyDraw from "./LuckyDraw";

import Winner from "./Winner";

import SamatkarGamingArena from "./SamatkarGamingArena";

import PrivacyPolicy, { Terms, RefundPolicy } from "./PolicyPages";

import { LanguageProvider, useLanguage } from "./LanguageContext";

import Bannerad from "./Bannerad";
import NativeBanner from "./NativeBanner";
import Banner320 from "./Banner320";



// 🌐 LIVE BACKEND URL CONFIGURED

const BACKEND_URL = "https://my-react-backend-production-84e7.up.railway.app";



function MainApp() {

  const { lang, setLang, currency, setCurrency, t, activeCurrency, convertCoins } = useLanguage();

  const navigate = useNavigate ? useNavigate() : null;



  const [page, setPage] = useState("home");

  const [menuOpen, setMenuOpen] = useState(false);

  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false); // Dropdown State for Desktop
  const [playDropdownOpen, setPlayDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [viewportWidth, setViewportWidth] = useState(() =>

    typeof window !== "undefined" ? window.innerWidth : 1200

  );

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

  const [isAuthLoading, setIsAuthLoading] = useState(false); // Professional Login / Signup loading state



  // Persistent User Session

  const [user, setUser] = useState(() => {

    const saved = localStorage.getItem("goovoCurrentUser");

    return saved ? JSON.parse(saved) : null;

  });



  // Coins state synced with User or LocalStorage

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



  // 📱 Responsive navbar: mobile / tablet / desktop

  useEffect(() => {

    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);

  }, []);



  const isMobile = viewportWidth <= 700;

  const isTablet = viewportWidth > 700 && viewportWidth <= 1100;

  const navStyles = getResponsiveNavStyles(isMobile, isTablet);



  // 🔗 Helper to sync coins with Backend Database

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



  // 🔗 BACKEND LINKED: Permanent Sign Up Handler via Live Railway Backend API

  const handleRegisterSubmit = async (e) => {

    e.preventDefault();

    setAuthError("");

    setAuthSuccess("");



    if (!inputName.trim() || !inputPhone.trim() || !inputPassword.trim()) {

      setAuthError("⚠️ Meherbani karke saari fields bharein!");

      return;

    }



    setIsAuthLoading(true);

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

    } finally {

      setIsAuthLoading(false);

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



    setIsAuthLoading(true);

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

    } finally {

      setIsAuthLoading(false);

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

    setAboutDropdownOpen(false);

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

            <div style={navStyles.dropdownContainer} onMouseLeave={() => setPlayDropdownOpen(false)}>
              <button
                style={{ ...navStyles.navBtn, ...(page === "gamingArena" || page === "winner" ? navStyles.gamingArenaNavBtn : {}), display: "flex", alignItems: "center", gap: "5px" }}
                onClick={() => { setPlayDropdownOpen(!playDropdownOpen); setAboutDropdownOpen(false); setUserDropdownOpen(false); }}
              >
                🎮 Play ▾
              </button>
              {playDropdownOpen && (
                <div style={navStyles.dropdownMenu}>
                  <button style={navStyles.dropdownItem} onClick={() => navigateToPage("gamingArena")}>🎮 Gaming Arena</button>
                  <button style={navStyles.dropdownItem} onClick={() => navigateToPage("winner")}>🏆 Winners</button>
                </div>
              )}
            </div>

            <button className={page === "luckyDraw" ? "active" : ""} style={navStyles.navBtn} onClick={() => navigateToPage("luckyDraw")}>
              🎁 {t.luckyDraw}
            </button>

            <div style={navStyles.dropdownContainer} onMouseLeave={() => setAboutDropdownOpen(false)}>
              <button
                style={{ ...navStyles.navBtn, display: "flex", alignItems: "center", gap: "4px" }}
                onClick={() => { setAboutDropdownOpen(!aboutDropdownOpen); setPlayDropdownOpen(false); setUserDropdownOpen(false); }}
              >
                More ▾
              </button>
              {aboutDropdownOpen && (
                <div style={navStyles.dropdownMenu}>
                  <button style={navStyles.dropdownItem} onClick={() => navigateToPage("wallet")}>💰 {t.wallet}</button>
                  <button style={navStyles.dropdownItem} onClick={() => navigateToPage("privacy")}>🛡️ Privacy Policy</button>
                  <button style={navStyles.dropdownItem} onClick={() => navigateToPage("terms")}>📄 Terms & Conditions</button>
                  <button style={navStyles.dropdownItem} onClick={() => navigateToPage("refund")}>🔄 Refund Policy</button>
                </div>
              )}
            </div>

            {user ? (
              <div style={navStyles.dropdownContainer} onMouseLeave={() => setUserDropdownOpen(false)}>
                <button
                  style={navStyles.profileNavBtn}
                  onClick={() => { setUserDropdownOpen(!userDropdownOpen); setPlayDropdownOpen(false); setAboutDropdownOpen(false); }}
                  aria-label="Open profile menu"
                >
                  <span style={navStyles.profileAvatar}>
                    {(user.profilePic || user.profileImage || user.avatar) ? (
                      <img
                        src={user.profilePic || user.profileImage || user.avatar}
                        alt={user.name || "User"}
                        style={navStyles.profileAvatarImage}
                      />
                    ) : (
                      (user.name || "U").trim().charAt(0).toUpperCase()
                    )}
                  </span>
                  <span style={navStyles.profileNavName}>{user.name}</span>
                  <span style={navStyles.profileChevron}>▾</span>
                </button>
                {userDropdownOpen && (
                  <div style={{ ...navStyles.dropdownMenu, minWidth: "180px" }}>
                    <button style={navStyles.dropdownItem} onClick={() => navigateToPage("profile")}>👤 {t.profile}</button>
                    <button style={navStyles.dropdownItem} onClick={() => navigateToPage("wallet")}>💰 {t.wallet}</button>
                    <button style={{ ...navStyles.dropdownItem, color: "#fca5a5" }} onClick={handleLogout}>🚪 Logout</button>
                  </div>
                )}
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



      {/* MOBILE MENU */}

      {menuOpen && isMobile && (

        <div className="mobile-menu" style={navStyles.mobileMenu}>

          <div style={navStyles.mobileMenuHeader}>

            <div>

              <div style={navStyles.mobileMenuTitle}>SAMATKAAR</div>

              <div style={navStyles.mobileMenuSub}>Navigation</div>

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

            <button style={{ ...navStyles.mobileMenuBtn, ...navStyles.gamingArenaMobileBtn }} onClick={() => navigateToPage("gamingArena")}>🎮 <span>Gaming Arena</span></button>

            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("winner")}>🏆 <span>Winners</span></button>

            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("wallet")}>💰 <span>{t.wallet}</span></button>

            <button style={navStyles.mobileMenuBtn} onClick={() => navigateToPage("profile")}>👤 <span>{t.profile}</span></button>

          </div>



          {/* Mobile Policies / About Us Section */}

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px", borderRadius: "6px" }}>

            <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px", fontWeight: "bold" }}>📁 About Us & Policies</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>

              <button style={navStyles.mobileMenuBtnFull} onClick={() => navigateToPage("privacy")}>🛡️ Privacy Policy</button>

              <button style={navStyles.mobileMenuBtnFull} onClick={() => navigateToPage("terms")}>📄 Terms & Conditions</button>

              <button style={navStyles.mobileMenuBtnFull} onClick={() => navigateToPage("refund")}>🔄 Refund Policy</button>

            </div>

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



          {/* 🎁 INVITE BONUS SECTION */}

          <section

            style={{

              width: "100%",

              maxWidth: "1200px",

              margin: "0 auto",

              padding: "0 16px 32px",

              boxSizing: "border-box",

            }}

          >

            <InviteBonusSection />

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



      {page === "gamingArena" && (

        <SamatkarGamingArena

          coins={coins}

          user={user}

          addCoins={addCoins}

          deductCoins={deductCoins}

          navigate={navigateToPage}

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



      {/* PROFESSIONAL FULL-SCREEN SIGN UP / LOGIN EXPERIENCE */}

      {showAuthModal && (

        <div style={navStyles.authPageOverlay}>

          <style>{`@keyframes authButtonSpin { to { transform: rotate(360deg); } }`}</style>

          <div style={navStyles.authPageBackgroundGlow}></div>



          <div style={navStyles.authPageShell}>

            {/* LEFT BRAND / WELCOME PANEL */}

            <div

              style={{

                ...navStyles.authBrandPanel,

                ...(isMobile

                  ? {

                    padding: "30px 24px",

                    borderRight: "none",

                    borderBottom: "1px solid rgba(148,163,184,0.12)",

                  }

                  : {}),

              }}

            >

              <div style={navStyles.authBrandLogoWrap}>

                <div style={navStyles.authBrandLogoGlow}></div>

                <div style={navStyles.authBrandLogo}>S</div>

              </div>



              <div style={navStyles.authBrandName}>SAMATKAAR</div>

              <div style={navStyles.authBrandLine}></div>

              <h2 style={navStyles.authBrandHeading}>

                {isLoginMode ? "Welcome Back" : "Join SAMATKAAR"}

              </h2>

              <p style={navStyles.authBrandText}>

                {isLoginMode

                  ? "Apne account me securely login karein aur apna SAMATKAAR experience continue karein."

                  : "Apna account create karein aur SAMATKAAR ki tamam features ko access karein."}

              </p>



              <div style={navStyles.authFeatureList}>

                <div style={navStyles.authFeatureItem}>✓ Secure Account Access</div>

                <div style={navStyles.authFeatureItem}>✓ Fast & Simple Experience</div>

                <div style={navStyles.authFeatureItem}>✓ Your Coins Stay Synced</div>

              </div>

            </div>



            {/* RIGHT AUTH FORM PANEL */}

            <div

              style={{

                ...navStyles.authFormPanel,

                ...(isMobile

                  ? {

                    padding: "30px 24px",

                  }

                  : {}),

              }}

            >

              <div style={navStyles.authTopRow}>

                <div>

                  <div style={navStyles.authBadge}>

                    {isLoginMode ? "🔐 SECURE LOGIN" : "✨ CREATE ACCOUNT"}

                  </div>

                  <h1 style={navStyles.authTitle}>

                    {isLoginMode ? "Login" : "Create Account"}

                  </h1>

                  <p style={navStyles.authSubtitle}>

                    {isLoginMode

                      ? "Enter your registered details to continue."

                      : "Create your SAMATKAAR account in a few seconds."}

                  </p>

                </div>



                <button

                  type="button"

                  onClick={() => {

                    if (!isAuthLoading) setShowAuthModal(false);

                  }}

                  style={navStyles.authCloseBtn}

                  aria-label="Close authentication page"

                  disabled={isAuthLoading}

                >

                  ✕

                </button>

              </div>



              <form onSubmit={isLoginMode ? handleLoginSubmit : handleRegisterSubmit}>

                {!isLoginMode && (

                  <div style={navStyles.authFieldGroup}>

                    <label style={navStyles.authFieldLabel}>Full Name</label>

                    <div style={navStyles.authInputWrap}>

                      <span style={navStyles.authInputIcon}>👤</span>

                      <input

                        type="text"

                        placeholder="Enter your name"

                        value={inputName}

                        onChange={(e) => setInputName(e.target.value)}

                        style={navStyles.authInput}

                        disabled={isAuthLoading}

                        autoComplete="name"

                      />

                    </div>

                  </div>

                )}



                <div style={navStyles.authFieldGroup}>

                  <label style={navStyles.authFieldLabel}>Phone Number</label>

                  <div style={navStyles.authInputWrap}>

                    <span style={navStyles.authInputIcon}>📱</span>

                    <input

                      type="text"

                      placeholder="03001234567"

                      value={inputPhone}

                      onChange={(e) => setInputPhone(e.target.value)}

                      style={navStyles.authInput}

                      disabled={isAuthLoading}

                      autoComplete="tel"

                    />

                  </div>

                </div>



                <div style={navStyles.authFieldGroup}>

                  <label style={navStyles.authFieldLabel}>Password</label>

                  <div style={navStyles.authInputWrap}>

                    <span style={navStyles.authInputIcon}>🔒</span>

                    <input

                      type={showPassword ? "text" : "password"}

                      placeholder="Enter your password"

                      value={inputPassword}

                      onChange={(e) => setInputPassword(e.target.value)}

                      style={navStyles.authInputWithEye}

                      disabled={isAuthLoading}

                      autoComplete={isLoginMode ? "current-password" : "new-password"}

                    />

                    <button

                      type="button"

                      onClick={() => setShowPassword(!showPassword)}

                      style={navStyles.authEyeBtn}

                      disabled={isAuthLoading}

                      aria-label={showPassword ? "Hide password" : "Show password"}

                    >

                      {showPassword ? "👁️‍🗨️" : "👁️"}

                    </button>

                  </div>

                </div>



                {authError && (

                  <div style={navStyles.authErrorBox}>

                    <span>⚠️</span>

                    <span>{authError.replace(/^⚠️\s*/, "").replace(/^❌\s*/, "")}</span>

                  </div>

                )}



                {authSuccess && (

                  <div style={navStyles.authSuccessBox}>

                    <span>✓</span>

                    <span>{authSuccess.replace(/^✅\s*/, "")}</span>

                  </div>

                )}



                <button

                  type="submit"

                  style={{

                    ...navStyles.authSubmitBtn,

                    ...(isAuthLoading ? navStyles.authSubmitBtnLoading : {}),

                  }}

                  disabled={isAuthLoading}

                >

                  {isAuthLoading ? (

                    <>

                      <span style={navStyles.authSpinner}></span>

                      <span>{isLoginMode ? "Signing in..." : "Creating account..."}</span>

                    </>

                  ) : (

                    <>

                      <span>{isLoginMode ? "Login" : "Create Account"}</span>

                      <span style={navStyles.authSubmitArrow}>→</span>

                    </>

                  )}

                </button>

              </form>



              <div style={navStyles.authSwitchArea}>

                <span style={navStyles.authSwitchText}>

                  {isLoginMode ? "Don't have an account?" : "Already have an account?"}

                </span>

                <button

                  type="button"

                  onClick={() => {

                    if (isAuthLoading) return;

                    setIsLoginMode(!isLoginMode);

                    setAuthError("");

                    setAuthSuccess("");

                    setShowPassword(false);

                  }}

                  style={navStyles.authSwitchBtn}

                  disabled={isAuthLoading}

                >

                  {isLoginMode ? "Create Account" : "Login"}

                </button>

              </div>



              <div style={navStyles.authSecurityNote}>

                <span>🛡️</span>

                <span>Your account details are sent securely to SAMATKAAR.</span>

              </div>

            </div>

          </div>

        </div>

      )}





      {/* ==================== ADVERTISEMENT SECTION ==================== */}
      <div>
        <Banner320 />
      </div>

      <div>
        <NativeBanner />
      </div>

      <div>
        <div style={{ width: "100%", background: "#0f172a", padding: "10px 0" }}>
          <p style={{ textAlign: "center", fontSize: "10px", color: "#64748b", margin: "0 0 5px 0" }}>
            Sponsored Ad
          </p>
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
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            }}
          >
            🎁 Bonus Reward Claim Karein (Smartlink)
          </a>
        </div>
      </div>
      {/* ================== END ADVERTISEMENT SECTION ================== */}
      <footer>

        <div className="footer-brand"><strong>SAMATKAAR</strong></div>

        <p>{t.footerSub}</p>

        <small>© 2026 SAMATKAAR. Official App Version</small>

      </footer>

    </div>

  );

}



// Complete responsive navigation & component inline styles helper

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

    gamingArenaNavBtn: {

      background: "linear-gradient(135deg, rgba(2,132,199,0.18), rgba(14,165,233,0.08))",

      border: "1px solid rgba(56,189,248,0.18)",

      color: "#7dd3fc",

      fontWeight: "700",

      boxShadow: "0 4px 14px rgba(14,165,233,0.08)",

    },

    dropdownContainer: {

      position: "relative",

      display: "inline-block",

    },

    dropdownMenu: {

      position: "absolute",

      right: 0,

      top: "100%",

      background: "#1e293b",

      border: "1px solid #334155",

      borderRadius: "6px",

      boxShadow: "0 10px 20px rgba(0,0,0,0.5)",

      display: "flex",

      flexDirection: "column",

      minWidth: "160px",

      zIndex: 1100,

      overflow: "hidden",

    },

    dropdownItem: {

      background: "transparent",

      border: "none",

      color: "#cbd5e1",

      padding: "10px 14px",

      textAlign: "left",

      fontSize: "12px",

      cursor: "pointer",

      fontWeight: "500",

      borderBottom: "1px solid rgba(255,255,255,0.05)",

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

    profileNavBtn: {
      display: "flex",
      alignItems: "center",
      gap: "7px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(148,163,184,0.16)",
      color: "#e2e8f0",
      borderRadius: "999px",
      padding: "4px 9px 4px 4px",
      cursor: "pointer",
      maxWidth: "150px",
    },

    profileAvatar: {
      width: "30px",
      height: "30px",
      borderRadius: "50%",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      background: "linear-gradient(135deg, #0284c7, #38bdf8)",
      color: "#fff",
      fontSize: "13px",
      fontWeight: "800",
      border: "1px solid rgba(255,255,255,0.18)",
      boxShadow: "0 3px 10px rgba(14,165,233,0.18)",
    },

    profileAvatarImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },

    profileNavName: {
      fontSize: "11px",
      fontWeight: "700",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "82px",
    },

    profileChevron: {
      color: "#94a3b8",
      fontSize: "10px",
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

      position: "fixed",
      top: "49px",

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

      paddingBottom: "10px",

    },

    mobileMenuTitle: {

      fontWeight: "800",

      fontSize: "16px",

      color: "#38bdf8",

    },

    mobileMenuSub: {

      fontSize: "11px",

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

      gridTemplateColumns: "1fr 1fr",

      gap: "8px",

    },

    mobileMenuBtn: {

      background: "rgba(255, 255, 255, 0.05)",

      border: "1px solid rgba(255, 255, 255, 0.1)",

      color: "#fff",

      textAlign: "left",

      padding: "10px",

      fontSize: "12px",

      borderRadius: "6px",

      cursor: "pointer",

      display: "flex",

      alignItems: "center",

      gap: "8px",

    },

    gamingArenaMobileBtn: {

      background: "linear-gradient(135deg, rgba(2,132,199,0.24), rgba(14,165,233,0.10))",

      border: "1px solid rgba(56,189,248,0.24)",

      color: "#7dd3fc",

      fontWeight: "700",

      boxShadow: "0 5px 16px rgba(14,165,233,0.08)",

    },

    mobileMenuBtnFull: {

      background: "rgba(255, 255, 255, 0.05)",

      border: "1px solid rgba(255, 255, 255, 0.1)",

      color: "#fff",

      textAlign: "left",

      padding: "8px 10px",

      fontSize: "12px",

      borderRadius: "4px",

      cursor: "pointer",

      display: "flex",

      alignItems: "center",

      gap: "8px",

      width: "100%",

    },

    mobileSettings: {

      display: "flex",

      flexDirection: "column",

      gap: "8px",

      background: "rgba(0, 0, 0, 0.2)",

      padding: "10px",

      borderRadius: "6px",

    },

    mobileSettingItem: {

      display: "flex",

      justifyContent: "space-between",

      alignItems: "center",

      color: "#cbd5e1",

      fontSize: "12px",

    },

    mobileSelect: {

      background: "#0f172a",

      border: "1px solid #475569",

      color: "#fff",

      borderRadius: "4px",

      padding: "4px 8px",

      fontSize: "12px",

      outline: "none",

    },

    mobileLoginBtn: {

      background: "#0284c7",

      color: "#fff",

      border: "none",

      padding: "10px",

      borderRadius: "6px",

      fontWeight: "bold",

      fontSize: "13px",

      cursor: "pointer",

      textAlign: "center",

    },

    mobileLogoutBtn: {

      background: "#ef4444",

      color: "#fff",

      border: "none",

      padding: "10px",

      borderRadius: "6px",

      fontWeight: "bold",

      fontSize: "13px",

      cursor: "pointer",

      textAlign: "center",

    },

    // PROFESSIONAL FULL-SCREEN AUTH PAGE

    authPageOverlay: {

      position: "fixed",

      inset: 0,

      width: "100%",

      height: "100vh",

      minHeight: "100vh",

      background: "radial-gradient(circle at 20% 20%, #172554 0%, #0f172a 42%, #020617 100%)",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      padding: "24px",

      boxSizing: "border-box",

      overflowY: "auto",

      zIndex: 99999,

      fontFamily: "inherit",

    },

    authPageBackgroundGlow: {

      position: "absolute",

      width: "420px",

      height: "420px",

      borderRadius: "50%",

      background: "rgba(14,165,233,0.13)",

      filter: "blur(90px)",

      pointerEvents: "none",

    },

    authPageShell: {

      position: "relative",

      zIndex: 2,

      width: "min(100%, 920px)",

      minHeight: "560px",

      display: "grid",

      gridTemplateColumns: "0.9fr 1.1fr",

      background: "rgba(15,23,42,0.94)",

      border: "1px solid rgba(148,163,184,0.16)",

      borderRadius: "28px",

      overflow: "hidden",

      boxShadow: "0 30px 90px rgba(0,0,0,0.55), 0 0 60px rgba(14,165,233,0.08)",

      backdropFilter: "blur(18px)",

    },

    authBrandPanel: {

      position: "relative",

      display: "flex",

      flexDirection: "column",

      justifyContent: "center",

      padding: "48px 42px",

      background: "linear-gradient(145deg, rgba(2,132,199,0.22), rgba(15,23,42,0.12))",

      borderRight: "1px solid rgba(148,163,184,0.12)",

    },

    authBrandLogoWrap: {

      position: "relative",

      width: "76px",

      height: "76px",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      marginBottom: "22px",

    },

    authBrandLogoGlow: {

      position: "absolute",

      inset: "5px",

      borderRadius: "22px",

      background: "rgba(56,189,248,0.28)",

      filter: "blur(18px)",

    },

    authBrandLogo: {

      position: "relative",

      width: "68px",

      height: "68px",

      borderRadius: "20px",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      background: "linear-gradient(145deg, #0ea5e9, #0369a1)",

      color: "#fff",

      fontSize: "34px",

      fontWeight: "900",

      boxShadow: "0 15px 40px rgba(14,165,233,0.3), inset 0 1px 0 rgba(255,255,255,0.25)",

    },

    authBrandName: {

      color: "#f8fafc",

      fontSize: "26px",

      fontWeight: "900",

      letterSpacing: "5px",

    },

    authBrandLine: {

      width: "58px",

      height: "3px",

      borderRadius: "999px",

      background: "linear-gradient(90deg, #0284c7, #38bdf8)",

      margin: "18px 0 24px",

    },

    authBrandHeading: {

      margin: 0,

      color: "#fff",

      fontSize: "30px",

      fontWeight: "800",

      lineHeight: 1.15,

    },

    authBrandText: {

      margin: "14px 0 26px",

      color: "#94a3b8",

      fontSize: "14px",

      lineHeight: 1.7,

      maxWidth: "330px",

    },

    authFeatureList: {

      display: "flex",

      flexDirection: "column",

      gap: "11px",

    },

    authFeatureItem: {

      color: "#cbd5e1",

      fontSize: "12px",

      fontWeight: "600",

    },

    authFormPanel: {

      display: "flex",

      flexDirection: "column",

      justifyContent: "center",

      padding: "46px 52px",

      background: "rgba(2,6,23,0.32)",

    },

    authTopRow: {

      display: "flex",

      justifyContent: "space-between",

      alignItems: "flex-start",

      gap: "20px",

      marginBottom: "28px",

    },

    authBadge: {

      display: "inline-flex",

      alignItems: "center",

      padding: "6px 10px",

      borderRadius: "999px",

      background: "rgba(14,165,233,0.1)",

      border: "1px solid rgba(56,189,248,0.2)",

      color: "#38bdf8",

      fontSize: "9px",

      fontWeight: "800",

      letterSpacing: "1.2px",

      marginBottom: "12px",

    },

    authTitle: {

      margin: 0,

      color: "#f8fafc",

      fontSize: "34px",

      fontWeight: "850",

      letterSpacing: "-0.7px",

    },

    authSubtitle: {

      margin: "8px 0 0",

      color: "#64748b",

      fontSize: "12px",

      lineHeight: 1.5,

    },

    authCloseBtn: {

      width: "36px",

      height: "36px",

      flexShrink: 0,

      borderRadius: "10px",

      border: "1px solid rgba(148,163,184,0.15)",

      background: "rgba(255,255,255,0.04)",

      color: "#94a3b8",

      fontSize: "16px",

      cursor: "pointer",

    },

    authFieldGroup: {

      marginBottom: "17px",

    },

    authFieldLabel: {

      display: "block",

      marginBottom: "7px",

      color: "#cbd5e1",

      fontSize: "11px",

      fontWeight: "700",

    },

    authInputWrap: {

      position: "relative",

      display: "flex",

      alignItems: "center",

      width: "100%",

    },

    authInputIcon: {

      position: "absolute",

      left: "13px",

      zIndex: 2,

      fontSize: "14px",

      opacity: 0.8,

    },

    authInput: {

      width: "100%",

      height: "48px",

      padding: "0 14px 0 42px",

      borderRadius: "12px",

      border: "1px solid #334155",

      background: "rgba(15,23,42,0.86)",

      color: "#fff",

      fontSize: "13px",

      outline: "none",

      boxSizing: "border-box",

    },

    authInputWithEye: {

      width: "100%",

      height: "48px",

      padding: "0 46px 0 42px",

      borderRadius: "12px",

      border: "1px solid #334155",

      background: "rgba(15,23,42,0.86)",

      color: "#fff",

      fontSize: "13px",

      outline: "none",

      boxSizing: "border-box",

    },

    authEyeBtn: {

      position: "absolute",

      right: "8px",

      width: "34px",

      height: "34px",

      border: "none",

      borderRadius: "8px",

      background: "transparent",

      color: "#94a3b8",

      cursor: "pointer",

      fontSize: "15px",

    },

    authErrorBox: {

      display: "flex",

      alignItems: "center",

      gap: "8px",

      background: "rgba(127,29,29,0.28)",

      border: "1px solid rgba(248,113,113,0.2)",

      color: "#fca5a5",

      padding: "10px 12px",

      borderRadius: "10px",

      marginBottom: "14px",

      fontSize: "11px",

      lineHeight: 1.45,

    },

    authSuccessBox: {

      display: "flex",

      alignItems: "center",

      gap: "8px",

      background: "rgba(20,83,45,0.28)",

      border: "1px solid rgba(74,222,128,0.2)",

      color: "#86efac",

      padding: "10px 12px",

      borderRadius: "10px",

      marginBottom: "14px",

      fontSize: "11px",

      lineHeight: 1.45,

    },

    authSubmitBtn: {

      width: "100%",

      height: "50px",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      gap: "10px",

      background: "linear-gradient(135deg, #0284c7, #0ea5e9)",

      color: "#fff",

      border: "none",

      borderRadius: "12px",

      fontWeight: "800",

      cursor: "pointer",

      fontSize: "13px",

      boxShadow: "0 10px 25px rgba(14,165,233,0.2)",

      transition: "transform 0.2s ease, opacity 0.2s ease",

    },

    authSubmitBtnLoading: {

      opacity: 0.8,

      cursor: "not-allowed",

    },

    authSpinner: {

      width: "17px",

      height: "17px",

      borderRadius: "50%",

      border: "2px solid rgba(255,255,255,0.35)",

      borderTopColor: "#fff",

      display: "inline-block",

      animation: "authButtonSpin 0.75s linear infinite",

    },

    authSubmitArrow: {

      fontSize: "18px",

      lineHeight: 1,

    },

    authSwitchArea: {

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      flexWrap: "wrap",

      gap: "5px",

      marginTop: "20px",

      fontSize: "11px",

    },

    authSwitchText: {

      color: "#64748b",

    },

    authSwitchBtn: {

      background: "transparent",

      border: "none",

      color: "#38bdf8",

      fontSize: "11px",

      fontWeight: "800",

      cursor: "pointer",

      padding: 0,

    },

    authSecurityNote: {

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      gap: "6px",

      marginTop: "22px",

      color: "#475569",

      fontSize: "9px",

      textAlign: "center",

      lineHeight: 1.4,

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

};



export default function App() {

  const [isAppLoading, setIsAppLoading] = useState(true);



  useEffect(() => {

    // ✨ Professional app startup screen

    const timer = setTimeout(() => {

      setIsAppLoading(false);

    }, 1600);



    return () => clearTimeout(timer);

  }, []);



  if (isAppLoading) {

    return (

      <>

        <style>{`

          @keyframes samatkaarLoaderSpin {

            to { transform: rotate(360deg); }

          }



          @keyframes samatkaarLoaderPulse {

            0%, 100% { transform: scale(1); opacity: 0.85; }

            50% { transform: scale(1.06); opacity: 1; }

          }



          @keyframes samatkaarLoaderGlow {

            0%, 100% { opacity: 0.35; transform: scale(0.95); }

            50% { opacity: 0.75; transform: scale(1.08); }

          }



          @keyframes samatkaarLoaderProgress {

            0% { width: 0%; }

            70% { width: 72%; }

            100% { width: 100%; }

          }



          @keyframes samatkaarLoaderDots {

            0%, 20% { opacity: 0; }

            40% { opacity: 1; }

            80%, 100% { opacity: 0; }

          }

        `}</style>



        <div style={appLoaderStyles.container}>

          <div style={appLoaderStyles.backgroundGlow}></div>



          <div style={appLoaderStyles.loaderContent}>

            <div style={appLoaderStyles.logoWrapper}>

              <div style={appLoaderStyles.logoGlow}></div>

              <div style={appLoaderStyles.logoRing}></div>

              <div style={appLoaderStyles.logo}>

                S

              </div>

            </div>



            <div style={appLoaderStyles.brandName}>

              SAMATKAAR

            </div>



            <div style={appLoaderStyles.tagline}>

              YOUR EXPERIENCE IS LOADING

              <span style={appLoaderStyles.dots}>•••</span>

            </div>



            <div style={appLoaderStyles.progressTrack}>

              <div style={appLoaderStyles.progressBar}></div>

            </div>



            <div style={appLoaderStyles.loadingStatus}>

              <span style={appLoaderStyles.statusDot}></span>

              Preparing your experience

            </div>

          </div>



          <div style={appLoaderStyles.footerText}>

            Secure • Fast • Simple

          </div>

        </div>

      </>

    );

  }



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



// ✨ PROFESSIONAL SAMATKAAR APP LOADER STYLES

const appLoaderStyles = {

  container: {

    position: "fixed",

    inset: 0,

    width: "100%",

    height: "100vh",

    minHeight: "100vh",

    background: "radial-gradient(circle at 50% 35%, #172554 0%, #0b1120 45%, #020617 100%)",

    color: "#fff",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    flexDirection: "column",

    overflow: "hidden",

    zIndex: 99999,

    fontFamily: "inherit",

  },



  backgroundGlow: {

    position: "absolute",

    width: "280px",

    height: "280px",

    borderRadius: "50%",

    background: "rgba(56, 189, 248, 0.16)",

    filter: "blur(70px)",

    animation: "samatkaarLoaderGlow 2.2s ease-in-out infinite",

    pointerEvents: "none",

  },



  loaderContent: {

    position: "relative",

    zIndex: 2,

    width: "min(88%, 360px)",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    textAlign: "center",

  },



  logoWrapper: {

    position: "relative",

    width: "96px",

    height: "96px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    marginBottom: "22px",

  },



  logoGlow: {

    position: "absolute",

    width: "82px",

    height: "82px",

    borderRadius: "26px",

    background: "rgba(56, 189, 248, 0.28)",

    filter: "blur(18px)",

    animation: "samatkaarLoaderGlow 1.8s ease-in-out infinite",

  },



  logoRing: {

    position: "absolute",

    width: "92px",

    height: "92px",

    borderRadius: "28px",

    border: "2px solid rgba(56, 189, 248, 0.18)",

    borderTopColor: "#38bdf8",

    borderRightColor: "rgba(56, 189, 248, 0.55)",

    animation: "samatkaarLoaderSpin 1.1s linear infinite",

  },



  logo: {

    position: "relative",

    width: "68px",

    height: "68px",

    borderRadius: "20px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    background: "linear-gradient(145deg, #0ea5e9, #0369a1)",

    border: "1px solid rgba(255,255,255,0.2)",

    boxShadow: "0 12px 35px rgba(14,165,233,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",

    fontSize: "36px",

    fontWeight: "900",

    letterSpacing: "-2px",

    animation: "samatkaarLoaderPulse 2s ease-in-out infinite",

  },



  brandName: {

    fontSize: "28px",

    fontWeight: "900",

    letterSpacing: "7px",

    marginLeft: "7px",

    color: "#f8fafc",

    textShadow: "0 0 24px rgba(56,189,248,0.25)",

  },



  tagline: {

    marginTop: "8px",

    color: "#64748b",

    fontSize: "9px",

    fontWeight: "700",

    letterSpacing: "2.2px",

  },



  dots: {

    display: "inline-block",

    marginLeft: "4px",

    color: "#38bdf8",

    animation: "samatkaarLoaderDots 1.2s ease-in-out infinite",

  },



  progressTrack: {

    width: "100%",

    height: "4px",

    marginTop: "30px",

    borderRadius: "999px",

    background: "rgba(148,163,184,0.14)",

    overflow: "hidden",

    boxShadow: "inset 0 0 8px rgba(0,0,0,0.25)",

  },



  progressBar: {

    height: "100%",

    width: "0%",

    borderRadius: "999px",

    background: "linear-gradient(90deg, #0284c7, #38bdf8, #7dd3fc)",

    boxShadow: "0 0 14px rgba(56,189,248,0.7)",

    animation: "samatkaarLoaderProgress 1.55s cubic-bezier(0.4, 0, 0.2, 1) forwards",

  },



  loadingStatus: {

    display: "flex",

    alignItems: "center",

    gap: "7px",

    marginTop: "13px",

    color: "#94a3b8",

    fontSize: "11px",

    fontWeight: "500",

  },



  statusDot: {

    width: "6px",

    height: "6px",

    borderRadius: "50%",

    background: "#38bdf8",

    boxShadow: "0 0 10px rgba(56,189,248,0.9)",

    animation: "samatkaarLoaderPulse 1.2s ease-in-out infinite",

  },



  footerText: {

    position: "absolute",

    bottom: "24px",

    color: "#475569",

    fontSize: "9px",

    letterSpacing: "1.5px",

    fontWeight: "600",

    zIndex: 2,

  },

};