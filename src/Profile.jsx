import React, { useState, useEffect } from "react";

function Profile({ user, setUser, coins, navigate }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("goovoCurrentUser");
    return saved ? JSON.parse(saved) : (user || {});
  });

  const [name] = useState(currentUser.name || "User");
  const [phone] = useState(currentUser.phone || "N/A");
  
  const [walletType, setWalletType] = useState(currentUser.walletType || "easypaisa");
  const [walletNumber, setWalletNumber] = useState(currentUser.walletNumber || currentUser.phone || "");
  
  const [avatar, setAvatar] = useState(currentUser.avatar || "");
  const [message, setMessage] = useState({ text: "", type: "success" });

  useEffect(() => {
    const saved = localStorage.getItem("goovoCurrentUser");
    if (saved) {
      const parsed = JSON.parse(saved);
      setCurrentUser(parsed);
      if (parsed.avatar) setAvatar(parsed.avatar);
      if (parsed.walletType) setWalletType(parsed.walletType);
      if (parsed.walletNumber) setWalletNumber(parsed.walletNumber);
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ text: "⚠️ Image size must be smaller than 2MB!", type: "error" });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result;
        setAvatar(newAvatar);

        const updatedUser = { ...currentUser, avatar: newAvatar };
        setCurrentUser(updatedUser);
        localStorage.setItem("goovoCurrentUser", JSON.stringify(updatedUser));
        if (setUser) setUser(updatedUser);
        updateUserInDatabase(updatedUser);

        setMessage({ text: "✅ Profile picture updated & saved!", type: "success" });
        setTimeout(() => setMessage({ text: "", type: "success" }), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateUserInDatabase = (updatedData) => {
    const usersDB = JSON.parse(localStorage.getItem("goovo_registered_users_db")) || [];
    const index = usersDB.findIndex((u) => u.phone === updatedData.phone);
    if (index !== -1) {
      usersDB[index] = { ...usersDB[index], ...updatedData };
      localStorage.setItem("goovo_registered_users_db", JSON.stringify(usersDB));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const updatedUser = {
      ...currentUser,
      walletType,
      walletNumber: walletNumber || phone,
      avatar,
      isVerified: true
    };

    setCurrentUser(updatedUser);
    localStorage.setItem("goovoCurrentUser", JSON.stringify(updatedUser));
    if (setUser) setUser(updatedUser);
    updateUserInDatabase(updatedUser);

    setMessage({ text: "✅ Wallet details updated successfully!", type: "success" });
    setTimeout(() => setMessage({ text: "", type: "success" }), 3500);
  };

  const openWhatsAppSupport = () => {
    const whatsappUrl = `https://wa.me/923409510992?text=${encodeURIComponent("Hello Support, mujhe ZEELOP app me madad chahiye.")}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div style={inlineStyles.container}>
      {/* HEADER SECTION */}
      <div style={inlineStyles.header}>
        <div style={inlineStyles.avatarWrapper}>
          <div style={inlineStyles.avatarBadge}>
            {avatar ? (
              <img src={avatar} alt="Profile" style={inlineStyles.avatarImg} />
            ) : name ? (
              name.charAt(0).toUpperCase()
            ) : (
              "👤"
            )}
          </div>
          
          <label htmlFor="avatar-input" style={inlineStyles.uploadBtn} title="Change Profile Picture">
            📷
          </label>
          <input
            id="avatar-input"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </div>

        <div style={inlineStyles.userMeta}>
          <h2 style={{ margin: "0 0 4px 0", color: "#fff", fontSize: "20px" }}>{name}</h2>
          <span style={inlineStyles.statusBadge}>✓ Verified Secure Account</span>
        </div>
      </div>

      {/* BALANCE CARD */}
      <div style={inlineStyles.balanceCard}>
        <div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>Total Earnings</span>
          <h3 style={{ margin: "4px 0", fontSize: "22px", color: "#facc15" }}>🪙 {coins?.toLocaleString() || 0} Coins</h3>
          <p style={{ margin: 0, fontSize: "12px", color: "#38bdf8" }}>≈ ${((coins || 0) / 10000).toFixed(2)} USD</p>
        </div>
        <div style={{ fontSize: "32px" }}>💎</div>
      </div>

      {/* NOTIFICATION TOAST */}
      {message.text && (
        <div style={{ ...inlineStyles.toast, background: message.type === "error" ? "#7f1d1d" : "#14532d", color: message.type === "error" ? "#fca5a5" : "#86efac" }}>
          {message.text}
        </div>
      )}

      {/* FORM SECTION */}
      <div style={inlineStyles.card}>
        <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#fff" }}>⚙️ Account & Payout Info</h3>
        <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#94a3b8", lineHeight: "1.4" }}>
          Aapka naam aur phone number permanent secure hain. Payouts ke liye apna wallet number yahan update kar sakte hain.
        </p>

        <form onSubmit={handleSave}>
          <div style={inlineStyles.formGroup}>
            <label style={inlineStyles.label}>Full Name (Locked)</label>
            <input type="text" value={name} disabled style={inlineStyles.disabledInput} />
            <small style={inlineStyles.smallWarning}>🔒 Security reason ki waja se registered naam change nahi ho sakta.</small>
          </div>

          <div style={inlineStyles.formGroup}>
            <label style={inlineStyles.label}>WhatsApp / Mobile Number (Locked)</label>
            <input type="tel" value={phone} disabled style={inlineStyles.disabledInput} />
            <small style={inlineStyles.smallWarning}>🔒 Login phone number permanent hai aur change nahi ho sakta.</small>
          </div>

          <div style={inlineStyles.row}>
            <div style={{ ...inlineStyles.formGroup, flex: 1 }}>
              <label style={inlineStyles.label}>Payout Method</label>
              <select value={walletType} onChange={(e) => setWalletType(e.target.value)} style={inlineStyles.input}>
                <option value="easypaisa">EasyPaisa</option>
                <option value="jazzcash">JazzCash</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div style={{ ...inlineStyles.formGroup, flex: 1 }}>
              <label style={inlineStyles.label}>Account / Wallet Number</label>
              <input
                type="text"
                placeholder="e.g. 03001234567"
                value={walletNumber}
                onChange={(e) => setWalletNumber(e.target.value)}
                required
                style={inlineStyles.input}
              />
            </div>
          </div>

          <button type="submit" style={inlineStyles.saveBtn}>Save Wallet Details</button>
        </form>
      </div>

      {/* HELP CENTER SECTION */}
      <div style={{ ...inlineStyles.card, marginTop: "16px", border: "1px solid #22c55e" }}>
        <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#fff" }}>💬 Help Center & Support</h3>
        <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "#94a3b8" }}>Agar aap ko application me koi masla aa raha hai ya help chahiye toh hum se WhatsApp par contact karein.</p>
        <button type="button" onClick={openWhatsAppSupport} style={inlineStyles.whatsappBtn}>
          <span>📱 Contact Official WhatsApp Support</span>
        </button>
      </div>
    </div>
  );
}

const inlineStyles = {
  container: {
    padding: "16px",
    maxWidth: "500px",
    margin: "0 auto",
    fontFamily: "inherit",
    boxSizing: "border-box"
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "#1e293b",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #334155",
    marginBottom: "16px"
  },
  avatarWrapper: {
    position: "relative",
    width: "64px",
    height: "64px"
  },
  avatarBadge: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "#0284c7",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold",
    overflow: "hidden",
    border: "2px solid #38bdf8"
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  uploadBtn: {
    position: "absolute",
    bottom: "0",
    right: "0",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
  },
  userMeta: {
    display: "flex",
    flexDirection: "column"
  },
  statusBadge: {
    fontSize: "11px",
    color: "#4ade80",
    background: "rgba(34, 197, 94, 0.1)",
    padding: "2px 8px",
    borderRadius: "4px",
    width: "fit-content",
    border: "1px solid rgba(34, 197, 94, 0.2)"
  },
  balanceCard: {
    background: "#1e293b",
    border: "1px solid #334155",
    padding: "16px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
  },
  formGroup: {
    marginBottom: "14px"
  },
  row: {
    display: "flex",
    gap: "10px"
  },
  label: {
    display: "block",
    fontSize: "12px",
    marginBottom: "6px",
    color: "#cbd5e1",
    fontWeight: "600"
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
    boxSizing: "border-box"
  },
  disabledInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #334155",
    backgroundColor: "#0f172a",
    cursor: "not-allowed",
    opacity: 0.7,
    color: "#94a3b8",
    fontSize: "14px",
    boxSizing: "border-box"
  },
  smallWarning: {
    color: "#f59e0b",
    display: "block",
    marginTop: "4px",
    fontSize: "11px"
  },
  saveBtn: {
    width: "100%",
    background: "#0284c7",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
    marginTop: "6px"
  },
  whatsappBtn: {
    background: "#22c55e",
    color: "#0f172a",
    border: "none",
    padding: "12px",
    width: "100%",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px"
  },
  toast: {
    padding: "10px 14px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "13px",
    fontWeight: "500",
    textAlign: "center"
  }
};

export default Profile;