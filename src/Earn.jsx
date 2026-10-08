import { useState, useEffect } from "react";



import toast from "react-hot-toast";







console.log("🎮 SAMATKAAR ARCADE LOADED - ADSENSE REVIEW SAFE MODE");







function Earn({ addCoins }) {



  const [selectedGame, setSelectedGame] = useState(null);







  // ---------------- STATE FOR GAME WIN COUNTER ----------------



  const [winsCount, setWinsCount] = useState(0);



  const [showAdModal, setShowAdModal] = useState(false); // Disabled during AdSense review



  const [adTimer, setAdTimer] = useState(5);



  const [adStatus, setAdStatus] = useState("idle"); // 'idle' | 'loading' | 'playing' | 'completed' | 'error'



  const [adMessage, setAdMessage] = useState("");







  // ---------------- STATE FOR 10-MINUTE PLAYTIME REWARD ----------------



  const [playTimeSeconds, setPlayTimeSeconds] = useState(0);



  const [timeRewardClaimed, setTimeRewardClaimed] = useState(false);







  // AdSense review mode: third-party/rewarded ads disabled



  const ADSENSE_REVIEW_SAFE_MODE = true;







  // 10 Minutes Timer Hook (600 seconds)



  useEffect(() => {



    const timerInterval = setInterval(() => {



      setPlayTimeSeconds((prev) => prev + 1);



    }, 1000);







    return () => clearInterval(timerInterval);



  }, []);







  // Helper to record game win & trigger Ad Modal every 4 wins



  const registerWin = (coinsEarned = 0) => {



    if (coinsEarned > 0 && addCoins) {



      addCoins(coinsEarned);



    }







    setWinsCount((prev) => {



      const newWinCount = prev + 1;



      if (newWinCount % 4 === 0) {



        // Rewarded/sponsor ads are disabled during AdSense review.
        // triggerAdFlow();



      }



      return newWinCount;



    });



  };







  // Sponsor/ad flow disabled while AdSense review is pending



  const triggerAdFlow = () => {
    setShowAdModal(true);
    setAdStatus("completed");
    setAdTimer(0);
    setAdMessage("Gameplay break complete. Continue playing.");
  };







  // Video Ad Countdown Hook



  useEffect(() => {



    let interval;



    if (showAdModal && adStatus === "playing" && adTimer > 0) {



      interval = setInterval(() => {



        setAdTimer((prev) => prev - 1);



      }, 1000);



    } else if (adTimer === 0 && adStatus === "playing") {



      setAdStatus("completed");



      setAdMessage("🎉 Ad Poora Dekh Liya Gaya Hai!");



      toast.success("Gameplay break successful! Claim your reward.");



    }



    return () => clearInterval(interval);



  }, [showAdModal, adStatus, adTimer]);







  // Continue after break - no ad reward during AdSense review



  const handleClaimAdReward = () => {



    if (adStatus === "completed") {



      // No coins are given for ads during AdSense review.



      setShowAdModal(false);



      setAdStatus("idle");



      toast.success("Continue playing! 🎮");



    }



  };







  // Close Modal



  const handleCloseAdModal = () => {



    setShowAdModal(false);



    setAdStatus("idle");



  };







  // Handle Playtime Reward Claim



  const handleClaimTimeReward = () => {



    if (playTimeSeconds >= 600 && !timeRewardClaimed) {



      if (addCoins) addCoins(20);



      setTimeRewardClaimed(true);



      toast.success("10 Minutes Playtime Reward Claimed (+20 Coins)!");



    }



  };







  // ---------------- GAME STATES ----------------



  const [secret, setSecret] = useState(null);



  const [guess, setGuess] = useState("");



  const [guessMessage, setGuessMessage] = useState("");



  const [guessWon, setGuessWon] = useState(false);







  const [rpsResult, setRpsResult] = useState("");







  const questions = [



    {



      question: "Which language is used with React?",



      options: ["JavaScript", "Python", "PHP", "C++"],



      answer: "JavaScript",



    },



    {



      question: "What does HTML stand for?",



      options: [



        "HyperText Markup Language",



        "HighText Machine Language",



        "Hyper Tool Markup Language",



        "Home Text Language",



      ],



      answer: "HyperText Markup Language",



    },



    {



      question: "Which hook is used for state in React?",



      options: ["useState", "useColor", "useData", "useHTML"],



      answer: "useState",



    },



  ];







  const [quizIndex, setQuizIndex] = useState(0);



  const [quizMessage, setQuizMessage] = useState("");



  const [quizFinished, setQuizFinished] = useState(false);







  const [memoryCards, setMemoryCards] = useState([]);



  const [memorySelected, setMemorySelected] = useState([]);



  const [memoryMatched, setMemoryMatched] = useState([]);



  const [memoryMessage, setMemoryMessage] = useState("");







  const [reactionStatus, setReactionStatus] = useState("waiting");



  const [reactionStart, setReactionStart] = useState(null);



  const [reactionTime, setReactionTime] = useState(null);







  const [mathQuestion, setMathQuestion] = useState(null);



  const [mathAnswer, setMathAnswer] = useState("");



  const [mathMessage, setMathMessage] = useState("");







  const [coinResult, setCoinResult] = useState("");



  const [diceVal, setDiceVal] = useState(1);



  const [diceMessage, setDiceMessage] = useState("");







  const [slots, setSlots] = useState(["🍒", "🍋", "🍊"]);



  const [slotMessage, setSlotMessage] = useState("");







  const wordList = [



    { word: "REACT", scrambled: "TCERA" },



    { word: "GOOVO", scrambled: "OOVOG" },



    { word: "COINS", scrambled: "NICO1" },



    { word: "SMART", scrambled: "MTSAR" },



  ];



  const [wordIdx, setWordIdx] = useState(0);



  const [wordInput, setWordInput] = useState("");



  const [wordMessage, setWordMessage] = useState("");







  const [cardCurrent, setCardCurrent] = useState(5);



  const [cardMessage, setCardMessage] = useState("");







  const [tttBoard, setTttBoard] = useState(Array(9).fill(null));



  const [tttMsg, setTttMsg] = useState("");







  const colorNames = ["RED", "BLUE", "GREEN", "YELLOW"];



  const colorCodes = ["red", "blue", "green", "gold"];



  const [targetColor, setTargetColor] = useState({ text: "", color: "" });



  const [colorMsg, setColorMsg] = useState("");







  const games = [



    { id: 1, icon: "🎯", title: "Guess the Number", description: "Test your skill & guess the secret number." },



    { id: 2, icon: "✂️", title: "Rock Paper Scissors", description: "Outsmart the computer AI opponent." },



    { id: 3, icon: "🧠", title: "Quick Quiz", description: "Test your general tech knowledge." },



    { id: 4, icon: "🃏", title: "Memory Match", description: "Match all card pairs to win." },



    { id: 5, icon: "⚡", title: "Reaction Game", description: "Test your fast reflexes and reaction speed." },



    { id: 6, icon: "🔢", title: "Math Challenge", description: "Solve quick math puzzles accurately." },



    { id: 7, icon: "🪙", title: "Coin Flip", description: "Test your luck in heads or tails." },



    { id: 8, icon: "🎲", title: "Dice Roll", description: "Roll high numbers to clear the stage." },



    { id: 9, icon: "🎰", title: "Slot Machine", description: "Match symbols in the spin wheel." },



    { id: 10, icon: "🔤", title: "Word Scramble", description: "Unscramble the secret words." },



    { id: 11, icon: "🎴", title: "High or Low", description: "Predict the next card sequence." },



    { id: 12, icon: "🔲", title: "Tic Tac Toe", description: "Beat the intelligent AI player." },



    { id: 13, icon: "🎨", title: "Color Matcher", description: "Match true text colors accurately." },



  ];







  function selectGame(game) {



    setSelectedGame(game);



    if (game.id === 1) startGuess();



    if (game.id === 2) setRpsResult("");



    if (game.id === 3) { setQuizIndex(0); setQuizMessage(""); setQuizFinished(false); }



    if (game.id === 4) startMemory();



    if (game.id === 5) startReaction();



    if (game.id === 6) newMathQuestion();



    if (game.id === 7) setCoinResult("");



    if (game.id === 8) { setDiceVal(1); setDiceMessage(""); }



    if (game.id === 9) { setSlots(["🍒", "🍋", "🍊"]); setSlotMessage(""); }



    if (game.id === 10) { setWordIdx(0); setWordInput(""); setWordMessage(""); }



    if (game.id === 11) { setCardCurrent(Math.floor(Math.random() * 10) + 1); setCardMessage(""); }



    if (game.id === 12) { setTttBoard(Array(9).fill(null)); setTttMsg(""); }



    if (game.id === 13) startColorGame();



  }







  // Game Handlers



  function startGuess() { setSecret(Math.floor(Math.random() * 10) + 1); setGuess(""); setGuessMessage(""); setGuessWon(false); }



  function checkGuess() {



    const num = Number(guess);



    if (num === secret) {



      setGuessMessage("🎉 Correct! Stage Cleared.");



      setGuessWon(true);



      registerWin();



    } else if (num < secret) setGuessMessage("📈 Too low!");



    else setGuessMessage("📉 Too high!");



    setGuess("");



  }







  function playRPS(choice) {



    const opts = ["Rock", "Paper", "Scissors"];



    const comp = opts[Math.floor(Math.random() * opts.length)];



    if (choice === comp) setRpsResult(`🤝 Draw! Computer chose ${comp}.`);



    else if ((choice === "Rock" && comp === "Scissors") || (choice === "Paper" && comp === "Rock") || (choice === "Scissors" && comp === "Paper")) {



      setRpsResult(`🎉 You Win!`);



      registerWin();



    } else setRpsResult(`😔 You Lose! Computer chose ${comp}.`);



  }







  function answerQuiz(option) {



    if (option === questions[quizIndex].answer) {



      if (quizIndex === questions.length - 1) {



        setQuizMessage("🎉 All correct! Quiz Cleared.");



        setQuizFinished(true);



        registerWin();



      } else {



        setQuizMessage("✅ Correct!");



        setTimeout(() => { setQuizIndex((old) => old + 1); setQuizMessage(""); }, 600);



      }



    } else setQuizMessage("❌ Wrong answer!");



  }







  function startMemory() {



    const cards = ["🍎", "🍎", "🚀", "🚀", "⭐", "⭐", "🎮", "🎮"];



    setMemoryCards(cards.sort(() => Math.random() - 0.5));



    setMemorySelected([]); setMemoryMatched([]); setMemoryMessage("");



  }



  function selectMemory(idx) {



    if (memorySelected.includes(idx) || memoryMatched.includes(idx) || memorySelected.length === 2) return;



    const newSel = [...memorySelected, idx];



    setMemorySelected(newSel);



    if (newSel.length === 2) {



      if (memoryCards[newSel[0]] === memoryCards[newSel[1]]) {



        const newMatched = [...memoryMatched, newSel[0], newSel[1]];



        setMemoryMatched(newMatched); setMemorySelected([]);



        if (newMatched.length === memoryCards.length) {



          setMemoryMessage("🎉 You matched all pairs!");



          registerWin();



        }



      } else setTimeout(() => setMemorySelected([]), 700);



    }



  }







  function startReaction() { setReactionStatus("waiting"); setReactionTime(null); setTimeout(() => { setReactionStatus("GO"); setReactionStart(Date.now()); }, Math.random() * 2000 + 1500); }



  function reactNow() {



    if (reactionStatus !== "GO") return;



    const time = Date.now() - reactionStart;



    setReactionTime(time); setReactionStatus("finished");



    if (time < 1000) registerWin();



  }







  function newMathQuestion() {



    const a = Math.floor(Math.random() * 20) + 1, b = Math.floor(Math.random() * 20) + 1;



    setMathQuestion({ a, b, answer: a + b }); setMathAnswer(""); setMathMessage("");



  }



  function checkMath() {



    if (Number(mathAnswer) === mathQuestion.answer) {



      setMathMessage("🎉 Correct Answer!");



      registerWin();



    } else setMathMessage("❌ Wrong answer!");



  }







  function flipCoin(choice) {



    const res = Math.random() > 0.5 ? "Heads" : "Tails";



    if (choice === res) {



      setCoinResult(`🎉 Result: ${res}. You Won!`);



      registerWin();



    } else setCoinResult(`😔 Result: ${res}. You lost!`);



  }







  function rollDice() {



    const val = Math.floor(Math.random() * 6) + 1;



    setDiceVal(val);



    if (val >= 5) {



      setDiceMessage(`🎉 Rolled ${val}! Stage Cleared!`);



      registerWin();



    } else setDiceMessage(`🎲 Rolled ${val}. Try for 5 or 6!`);



  }







  function spinSlot() {



    const icons = ["🍒", "🍋", "🍊", "💎", "7️⃣"];



    const s1 = icons[Math.floor(Math.random() * icons.length)];



    const s2 = icons[Math.floor(Math.random() * icons.length)];



    const s3 = icons[Math.floor(Math.random() * icons.length)];



    setSlots([s1, s2, s3]);



    if (s1 === s2 && s2 === s3) {



      setSlotMessage("🎉 JACKPOT WON!");



      registerWin();



    } else setSlotMessage("Try again!");



  }







  function checkWord() {



    if (wordInput.trim().toUpperCase() === wordList[wordIdx].word) {



      setWordMessage("🎉 Correct Word Unscrambled!");



      registerWin();



    } else setWordMessage("❌ Wrong word, try again!");



  }







  function guessHighLow(isHigher) {



    const next = Math.floor(Math.random() * 10) + 1;



    const won = isHigher ? next >= cardCurrent : next <= cardCurrent;



    if (won) {



      setCardMessage(`🎉 Next card was ${next}! You won.`);



      registerWin();



    } else setCardMessage(`😔 Next card was ${next}! Try again.`);



    setCardCurrent(next);



  }







  function handleTttClick(idx) {



    if (tttBoard[idx] || tttMsg) return;



    const newB = [...tttBoard]; newB[idx] = "❌";



    setTttBoard(newB);



    if (checkTttWinner(newB, "❌")) {



      setTttMsg("🎉 You Beat AI!");



      registerWin();



      return;



    }



    const empty = newB.map((v, i) => (v === null ? i : null)).filter((v) => v !== null);



    if (empty.length > 0) {



      const aiChoice = empty[Math.floor(Math.random() * empty.length)];



      newB[aiChoice] = "⭕";



      setTttBoard(newB);



      if (checkTttWinner(newB, "⭕")) setTttMsg("😔 AI Won!");



    }



  }



  function checkTttWinner(b, p) {



    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];



    return wins.some((w) => w.every((i) => b[i] === p));



  }







  function startColorGame() {



    const randText = colorNames[Math.floor(Math.random() * colorNames.length)];



    const randCode = colorCodes[Math.floor(Math.random() * colorCodes.length)];



    setTargetColor({ text: randText, color: randCode });



    setColorMsg("");



  }



  function checkColor(chosenCode) {



    if (chosenCode === targetColor.color) {



      setColorMsg("🎉 Correct Color Match!");



      registerWin();



    } else setColorMsg("❌ Wrong match!");



  }







  // Format MM:SS for timer



  const formattedMinutes = Math.floor(playTimeSeconds / 60);



  const formattedSeconds = playTimeSeconds % 60;



  const progressPercent = Math.min(100, Math.floor((playTimeSeconds / 600) * 100));







  return (



    <main className="section relative p-4 text-white">



      {/* FULLSCREEN AD MODAL AFTER 4 WINS */}



      {showAdModal && (



        <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col justify-center items-center p-4">



          <div className="bg-slate-900 border-2 border-sky-400 p-6 rounded-2xl text-center max-w-sm w-full shadow-2xl">



            <div className="text-5xl mb-3">📺</div>



            <h2 className="text-xl font-bold text-sky-400 mb-2">Gameplay Break</h2>



            <p className="text-slate-400 text-sm mb-4">{adMessage}</p>







            {adStatus === "playing" && (



              <div className="bg-slate-950 p-4 rounded-xl text-lg font-bold mb-4 border border-slate-800">



                Please wait... ({adTimer}s)



              </div>



            )}







            {adStatus === "completed" ? (



              <button



                onClick={handleClaimAdReward}



                className="w-full py-3 bg-green-500 hover:bg-green-600 font-bold rounded-xl shadow-lg cursor-pointer transition-all"



              >



                Continue ▶



              </button>



            ) : (



              <button



                disabled



                className="w-full py-3 bg-slate-700 text-slate-400 font-bold rounded-xl cursor-not-allowed"



              >



                {adStatus === "loading" ? "Preparing..." : `Please Wait (${adTimer}s)`}



              </button>



            )}



          </div>



        </div>



      )}







      {/* TOP HEADER & TIME PLAY REWARD BANNER */}



      <div className="mb-6">



        <p className="text-xs font-bold text-sky-400 tracking-wider">SAMATKAR ARCADE</p>



        <h1 className="text-2xl font-extrabold mt-1 mb-4">🎮 Arcade Hub ({games.length} Games)</h1>







        {/* PROFESSIONAL TIME REWARD BANNER */}



        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">



          <div className="flex justify-between items-center flex-wrap gap-2">



            <div>



              <h3 className="text-sky-400 font-bold text-sm sm:text-base">⏱️ Play 10 Minutes & Earn +20 Coins</h3>



              <p className="text-slate-400 text-xs">Keep playing arcade games to accumulate time automatically.</p>



            </div>



            <div>



              {playTimeSeconds >= 600 && !timeRewardClaimed ? (



                <button



                  onClick={handleClaimTimeReward}



                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-sm shadow-md cursor-pointer"



                >



                  Claim +20 Coins



                </button>



              ) : (



                <span className="text-sm font-bold text-amber-400">



                  {timeRewardClaimed ? "✅ Claimed" : `${formattedMinutes}m ${formattedSeconds < 10 ? "0" : ""}${formattedSeconds}s / 10m`}



                </span>



              )}



            </div>



          </div>







          {/* PROGRESS BAR */}



          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">



            <div



              className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-1000"



              style={{ width: `${progressPercent}%` }}



            />



          </div>



        </div>



      </div>







      {/* ACTIVE GAME RENDER */}



      {selectedGame ? (



        <div>



          <button



            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold mb-4 cursor-pointer transition-all"



            onClick={() => setSelectedGame(null)}



          >



            ← Back to Games Hub



          </button>







          {selectedGame.id === 1 && (



            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-xl">



              <h2 className="text-xl font-bold mb-3">🎯 Guess the Number</h2>



              <input



                type="number"



                value={guess}



                onChange={(e) => setGuess(e.target.value)}



                disabled={guessWon}



                placeholder="1 - 10"



                className="bg-slate-950 border border-slate-700 px-4 py-2 rounded-xl text-center text-white w-32 outline-none"



              />



              <br />



              <button



                className="mt-4 px-6 py-2 bg-sky-500 hover:bg-sky-600 font-bold rounded-xl cursor-pointer"



                onClick={checkGuess}



                disabled={guessWon}



              >



                Guess



              </button>



              <h3 className="mt-3 font-semibold text-sky-300">{guessMessage}</h3>



              {guessWon && (



                <button className="mt-3 px-4 py-2 bg-green-500 rounded-xl font-bold cursor-pointer" onClick={startGuess}>



                  🔄 Play Again



                </button>



              )}



            </div>



          )}







          {selectedGame.id === 2 && (



            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-xl">



              <h2 className="text-xl font-bold mb-4">✂️ Rock Paper Scissors</h2>



              <div className="flex gap-3 justify-center">



                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold cursor-pointer" onClick={() => playRPS("Rock")}>🪨 Rock</button>



                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold cursor-pointer" onClick={() => playRPS("Paper")}>📄 Paper</button>



                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold cursor-pointer" onClick={() => playRPS("Scissors")}>✂️ Scissors</button>



              </div>



              <h3 className="mt-4 text-lg font-bold text-sky-400">{rpsResult}</h3>



            </div>



          )}







          {selectedGame.id === 3 && (



            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-xl">



              <h2 className="text-xl font-bold mb-4">🧠 Quick Quiz</h2>



              {!quizFinished ? (



                <>



                  <h3 className="text-lg mb-4">{questions[quizIndex].question}</h3>



                  <div className="grid gap-2 max-w-sm mx-auto">



                    {questions[quizIndex].options.map((opt) => (



                      <button key={opt} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold cursor-pointer transition-all" onClick={() => answerQuiz(opt)}>{opt}</button>



                    ))}



                  </div>



                  <h3 className="mt-3 text-sky-400 font-bold">{quizMessage}</h3>



                </>



              ) : (



                <button className="px-6 py-2 bg-green-500 rounded-xl font-bold cursor-pointer" onClick={() => selectGame(selectedGame)}>🔄 Play Again</button>



              )}



            </div>



          )}







          {selectedGame.id === 4 && (



            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-xl">



              <h2 className="text-xl font-bold mb-4">🃏 Memory Match</h2>



              <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto">



                {memoryCards.map((card, idx) => (



                  <button key={idx} onClick={() => selectMemory(idx)} className="h-16 bg-slate-800 hover:bg-slate-700 text-2xl rounded-xl cursor-pointer">



                    {memorySelected.includes(idx) || memoryMatched.includes(idx) ? card : "❓"}



                  </button>



                ))}



              </div>



              <h3 className="mt-4 font-bold text-sky-400">{memoryMessage}</h3>



            </div>



          )}







          {selectedGame.id === 5 && (



            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-xl">



              <h2 className="text-xl font-bold mb-3">⚡ Reaction Game</h2>



              <button onClick={reactNow} className="px-8 py-6 text-xl font-extrabold bg-sky-500 hover:bg-sky-600 rounded-2xl cursor-pointer shadow-lg transition-all">



                {reactionStatus === "waiting" && "WAIT..."}



                {reactionStatus === "GO" && "CLICK NOW!"}



                {reactionStatus === "finished" && `${reactionTime} ms`}



              </button>



              {reactionStatus === "finished" && <button className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold cursor-pointer block mx-auto" onClick={startReaction}>🔄 Try Again</button>}



            </div>



          )}







          {selectedGame.id === 6 && (



            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-xl">



              <h2 className="text-xl font-bold mb-3">🔢 Math Challenge</h2>



              {mathQuestion && (



                <>



                  <h3 className="text-xl mb-3">{mathQuestion.a} + {mathQuestion.b} = ?</h3>



                  <input type="number" value={mathAnswer} onChange={(e) => setMathAnswer(e.target.value)} className="bg-slate-950 border border-slate-700 px-4 py-2 rounded-xl text-center text-white w-32 outline-none" />



                  <br />



                  <button className="mt-4 px-6 py-2 bg-sky-500 hover:bg-sky-600 font-bold rounded-xl cursor-pointer" onClick={checkMath}>Submit</button>



                  <h3 className="mt-3 font-bold text-sky-400">{mathMessage}</h3>



                  <button className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold cursor-pointer" onClick={newMathQuestion}>🔄 Next</button>



                </>



              )}



            </div>



          )}







          {selectedGame.id === 7 && (



            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-xl">



              <h2 className="text-xl font-bold mb-3">🪙 Coin Flip</h2>



              <div className="flex gap-4 justify-center mt-4">



                <button className="px-6 py-2 bg-amber-500 hover:bg-amber-600 font-bold rounded-xl cursor-pointer" onClick={() => flipCoin("Heads")}>Heads</button>



                <button className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 font-bold rounded-xl cursor-pointer" onClick={() => flipCoin("Tails")}>Tails</button>



              </div>



              <h3 className="mt-4 font-bold text-sky-400">{coinResult}</h3>



            </div>



          )}







          {selectedGame.id === 8 && (



            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-xl">



              <h2 className="text-xl font-bold mb-2">🎲 Dice Roll</h2>



              <div className="text-6xl my-4">{diceVal}</div>



              <button className="px-6 py-2 bg-sky-500 hover:bg-sky-600 font-bold rounded-xl cursor-pointer" onClick={rollDice}>Roll Dice</button>



              <h3 className="mt-3 font-bold text-sky-400">{diceMessage}</h3>



            </div>



          )}







          {selectedGame.id === 9 && (



            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-xl">



              <h2 className="text-xl font-bold mb-2">🎰 Slot Machine</h2>



              <div className="text-4xl tracking-widest my-4">{slots.join(" ")}</div>



              <button className="px-6 py-2 bg-sky-500 hover:bg-sky-600 font-bold rounded-xl cursor-pointer" onClick={spinSlot}>Spin Wheel</button>



              <h3 className="mt-3 font-bold text-sky-400">{slotMessage}</h3>



            </div>



          )}







          {selectedGame.id === 10 && (



            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-xl">



              <h2 className="text-xl font-bold mb-3">🔤 Word Scramble</h2>



              <h3 className="text-lg font-bold text-amber-400 mb-3">Scrambled: {wordList[wordIdx].scrambled}</h3>



              <input type="text" value={wordInput} onChange={(e) => setWordInput(e.target.value)} placeholder="Type word" className="bg-slate-950 border border-slate-700 px-4 py-2 rounded-xl text-center text-white uppercase outline-none" />



              <br />



              <button className="mt-4 px-6 py-2 bg-sky-500 hover:bg-sky-600 font-bold rounded-xl cursor-pointer" onClick={checkWord}>Submit</button>



              <h3 className="mt-3 font-bold text-sky-400">{wordMessage}</h3>



            </div>



          )}







          {selectedGame.id === 11 && (



            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-xl">



              <h2 className="text-xl font-bold mb-3">🎴 High or Low</h2>



              <h3 className="text-lg font-bold text-sky-400 mb-4">Current Card: {cardCurrent}</h3>



              <div className="flex gap-4 justify-center">



                <button className="px-6 py-2 bg-green-500 hover:bg-green-600 font-bold rounded-xl cursor-pointer" onClick={() => guessHighLow(true)}>Higher ⬆️</button>



                <button className="px-6 py-2 bg-rose-500 hover:bg-rose-600 font-bold rounded-xl cursor-pointer" onClick={() => guessHighLow(false)}>Lower ⬇️</button>



              </div>



              <h3 className="mt-4 font-bold text-sky-300">{cardMessage}</h3>



            </div>



          )}







          {selectedGame.id === 12 && (



            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-xl">



              <h2 className="text-xl font-bold mb-3">🔲 Tic Tac Toe</h2>



              <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">



                {tttBoard.map((val, i) => (



                  <button key={i} onClick={() => handleTttClick(i)} className="h-16 bg-slate-800 hover:bg-slate-700 text-xl font-bold rounded-xl cursor-pointer">{val}</button>



                ))}



              </div>



              <h3 className="mt-3 font-bold text-sky-400">{tttMsg}</h3>



              {tttMsg && <button className="mt-3 px-4 py-2 bg-slate-800 rounded-xl font-bold cursor-pointer" onClick={() => selectGame(selectedGame)}>Restart</button>}



            </div>



          )}







          {selectedGame.id === 13 && (



            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center shadow-xl">



              <h2 className="text-xl font-bold mb-2">🎨 Color Matcher</h2>



              <p className="text-slate-400 text-sm mb-3">Click the button matching the TEXT COLOR below:</p>



              <h1 className="text-4xl font-extrabold mb-4" style={{ color: targetColor.color }}>{targetColor.text}</h1>



              <div className="flex gap-2 justify-center flex-wrap">



                {colorCodes.map((code) => (



                  <button key={code} onClick={() => checkColor(code)} className="px-4 py-2 font-bold rounded-xl cursor-pointer capitalize text-white shadow-md" style={{ background: code === "gold" ? "#eab308" : code }}>{code}</button>



                ))}



              </div>



              <h3 className="mt-4 font-bold text-sky-400">{colorMsg}</h3>



              <button className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold cursor-pointer" onClick={startColorGame}>Next Round</button>



            </div>



          )}



        </div>



      ) : (



        /* GAMES GRID HUB */



        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">



          {games.map((game) => (



            <div



              key={game.id}



              onClick={() => selectGame(game)}



              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-5 rounded-2xl cursor-pointer transition-all transform hover:-translate-y-1 shadow-lg flex items-center gap-4"



            >



              <div className="text-4xl">{game.icon}</div>



              <div>



                <h3 className="font-bold text-white text-base">{game.title}</h3>



                <p className="text-slate-400 text-xs mt-1">{game.description}</p>



              </div>



            </div>



          ))}



        </div>



      )}



    </main>



  );



}







export default Earn;