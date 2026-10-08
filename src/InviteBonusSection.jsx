import React, { useState } from "react";

const InviteBonusSection = () => {
  const [copied, setCopied] = useState(false);

  // AdSense-safe: use your real live site URL here.
  // Referral rewards/coins are intentionally disabled for now.
  const userReferralLink = "https://samatkaar.netlify.app/";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(userReferralLink);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (error) {
      console.error("Share link copy failed:", error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-gray-900 p-6 rounded-2xl shadow-xl border border-purple-500/30 text-white my-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
          🚀 Invite Friends
        </h3>

        <span className="bg-yellow-500 text-gray-950 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
          Coming Soon
        </span>
      </div>

      {/* Safe Message */}
      <div className="bg-black/40 border border-yellow-500/20 rounded-xl p-5 text-center mb-5">
        <div className="text-4xl mb-2">🤝</div>

        <h2 className="text-xl font-black text-white mb-2">
          Share SAMATKAAR With Friends
        </h2>

        <p className="text-sm text-gray-300 leading-relaxed">
          Referral feature abhi testing phase mein hai. Is waqt invite par koi
          coins, cash, ya guaranteed reward active nahi hai.
        </p>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-indigo-950/60 border border-indigo-400/20 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="text-2xl">⏳</div>

          <div>
            <h4 className="font-bold text-indigo-200">
              Referral System Coming Soon
            </h4>

            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Hum referral system ko fair aur secure banane par kaam kar rahe
              hain. Launch hone ke baad details yahan clearly show hongi.
            </p>
          </div>
        </div>
      </div>

      {/* Share Link Preview */}
      <div className="space-y-3">
        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
          Share Link
        </div>

        <div className="flex items-center bg-gray-800 rounded-lg p-2 border border-gray-700">
          <input
            type="text"
            readOnly
            value={userReferralLink}
            className="bg-transparent text-gray-300 text-sm w-full px-2 outline-none select-all"
          />

          <button
            type="button"
            onClick={handleCopyLink}
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold px-4 py-2 rounded-md text-sm transition-all shadow"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Safe Rules Preview */}
      <div className="mt-5 bg-black/30 p-4 rounded-xl border border-white/5">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          📌 Feature Status
        </h4>

        <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
          <div>1️⃣ Referral link sirf sharing ke liye available hai.</div>
          <div>2️⃣ Invite bonus abhi active nahi hai.</div>
          <div>3️⃣ Koi guaranteed coins ya cash reward promise nahi hai.</div>
          <div className="text-yellow-400 font-bold">
            4️⃣ Official launch ke baad fair rules update kiye jayenge.
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteBonusSection;
