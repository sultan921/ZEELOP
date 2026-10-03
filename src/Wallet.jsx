import React, { useCallback, useEffect, useState } from "react";
import { useLanguage } from "./LanguageContext";

const BACKEND_URL = "https://my-react-backend-production-84e7.up.railway.app";

export default function Wallet({ coins = 0, user = {}, deductCoins, navigate }) {
  const { currency, activeCurrency, convertCoins } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [alertMsg, setAlertMsg] = useState({ text: "", type: "" });

  const [depositAmount, setDepositAmount] = useState("50");
  const [depositMethod, setDepositMethod] = useState("easypaisa");
  const [depositTrxId, setDepositTrxId] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("EasyPaisa");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const [transferUserId, setTransferUserId] = useState("");
  const [transferCoins, setTransferCoins] = useState("");

  const userId = String(user?._id || user?.id || user?.userId || "");

  const showAlert = (text, type = "success") => {
    setAlertMsg({ text, type });
    window.setTimeout(() => setAlertMsg({ text: "", type: "" }), 4500);
  };

  const loadDeposits = useCallback(async () => {
    if (!userId) {
      setDeposits([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/deposits/user/${encodeURIComponent(userId)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || "Deposit history load nahi ho saki.");
      }
      const list = data.deposits || data.records || data.data || [];
      setDeposits(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Deposit history error:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDeposits();
  }, [loadDeposits]);

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    const trxId = depositTrxId.trim();

    if (!userId) return showAlert("❌ Deposit ke liye pehle login karein.", "error");
    if (!Number.isInteger(amount) || amount < 10 || amount > 100000) return showAlert("❌ Deposit Rs.10 se Rs.100,000 ke darmiyan whole PKR mein hona chahiye.", "error");
    if (!trxId) return showAlert("⚠️ Original TRX ID enter karna zaroori hai.", "error");

    setDepositLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/deposits/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amountPKR: amount,
          method: depositMethod,
          transactionId: trxId.toUpperCase().replace(/\s+/g, ""),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || "Deposit submit nahi ho saka.");
      }

      setDepositTrxId("");
      showAlert(`✅ Rs. ${amount.toLocaleString()} deposit Pending mein submit ho gaya. Admin approval ke baad ${Number(data.deposit?.coinsToCredit || amount * 40).toLocaleString()} coins automatically add honge.`);
      await loadDeposits();
      setActiveTab("history");
    } catch (error) {
      console.error("Deposit submit error:", error);
      showAlert(`❌ ${error.message || "Server connection error"}`, "error");
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount < 1000) return showAlert("⚠️ Minimum withdrawal 1,000 coins hai.", "error");
    if (coins < amount) return showAlert("⚠️ Aapke paas enough coins nahi hain.", "error");
    if (!accountName.trim() || !accountNumber.trim()) return showAlert("⚠️ Account name aur number complete karein.", "error");

    if (typeof deductCoins !== "function") return showAlert("❌ Coin deduction function available nahi hai.", "error");
    const ok = deductCoins(amount, `💸 ${amount} coins withdrawal request`);
    if (ok === false) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId || "guest_user", type: "Withdrawal", amount, method: withdrawMethod, accountName, accountNumber, status: "Pending Cash Out", date: new Date().toLocaleString() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || "Withdrawal save nahi ho saki.");
      showAlert("✅ Cashout request live MongoDB mein save ho gayi hai.");
      setWithdrawAmount(""); setAccountNumber(""); setAccountName("");
    } catch (error) {
      console.error("Withdrawal error:", error);
      showAlert(`❌ ${error.message || "Server connection error"}`, "error");
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(transferCoins);
    if (!transferUserId.trim()) return showAlert("⚠️ Recipient User ID enter karein.", "error");
    if (!amount || amount <= 0) return showAlert("⚠️ Sahi coin amount enter karein.", "error");
    if (coins < amount) return showAlert("⚠️ Aapke paas enough coins nahi hain.", "error");

    if (typeof deductCoins !== "function") return showAlert("❌ Coin deduction function available nahi hai.", "error");
    const ok = deductCoins(amount, `🔄 ${amount} coins transfer`);
    if (ok === false) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId || "guest_user", type: "Transfer Out", amount, method: "P2P Transfer", recipient: transferUserId.trim(), status: "Completed", date: new Date().toLocaleString() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || "Transfer record save nahi ho saka.");
      showAlert(`🎉 Successfully transferred ${amount} coins to ${transferUserId}!`);
      setTransferUserId(""); setTransferCoins("");
    } catch (error) {
      console.error("Transfer error:", error);
      showAlert(`❌ ${error.message || "Server connection error"}`, "error");
    }
  };

  const statusInfo = (raw) => {
    const status = String(raw || "pending").toLowerCase();
    if (status === "approved") return { label: "APPROVED", color: "#22c55e" };
    if (status === "rejected") return { label: "REJECTED", color: "#ef4444" };
    return { label: "PENDING", color: "#f59e0b" };
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: "10px",
    background: "#020617", color: "#fff", border: "1px solid #475569", outline: "none"
  };
  const cardStyle = {
    background: "linear-gradient(145deg,#111c31,#17243b)", border: "1px solid #334155",
    borderRadius: "18px", padding: "clamp(16px,2vw,28px)", boxShadow: "0 18px 45px rgba(0,0,0,.18)"
  };

  return (
    <main className="wallet-page">
      <style>{`
        .wallet-page{width:100%;min-height:100vh;box-sizing:border-box;padding:clamp(12px,2.3vw,32px);color:#f8fafc;background:radial-gradient(circle at top right,#12315a 0,#07101f 35%,#020617 75%);}
        .wallet-shell{width:100%;max-width:1500px;margin:0 auto;}
        .wallet-top{display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap;}
        .wallet-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:22px;padding-top:18px;border-top:1px solid #334155;}
        .wallet-tab{border:1px solid #334155;border-radius:10px;padding:12px 8px;color:#fff;font-weight:800;cursor:pointer;background:#0f172a;}
        .wallet-tab.active{background:linear-gradient(135deg,#0284c7,#2563eb);border-color:#38bdf8;}
        .wallet-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}
        .wallet-full{grid-column:1/-1;}
        .wallet-label{display:grid;gap:7px;color:#cbd5e1;font-size:13px;font-weight:800;}
        .deposit-row{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:15px;border:1px solid #334155;border-radius:12px;background:#081120;}
        .wallet-btn{border:0;border-radius:11px;padding:14px 18px;font-weight:900;cursor:pointer;color:#fff;background:linear-gradient(135deg,#0284c7,#2563eb);}
        .wallet-btn:disabled{cursor:not-allowed;opacity:.6;}
        @media(max-width:700px){.wallet-tabs{grid-template-columns:repeat(2,minmax(0,1fr));}.wallet-grid{grid-template-columns:1fr}.wallet-full{grid-column:auto}.deposit-row{align-items:flex-start;flex-direction:column}.wallet-page{padding:12px}.wallet-top h1{font-size:30px!important}}
        @media(max-width:390px){.wallet-tabs{grid-template-columns:1fr}.wallet-tab{padding:11px}.wallet-page{padding:9px}}
      `}</style>

      <div className="wallet-shell">
        {alertMsg.text && (
          <div style={{ marginBottom: 16, padding: "13px 16px", borderRadius: 11, fontWeight: 800, background: alertMsg.type === "error" ? "#7f1d1d" : "#14532d", border: `1px solid ${alertMsg.type === "error" ? "#ef4444" : "#22c55e"}` }}>
            {alertMsg.text}
          </div>
        )}

        <section style={cardStyle}>
          <div className="wallet-top">
            <div>
              <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 800, letterSpacing: 1.3 }}>SAMATKAAR WALLET</span>
              <h1 style={{ color: "#38bdf8", margin: "7px 0", fontSize: 40 }}>🪙 {Number(coins).toLocaleString()} <small style={{ fontSize: 15, color: "#94a3b8" }}>Coins</small></h1>
              <span style={{ color: "#22c55e", fontWeight: 800 }}>≈ {activeCurrency?.symbol || ""}{convertCoins(coins)} {currency}</span>
            </div>
            <button className="wallet-btn" type="button" onClick={() => navigate && navigate("earn")}>⚡ Earn More</button>
          </div>

          <div className="wallet-tabs">
            {[
              ["deposit", "💳 Deposit"],
              ["withdraw", "💵 Withdraw"],
              ["transfer", "🔄 Transfer"],
              ["history", "📜 History"],
            ].map(([key, label]) => (
              <button key={key} type="button" className={`wallet-tab ${activeTab === key ? "active" : ""}`} onClick={() => setActiveTab(key)}>{label}</button>
            ))}
          </div>
        </section>

        <div style={{ height: 18 }} />

        {activeTab === "overview" && (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#38bdf8" }}>Wallet Overview</h2>
            <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>Deposit ke liye Deposit tab open karein. Approved deposit ke coins backend MongoDB balance mein add honge.</p>
          </section>
        )}

        {activeTab === "deposit" && (
          <section style={cardStyle}>
            <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 900, letterSpacing: 1 }}>STEP 5 · LIVE DEPOSIT</span>
            <h2 style={{ color: "#38bdf8", marginBottom: 7 }}>💳 Deposit & Get Coins</h2>
            <p style={{ color: "#94a3b8", lineHeight: 1.65, marginTop: 0 }}>EasyPaisa ya JazzCash se payment karne ke baad exact amount aur original TRX ID submit karein. Deposit pehle Pending rahega.</p>

            <div style={{ margin: "14px 0", padding: 14, background: "#0f172a", border: "1px solid #334155", borderRadius: 12, color: "#cbd5e1", lineHeight: 1.8 }}>
              <strong style={{ color: "#f8fafc" }}>Official Payment Accounts</strong><br />
              📱 EasyPaisa: <strong>03333997682</strong><br />
              📱 JazzCash: <strong>03333997682</strong>
            </div>

            <div style={{ margin: "18px 0", padding: 15, background: "#07111f", border: "1px solid #334155", borderRadius: 13 }}>
              <strong style={{ color: "#f8fafc" }}>Coin conversion</strong>
              <div style={{ color: "#38bdf8", fontSize: 22, fontWeight: 900, marginTop: 5 }}>Rs. 50 = 2,000 Coins</div>
              <small style={{ color: "#94a3b8" }}>Approval se pehle 0 coins add honge.</small>
            </div>

            <form className="wallet-grid" onSubmit={handleDepositSubmit}>
              <label className="wallet-label">Payment Method
                <select value={depositMethod} onChange={(e) => setDepositMethod(e.target.value)} style={inputStyle}>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="jazzcash">JazzCash</option>
                </select>
              </label>

              <label className="wallet-label">Amount (PKR)
                <input type="number" min="10" max="100000" step="1" inputMode="numeric" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="50" style={inputStyle} />
              </label>

              <div style={{ color: "#38bdf8", fontWeight: 900, alignSelf: "end", paddingBottom: 12 }}>After approval: 🪙 {Number.isFinite(Number(depositAmount)) && Number(depositAmount) > 0 ? Math.floor(Number(depositAmount) * 40).toLocaleString() : "0"} coins</div>

              <label className="wallet-label wallet-full">Transaction ID (TRX ID)
                <input type="text" value={depositTrxId} onChange={(e) => setDepositTrxId(e.target.value)} placeholder="e.g. 98402849201" autoComplete="off" style={inputStyle} />
              </label>

              <button className="wallet-btn wallet-full" type="submit" disabled={depositLoading}>
                {depositLoading ? "⏳ Submitting..." : "🚀 Submit Deposit"}
              </button>
            </form>
          </section>
        )}

        {activeTab === "history" && (
          <section style={cardStyle}>
            <div className="wallet-top">
              <div>
                <h2 style={{ margin: 0, color: "#38bdf8" }}>📜 Deposit History</h2>
                <p style={{ color: "#94a3b8", margin: "6px 0 0" }}>Pending / Approved / Rejected status live backend se.</p>
              </div>
              <button className="wallet-btn" type="button" onClick={loadDeposits} disabled={historyLoading}>{historyLoading ? "Refreshing..." : "↻ Refresh"}</button>
            </div>

            <div style={{ display: "grid", gap: 11, marginTop: 18 }}>
              {historyLoading && deposits.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>Loading...</p>
              ) : deposits.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>Abhi koi deposit request nahi hai.</p>
              ) : deposits.map((item, index) => {
                const status = statusInfo(item.status);
                const credited = Number(item.coinsToCredit ?? item.coinsAdded ?? item.coins ?? item.coinAmount ?? 0);
                return (
                  <article className="deposit-row" key={item._id || item.id || index}>
                    <div>
                      <strong>💳 Rs. {Number(item.amountPKR ?? item.amount ?? 0).toLocaleString()} · {item.method || "Deposit"}</strong>
                      <div style={{ marginTop: 5, color: "#94a3b8", fontSize: 12, overflowWrap: "anywhere" }}>TRX: {item.transactionId || item.trxId || "N/A"}</div>
                      {(item.submittedAt || item.createdAt) && <div style={{ marginTop: 4, color: "#64748b", fontSize: 11 }}>{new Date(item.submittedAt || item.createdAt).toLocaleString()}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ display: "inline-block", color: status.color, border: `1px solid ${status.color}66`, background: `${status.color}18`, padding: "6px 10px", borderRadius: 999, fontSize: 11, fontWeight: 900 }}>{status.label}</span>
                      {status.label === "APPROVED" && credited > 0 && <div style={{ color: "#22c55e", marginTop: 7, fontWeight: 900 }}>+🪙 {credited.toLocaleString()}</div>}
                      {status.label === "REJECTED" && <div style={{ color: "#94a3b8", marginTop: 7, fontSize: 12 }}>0 coins</div>}
                      {status.label === "REJECTED" && item.rejectionReason && <div style={{ color: "#fca5a5", marginTop: 5, fontSize: 11, maxWidth: 260 }}>{item.rejectionReason}</div>}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "withdraw" && (
          <section style={cardStyle}>
            <h2 style={{ color: "#38bdf8", marginTop: 0 }}>💵 Withdrawal</h2>
            <form className="wallet-grid" onSubmit={handleWithdrawSubmit}>
              <label className="wallet-label">Method<select value={withdrawMethod} onChange={(e) => setWithdrawMethod(e.target.value)} style={inputStyle}><option>EasyPaisa</option><option>JazzCash</option><option>Bank Transfer</option></select></label>
              <label className="wallet-label">Coins<input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Minimum 1,000" style={inputStyle} /></label>
              <label className="wallet-label">Account Name<input value={accountName} onChange={(e) => setAccountName(e.target.value)} style={inputStyle} /></label>
              <label className="wallet-label">Account / Mobile Number<input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={inputStyle} /></label>
              <button className="wallet-btn wallet-full" type="submit">Request Withdrawal</button>
            </form>
          </section>
        )}

        {activeTab === "transfer" && (
          <section style={cardStyle}>
            <h2 style={{ color: "#38bdf8", marginTop: 0 }}>🔄 P2P Transfer</h2>
            <form className="wallet-grid" onSubmit={handleTransferSubmit}>
              <label className="wallet-label">Recipient User ID<input value={transferUserId} onChange={(e) => setTransferUserId(e.target.value)} style={inputStyle} /></label>
              <label className="wallet-label">Coins<input type="number" value={transferCoins} onChange={(e) => setTransferCoins(e.target.value)} style={inputStyle} /></label>
              <button className="wallet-btn wallet-full" type="submit">Transfer Coins</button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
