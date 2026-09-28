import React, { useState, useEffect } from "react";
import { useLanguage } from "./LanguageContext";

export default function Wallet({ coins, user, pendingPayments, deductCoins, navigate }) {
  const { currency, activeCurrency, convertCoins, t } = useLanguage();

  const [activeTab, setActiveTab] = useState("overview");

  // Form Inputs State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("EasyPaisa");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const [depositAmount, setDepositAmount] = useState("");
  const [depositTrxId, setDepositTrxId] = useState("");
  const [depositMethod, setDepositMethod] = useState("EasyPaisa");
  const [depositSenderNumber, setDepositSenderNumber] = useState("");

  const [transferUserId, setTransferUserId] = useState("");
  const [transferCoins, setTransferCoins] = useState("");

  const [alertMsg, setAlertMsg] = useState({ text: "", type: "" });
  const [transactions, setTransactions] = useState([]);

  // LIVE BACKEND URL
  const BACKEND_URL = "https://my-react-backend-production-84e7.up.railway.app";

  // Fetch Transactions from Live MongoDB Backend
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/records`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.records);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  const showAlert = (text, type = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => {
      setAlertMsg({ text: "", type: "" });
    }, 4000);
  };

  // HANDLE DEPOSIT SUBMIT (Live MongoDB Connect)
  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(depositAmount);

    if (!depositAmount || amountNum <= 0) {
      showAlert("❌ Barah-e-karam sahi Deposit Amount darj karein!", "error");
      return;
    }
    if (!depositTrxId.trim()) {
      showAlert("⚠️ Real Transaction TRX ID darj karna zaroori hai!", "error");
      return;
    }
    if (!depositSenderNumber.trim()) {
      showAlert("⚠️ Aap jis number se payment kar rahe hain wo number likhein!", "error");
      return;
    }

    const newDepositEntry = {
      userId: user?.id || "guest_user",
      type: "Deposit",
      amount: amountNum,
      method: depositMethod,
      senderNumber: depositSenderNumber,
      trxId: depositTrxId,
      status: "Pending Verification",
      date: new Date().toLocaleString(),
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDepositEntry),
      });
      const data = await res.json();

      if (data.success) {
        setTransactions([data.record, ...transactions]);
        showAlert("🚀 Deposit Proof live submit ho gaya hai! Verification ke baad coins add honge.", "success");
        setDepositAmount("");
        setDepositTrxId("");
        setDepositSenderNumber("");
        setActiveTab("history");
      } else {
        showAlert("❌ Deposit submit karne me masla aaya.", "error");
      }
    } catch (err) {
      showAlert("❌ Server connection error!", "error");
    }
  };

  // HANDLE WITHDRAW SUBMIT (Live MongoDB Connect)
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);

    if (!withdrawAmount || amountNum <= 0) {
      showAlert("❌ Barah-e-karam sahi withdrawal amount enter karein!", "error");
      return;
    }
    if (amountNum < 1000) {
      showAlert("⚠️ Minimum withdrawal limit 1,000 coins hai!", "error");
      return;
    }
    if (coins < amountNum) {
      showAlert("⚠️ Aapke pass itne coins nahi hain!", "error");
      return;
    }
    if (!accountNumber.trim() || !accountName.trim()) {
      showAlert("⚠️ Account Title aur Number complete fill karein!", "error");
      return;
    }

    const success = deductCoins(
      amountNum,
      `💸 ${amountNum} coins ki Withdrawal Request submit ho gayi hai!`
    );

    if (success) {
      const newWithdrawalEntry = {
        userId: user?.id || "guest_user",
        type: "Withdrawal",
        amount: amountNum,
        method: withdrawMethod,
        accountName: accountName,
        accountNumber: accountNumber,
        status: "Pending Cash Out",
        date: new Date().toLocaleString(),
      };

      try {
        const res = await fetch(`${BACKEND_URL}/api/records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newWithdrawalEntry),
        });
        const data = await res.json();

        if (data.success) {
          setTransactions([data.record, ...transactions]);
          showAlert("✅ Cashout request live save ho gayi hai.", "success");
          setWithdrawAmount("");
          setAccountNumber("");
          setAccountName("");
          setActiveTab("history");
        }
      } catch (err) {
        showAlert("❌ Server connection error!", "error");
      }
    }
  };

  // HANDLE TRANSFER SUBMIT (Live MongoDB Connect)
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(transferCoins);

    if (!transferUserId.trim()) {
      showAlert("❌ Recipient User ID ya Mobile Number darj karein!", "error");
      return;
    }
    if (!transferCoins || amountNum <= 0) {
      showAlert("❌ Sahi coins ki tadad darj karein!", "error");
      return;
    }
    if (coins < amountNum) {
      showAlert("⚠️ Aapke paas transfer ke liye coins kam hain!", "error");
      return;
    }

    const success = deductCoins(
      amountNum,
      `🔄 ${amountNum} coins transfer ho chuke hain!`
    );

    if (success) {
      const newTransferEntry = {
        userId: user?.id || "guest_user",
        type: "Transfer Out",
        amount: amountNum,
        method: "P2P Transfer",
        recipient: transferUserId,
        status: "Completed",
        date: new Date().toLocaleString(),
      };

      try {
        const res = await fetch(`${BACKEND_URL}/api/records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTransferEntry),
        });
        const data = await res.json();

        if (data.success) {
          setTransactions([data.record, ...transactions]);
          showAlert(`🎉 Successfully transferred ${amountNum} coins to ${transferUserId}!`, "success");
          setTransferUserId("");
          setTransferCoins("");
          setActiveTab("history");
        }
      } catch (err) {
        showAlert("❌ Server connection error!", "error");
      }
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", color: "#f8fafc" }}>
      
      {alertMsg.text && (
        <div
          style={{
            padding: "12px 20px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontWeight: "bold",
            background: alertMsg.type === "error" ? "#ef4444" : "#22c55e",
            color: "#fff",
          }}
        >
          {alertMsg.text}
        </div>
      )}

      {/* HEADER BALANCE CARD */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
          <div>
            <span style={{ color: "#94a3b8", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Account Balance
            </span>
            <h1 style={{ color: "#38bdf8", margin: "6px 0", fontSize: "36px" }}>
              🪙 {coins.toLocaleString()} <span style={{ fontSize: "16px", color: "#64748b" }}>Coins</span>
            </h1>
            <div>
              <span style={{ background: "#22c55e20", color: "#22c55e", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold" }}>
                ≈ {activeCurrency.symbol}{convertCoins(coins)} {currency}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("earn")}
            style={{
              background: "#0284c7",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            ⚡ Earn More
          </button>
        </div>

        {/* TOP BUTTONS BAR */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px",
            marginTop: "20px",
            borderTop: "1px solid #334155",
            paddingTop: "18px",
          }}
        >
          <button
            onClick={() => setActiveTab("deposit")}
            style={{
              background: activeTab === "deposit" ? "#0284c7" : "#0f172a",
              color: "#fff",
              border: "1px solid #334155",
              padding: "10px 5px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "bold",
              textAlign: "center"
            }}
          >
            💳 Deposit
          </button>
          <button
            onClick={() => setActiveTab("withdraw")}
            style={{
              background: activeTab === "withdraw" ? "#0284c7" : "#0f172a",
              color: "#fff",
              border: "1px solid #334155",
              padding: "10px 5px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "bold",
              textAlign: "center"
            }}
          >
            💵 Withdraw
          </button>
          <button
            onClick={() => setActiveTab("transfer")}
            style={{
              background: activeTab === "transfer" ? "#0284c7" : "#0f172a",
              color: "#fff",
              border: "1px solid #334155",
              padding: "10px 5px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "bold",
              textAlign: "center"
            }}
          >
            🔄 Transfer P2P
          </button>
          <button
            onClick={() => setActiveTab("history")}
            style={{
              background: activeTab === "history" ? "#0284c7" : "#0f172a",
              color: "#fff",
              border: "1px solid #334155",
              padding: "10px 5px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "bold",
              textAlign: "center"
            }}
          >
            📜 History
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#38bdf8" }}>📊 Live MongoDB Account Summary</h3>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px", lineHeight: "1.6" }}>
            Aapke account ki tamam live activity aur transaction records ab seedha MongoDB Atlas par secure hain.
          </p>
        </div>
      )}

      {/* DEPOSIT TAB */}
      {activeTab === "deposit" && (
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
          <h3 style={{ marginTop: 0, color: "#38bdf8" }}>💳 Official Deposit Accounts</h3>
          <form onSubmit={handleDepositSubmit} style={{ display: "grid", gap: "12px", marginTop: "15px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Payment Method Used</label>
              <select
                value={depositMethod}
                onChange={(e) => setDepositMethod(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155", marginTop: "4px" }}
              >
                <option value="EasyPaisa">EasyPaisa (03333997682)</option>
                <option value="JazzCash">JazzCash (03333997682)</option>
                <option value="Meezan Bank">Meezan Bank (00300116199005)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Deposited Amount (PKR)</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155", marginTop: "4px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Aapka Sender Mobile Number</label>
              <input
                type="text"
                placeholder="03xxxxxxxxx"
                value={depositSenderNumber}
                onChange={(e) => setDepositSenderNumber(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155", marginTop: "4px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Transaction TRX ID / Receipt Number</label>
              <input
                type="text"
                placeholder="e.g. 98402849201"
                value={depositTrxId}
                onChange={(e) => setDepositTrxId(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155", marginTop: "4px" }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: "#0284c7",
                color: "#fff",
                padding: "12px",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                marginTop: "6px",
              }}
            >
              🚀 Submit Live Deposit Proof
            </button>
          </form>
        </div>
      )}

      {/* WITHDRAW TAB */}
      {activeTab === "withdraw" && (
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
          <h3 style={{ marginTop: 0, color: "#38bdf8" }}>💵 Request Real Withdrawal</h3>
          <form onSubmit={handleWithdrawSubmit} style={{ display: "grid", gap: "12px", marginTop: "15px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Payment Method</label>
              <select
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155", marginTop: "4px" }}
              >
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Coins Amount (Minimum 1,000)</label>
              <input
                type="number"
                placeholder="Enter coins amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155", marginTop: "4px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Account Title / Name</label>
              <input
                type="text"
                placeholder="e.g. Account Holder Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155", marginTop: "4px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Account / Mobile Number</label>
              <input
                type="text"
                placeholder="03xxxxxxxxx"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155", marginTop: "4px" }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: "#22c55e",
                color: "#0f172a",
                padding: "12px",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                marginTop: "6px",
              }}
            >
              Request Live Cashout
            </button>
          </form>
        </div>
      )}

      {/* TRANSFER TAB */}
      {activeTab === "transfer" && (
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
          <h3 style={{ marginTop: 0, color: "#38bdf8" }}>🔄 Peer-to-Peer Coins Transfer</h3>
          <form onSubmit={handleTransferSubmit} style={{ display: "grid", gap: "12px", marginTop: "15px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Recipient User ID / Mobile Number</label>
              <input
                type="text"
                placeholder="e.g. 03001234567"
                value={transferUserId}
                onChange={(e) => setTransferUserId(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155", marginTop: "4px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Coins Amount</label>
              <input
                type="number"
                placeholder="Enter coins to send"
                value={transferCoins}
                onChange={(e) => setTransferCoins(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155", marginTop: "4px" }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: "#f59e0b",
                color: "#0f172a",
                padding: "12px",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                marginTop: "6px",
              }}
            >
              Transfer Live Coins
            </button>
          </form>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
          <h3 style={{ marginTop: 0, color: "#38bdf8" }}>📜 Live MongoDB Account Logs</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
            {transactions.length === 0 ? (
              <p style={{ color: "#94a3b8", margin: 0, textAlign: "center", padding: "20px" }}>No transactions recorded in database yet.</p>
            ) : (
              transactions.map((tx, idx) => (
                <div
                  key={tx._id || idx}
                  style={{
                    background: "#0f172a",
                    padding: "12px 15px",
                    borderRadius: "8px",
                    border: "1px solid #334155",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong style={{ color: tx.type === "Withdrawal" ? "#ef4444" : "#22c55e" }}>
                      {tx.type}
                    </strong>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                      {tx.date} • {tx.method} {tx.trxId ? `| TRX: ${tx.trxId}` : ""}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "bold", color: tx.type === "Withdrawal" ? "#ef4444" : "#22c55e" }}>
                      {tx.type === "Withdrawal" ? "-" : "+"}🪙 {tx.amount?.toLocaleString()}
                    </div>
                    <span style={{ fontSize: "11px", color: tx.status === "Completed" ? "#22c55e" : "#f59e0b" }}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}