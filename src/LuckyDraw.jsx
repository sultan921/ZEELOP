import React, { useState, useEffect, useCallback } from "react";
import "./LuckyDraw.css";
import { addWinnerToStorage } from "./Winner.jsx";

const TRANSLATIONS = {
  en: {
    liveTag: "🔴 BUMPER DRAW LIVE (AUTO-LOOP)",
    title: "💵 $100 (SULTAN EDITION)",
    subtitle: "Win grand prizes! Infinite automated 8-Day draws with fair ticket spinning.",
    timerTitle: "⏳ TIME REMAINING FOR AUTO-SPIN DRAW",
    days: "DAYS",
    hours: "HOURS",
    mins: "MINS",
    secs: "SECS",
    enterTicketTitle: "🎟️ Enter Purchased Ticket Code",
    enterTicketSub: "Enter ticket code below to check and verify your draw entry status via database.",
    ticketLabel: "OFFICIAL TICKET NUMBER / CODE",
    ticketPlaceholder: "e.g. GD-849201",
    verifyBtn: "⚡ VERIFY & CHECK ENTRY STATUS",
    verifyingBtn: "🔄 VERIFYING WITH DATABASE...",
    warningMsg: "Action Required: Please add your WhatsApp Number in Profile to participate in the Lucky Draw.",
    goToProfileBtn: "Go to Profile",
    payWithCoins: "🪙 Pay with Coins (2,000 Coins)",
    payWithCash: "💵 Pay via EasyPaisa / JazzCash (Rs. 50)",
    payCoinsTitle: "Pay using Earned Coins",
    availBalance: "Available Balance:",
    ticketPrice: "Ticket Price:",
    buyTicketCoinsBtn: "Deduct 2,000 Coins & Issue Ticket",
    insufficientCoinsBtn: "Insufficient Coins",
    cashTitle: "Manual Wallet Payment Verification",
    cashSub: "Send Rs. 50 to the account below and submit receipt:",
    gatewayLabel: "Select Payment Method:",
    trxLabel: "Transaction ID (TRX ID):",
    receiptLabel: "Upload Payment Receipt / Screenshot:",
    submitReceiptBtn: "Submit Receipt for Admin Verification",
    whatsappBtn: "💬 Send Receipt directly via WhatsApp",
    scanningReceipt: "🔍 Scanning Screenshot for TRX ID...",
    scannedSuccess: "✨ TRX ID Auto-Detected from Receipt!",
    step1: "1. Payment",
    step2: "2. Database Verifying",
    step3: "3. Ticket Issued & Linked",
    myTicketsTitle: "🎟️ My Verified Active Tickets",
    spinBtn: "🎰 START CINEMATIC DEMO SPIN TEST",
    spinningBtn: "🌀 SPINNING & SELECTING FAIR WINNER...",
    congratsMsg: "🏆 CONGRATULATIONS TO OUR LUCKY DRAW WINNER!",
    wonMsg: "HAS WON THE GRAND PRIZE!",
    alertIncompleteProfile: "⚠️ Profile Incomplete! Please add your WhatsApp Number in your Profile first.",
    alertCoinsSuccess: "🎉 Congratulations! Your Ticket No is: {ticket}. Added to the 8-Day Infinite Pool!",
    alertCashMissing: "⚠️ Transaction ID and Receipt Screenshot are required!",
    alertCashSubmitted: "🚀 Receipt submitted! Admin team will verify payment and send your Official Ticket Code to WhatsApp in 10-15 mins.",
    alertMissingPhoneVerify: "⚠️ WhatsApp number missing! Please add it in Profile so we can send you SMS/WhatsApp updates."
  },
  ur: {
    liveTag: "🔴 بمپر ڈرا لائیو (آٹو لوپ)",
    title: "💵 100 ڈالر (سلطان ایڈیشن)",
    subtitle: "ہر 8 دن بعد خودکار قرعہ اندازی جو کبھی ختم نہیں ہوتی!",
    timerTitle: "⏳ آٹو اسپن ڈرا میں باقی وقت",
    days: "دن",
    hours: "گھنٹے",
    mins: "منٹ",
    secs: "سیکنڈ",
    enterTicketTitle: "🎟️ خریدا ہوا ٹکٹ کوڈ درج کریں",
    enterTicketSub: "ڈیٹا بیس سے اپنے ٹکٹ کی تصدیق کرنے کے لیے نیچے کوڈ درج کریں۔",
    ticketLabel: "آفییشل ٹکٹ نمبر / کوڈ",
    ticketPlaceholder: "مثال: GD-849201",
    verifyBtn: "⚡ تصدیق کریں اور اسٹیٹس چیک کریں",
    verifyingBtn: "🔄 ڈیٹا بیس سے تصدیق جاری ہے...",
    warningMsg: "ضروری عمل: لکی ڈرا میں حصہ لینے کے لیے پروفائل میں اپنا واٹس ایپ نمبر شامل کریں۔",
    goToProfileBtn: "پروفائل پر جائیں",
    payWithCoins: "🪙 کوائنز سے ادائیگی کریں (2,000 کوائنز)",
    payWithCash: "💵 ایزی پیسہ / جیز کیش سے ادائیگی (50 روپے)",
    payCoinsTitle: "کمائے گئے کوائنز سے ادائیگی کریں",
    availBalance: "دستیاب بیلنس:",
    ticketPrice: "ٹکٹ کی قیمت:",
    buyTicketCoinsBtn: "2,000 کوائنز کٹوائیں اور ٹکٹ حاصل کریں",
    insufficientCoinsBtn: "ناکافی کوائنز",
    cashTitle: "مینوئل والٹ کیش کی تصدیق",
    cashSub: "نیچے دیے گئے اکاؤنٹ پر 50 روپے بھیجیں اور رسید جمع کروائیں:",
    gatewayLabel: "ادائیگی کا طریقہ منتخب کریں:",
    trxLabel: "ٹرانزیکشن آئی ڈی (TRX ID):",
    receiptLabel: "ادائیگی کی رسید / اسکرین شاٹ اپ لوڈ کریں:",
    submitReceiptBtn: "تصدیق کے لیے رسید جمع کروائیں",
    whatsappBtn: "💬 براہ راست واٹس ایپ پر رسید بھیجیں",
    scanningReceipt: "🔍 اسکرین شاٹ سے TRX ID خود بخود مل گئی!",
    step1: "1۔ ادائیگی",
    step2: "2۔ ڈیٹا بیس تصدیق",
    step3: "3۔ ٹکٹ جاری اور منسلک",
    myTicketsTitle: "🎟️ میرے تصدیق شدہ فعال ٹکٹ",
    spinBtn: "🎰 شاندار سینیمیٹک ڈیمو اسپن ٹیسٹ شروع کریں",
    spinningBtn: "🌀 فاتح کا منصفانہ انتخاب ہو رہا ہے...",
    congratsMsg: "🏆 شاندار کامیابی! لکی ڈرا کے فاتح:",
    wonMsg: "نے شاندار انعام جیت لیا ہے!",
    alertIncompleteProfile: "⚠️ پروفائل نامکمل ہے! پہلے پروفائل میں اپنا واٹس ایپ نمبر شامل کریں۔",
    alertCoinsSuccess: "🎉 مبارک ہو! آپ کا ٹکٹ نمبر {ticket} ہے۔ یہ 8 دن کے لکی ڈرا پول میں شامل کر دیا گیا ہے!",
    alertCashMissing: "⚠️ ٹرانزیکشن آئی ڈی اور رسید کا اسکرین شاٹ ہونا ضروری ہے!",
    alertCashSubmitted: "🚀 رسید جمع ہو گئی ہے! ایڈمن ٹیم 10-15 منٹ میں تصدیق کے بعد واٹس ایپ پر آفییشل ٹکٹ بھیج دے گی۔",
    alertMissingPhoneVerify: "⚠️ واٹس ایپ نمبر غائب ہے! پروفائل میں نمبر شامل کریں تاکہ ہم تصدیق کر سکیں۔"
  },
  roman: {
    liveTag: "🔴 BUMPER DRAW LIVE (INFINITE AUTO-LOOP)",
    title: "💵 $100 (SULTAN EDITION)",
    subtitle: "Har 8 din baad auto-draw chalega, infinite silsila jo kabhi khatam nahi hota!",
    timerTitle: "⏳ AUTO-SPIN DRAW MEIN BAKI WQT",
    days: "DAYS",
    hours: "HOURS",
    mins: "MINS",
    secs: "SECS",
    enterTicketTitle: "🎟️ Purchased Ticket Code Enter Karein",
    enterTicketSub: "Backend database se ticket verify karne ke liye apna code yahan enter karein.",
    ticketLabel: "OFFICIAL TICKET NUMBER / CODE",
    ticketPlaceholder: "e.g. GD-849201",
    verifyBtn: "⚡ VERIFY & CHECK ENTRY STATUS",
    verifyingBtn: "🔄 VERIFYING WITH DATABASE...",
    warningMsg: "Action Required: Profile mein WhatsApp Number add karein tabhi aap Lucky Draw mein participate kar sakte hain.",
    goToProfileBtn: "Go to Profile",
    payWithCoins: "🪙 Pay with Coins (2,000 Coins)",
    payWithCash: "💵 Pay via EasyPaisa / JazzCash (Rs. 50)",
    payCoinsTitle: "Earned Coins se Payment Karein",
    availBalance: "Available Balance:",
    ticketPrice: "Ticket Price:",
    buyTicketCoinsBtn: "Deduct 2,000 Coins & Issue Ticket",
    insufficientCoinsBtn: "Insufficient Coins",
    cashTitle: "Manual Wallet Payment Verification",
    cashSub: "Neeche diye gaye account par Rs. 50 bheinjen aur receipt submit karein:",
    gatewayLabel: "Payment Method Select Karein:",
    trxLabel: "Transaction ID (TRX ID):",
    receiptLabel: "Payment Receipt / Screenshot Upload Karein:",
    submitReceiptBtn: "Submit Receipt for Admin Verification",
    whatsappBtn: "💬 Direct WhatsApp par Receipt Bhejein",
    scanningReceipt: "🔍 Screenshot se TRX ID Scan ho rahi hai...",
    scannedSuccess: "✨ TRX ID Auto-Detect ho gayi!",
    step1: "1. Payment Sent",
    step2: "2. Database Verifying",
    step3: "3. Ticket Issued & Linked",
    myTicketsTitle: "🎟️ My Verified Active Tickets",
    spinBtn: "🎰 CINEMATIC DEMO SPIN TEST START KAREIN",
    spinningBtn: "🌀 FAIR WINNER CHUNA JAA RAHA HAI...",
    congratsMsg: "🏆 CONGRATULATIONS TO OUR LUCKY DRAW WINNER!",
    wonMsg: "HAS WON THE GRAND PRIZE!",
    alertIncompleteProfile: "⚠️ Profile Incomplete! Pehle Profile page par apna WhatsApp Number add karein.",
    alertCoinsSuccess: "🎉 Mubarak Ho! Aapka Ticket No: {ticket} hai. Yeh 8-day pool mein shamil ho gaya hai!",
    alertCashMissing: "⚠️ Transaction ID aur Receipt Screenshot upload karna zaroori hai!",
    alertCashSubmitted: "🚀 Receipt submitted! Admin team payment verify karke 10-15 mint mein aapke WhatsApp par Official Ticket Code bhej degi.",
    alertMissingPhoneVerify: "⚠️ WhatsApp number missing! Pehle Profile page par WhatsApp add karein."
  }
};

function LuckyDraw({ coins, deductCoins, submitPaymentProof, user = {}, navigate, currentLang = "en", currency = "USD" }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const [entryMode, setEntryMode] = useState("coins");
  const [trxId, setTrxId] = useState("");
  const [gateway, setGateway] = useState("easypaisa");
  const [receiptImage, setReceiptImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const [submissionStep, setSubmissionStep] = useState(() => {
    return Number(localStorage.getItem("luckydraw_step")) || 1;
  });

  const [targetDate, setTargetDate] = useState(() => {
    const savedDate = localStorage.getItem("luckydraw_global_target_date");
    const now = Date.now();
    if (savedDate && !isNaN(Number(savedDate)) && Number(savedDate) > now) {
      return new Date(Number(savedDate));
    } else {
      const default8Days = now + 8 * 24 * 60 * 60 * 1000;
      localStorage.setItem("luckydraw_global_target_date", default8Days.toString());
      return new Date(default8Days);
    }
  });

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [inputTicket, setInputTicket] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [ticketStatusMsg, setTicketStatusMsg] = useState(() => {
    const savedMsg = localStorage.getItem("luckydraw_status_msg");
    return savedMsg ? JSON.parse(savedMsg) : null;
  });

  const [myTickets, setMyTickets] = useState(() => {
    const saved = localStorage.getItem("luckydraw_my_tickets");
    return saved ? JSON.parse(saved) : [];
  });

  // CINEMATIC FULL SCREEN MODAL SPIN STATES
  const [cinematicSpinActive, setCinematicSpinActive] = useState(false);
  const [spinPhase, setSpinPhase] = useState("rolling");
  const [rollingCandidate, setRollingCandidate] = useState({ name: "Initializing...", ticket: "GD-000000" });
  const [finalModalWinner, setFinalModalWinner] = useState(null);

  const TICKET_COINS = 2000;
  const TICKET_PKR = 50;

  const [usdRates, setUsdRates] = useState({ USD: 1, PKR: 277.35, INR: 88.0, EUR: 0.85 });

  useEffect(() => {
    let cancelled = false;
    const loadUsdRates = async () => {
      try {
        const response = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!response.ok) throw new Error("Exchange-rate request failed");
        const data = await response.json();
        if (!data || !data.rates || cancelled) return;
        setUsdRates((prev) => ({ ...prev, ...data.rates }));
      } catch (error) {
        console.warn("Live exchange rates unavailable; using fallback rates.", error);
      }
    };
    loadUsdRates();
    return () => { cancelled = true; };
  }, []);

  const getPrizeAmount = () => {
    const rate = Number(usdRates[currency] ?? 1);
    return 100 * rate;
  };

  const formatPrizeAmount = () => {
    const code = currency || "USD";
    const amount = getPrizeAmount();
    if (code === "USD") return "$100";
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(amount);
    } catch {
      return `${amount.toLocaleString()} ${code}`;
    }
  };

  const prizeAmountText = formatPrizeAmount();

  const ADMIN_ACCOUNTS = {
    easypaisa: { number: "03001234567", name: "GOOVO Official EasyPaisa" },
    jazzcash: { number: "03007654321", name: "GOOVO Official JazzCash" }
  };

  useEffect(() => {
    localStorage.setItem("luckydraw_step", submissionStep.toString());
  }, [submissionStep]);

  useEffect(() => {
    localStorage.setItem("luckydraw_my_tickets", JSON.stringify(myTickets));
  }, [myTickets]);

  // CINEMATIC FULL SCREEN SPINNER RUNNER
  const runCinematicSpin = useCallback((isRealDraw = false) => {
    if (cinematicSpinActive) return;
    setCinematicSpinActive(true);
    setSpinPhase("rolling");
    setFinalModalWinner(null);

    const candidatePool = [
      { name: user.name || "Amir", ticket: myTickets[0] || "GD-554433" },
      { name: "Shoaib", ticket: "GD-882211" },
      { name: "Bilal Ahmed", ticket: "GD-332211" },
      { name: "Usama Yousuf", ticket: "GD-991122" },
      { name: "Hamza Ali", ticket: "GD-443322" },
      { name: "Zainab Bibi", ticket: "GD-667788" },
      { name: "Tanveer Khan", ticket: "GD-123456" }
    ];

    myTickets.forEach(tCode => {
      candidatePool.push({ name: user.name || "Participant", ticket: tCode });
    });

    let counter = 0;
    const totalRolls = 30;
    const spinInterval = setInterval(() => {
      const randomCandidate = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      setRollingCandidate(randomCandidate);
      counter++;

      if (counter > totalRolls) {
        clearInterval(spinInterval);
        const finalWinnerObj = candidatePool[Math.floor(Math.random() * candidatePool.length)];
        setFinalModalWinner(finalWinnerObj);
        setSpinPhase("winner");

        if (isRealDraw && typeof addWinnerToStorage === "function") {
          addWinnerToStorage({
            name: finalWinnerObj.name,
            prize: `${prizeAmountText} (SULTAN EDITION)`,
            ticket: finalWinnerObj.ticket,
            avatar: "🏆"
          });
          const nextTarget = Date.now() + 8 * 24 * 60 * 60 * 1000;
          localStorage.setItem("luckydraw_global_target_date", nextTarget.toString());
          setTargetDate(new Date(nextTarget));
        }
      }
    }, 180);
  }, [cinematicSpinActive, myTickets, user.name, prizeAmountText]);

  const triggerAutoDraw = useCallback(() => {
    runCinematicSpin(true);
  }, [runCinematicSpin]);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const difference = targetDate.getTime() - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        triggerAutoDraw();
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [targetDate, triggerAutoDraw]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsScanning(true);
      setScanComplete(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result);
        setTimeout(() => {
          const autoExtractedTRX = Math.floor(10000000000 + Math.random() * 90000000000).toString();
          setTrxId(autoExtractedTRX);
          setIsScanning(false);
          setScanComplete(true);
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoinsEntry = () => {
    if (!user.name || !user.phone) {
      alert(t.alertIncompleteProfile);
      if (navigate) navigate("profile");
      return;
    }
    const success = deductCoins ? deductCoins(TICKET_COINS, "🎉 Lucky Draw ticket purchased using 2,000 coins!") : true;
    if (success) {
      const newTicket = `GD-${Math.floor(100000 + Math.random() * 900000)}`;
      setMyTickets((prev) => [...prev, newTicket]);
      setSubmissionStep(3);
      alert(t.alertCoinsSuccess.replace("{ticket}", newTicket));
    }
  };

  const handleCashSubmission = (e) => {
    e.preventDefault();
    if (!user.name || !user.phone) {
      alert(t.alertIncompleteProfile);
      if (navigate) navigate("profile");
      return;
    }
    if (!trxId || !receiptImage) {
      alert(t.alertCashMissing);
      return;
    }
    if (submitPaymentProof) {
      submitPaymentProof({ gateway, trxId, amount: TICKET_PKR, receiptImage });
    }
    setTrxId("");
    setReceiptImage(null);
    setScanComplete(false);
    setSubmissionStep(2);
    alert(t.alertCashSubmitted);
  };

  const openWhatsAppDirect = () => {
    const adminPhone = "923001234567";
    const text = encodeURIComponent(
      `Hello Admin! I paid Rs.50 for ${prizeAmountText} Sultan Edition Lucky Draw.\n\n` +
      `👤 Name: ${user.name || "User"}\n` +
      `📞 Phone: ${user.phone || "N/A"}\n` +
      `💳 Gateway: ${gateway.toUpperCase()}\n` +
      `🔢 TRX ID: ${trxId || "Attached in Screenshot"}\n\n` +
      `Please issue my official Lucky Draw Ticket Code!`
    );
    window.open(`https://wa.me/${adminPhone}?text=${text}`, "_blank");
  };

  // REAL SECURE BACKEND API TICKET VERIFICATION (STEP 2)
  const handleVerifyTicketSubmit = async (e) => {
    e.preventDefault();
    const cleanTicket = inputTicket.trim().toUpperCase();
    if (!cleanTicket) return;

    if (!user.phone) {
      alert(t.alertMissingPhoneVerify);
      if (navigate) navigate("profile");
      return;
    }

    setIsVerifying(true);
    setSubmissionStep(2);

    try {
      // Connects to your backend server.js API
      const response = await fetch("http://localhost:5000/api/verify-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketCode: cleanTicket, userPhone: user.phone })
      });

      const data = await response.json();

      if (data.success) {
        const successMsg = { type: "success", text: data.message };
        setTicketStatusMsg(successMsg);
        localStorage.setItem("luckydraw_status_msg", JSON.stringify(successMsg));
        setSubmissionStep(3);

        if (!myTickets.includes(cleanTicket)) {
          setMyTickets((prev) => [...prev, cleanTicket]);
        }
      } else {
        const errorMsg = { type: "error", text: data.message };
        setTicketStatusMsg(errorMsg);
        localStorage.setItem("luckydraw_status_msg", JSON.stringify(errorMsg));
        setSubmissionStep(1);
      }
    } catch (error) {
      console.error("Backend Verification Error:", error);
      const networkErrorMsg = { type: "error", text: "❌ Server connection failed! Make sure your backend server.js is running on port 5000." };
      setTicketStatusMsg(networkErrorMsg);
    } finally {
      setIsVerifying(false);
      setInputTicket("");
    }
  };

  return (
    <div className="page-container luckydraw-wrapper" style={{ position: "relative" }}>
      {/* FULL SCREEN CINEMATIC SPIN OVERLAY MODAL */}
      {cinematicSpinActive && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modalCard}>
            <div style={modalStyles.glowEffect}></div>
            <span style={modalStyles.badge}>🌟 GOOVO SULTAN DRAW ARENA 🌟</span>
            <h2 style={modalStyles.modalTitle}>💵 {prizeAmountText} SULTAN EDITION</h2>
            
            {spinPhase === "rolling" ? (
              <div style={modalStyles.rollingBox}>
                <div style={modalStyles.spinnerRing}></div>
                <div style={modalStyles.rollingTextContainer}>
                  <p style={modalStyles.rollingLabel}>🌀 SELECTING FAIR WINNER LIVE...</p>
                  <h3 style={modalStyles.candidateName}>{rollingCandidate.name}</h3>
                  <span style={modalStyles.candidateTicket}>{rollingCandidate.ticket}</span>
                </div>
              </div>
            ) : (
              <div style={modalStyles.winnerBox}>
                <div style={modalStyles.trophyIcon}>🏆</div>
                <h3 style={modalStyles.congratsTitle}>{t.congratsMsg}</h3>
                <div style={modalStyles.winnerCardFinal}>
                  <h2 style={modalStyles.winnerNameFinal}>{finalModalWinner?.name}</h2>
                  <p style={modalStyles.winnerTicketFinal}>Ticket Code: {finalModalWinner?.ticket}</p>
                  <span style={modalStyles.prizeBadgeWon}>Won {prizeAmountText} Cash!</span>
                </div>
                <button 
                  style={modalStyles.closeModalBtn}
                  onClick={() => setCinematicSpinActive(false)}
                >
                  🚀 Return to Dashboard & Restart Timer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NORMAL LUCKY DRAW INTERFACE */}
      <div className="product-banner">
        <span className="live-tag">{t.liveTag}</span>
        <h2>💵 {prizeAmountText} (SULTAN EDITION)</h2>
        <p>{t.subtitle}</p>
      </div>

      <div className="doomsday-timer-card">
        <h3>{t.timerTitle}</h3>
        <div className="doomsday-clock">
          <div className="clock-unit">
            <span>{String(timeLeft.days).padStart(2, "0")}</span>
            <small>{t.days}</small>
          </div>
          <span className="colon">:</span>
          <div className="clock-unit">
            <span>{String(timeLeft.hours).padStart(2, "0")}</span>
            <small>{t.hours}</small>
          </div>
          <span className="colon">:</span>
          <div className="clock-unit">
            <span>{String(timeLeft.minutes).padStart(2, "0")}</span>
            <small>{t.mins}</small>
          </div>
          <span className="colon">:</span>
          <div className="clock-unit pulse">
            <span>{String(timeLeft.seconds).padStart(2, "0")}</span>
            <small>{t.secs}</small>
          </div>
        </div>
      </div>

      <div className="card status-tracker-card">
        <div className="step-tracker">
          <div className={`step-item ${submissionStep >= 1 ? "active" : ""}`}>
            <div className="step-number">1</div>
            <span>{t.step1}</span>
          </div>
          <div className={`step-line ${submissionStep >= 2 ? "active" : ""}`}></div>
          <div className={`step-item ${submissionStep >= 2 ? "active" : ""}`}>
            <div className="step-number">2</div>
            <span>{t.step2}</span>
          </div>
          <div className={`step-line ${submissionStep === 3 ? "active" : ""}`}></div>
          <div className={`step-item ${submissionStep === 3 ? "active" : ""}`}>
            <div className="step-number">3</div>
            <span>{t.step3}</span>
          </div>
        </div>
      </div>

      <div className="card ticket-search-card">
        <div className="card-header">
          <h3>{t.enterTicketTitle}</h3>
          <p>{t.enterTicketSub}</p>
        </div>

        <form onSubmit={handleVerifyTicketSubmit} className="ticket-search-form">
          <div className="input-group">
            <label htmlFor="ticketCodeInput">{t.ticketLabel}</label>
            <input
              id="ticketCodeInput"
              type="text"
              placeholder={t.ticketPlaceholder}
              value={inputTicket}
              onChange={(e) => setInputTicket(e.target.value)}
              disabled={isVerifying}
              required
            />
          </div>
          <button type="submit" className="primary-button verify-btn-full" disabled={isVerifying}>
            {isVerifying ? t.verifyingBtn : t.verifyBtn}
          </button>
        </form>

        {ticketStatusMsg && (
          <div className={`status-msg-box ${ticketStatusMsg.type}`}>
            <p>{ticketStatusMsg.text}</p>
          </div>
        )}
      </div>

      {(!user.name || !user.phone) && (
        <div className="warning-box">
          ⚠️ <strong>{t.warningMsg}</strong>
          <button onClick={() => navigate && navigate("profile")}>{t.goToProfileBtn}</button>
        </div>
      )}

      <div className="draw-toggle-buttons">
        <button
          className={entryMode === "coins" ? "primary-button active" : "secondary-button"}
          onClick={() => setEntryMode("coins")}
        >
          {t.payWithCoins}
        </button>
        <button
          className={entryMode === "cash" ? "primary-button active" : "secondary-button"}
          onClick={() => setEntryMode("cash")}
        >
          {t.payWithCash}
        </button>
      </div>

      {entryMode === "coins" && (
        <div className="card draw-card">
          <h3>{t.payCoinsTitle}</h3>
          <p>{t.availBalance} <strong>{(coins || 0).toLocaleString()} Coins</strong></p>
          <p>{t.ticketPrice} <strong>2,000 Coins</strong></p>
          <button
            className="primary-button action-btn"
            onClick={handleCoinsEntry}
            disabled={coins < TICKET_COINS}
          >
            {coins >= TICKET_COINS ? t.buyTicketCoinsBtn : t.insufficientCoinsBtn}
          </button>
        </div>
      )}

      {entryMode === "cash" && (
        <div className="card draw-card">
          <h3>{t.cashTitle}</h3>
          <p>{t.cashSub}</p>
          <div className="admin-account-info">
            <p><strong>Gateway:</strong> {ADMIN_ACCOUNTS[gateway].name}</p>
            <p><strong>Account / Number:</strong> <span className="acc-num">{ADMIN_ACCOUNTS[gateway].number}</span></p>
          </div>

          <form onSubmit={handleCashSubmission} className="draw-form">
            <label>{t.gatewayLabel}</label>
            <select value={gateway} onChange={(e) => setGateway(e.target.value)}>
              <option value="easypaisa">EasyPaisa</option>
              <option value="jazzcash">JazzCash</option>
            </select>

            <label>{t.receiptLabel}</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} required />

            {isScanning && <p className="ocr-status scanning">{t.scanningReceipt}</p>}
            {scanComplete && <p className="ocr-status success">{t.scannedSuccess}</p>}

            <label>{t.trxLabel}</label>
            <input
              type="text"
              placeholder="e.g. 1029384756"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              required
            />

            {receiptImage && (
              <div className="preview-container">
                <p>Receipt Preview:</p>
                <img src={receiptImage} alt="Receipt Preview" className="receipt-img" />
              </div>
            )}

            <button type="submit" className="primary-button action-btn">
              {t.submitReceiptBtn}
            </button>
            <button type="button" className="whatsapp-direct-btn" onClick={openWhatsAppDirect}>
              {t.whatsappBtn}
            </button>
          </form>
        </div>
      )}

      {myTickets.length > 0 && (
        <div className="my-tickets-card">
          <h4>{t.myTicketsTitle} ({myTickets.length})</h4>
          <div className="ticket-chips">
            {myTickets.map((ticket, index) => (
              <span key={index} className="ticket-badge">{ticket}</span>
            ))}
          </div>
        </div>
      )}

      {/* INDEPENDENT DEMO SPIN TEST SECTION */}
      <div className="live-spin-section" style={{ textAlign: "center", marginTop: "40px" }}>
        <button
          onClick={() => runCinematicSpin(false)}
          className="spin-btn"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            color: "#ffffff",
            padding: "16px 32px",
            fontSize: "16px",
            fontWeight: "800",
            borderRadius: "14px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(245, 158, 11, 0.4)",
            letterSpacing: "1px"
          }}
        >
          {t.spinBtn}
        </button>
        <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px" }}>
          💡 Yeh ek independent demo test hai. Isse aapka asal 8-din wala live countdown timer bilkul affect nahi hoga!
        </p>
      </div>
    </div>
  );
}

// Professional Full-Screen Cinematic Modal Styles
const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(2, 6, 23, 0.92)",
    backdropFilter: "blur(12px)",
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  modalCard: {
    backgroundColor: "#0f172a",
    border: "2px solid #facc15",
    borderRadius: "24px",
    padding: "40px 30px",
    maxWidth: "550px",
    width: "100%",
    textAlign: "center",
    position: "relative",
    boxShadow: "0 0 50px rgba(250, 204, 21, 0.3)",
    animation: "fadeInScale 0.3s ease-out",
  },
  badge: {
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    color: "#facc15",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "1.5px",
    border: "1px solid rgba(250, 204, 21, 0.4)",
  },
  modalTitle: {
    fontSize: "26px",
    fontWeight: "900",
    color: "#ffffff",
    marginTop: "15px",
    marginBottom: "30px",
  },
  rollingBox: {
    padding: "30px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
  },
  spinnerRing: {
    width: "70px",
    height: "70px",
    border: "5px solid rgba(250, 204, 21, 0.2)",
    borderTop: "5px solid #facc15",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  rollingTextContainer: {
    background: "rgba(30, 41, 59, 0.7)",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "20px",
    width: "100%",
  },
  rollingLabel: {
    fontSize: "13px",
    color: "#38bdf8",
    fontWeight: "700",
    marginBottom: "8px",
    letterSpacing: "1px",
  },
  candidateName: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: "4px",
  },
  candidateTicket: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#facc15",
    letterSpacing: "2px",
  },
  winnerBox: {
    padding: "20px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
  },
  trophyIcon: {
    fontSize: "50px",
    animation: "bounce 1s infinite alternate",
  },
  congratsTitle: {
    fontSize: "18px",
    color: "#38bdf8",
    fontWeight: "700",
    letterSpacing: "1px",
  },
  winnerCardFinal: {
    background: "linear-gradient(135deg, rgba(250, 204, 21, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)",
    border: "1px solid #facc15",
    borderRadius: "16px",
    padding: "20px",
    width: "100%",
  },
  winnerNameFinal: {
    fontSize: "28px",
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: "6px",
  },
  winnerTicketFinal: {
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "12px",
  },
  prizeBadgeWon: {
    backgroundColor: "#facc15",
    color: "#0f172a",
    padding: "6px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "800",
  },
  closeModalBtn: {
    backgroundColor: "#38bdf8",
    color: "#0f172a",
    border: "none",
    borderRadius: "12px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    marginTop: "10px",
    width: "100%",
  }
};

export default LuckyDraw;