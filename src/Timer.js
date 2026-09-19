// Timer Manager - Real Absolute Time Tracker (Mobile/Device independent)

// Aap yahan se duration change kar sakte hain ke timer kitne din/ghantay ka chalna chahiye
// Misaal ke tor par: 8 din = 8 * 24 * 60 * 60 * 1000 milliseconds
const DEFAULT_TIMER_DURATION_MS = 8 * 24 * 60 * 60 * 1000; // 8 Days (Aap ise apne hisab se badal sakte hain)

export function getOrCreateUserTimer(userId, customDurationMs = DEFAULT_TIMER_DURATION_MS) {
  if (!userId) return { timeLeft: 0, expired: true };

  const storageKey = `goovo_real_timer_${userId}`;
  const savedTimerData = JSON.parse(localStorage.getItem(storageKey));
  
  const now = Date.now();
  let expiryTime;

  if (savedTimerData && savedTimerData.expiryTime) {
    // Agar pehle se timer chal raha hai, toh wohi expiry time use hoga
    expiryTime = savedTimerData.expiryTime;
  } else {
    // Agar pehli baar user aya hai, toh naya absolute expiry time set kar do
    expiryTime = now + customDurationMs;
    localStorage.setItem(storageKey, JSON.stringify({ expiryTime }));
  }

  const timeLeftMs = expiryTime - now;

  if (timeLeftMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
      timeLeftMs: 0
    };
  }

  // Milliseconds ko Days, Hours, Minutes aur Seconds mein convert karna
  const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    expired: false,
    timeLeftMs
  };
}

// Timer ko reset ya extend karne ke liye function (Agar admin ko zaroorat paray)
export function resetUserTimer(userId, newDurationMs = DEFAULT_TIMER_DURATION_MS) {
  if (!userId) return;
  const storageKey = `goovo_real_timer_${userId}`;
  const expiryTime = Date.now() + newDurationMs;
  localStorage.setItem(storageKey, JSON.stringify({ expiryTime }));
}