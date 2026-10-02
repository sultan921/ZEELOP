import React, { useState, useEffect, useMemo } from "react";

function Profile({ user, setUser, coins, navigate }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("goovoCurrentUser");
    return saved ? JSON.parse(saved) : (user || {});
  });

  const [name] = useState(currentUser.name || "User");
  const [phone] = useState(currentUser.phone || "N/A");

  const [walletType, setWalletType] = useState(
    currentUser.walletType || "easypaisa"
  );
  const [walletNumber, setWalletNumber] = useState(
    currentUser.walletNumber || currentUser.phone || ""
  );

  const [avatar, setAvatar] = useState(currentUser.avatar || "");
  const [message, setMessage] = useState({ text: "", type: "success" });
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  // ============================================================
  // REFERRAL / INVITE
  // ============================================================
  // IMPORTANT:
  // This Profile component intentionally does NOT create fake joins.
  // The referral count/history will remain 0/empty until the backend
  // confirms a genuine referral. Backend verification can be connected
  // later without changing this professional UI.
  // ============================================================

  const [inviteCount] = useState(0);
  const [inviteHistory] = useState([]);
  const [coinsPerAd] = useState(10);

  const userReferralCode = useMemo(() => {
    const rawPhone = String(phone || "").replace(/\D/g, "");

    if (rawPhone && rawPhone !== "N/A") {
      return `SMK-${rawPhone.slice(-8)}`;
    }

    const rawUserId =
      currentUser.id ||
      currentUser.userId ||
      currentUser._id ||
      currentUser.username ||
      "USER";

    return `SMK-${String(rawUserId)
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(-8)
      .toUpperCase()}`;
  }, [phone, currentUser]);

  const userReferralLink = `https://samatkaar.netlify.app/invite?ref=${encodeURIComponent(
    userReferralCode
  )}`;

  const [userLevel, setUserLevel] = useState({
    name: "Bronze Rookie",
    badge: "🥉",
    nextAt: 10
  });

  useEffect(() => {
    const saved = localStorage.getItem("goovoCurrentUser");

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);

        if (parsed.avatar) setAvatar(parsed.avatar);
        if (parsed.walletType) setWalletType(parsed.walletType);
        if (parsed.walletNumber) setWalletNumber(parsed.walletNumber);
      } catch (error) {
        console.error("Unable to read saved user:", error);
      }
    }

    // Referral count/history intentionally start empty.
    // Real verified referral data will be loaded from the backend later.
    setUserLevel({
      name: "Bronze Rookie",
      badge: "🥉",
      nextAt: 10
    });
  }, []);

  const showMessage = (text, type = "success", duration = 3500) => {
    setMessage({ text, type });

    window.setTimeout(() => {
      setMessage({ text: "", type: "success" });
    }, duration);
  };

  // ============================================================
  // COPY REFERRAL LINK
  // ============================================================

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(userReferralLink);
      setCopied(true);
      showMessage("✓ Invite link copied successfully.", "success", 2500);

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (error) {
      showMessage(
        "Unable to copy automatically. Please copy the link manually.",
        "error",
        3500
      );
    }
  };

  // ============================================================
  // SHARE REFERRAL LINK
  // ============================================================

  const handleShareInvite = async () => {
    const shareText =
      "Join me on SAMATKAAR and start earning rewards. Use my invite link:";

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join SAMATKAAR",
          text: shareText,
          url: userReferralLink
        });

        setShared(true);

        window.setTimeout(() => {
          setShared(false);
        }, 2500);
      } else {
        await navigator.clipboard.writeText(
          `${shareText}\n${userReferralLink}`
        );

        setShared(true);
        showMessage("✓ Invite message copied. Share it with your friends.", "success");

        window.setTimeout(() => {
          setShared(false);
        }, 2500);
      }
    } catch (error) {
      // User may simply close the native share dialog.
      if (error?.name !== "AbortError") {
        showMessage(
          "Sharing was not completed. You can copy your invite link instead.",
          "error"
        );
      }
    }
  };

  // ============================================================
  // PROFILE IMAGE
  // ============================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage("Please select a valid image file.", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showMessage("Image size must be smaller than 2MB.", "error");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const newAvatar = reader.result;
      setAvatar(newAvatar);

      const updatedUser = {
        ...currentUser,
        avatar: newAvatar
      };

      setCurrentUser(updatedUser);
      localStorage.setItem(
        "goovoCurrentUser",
        JSON.stringify(updatedUser)
      );

      if (setUser) setUser(updatedUser);

      updateUserInDatabase(updatedUser);

      showMessage("✓ Profile picture updated and saved.", "success");
    };

    reader.onerror = () => {
      showMessage("Unable to read the selected image.", "error");
    };

    reader.readAsDataURL(file);
  };

  // ============================================================
  // LOCAL USER DATABASE
  // ============================================================

  const updateUserInDatabase = (updatedData) => {
    try {
      const usersDB =
        JSON.parse(
          localStorage.getItem("goovo_registered_users_db")
        ) || [];

      const index = usersDB.findIndex(
        (u) => u.phone === updatedData.phone
      );

      if (index !== -1) {
        usersDB[index] = {
          ...usersDB[index],
          ...updatedData
        };

        localStorage.setItem(
          "goovo_registered_users_db",
          JSON.stringify(usersDB)
        );
      }
    } catch (error) {
      console.error("Unable to update local user database:", error);
    }
  };

  // ============================================================
  // SAVE WALLET DETAILS
  // ============================================================

  const handleSave = async (e) => {
    e.preventDefault();

    if (isSaving) return;

    const cleanWalletNumber = String(walletNumber || "").trim();

    if (!cleanWalletNumber) {
      showMessage("Please enter your account or wallet number.", "error");
      return;
    }

    setIsSaving(true);

    try {
      const updatedUser = {
        ...currentUser,
        walletType,
        walletNumber: cleanWalletNumber || phone,
        avatar,
        isVerified: true
      };

      setCurrentUser(updatedUser);

      localStorage.setItem(
        "goovoCurrentUser",
        JSON.stringify(updatedUser)
      );

      if (setUser) setUser(updatedUser);

      updateUserInDatabase(updatedUser);

      showMessage(
        "✓ Wallet details updated successfully.",
        "success"
      );
    } catch (error) {
      console.error("Wallet update failed:", error);

      showMessage(
        "Unable to save wallet details. Please try again.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // SUPPORT
  // ============================================================

  const openWhatsAppSupport = () => {
    const whatsappUrl =
      `https://wa.me/923409510992?text=${encodeURIComponent(
        "Hello Support, mujhe SAMATKAAR app me madad chahiye."
      )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  // ============================================================
  // LEVEL PROGRESS
  // ============================================================

  const nextLevelTarget =
    userLevel.nextAt === "Max" ? inviteCount : userLevel.nextAt;

  const progressPercent =
    userLevel.nextAt === "Max"
      ? 100
      : Math.min(
          100,
          Math.round((inviteCount / nextLevelTarget) * 100)
        );

  return (
    <div style={inlineStyles.page}>
      <div style={inlineStyles.container}>

        {/* ======================================================
            PROFILE HERO
        ====================================================== */}

        <section style={inlineStyles.profileHero}>
          <div style={inlineStyles.heroGlowOne} />
          <div style={inlineStyles.heroGlowTwo} />

          <div style={inlineStyles.heroContent}>
            <div style={inlineStyles.avatarWrapper}>
              <div style={inlineStyles.avatarRing}>
                <div style={inlineStyles.avatarBadge}>
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Profile"
                      style={inlineStyles.avatarImg}
                    />
                  ) : name ? (
                    name.charAt(0).toUpperCase()
                  ) : (
                    "👤"
                  )}
                </div>
              </div>

              <label
                htmlFor="avatar-input"
                style={inlineStyles.uploadBtn}
                title="Change Profile Picture"
              >
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
              <div style={inlineStyles.eyebrow}>
                PERSONAL ACCOUNT
              </div>

              <h1 style={inlineStyles.profileName}>
                {name}
              </h1>

              <div style={inlineStyles.phoneText}>
                {phone}
              </div>

              <div style={inlineStyles.statusBadge}>
                <span style={inlineStyles.statusDot}>✓</span>
                Verified Secure Account
              </div>
            </div>

            <div style={inlineStyles.heroAccountBadge}>
              <div style={inlineStyles.heroBadgeIcon}>S</div>
              <div>
                <div style={inlineStyles.heroBadgeLabel}>
                  SAMATKAAR
                </div>
                <div style={inlineStyles.heroBadgeText}>
                  Member Account
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            QUICK STATS
        ====================================================== */}

        <section style={inlineStyles.statsGrid}>
          <div style={inlineStyles.statCard}>
            <div style={inlineStyles.statIcon}>🪙</div>

            <div style={inlineStyles.statBody}>
              <span style={inlineStyles.statLabel}>
                Total Balance
              </span>

              <strong style={inlineStyles.statValue}>
                {(coins || 0).toLocaleString()}
              </strong>

              <span style={inlineStyles.statSubValue}>
                ≈ ${((coins || 0) / 10000).toFixed(2)} USD
              </span>
            </div>
          </div>

          <div style={inlineStyles.statCard}>
            <div style={inlineStyles.statIcon}>👥</div>

            <div style={inlineStyles.statBody}>
              <span style={inlineStyles.statLabel}>
                Verified Invites
              </span>

              <strong style={inlineStyles.statValue}>
                {inviteCount}
              </strong>

              <span style={inlineStyles.statSubValue}>
                Real joins only
              </span>
            </div>
          </div>

          <div style={inlineStyles.statCard}>
            <div style={inlineStyles.statIcon}>⚡</div>

            <div style={inlineStyles.statBody}>
              <span style={inlineStyles.statLabel}>
                Ad Reward
              </span>

              <strong style={inlineStyles.statValue}>
                {coinsPerAd}
              </strong>

              <span style={inlineStyles.statSubValue}>
                Coins / ad
              </span>
            </div>
          </div>
        </section>

        {/* ======================================================
            LEVEL CARD
        ====================================================== */}

        <section style={inlineStyles.levelCard}>
          <div style={inlineStyles.levelTop}>
            <div>
              <div style={inlineStyles.sectionEyebrow}>
                CURRENT LEVEL
              </div>

              <div style={inlineStyles.levelTitleRow}>
                <span style={inlineStyles.levelEmoji}>
                  {userLevel.badge}
                </span>

                <h2 style={inlineStyles.levelTitle}>
                  {userLevel.name}
                </h2>
              </div>
            </div>

            <div style={inlineStyles.levelTarget}>
              <span style={inlineStyles.targetLabel}>
                NEXT TARGET
              </span>

              <strong style={inlineStyles.targetValue}>
                {userLevel.nextAt === "Max"
                  ? "MAX"
                  : `${userLevel.nextAt} invites`}
              </strong>
            </div>
          </div>

          <div style={inlineStyles.progressTrack}>
            <div
              style={{
                ...inlineStyles.progressBar,
                width: `${progressPercent}%`
              }}
            />
          </div>

          <div style={inlineStyles.progressMeta}>
            <span>
              {inviteCount} verified invites
            </span>

            <span>
              {userLevel.nextAt === "Max"
                ? "Maximum level"
                : `${Math.max(
                    0,
                    userLevel.nextAt - inviteCount
                  )} more to next level`}
            </span>
          </div>
        </section>

        {/* ======================================================
            INVITE / REFERRAL CENTER
        ====================================================== */}

        <section style={inlineStyles.inviteCard}>
          <div style={inlineStyles.inviteHeader}>
            <div>
              <div style={inlineStyles.sectionEyebrow}>
                REFERRAL CENTER
              </div>

              <h2 style={inlineStyles.inviteTitle}>
                Invite Friends & Earn
              </h2>

              <p style={inlineStyles.inviteDescription}>
                Apna personal invite link share karein. Jab koi
                naya user aapke link se genuinely join karega aur
                backend us referral ko verify karega, tabhi wo
                aapki invite history aur count mein appear hoga.
              </p>
            </div>

            <div style={inlineStyles.inviteIcon}>
              👥
            </div>
          </div>

          {/* Referral Code */}
          <div style={inlineStyles.codeCard}>
            <div>
              <span style={inlineStyles.codeLabel}>
                YOUR INVITE CODE
              </span>

              <div style={inlineStyles.codeValue}>
                {userReferralCode}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              style={inlineStyles.smallCopyBtn}
            >
              {copied ? "✓ Copied" : "Copy Link"}
            </button>
          </div>

          {/* Referral URL */}
          <div style={inlineStyles.linkBox}>
            <div style={inlineStyles.linkIcon}>
              🔗
            </div>

            <input
              type="text"
              readOnly
              value={userReferralLink}
              aria-label="Your referral link"
              style={inlineStyles.linkInput}
              onFocus={(e) => e.target.select()}
            />

            <button
              type="button"
              onClick={handleCopyLink}
              style={inlineStyles.copyBtn}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>

          {/* Share */}
          <button
            type="button"
            onClick={handleShareInvite}
            style={inlineStyles.shareBtn}
          >
            <span style={inlineStyles.shareIcon}>
              {shared ? "✓" : "↗"}
            </span>

            <span>
              {shared
                ? "Invite Ready"
                : "Share My Invite Link"}
            </span>
          </button>

          {/* Fraud / verification information */}
          <div style={inlineStyles.securityNotice}>
            <div style={inlineStyles.securityIcon}>
              🛡️
            </div>

            <div>
              <strong style={inlineStyles.securityTitle}>
                Verified referrals only
              </strong>

              <p style={inlineStyles.securityText}>
                Fake accounts, duplicate accounts, self-referrals,
                or unverified joins are not counted. Referral
                history is designed to show only backend-confirmed
                users.
              </p>
            </div>
          </div>

          {/* Invite Stats */}
          <div style={inlineStyles.inviteStats}>
            <div style={inlineStyles.inviteStat}>
              <span style={inlineStyles.inviteStatNumber}>
                {inviteCount}
              </span>

              <span style={inlineStyles.inviteStatLabel}>
                Verified Joins
              </span>
            </div>

            <div style={inlineStyles.inviteStatDivider} />

            <div style={inlineStyles.inviteStat}>
              <span style={inlineStyles.inviteStatNumber}>
                {inviteCount}
              </span>

              <span style={inlineStyles.inviteStatLabel}>
                Eligible Referrals
              </span>
            </div>

            <div style={inlineStyles.inviteStatDivider} />

            <div style={inlineStyles.inviteStat}>
              <span style={inlineStyles.inviteStatNumber}>
                {inviteCount}
              </span>

              <span style={inlineStyles.inviteStatLabel}>
                Invite History
              </span>
            </div>
          </div>

          {/* ==================================================
              INVITE HISTORY
          ================================================== */}

          <div style={inlineStyles.historyCard}>
            <div style={inlineStyles.historyHeader}>
              <div>
                <h3 style={inlineStyles.historyTitle}>
                  Invite History
                </h3>

                <span style={inlineStyles.historySubtitle}>
                  Backend-verified joins will appear here
                </span>
              </div>

              <span style={inlineStyles.historyCount}>
                {inviteHistory.length}
              </span>
            </div>

            {inviteHistory.length === 0 ? (
              <div style={inlineStyles.emptyHistory}>
                <div style={inlineStyles.emptyHistoryIcon}>
                  👥
                </div>

                <strong style={inlineStyles.emptyHistoryTitle}>
                  No verified invites yet
                </strong>

                <p style={inlineStyles.emptyHistoryText}>
                  Share your invite link with friends. A user
                  will appear here only after a genuine,
                  backend-confirmed referral.
                </p>

                <button
                  type="button"
                  onClick={handleShareInvite}
                  style={inlineStyles.emptyHistoryBtn}
                >
                  {shared
                    ? "✓ Invite Ready"
                    : "Share Invite Link"}
                </button>
              </div>
            ) : (
              <div style={inlineStyles.historyList}>
                {inviteHistory.map((item, idx) => (
                  <div
                    key={item.id || `${item.phone || item.name}-${idx}`}
                    style={inlineStyles.historyItem}
                  >
                    <div style={inlineStyles.historyUserIcon}>
                      {item.name
                        ? item.name.charAt(0).toUpperCase()
                        : "U"}
                    </div>

                    <div style={inlineStyles.historyUser}>
                      <strong>
                        {item.name || "Verified User"}
                      </strong>

                      <span>
                        {item.time || item.joinedAt || "Verified"}
                      </span>
                    </div>

                    <div style={inlineStyles.verifiedPill}>
                      ✓ Verified
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ======================================================
            NOTIFICATION
        ====================================================== */}

        {message.text && (
          <div
            style={{
              ...inlineStyles.toast,
              ...(message.type === "error"
                ? inlineStyles.toastError
                : inlineStyles.toastSuccess)
            }}
          >
            <span style={inlineStyles.toastIcon}>
              {message.type === "error" ? "!" : "✓"}
            </span>

            <span>{message.text}</span>
          </div>
        )}

        {/* ======================================================
            ACCOUNT & PAYOUT
        ====================================================== */}

        <section style={inlineStyles.card}>
          <div style={inlineStyles.cardHeader}>
            <div>
              <div style={inlineStyles.sectionEyebrow}>
                ACCOUNT SETTINGS
              </div>

              <h2 style={inlineStyles.cardTitle}>
                Account & Payout Info
              </h2>

              <p style={inlineStyles.cardDescription}>
                Manage your payout method and account information.
                Your registered identity details remain locked for
                account security.
              </p>
            </div>

            <div style={inlineStyles.cardIcon}>
              ⚙️
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div style={inlineStyles.formGrid}>
              <div style={inlineStyles.formGroup}>
                <label style={inlineStyles.label}>
                  Full Name
                </label>

                <div style={inlineStyles.lockedInputWrap}>
                  <span style={inlineStyles.inputIcon}>
                    👤
                  </span>

                  <input
                    type="text"
                    value={name}
                    disabled
                    style={inlineStyles.disabledInput}
                  />

                  <span style={inlineStyles.lockIcon}>
                    🔒
                  </span>
                </div>

                <small style={inlineStyles.smallWarning}>
                  Registered name is locked for security.
                </small>
              </div>

              <div style={inlineStyles.formGroup}>
                <label style={inlineStyles.label}>
                  WhatsApp / Mobile Number
                </label>

                <div style={inlineStyles.lockedInputWrap}>
                  <span style={inlineStyles.inputIcon}>
                    📱
                  </span>

                  <input
                    type="tel"
                    value={phone}
                    disabled
                    style={inlineStyles.disabledInput}
                  />

                  <span style={inlineStyles.lockIcon}>
                    🔒
                  </span>
                </div>

                <small style={inlineStyles.smallWarning}>
                  Login phone number cannot be changed here.
                </small>
              </div>
            </div>

            <div style={inlineStyles.payoutBox}>
              <div style={inlineStyles.payoutHeading}>
                <span style={inlineStyles.payoutHeadingIcon}>
                  💳
                </span>

                <div>
                  <strong style={inlineStyles.payoutTitle}>
                    Payout Method
                  </strong>

                  <span style={inlineStyles.payoutSubtitle}>
                    Select where you want to receive eligible payouts.
                  </span>
                </div>
              </div>

              <div style={inlineStyles.formGrid}>
                <div style={inlineStyles.formGroup}>
                  <label style={inlineStyles.label}>
                    Payment Method
                  </label>

                  <select
                    value={walletType}
                    onChange={(e) =>
                      setWalletType(e.target.value)
                    }
                    style={inlineStyles.input}
                  >
                    <option value="easypaisa">
                      EasyPaisa
                    </option>

                    <option value="jazzcash">
                      JazzCash
                    </option>

                    <option value="bank">
                      Bank Transfer
                    </option>
                  </select>
                </div>

                <div style={inlineStyles.formGroup}>
                  <label style={inlineStyles.label}>
                    Account / Wallet Number
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. 03001234567"
                    value={walletNumber}
                    onChange={(e) =>
                      setWalletNumber(e.target.value)
                    }
                    required
                    style={inlineStyles.input}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                ...inlineStyles.saveBtn,
                ...(isSaving
                  ? inlineStyles.saveBtnDisabled
                  : {})
              }}
            >
              {isSaving ? (
                <>
                  <span style={inlineStyles.buttonSpinner} />
                  Saving...
                </>
              ) : (
                <>
                  <span>✓</span>
                  Save Wallet Details
                </>
              )}
            </button>
          </form>
        </section>

        {/* ======================================================
            SUPPORT
        ====================================================== */}

        <section style={inlineStyles.supportCard}>
          <div style={inlineStyles.supportIcon}>
            💬
          </div>

          <div style={inlineStyles.supportContent}>
            <div style={inlineStyles.sectionEyebrow}>
              SUPPORT CENTER
            </div>

            <h2 style={inlineStyles.supportTitle}>
              Need Help?
            </h2>

            <p style={inlineStyles.supportText}>
              Agar aap ko application me koi masla aa raha hai
              ya help chahiye, official support se WhatsApp par
              contact karein.
            </p>

            <button
              type="button"
              onClick={openWhatsAppSupport}
              style={inlineStyles.whatsappBtn}
            >
              <span>📱</span>
              <span>Contact Official WhatsApp Support</span>
              <span style={inlineStyles.arrow}>
                →
              </span>
            </button>
          </div>
        </section>

        {/* ======================================================
            SECURITY FOOTER
        ====================================================== */}

        <div style={inlineStyles.securityFooter}>
          <span>🔐</span>
          <span>
            Your profile information is protected by SAMATKAAR
            account security controls.
          </span>
        </div>
      </div>
    </div>
  );
}

const inlineStyles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    boxSizing: "border-box",
    background:
      "radial-gradient(circle at 50% -10%, rgba(14,165,233,0.08), transparent 32%), #020617",
    color: "#fff",
    overflowX: "hidden",
    padding: "28px 20px 50px"
  },

  container: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    boxSizing: "border-box"
  },

  profileHero: {
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(135deg, #0f172a 0%, #111c33 52%, #0b2538 100%)",
    border: "1px solid rgba(56,189,248,0.22)",
    borderRadius: "24px",
    padding: "28px",
    marginBottom: "18px",
    boxShadow:
      "0 18px 50px rgba(0,0,0,0.28)"
  },

  heroGlowOne: {
    position: "absolute",
    width: "240px",
    height: "240px",
    borderRadius: "50%",
    background: "rgba(14,165,233,0.10)",
    filter: "blur(12px)",
    top: "-130px",
    right: "15%"
  },

  heroGlowTwo: {
    position: "absolute",
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    background: "rgba(99,102,241,0.10)",
    filter: "blur(14px)",
    bottom: "-110px",
    left: "15%"
  },

  heroContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    gap: "22px",
    width: "100%",
    boxSizing: "border-box"
  },

  avatarWrapper: {
    position: "relative",
    flex: "0 0 auto",
    width: "94px",
    height: "94px"
  },

  avatarRing: {
    width: "94px",
    height: "94px",
    padding: "3px",
    boxSizing: "border-box",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg, #38bdf8, #6366f1, #22c55e)"
  },

  avatarBadge: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "#0f172a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px",
    fontWeight: "800",
    overflow: "hidden",
    border: "3px solid #0f172a",
    boxSizing: "border-box"
  },

  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  uploadBtn: {
    position: "absolute",
    right: "-2px",
    bottom: "1px",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#0284c7",
    color: "#fff",
    border: "3px solid #0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 5px 14px rgba(0,0,0,0.35)"
  },

  userMeta: {
    minWidth: 0,
    flex: 1
  },

  eyebrow: {
    fontSize: "10px",
    letterSpacing: "1.5px",
    color: "#38bdf8",
    fontWeight: "800",
    marginBottom: "6px"
  },

  profileName: {
    margin: 0,
    fontSize: "clamp(24px, 3vw, 34px)",
    lineHeight: 1.15,
    fontWeight: "800",
    color: "#fff",
    wordBreak: "break-word"
  },

  phoneText: {
    color: "#94a3b8",
    fontSize: "13px",
    marginTop: "5px",
    wordBreak: "break-word"
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "10px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#86efac",
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.20)",
    padding: "5px 9px",
    borderRadius: "999px"
  },

  statusDot: {
    width: "17px",
    height: "17px",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(34,197,94,0.16)",
    color: "#4ade80",
    fontSize: "10px"
  },

  heroAccountBadge: {
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "14px",
    background: "rgba(15,23,42,0.65)",
    border: "1px solid rgba(148,163,184,0.14)"
  },

  heroBadgeIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, #0284c7, #4f46e5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "900",
    color: "#fff"
  },

  heroBadgeLabel: {
    fontSize: "11px",
    fontWeight: "900",
    color: "#e2e8f0",
    letterSpacing: "1px"
  },

  heroBadgeText: {
    fontSize: "10px",
    color: "#64748b",
    marginTop: "2px"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "18px"
  },

  statCard: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "13px",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "18px",
    padding: "18px",
    boxSizing: "border-box",
    boxShadow:
      "0 10px 28px rgba(0,0,0,0.16)"
  },

  statIcon: {
    flex: "0 0 auto",
    width: "44px",
    height: "44px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(14,165,233,0.10)",
    border: "1px solid rgba(56,189,248,0.12)",
    fontSize: "21px"
  },

  statBody: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column"
  },

  statLabel: {
    color: "#64748b",
    fontSize: "10px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.7px"
  },

  statValue: {
    color: "#f8fafc",
    fontSize: "21px",
    fontWeight: "800",
    lineHeight: 1.2,
    marginTop: "3px"
  },

  statSubValue: {
    color: "#38bdf8",
    fontSize: "10px",
    marginTop: "3px"
  },

  levelCard: {
    background:
      "linear-gradient(135deg, #17153a 0%, #111b3a 55%, #0b2430 100%)",
    border: "1px solid rgba(99,102,241,0.35)",
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "18px",
    boxShadow:
      "0 12px 35px rgba(0,0,0,0.18)"
  },

  levelTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px"
  },

  sectionEyebrow: {
    color: "#38bdf8",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1.4px",
    textTransform: "uppercase",
    marginBottom: "5px"
  },

  levelTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },

  levelEmoji: {
    fontSize: "23px"
  },

  levelTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#f8fafc",
    fontWeight: "800"
  },

  levelTarget: {
    textAlign: "right",
    flex: "0 0 auto"
  },

  targetLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "9px",
    fontWeight: "800",
    letterSpacing: "0.8px"
  },

  targetValue: {
    display: "block",
    color: "#a5b4fc",
    fontSize: "14px",
    marginTop: "4px"
  },

  progressTrack: {
    width: "100%",
    height: "8px",
    borderRadius: "999px",
    overflow: "hidden",
    background: "#0f172a",
    marginTop: "18px",
    border: "1px solid rgba(255,255,255,0.04)"
  },

  progressBar: {
    height: "100%",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, #38bdf8, #6366f1, #22c55e)",
    transition: "width 0.35s ease"
  },

  progressMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginTop: "8px",
    color: "#64748b",
    fontSize: "10px"
  },

  inviteCard: {
    background:
      "linear-gradient(180deg, #0f172a 0%, #0b1222 100%)",
    border: "1px solid rgba(56,189,248,0.18)",
    borderRadius: "22px",
    padding: "22px",
    marginBottom: "18px",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.20)"
  },

  inviteHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "18px"
  },

  inviteTitle: {
    margin: 0,
    color: "#f8fafc",
    fontSize: "24px",
    fontWeight: "800"
  },

  inviteDescription: {
    maxWidth: "760px",
    margin: "7px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: 1.7
  },

  inviteIcon: {
    flex: "0 0 auto",
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    background:
      "linear-gradient(135deg, rgba(14,165,233,0.16), rgba(99,102,241,0.16))",
    border: "1px solid rgba(56,189,248,0.18)"
  },

  codeCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    padding: "16px",
    background:
      "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(99,102,241,0.06))",
    border: "1px solid rgba(56,189,248,0.15)",
    borderRadius: "15px",
    marginBottom: "12px"
  },

  codeLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "9px",
    fontWeight: "800",
    letterSpacing: "1px"
  },

  codeValue: {
    color: "#f8fafc",
    fontSize: "21px",
    fontWeight: "900",
    letterSpacing: "2px",
    marginTop: "4px"
  },

  smallCopyBtn: {
    flex: "0 0 auto",
    border: "1px solid rgba(56,189,248,0.30)",
    background: "rgba(14,165,233,0.10)",
    color: "#7dd3fc",
    padding: "9px 13px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "800"
  },

  linkBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#020617",
    border: "1px solid #263449",
    borderRadius: "13px",
    padding: "7px",
    marginBottom: "10px",
    boxSizing: "border-box"
  },

  linkIcon: {
    flex: "0 0 auto",
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f172a",
    fontSize: "14px"
  },

  linkInput: {
    minWidth: 0,
    flex: 1,
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#cbd5e1",
    fontSize: "12px",
    padding: "6px"
  },

  copyBtn: {
    flex: "0 0 auto",
    border: "none",
    background: "#0284c7",
    color: "#fff",
    padding: "9px 13px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "800"
  },

  shareBtn: {
    width: "100%",
    border: "1px solid rgba(34,197,94,0.25)",
    background:
      "linear-gradient(135deg, rgba(34,197,94,0.14), rgba(16,185,129,0.07))",
    color: "#86efac",
    padding: "12px 15px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxSizing: "border-box"
  },

  shareIcon: {
    fontSize: "15px"
  },

  securityNotice: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginTop: "13px",
    padding: "12px",
    borderRadius: "12px",
    background: "rgba(245,158,11,0.055)",
    border: "1px solid rgba(245,158,11,0.14)"
  },

  securityIcon: {
    flex: "0 0 auto",
    fontSize: "16px"
  },

  securityTitle: {
    display: "block",
    color: "#fbbf24",
    fontSize: "11px"
  },

  securityText: {
    margin: "4px 0 0",
    color: "#94a3b8",
    fontSize: "10px",
    lineHeight: 1.6
  },

  inviteStats: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1px 1fr 1px 1fr",
    alignItems: "center",
    marginTop: "15px",
    padding: "14px 8px",
    borderRadius: "13px",
    background: "rgba(2,6,23,0.65)",
    border: "1px solid rgba(148,163,184,0.08)"
  },

  inviteStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px"
  },

  inviteStatNumber: {
    color: "#f8fafc",
    fontSize: "18px",
    fontWeight: "900"
  },

  inviteStatLabel: {
    color: "#64748b",
    fontSize: "9px",
    textAlign: "center"
  },

  inviteStatDivider: {
    width: "1px",
    height: "30px",
    background: "#1e293b"
  },

  historyCard: {
    marginTop: "15px",
    padding: "15px",
    borderRadius: "15px",
    background: "rgba(2,6,23,0.55)",
    border: "1px solid rgba(148,163,184,0.08)"
  },

  historyHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "12px"
  },

  historyTitle: {
    margin: 0,
    color: "#e2e8f0",
    fontSize: "13px",
    fontWeight: "800"
  },

  historySubtitle: {
    display: "block",
    color: "#64748b",
    fontSize: "9px",
    marginTop: "3px"
  },

  historyCount: {
    minWidth: "28px",
    height: "28px",
    padding: "0 8px",
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f172a",
    color: "#38bdf8",
    border: "1px solid #1e293b",
    fontSize: "11px",
    fontWeight: "900",
    boxSizing: "border-box"
  },

  emptyHistory: {
    textAlign: "center",
    padding: "24px 15px 20px"
  },

  emptyHistoryIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "15px",
    margin: "0 auto 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f172a",
    border: "1px solid #1e293b",
    fontSize: "21px"
  },

  emptyHistoryTitle: {
    display: "block",
    color: "#cbd5e1",
    fontSize: "12px"
  },

  emptyHistoryText: {
    maxWidth: "480px",
    margin: "6px auto 12px",
    color: "#64748b",
    fontSize: "10px",
    lineHeight: 1.6
  },

  emptyHistoryBtn: {
    border: "1px solid rgba(56,189,248,0.25)",
    background: "rgba(14,165,233,0.08)",
    color: "#7dd3fc",
    borderRadius: "9px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "800"
  },

  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    maxHeight: "250px",
    overflowY: "auto"
  },

  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px",
    borderRadius: "10px",
    background: "#0f172a",
    border: "1px solid #1e293b"
  },

  historyUserIcon: {
    width: "32px",
    height: "32px",
    flex: "0 0 auto",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #0284c7, #4f46e5)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "800"
  },

  historyUser: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },

  verifiedPill: {
    flex: "0 0 auto",
    color: "#86efac",
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.14)",
    padding: "4px 7px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: "800"
  },

  toast: {
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px 14px",
    borderRadius: "12px",
    marginBottom: "18px",
    fontSize: "12px",
    fontWeight: "700",
    textAlign: "center",
    border: "1px solid transparent"
  },

  toastSuccess: {
    background: "rgba(20,83,45,0.75)",
    color: "#86efac",
    borderColor: "rgba(74,222,128,0.18)"
  },

  toastError: {
    background: "rgba(127,29,29,0.75)",
    color: "#fca5a5",
    borderColor: "rgba(248,113,113,0.18)"
  },

  toastIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.07)"
  },

  card: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "22px",
    padding: "22px",
    marginBottom: "18px",
    boxSizing: "border-box",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.16)"
  },

  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "20px"
  },

  cardTitle: {
    margin: 0,
    color: "#f8fafc",
    fontSize: "21px",
    fontWeight: "800"
  },

  cardDescription: {
    maxWidth: "750px",
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: "11px",
    lineHeight: 1.7
  },

  cardIcon: {
    flex: "0 0 auto",
    width: "45px",
    height: "45px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#111c33",
    border: "1px solid #263449",
    fontSize: "19px"
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "14px"
  },

  formGroup: {
    minWidth: 0,
    marginBottom: "14px"
  },

  label: {
    display: "block",
    fontSize: "11px",
    marginBottom: "7px",
    color: "#cbd5e1",
    fontWeight: "800"
  },

  lockedInputWrap: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    background: "#020617",
    border: "1px solid #263449",
    borderRadius: "11px",
    boxSizing: "border-box",
    overflow: "hidden"
  },

  inputIcon: {
    flex: "0 0 auto",
    paddingLeft: "11px",
    fontSize: "13px"
  },

  lockIcon: {
    flex: "0 0 auto",
    paddingRight: "11px",
    fontSize: "11px",
    opacity: 0.7
  },

  input: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "12px 13px",
    borderRadius: "11px",
    border: "1px solid #263449",
    background: "#020617",
    color: "#fff",
    fontSize: "13px",
    outline: "none"
  },

  disabledInput: {
    width: "100%",
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: "13px",
    padding: "12px 8px",
    boxSizing: "border-box",
    cursor: "not-allowed"
  },

  smallWarning: {
    display: "block",
    color: "#64748b",
    marginTop: "6px",
    fontSize: "9px",
    lineHeight: 1.5
  },

  payoutBox: {
    marginTop: "4px",
    padding: "16px",
    borderRadius: "15px",
    background: "#0b1222",
    border: "1px solid #1e293b"
  },

  payoutHeading: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px"
  },

  payoutHeadingIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(14,165,233,0.10)",
    fontSize: "15px"
  },

  payoutTitle: {
    display: "block",
    color: "#e2e8f0",
    fontSize: "12px"
  },

  payoutSubtitle: {
    display: "block",
    color: "#64748b",
    fontSize: "9px",
    marginTop: "2px"
  },

  saveBtn: {
    width: "100%",
    minHeight: "46px",
    background:
      "linear-gradient(135deg, #0284c7, #2563eb)",
    color: "#fff",
    border: "none",
    padding: "12px 16px",
    borderRadius: "11px",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "12px",
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow:
      "0 8px 20px rgba(37,99,235,0.18)"
  },

  saveBtnDisabled: {
    opacity: 0.65,
    cursor: "not-allowed"
  },

  buttonSpinner: {
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.35)",
    borderTopColor: "#fff",
    display: "inline-block"
  },

  supportCard: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background:
      "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(15,23,42,0.95))",
    border: "1px solid rgba(34,197,94,0.18)",
    borderRadius: "22px",
    padding: "22px",
    marginBottom: "18px",
    boxSizing: "border-box"
  },

  supportIcon: {
    flex: "0 0 auto",
    width: "55px",
    height: "55px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(34,197,94,0.10)",
    border: "1px solid rgba(34,197,94,0.16)",
    fontSize: "24px"
  },

  supportContent: {
    minWidth: 0,
    flex: 1
  },

  supportTitle: {
    margin: 0,
    color: "#f8fafc",
    fontSize: "21px",
    fontWeight: "800"
  },

  supportText: {
    maxWidth: "700px",
    margin: "6px 0 14px",
    color: "#94a3b8",
    fontSize: "11px",
    lineHeight: 1.65
  },

  whatsappBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    background: "#22c55e",
    color: "#052e16",
    border: "none",
    padding: "11px 15px",
    borderRadius: "10px",
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "11px",
    boxSizing: "border-box"
  },

  arrow: {
    fontSize: "14px",
    marginLeft: "2px"
  },

  securityFooter: {
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    color: "#475569",
    fontSize: "9px",
    textAlign: "center",
    lineHeight: 1.5,
    padding: "4px 10px 0"
  }
};

export default Profile;
