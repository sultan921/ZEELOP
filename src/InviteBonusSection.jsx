import React, { useState } from "react";

const InviteBonusSection = () => {
  const [copied, setCopied] = useState(false);

  const userReferralLink = "https://samatkaar.com/?ref=amir_19";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(userReferralLink);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (error) {
      console.error("Referral link copy failed:", error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-gray-900 p-6 rounded-2xl shadow-xl border border-purple-500/30 text-white my-6 max-w-md mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">

        <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
          🚀 Invite & Earn
        </h3>

        <span className="bg-yellow-500 text-gray-950 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
          Coming Soon
        </span>

      </div>

      {/* Reward Message */}
      <div className="bg-black/40 border border-yellow-500/20 rounded-xl p-5 text-center mb-5">

        <div className="text-4xl mb-2">
          🎁
        </div>

        <h2 className="text-xl font-black text-white mb-2">
          Invite 1 Person
        </h2>

        <div className="text-3xl font-black text-yellow-400 mb-2">
          Get 2,000 🪙
        </div>

        <p className="text-xs text-gray-400">
          Har successfully joined friend par 2,000 coins reward milega.
        </p>

      </div>

      {/* Coming Soon Notice */}
      <div className="bg-indigo-950/60 border border-indigo-400/20 rounded-xl p-4 mb-5">

        <div className="flex items-center gap-3">

          <div className="text-2xl">
            ⏳
          </div>

          <div>
            <h4 className="font-bold text-indigo-200">
              Referral System Coming Soon
            </h4>

            <p className="text-xs text-gray-400 mt-1">
              Invite & Earn system abhi launch nahi hua.
              Feature available hote hi aap apne unique referral link se
              friends invite kar sakenge.
            </p>
          </div>

        </div>

      </div>

      {/* Referral Preview */}
      <div className="space-y-3">

        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
          Your Referral Link
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

      {/* Rules Preview */}
      <div className="mt-5 bg-black/30 p-4 rounded-xl border border-white/5">

        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          🎯 How It Will Work
        </h4>

        <div className="space-y-2 text-xs text-gray-300">

          <div>
            1️⃣ Share your unique referral link.
          </div>

          <div>
            2️⃣ Your friend creates a new SAMATKAAR account.
          </div>

          <div>
            3️⃣ Successful referral is verified.
          </div>

          <div className="text-yellow-400 font-bold">
            4️⃣ You receive 2,000 coins.
          </div>

        </div>

      </div>

    </div>
  );
};

export default InviteBonusSection;