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

  // REAL TRANSACTION HISTORY (Loaded from LocalStorage)
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("goovoRealTransactions");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("goovoRealTransactions", JSON.stringify(transactions));
  }, [transactions]);

  const showAlert = (text, type = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => {
      setAlertMsg({ text: "", type: "" });
    }, 4000);
  };

  const handleDepositSubmit = (e) => {
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
      id: "DEP-" + Date.now().toString().slice(-6),
      type: "Deposit",
      amount: amountNum,
      coinsCalculated: amountNum * 10, // 1 PKR = 10 Coins ratio
      method: depositMethod,
      senderNumber: depositSenderNumber,
      trxId: depositTrxId,
      status: "Pending Verification",
      date: new Date().toLocaleString(),
    };

    const updatedTx = [newDepositEntry, ...transactions];
    setTransactions(updatedTx);

    const existingPending = JSON.parse(localStorage.getItem("goovoPendingPayments") || "[]");
    localStorage.setItem("goovoPendingPayments", JSON.stringify([newDepositEntry, ...existingPending]));

    showAlert("🚀 Deposit Proof submit ho gaya hai! Verification ke baad coins add ho jayenge.", "success");

    setDepositAmount("");
    setDepositTrxId("");
    setDepositSenderNumber("");
    setActiveTab("history");
  };

  const handleWithdrawSubmit = (e) => {
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
        id: "WTH-" + Date.now().toString().slice(-6),
        type: "Withdrawal",
        amount: amountNum,
        method: withdrawMethod,
        accountName: accountName,
        accountNumber: accountNumber,
        status: "Pending Cash Out",
        date: new Date().toLocaleString(),
      };

      const updatedTx = [newWithdrawalEntry, ...transactions];
      setTransactions(updatedTx);

      showAlert("✅ Cashout request submit ho gayi hai.", "success");

      setWithdrawAmount("");
      setAccountNumber("");
      setAccountName("");
      setActiveTab("history");
    }
  };

  const handleTransferSubmit = (e) => {
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
        id: "TRF-" + Date.now().toString().slice(-6),
        type: "Transfer Out",
        amount: amountNum,
        method: "P2P Transfer",
        recipient: transferUserId,
        status: "Completed",
        date: new Date().toLocaleString(),
      };

      const updatedTx = [newTransferEntry, ...transactions];
      setTransactions(updatedTx);

      showAlert(`🎉 Successfully transferred ${amountNum} coins to ${transferUserId}!`, "success");

      setTransferUserId("");
      setTransferCoins("");
      setActiveTab("history");
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
          <h3 style={{ margin: "0 0 10px 0", color: "#38bdf8" }}>📊 Real Account Summary</h3>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px", lineHeight: "1.6" }}>
            Aapke account ki tamam live activity aur transaction records yahan save hotay hain. Upper diye gaye options se Deposit, Withdraw ya Transfer execute karein.
          </p>
        </div>
      )}

      {/* DEPOSIT TAB WITH YOUR OFFICIAL ACCOUNTS */}
      {activeTab === "deposit" && (
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
          <h3 style={{ marginTop: 0, color: "#38bdf8" }}>💳 Official Deposit Accounts</h3>
          <p style={{ color: "#94a3b8", fontSize: "13px" }}>
            Nechay diye gaye official accounts par payment transfer karne ke baad apni details submit karein:
          </p>
          
          <div
            style={{
              background: "#0f172a",
              padding: "16px",
              borderRadius: "8px",
              margin: "15px 0",
              border: "1px solid #0284c7",
              display: "grid",
              gap: "8px"
            }}
          >
            <p style={{ margin: 0, fontSize: "14px", color: "#fff" }}>
              🔹 <b>EasyPaisa / JazzCash Number:</b> <span style={{ color: "#38bdf8", fontWeight: "bold" }}>03333997682</span>
            </p>
            <p style={{ margin: 0, fontSize: "14px", color: "#fff" }}>
              🔹 <b>Meezan Bank Account:</b> <span style={{ color: "#38bdf8", fontWeight: "bold" }}>00300116199005</span>
            </p>
          </div>

          <form onSubmit={handleDepositSubmit} style={{ display: "grid", gap: "12px" }}>
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
              🚀 Submit Real Deposit Proof
            </button>
          </form>
        </div>
      )}

      {/* WITHDRAW TAB */}
      {activeTab === "withdraw" && (
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
          <h3 style={{ marginTop: 0, color: "#38bdf8" }}>💵 Request Real Withdrawal</h3>
          <p style={{ color: "#94a3b8", fontSize: "13px" }}>Apne kamaaye hue coins ko real cash me apne account me mangwayein.</p>

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
              Request Cashout Now
            </button>
          </form>
        </div>
      )}

      {/* TRANSFER TAB */}
      {activeTab === "transfer" && (
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
          <h3 style={{ marginTop: 0, color: "#38bdf8" }}>🔄 Real Peer-to-Peer Coins Transfer</h3>
          <p style={{ color: "#94a3b8", fontSize: "13px" }}>Kisi doosre user ko direct coins bhejin.</p>

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
              Transfer Instant Coins
            </button>
          </form>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
          <h3 style={{ marginTop: 0, color: "#38bdf8" }}>📜 Real Account Logs</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
            {transactions.length === 0 ? (
              <p style={{ color: "#94a3b8", margin: 0, textAlign: "center", padding: "20px" }}>No real transactions recorded yet.</p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
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
                      {tx.type === "Withdrawal" ? "-" : "+"}🪙 {tx.amount.toLocaleString()}
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