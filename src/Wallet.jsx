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



  const [depositMethod, setDepositMethod] = useState("easypaisa");



  const [depositSenderNumber, setDepositSenderNumber] = useState("");



  const [depositLoading, setDepositLoading] = useState(false);

  const [depositHistory, setDepositHistory] = useState([]);

  const [depositHistoryLoading, setDepositHistoryLoading] = useState(false);







  const [transferUserId, setTransferUserId] = useState("");



  const [transferCoins, setTransferCoins] = useState("");







  const [alertMsg, setAlertMsg] = useState({ text: "", type: "" });



  const [transactions, setTransactions] = useState([]);







  // LIVE BACKEND URL



  const BACKEND_URL = "https://my-react-backend-production-84e7.up.railway.app";

  // PAYMENT METHODS
  // Live methods work now. International methods are UI-only until backend/provider integration is added.
  const liveDepositMethods = [
    { value: "easypaisa", label: "EasyPaisa (03333997682)" },
    { value: "jazzcash", label: "JazzCash (03333997682)" },
  ];

  const liveWithdrawMethods = [
    { value: "EasyPaisa", label: "EasyPaisa" },
    { value: "JazzCash", label: "JazzCash" },
    { value: "Bank Transfer", label: "Bank Transfer" },
  ];

  const internationalSoonMethods = [
    { value: "USDT", label: "USDT (TRC20 / BEP20)" },
    { value: "PayPal", label: "PayPal" },
    { value: "Wise", label: "Wise" },
    { value: "Skrill", label: "Skrill" },
    { value: "Payoneer", label: "Payoneer" },
    { value: "Stripe", label: "Card / Stripe" },
  ];

  const isComingSoonMethod = (value) =>
    internationalSoonMethods.some((item) => item.value === value);








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







  const fetchDepositHistory = async () => {

    const userId = user?.id || user?._id;

    if (!userId || userId === "guest_user") {

      setDepositHistory([]);

      return;

    }

    setDepositHistoryLoading(true);

    try {

      const res = await fetch(`${BACKEND_URL}/api/deposits/user/${encodeURIComponent(userId)}`, { headers: { Accept: "application/json" }, cache: "no-store" });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) throw new Error(data.error || "Deposit history load nahi ho saki.");

      setDepositHistory(Array.isArray(data.deposits) ? data.deposits : []);

    } catch (err) {

      console.error("Deposit history error:", err);

    } finally {

      setDepositHistoryLoading(false);

    }

  };



  useEffect(() => {

    fetchDepositHistory();

  }, [user?.id, user?._id]);



  const showAlert = (text, type = "success") => {



    setAlertMsg({ text, type });



    setTimeout(() => {



      setAlertMsg({ text: "", type: "" });



    }, 4000);



  };







  // HANDLE DEPOSIT SUBMIT - STEP 5 SECURE DEPOSIT SYSTEM

  const handleDepositSubmit = async (e) => {

    e.preventDefault();

    const userId = user?.id || user?._id;

    const amountNum = Number(depositAmount);

    const transactionId = depositTrxId.trim();

    const method = String(depositMethod || "").trim().toLowerCase();



    if (!userId || userId === "guest_user") return showAlert("❌ Deposit ke liye pehle login karein!", "error");

    if (!Number.isInteger(amountNum) || amountNum < 10 || amountNum > 100000) return showAlert("❌ Deposit amount Rs.10 se Rs.100,000 ke darmiyan whole PKR mein hona chahiye.", "error");

    if (!["easypaisa", "jazzcash"].includes(method)) return showAlert("❌ Sirf EasyPaisa ya JazzCash deposit supported hai.", "error");

    if (transactionId.length < 4) return showAlert("⚠️ Original Transaction TRX ID darj karna zaroori hai!", "error");



    setDepositLoading(true);

    try {

      const res = await fetch(`${BACKEND_URL}/api/deposits/create`, {

        method: "POST",

        headers: { "Content-Type": "application/json", Accept: "application/json" },

        body: JSON.stringify({ userId, amountPKR: amountNum, method, transactionId }),

      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) throw new Error(data.error || data.message || "Deposit submit nahi ho saka.");



      showAlert(`🚀 Rs.${amountNum.toLocaleString()} deposit Pending mein submit ho gaya. Admin approval ke baad ${(amountNum * 40).toLocaleString()} coins automatically add honge.`, "success");

      setDepositAmount("");

      setDepositTrxId("");

      setDepositSenderNumber("");

      await fetchDepositHistory();

      setActiveTab("history");

    } catch (err) {

      console.error("Deposit submit error:", err);

      showAlert(`❌ ${err.message || "Server connection error!"}`, "error");

    } finally {

      setDepositLoading(false);

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



    <div className="wallet-page" style={{ padding: "clamp(12px, 2vw, 24px)", width: "100%", maxWidth: "none", minHeight: "100vh", boxSizing: "border-box", margin: "0 auto", color: "#f8fafc" }}>







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



            gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",



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



          <h3 style={{ marginTop: 0, color: "#38bdf8" }}>💳 Official Deposit Accounts · Step 5 Live</h3>

          <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "10px", padding: "12px", color: "#cbd5e1", lineHeight: 1.6 }}>

            <strong style={{ color: "#22c55e" }}>Rs. 50 = 2,000 Coins</strong><br />

            Deposit pehle Pending rahega. Admin approve karega to coins MongoDB balance mein automatically add honge.

          </div>



          <form onSubmit={handleDepositSubmit} style={{ display: "grid", gap: "12px", marginTop: "15px" }}>



            <div>



              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Payment Method Used</label>



              <select



                value={depositMethod}



                onChange={(e) => setDepositMethod(e.target.value)}



                style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155", marginTop: "4px" }}



              >



                {liveDepositMethods.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
                {internationalSoonMethods.map((item) => (
                  <option key={item.value} value={item.value} disabled>
                    {item.label} — Available Soon
                  </option>
                ))}



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



              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Aapka Sender Mobile Number (Optional)</label>



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



              disabled={depositLoading}



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



              {depositLoading ? "⏳ Submitting..." : "🚀 Submit Live Deposit Proof"}



            </button>



          </form>



        </div>



      )}







      {/* WITHDRAW TAB */}



      {activeTab === "withdraw" && (



        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>



          <h3 style={{ marginTop: 0, color: "#38bdf8" }}>💵 Request Real Withdrawal</h3>
            <div style={{ marginBottom: "12px", padding: "10px 12px", borderRadius: "8px", background: "#111827", border: "1px solid #334155", color: "#94a3b8", fontSize: "13px" }}>
              🌍 USDT, PayPal, Wise, Skrill, Payoneer aur Card/Stripe withdrawals — <strong style={{ color: "#f59e0b" }}>Available Soon</strong>
            </div>



          <form onSubmit={handleWithdrawSubmit} style={{ display: "grid", gap: "12px", marginTop: "15px" }}>



            <div>



              <label style={{ fontSize: "12px", color: "#94a3b8" }}>Payment Method</label>



              <select



                value={withdrawMethod}



                onChange={(e) => setWithdrawMethod(e.target.value)}



                style={{ width: "100%", padding: "10px", borderRadius: "6px", background: "#0f172a", color: "#fff", border: "1px solid #334155", marginTop: "4px" }}



              >



                {liveWithdrawMethods.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
                {internationalSoonMethods.map((item) => (
                  <option key={item.value} value={item.value} disabled>
                    {item.label} — Available Soon
                  </option>
                ))}



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



          <div style={{ marginBottom: "18px", padding: "14px", background: "#0f172a", border: "1px solid #334155", borderRadius: "10px" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>

              <strong style={{ color: "#f8fafc" }}>💳 Deposit Status</strong>

              <button type="button" onClick={fetchDepositHistory} style={{ background: "#0284c7", color: "#fff", border: 0, borderRadius: "7px", padding: "7px 10px", cursor: "pointer", fontWeight: 700 }}>Refresh</button>

            </div>

            {depositHistoryLoading ? (

              <p style={{ color: "#94a3b8" }}>Loading deposits...</p>

            ) : depositHistory.length === 0 ? (

              <p style={{ color: "#94a3b8", marginBottom: 0 }}>Abhi koi deposit request nahi hai.</p>

            ) : (

              <div style={{ display: "grid", gap: "9px", marginTop: "12px" }}>

                {depositHistory.map((dep) => {

                  const status = String(dep.status || "pending").toLowerCase();

                  const statusColor = status === "approved" ? "#22c55e" : status === "rejected" ? "#ef4444" : "#f59e0b";

                  return (

                    <div key={dep._id || dep.id} style={{ border: "1px solid #334155", borderRadius: "9px", padding: "11px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: "8px" }}>

                      <div><small style={{ color: "#64748b" }}>Amount</small><div>Rs. {Number(dep.amountPKR || 0).toLocaleString()}</div></div>

                      <div><small style={{ color: "#64748b" }}>Coins</small><div>🪙 {Number(dep.coinsToCredit || 0).toLocaleString()}</div></div>

                      <div><small style={{ color: "#64748b" }}>Method</small><div>{String(dep.method || "").toUpperCase()}</div></div>

                      <div><small style={{ color: "#64748b" }}>TRX ID</small><div style={{ wordBreak: "break-all" }}>{dep.transactionId}</div></div>

                      <div><small style={{ color: "#64748b" }}>Status</small><div style={{ color: statusColor, fontWeight: 800 }}>{status.toUpperCase()}</div></div>

                      {status === "rejected" && dep.rejectionReason ? <div style={{ gridColumn: "1 / -1", color: "#fca5a5" }}>Reason: {dep.rejectionReason}</div> : null}

                    </div>

                  );

                })}

              </div>

            )}

          </div>



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







      <style>{`

        .wallet-page input, .wallet-page select, .wallet-page button { box-sizing: border-box; max-width: 100%; }

        @media (max-width: 640px) {

          .wallet-page { padding: 12px !important; overflow-x: hidden; }

          .wallet-page input, .wallet-page select { font-size: 16px !important; }

          .wallet-page h2 { font-size: 22px !important; }

          .wallet-page h3 { line-height: 1.35; }

        }

      `}</style>



    </div>



  );



}