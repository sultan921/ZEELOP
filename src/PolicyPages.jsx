import React from "react";
import "./App.css";

// --- 1. PRIVACY POLICY COMPONENT ---
export default function PrivacyPolicy({ navigate }) {
  return (
    <div className="policy-container" style={policyStyles.container}>
      <div style={policyStyles.card}>
        <button onClick={() => navigate("home")} style={policyStyles.backBtn}>← Back to Home</button>
        <h1 style={policyStyles.heading}>🛡️ Privacy Policy</h1>
        <p style={policyStyles.date}>Last updated: September 2026</p>
        
        <div style={policyStyles.content}>
          <h3>1. Introduction</h3>
          <p>Welcome to ZEELOP ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our application and tell you about your privacy rights.</p>
          
          <h3>2. Information We Collect</h3>
          <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
          <ul>
            <li><strong>Identity Data:</strong> Includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data:</strong> Includes phone number and communication details.</li>
            <li><strong>Transaction Data:</strong> Includes details about payments and rewards earned on ZEELOP.</li>
          </ul>

          <h3>3. How We Use Your Information</h3>
          <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul>
            <li>To register you as a new user.</li>
            <li>To manage your account, wallet balance, and rewards.</li>
            <li>To notify you about changes to our services or lucky draws.</li>
          </ul>

          <h3>4. Data Security</h3>
          <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. All sensitive data is securely stored on our protected backend database.</p>
        </div>
      </div>
    </div>
  );
}

// --- 2. TERMS & CONDITIONS COMPONENT ---
export function Terms({ navigate }) {
  return (
    <div className="policy-container" style={policyStyles.container}>
      <div style={policyStyles.card}>
        <button onClick={() => navigate("home")} style={policyStyles.backBtn}>← Back to Home</button>
        <h1 style={policyStyles.heading}>📄 Terms & Conditions</h1>
        <p style={policyStyles.date}>Last updated: September 2026</p>
        
        <div style={policyStyles.content}>
          <h3>1. Acceptance of Terms</h3>
          <p>By accessing and using ZEELOP, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use our application.</p>
          
          <h3>2. User Accounts & Security</h3>
          <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.</p>

          <h3>3. Coins, Earning & Lucky Draws</h3>
          <p>All coins earned through tasks, games, or promotions on ZEELOP are subject to verification. ZEELOP reserves the right to suspend or deduct coins if fraudulent activity or violation of rules is detected.</p>

          <h3>4. Limitation of Liability</h3>
          <p>In no event shall ZEELOP, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the service.</p>
        </div>
      </div>
    </div>
  );
}

// --- 3. REFUND POLICY COMPONENT ---
export function RefundPolicy({ navigate }) {
  return (
    <div className="policy-container" style={policyStyles.container}>
      <div style={policyStyles.card}>
        <button onClick={() => navigate("home")} style={policyStyles.backBtn}>← Back to Home</button>
        <h1 style={policyStyles.heading}>🔄 Refund Policy</h1>
        <p style={policyStyles.date}>Last updated: September 2026</p>
        
        <div style={policyStyles.content}>
          <h3>1. Overview</h3>
          <p>At ZEELOP, we strive to ensure transparency in all digital transactions, ticket purchases for lucky draws, and coin-related activities.</p>
          
          <h3>2. Lucky Draw Entries & Digital Purchases</h3>
          <p>Due to the digital and instant nature of lucky draw participations, ticket purchases and coin spends are generally <strong>non-refundable</strong> once processed and entered into an active draw pool.</p>

          <h3>3. Failed or Incorrect Transactions</h3>
          <p>If you encounter a transaction error where payment was deducted from your account/wallet but coins or tickets were not credited, please contact our support team with transaction proofs within 24-48 hours. Valid claims will be thoroughly investigated and manually credited or refunded.</p>

          <h3>4. Contact Us</h3>
          <p>If you have any questions about our Refund Policy, please reach out to us through the profile or support channels provided inside the application.</p>
        </div>
      </div>
    </div>
  );
}

// --- STYLING OBJECTS ---
const policyStyles = {
  container: {
    padding: "20px 16px",
    maxWidth: "800px",
    margin: "0 auto",
    color: "#f8fafc",
    boxSizing: "border-box"
  },
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "#38bdf8",
    fontSize: "13px",
    cursor: "pointer",
    marginBottom: "16px",
    fontWeight: "600",
    padding: 0
  },
  heading: {
    fontSize: "24px",
    marginBottom: "4px",
    color: "#fff"
  },
  date: {
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "20px"
  },
  content: {
    lineHeight: "1.6",
    fontSize: "14px",
    color: "#cbd5e1"
  }
};