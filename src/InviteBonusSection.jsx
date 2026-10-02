import React, { useState, useEffect } from 'react';

const InviteBonusSection = () => {
  const [inviteCount, setInviteCount] = useState(0);
  const [coinsPerAd, setCoinsPerAd] = useState(10);
  const [copied, setCopied] = useState(false);
  const [inviteHistory, setInviteHistory] = useState([]);

  // User ka unique referral link (Aap yahan apni real website ka domain rakh sakte hain)
  const userReferralLink = "https://samatkaar.com/?ref=amir_19";

  useEffect(() => {
    // 1. Saved invites aur history load karein local storage se
    const savedInvites = localStorage.getItem('user_invites');
    const savedHistory = localStorage.getItem('invite_history');

    if (savedInvites) {
      const count = parseInt(savedInvites, 10);
      setInviteCount(count);
      setCoinsPerAd(10 + count * 5); // Har invite par +5 coins extra per ad
    }

    if (savedHistory) {
      setInviteHistory(JSON.parse(savedHistory));
    }

    // 2. Real Tracking: Check karein agar URL mein koi referral code aya hai (jab naya user link kh khole)
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode) {
      // Check karein ke kya ye user pehle join ho chuka hai ya nahi (browser session/local storage se)
      const hasJoinedBefore = localStorage.getItem('has_joined_via_referral');
      
      if (!hasJoinedBefore && refCode === 'amir_19') {
        // Naye user ko register mark karein
        localStorage.setItem('has_joined_via_referral', 'true');
        
        // Note: Asal app mein ye data backend (database) par save hota hai, 
        // yahan hum frontend par simulate kar rahe hain jab naya banda website kholta hai.
      }
    }
  }, []);

  // Referral link copy karne ka function
  const handleCopyLink = () => {
    navigator.clipboard.writeText(userReferralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Asli test ya simulation jab koi waqai mein join kare
  const simulateRealJoin = () => {
    const newFriendName = `User_${Math.floor(Math.random() * 9000 + 1000)}`;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newEntry = { name: newFriendName, time: currentTime };
    const updatedHistory = [newEntry, ...inviteHistory];
    
    const newCount = inviteCount + 1;
    const newCoins = 10 + newCount * 5;

    setInviteCount(newCount);
    setCoinsPerAd(newCoins);
    setInviteHistory(updatedHistory);

    // Save to localStorage
    localStorage.setItem('user_invites', newCount);
    localStorage.setItem('invite_history', JSON.stringify(updatedHistory));
  };

  return (
    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-gray-900 p-6 rounded-2xl shadow-xl border border-purple-500/30 text-white my-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
          🚀 Referral & Ad Boost
        </h3>
        <span className="bg-yellow-500 text-gray-950 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
          {coinsPerAd} Coins/Ad
        </span>
      </div>

      <p className="text-gray-300 text-sm mb-4 leading-relaxed">
        Jab koi dost aapke link se aakar website ka member banega, tabhi aapka invite count barhega aur aapko har ad par <span className="text-yellow-400 font-bold">+5 Extra Coins</span> milenge!
      </p>

      {/* Stats Box */}
      <div className="grid grid-cols-2 gap-4 mb-5 bg-black/40 p-4 rounded-xl border border-white/10 text-center">
        <div>
          <p className="text-xs text-gray-400">Successfully Joined</p>
          <p className="text-2xl font-black text-white">{inviteCount} Friends</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Current Ad Reward</p>
          <p className="text-2xl font-black text-yellow-400">{coinsPerAd} 🪙</p>
        </div>
      </div>

      {/* Share Link Section */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center bg-gray-800 rounded-lg p-2 border border-gray-700">
          <input
            type="text"
            readOnly
            value={userReferralLink}
            className="bg-transparent text-gray-300 text-sm w-full px-2 outline-none select-all"
          />
          <button
            onClick={handleCopyLink}
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold px-4 py-2 rounded-md text-sm transition-all shadow"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Simulation button to test real join */}
        <button
          onClick={simulateRealJoin}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-2 rounded-lg text-xs transition-colors border border-green-400/30"
        >
          ➕ Simulating Real Friend Joining (Test)
        </button>
      </div>

      {/* Invite History List */}
      <div className="bg-black/30 p-3 rounded-xl border border-white/5">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          📋 Joined Friends History ({inviteHistory.length})
        </h4>
        
        {inviteHistory.length === 0 ? (
          <p className="text-xs text-gray-500 italic text-center py-2">Abhi tak koi dost join nahi hua.</p>
        ) : (
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {inviteHistory.map((item, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-800/60 px-3 py-1.5 rounded-lg text-xs border border-gray-700/50">
                <span className="text-green-400 font-semibold flex items-center gap-1.5">
                  🟢 {item.name}
                </span>
                <span className="text-gray-400 text-[10px]">{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteBonusSection;