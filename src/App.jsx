import React, { useState, useEffect } from "react";
import SmartTools from "./SmartTools";
import ResumeBuilder from "./ResumeBuilder";
import TypingText from "./TypingText";
import EnglishLearning from "./EnglishLearning";
import BudgetTracker from "./BudgetTracker";
import StudentQuiz from "./StudentQuiz";
import Profile from "./Profile";

// Standalone version: only the six free tools and the existing Profile component.
// No ads, games, wallet, earn, backend, policy pages, or other component imports.
const pages = [
  { id: "tools", name: "Smart Tools", icon: "🧮", component: SmartTools, desc: "Calculators, word counter and secure password tools" },
  { id: "resume", name: "CV Builder", icon: "📄", component: ResumeBuilder, desc: "Create a professional CV and save as PDF" },
  { id: "typing", name: "Typing Test", icon: "⌨️", component: TypingText, desc: "Practice typing speed and accuracy" },
  { id: "english", name: "Learn English", icon: "📚", component: EnglishLearning, desc: "English lessons with Roman Urdu explanations" },
  { id: "budget", name: "Budget Tracker", icon: "💰", component: BudgetTracker, desc: "Track income, spending and savings" },
  { id: "quiz", name: "Student Quiz", icon: "🎓", component: StudentQuiz, desc: "Practice questions and learning quizzes" },
  { id: "profile", name: "Profile", icon: "👤", component: Profile, desc: "Your existing Samatkaar profile" },
];

const colors = { navy: "#0b1224", blue: "#2563eb", muted: "#64748b", border: "#e2e8f0" };
const readSavedUser = () => {
  try { return JSON.parse(localStorage.getItem("goovoCurrentUser") || "null"); }
  catch { return null; }
};

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(readSavedUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [coins] = useState(() => Number(localStorage.getItem("goovoCoins")) || 0);
  const go = (id) => { setPage(id); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  useEffect(() => { document.title = `${page === "home" ? "Free Digital Tools" : pages.find(p => p.id === page)?.name || "Samatkaar"} | Samatkaar`; }, [page]);
  const selected = pages.find(p => p.id === page);
  const SelectedComponent = selected?.component;
  const buttonStyle = (active) => ({ padding: "11px 15px", borderRadius: 12, border: active ? "1px solid #93c5fd" : "1px solid transparent", background: active ? "#eff6ff" : "transparent", color: active ? "#1d4ed8" : "#334155", fontWeight: 700, cursor: "pointer", fontSize: 13 });
  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fc", fontFamily: "Inter, system-ui, Arial, sans-serif", color: "#17243b" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "#ffffff", borderBottom: `1px solid ${colors.border}`, boxShadow: "0 5px 20px rgba(15,23,42,.05)" }}>
        <div style={{ maxWidth: 1200, margin: "auto", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <button onClick={() => go("home")} style={{ background: "none", border: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontWeight: 900, fontSize: 19, color: colors.navy }}><span style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", borderRadius: 12, padding: "9px 12px", color: "white" }}>S</span>SAMATKAAR</button>
          <button onClick={() => setMenuOpen(s => !s)} aria-expanded={menuOpen} aria-label="Toggle navigation" style={{ border: `1px solid ${colors.border}`, background: "white", borderRadius: 10, padding: "9px 13px", cursor: "pointer", fontWeight: 700 }}>{menuOpen ? "✕ Close" : "☰ Menu"}</button>
        </div>
        {menuOpen && <nav style={{ maxWidth: 1200, margin: "auto", padding: "0 18px 15px", display: "flex", flexWrap: "wrap", gap: 5 }} aria-label="Main navigation"><button style={buttonStyle(page === "home")} onClick={() => go("home")}>🏠 Home</button>{pages.map(p => <button key={p.id} style={buttonStyle(page === p.id)} onClick={() => go(p.id)}>{p.icon} {p.name}</button>)}</nav>}
      </header>
      {page === "home" ? (
        <main style={{ maxWidth: 1160, margin: "auto", padding: "clamp(24px,5vw,65px) 18px" }}>
          <section style={{ background: "linear-gradient(125deg,#0f172a,#1d4ed8)", color: "white", borderRadius: 25, padding: "clamp(28px,6vw,65px)", marginBottom: 30 }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: "#bfdbfe" }}>WELCOME TO SAMATKAAR</div>
            <h1 style={{ fontSize: "clamp(29px,5vw,49px)", lineHeight: 1.18, maxWidth: 720, margin: "16px 0" }}>Free digital tools to learn, create and grow</h1>
            <p style={{ color: "#dbeafe", lineHeight: 1.8, maxWidth: 690 }}>Create a CV, practice English and typing, manage a personal budget, solve everyday calculations and test your knowledge — all from one place.</p>
            <button onClick={() => go("tools")} style={{ border: 0, background: "white", color: "#1d4ed8", borderRadius: 12, padding: "13px 20px", fontWeight: 800, cursor: "pointer" }}>Explore free tools →</button>
          </section>
          <h2 style={{ margin: "0 0 18px", fontSize: 26 }}>Explore our services</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 17 }}>
            {pages.map(p => <article key={p.id} style={{ background: "white", padding: 23, borderRadius: 18, border: `1px solid ${colors.border}`, boxShadow: "0 8px 25px rgba(15,23,42,.04)", display: "flex", flexDirection: "column", gap: 12 }}><div style={{ fontSize: 31 }}>{p.icon}</div><h3 style={{ margin: 0, fontSize: 19 }}>{p.name}</h3><p style={{ color: colors.muted, lineHeight: 1.65, margin: 0, flex: 1 }}>{p.desc}</p><button onClick={() => go(p.id)} style={{ textAlign: "left", background: "none", border: 0, color: colors.blue, fontWeight: 800, cursor: "pointer", padding: "5px 0" }}>Open {p.name} →</button></article>)}
          </div>
          <p style={{ marginTop: 32, color: colors.muted, lineHeight: 1.8 }}>Samatkaar provides practical learning and productivity tools. These features do not require viewing or clicking advertisements to access them.</p>
        </main>
      ) : <div key={page}>{page === "profile" ? <Profile user={user || { name: "Guest User", phone: "Not Logged In", coins }} setUser={setUser} coins={coins} navigate={go} onOpenAuth={() => window.alert("Login/signup is not included in this tools-only version.")} /> : SelectedComponent ? <SelectedComponent /> : null}</div>}
      <footer style={{ borderTop: `1px solid ${colors.border}`, background: "white", textAlign: "center", padding: "24px 15px", color: colors.muted, fontSize: 13 }}>© {new Date().getFullYear()} Samatkaar · Free learning and productivity tools</footer>
    </div>
  );
}
