import React, { useEffect, useMemo, useState } from "react";

const BACKEND_URL =
  "https://my-react-backend-production-84e7.up.railway.app";

const ADMIN_TOKEN_STORAGE_KEY =
  "samatkaarAdminDepositSession";

export default function AdminDeposits({ user, navigate }) {
  const [adminPhone, setAdminPhone] = useState(user?.phone || "");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminToken, setAdminToken] = useState(
    () => sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || ""
  );

  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (user?.phone) {
      setAdminPhone(user.phone);
    }
  }, [user?.phone]);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });

    window.clearTimeout(showMessage.timer);

    showMessage.timer = window.setTimeout(() => {
      setMessage({ text: "", type: "" });
    }, 4500);
  };

  const clearAdminSession = (showExpiredMessage = false) => {
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setAdminToken("");
    setDeposits([]);
    setAdminPassword("");

    if (showExpiredMessage) {
      showMessage(
        "Admin session expire/invalid ho gayi. Dobara admin login karein.",
        "error"
      );
    }
  };

  const authHeaders = useMemo(
    () => ({
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    }),
    [adminToken]
  );

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    if (!adminPhone.trim() || !adminPassword) {
      showMessage(
        "Admin phone aur password enter karein.",
        "error"
      );
      return;
    }

    setLoginLoading(true);

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/admin/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            phone: adminPhone.trim(),
            password: adminPassword
          })
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success || !data.token) {
        throw new Error(
          data.error || "Admin login nahi ho saka."
        );
      }

      sessionStorage.setItem(
        ADMIN_TOKEN_STORAGE_KEY,
        data.token
      );

      setAdminToken(data.token);
      setAdminPassword("");

      showMessage(
        "Admin verification successful.",
        "success"
      );
    } catch (err) {
      showMessage(
        err.message || "Admin login request fail ho gayi.",
        "error"
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const loadPendingDeposits = async () => {
    if (!adminToken) {
      showMessage(
        "Pehle secure admin login karein.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/admin/deposits/pending`,
        {
          method: "GET",
          headers: authHeaders,
          cache: "no-store"
        }
      );

      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 403) {
        clearAdminSession(true);
        return;
      }

      if (!res.ok || data.success === false) {
        throw new Error(
          data.error ||
            "Pending deposits load nahi ho sake."
        );
      }

      setDeposits(
        Array.isArray(data.deposits)
          ? data.deposits
          : []
      );
    } catch (err) {
      showMessage(
        err.message || "Server connection error.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      loadPendingDeposits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const approveDeposit = async (deposit) => {
    if (!deposit?._id || workingId) return;

    const confirmed = window.confirm(
      `Approve Rs.${Number(
        deposit.amountPKR || 0
      ).toLocaleString()} deposit?\n` +
        `${Number(
          deposit.coinsToCredit || 0
        ).toLocaleString()} coins user ko credit honge.\n\n` +
        `TRX: ${deposit.transactionId || "-"}`
    );

    if (!confirmed) return;

    setWorkingId(deposit._id);

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/admin/deposits/${encodeURIComponent(
          deposit._id
        )}/approve`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({})
        }
      );

      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 403) {
        clearAdminSession(true);
        return;
      }

      if (!res.ok || data.success === false) {
        throw new Error(
          data.error || "Deposit approve nahi ho saka."
        );
      }

      setDeposits((prev) =>
        prev.filter(
          (item) => item._id !== deposit._id
        )
      );

      showMessage(
        `Approved: ${Number(
          data.coinsCredited ||
            deposit.coinsToCredit ||
            0
        ).toLocaleString()} coins credit ho gaye.`,
        "success"
      );
    } catch (err) {
      showMessage(
        err.message ||
          "Approve request fail ho gayi.",
        "error"
      );
    } finally {
      setWorkingId("");
    }
  };

  const openReject = (deposit) => {
    if (workingId) return;
    setRejecting(deposit);
    setRejectReason("");
  };

  const rejectDeposit = async () => {
    if (!rejecting?._id || workingId) return;

    const reason = rejectReason.trim();

    if (reason.length < 3) {
      showMessage(
        "Reject karne ki wajah likhein.",
        "error"
      );
      return;
    }

    const confirmed = window.confirm(
      `Is deposit ko reject karna hai?\nTRX: ${
        rejecting.transactionId || "-"
      }\nUser ko koi coins nahi milenge.`
    );

    if (!confirmed) return;

    setWorkingId(rejecting._id);

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/admin/deposits/${encodeURIComponent(
          rejecting._id
        )}/reject`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ reason })
        }
      );

      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 403) {
        clearAdminSession(true);
        return;
      }

      if (!res.ok || data.success === false) {
        throw new Error(
          data.error || "Deposit reject nahi ho saka."
        );
      }

      setDeposits((prev) =>
        prev.filter(
          (item) => item._id !== rejecting._id
        )
      );

      setRejecting(null);
      setRejectReason("");

      showMessage(
        "Deposit rejected. User ko koi coins add nahi hue.",
        "success"
      );
    } catch (err) {
      showMessage(
        err.message ||
          "Reject request fail ho gayi.",
        "error"
      );
    } finally {
      setWorkingId("");
    }
  };

  useEffect(() => {
    return () => {
      window.clearTimeout(showMessage.timer);
    };
  }, []);

  if (!adminToken) {
    return (
      <div style={styles.page}>
        <div style={styles.loginCard}>
          <div style={styles.kicker}>
            SAMATKAAR SECURE ADMIN
          </div>

          <h1 style={styles.loginTitle}>
            🛡️ Deposit Admin Login
          </h1>

          <p style={styles.muted}>
            Sirf Railway ke ADMIN_PHONE wale registered
            account ko admin access milega. Private
            ADMIN_DEPOSIT_KEY browser ko nahi bheji jati.
          </p>

          {user?.role !== "admin" && (
            <div style={styles.warning}>
              Is session mein admin role nahi mila. Railway
              update ke baad normal account se logout karke
              dobara login karein.
            </div>
          )}

          {message.text && (
            <Alert message={message} />
          )}

          <form
            onSubmit={handleAdminLogin}
            style={styles.form}
          >
            <label style={styles.label}>
              Admin Phone
              <input
                type="text"
                value={adminPhone}
                onChange={(e) =>
                  setAdminPhone(e.target.value)
                }
                placeholder="Registered admin phone"
                autoComplete="username"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Account Password
              <input
                type="password"
                value={adminPassword}
                onChange={(e) =>
                  setAdminPassword(e.target.value)
                }
                placeholder="Your SAMATKAAR password"
                autoComplete="current-password"
                style={styles.input}
              />
            </label>

            <button
              type="submit"
              disabled={loginLoading}
              style={styles.primaryButton}
            >
              {loginLoading
                ? "Verifying..."
                : "Secure Admin Login"}
            </button>
          </form>

          {typeof navigate === "function" && (
            <button
              type="button"
              onClick={() => navigate("home")}
              style={styles.secondaryButton}
            >
              ← Back to SAMATKAAR
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.headerCard}>
          <div style={styles.headerRow}>
            <div>
              <div style={styles.kicker}>
                SAMATKAAR ADMIN
              </div>

              <h1 style={styles.title}>
                Deposit Verification
              </h1>

              <div style={styles.muted}>
                Genuine payment verify karke hi approve
                karein.
              </div>
            </div>

            <div style={styles.pendingBox}>
              <div style={styles.pendingLabel}>
                PENDING
              </div>
              <div style={styles.pendingValue}>
                {deposits.length}
              </div>
            </div>
          </div>

          <div style={styles.toolbar}>
            <button
              type="button"
              onClick={loadPendingDeposits}
              disabled={loading}
              style={styles.primaryButton}
            >
              {loading
                ? "Loading..."
                : "↻ Refresh Pending"}
            </button>

            <button
              type="button"
              onClick={() =>
                clearAdminSession(false)
              }
              style={styles.dangerButton}
            >
              Admin Logout
            </button>

            {typeof navigate === "function" && (
              <button
                type="button"
                onClick={() => navigate("home")}
                style={styles.secondaryButton}
              >
                ← Back
              </button>
            )}
          </div>
        </div>

        {message.text && (
          <Alert message={message} />
        )}

        {!loading && deposits.length === 0 ? (
          <div style={styles.empty}>
            Koi pending deposit nahi hai.
          </div>
        ) : (
          <div style={styles.list}>
            {deposits.map((deposit) => {
              const userData =
                deposit.userId &&
                typeof deposit.userId === "object"
                  ? deposit.userId
                  : {};

              return (
                <div
                  key={deposit._id}
                  style={styles.depositCard}
                >
                  <div style={styles.infoGrid}>
                    <Info
                      label="User"
                      value={userData.name || "Unknown"}
                    />
                    <Info
                      label="Phone"
                      value={userData.phone || "-"}
                    />
                    <Info
                      label="Amount"
                      value={`Rs. ${Number(
                        deposit.amountPKR || 0
                      ).toLocaleString()}`}
                    />
                    <Info
                      label="Coins"
                      value={`🪙 ${Number(
                        deposit.coinsToCredit || 0
                      ).toLocaleString()}`}
                    />
                    <Info
                      label="Method"
                      value={String(
                        deposit.method || ""
                      ).toUpperCase()}
                    />
                    <Info
                      label="TRX ID"
                      value={
                        deposit.transactionId || "-"
                      }
                    />
                    <Info
                      label="Status"
                      value="PENDING"
                      accent="#f59e0b"
                    />
                  </div>

                  <div style={styles.actions}>
                    <button
                      type="button"
                      disabled={
                        workingId === deposit._id
                      }
                      onClick={() =>
                        approveDeposit(deposit)
                      }
                      style={styles.approveButton}
                    >
                      {workingId === deposit._id
                        ? "Processing..."
                        : "✓ Approve & Credit Coins"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        workingId === deposit._id
                      }
                      onClick={() =>
                        openReject(deposit)
                      }
                      style={styles.dangerButton}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {rejecting && (
          <div style={styles.modalBackdrop}>
            <div style={styles.modal}>
              <h3 style={{ marginTop: 0 }}>
                Reject Deposit
              </h3>

              <div style={styles.muted}>
                TRX:{" "}
                <strong style={{ color: "#fff" }}>
                  {rejecting.transactionId}
                </strong>
              </div>

              <textarea
                value={rejectReason}
                onChange={(e) =>
                  setRejectReason(e.target.value)
                }
                placeholder="Example: Transaction ID verify nahi hui."
                rows={4}
                maxLength={300}
                style={styles.textarea}
              />

              <div style={styles.actions}>
                <button
                  type="button"
                  onClick={rejectDeposit}
                  disabled={Boolean(workingId)}
                  style={styles.dangerButton}
                >
                  Confirm Reject
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRejecting(null);
                    setRejectReason("");
                  }}
                  disabled={Boolean(workingId)}
                  style={styles.secondaryButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Alert({ message }) {
  return (
    <div
      style={{
        ...styles.alert,
        background:
          message.type === "error"
            ? "#7f1d1d"
            : "#14532d",
        borderColor:
          message.type === "error"
            ? "#ef4444"
            : "#22c55e"
      }}
    >
      {message.text}
    </div>
  );
}

function Info({
  label,
  value,
  accent = "#f8fafc"
}) {
  return (
    <div>
      <div style={styles.infoLabel}>
        {label}
      </div>
      <div
        style={{
          ...styles.infoValue,
          color: accent
        }}
      >
        {value}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "clamp(14px, 2.5vw, 28px)",
    background: "#020617",
    color: "#f8fafc",
    boxSizing: "border-box"
  },

  shell: {
    width: "100%",
    maxWidth: 1180,
    margin: "0 auto"
  },

  loginCard: {
    width: "min(100%, 520px)",
    margin: "5vh auto 0",
    padding: "clamp(18px, 4vw, 30px)",
    borderRadius: 18,
    background:
      "linear-gradient(135deg, #0f172a, #1e293b)",
    border: "1px solid #334155",
    boxSizing: "border-box"
  },

  kicker: {
    color: "#38bdf8",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 1.3
  },

  loginTitle: {
    margin: "8px 0 10px",
    fontSize: "clamp(24px, 5vw, 34px)"
  },

  title: {
    margin: "5px 0 4px",
    fontSize: "clamp(24px, 4vw, 38px)"
  },

  muted: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 1.6
  },

  warning: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    color: "#fde68a",
    background: "rgba(146,64,14,.25)",
    border: "1px solid rgba(245,158,11,.4)",
    fontSize: 13,
    lineHeight: 1.5
  },

  form: {
    display: "grid",
    gap: 13,
    marginTop: 20
  },

  label: {
    display: "grid",
    gap: 6,
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: 700
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    borderRadius: 9,
    border: "1px solid #334155",
    background: "#020617",
    color: "#fff",
    fontSize: 15
  },

  textarea: {
    width: "100%",
    resize: "vertical",
    boxSizing: "border-box",
    padding: 12,
    marginTop: 14,
    borderRadius: 9,
    border: "1px solid #334155",
    background: "#020617",
    color: "#fff"
  },

  headerCard: {
    background:
      "linear-gradient(135deg, #0f172a, #1e293b)",
    border: "1px solid #334155",
    borderRadius: 18,
    padding: "clamp(16px, 3vw, 26px)",
    marginBottom: 18
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap"
  },

  pendingBox: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: "10px 14px",
    minWidth: 145
  },

  pendingLabel: {
    color: "#64748b",
    fontSize: 11
  },

  pendingValue: {
    fontSize: 26,
    fontWeight: 900,
    color: "#f59e0b"
  },

  toolbar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 18
  },

  primaryButton: {
    border: 0,
    borderRadius: 9,
    padding: "11px 15px",
    background: "#0284c7",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer"
  },

  secondaryButton: {
    border: "1px solid #475569",
    borderRadius: 9,
    padding: "10px 14px",
    background: "#334155",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer"
  },

  approveButton: {
    border: 0,
    borderRadius: 9,
    padding: "10px 14px",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer"
  },

  dangerButton: {
    border: 0,
    borderRadius: 9,
    padding: "10px 14px",
    background: "#dc2626",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer"
  },

  alert: {
    margin: "16px 0",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid",
    fontWeight: 700
  },

  empty: {
    padding: 28,
    textAlign: "center",
    border: "1px solid #334155",
    borderRadius: 14,
    background: "#0f172a",
    color: "#94a3b8"
  },

  list: {
    display: "grid",
    gap: 13
  },

  depositCard: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 14,
    padding: 16
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(145px, 1fr))",
    gap: 12
  },

  infoLabel: {
    color: "#64748b",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.7
  },

  infoValue: {
    fontWeight: 800,
    marginTop: 4,
    overflowWrap: "anywhere"
  },

  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 16
  },

  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, .82)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    zIndex: 9999
  },

  modal: {
    width: "min(100%, 520px)",
    background: "#0f172a",
    border: "1px solid #475569",
    borderRadius: 16,
    padding: 20,
    boxSizing: "border-box"
  }
};
