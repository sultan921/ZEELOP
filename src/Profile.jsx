import React, { useState, useEffect } from "react";
// import "./Profile.css";

function Profile({ user, setUser, coins, navigate }) {
  // Current logged-in user data localStorage se retrieve karein
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("goovoCurrentUser");
    return saved ? JSON.parse(saved) : (user || {});
  });

  const [name] = useState(currentUser.name || "User");
  const [phone] = useState(currentUser.phone || "N/A");
  
  const [walletType, setWalletType] = useState(currentUser.walletType || "easypaisa");
  const [walletNumber, setWalletNumber] = useState(currentUser.walletNumber || currentUser.phone || "");
  
  // Profile Picture State
  const [avatar, setAvatar] = useState(currentUser.avatar || "");
  const [message, setMessage] = useState({ text: "", type: "success" });

  // Component mount hone par session data sync karein
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
        setMessage({
          text: "⚠️ Image size must be smaller than 2MB!",
          type: "error"
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result;
        setAvatar(newAvatar);

        // Update current user session & database
        const updatedUser = { ...currentUser, avatar: newAvatar };
        setCurrentUser(updatedUser);
        localStorage.setItem("goovoCurrentUser", JSON.stringify(updatedUser));
        if (setUser) setUser(updatedUser);

        // Update in users database as well if needed
        updateUserInDatabase(updatedUser);

        setMessage({
          text: "✅ Profile picture updated & saved!",
          type: "success"
        });
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

    setMessage({
      text: "✅ Wallet details updated successfully!",
      type: "success"
    });

    setTimeout(() => setMessage({ text: "", type: "success" }), 3500);
  };

  // WhatsApp Support Click Handler
  const openWhatsAppSupport = () => {
    const whatsappUrl = `https://wa.me/923409510992?text=${encodeURIComponent(
      "Hello Support, mujhe GOOVO app me madad chahiye."
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="profile-container">
      {/* HEADER SECTION WITH IMAGE UPLOAD */}
      <div className="profile-header">
        <div className="avatar-wrapper">
          <div className="avatar-badge">
            {avatar ? (
              <img src={avatar} alt="Profile" className="avatar-img" />
            ) : name ? (
              name.charAt(0).toUpperCase()
            ) : (
              "👤"
            )}
          </div>
          
          <label htmlFor="avatar-input" className="upload-icon-btn" title="Change Profile Picture">
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

        <div className="user-meta">
          <h2>{name}</h2>
          <p className="status-badge">
            ✓ Verified Secure Account
          </p>
        </div>
      </div>

      {/* BALANCE CARD */}
      <div className="profile-balance-card">
        <div className="balance-info">
          <span className="balance-label">Total Earnings</span>
          <h3>🪙 {coins?.toLocaleString() || 0} Coins</h3>
          <p className="usd-estimate">≈ ${((coins || 0) / 10000).toFixed(2)} USD</p>
        </div>
        <div className="balance-icon">💎</div>
      </div>

      {/* NOTIFICATION TOAST */}
      {message.text && (
        <div className={`profile-toast ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* FORM SECTION */}
      <div className="profile-card">
        <h3>⚙️ Account & Payout Info</h3>
        <p className="card-subtext">
          Aapka naam aur phone number permanent secure hain. Payouts ke liye apna wallet number yahan update kar sakte hain.
        </p>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Full Name (Locked)</label>
            <input
              type="text"
              value={name}
              disabled
              style={{
                backgroundColor: "#1e293b",
                cursor: "not-allowed",
                opacity: 0.7,
                color: "#94a3b8"
              }}
            />
            <small style={{ color: "#f59e0b", display: "block", marginTop: "4px" }}>
              🔒 Security reason ki waja se registered naam change nahi ho sakta.
            </small>
          </div>

          <div className="form-group">
            <label>WhatsApp / Mobile Number (Locked)</label>
            <input
              type="tel"
              value={phone}
              disabled
              style={{
                backgroundColor: "#1e293b",
                cursor: "not-allowed",
                opacity: 0.7,
                color: "#94a3b8"
              }}
            />
            <small style={{ color: "#f59e0b", display: "block", marginTop: "4px" }}>
              🔒 Login phone number permanent hai aur change nahi ho sakta.
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Payout Method</label>
              <select
                value={walletType}
                onChange={(e) => setWalletType(e.target.value)}
              >
                <option value="easypaisa">EasyPaisa</option>
                <option value="jazzcash">JazzCash</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div className="form-group">
              <label>Account / Wallet Number</label>
              <input
                type="text"
                placeholder="e.g. 03001234567"
                value={walletNumber}
                onChange={(e) => setWalletNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="save-btn">
            Save Wallet Details
          </button>
        </form>
      </div>

      {/* HELP CENTER SECTION */}
      <div className="profile-card" style={{ marginTop: "20px", border: "1px solid #22c55e" }}>
        <h3>💬 Help Center & Support</h3>
        <p className="card-subtext">Agar aap ko application me koi masla aa raha hai ya help chahiye toh hum se WhatsApp par contact karein.</p>
        <button
          type="button"
          onClick={openWhatsAppSupport}
          style={{
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
            gap: "8px"
          }}
        >
          <span>📱 Contact Official WhatsApp Support</span>
        </button>
      </div>
    </div>
  );
}

export default Profile;