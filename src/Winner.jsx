import React, { useState, useEffect } from "react";

// Real draw complete hone par hi is function ko call karein taake winner storage me save ho
export const addWinnerToStorage = (newWinner) => {
  const existing = JSON.parse(localStorage.getItem("goovo_winners")) || [];
  const updated = [
    {
      id: Date.now(),
      name: newWinner.name,
      prize: newWinner.prize,
      ticket: newWinner.ticket || `GD-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      avatar: newWinner.avatar || "🏆",
    },
    ...existing,
  ];
  localStorage.setItem("goovo_winners", JSON.stringify(updated));
};

function Winner() {
  const [winnersList, setWinnersList] = useState([]);

  useEffect(() => {
    const savedWinners = JSON.parse(localStorage.getItem("goovo_winners")) || [];
    setWinnersList(savedWinners);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.badgeTag}>🌟 HALL OF FAME</span>
        <h2 style={styles.title}>🏆 Recent Lucky Draw Winners</h2>
        <p style={styles.subtitle}>
          Har 8 din baad chalne walay infinite auto-draw ke real verified winners ki live list!
        </p>
      </div>

      {winnersList.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>🎲</div>
          <h3 style={styles.emptyTitle}>Abhi tak koi real winner declare nahi hua!</h3>
          <p style={styles.emptyText}>
            Jaise hi 8 din ka timer poora hoga aur auto-draw run hoga, real winner ka naam yahan automatically save ho jayega.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {winnersList.map((item, index) => (
            <div 
              key={item.id} 
              style={{
                ...styles.card,
                ...(index === 0 ? styles.latestCard : {})
              }}
            >
              {index === 0 && <span style={styles.latestBadge}>🔥 LATEST WINNER</span>}
              <div style={styles.cardHeader}>
                <div style={styles.avatarBox}>{item.avatar}</div>
                <div style={styles.infoBox}>
                  <h3 style={styles.winnerName}>{item.name}</h3>
                  <p style={styles.prizeText}>{item.prize}</p>
                </div>
              </div>
              <div style={styles.metaBox}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Ticket No:</span>
                  <span style={styles.metaValue}>{item.ticket}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Won On:</span>
                  <span style={styles.metaValue}>{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Professional Inline Styles Object
const styles = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "30px 20px",
    fontFamily: "'Inter', sans-serif",
    color: "#ffffff",
  },
  header: {
    textAlign: "center",
    marginBottom: "35px",
  },
  badgeTag: {
    backgroundColor: "rgba(234, 179, 8, 0.15)",
    color: "#facc15",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1px",
    textTransform: "uppercase",
    border: "1px solid rgba(234, 179, 8, 0.3)",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    marginTop: "15px",
    marginBottom: "10px",
    background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "14px",
    color: "#94a3b8",
    maxWidth: "600px",
    margin: "0 auto",
    lineHeight: "1.5",
  },
  emptyCard: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "40px 20px",
    textAlign: "center",
    maxWidth: "500px",
    margin: "40px auto",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "15px",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: "8px",
  },
  emptyText: {
    fontSize: "13px",
    color: "#94a3b8",
    lineHeight: "1.6",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "20px",
    position: "relative",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)",
  },
  latestCard: {
    border: "1px solid #facc15",
    background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
    boxShadow: "0 0 20px rgba(250, 204, 21, 0.15)",
  },
  latestBadge: {
    position: "absolute",
    top: "-12px",
    right: "20px",
    backgroundColor: "#facc15",
    color: "#0f172a",
    fontSize: "10px",
    fontWeight: "800",
    padding: "4px 10px",
    borderRadius: "6px",
    letterSpacing: "0.5px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "15px",
  },
  avatarBox: {
    width: "50px",
    height: "50px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  infoBox: {
    flex: 1,
  },
  winnerName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "4px",
  },
  prizeText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#38bdf8",
  },
  metaBox: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: "10px",
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  metaItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
  },
  metaLabel: {
    color: "#94a3b8",
  },
  metaValue: {
    color: "#f1f5f9",
    fontWeight: "600",
  },
};

export default Winner;