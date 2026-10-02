import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

import Earn from "./Earn";
import { useLanguage } from "./LanguageContext";

const SOCKET_URL = "https://my-react-backend-production-84e7.up.railway.app";
const arenaSocket = io(SOCKET_URL, { transports: ["websocket", "polling"], autoConnect: true });

/* =========================================================
   SECURE RANDOM HELPERS
========================================================= */

function secureRandomUint32() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0];
  }

  // Very old-browser fallback only.
  return Math.floor(Math.random() * 0xffffffff);
}

function secureRandomInt(min, max) {
  if (max < min) {
    throw new Error("Invalid random range");
  }

  return (
    min +
    (secureRandomUint32() % (max - min + 1))
  );
}

function secureRandomFloat(min, max) {
  const value =
    secureRandomUint32() / 0xffffffff;

  return min + value * (max - min);
}

function secureRandomChoice(array) {
  if (!array.length) return null;

  return array[
    secureRandomInt(0, array.length - 1)
  ];
}

/* =========================================================
   GENERAL HELPERS
========================================================= */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/* =========================================================
   LIGHTWEIGHT GAME SOUND ENGINE (no external audio files)
========================================================= */
let GAME_AUDIO_CTX = null;
let GAME_AUDIO_LAST = {};
function gameSound(type, volume = 0.12) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!GAME_AUDIO_CTX) GAME_AUDIO_CTX = new AudioCtx();
    const ctx = GAME_AUDIO_CTX;
    if (ctx.state === "suspended") ctx.resume();
    const nowMs = performance.now();
    const throttle = type === "pool-hit" || type === "pool-rail" ? 45 : 0;
    if (throttle && nowMs - (GAME_AUDIO_LAST[type] || 0) < throttle) return;
    GAME_AUDIO_LAST[type] = nowMs;
    const presets = {
      click:[520,0.035,"sine"], dice:[155,0.07,"square"], step:[330,0.035,"triangle"],
      capture:[190,0.12,"sawtooth"], win:[740,0.20,"triangle"], shoot:[105,0.08,"triangle"],
      "pool-hit":[245,0.035,"sine"], "pool-rail":[145,0.035,"triangle"], pocket:[92,0.13,"sine"], foul:[125,0.16,"sawtooth"]
    };
    const [freq,duration,wave] = presets[type] || presets.click;
    const osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type=wave; osc.frequency.setValueAtTime(freq,ctx.currentTime);
    if(type==='win') osc.frequency.exponentialRampToValueAtTime(1180,ctx.currentTime+duration);
    gain.gain.setValueAtTime(0.0001,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001,volume),ctx.currentTime+0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+duration);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+duration+0.02);
  } catch {}
}

/* =========================================================
   MATCH EXIT CONFIRMATION
========================================================= */

function ExitConfirmModal({
  onCancel,
  onConfirm,
}) {
  return (
    <div className="match-exit-overlay">
      <div className="match-exit-modal">
        <div className="match-exit-icon">⚠️</div>
        <div className="match-exit-kicker">
          MATCH IN PROGRESS
        </div>
        <h2>Do you want to exit?</h2>
        <p>
          Agar khelne ke dauran tum ne exit kiya to tumhari bet lose hogi.
          Bet ke coins match start par cut ho chuke hain; exit par dobara cut nahi honge.
        </p>
        <div className="match-exit-actions">
          <button
            type="button"
            className="match-stay-btn"
            onClick={onCancel}
          >
            Continue Game
          </button>
          <button
            type="button"
            className="match-exit-confirm-btn"
            onClick={onConfirm}
          >
            Exit Game
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   LUDO CONSTANTS
========================================================= */

const LUDO_TRACK = [
  [6, 1],
  [6, 2],
  [6, 3],
  [6, 4],
  [6, 5],

  [5, 6],
  [4, 6],
  [3, 6],
  [2, 6],
  [1, 6],
  [0, 6],

  [0, 7],
  [0, 8],

  [1, 8],
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8],

  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12],
  [6, 13],
  [6, 14],

  [7, 14],
  [8, 14],

  [8, 13],
  [8, 12],
  [8, 11],
  [8, 10],
  [8, 9],

  [9, 8],
  [10, 8],
  [11, 8],
  [12, 8],
  [13, 8],
  [14, 8],

  [14, 7],
  [14, 6],

  [13, 6],
  [12, 6],
  [11, 6],
  [10, 6],
  [9, 6],

  [8, 5],
  [8, 4],
  [8, 3],
  [8, 2],
  [8, 1],
  [8, 0],

  [7, 0],
  [6, 0],
];

const LUDO_SAFE = new Set([
  0,
  8,
  13,
  21,
  26,
  34,
  39,
  47,
]);

const LUDO_PLAYERS = [
  {color:'#f5dc29', name:'You', start:0, home:[2,2], lane:[[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]]},
  {color:'#35bc43', name:'Computer 1', start:13, home:[2,10], lane:[[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]]},
  {color:'#f74448', name:'Computer 2', start:26, home:[10,10], lane:[[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]]},
  {color:'#4e87e8', name:'Computer 3', start:39, home:[10,2], lane:[[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]]},
];
function PlayerAvatar({user, name, color, active=false}) {
  const [failed,setFailed]=useState(false);
  const src=user?.profilePic || user?.profilePicture || user?.avatar_url || user?.photoURL || user?.picture || user?.photo || user?.avatarUrl || user?.profileImage || user?.avatar;
  return <div className={`player-avatar ${active?'is-active':''}`} style={{'--player-color':color}}>
    {src && !failed ? <img src={src} alt={name} onError={()=>setFailed(true)}/> : user ? <span>{(name||'P').slice(0,1).toUpperCase()}</span> : <svg viewBox="0 0 80 80" role="img" aria-label="Computer avatar"><path d="M39 12v11" stroke="#9ddfff" strokeWidth="4"/><circle cx="39" cy="11" r="5" fill="var(--player-color)"/><rect x="17" y="25" width="46" height="39" rx="13" fill="#b6cadd" stroke="#4f708c" strokeWidth="3"/><rect x="23" y="33" width="34" height="17" rx="6" fill="#182d43"/><circle cx="31" cy="41" r="4" fill="var(--player-color)"/><circle cx="49" cy="41" r="4" fill="var(--player-color)"/><path d="M31 56h18" stroke="#476580" strokeWidth="3" strokeLinecap="round"/><rect x="10" y="37" width="7" height="16" rx="3" fill="#6386a3"/><rect x="63" y="37" width="7" height="16" rx="3" fill="#6386a3"/></svg>}
  </div>;
}
function DiceFace({value}) {
  const dots = {1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}[value] || [4];
  return <svg viewBox="0 0 60 60" width="100%" height="100%" aria-hidden="true">{dots.map(i=><circle key={i} cx={13+(i%3)*17} cy={13+Math.floor(i/3)*17} r="5" fill="#18232d"/>)}</svg>;
}
function EntryLoader({title}) {
  const [visible,setVisible]=useState(true);
  useEffect(()=>{const id=setTimeout(()=>setVisible(false),650);return()=>clearTimeout(id);},[]);
  return visible ? <div className="game-entry" role="status"><div className="entry-spinner"/><h2>{title}</h2><p>Preparing your table…</p></div> : null;
}
function LudoGame({onFinish,onBack,betAmount,user,opponentCount=3,lang="en"}) {
  const gt=(key)=>arenaText(lang,key);
  const activePlayers=opponentCount===1?[0,2]:opponentCount===2?[0,1,2]:[0,1,2,3];
  const [pieces,setPieces]=useState(()=>Array.from({length:4},()=>[-1,-1,-1,-1]));
  const [turn,setTurn]=useState(0), [dice,setDice]=useState(null), [rolling,setRolling]=useState(false);
  const [lastDice,setLastDice]=useState([1,1,1,1]);
  const [exitRequested,setExitRequested]=useState(false), [winner,setWinner]=useState(null);
  const [message,setMessage]=useState(gt('rollBegin'));
  const [moving,setMoving]=useState(false);
  const [turnSeconds,setTurnSeconds]=useState(40);
  const timers=useRef(new Set()), busy=useRef(false), state=useRef(null), paid=useRef(false);
  state.current={pieces,turn,dice,winner,rolling,moving,turnSeconds};
  const later=(fn,ms)=>{const id=setTimeout(()=>{timers.current.delete(id);fn();},ms);timers.current.add(id);};
  useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
  const legal=(p,d)=>p===-1 ? d===6 : p<57 && p+d<=57;
  const pos=(player,p,i)=>p<0 ? [LUDO_PLAYERS[player].home[0]+Math.floor(i/2)*2,LUDO_PLAYERS[player].home[1]+(i%2)*2] : p<=51 ? LUDO_TRACK[(LUDO_PLAYERS[player].start+p)%52] : LUDO_PLAYERS[player].lane[p-52];
  const advance=(extra)=>{setDice(null);busy.current=false;setRolling(false);setMoving(false);if(!extra)setTurn(t=>activePlayers[(activePlayers.indexOf(t)+1)%activePlayers.length]);};
  const randomLegalToken=(player,d)=>{
    const current=state.current;
    if(!current || !d)return null;
    const choices=current.pieces[player]
      .map((p,i)=>legal(p,d)?i:null)
      .filter(i=>i!==null);
    return choices.length ? secureRandomChoice(choices) : null;
  };
  const move=(i)=>{
    const st=state.current;
    if(busy.current || st.winner!==null || !st.dice || !legal(st.pieces[st.turn][i],st.dice))return;
    busy.current=true;setMoving(true);gameSound("click",.07);
    const player=st.turn, roll=st.dice, from=st.pieces[player][i], target=from<0?0:from+roll;
    let step=from;
    const tick=()=>{
      step=step<0?0:step+1;
      gameSound("step",.045);
      setPieces(prev=>prev.map((row,p)=>row.map((v,j)=>p===player&&j===i?step:v)));
      if(step<target){later(tick,28);return;}
      let captured=false;
      let next=st.pieces.map(row=>row.slice());next[player][i]=target;
      if(target<=51){const square=(LUDO_PLAYERS[player].start+target)%52;
        if(!LUDO_SAFE.has(square))next=next.map((row,p)=>p===player||!activePlayers.includes(p)?row:row.map(v=>v>=0&&v<=51&&(LUDO_PLAYERS[p].start+v)%52===square?(captured=true,-1):v));
      }
      setPieces(next);
      if(next[player].every(v=>v===57)){
        setWinner(player);setMessage(player===0?'You won!':'Computer won.');gameSound('win',.16);busy.current=false;setMoving(false);
        if(!paid.current){paid.current=true;later(()=>onFinish({winner:player===0?'user':'ai',betAmount,game:'ludo',prizeMultiplier:activePlayers.length}),1600);}return;
      }
      if(captured)gameSound('capture',.12);
       setMessage(captured?'Token captured!':target===57?'Token finished!':'Choose your next move.');
      advance(roll===6||captured||target===57);
    };tick();
  };
  const roll=()=>{
    const st=state.current;if(busy.current||st.dice||st.winner!==null)return;
    busy.current=true;setRolling(true);gameSound("dice",.08);let count=0;
    const animate=()=>{setLastDice(prev=>prev.map((v,p)=>p===st.turn?secureRandomInt(1,6):v));
      if(++count<8){later(animate,55);return;}
      const d=secureRandomInt(1,6);setLastDice(prev=>prev.map((v,p)=>p===st.turn?d:v));setDice(d);setRolling(false);busy.current=false;
      if(!st.pieces[st.turn].some(p=>legal(p,d))){setMessage(gt('noMove'));later(()=>advance(d===6),400);}else setMessage(st.turn===0?gt('selectToken'):gt('computerChoosing'));
    };animate();
  };
  useEffect(()=>{
    if(turn===0||winner!==null||rolling||moving)return;
    if(dice===null){const id=setTimeout(roll,45);return()=>clearTimeout(id);}
    const id=setTimeout(()=>{
      const choices=pieces[turn].map((p,i)=>({p,i})).filter(({p})=>legal(p,dice));
      const scored=choices.map(({p,i})=>{const n=p<0?0:p+dice;let score=n===57?10000:n>=52?500+n:n;
        if(n<=51){const abs=(LUDO_PLAYERS[turn].start+n)%52;
          if(LUDO_SAFE.has(abs))score+=420;
          pieces.forEach((row,other)=>{if(other===turn||!activePlayers.includes(other))return;row.forEach(v=>{if(v<0||v>51)return;const enemy=(LUDO_PLAYERS[other].start+v)%52;
            if(abs===enemy&&!LUDO_SAFE.has(abs))score+=5000;
            const behind=(abs-enemy+52)%52;if(behind>0&&behind<=6&&!LUDO_SAFE.has(abs))score-=900;
          });});
        }
        if(p<0)score+=dice===6?650:0; if(n>=45)score+=700; return {i,score};
      }).sort((a,b)=>b.score-a.score);
      if(scored.length)move(scored[0].i);
    },45);return()=>clearTimeout(id);
  },[turn,dice,rolling,moving,winner,pieces]);
  useEffect(()=>{
    if(winner!==null)return;
    setTurnSeconds(40);
    const id=setInterval(()=>setTurnSeconds(sec=>{
      if(sec<=1){
        clearInterval(id);
        if(turn===0 && !rolling && !moving){
          const st=state.current;

          // Dice already rolled: use that exact number and automatically
          // move one random legal token if the player did not click in time.
          if(st?.dice){
            const autoIndex=randomLegalToken(0,st.dice);
            if(autoIndex!==null){
              setMessage(gt('timeMove'));
              later(()=>move(autoIndex),0);
              return 0;
            }
          }

          // No dice / no legal move means the human turn expires.
          setMessage(gt('timeSkip'));
          setDice(null);busy.current=false;setRolling(false);setMoving(false);
          setTurn(t=>activePlayers[(activePlayers.indexOf(t)+1)%activePlayers.length]);
        }
        return 0;
      }
      return sec-1;
    }),1000);
    return()=>clearInterval(id);
  },[turn,winner]);
  const panel=(p)=> !activePlayers.includes(p) ? <div key={p} className="ludo-player inactive-player" style={{'--player-color':LUDO_PLAYERS[p].color}}><span className="inactive-dot"/><div className="player-name">{gt("emptySeat")}<small>{gt("notMatch")}</small></div></div> : <div key={p} className={`ludo-player ludo-player-${p} ${turn===p?'current-player':''}`} style={{'--player-color':LUDO_PLAYERS[p].color}}>
    <div className="timed-avatar"><PlayerAvatar user={p===0?user:null} name={p===0?(user?.name||'You'):LUDO_PLAYERS[p].name} color={LUDO_PLAYERS[p].color} active={turn===p}/>{turn===p&&<span className={`turn-clock ${turnSeconds<=10?'danger':''}`}>{turnSeconds}s</span>}</div>
    <div className="player-name">{p===0?(user?.name||'You'):LUDO_PLAYERS[p].name}<small>{pieces[p].filter(v=>v===57).length}/4 home</small></div>
    <button className={`corner-dice ${turn===p&&rolling?'dice-rolling':''}`} disabled={p!==0||turn!==0||rolling||moving||dice!==null||winner!==null} onClick={roll} aria-label="Roll dice"><DiceFace value={lastDice[p]}/></button>
  </div>;
  return <div className="arena-game-page professional-ludo">
    <style>{ARENA_STYLES+GAME_POLISH+POOL_PRO_STYLES}</style><style>{`
.timed-avatar{position:relative;display:inline-flex;align-items:center;justify-content:center}.turn-clock{position:absolute;right:-12px;top:-10px;min-width:38px;height:24px;padding:0 6px;border-radius:999px;background:#101827;color:#fff;border:2px solid #38bdf8;font:900 12px/20px system-ui;text-align:center;box-shadow:0 3px 12px #0008;z-index:20}.turn-clock.danger{border-color:#ef4444;animation:timerPulse .55s infinite alternate}@keyframes timerPulse{to{transform:scale(1.12)}}
`}</style><EntryLoader title="Ludo"/>
    <header className="arena-game-header"><button className="arena-back-btn" onClick={()=>setExitRequested(true)}>← Exit Game</button><strong className="arena-game-title">Ludo</strong><span className="arena-bet-badge">🪙 {betAmount}</span></header>
    <div className="ludo-stage"><div className="ludo-player-row">{panel(0)}{panel(1)}</div>
    <div className="ludo-board-shell"><div className="ludo-board">
      {Array.from({length:225},(_,i)=>{const r=Math.floor(i/15),c=i%15;let color='#fff';
        if(r<6&&c<6)color=LUDO_PLAYERS[0].color;if(r<6&&c>8)color=LUDO_PLAYERS[1].color;
        if(r>8&&c>8)color=LUDO_PLAYERS[2].color;if(r>8&&c<6)color=LUDO_PLAYERS[3].color;
        LUDO_PLAYERS.forEach(p=>{if(p.lane.some(([a,b])=>a===r&&b===c)||LUDO_TRACK[p.start].every((v,j)=>v===[r,c][j]))color=p.color;});
        const index=LUDO_TRACK.findIndex(([a,b])=>a===r&&b===c);
        return <div key={i} className="ludo-cell" style={{gridRow:r+1,gridColumn:c+1,background:color,border:(r<6||r>8)&&(c<6||c>8)?"none":undefined}}>{LUDO_SAFE.has(index)&&<span className="safe-star">★</span>}</div>;
      })}
      {LUDO_PLAYERS.map((p,i)=><div key={'base'+i} className="home-inset" style={{gridRow:`${i<2?2:11} / span 4`,gridColumn:`${i===0||i===3?2:11} / span 4`}}/>)}
      <div className="center-triangles"/>
      {pieces.map((row,p)=>activePlayers.includes(p)&&row.map((v,i)=>{
        const [r,c]=pos(p,v,i);
        const can=p===0&&turn===0&&dice!==null&&legal(v,dice)&&!rolling&&!moving;

        // Build the stack from ALL players on this exact board cell.
        const occupants=[];
        pieces.forEach((otherRow,otherP)=>{
          if(!activePlayers.includes(otherP))return;
          otherRow.forEach((otherV,otherI)=>{
            const [or,oc]=pos(otherP,otherV,otherI);
            if(or===r&&oc===c)occupants.push({p:otherP,i:otherI});
          });
        });

        // A legal human token is always rendered above opponent tokens,
        // so it remains clickable even when several tokens share the cell.
        occupants.sort((a,b)=>{
          const av=pieces[a.p][a.i], bv=pieces[b.p][b.i];
          const aClickable=a.p===0&&turn===0&&dice!==null&&legal(av,dice)&&!rolling&&!moving;
          const bClickable=b.p===0&&turn===0&&dice!==null&&legal(bv,dice)&&!rolling&&!moving;
          if(aClickable!==bClickable)return aClickable?1:-1;
          return a.p-b.p || a.i-b.i;
        });

        const stack=Math.max(0,occupants.findIndex(o=>o.p===p&&o.i===i));
        const offsets=[[0,0],[-8,-8],[8,-8],[-8,8],[8,8],[-12,0],[12,0],[0,-12],[0,12]];
        const [ox,oy]=offsets[Math.min(stack,offsets.length-1)];

        return <button
          key={`${p}-${i}`}
          className={`ludo-token ${can?'legal-token':''}`}
          style={{
            gridRow:r+1,
            gridColumn:c+1,
            background:LUDO_PLAYERS[p].color,
            transform:`translate(${ox}px,${oy}px)`,
            zIndex:can?80:20+stack,
            pointerEvents:can?'auto':'none'
          }}
          disabled={!can}
          onClick={()=>move(i)}
          aria-label={`Player ${p+1} token ${i+1}`}
        >★</button>;
      }))}
    </div></div><div className="ludo-player-row">{panel(3)}{panel(2)}</div>
    <div className="ludo-live-status" aria-live="polite">{message}</div></div>
    {exitRequested&&<ExitConfirmModal onCancel={()=>setExitRequested(false)} onConfirm={onBack}/>}
  </div>;
}

/* =========================================================
   POOL CONSTANTS
========================================================= */

const POOL_WIDTH = 900;
const POOL_HEIGHT = 500;

const POOL_RAIL = 42;
const BALL_RADIUS = 11;
const POCKET_RADIUS = 29;

const POOL_POCKETS = [
  [POOL_RAIL, POOL_RAIL],
  [POOL_WIDTH / 2, 40],
  [POOL_WIDTH - POOL_RAIL, POOL_RAIL],

  [POOL_RAIL, POOL_HEIGHT - POOL_RAIL],
  [
    POOL_WIDTH / 2,
    POOL_HEIGHT - 40,
  ],
  [
    POOL_WIDTH - POOL_RAIL,
    POOL_HEIGHT - POOL_RAIL,
  ],
];

/* =========================================================
   POOL BALL CREATOR
========================================================= */

function createPoolBalls() {
  const balls = [];

  balls.push({
    id: 0,
    number: 0,
    type: "cue",
    x: 240,
    y: 250,
    vx: 0,
    vy: 0,
    pocketed: false,
  });

  let rackIndex=0;
  const rackOrder=[1,9,2,10,8,3,11,4,12,5,6,13,7,14,15];

  const rackX = 650;
  const rackY = 250;

  for (let row = 0; row < 5; row++) {
    for (
      let position = 0;
      position <= row;
      position++
    ) {
      const x =
        rackX +
        row *
          BALL_RADIUS *
          1.76;

      const y =
        rackY +
        (position - row / 2) *
          BALL_RADIUS *
          2.05;

      const number=rackOrder[rackIndex++];
      let type;

      if (number === 8) {
        type = "eight";
      } else if (number <= 7) {
        type = "solid";
      } else {
        type = "stripe";
      }

      balls.push({
        id: number,
        number,
        type,
        x,
        y,
        vx: 0,
        vy: 0,
        pocketed: false,
      });


    }
  }

  return balls;
}

/* =========================================================
   POOL HELPERS
========================================================= */

function isObjectBall(ball) {
  return (
    ball &&
    ball.type !== "cue"
  );
}

function getBallGroup(ball) {
  if (!ball) return null;

  if (ball.type === "solid") {
    return "solids";
  }

  if (ball.type === "stripe") {
    return "stripes";
  }

  return null;
}

function countRemainingGroup(
  balls,
  group
) {
  return balls.filter(
    (ball) =>
      !ball.pocketed &&
      getBallGroup(ball) === group
  ).length;
}

/* =========================================================
   POOL GAME
========================================================= */

function PoolGame({
  user,
  lang="en",
  onFinish,
  onBack,
  betAmount,
}) {
  const gt=(key)=>arenaText(lang,key);
  const canvasRef = useRef(null);

  const ballsRef = useRef(
    createPoolBalls()
  );

  const animationRef = useRef(null);
  const renderFrameRef = useRef(null);
  const physicsClockRef = useRef({last:0,accumulator:0});
  const cueAngleRef=useRef(0);
  const dragRef=useRef(null);
  const [shotActive,setShotActive]=useState(false);
  const [helpOpen,setHelpOpen]=useState(false);
  const [pocketedNumbers,setPocketedNumbers]=useState([]);

  const movingRef = useRef(false);
  const aimingRef = useRef(false);

  const turnRef = useRef("user");

  const winnerRef = useRef(null);

  const groupsRef = useRef({
    user: null,
    ai: null,
  });

  const shotRef = useRef({
    firstHit: null,
    pocketed: [],
    cuePocketed: false,
  });

  const ballInHandRef =
    useRef(false);

  const aimPointRef = useRef({
    x: 150,
    y: 250,
  });

  const mousePointRef = useRef({
    x: 150,
    y: 250,
  });

  const powerRef = useRef(50);

  const aiTimerRef = useRef(null);
  const aiShotRef = useRef(null);
  const aiThinkingRef = useRef({active:false,angle:0,power:55,raf:null});
  const aliveRef = useRef(true);
  useEffect(() => { aliveRef.current=true; return () => {aliveRef.current=false; if(aiThinkingRef.current.raf) cancelAnimationFrame(aiThinkingRef.current.raf); aiThinkingRef.current.active=false;}; }, []);

  const shotFinishedRef =
    useRef(false);

  const [turn, setTurn] = useState(
    "user"
  );

  const [groups, setGroups] = useState({
    user: null,
    ai: null,
  });

  const [power, setPower] =
    useState(50);
  const [cueControllerPulling,setCueControllerPulling]=useState(false);
  const [aiVisualPower,setAiVisualPower]=useState(38);
  const cueControllerRef=useRef(null);

  const [ballInHand, setBallInHand] =
    useState(false);

  const [winner, setWinner] =
    useState(null);
  const [exitRequested, setExitRequested] = useState(false);

  const [message, setMessage] =
    useState(
      gt("poolBreak")
    );

  const [shotNumber, setShotNumber] =
    useState(1);

  const [turnSeconds,setTurnSeconds]=useState(40);

  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  useEffect(() => {
    powerRef.current = power;
  }, [power]);

  useEffect(() => {
    ballInHandRef.current =
      ballInHand;
  }, [ballInHand]);

  useEffect(() => {
    winnerRef.current =
      winner;
  }, [winner]);

  useEffect(()=>{
    if(winner || shotActive)return;
    setTurnSeconds(40);
    const id=setInterval(()=>setTurnSeconds(sec=>{
      if(sec<=1){
        clearInterval(id);
        if(turnRef.current==='user' && !movingRef.current){
          turnRef.current='ai';
          setTurn('ai');
          setMessage('⏱️ 40 seconds over — computer gets the turn.');
          aiTimerRef.current=setTimeout(()=>aiShotRef.current?.(),60);
        } else if(turnRef.current==='ai' && !movingRef.current){
          aiTimerRef.current=setTimeout(()=>aiShotRef.current?.(),20);
        }
        return 0;
      }
      return sec-1;
    }),1000);
    return()=>clearInterval(id);
  },[turn,shotNumber,winner,shotActive]);

  /* =====================================================
     CANVAS RENDER
  ===================================================== */

  useEffect(() => {
    const canvas=canvasRef.current;
    if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const table=createPoolSurface();
    let backingScale=1;
    const resize=()=>{
      const width=canvas.getBoundingClientRect().width || POOL_WIDTH;
      backingScale=Math.min(3,Math.max(1,width/POOL_WIDTH*(window.devicePixelRatio||1)));
      canvas.width=Math.round(POOL_WIDTH*backingScale);
      canvas.height=Math.round(POOL_HEIGHT*backingScale);
    };
    resize();
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;
    observer?.observe(canvas);
    window.addEventListener('resize',resize);
    const draw=()=>{
      if(!aliveRef.current)return;
      ctx.setTransform(backingScale,0,0,backingScale,0,0);
      ctx.clearRect(0,0,POOL_WIDTH,POOL_HEIGHT);
      ctx.drawImage(table,0,0,POOL_WIDTH,POOL_HEIGHT);
      const balls=ballsRef.current;
      const cue=balls.find(b=>b.type==='cue'&&!b.pocketed);
      if(cue&&!movingRef.current&&!winnerRef.current&&!ballInHandRef.current){
        if(turnRef.current==='user'){
          drawPoolAim(ctx,cue,balls,cueAngleRef.current,aimingRef.current,powerRef.current);
        } else if(turnRef.current==='ai'&&aiThinkingRef.current.active){
          // Show the computer's cue exactly like the human cue while it thinks.
          // The AI-selected angle is still calculated by the existing target/pocket logic.
          drawPoolAim(
            ctx,
            cue,
            balls,
            aiThinkingRef.current.angle,
            true,
            aiThinkingRef.current.power
          );
        }
      }
      balls.forEach(ball=>{if(!ball.pocketed)drawPoolBall(ctx,ball);});
      if(cue&&ballInHandRef.current&&turnRef.current==='user'){
        ctx.save();ctx.globalAlpha=.55;drawPoolBall(ctx,{...cue,x:mousePointRef.current.x,y:mousePointRef.current.y});ctx.restore();
      }
      renderFrameRef.current=requestAnimationFrame(draw);
    };
    draw();
    return()=>{observer?.disconnect();window.removeEventListener('resize',resize);cancelAnimationFrame(renderFrameRef.current);};
  }, []);

  /* =====================================================
     PLACE CUE BALL
  ===================================================== */

  const placeCueBall = useCallback(
    (x, y) => {
      const cue =
        ballsRef.current.find(
          (ball) =>
            ball.type === "cue"
        );

      if (!cue) return;

      const safeX = clamp(
        x,
        POOL_RAIL +
          BALL_RADIUS,
        POOL_WIDTH -
          POOL_RAIL -
          BALL_RADIUS
      );

      const safeY = clamp(
        y,
        POOL_RAIL +
          BALL_RADIUS,
        POOL_HEIGHT -
          POOL_RAIL -
          BALL_RADIUS
      );

      const collision =
        ballsRef.current.some(
          (ball) => {
            if (
              ball === cue ||
              ball.pocketed
            ) {
              return false;
            }

            const dx =
              ball.x - safeX;

            const dy =
              ball.y - safeY;

            return (
              Math.hypot(
                dx,
                dy
              ) <
              BALL_RADIUS * 2.1
            );
          }
        );

      if (collision) return;

      cue.x = safeX;
      cue.y = safeY;
      cue.vx = 0;
      cue.vy = 0;
      cue.pocketed = false;

      ballInHandRef.current =
        false;

      setBallInHand(false);

      setMessage(
        "Cue ball placed. Aim and shoot."
      );
    },
    []
  );

  /* =====================================================
     PHYSICS
  ===================================================== */

  const finishShot = useCallback(
    () => {
      if (
        shotFinishedRef.current
      ) {
        return;
      }

      shotFinishedRef.current =
        true;

      movingRef.current = false;
      setShotActive(false);
      setPocketedNumbers(ballsRef.current.filter(b=>b.pocketed&&b.type!=="cue").map(b=>b.number));

      const shot =
        shotRef.current;

      const currentBalls =
        ballsRef.current;

      const player =
        turnRef.current;

      const opponent =
        player === "user"
          ? "ai"
          : "user";

      const pocketed =
        [...shot.pocketed];

      const cueFoul =
        shot.cuePocketed;

      const firstHit =
        shot.firstHit;

      /* ==============================================
         8 BALL RESULT
      ============================================== */

      if (
        pocketed.includes(8)
      ) {
        const group =
          groupsRef.current[
            player
          ];

        const remaining =
          group
            ? countRemainingGroup(
                currentBalls,
                group
              )
            : 0;

        if (
          !group ||
          remaining > 0 ||
          cueFoul
        ) {
          winnerRef.current =
            opponent;

          setWinner(opponent);
          gameSound("foul",.14);

          setMessage(
            opponent === "user"
              ? "🏆 8-ball foul — you win!"
              : "🤖 8-ball foul — computer wins."
          );

          setTimeout(() => {
            if (!aliveRef.current) return;
            onFinish({
              winner: opponent,
              betAmount,
              game: "pool",
            });
          }, 1200);

          return;
        }

        winnerRef.current =
          player;

        setWinner(player);
        gameSound("win",.16);

        setMessage(
          player === "user"
            ? "🏆 Perfect 8-ball finish! You win."
            : "🤖 Computer cleared the table."
        );

        setTimeout(() => {
          if (!aliveRef.current) return;
          onFinish({
            winner: player,
            betAmount,
            game: "pool",
          });
        }, 1200);

        return;
      }

      /* ==============================================
         GROUP ASSIGNMENT
      ============================================== */

      let updatedGroups = {
        ...groupsRef.current,
      };

      if (
        !updatedGroups[player] &&
        pocketed.some(
          (number) =>
            number >= 1 &&
            number <= 15
        )
      ) {
        const firstObject =
          currentBalls.find(
            (ball) =>
              pocketed.includes(
                ball.number
              ) &&
              ball.type !== "cue" &&
              ball.type !== "eight"
          );

        if (firstObject) {
          const playerGroup =
            getBallGroup(
              firstObject
            );

          const otherGroup =
            playerGroup ===
            "solids"
              ? "stripes"
              : "solids";

          updatedGroups = {
            user:
              player === "user"
                ? playerGroup
                : otherGroup,

            ai:
              player === "ai"
                ? playerGroup
                : otherGroup,
          };

          groupsRef.current =
            updatedGroups;

          setGroups(
            updatedGroups
          );
        }
      }

      /* ==============================================
         FIRST HIT FOUL
      ============================================== */

      const playerGroup =
        updatedGroups[player];

      const legalFirstHit =
        !playerGroup ||
        firstHit === null ||
        getBallGroup(
          currentBalls.find(
            (ball) =>
              ball.number ===
              firstHit
          )
        ) === playerGroup;

      let foul =
        cueFoul ||
        (!legalFirstHit &&
          firstHit !== null);

      if (
        firstHit === null &&
        pocketed.length === 0
      ) {
        foul = true;
      }

      if (foul) {
        ballInHandRef.current =
          true;

        setBallInHand(true);

        turnRef.current =
          opponent;

        setTurn(opponent);

        setMessage(
          opponent === "user"
            ? "⚠️ Foul. Ball-in-hand — place the cue ball."
            : "⚠️ Foul. Computer gets ball-in-hand."
        );

        shotRef.current = {
          firstHit: null,
          pocketed: [],
          cuePocketed: false,
        };

        shotFinishedRef.current =
          false;

        if (
          opponent === "ai"
        ) {
          aiTimerRef.current =
            setTimeout(() => {
              if (aliveRef.current) aiShotRef.current?.();
            }, 60);
        }

        return;
      }

      /* ==============================================
         CONTINUE ONLY IF OWN BALL POCKETED
      ============================================== */

      const ownGroup =
        updatedGroups[player];

      const pocketedOwn =
        ownGroup &&
        pocketed.some((number) => {
          const ball =
            currentBalls.find(
              (item) =>
                item.number ===
                number
            );

          return (
            getBallGroup(ball) ===
            ownGroup
          );
        });

      const nextPlayer =
        pocketedOwn
          ? player
          : opponent;

      turnRef.current =
        nextPlayer;

      setTurn(nextPlayer);

      setShotNumber(
        (value) => value + 1
      );

      shotRef.current = {
        firstHit: null,
        pocketed: [],
        cuePocketed: false,
      };

      shotFinishedRef.current =
        false;

      setMessage(
        nextPlayer === "user"
          ? pocketedOwn
            ? "🎯 Nice shot! Your turn again."
            : "Your turn."
          : pocketedOwn
            ? "🤖 Computer continues..."
            : "🤖 Computer is thinking..."
      );

      if (
        nextPlayer === "ai"
      ) {
        aiTimerRef.current =
          setTimeout(() => {
            if (aliveRef.current) aiShotRef.current?.();
          }, 55);
      }
    },
    [betAmount, onFinish]
  );

  const physicsStep = useCallback(
    (timestamp) => {
      if (!aliveRef.current || !movingRef.current) {
        return;
      }

      const clock=physicsClockRef.current;
      if(!clock.last)clock.last=timestamp-1000/60;
      clock.accumulator+=Math.min(50,Math.max(0,timestamp-clock.last));clock.last=timestamp;
      const steps=Math.min(6,Math.floor(clock.accumulator/(1000/120)));
      clock.accumulator-=steps*(1000/120);
      if(!steps){animationRef.current=requestAnimationFrame(physicsStep);return;}
      const balls =
        ballsRef.current;

      let anyMoving = false;

      for(let substep=0;substep<steps;substep++){
      anyMoving=false;
      /* ==============================================
         MOVE BALLS
      ============================================== */

      balls.forEach((ball) => {
        if (ball.pocketed) return;

        ball.x += ball.vx * .5;
        ball.y += ball.vy * .5;

        ball.vx *= Math.sqrt(0.988);
        ball.vy *= Math.sqrt(0.988);

        if (
          Math.abs(ball.vx) <
          0.03
        ) {
          ball.vx = 0;
        }

        if (
          Math.abs(ball.vy) <
          0.03
        ) {
          ball.vy = 0;
        }

        if (
          Math.abs(ball.vx) >
            0.01 ||
          Math.abs(ball.vy) >
            0.01
        ) {
          anyMoving = true;
        }

        /* Rails */

        if (
          ball.x <
          POOL_RAIL +
            BALL_RADIUS
        ) {
          ball.x =
            POOL_RAIL +
            BALL_RADIUS;

          ball.vx =
            Math.abs(ball.vx) *
            0.92;
        }

        if (
          ball.x >
          POOL_WIDTH -
            POOL_RAIL -
            BALL_RADIUS
        ) {
          ball.x =
            POOL_WIDTH -
            POOL_RAIL -
            BALL_RADIUS;

          ball.vx =
            -Math.abs(ball.vx) *
            0.92;
        }

        if (
          ball.y <
          POOL_RAIL +
            BALL_RADIUS
        ) {
          ball.y =
            POOL_RAIL +
            BALL_RADIUS;

          ball.vy =
            Math.abs(ball.vy) *
            0.92;
        }

        if (
          ball.y >
          POOL_HEIGHT -
            POOL_RAIL -
            BALL_RADIUS
        ) {
          ball.y =
            POOL_HEIGHT -
            POOL_RAIL -
            BALL_RADIUS;

          ball.vy =
            -Math.abs(ball.vy) *
            0.92;
        }
      });

      /* ==============================================
         BALL COLLISIONS
      ============================================== */

      for (
        let i = 0;
        i < balls.length;
        i++
      ) {
        const a = balls[i];

        if (a.pocketed) continue;

        for (
          let j = i + 1;
          j < balls.length;
          j++
        ) {
          const b = balls[j];

          if (b.pocketed) continue;

          const dx =
            b.x - a.x;

          const dy =
            b.y - a.y;

          const distance =
            Math.hypot(
              dx,
              dy
            );

          const minimum =
            BALL_RADIUS * 2;

          if (
            distance === 0 ||
            distance >= minimum
          ) {
            continue;
          }

          const nx =
            dx / distance;

          const ny =
            dy / distance;

          const overlap =
            minimum -
            distance;

          a.x -=
            nx *
            (overlap / 2);

          a.y -=
            ny *
            (overlap / 2);

          b.x +=
            nx *
            (overlap / 2);

          b.y +=
            ny *
            (overlap / 2);

          const relativeVx =
            b.vx - a.vx;

          const relativeVy =
            b.vy - a.vy;

          const velocityAlongNormal =
            relativeVx * nx +
            relativeVy * ny;

          if (
            velocityAlongNormal >
            0
          ) {
            continue;
          }

          /* First hit */

          if (
            shotRef.current
              .firstHit === null
          ) {
            if (
              a.type === "cue" &&
              b.type !== "cue"
            ) {
              shotRef.current.firstHit =
                b.number;
            } else if (
              b.type === "cue" &&
              a.type !== "cue"
            ) {
              shotRef.current.firstHit =
                a.number;
            }
          }

          const restitution =
            0.96;

          const impulse =
            -(
              1 +
              restitution
            ) *
            velocityAlongNormal /
            2;

          a.vx -=
            impulse * nx;

          a.vy -=
            impulse * ny;

          b.vx +=
            impulse * nx;

          b.vy +=
            impulse * ny;

          anyMoving = true;
        }
      }

      /* ==============================================
         POCKET DETECTION
      ============================================== */

      balls.forEach((ball) => {
        if (ball.pocketed)
          return;

        for (
          const [
            pocketX,
            pocketY,
          ] of POOL_POCKETS
        ) {
          const distance =
            Math.hypot(
              ball.x -
                pocketX,
              ball.y -
                pocketY
            );

          if (
            distance <
            POCKET_RADIUS
          ) {
            ball.pocketed = true;
            gameSound("pocket",.11);
            ball.vx = 0;
            ball.vy = 0;

            if (
              ball.type === "cue"
            ) {
              shotRef.current.cuePocketed =
                true;

              /* Respawn after shot */

              ball.x = 240;
              ball.y = 250;
            } else {
              shotRef.current.pocketed.push(
                ball.number
              );
            }

            break;
          }
        }
      });

      }
      if (anyMoving) {
        animationRef.current =
          requestAnimationFrame(
            physicsStep
          );

        return;
      }

      /* Small delay gives pockets
         time to settle visually. */

      setTimeout(() => {
        if (aliveRef.current) finishShot();
      }, 55);
    },
    [finishShot]
  );

  /* =====================================================
     SHOOT
  ===================================================== */

  const shoot = useCallback(
    (angle, strength) => {
      if (
        movingRef.current ||
        winnerRef.current ||
        turnRef.current !==
          "user" ||
        ballInHandRef.current
      ) {
        return;
      }

      const cue =
        ballsRef.current.find(
          (ball) =>
            ball.type === "cue" &&
            !ball.pocketed
        );

      if (!cue) return;

      shotRef.current = {
        firstHit: null,
        pocketed: [],
        cuePocketed: false,
      };

      shotFinishedRef.current =
        false;

      cue.vx =
        Math.cos(angle) *
        strength;

      cue.vy =
        Math.sin(angle) *
        strength;

      gameSound("shoot",.10);
      movingRef.current = true;
      setShotActive(true);
      physicsClockRef.current={last:0,accumulator:0};

      setMessage(
        "🎱 Shot in progress..."
      );

      animationRef.current =
        requestAnimationFrame(
          physicsStep
        );
    },
    [physicsStep]
  );

  /* =====================================================
     AI SHOT
  ===================================================== */

  const aiTakeShot = useCallback(
    () => {
      if (
        winnerRef.current ||
        turnRef.current !== "ai" ||
        movingRef.current ||
        aiThinkingRef.current.active
      ) {
        return;
      }

      const cue = ballsRef.current.find(
        (ball) => ball.type === "cue"
      );

      if (!cue) return;

      /*
        HARD AI:
        Evaluate every target/pocket combination. The AI
        prefers clean direct pots, shorter routes, safer
        angles and accurate cue-ball positioning.
      */

      if (ballInHandRef.current) {
        const openSpots = [
          [220, 250],
          [280, 180],
          [280, 320],
          [180, 180],
          [180, 320],
        ];

        let placement = openSpots[0];

        for (const candidate of openSpots) {
          const blocked =
            ballsRef.current.some(
              (ball) => {
                if (
                  ball.type === "cue" ||
                  ball.pocketed
                ) {
                  return false;
                }

                return (
                  Math.hypot(
                    ball.x - candidate[0],
                    ball.y - candidate[1]
                  ) <
                  BALL_RADIUS * 2.5
                );
              }
            );

          if (!blocked) {
            placement = candidate;
            break;
          }
        }

        cue.x = placement[0];
        cue.y = placement[1];
        cue.vx = 0;
        cue.vy = 0;
        cue.pocketed = false;

        ballInHandRef.current = false;
        setBallInHand(false);
      }

      const aiGroup =
        groupsRef.current.ai;

      let targets =
        ballsRef.current.filter(
          (ball) =>
            !ball.pocketed &&
            isObjectBall(ball)
        );

      if (aiGroup) {
        const ownTargets =
          targets.filter(
            (ball) =>
              getBallGroup(ball) ===
              aiGroup
          );

        if (ownTargets.length) {
          targets = ownTargets;
        } else {
          const eight =
            targets.find(
              (ball) =>
                ball.number === 8
            );

          if (eight) {
            targets = [eight];
          }
        }
      } else {
        const nonEight =
          targets.filter(
            (ball) =>
              ball.number !== 8
          );

        if (nonEight.length) {
          targets = nonEight;
        }
      }

      if (!targets.length) return;

      const candidates = [];

      targets.forEach(
        (target) => {
          POOL_POCKETS.forEach(
            (pocket) => {
              const tx =
                pocket[0] - target.x;
              const ty =
                pocket[1] - target.y;

              const targetPocketDistance =
                Math.hypot(tx, ty);

              if (
                targetPocketDistance < 1
              ) {
                return;
              }

              const nx =
                tx /
                targetPocketDistance;
              const ny =
                ty /
                targetPocketDistance;

              const ghostX =
                target.x -
                nx *
                  BALL_RADIUS *
                  2.02;

              const ghostY =
                target.y -
                ny *
                  BALL_RADIUS *
                  2.02;

              const cueDistance =
                Math.hypot(
                  ghostX - cue.x,
                  ghostY - cue.y
                );

              const shotAngle =
                Math.atan2(
                  ghostY - cue.y,
                  ghostX - cue.x
                );

              const objectAngle =
                Math.atan2(
                  ty,
                  tx
                );

              let cutAngle =
                Math.abs(
                  shotAngle -
                  objectAngle
                );

              while (
                cutAngle > Math.PI
              ) {
                cutAngle -=
                  Math.PI * 2;
              }

              cutAngle =
                Math.abs(cutAngle);

              let blockedPenalty = 0;

              ballsRef.current.forEach(
                (other) => {
                  if (
                    other === cue ||
                    other === target ||
                    other.pocketed
                  ) {
                    return;
                  }

                  const vx =
                    ghostX - cue.x;
                  const vy =
                    ghostY - cue.y;
                  const length =
                    Math.hypot(vx, vy);

                  if (length < 1) return;

                  const px =
                    other.x - cue.x;
                  const py =
                    other.y - cue.y;

                  const projection =
                    (
                      px * vx +
                      py * vy
                    ) / length;

                  if (
                    projection <=
                      BALL_RADIUS ||
                    projection >=
                      length - BALL_RADIUS
                  ) {
                    return;
                  }

                  const closestX =
                    cue.x +
                    (vx / length) *
                      projection;
                  const closestY =
                    cue.y +
                    (vy / length) *
                      projection;

                  const distance =
                    Math.hypot(
                      other.x -
                        closestX,
                      other.y -
                        closestY
                    );

                  if (
                    distance <
                    BALL_RADIUS * 2.2
                  ) {
                    blockedPenalty +=
                      850;
                  }
                }
              );

              const score =
                cueDistance +
                targetPocketDistance * 0.82 +
                cutAngle * 170 +
                blockedPenalty +
                (
                  pocket[0] ===
                    POOL_WIDTH / 2
                    ? 18
                    : 0
                );

              candidates.push({
                target,
                pocket,
                ghostX,
                ghostY,
                score,
              });
            }
          );
        }
      );

      candidates.sort(
        (a, b) =>
          a.score - b.score
      );

      const selected = candidates[0];

      const baseAngle =
        Math.atan2(
          selected.ghostY - cue.y,
          selected.ghostX - cue.x
        );

      const finalAngle = baseAngle;

      const routeDistance =
        Math.hypot(
          selected.ghostX - cue.x,
          selected.ghostY - cue.y
        );

      // Stronger/faster final shot, but the AI visibly thinks and lines up first.
      const strength = clamp(18.4 + routeDistance / 760, 18.4, 19.8);
      const thinkMs = secureRandomInt(7000, 10000);
      const startAt = performance.now();
      const startAngle = finalAngle + secureRandomFloat(-0.95, 0.95);
      aiThinkingRef.current.active = true;
      aiThinkingRef.current.angle = startAngle;
      aiThinkingRef.current.power = 38;
      setAiVisualPower(38);
      setMessage("🤖 Computer is lining up the shot…");

      const animateAim = (now) => {
        if (!aliveRef.current || winnerRef.current || turnRef.current !== "ai") {
          aiThinkingRef.current.active = false;
          return;
        }
        const progress = clamp((now - startAt) / thinkMs, 0, 1);
        const settle = 1 - progress;
        const humanWobble = Math.sin(progress * Math.PI * 9) * 0.10 * settle;
        aiThinkingRef.current.angle = startAngle + (finalAngle - startAngle) * progress + humanWobble;
        aiThinkingRef.current.power = 38 + progress * 58;
        setAiVisualPower(Math.round(aiThinkingRef.current.power));

        if (progress < 1) {
          aiThinkingRef.current.raf = requestAnimationFrame(animateAim);
          return;
        }

        aiThinkingRef.current.active = false;
        shotRef.current = { firstHit: null, pocketed: [], cuePocketed: false };
        shotFinishedRef.current = false;
        cue.vx = Math.cos(finalAngle) * strength;
        cue.vy = Math.sin(finalAngle) * strength;
        gameSound("shoot",.12);
        movingRef.current = true;
        setShotActive(true);
        physicsClockRef.current={last:0,accumulator:0};
        setMessage("🎱 Computer shot in progress…");
        animationRef.current = requestAnimationFrame(physicsStep);
      };

      aiThinkingRef.current.raf = requestAnimationFrame(animateAim);
    },
    [physicsStep]
  );

  /* =====================================================
     POINTER EVENTS
  ===================================================== */

  const getCanvasPoint =
    useCallback((event) => {
      const canvas =
        canvasRef.current;

      const rect =
        canvas.getBoundingClientRect();

      return {
        x:
          ((event.clientX -
            rect.left) /
            rect.width) *
          POOL_WIDTH,

        y:
          ((event.clientY -
            rect.top) /
            rect.height) *
          POOL_HEIGHT,
      };
    }, []);

  aiShotRef.current = aiTakeShot;

  const handlePointerDown=useCallback(event=>{
    if(movingRef.current||winnerRef.current||turnRef.current!=='user')return;
    event.preventDefault();
    const point=getCanvasPoint(event);mousePointRef.current=point;
    if(ballInHandRef.current){placeCueBall(point.x,point.y);return;}
    const cue=ballsRef.current.find(b=>b.type==='cue'&&!b.pocketed);if(!cue)return;
    const nearCue=Math.hypot(point.x-cue.x,point.y-cue.y)<BALL_RADIUS*3;
    dragRef.current={start:point,nearCue,moved:false};
    aimingRef.current=true;
    if(!nearCue)cueAngleRef.current=Math.atan2(point.y-cue.y,point.x-cue.x);
    try{event.currentTarget.setPointerCapture(event.pointerId);}catch{}
  },[getCanvasPoint,placeCueBall]);
  const handlePointerMove=useCallback(event=>{
    const point=getCanvasPoint(event);mousePointRef.current=point;
    if(movingRef.current||turnRef.current!=='user'||ballInHandRef.current)return;
    const cue=ballsRef.current.find(b=>b.type==='cue'&&!b.pocketed);if(!cue)return;
    const drag=dragRef.current;
    if(!drag)return;
    if(drag.nearCue){
      const distance=Math.hypot(point.x-cue.x,point.y-cue.y);
      if(distance>8){drag.moved=true;cueAngleRef.current=Math.atan2(cue.y-point.y,cue.x-point.x);powerRef.current=clamp(Math.round(distance/1.7),5,100);setPower(powerRef.current);}
    }else{cueAngleRef.current=Math.atan2(point.y-cue.y,point.x-cue.x);}
  },[getCanvasPoint]);
  const handlePointerUp=useCallback(event=>{
    const drag=dragRef.current;dragRef.current=null;aimingRef.current=false;
    if(drag?.nearCue&&drag.moved)shoot(cueAngleRef.current,2.4+powerRef.current*.155);
    try{event.currentTarget.releasePointerCapture(event.pointerId);}catch{}
  },[shoot]);
  const updateCueControllerPower=useCallback((event)=>{
    const rail=cueControllerRef.current;
    if(!rail||turnRef.current!=='user'||movingRef.current||ballInHandRef.current||winnerRef.current)return;
    const rect=rail.getBoundingClientRect();
    const y=clamp(event.clientY-rect.top,0,rect.height);
    const next=clamp(Math.round((y/rect.height)*100),5,100);
    powerRef.current=next;
    setPower(next);
    aimingRef.current=true;
  },[]);

  const handleCueControllerDown=useCallback((event)=>{
    if(turnRef.current!=='user'||movingRef.current||ballInHandRef.current||winnerRef.current)return;
    event.preventDefault();
    setCueControllerPulling(true);
    aimingRef.current=true;
    updateCueControllerPower(event);
    try{event.currentTarget.setPointerCapture(event.pointerId);}catch{}
  },[updateCueControllerPower]);

  const handleCueControllerMove=useCallback((event)=>{
    if(!cueControllerPulling)return;
    event.preventDefault();
    updateCueControllerPower(event);
  },[cueControllerPulling,updateCueControllerPower]);

  const handleCueControllerRelease=useCallback((event)=>{
    if(!cueControllerPulling)return;
    setCueControllerPulling(false);
    aimingRef.current=false;
    try{event.currentTarget.releasePointerCapture(event.pointerId);}catch{}
    if(turnRef.current==='user'&&!movingRef.current&&!ballInHandRef.current&&!winnerRef.current){
      shoot(cueAngleRef.current,2.4+powerRef.current*.155);
    }
  },[cueControllerPulling,shoot]);

  useEffect(() => {
    return () => {
      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current
        );
      }

      if (
        aiTimerRef.current
      ) {
        clearTimeout(
          aiTimerRef.current
        );
      }
    };
  }, []);

  const remainingFor=(player)=>{
    const group=groups[player];
    if(!group)return Array.from({length:7},(_,i)=><span key={i} className="pool-ball-badge badge-cleared" aria-label="Open table"/>);
    const numbers=group==='stripes'?[9,10,11,12,13,14,15]:[1,2,3,4,5,6,7];
    return numbers.map(n=><PoolBallBadge key={n} number={n} cleared={group?ballsRef.current.some(b=>b.number===n&&b.pocketed):false}/>);
  };
  const fullScreen=async()=>{
    try{const root=canvasRef.current?.closest('.professional-pool');
      if(document.fullscreenElement)await document.exitFullscreen();else await root?.requestFullscreen();
    }catch{setMessage('Fullscreen is unavailable. The table still works in this window.');}
  };
  return <div className="arena-game-page professional-pool">
    <style>{ARENA_STYLES+GAME_POLISH+POOL_PRO_STYLES}</style><style>{`
.timed-avatar{position:relative;display:inline-flex;align-items:center;justify-content:center}.turn-clock{position:absolute;right:-12px;top:-10px;min-width:38px;height:24px;padding:0 6px;border-radius:999px;background:#101827;color:#fff;border:2px solid #38bdf8;font:900 12px/20px system-ui;text-align:center;box-shadow:0 3px 12px #0008;z-index:20}.turn-clock.danger{border-color:#ef4444;animation:timerPulse .55s infinite alternate}@keyframes timerPulse{to{transform:scale(1.12)}}
`}</style><EntryLoader title="8 Ball Pool"/>
    <div className="pool-game-shell">
      <header className="pool-hud">
        <button className="pool-menu-button" aria-label="Exit Game" title="Exit Game" onClick={()=>setExitRequested(true)}><svg viewBox="0 0 32 32"><path d="M6 8h20M6 16h20M6 24h20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg></button>
        <div className={`pool-contender pool-contender-user ${turn==='user'?'contender-active':''}`}>
          <div className="pool-contender-details"><div className="pool-nameplate"><span>{user?.name||'You'}</span><small>{winner?'Finished':turn==='user'?'Your turn':'Waiting'}</small></div><div className="pool-ball-row" aria-label="Your remaining balls">{remainingFor('user')}</div></div>
          <div className="timed-avatar"><PlayerAvatar user={user} name={user?.name||'You'} color="#66ec5b" active={turn==='user'}/>{turn==='user'&&<span className={`turn-clock ${turnSeconds<=10?'danger':''}`}>{turnSeconds}s</span>}</div>
        </div>
        <div className="pool-match-prize"><svg viewBox="0 0 48 32" aria-hidden="true"><g fill="#facc15" stroke="#b77913" strokeWidth="1.5"><ellipse cx="18" cy="22" rx="10" ry="4"/><ellipse cx="18" cy="17" rx="10" ry="4"/><ellipse cx="18" cy="12" rx="10" ry="4"/><ellipse cx="31" cy="23" rx="9" ry="4"/><ellipse cx="31" cy="18" rx="9" ry="4"/></g></svg><strong>{betAmount*2}</strong><small>PRIZE COINS</small></div>
        <div className={`pool-contender pool-contender-ai ${turn==='ai'?'contender-active':''}`}>
          <div className="timed-avatar"><PlayerAvatar name="Computer" color="#67d8ff" active={turn==='ai'}/>{turn==='ai'&&<span className={`turn-clock ${turnSeconds<=10?'danger':''}`}>{turnSeconds}s</span>}</div>
          <div className="pool-contender-details"><div className="pool-nameplate"><span>Computer</span><small>{winner?'Finished':turn==='ai'?'Playing':'Waiting'}</small></div><div className="pool-ball-row" aria-label="Computer remaining balls">{remainingFor('ai')}</div></div>
        </div>
        <button className="pool-icon-button" title="Fullscreen" aria-label="Fullscreen" onClick={fullScreen}><svg viewBox="0 0 32 32"><path d="M5 12V5h7M20 5h7v7M27 20v7h-7M12 27H5v-7" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg></button>
      </header>
      <div className="pool-topline"><strong>8 Ball Pool</strong><span>{groups.user?`${groups.user==='solids'?'Solids':'Stripes'} · Shot ${shotNumber}`:'Open table · Break for groups'}</span><span>Stake {betAmount} coins</span></div>
      <main className="pool-playfield">
        <div className={`pool-power-column cue-pull-controller ${turn==='ai'?'ai-cue-controller':''}`}>
          <label>{turn==='ai'?'AI CUE':'PULL CUE'}</label>
          <div
            ref={cueControllerRef}
            className={`cue-pull-rail ${cueControllerPulling?'is-pulling':''}`}
            style={{'--cue-pull':`${turn==='ai'?aiVisualPower:power}%`}}
            onPointerDown={handleCueControllerDown}
            onPointerMove={handleCueControllerMove}
            onPointerUp={handleCueControllerRelease}
            onPointerCancel={handleCueControllerRelease}
            role="slider"
            aria-label="Pull cue for shot power"
            aria-valuemin="5"
            aria-valuemax="100"
            aria-valuenow={turn==='ai'?aiVisualPower:power}
          >
            <div className="cue-controller-stick"><i/><b/><span/></div>
            <div className="cue-controller-ball"/>
            <div className="cue-controller-glow"/>
          </div>
          <strong>{turn==='ai'?aiVisualPower:power}%</strong>
          <small>{turn==='ai'?'Computer aiming':'Pull ↓ · Release'}</small>
        </div>
        <div className="pool-table-stage"><canvas ref={canvasRef} width={POOL_WIDTH} height={POOL_HEIGHT} className="pool-pro-canvas" aria-label="8 Ball Pool table. Aim on the table, then pull the side cue down and release to shoot. You can also drag backwards from the white ball." onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={()=>{aimingRef.current=false;dragRef.current=null;}}/></div>
        <aside className="pool-pocket-rack" aria-label="Pocketed balls"><div className="rack-label">POTTED</div><div className="rack-channel">{pocketedNumbers.length?pocketedNumbers.map(n=><PoolBallBadge key={n} number={n}/>):<div className="empty-rack-lines"/>}</div><button className="pool-icon-button" aria-label="How to play" title="How to play" onClick={()=>setHelpOpen(true)}>?</button></aside>
      </main>
      <footer className={`pool-shot-footer ${ballInHand?'pool-hand-footer':''}`}><span className="pool-status-dot"/><p aria-live="polite">{ballInHand&&turn==='user'?'Ball in hand: tap a clear place on the table.':message}</p><button onClick={()=>setHelpOpen(true)}>How to play</button><span className="pool-rotate-hint">Landscape = larger table</span></footer>
    </div>
    {exitRequested&&<ExitConfirmModal onCancel={()=>setExitRequested(false)} onConfirm={onBack}/>}
    {helpOpen&&<div className="match-exit-overlay"><section className="match-exit-modal" role="dialog" aria-modal="true" aria-labelledby="pool-help-title"><h2 id="pool-help-title">Your next shot</h2><p>Aim on the table, then pull the side cue downward like a bow. The farther you pull, the stronger the shot. Release it to shoot automatically.</p><p>The cue on the table pulls back at the same time. You can also drag backwards directly from the white ball and release.</p><p>Clear your solids or stripes, then pot the 8-ball. A foul gives your opponent ball-in-hand.</p><button className="start-match-btn" onClick={()=>setHelpOpen(false)}>Got it</button></section></div>}
  </div>;
}

/* =========================================================
   ARENA LANGUAGE SYSTEM
========================================================= */
const ARENA_TEXT = {
  en: {
    gamingArena:"Gaming Arena", tagline:"Play • Compete • Win", realBalance:"REAL APP BALANCE", coins:"Coins",
    gameLobby:"🎮 Game Lobby", earnCoins:"🪙 Earn Coins", wallet:"💰 Wallet", liveArena:"• LIVE ARENA",
    chooseGame:"Choose Your Game", chooseGameDesc:"Play games with your real SAMATKAAR coins. Your stake is deducted from your actual balance when the match starts.",
    strategy:"STRATEGY GAME", ludoDesc:"Take all 4 tokens to the finish line and defeat your opponent.", skill:"SKILL GAME", poolDesc:"Physics-based pool with groups, fouls and 8-ball rules.",
    matchSetup:"MATCH SETUP", configure:"Configure Match", opponent:"Opponent", computer:"Computer", playAI:"Play against AI", friendOnline:"Friend Online", realOnline:"Real online mode",
    betAmount:"Bet Amount", customBet:"Custom bet", currentBalance:"Current Balance", afterBet:"After Bet", potentialWin:"Potential Win",
    startLudo:"🎮 Start Ludo Match", playPool:"🎱 Setup 8 Ball Pool", findReal:"🔎 Find a real player", searchPlaceholder:"Search name / Player ID", search:"Search", onlinePlayer:"Online player",
    friend:"＋ Friend", sent:"✓ Sent", fairness:"Fair Game System", fairnessText:"Secure browser randomness is used for Ludo dice and AI decisions. The game does not intentionally give the user 1 and the computer 6.",
    fairnessSmall:"Important: in true online multiplayer, dice and actions should be server-authoritative.", stakeWarning:"⚠️ When the match starts, the selected stake is deducted from the actual App.jsx balance.",
    ludoMatch:"LUDO MATCH", poolMatch:"8 BALL POOL MATCH", chooseType:"Choose match type & players", choosePoolType:"Choose 8 Ball Pool match type", aiReady:"Computer mode is playable now. Online mode uses the realtime backend for real players.",
    online:"🌐 Online", friendsReal:"Friends / real players", random:"⚡ Random Match", searchPlayer:"🔎 Search Player", joinRoom:"🔑 Join Room", createRoom:"➕ Create Room",
    realtimeOnline:"🟢 Realtime Online", realtimeOffline:"🔴 Realtime Offline", randomDesc:"A real player with the same game and stake will be matched automatically.", findLudo:"⚡ Find Random Ludo Player", findPool:"⚡ Find Random Pool Player", searching:"⏳ Searching…", cancel:"Cancel Search",
    roomCode:"Room code", shareCode:"Share this code with your friend", enterCode:"Enter your friend's room code", yourBet:"Your bet", yourStake:"Your stake", winPayout:"Win payout", stakeNote:"Your stake is deducted once when the match starts. The win payout includes your stake.",
    playLudo:"Play Ludo", startOnlineLudo:"Start Online Ludo", playPoolAI:"Play 8 Ball Pool", startOnlinePool:"Start Online Pool", maxAI:"AI matches allow a maximum stake of 100 coins. Online friend matches have no 100-coin cap.",
    challenge:"⚔️ Challenge", playerId:"Player ID", close:"Close setup", matchFound:"MATCH FOUND", decline:"Decline", accept:"Accept Challenge",
    walletTitle:"💰 Your Wallet", actualBalance:"Your actual balance:", youWon:"You Won!", computerWon:"Computer Won", continue:"Continue",
    aiLimit:"AI matches allow a maximum bet of 100 coins.", loginRandom:"Please log in to use random matchmaking.", realtimeMissing:"Realtime server is not connected.", validBet:"A valid bet and sufficient coins are required.",
    insufficient:"Insufficient coins", nameId:"Enter at least 2 letters or a Player ID.", friendSent:"🤝 Friend request sent.", requestFailed:"Realtime request failed.",
    preparing:"Preparing your table…", exitGame:"← Exit Game", rollBegin:"Roll the dice to begin.", noMove:"No available move.", selectToken:"Select a glowing token.", computerChoosing:"Computer is choosing a move…",
    timeMove:"⏱️ Time over — moving one legal token automatically.", timeSkip:"⏱️ 40 seconds over — your turn was skipped.", emptySeat:"Empty seat", notMatch:"Not in this match", home:"home",
    poolBreak:"Break shot — drag away from the cue ball.", computerThinking:"🤖 Computer is lining up the shot…", shotProgress:"🎱 Shot in progress..."
  },
  ur: {
    gamingArena:"گیمنگ ایرینا", tagline:"کھیلیں • مقابلہ کریں • جیتیں", realBalance:"اصل ایپ بیلنس", coins:"کوائنز",
    gameLobby:"🎮 گیم لابی", earnCoins:"🪙 کوائنز کمائیں", wallet:"💰 والیٹ", liveArena:"• لائیو ایرینا",
    chooseGame:"اپنا گیم منتخب کریں", chooseGameDesc:"اپنے اصل SAMATKAAR کوائنز سے گیم کھیلیں۔ میچ شروع ہوتے ہی آپ کی شرط اصل بیلنس سے کٹ جائے گی۔",
    strategy:"حکمتِ عملی کا گیم", ludoDesc:"چاروں گوٹیاں فنش لائن تک پہنچائیں اور حریف کو شکست دیں۔", skill:"مہارت کا گیم", poolDesc:"فزکس پر مبنی پول، گروپس، فاؤلز اور 8 بال کے قواعد کے ساتھ۔",
    matchSetup:"میچ سیٹ اپ", configure:"میچ ترتیب دیں", opponent:"حریف", computer:"کمپیوٹر", playAI:"اے آئی کے خلاف کھیلیں", friendOnline:"آن لائن دوست", realOnline:"حقیقی آن لائن موڈ",
    betAmount:"شرط کی رقم", customBet:"اپنی شرط", currentBalance:"موجودہ بیلنس", afterBet:"شرط کے بعد", potentialWin:"ممکنہ جیت",
    startLudo:"🎮 لڈو میچ شروع کریں", playPool:"🎱 8 بال پول سیٹ اپ", findReal:"🔎 حقیقی کھلاڑی تلاش کریں", searchPlaceholder:"نام / پلیئر آئی ڈی تلاش کریں", search:"تلاش", onlinePlayer:"آن لائن کھلاڑی",
    friend:"＋ دوست", sent:"✓ بھیج دی", fairness:"منصفانہ گیم سسٹم", fairnessText:"لڈو کے ڈائس اور اے آئی کے فیصلوں کے لیے محفوظ براؤزر رینڈم نیس استعمال ہوتی ہے۔ جان بوجھ کر صارف کو 1 اور کمپیوٹر کو 6 نہیں دیا جاتا۔",
    fairnessSmall:"اہم: حقیقی آن لائن ملٹی پلیئر میں ڈائس اور ایکشنز سرور کے اختیار میں ہونے چاہئیں۔", stakeWarning:"⚠️ میچ شروع ہوتے ہی منتخب شرط اصل App.jsx بیلنس سے کٹے گی۔",
    ludoMatch:"لڈو میچ", poolMatch:"8 بال پول میچ", chooseType:"میچ کی قسم اور کھلاڑی منتخب کریں", choosePoolType:"8 بال پول میچ کی قسم منتخب کریں", aiReady:"کمپیوٹر موڈ ابھی کھیلنے کے لیے تیار ہے۔ آن لائن موڈ حقیقی کھلاڑیوں کے لیے ریئل ٹائم بیک اینڈ استعمال کرتا ہے۔",
    online:"🌐 آن لائن", friendsReal:"دوست / حقیقی کھلاڑی", random:"⚡ رینڈم میچ", searchPlayer:"🔎 کھلاڑی تلاش کریں", joinRoom:"🔑 روم جوائن کریں", createRoom:"➕ روم بنائیں",
    realtimeOnline:"🟢 ریئل ٹائم آن لائن", realtimeOffline:"🔴 ریئل ٹائم آف لائن", randomDesc:"اسی گیم اور اسی شرط والا حقیقی کھلاڑی خودکار طور پر میچ ہوگا۔", findLudo:"⚡ رینڈم لڈو کھلاڑی تلاش کریں", findPool:"⚡ رینڈم پول کھلاڑی تلاش کریں", searching:"⏳ تلاش جاری…", cancel:"تلاش منسوخ کریں",
    roomCode:"روم کوڈ", shareCode:"یہ کوڈ اپنے دوست کے ساتھ شیئر کریں", enterCode:"دوست کا روم کوڈ درج کریں", yourBet:"آپ کی شرط", yourStake:"آپ کی شرط", winPayout:"جیت کی ادائیگی", stakeNote:"شرط میچ شروع ہوتے وقت ایک بار کٹتی ہے۔ جیت کی ادائیگی میں آپ کی شرط بھی شامل ہے۔",
    playLudo:"لڈو کھیلیں", startOnlineLudo:"آن لائن لڈو شروع کریں", playPoolAI:"8 بال پول کھیلیں", startOnlinePool:"آن لائن پول شروع کریں", maxAI:"اے آئی کے خلاف زیادہ سے زیادہ 100 کوائنز کی شرط لگ سکتی ہے۔ آن لائن دوست کے ساتھ 100 کوائنز کی حد نہیں۔",
    challenge:"⚔️ چیلنج", playerId:"پلیئر آئی ڈی", close:"سیٹ اپ بند کریں", matchFound:"میچ مل گیا", decline:"انکار", accept:"چیلنج قبول کریں",
    walletTitle:"💰 آپ کا والیٹ", actualBalance:"آپ کا اصل بیلنس:", youWon:"آپ جیت گئے!", computerWon:"کمپیوٹر جیت گیا", continue:"جاری رکھیں",
    aiLimit:"اے آئی میچ میں زیادہ سے زیادہ 100 کوائنز کی شرط لگ سکتی ہے۔", loginRandom:"رینڈم میچ کے لیے لاگ اِن کریں۔", realtimeMissing:"ریئل ٹائم سرور منسلک نہیں ہے۔", validBet:"درست شرط اور کافی کوائنز ضروری ہیں۔",
    insufficient:"کوائنز ناکافی ہیں", nameId:"کم از کم 2 حروف یا پلیئر آئی ڈی لکھیں۔", friendSent:"🤝 دوست کی درخواست بھیج دی گئی۔", requestFailed:"ریئل ٹائم درخواست ناکام ہوگئی۔",
    preparing:"آپ کی میز تیار ہو رہی ہے…", exitGame:"← گیم سے نکلیں", rollBegin:"شروع کرنے کے لیے ڈائس رول کریں۔", noMove:"کوئی چال دستیاب نہیں۔", selectToken:"چمکتی ہوئی گوٹی منتخب کریں۔", computerChoosing:"کمپیوٹر چال منتخب کر رہا ہے…",
    timeMove:"⏱️ وقت ختم — ایک درست گوٹی خودکار طور پر چل رہی ہے۔", timeSkip:"⏱️ 40 سیکنڈ ختم — آپ کی باری گزر گئی۔", emptySeat:"خالی جگہ", notMatch:"اس میچ میں نہیں", home:"گھر",
    poolBreak:"بریک شاٹ — سفید گیند سے پیچھے ڈریگ کریں۔", computerThinking:"🤖 کمپیوٹر شاٹ کی لائن بنا رہا ہے…", shotProgress:"🎱 شاٹ جاری ہے…"
  },
  hi: {
    gamingArena:"गेमिंग एरीना", tagline:"खेलें • मुकाबला करें • जीतें", realBalance:"असली ऐप बैलेंस", coins:"कॉइन्स",
    gameLobby:"🎮 गेम लॉबी", earnCoins:"🪙 कॉइन्स कमाएँ", wallet:"💰 वॉलेट", liveArena:"• लाइव एरीना",
    chooseGame:"अपना गेम चुनें", chooseGameDesc:"अपने असली SAMATKAAR कॉइन्स से गेम खेलें। मैच शुरू होते ही आपकी बाज़ी असली बैलेंस से कटेगी।",
    strategy:"रणनीति गेम", ludoDesc:"चारों गोटियों को फिनिश लाइन तक पहुँचाएँ और विरोधी को हराएँ।", skill:"स्किल गेम", poolDesc:"फिजिक्स-आधारित पूल, ग्रुप्स, फाउल और 8-बॉल नियमों के साथ।",
    matchSetup:"मैच सेटअप", configure:"मैच सेट करें", opponent:"विरोधी", computer:"कंप्यूटर", playAI:"AI के खिलाफ खेलें", friendOnline:"ऑनलाइन दोस्त", realOnline:"असली ऑनलाइन मोड",
    betAmount:"बाज़ी की रकम", customBet:"अपनी बाज़ी", currentBalance:"मौजूदा बैलेंस", afterBet:"बाज़ी के बाद", potentialWin:"संभावित जीत",
    startLudo:"🎮 लूडो मैच शुरू करें", playPool:"🎱 8 बॉल पूल सेटअप", findReal:"🔎 असली खिलाड़ी खोजें", searchPlaceholder:"नाम / प्लेयर आईडी खोजें", search:"खोजें", onlinePlayer:"ऑनलाइन खिलाड़ी",
    friend:"＋ दोस्त", sent:"✓ भेजा", fairness:"फेयर गेम सिस्टम", fairnessText:"लूडो डाइस और AI के फैसलों के लिए सुरक्षित ब्राउज़र रैंडमनेस इस्तेमाल होती है। जानबूझकर यूज़र को 1 और कंप्यूटर को 6 नहीं दिया जाता।",
    fairnessSmall:"महत्वपूर्ण: असली ऑनलाइन मल्टीप्लेयर में डाइस और एक्शन सर्वर के नियंत्रण में होने चाहिए।", stakeWarning:"⚠️ मैच शुरू होते ही चुनी हुई बाज़ी असली App.jsx बैलेंस से कटेगी।",
    ludoMatch:"लूडो मैच", poolMatch:"8 बॉल पूल मैच", chooseType:"मैच का प्रकार और खिलाड़ी चुनें", choosePoolType:"8 बॉल पूल मैच का प्रकार चुनें", aiReady:"कंप्यूटर मोड अभी खेलने के लिए तैयार है। ऑनलाइन मोड असली खिलाड़ियों के लिए रियलटाइम बैकएंड इस्तेमाल करता है।",
    online:"🌐 ऑनलाइन", friendsReal:"दोस्त / असली खिलाड़ी", random:"⚡ रैंडम मैच", searchPlayer:"🔎 खिलाड़ी खोजें", joinRoom:"🔑 रूम जॉइन करें", createRoom:"➕ रूम बनाएँ",
    realtimeOnline:"🟢 रियलटाइम ऑनलाइन", realtimeOffline:"🔴 रियलटाइम ऑफलाइन", randomDesc:"इसी गेम और इसी बाज़ी वाला असली खिलाड़ी अपने-आप मैच होगा।", findLudo:"⚡ रैंडम लूडो खिलाड़ी खोजें", findPool:"⚡ रैंडम पूल खिलाड़ी खोजें", searching:"⏳ खोज जारी…", cancel:"खोज रद्द करें",
    roomCode:"रूम कोड", shareCode:"यह कोड अपने दोस्त के साथ शेयर करें", enterCode:"दोस्त का रूम कोड डालें", yourBet:"आपकी बाज़ी", yourStake:"आपकी बाज़ी", winPayout:"जीत का भुगतान", stakeNote:"बाज़ी मैच शुरू होते समय एक बार कटती है। जीत के भुगतान में आपकी बाज़ी भी शामिल है।",
    playLudo:"लूडो खेलें", startOnlineLudo:"ऑनलाइन लूडो शुरू करें", playPoolAI:"8 बॉल पूल खेलें", startOnlinePool:"ऑनलाइन पूल शुरू करें", maxAI:"AI के खिलाफ अधिकतम 100 कॉइन्स की बाज़ी लग सकती है। ऑनलाइन दोस्त के साथ 100 कॉइन्स की सीमा नहीं है।",
    challenge:"⚔️ चैलेंज", playerId:"प्लेयर आईडी", close:"सेटअप बंद करें", matchFound:"मैच मिल गया", decline:"मना करें", accept:"चैलेंज स्वीकार करें",
    walletTitle:"💰 आपका वॉलेट", actualBalance:"आपका असली बैलेंस:", youWon:"आप जीत गए!", computerWon:"कंप्यूटर जीत गया", continue:"जारी रखें",
    aiLimit:"AI मैच में अधिकतम 100 कॉइन्स की बाज़ी लग सकती है।", loginRandom:"रैंडम मैच के लिए लॉग इन करें।", realtimeMissing:"रियलटाइम सर्वर कनेक्ट नहीं है।", validBet:"सही बाज़ी और पर्याप्त कॉइन्स जरूरी हैं।",
    insufficient:"कॉइन्स कम हैं", nameId:"कम से कम 2 अक्षर या प्लेयर आईडी लिखें।", friendSent:"🤝 दोस्त की रिक्वेस्ट भेज दी गई।", requestFailed:"रियलटाइम रिक्वेस्ट फेल हुई।",
    preparing:"आपकी टेबल तैयार हो रही है…", exitGame:"← गेम से बाहर", rollBegin:"शुरू करने के लिए डाइस रोल करें।", noMove:"कोई चाल उपलब्ध नहीं।", selectToken:"चमकती गोटी चुनें।", computerChoosing:"कंप्यूटर चाल चुन रहा है…",
    timeMove:"⏱️ समय खत्म — एक सही गोटी अपने-आप चल रही है।", timeSkip:"⏱️ 40 सेकंड खत्म — आपकी बारी निकल गई।", emptySeat:"खाली सीट", notMatch:"इस मैच में नहीं", home:"होम",
    poolBreak:"ब्रेक शॉट — सफेद गेंद से पीछे ड्रैग करें।", computerThinking:"🤖 कंप्यूटर शॉट की लाइन बना रहा है…", shotProgress:"🎱 शॉट चल रहा है…"
  }
};
function arenaLangKey(lang){const v=String(lang||'en').toLowerCase();return v.startsWith('ur')?'ur':v.startsWith('hi')?'hi':'en';}
function arenaText(lang,key){const code=arenaLangKey(lang);return ARENA_TEXT[code]?.[key] ?? ARENA_TEXT.en[key] ?? key;}

/* =========================================================
   MAIN GAMING ARENA
========================================================= */

export default function SamatkarGamingArena({
  coins = 0,
  user = null,
  addCoins,
  deductCoins,
  navigate,
}) {
  const { lang } = useLanguage();
  const t = useCallback((key) => arenaText(lang, key), [lang]);
  const [activeTab, setActiveTab] =
    useState("lobby");

  const [game, setGame] =
    useState(null);

  const [opponentCount,setOpponentCount]=useState(1);
  const [ludoSetup,setLudoSetup]=useState(false);
  const [poolSetup,setPoolSetup]=useState(false);
  const settledMatchRef=useRef(false);
  const [opponentType, setOpponentType] =
    useState("computer");

  const [betAmount, setBetAmount] =
    useState(10);

  const [customBet, setCustomBet] =
    useState("");

  const [roomCode, setRoomCode] =
    useState("");

  const [onlineAction,setOnlineAction]=useState("random");
  const [friendSearch,setFriendSearch]=useState("");
  const [socketConnected,setSocketConnected]=useState(arenaSocket.connected);
  const [matchmaking,setMatchmaking]=useState(false);
  const [matchmakingGame,setMatchmakingGame]=useState(null);
  const [searchResults,setSearchResults]=useState([]);
  const [searchingPlayers,setSearchingPlayers]=useState(false);
  const [incomingChallenge,setIncomingChallenge]=useState(null);
  const [onlineMatch,setOnlineMatch]=useState(null);
  const [friendRequestStatus,setFriendRequestStatus]=useState({});
  const makeRoomCode=()=>`SAM-${secureRandomInt(100000,999999)}`;
  const createOnlineRoom=()=>{const code=makeRoomCode();setRoomCode(code);setOnlineAction("create");gameSound("click",.08);showNotice(`Room ${code} created locally. Connect Realtime backend to publish it online.`,"info");};

  const [notice, setNotice] =
    useState({
      text: "",
      type: "",
    });

  const [matchResult, setMatchResult] =
    useState(null);

  const showNotice = useCallback(
    (text, type = "info") => {
      setNotice({
        text,
        type,
      });

      setTimeout(() => {
        setNotice({
          text: "",
          type: "",
        });
      }, 3200);
    },
    []
  );

  /* =====================================================
     REALTIME SOCKET.IO
  ===================================================== */

  useEffect(() => {
    const onConnect = () => { setSocketConnected(true); const id=String(user?.id || user?._id || ""); if(id) arenaSocket.emit("register_player",{userId:id,userName:user?.name || "Player"}); };
    const onDisconnect = () => { setSocketConnected(false); setMatchmaking(false); };
    const onWaiting = (payload) => { setMatchmaking(true); showNotice(payload?.message || t("searching"), "info"); };
    const onCancelled = () => { setMatchmaking(false); setMatchmakingGame(null); };
    const onMatchFound = (payload) => {
      setMatchmaking(false);
      setMatchmakingGame(null);
      const myId=String(user?.id || user?._id || "");
      const p1=payload?.player1, p2=payload?.player2;
      const opponent=String(p1?.id||"")===myId?p2:p1;
      setOnlineMatch({...payload, opponent});
      showNotice(`🎮 ${t("matchFound")}: ${opponent?.name || t("opponent")}`, "success");
    };
    const onSearchResults = (payload) => { setSearchingPlayers(false); setSearchResults(Array.isArray(payload?.players)?payload.players:[]); };
    const onFriendRequestSent = (payload) => { setFriendRequestStatus(prev=>({...prev,[payload?.toUserId]:"sent"})); showNotice("🤝 Friend request sent.","success"); };
    const onFriendRequestReceived = (payload) => showNotice(`🤝 ${payload?.fromName || "Player"} ne friend request bheji hai.`,"info");
    const onChallengeReceived = (payload) => setIncomingChallenge(payload);
    const onChallengeRejected = (payload) => showNotice(`${payload?.byName || "Player"} ne challenge reject kar diya.`,"info");
    const onSocketError = (payload) => { setSearchingPlayers(false); setMatchmaking(false); showNotice(payload?.message || "Realtime request failed.","error"); };

    arenaSocket.on("connect",onConnect);
    arenaSocket.on("disconnect",onDisconnect);
    arenaSocket.on("waiting_for_opponent",onWaiting);
    arenaSocket.on("queue_cancelled",onCancelled);
    arenaSocket.on("match_found",onMatchFound);
    arenaSocket.on("player_search_results",onSearchResults);
    arenaSocket.on("friend_request_sent",onFriendRequestSent);
    arenaSocket.on("friend_request_received",onFriendRequestReceived);
    arenaSocket.on("challenge_received",onChallengeReceived);
    arenaSocket.on("challenge_rejected",onChallengeRejected);
    arenaSocket.on("match_error",onSocketError);
    arenaSocket.on("arena_error",onSocketError);
    if(arenaSocket.connected)onConnect();
    return()=>{
      arenaSocket.off("connect",onConnect); arenaSocket.off("disconnect",onDisconnect);
      arenaSocket.off("waiting_for_opponent",onWaiting); arenaSocket.off("queue_cancelled",onCancelled);
      arenaSocket.off("match_found",onMatchFound); arenaSocket.off("player_search_results",onSearchResults);
      arenaSocket.off("friend_request_sent",onFriendRequestSent); arenaSocket.off("friend_request_received",onFriendRequestReceived);
      arenaSocket.off("challenge_received",onChallengeReceived); arenaSocket.off("challenge_rejected",onChallengeRejected);
      arenaSocket.off("match_error",onSocketError); arenaSocket.off("arena_error",onSocketError);
    };
  }, [user?.id, user?._id, showNotice]);

  const realtimeIdentity=()=>({
    userId:String(user?.id || user?._id || ""),
    userName:user?.name || "Player"
  });

  const findRandomMatch=(selectedGame)=>{
    const finalBet=Math.floor(Number(betAmount));
    const identity=realtimeIdentity();
    if(!identity.userId){showNotice("Random match ke liye login karein.","error");return;}
    if(!socketConnected){showNotice("Realtime server connect nahi hai.","error");return;}
    if(!Number.isFinite(finalBet)||finalBet<1||coins<finalBet){showNotice("Valid bet aur sufficient coins required hain.","error");return;}
    setMatchmaking(true); setMatchmakingGame(selectedGame); setOnlineMatch(null);
    arenaSocket.emit("find_random_match",{...identity,betCoins:finalBet,game:selectedGame});
  };

  const cancelRandomMatch=()=>arenaSocket.emit("cancel_queue");

  const searchPlayers=()=>{
    const q=friendSearch.trim();
    if(q.length<2){showNotice("Kam az kam 2 letters ya Player ID likhein.","error");return;}
    setSearchingPlayers(true);
    arenaSocket.emit("search_players",{...realtimeIdentity(),query:q});
  };

  const sendFriendRequest=(player)=>arenaSocket.emit("send_friend_request",{...realtimeIdentity(),toUserId:player.id});
  const challengePlayer=(player,selectedGame)=>{
    const finalBet=Math.floor(Number(betAmount));
    if(coins<finalBet){showNotice("Challenge ke liye sufficient coins nahi hain.","error");return;}
    arenaSocket.emit("challenge_player",{...realtimeIdentity(),toUserId:player.id,game:selectedGame,betCoins:finalBet});
    showNotice(`⚔️ ${player.name} ko ${selectedGame==='ludo'?'Ludo':'8 Ball Pool'} challenge bheja gaya.`,"success");
  };

  const answerChallenge=(accept)=>{
    if(!incomingChallenge)return;
    arenaSocket.emit(accept?"accept_challenge":"reject_challenge",{...realtimeIdentity(),challengeId:incomingChallenge.challengeId});
    setIncomingChallenge(null);
  };

  /* =====================================================
     BET CHANGE
  ===================================================== */

  const changeBet = (amount) => {
    setBetAmount(
      Math.max(1, Number(amount) || 1)
    );

    setCustomBet("");
  };

  const handleCustomBet = (
    event
  ) => {
    const value =
      event.target.value;

    setCustomBet(value);

    const number =
      Number(value);

    if (
      Number.isFinite(number) &&
      number > 0
    ) {
      setBetAmount(
        Math.floor(number)
      );
    }
  };

  /* =====================================================
     START MATCH
  ===================================================== */

  const startMatch = (
    selectedGame
  ) => {
    const finalBet =
      Math.floor(
        Number(betAmount)
      );

    if (
      !Number.isFinite(finalBet) ||
      finalBet < 1
    ) {
      showNotice(
        "Please enter a valid bet amount.",
        "error"
      );

      return;
    }

    // AI matches are intentionally capped at 100 coins.
    // Real online/friend matches are not limited by this AI cap.
    if (opponentType === "computer" && finalBet > 100) {
      showNotice(t("aiLimit"), "error");
      return;
    }

    /* REAL APP COINS */

    if (coins < finalBet) {
      showNotice(
        `⚠️ Insufficient coins! Aap ke paas ${coins} coins hain aur bet ${finalBet} coins hai.`,
        "error"
      );

      return;
    }

    /* ==================================================
       FRIEND ONLINE
       ================================================== */

    if (
      opponentType === "friend"
    ) {
      if (onlineAction === "search" ? !friendSearch.trim() : !roomCode.trim()) {
        showNotice(onlineAction === "search" ? t("nameId") : t("enterCode"), "error");
        return;
      }

      /*
       IMPORTANT:
       Yahan local game start nahi kar rahe.

       Real online game ke liye:
       Browser A <-> Backend <-> Browser B

       required hai.

       Isliye fake local friend match
       intentionally disabled hai.
      */

      showNotice(
        `${t("friendOnline")} mode ko real banane ke liye Railway/Supabase Realtime match synchronization required hai. Local fake match start nahi kiya gaya.`,
        "info"
      );

      return;
    }

    /* ==================================================
       DEDUCT REAL APP COINS
       ================================================== */

    if (
      typeof deductCoins !==
      "function"
    ) {
      showNotice(
        "Coin system connection missing hai.",
        "error"
      );

      return;
    }

    const paid =
      deductCoins(
        finalBet,
        `🎮 ${selectedGame === "ludo" ? "Ludo" : "8 Ball Pool"} bet: ${finalBet} coins`
      );

    if (!paid) {
      /*
       App.jsx ne balance check kar liya.
       Agar false aya to game start nahi hoga.
      */

      return;
    }

    settledMatchRef.current=false;
    setMatchResult(null);
    setLudoSetup(false);

    setGame({
      type: selectedGame,
      bet: finalBet,
      opponentCount: selectedGame === "ludo" ? opponentCount : 1,
    });
  };

  /* =====================================================
     MATCH FINISH
  ===================================================== */

  const finishMatch = useCallback(
    ({
      winner,
      betAmount: matchBet,
      game: gameName,
      prizeMultiplier = 2,
    }) => {
      if(settledMatchRef.current)return;
      settledMatchRef.current=true;
      const prize=matchBet*(gameName === "ludo" ? clamp(prizeMultiplier,2,4) : 2);
      if (
        winner === "user"
      ) {
        // Stake was deducted at start. Prize includes stake and match winnings.

        if (
          typeof addCoins ===
          "function"
        ) {
          addCoins(
            prize,
            `🏆 You won ${prize} coins in ${gameName === "ludo" ? "Ludo" : "8 Ball Pool"}!`
          );
        }

        setMatchResult({
          winner: "user",
          amount:
            prize,
          game: gameName,
        });
      } else {
        setMatchResult({
          winner: "ai",
          amount: 0,
          game: gameName,
        });
      }

      setGame(null);
    },
    [addCoins]
  );

  /* =====================================================
     GAME SCREEN
  ===================================================== */

  if (game) {
    if (game.type === "ludo") {
      return (
        <LudoGame user={user} lang={lang} opponentCount={game.opponentCount}
          betAmount={game.bet}
          onFinish={finishMatch}
          onBack={() => {settledMatchRef.current=true;setGame(null);}}
        />
      );
    }

    if (game.type === "pool") {
      return (
        <PoolGame user={user} lang={lang}
          betAmount={game.bet}
          onFinish={finishMatch}
          onBack={() => {settledMatchRef.current=true;setGame(null);}}
        />
      );
    }
  }

  return (
    <div className="gaming-arena">
      <style>{ARENA_STYLES + GAME_POLISH + POOL_PRO_STYLES + REALTIME_ARENA_STYLES}</style>
      {incomingChallenge&&<div className="realtime-overlay"><div className="challenge-modal"><span className="challenge-kicker">LIVE CHALLENGE</span><h2>⚔️ {incomingChallenge.fromName || 'Player'} challenged you</h2><p>{incomingChallenge.game==='ludo'?'🎲 Ludo':'🎱 8 Ball Pool'} · 🪙 {incomingChallenge.betCoins} coins</p><div><button onClick={()=>answerChallenge(false)}>Decline</button><button className="accept" onClick={()=>answerChallenge(true)}>Accept Challenge</button></div></div></div>}
      {onlineMatch&&<div className="online-match-banner"><span>🟢 MATCH FOUND</span><strong>{onlineMatch.opponent?.name || '{t("opponent")}'}</strong><small>{onlineMatch.game==='ludo'?'🎲 Ludo':'🎱 8 Ball Pool'} · 🪙 {onlineMatch.betCoins} · Room {onlineMatch.roomId}</small><button onClick={()=>setOnlineMatch(null)}>×</button></div>}
      {ludoSetup && <div className="match-exit-overlay"><section className="ludo-setup-modal" role="dialog" aria-modal="true" aria-labelledby="ludo-setup-title">
        <button className="setup-close" aria-label="Close setup" onClick={()=>setLudoSetup(false)}>×</button>
        <span className="setup-eyebrow">LUDO MATCH</span><h2 id="ludo-setup-title">Choose match type & players</h2><p>Computer ke sath abhi playable hai. Online mode real backend room synchronization ke liye ready option hai.</p>
        <div className="ludo-mode-options">
          <button className={opponentType==='computer'?'selected':''} onClick={()=>setOpponentType('computer')}><strong>🤖 Computer</strong><span>Play now vs AI</span></button>
          <button className={opponentType==='friend'?'selected':''} onClick={()=>setOpponentType('friend')}><strong>🌐 Online</strong><span>Friends / real players</span></button>
        </div>
        <div className="player-count-options">{[1,2,3].map(n=><button key={n} className={opponentCount===n?'selected':''} aria-pressed={opponentCount===n} onClick={()=>setOpponentCount(n)}><strong>{n+1} Players</strong><span>You + {n} {opponentType==='computer'?(n===1?'computer':'computers'):(n===1?'online player':'online players')}</span></button>)}</div>
        {opponentType==='friend'&&<div className="online-match-tools">
          <div className="online-action-tabs">
            <button className={onlineAction==='random'?'selected':''} onClick={()=>setOnlineAction('random')}>⚡ Random Match</button>
            <button className={onlineAction==='search'?'selected':''} onClick={()=>setOnlineAction('search')}>🔎 Search Player</button>
            <button className={onlineAction==='join'?'selected':''} onClick={()=>setOnlineAction('join')}>🔑 Join Room</button>
            <button className={onlineAction==='create'?'selected':''} onClick={createOnlineRoom}>➕ Create Room</button>
          </div>
          {onlineAction==='random'&&<div className="realtime-random-box"><strong>{socketConnected?'🟢 Realtime Online':'🔴 Realtime Offline'}</strong><p>Same game aur same bet wala real player automatically match hoga.</p><button type="button" className="start-match-btn" disabled={matchmaking} onClick={()=>findRandomMatch('ludo')}>{matchmaking&&matchmakingGame==='ludo'?'⏳ Searching…':'⚡ Find Random Ludo Player'}</button>{matchmaking&&<button type="button" className="arena-back-btn" onClick={cancelRandomMatch}>Cancel Search</button>}</div>}
          {onlineAction==='search'&&<div className="player-search-box"><div className="player-search-row"><input value={friendSearch} onChange={e=>setFriendSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchPlayers()} placeholder="Name / Player ID"/><button type="button" onClick={searchPlayers}>{searchingPlayers?'Searching…':'Search'}</button></div><div className="player-search-results">{searchResults.map(player=><article className="player-result-card" key={player.id}><PlayerAvatar user={player} name={player.name} color="#38bdf8"/><div><strong>{player.name}</strong><small>Player ID: {String(player.id).slice(-8)}</small></div><div className="player-result-actions"><button onClick={()=>sendFriendRequest(player)} disabled={friendRequestStatus[player.id]==='sent'}>{friendRequestStatus[player.id]==='sent'?'✓ Sent':'＋ Friend'}</button><button onClick={()=>challengePlayer(player,'ludo')}>⚔️ Challenge</button></div></article>)}</div></div>}
          {(onlineAction==='join'||onlineAction==='create')&&<label className="setup-bet-label online-room-label">Room code <input value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase())} placeholder="SAM-123456"/><span>{onlineAction==='create'?'Share this code with your friend':'Enter friend room code'}</span></label>}
        </div>}
        <label className="setup-bet-label">Your bet <input aria-label="Ludo bet" type="number" min="1" max={opponentType==='computer'?100:undefined} step="1" value={betAmount} onChange={e=>changeBet(e.target.value)}/><span>coins</span></label>
        <div className="ludo-prize-preview"><div><small>Your stake</small><strong>{betAmount} coins</strong></div><div><small>Win payout</small><strong>{betAmount*(opponentCount+1)} coins</strong></div></div>
        {opponentType==='computer'&&<p className="setup-stake-note">{t("maxAI")}</p>}
        <p className="setup-stake-note">{t("stakeNote")}</p>
        <button className="start-match-btn" onClick={()=>startMatch('ludo')}>{opponentType==='computer'?'Play Ludo':'Start Online Ludo'} · {opponentCount+1} players</button>
        {notice.text&&<p className="setup-error" role="alert">{notice.text}</p>}
      </section></div>}


      {poolSetup && <div className="match-exit-overlay"><section className="ludo-setup-modal" role="dialog" aria-modal="true" aria-labelledby="pool-setup-title">
        <button className="setup-close" aria-label={t("close")} onClick={()=>setPoolSetup(false)}>×</button>
        <span className="setup-eyebrow">{t("poolMatch")}</span><h2 id="pool-setup-title">{t("choosePoolType")}</h2><p>{t("aiReady")}</p>
        <div className="ludo-mode-options">
          <button className={opponentType==='computer'?'selected':''} onClick={()=>setOpponentType('computer')}><strong>🤖 {t("computer")}</strong><span>{t("playAI")}</span></button>
          <button className={opponentType==='friend'?'selected':''} onClick={()=>setOpponentType('friend')}><strong>{t("online")}</strong><span>{t("friendsReal")}</span></button>
        </div>
        {opponentType==='friend'&&<div className="online-match-tools">
          <div className="online-action-tabs">
            <button className={onlineAction==='random'?'selected':''} onClick={()=>setOnlineAction('random')}>{t("random")}</button>
            <button className={onlineAction==='search'?'selected':''} onClick={()=>setOnlineAction('search')}>{t("searchPlayer")}</button>
            <button className={onlineAction==='join'?'selected':''} onClick={()=>setOnlineAction('join')}>{t("joinRoom")}</button>
            <button className={onlineAction==='create'?'selected':''} onClick={createOnlineRoom}>{t("createRoom")}</button>
          </div>
          {onlineAction==='random'&&<div className="realtime-random-box"><strong>{socketConnected?t("realtimeOnline"):t("realtimeOffline")}</strong><p>{t("randomDesc")}</p><button type="button" className="start-match-btn" disabled={matchmaking} onClick={()=>findRandomMatch('pool')}>{matchmaking&&matchmakingGame==='pool'?t("searching"):t("findPool")}</button>{matchmaking&&<button type="button" className="arena-back-btn" onClick={cancelRandomMatch}>{t("cancel")}</button>}</div>}
          {onlineAction==='search'&&<div className="player-search-box"><div className="player-search-row"><input value={friendSearch} onChange={e=>setFriendSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchPlayers()} placeholder={t("searchPlaceholder")}/><button type="button" onClick={searchPlayers}>{searchingPlayers?t("searching"):t("search")}</button></div><div className="player-search-results">{searchResults.map(player=><article className="player-result-card" key={'pool-'+player.id}><PlayerAvatar user={player} name={player.name} color="#38bdf8"/><div><strong>{player.name}</strong><small>{t("playerId")}: {String(player.id).slice(-8)}</small></div><div className="player-result-actions"><button onClick={()=>sendFriendRequest(player)} disabled={friendRequestStatus[player.id]==='sent'}>{friendRequestStatus[player.id]==='sent'?t("sent"):t("friend")}</button><button onClick={()=>challengePlayer(player,'pool')}>{t("challenge")}</button></div></article>)}</div></div>}
          {(onlineAction==='join'||onlineAction==='create')&&<label className="setup-bet-label online-room-label">{t("roomCode")} <input value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase())} placeholder="SAM-123456"/><span>{onlineAction==='create'?t("shareCode"):t("enterCode")}</span></label>}
        </div>}
        <label className="setup-bet-label">{t("yourBet")} <input aria-label="Pool bet" type="number" min="1" max={opponentType==='computer'?100:undefined} step="1" value={betAmount} onChange={e=>changeBet(e.target.value)}/><span>{t("coins")}</span></label>
        <div className="ludo-prize-preview"><div><small>{t("yourStake")}</small><strong>{betAmount} {t("coins")}</strong></div><div><small>{t("winPayout")}</small><strong>{betAmount*2} {t("coins")}</strong></div></div>
        {opponentType==='computer'&&<p className="setup-stake-note">{t("maxAI")}</p>}
        <p className="setup-stake-note">{t("stakeNote")}</p>
        <button className="start-match-btn" onClick={()=>opponentType==='computer'?startMatch('pool'):(onlineAction==='random'?findRandomMatch('pool'):startMatch('pool'))}>{opponentType==='computer'?t("playPoolAI"):t("startOnlinePool")}</button>
        {notice.text&&<p className="setup-error" role="alert">{notice.text}</p>}
      </section></div>}

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="arena-main-header">
        <div>
          <div className="arena-brand">
            🎮 SAMATKAAR
          </div>

          <h1>
            {t("gamingArena")}
          </h1>

          <p>
            {t("tagline")}
          </p>
        </div>

        <div className="arena-real-balance">
          <span>
            {t("realBalance")}
          </span>

          <strong>
            🪙{" "}
            {Number(coins).toLocaleString()}
          </strong>

          <small>
            Coins
          </small>
        </div>
      </header>

      {/* =================================================
          NOTICE
      ================================================= */}

      {notice.text && (
        <div
          className={`arena-notice ${notice.type}`}
        >
          {notice.text}
        </div>
      )}

      {/* =================================================
          RESULT
      ================================================= */}

      {matchResult && (
        <div
          className={`match-result ${
            matchResult.winner ===
            "user"
              ? "result-win"
              : "result-loss"
          }`}
        >
          <div className="result-icon">
            {matchResult.winner ===
            "user"
              ? "🏆"
              : "🤖"}
          </div>

          <div>
            <strong>
              {matchResult.winner ===
              "user"
                ? "You Won!"
                : "Computer Won"}
            </strong>

            <p>
              {matchResult.winner ===
              "user"
                ? `+${matchResult.amount} coins App balance mein add ho gaye.`
                : "Is match ki bet lose ho gayi."}
            </p>
          </div>

          <button
            onClick={() =>
              setMatchResult(null)
            }
          >
            Continue
          </button>
        </div>
      )}

      {/* =================================================
          TABS
      ================================================= */}

      <div className="arena-tabs">
        <button
          className={
            activeTab === "lobby"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("lobby")
          }
        >
          {t("gameLobby")}
        </button>

        <button
          className={
            activeTab === "earn"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("earn")
          }
        >
          {t("earnCoins")}
        </button>

        <button
          className={
            activeTab === "wallet"
              ? "active"
              : ""
          }
          onClick={() =>
            navigate
              ? navigate("wallet")
              : setActiveTab(
                  "wallet"
                )
          }
        >
          {t("wallet")}
        </button>
      </div>

      {/* =================================================
          EARN
      ================================================= */}

      {activeTab === "earn" && (
        <div className="arena-embedded-page">
          <Earn
            addCoins={addCoins}
            user={user}
            navigate={navigate}
          />
        </div>
      )}

      {/* =================================================
          LOBBY
      ================================================= */}

      {activeTab === "lobby" && (
        <main className="arena-content">
          <section className="arena-hero-card">
            <div>
              <span className="arena-live-pill">
                ● LIVE ARENA
              </span>

              <h2>
                {t("chooseGame")}
              </h2>

              <p>
                Apne real SAMATKAAR coins
                se game khelo. Bet start
                hone par App.jsx ke actual
                balance se deduct hogi.
              </p>
            </div>

            <div className="arena-hero-coin">
              🪙
            </div>
          </section>

          {/* =================================================
              GAME CARDS
          ================================================= */}

          <section className="game-selection">
            <button
              className="game-card"
              onClick={() =>
                setLudoSetup(true)
              }
            >
              <div className="game-card-icon">
                🎲
              </div>

              <div className="game-card-content">
                <span>
                  {t("strategy")}
                </span>

                <h3>
                  Ludo
                </h3>

                <p>
                  {t("ludoDesc")}
                </p>
              </div>

              <div className="game-card-arrow">
                →
              </div>
            </button>

            <button
              className="game-card"
              onClick={() =>
                setPoolSetup(true)
              }
            >
              <div className="game-card-icon">
                🎱
              </div>

              <div className="game-card-content">
                <span>
                  {t("skill")}
                </span>

                <h3>
                  8 Ball Pool
                </h3>

                <p>
                  {t("poolDesc")}
                </p>
              </div>

              <div className="game-card-arrow">
                →
              </div>
            </button>
            <div className="coming-games-grid" aria-label="Coming soon games">
              {[
                ["🏏","Cricket Clash"],
                ["⚽","Penalty King"],
                ["🏎️","Turbo Racing"],
                ["♟️","Chess Arena"]
              ].map(([icon,name])=><div className="game-card coming-game-card" key={name}>
                <div className="game-card-icon">{icon}</div>
                <div className="game-card-content"><span>NEW GAME</span><h3>{name}</h3><p>Coming Soon</p></div>
                <div className="coming-soon-pill">COMING SOON</div>
              </div>)}
            </div>
          </section>

          {/* =================================================
              {t("matchSetup")}
          ================================================= */}

          <section className="arena-setup-card">
            <div className="setup-heading">
              <div>
                <span>
                  {t("matchSetup")}
                </span>

                <h2>
                  {t("configure")}
                </h2>
              </div>

              <div className="setup-balance">
                🪙{" "}
                {Number(
                  coins
                ).toLocaleString()}
              </div>
            </div>

            <div className="setup-grid">
              {/* {t("opponent")} */}

              <div className="setup-section">
                <label>
                  {t("opponent")}
                </label>

                <div className="opponent-options">
                  <button
                    className={
                      opponentType ===
                      "computer"
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setOpponentType(
                        "computer"
                      )
                    }
                  >
                    <span>
                      🤖
                    </span>

                    <div>
                      <strong>
                        Computer
                      </strong>

                      <small>
                        {t("playAI")}
                      </small>
                    </div>
                  </button>

                  <button
                    className={
                      opponentType ===
                      "friend"
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setOpponentType(
                        "friend"
                      )
                    }
                  >
                    <span>
                      👥
                    </span>

                    <div>
                      <strong>
                        {t("friendOnline")}
                      </strong>

                      <small>
                        {t("realOnline")}
                      </small>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bet */}

              <div className="setup-section">
                <label>
                  {t("betAmount")}
                </label>

                <div className="bet-options">
                  {[10, 25, 50, 100].map(
                    (amount) => (
                      <button
                        key={amount}
                        className={
                          betAmount ===
                          amount
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          changeBet(
                            amount
                          )
                        }
                      >
                        {amount}
                      </button>
                    )
                  )}
                </div>

                <div className="custom-bet">
                  <input
                    type="number"
                    min="1"
                    value={
                      customBet
                    }
                    onChange={
                      handleCustomBet
                    }
                    placeholder={t("customBet")}
                  />

                  <span>
                    coins
                  </span>
                </div>
              </div>
            </div>

            {/* Friend room */}

            {opponentType ===
              "friend" && (
              <div className="friend-room-box">
                <div>
                  <strong>
                    🌐 Friend Room
                  </strong>

                  <p>
                    Real online match ke
                    liye backend synchronization
                    required hai.
                  </p>
                </div>

                <input
                  value={roomCode}
                  onChange={(event) =>
                    setRoomCode(
                      event.target.value
                    )
                  }
                  placeholder="Enter room code"
                />
              </div>
            )}

            {/* Selected bet preview */}

            <div className="bet-preview">
              <div>
                <span>
                  {t("currentBalance")}
                </span>

                <strong>
                  🪙{" "}
                  {Number(
                    coins
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="preview-arrow">
                →
              </div>

              <div>
                <span>
                  {t("afterBet")}
                </span>

                <strong>
                  🪙{" "}
                  {Math.max(
                    0,
                    Number(coins) -
                      Number(
                        betAmount
                      )
                  ).toLocaleString()}
                </strong>
              </div>

              <div>
                <span>
                  {t("potentialWin")}
                </span>

                <strong className="potential-win">
                  +🪙{" "}
                  {(
                    Number(
                      betAmount
                    ) * 2
                  ).toLocaleString()}
                </strong>
              </div>
            </div>

            <button
              className="start-match-btn"
              onClick={() =>
                setLudoSetup(true)
              }
            >
              {t("startLudo")}
            </button>

            <div className="pool-start-row">
              <button className="start-secondary-btn" onClick={() => setPoolSetup(true)}>{t("playPool")}</button>
              <button className="start-secondary-btn realtime-btn" disabled={matchmaking} onClick={()=>findRandomMatch("pool")}>{matchmaking&&matchmakingGame==='pool'?'⏳ Searching Pool Player…':'🌐 Random 1v1 Pool'}</button>
            </div>
            <div className="quick-player-search"><strong>{t("findReal")}</strong><div><input value={friendSearch} onChange={e=>setFriendSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchPlayers()} placeholder={t("searchPlaceholder")}/><button onClick={searchPlayers}>{searchingPlayers?'…':'Search'}</button></div>{searchResults.slice(0,4).map(player=><article className="player-result-card" key={'quick-'+player.id}><PlayerAvatar user={player} name={player.name} color="#38bdf8"/><div><strong>{player.name}</strong><small>{t("onlinePlayer")}</small></div><div className="player-result-actions"><button onClick={()=>sendFriendRequest(player)} disabled={friendRequestStatus[player.id]==='sent'}>{friendRequestStatus[player.id]==='sent'?'✓ Sent':'＋ Friend'}</button><button onClick={()=>challengePlayer(player,'ludo')}>🎲 Ludo</button><button onClick={()=>challengePlayer(player,'pool')}>🎱 Pool</button></div></article>)}</div>

            <p className="coin-warning">
              {t("stakeWarning")}
            </p>
          </section>

          {/* =================================================
              FAIRNESS
          ================================================= */}

          <section className="fairness-card">
            <div className="fairness-icon">
              🔐
            </div>

            <div>
              <h3>
                {t("fairness")}
              </h3>

              <p>
                {t("fairnessText")}
              </p>

              <small>
                {t("fairnessSmall")}
              </small>
            </div>
          </section>
        </main>
      )}

      {activeTab ===
        "wallet" && (
        <div className="arena-wallet-message">
          <h2>
            💰 Your Wallet
          </h2>

          <p>
            Tumhara actual balance:
          </p>

          <strong>
            🪙{" "}
            {Number(
              coins
            ).toLocaleString()}
          </strong>

          <button
            onClick={() =>
              navigate
                ? navigate("wallet")
                : setActiveTab(
                    "lobby"
                  )
            }
          >
            Open Main Wallet
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MAIN ARENA STYLES
========================================================= */

const REALTIME_ARENA_STYLES = `
.realtime-overlay{position:fixed;inset:0;background:#020617d9;z-index:99999;display:grid;place-items:center;padding:18px;backdrop-filter:blur(8px)}
.challenge-modal{width:min(480px,100%);background:linear-gradient(145deg,#111827,#0f172a);border:1px solid #334155;border-radius:24px;padding:28px;color:#fff;box-shadow:0 30px 80px #000a;text-align:center}.challenge-kicker{font:900 11px system-ui;letter-spacing:.18em;color:#38bdf8}.challenge-modal h2{margin:10px 0}.challenge-modal p{color:#cbd5e1}.challenge-modal>div{display:flex;gap:10px;justify-content:center;margin-top:20px}.challenge-modal button{border:1px solid #475569;background:#1e293b;color:#fff;border-radius:12px;padding:12px 18px;font-weight:800;cursor:pointer}.challenge-modal button.accept{background:#16a34a;border-color:#22c55e}
.online-match-banner{position:fixed;top:70px;right:18px;z-index:9000;width:min(360px,calc(100vw - 36px));background:#07111f;border:1px solid #22c55e;border-radius:18px;padding:16px 42px 16px 18px;color:#fff;box-shadow:0 20px 50px #0009;display:grid;gap:4px}.online-match-banner span{font:900 10px system-ui;letter-spacing:.15em;color:#4ade80}.online-match-banner strong{font-size:18px}.online-match-banner small{color:#94a3b8}.online-match-banner button{position:absolute;right:10px;top:10px;border:0;background:#1e293b;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer}
.realtime-random-box,.player-search-box,.quick-player-search{margin-top:12px;padding:14px;border:1px solid #334155;border-radius:16px;background:#0b1220}.realtime-random-box p{margin:6px 0 12px;color:#94a3b8}.player-search-row,.quick-player-search>div{display:flex;gap:8px}.player-search-row input,.quick-player-search input{flex:1;min-width:0;background:#020617;border:1px solid #334155;border-radius:11px;padding:12px;color:#fff}.player-search-row button,.quick-player-search>div>button{border:0;border-radius:11px;padding:0 16px;background:#2563eb;color:#fff;font-weight:800}.player-search-results{display:grid;gap:8px;margin-top:10px}.player-result-card{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #263449;border-radius:14px;background:#101827}.player-result-card>.player-avatar{width:42px;height:42px;flex:0 0 42px}.player-result-card>div:nth-child(2){min-width:0;flex:1;display:grid}.player-result-card small{color:#94a3b8}.player-result-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.player-result-actions button{border:1px solid #334155;background:#172033;color:#e2e8f0;border-radius:9px;padding:7px 9px;font-weight:800;cursor:pointer}.player-result-actions button:last-child{background:#1d4ed8;border-color:#3b82f6}.realtime-btn{border-color:#0ea5e9!important}.quick-player-search{margin-top:14px}.quick-player-search>strong{display:block;margin-bottom:9px}.quick-player-search .player-result-card{margin-top:8px}@media(max-width:650px){.player-result-card{align-items:flex-start;flex-wrap:wrap}.player-result-actions{width:100%;justify-content:flex-start}.online-match-banner{top:58px;right:10px;width:calc(100vw - 20px)}}
`;

const ARENA_STYLES = `
.gaming-arena,
.arena-game-page {
  min-height: 100vh;
  background:
    radial-gradient(
      circle at 20% 0%,
      rgba(14,165,233,0.12),
      transparent 30%
    ),
    #020617;
  color: #f8fafc;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  padding-bottom: 50px;
}

.arena-main-header {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 38px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.arena-brand {
  color: #38bdf8;
  font-weight: 900;
  letter-spacing: 2px;
  font-size: 12px;
}

.arena-main-header h1 {
  margin: 8px 0 5px;
  font-size: clamp(30px, 5vw, 48px);
  letter-spacing: -1.5px;
}

.arena-main-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.arena-real-balance {
  min-width: 160px;
  padding: 15px 18px;
  border-radius: 16px;
  border: 1px solid rgba(56,189,248,0.18);
  background: rgba(15,23,42,0.8);
  text-align: right;
  box-shadow: 0 15px 40px rgba(0,0,0,0.22);
}

.arena-real-balance span {
  display: block;
  color: #64748b;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
}

.arena-real-balance strong {
  display: block;
  color: #f8fafc;
  margin-top: 5px;
  font-size: 22px;
}

.arena-real-balance small {
  color: #38bdf8;
}

.arena-notice {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto 18px;
  padding: 13px 16px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.5;
}

.arena-notice.error {
  background: rgba(127,29,29,0.35);
  border: 1px solid rgba(248,113,113,0.25);
  color: #fecaca;
}

.arena-notice.info {
  background: rgba(2,132,199,0.12);
  border: 1px solid rgba(56,189,248,0.18);
  color: #bae6fd;
}

.arena-notice.success {
  background: rgba(20,83,45,0.35);
  border: 1px solid rgba(74,222,128,0.25);
  color: #bbf7d0;
}

.arena-tabs {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto 25px;
  display: flex;
  gap: 7px;
  padding: 5px;
  border-radius: 13px;
  background: rgba(15,23,42,0.75);
  border: 1px solid rgba(148,163,184,0.1);
}

.arena-tabs button {
  flex: 1;
  border: 0;
  border-radius: 9px;
  padding: 12px;
  background: transparent;
  color: #64748b;
  font-weight: 800;
  cursor: pointer;
}

.arena-tabs button.active {
  color: #fff;
  background: linear-gradient(
    135deg,
    #0369a1,
    #0284c7
  );
}

.arena-content {
  width: min(1180px, calc(100% - 32px));
  margin: auto;
}

.arena-hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
  padding: 30px;
  border-radius: 22px;
  border: 1px solid rgba(56,189,248,0.15);
  background:
    linear-gradient(
      135deg,
      rgba(14,165,233,0.12),
      rgba(15,23,42,0.9)
    );
  margin-bottom: 20px;
}

.arena-live-pill {
  color: #7dd3fc;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 1.5px;
}

.arena-hero-card h2 {
  margin: 9px 0;
  font-size: 28px;
}

.arena-hero-card p {
  max-width: 650px;
  margin: 0;
  color: #94a3b8;
  line-height: 1.6;
  font-size: 13px;
}

.arena-hero-coin {
  width: 80px;
  height: 80px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245,158,11,0.12);
  font-size: 40px;
}

.game-selection {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.game-card {
  display: flex;
  align-items: center;
  gap: 17px;
  padding: 22px;
  text-align: left;
  border: 1px solid rgba(148,163,184,0.12);
  border-radius: 18px;
  background: rgba(15,23,42,0.8);
  color: #fff;
  cursor: pointer;
  transition: transform .18s ease, border-color .18s ease;
}

.game-card:hover {
  transform: translateY(-2px);
  border-color: rgba(56,189,248,0.35);
}

.game-card-icon {
  width: 58px;
  height: 58px;
  flex-shrink: 0;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(56,189,248,0.09);
  font-size: 29px;
}

.game-card-content {
  flex: 1;
}

.game-card-content span {
  color: #38bdf8;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 1px;
}

.game-card-content h3 {
  margin: 4px 0;
  font-size: 21px;
}

.game-card-content p {
  margin: 0;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
}

.game-card-arrow {
  color: #38bdf8;
  font-size: 22px;
}

.arena-setup-card {
  padding: 25px;
  border-radius: 20px;
  background: rgba(15,23,42,0.8);
  border: 1px solid rgba(148,163,184,0.12);
}

.setup-heading {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  margin-bottom: 23px;
}

.setup-heading span {
  color: #64748b;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 1.3px;
}

.setup-heading h2 {
  margin: 4px 0 0;
  font-size: 22px;
}

.setup-balance {
  color: #fbbf24;
  font-size: 18px;
  font-weight: 900;
}

.setup-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.setup-section > label {
  display: block;
  margin-bottom: 9px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 800;
}

.opponent-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.opponent-options button {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px;
  text-align: left;
  border-radius: 11px;
  border: 1px solid rgba(148,163,184,0.12);
  background: #0b1220;
  color: #fff;
  cursor: pointer;
}

.opponent-options button.selected {
  border-color: #38bdf8;
  background: rgba(14,165,233,0.1);
}

.opponent-options button > span {
  font-size: 22px;
}

.opponent-options strong,
.opponent-options small {
  display: block;
}

.opponent-options strong {
  font-size: 11px;
}

.opponent-options small {
  margin-top: 3px;
  color: #64748b;
  font-size: 9px;
}

.bet-options {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.bet-options button {
  min-width: 60px;
  padding: 10px;
  border-radius: 9px;
  border: 1px solid rgba(148,163,184,0.12);
  background: #0b1220;
  color: #cbd5e1;
  cursor: pointer;
  font-weight: 800;
}

.bet-options button.selected {
  color: #fff;
  border-color: #38bdf8;
  background: rgba(14,165,233,0.14);
}

.custom-bet {
  position: relative;
  margin-top: 9px;
}

.custom-bet input {
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  padding: 0 65px 0 12px;
  border-radius: 9px;
  border: 1px solid #334155;
  background: #020617;
  color: #fff;
  outline: none;
}

.custom-bet span {
  position: absolute;
  right: 11px;
  top: 12px;
  color: #64748b;
  font-size: 10px;
}

.friend-room-box {
  margin-top: 20px;
  padding: 15px;
  border-radius: 12px;
  border: 1px solid rgba(56,189,248,0.18);
  background: rgba(14,165,233,0.06);
  display: flex;
  justify-content: space-between;
  gap: 15px;
  align-items: center;
}

.friend-room-box strong {
  font-size: 12px;
}

.friend-room-box p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 10px;
}

.friend-room-box input {
  width: 200px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #334155;
  background: #020617;
  color: #fff;
}

.bet-preview {
  margin-top: 22px;
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr auto 1fr 1fr;
  gap: 15px;
  align-items: center;
  border-radius: 13px;
  background: rgba(2,6,23,0.65);
  border: 1px solid rgba(148,163,184,0.08);
}

.bet-preview span {
  display: block;
  color: #64748b;
  font-size: 9px;
  font-weight: 800;
}

.bet-preview strong {
  display: block;
  margin-top: 5px;
  font-size: 15px;
}

.preview-arrow {
  color: #475569;
}

.potential-win {
  color: #4ade80;
}

.start-match-btn,
.start-secondary-btn {
  width: 100%;
  margin-top: 18px;
  padding: 14px;
  border: 0;
  border-radius: 11px;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.start-match-btn {
  background: linear-gradient(
    135deg,
    #0369a1,
    #0ea5e9
  );
}

.start-secondary-btn {
  margin-top: 8px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(148,163,184,0.12);
}

.coin-warning {
  margin: 13px 0 0;
  color: #64748b;
  text-align: center;
  font-size: 9px;
}

.fairness-card {
  display: flex;
  gap: 15px;
  margin-top: 18px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid rgba(148,163,184,0.1);
  background: rgba(15,23,42,0.55);
}

.fairness-icon {
  font-size: 25px;
}

.fairness-card h3 {
  margin: 0;
  font-size: 14px;
}

.fairness-card p {
  margin: 5px 0;
  color: #64748b;
  font-size: 10px;
  line-height: 1.5;
}

.fairness-card small {
  color: #475569;
  font-size: 9px;
}

.match-result {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto 18px;
  padding: 17px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-radius: 15px;
}

.match-result.result-win {
  background: rgba(20,83,45,0.3);
  border: 1px solid rgba(74,222,128,0.22);
}

.match-result.result-loss {
  background: rgba(127,29,29,0.25);
  border: 1px solid rgba(248,113,113,0.18);
}

.result-icon {
  font-size: 30px;
}

.match-result strong {
  font-size: 15px;
}

.match-result p {
  margin: 4px 0 0;
  color: #94a3b8;
  font-size: 10px;
}

.match-result button {
  margin-left: auto;
  padding: 9px 14px;
  border: 0;
  border-radius: 8px;
  background: rgba(255,255,255,0.08);
  color: #fff;
  cursor: pointer;
}

.arena-wallet-message {
  width: min(500px, calc(100% - 32px));
  margin: 60px auto;
  padding: 35px;
  border-radius: 20px;
  text-align: center;
  background: #0f172a;
  border: 1px solid #1e293b;
}

.arena-wallet-message strong {
  display: block;
  margin: 15px;
  font-size: 30px;
  color: #fbbf24;
}

.arena-wallet-message button {
  padding: 11px 18px;
  border: 0;
  border-radius: 9px;
  background: #0284c7;
  color: #fff;
  cursor: pointer;
  font-weight: 800;
}

.arena-embedded-page {
  width: min(1180px, calc(100% - 32px));
  margin: auto;
}

/* GAME HEADER */

.arena-game-page {
  padding: 20px;
}

.arena-game-header {
  width: min(1200px, 100%);
  margin: 0 auto 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.arena-game-title {
  font-size: 24px;
  font-weight: 900;
}

.arena-game-subtitle {
  margin-top: 3px;
  color: #64748b;
  font-size: 10px;
}

.arena-back-btn {
  padding: 9px 13px;
  border: 1px solid rgba(148,163,184,0.14);
  border-radius: 9px;
  background: rgba(255,255,255,0.05);
  color: #cbd5e1;
  cursor: pointer;
}

.arena-bet-badge {
  padding: 8px 11px;
  border-radius: 999px;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.2);
  color: #fbbf24;
  font-size: 11px;
  font-weight: 900;
}

/* LUDO */

.ludo-layout {
  width: min(1200px, 100%);
  margin: auto;
  display: grid;
  grid-template-columns: minmax(500px, 1fr) 300px;
  gap: 20px;
  align-items: start;
}

.ludo-board-shell {
  padding: 14px;
  border-radius: 22px;
  background: #111827;
  border: 1px solid rgba(148,163,184,0.12);
  box-shadow: 0 20px 50px rgba(0,0,0,0.25);
}

.ludo-board {
  width: 100%;
  aspect-ratio: 1;
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  grid-template-rows: repeat(15, 1fr);
  position: relative;
  overflow: hidden;
  border-radius: 13px;
  background: #f8fafc;
}

.ludo-cell {
  position: relative;
  border: 1px solid rgba(15,23,42,0.08);
  box-sizing: border-box;
}

.ludo-track {
  background: #ffffff;
}

.ludo-home-red {
  background: #fecaca;
}

.ludo-home-green {
  background: #bbf7d0;
}

.ludo-home-yellow {
  background: #fef08a;
}

.ludo-home-blue {
  background: #bfdbfe;
}

.ludo-safe {
  background: #e0f2fe;
}

.ludo-center {
  background: conic-gradient(
    #ef4444 0 25%,
    #22c55e 25% 50%,
    #3b82f6 50% 75%,
    #eab308 75% 100%
  );
}

.safe-star {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #0f172a;
  font-size: clamp(7px, 1.2vw, 13px);
}

.ludo-token {
  width: 70%;
  height: 70%;
  align-self: center;
  justify-self: center;
  border-radius: 50%;
  z-index: 5;
  cursor: default;
  font-size: clamp(7px, 1vw, 11px);
  font-weight: 900;
  color: #fff;
  border: 2px solid rgba(255,255,255,0.75);
  box-shadow: 0 4px 8px rgba(0,0,0,0.25);
}

.ludo-token.user-token {
  background: #dc2626;
}

.ludo-token.ai-token {
  background: #2563eb;
}

.ludo-token.legal-token {
  cursor: pointer;
  animation: ludoTokenPulse 1s infinite;
  box-shadow:
    0 0 0 3px rgba(56,189,248,0.25),
    0 0 20px rgba(56,189,248,0.7);
}

@keyframes ludoTokenPulse {
  50% {
    transform: scale(1.12);
  }
}

.ludo-side-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.arena-status-card,
.dice-card,
.ludo-rules-card {
  padding: 18px;
  border-radius: 16px;
  background: rgba(15,23,42,0.8);
  border: 1px solid rgba(148,163,184,0.1);
}

.status-label,
.dice-label {
  color: #64748b;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 1px;
}

.status-value {
  margin-top: 6px;
  font-size: 17px;
  font-weight: 900;
}

.arena-status-card p {
  color: #94a3b8;
  font-size: 10px;
  line-height: 1.5;
}

.dice-face {
  width: 76px;
  height: 76px;
  margin: 15px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 17px;
  background: #f8fafc;
  color: #020617;
  font-size: 35px;
  font-weight: 900;
}

.arena-primary-btn {
  width: 100%;
  padding: 12px;
  border: 0;
  border-radius: 9px;
  background: #0284c7;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.arena-primary-btn:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.ludo-rules-card h3 {
  margin: 0 0 9px;
  font-size: 13px;
}

.ludo-rules-card ul {
  margin: 0;
  padding-left: 16px;
  color: #64748b;
  font-size: 10px;
  line-height: 1.8;
}

/* POOL */

.pool-status-row {
  width: min(1200px, 100%);
  margin: 0 auto 13px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.pool-info-card {
  padding: 11px;
  border-radius: 11px;
  background: rgba(15,23,42,0.8);
  border: 1px solid rgba(148,163,184,0.1);
}

.pool-info-card span {
  display: block;
  color: #64748b;
  font-size: 8px;
  font-weight: 900;
}

.pool-info-card strong {
  display: block;
  margin-top: 4px;
  font-size: 13px;
}

.pool-table-wrap {
  width: min(1200px, 100%);
  margin: auto;
  overflow-x: auto;
  padding-bottom: 5px;
}

.pool-canvas {
  display: block;
  width: min(100%, 900px);
  height: auto;
  margin: auto;
  border-radius: 16px;
  touch-action: none;
  box-shadow: 0 25px 60px rgba(0,0,0,0.4);
}

.pool-controls {
  width: min(900px, 100%);
  margin: 15px auto;
  padding: 17px;
  box-sizing: border-box;
  border-radius: 15px;
  background: rgba(15,23,42,0.8);
  border: 1px solid rgba(148,163,184,0.1);
}

.pool-message {
  padding: 10px;
  border-radius: 9px;
  background: rgba(56,189,248,0.07);
  color: #bae6fd;
  font-size: 11px;
}

.pool-power {
  margin-top: 14px;
}

.pool-power label {
  color: #94a3b8;
  font-size: 10px;
}

.pool-power input {
  width: 100%;
  margin-top: 7px;
}

.ball-hand-notice {
  margin-top: 10px;
  padding: 10px;
  border-radius: 9px;
  background: rgba(245,158,11,0.09);
  color: #fcd34d;
  font-size: 10px;
}

.pool-rules {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 13px;
  color: #64748b;
  font-size: 9px;
}

.arena-secondary-btn {
  width: 100%;
  margin-top: 14px;
  padding: 10px;
  border-radius: 9px;
  border: 1px solid rgba(148,163,184,0.12);
  background: rgba(255,255,255,0.05);
  color: #cbd5e1;
  cursor: pointer;
}

@media (max-width: 850px) {
  .game-selection,
  .setup-grid {
    grid-template-columns: 1fr;
  }

  .ludo-layout {
    grid-template-columns: 1fr;
  }

  .ludo-side-panel {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .ludo-rules-card {
    grid-column: 1 / -1;
  }

  .arena-main-header {
    flex-direction: column;
  }

  .arena-real-balance {
    text-align: left;
  }

  .bet-preview {
    grid-template-columns: 1fr 1fr;
  }

  .preview-arrow {
    display: none;
  }
}

@media (max-width: 600px) {
  .arena-game-page {
    padding: 10px;
  }

  .arena-main-header {
    width: calc(100% - 20px);
  }

  .arena-content,
  .arena-tabs,
  .arena-notice {
    width: calc(100% - 20px);
  }

  .arena-tabs button {
    font-size: 9px;
    padding: 10px 5px;
  }

  .arena-hero-card {
    padding: 20px;
  }

  .arena-hero-coin {
    display: none;
  }

  .opponent-options {
    grid-template-columns: 1fr;
  }

  .friend-room-box {
    flex-direction: column;
    align-items: stretch;
  }

  .friend-room-box input {
    width: 100%;
    box-sizing: border-box;
  }

  .ludo-side-panel {
    grid-template-columns: 1fr;
  }

  .pool-status-row {
    grid-template-columns: 1fr 1fr;
  }

  .pool-status-row
    .pool-info-card:last-child {
    grid-column: 1 / -1;
  }

  .arena-game-header {
    flex-wrap: wrap;
  }

  .arena-game-title {
    font-size: 19px;
  }
}


/* =========================================================
   PREMIUM GAME EXPERIENCE
========================================================= */

.gaming-arena,
.arena-game-page {
  position: relative;
  overflow-x: hidden;
}

.arena-game-page {
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  padding:
    clamp(10px, 2vw, 24px)
    clamp(8px, 2vw, 28px)
    60px;
  background:
    radial-gradient(
      circle at 50% -10%,
      rgba(14,165,233,0.16),
      transparent 38%
    ),
    radial-gradient(
      circle at 0% 100%,
      rgba(168,85,247,0.09),
      transparent 34%
    ),
    #020617;
}

.arena-game-header {
  position: sticky;
  top: 0;
  z-index: 30;
  box-sizing: border-box;
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 18px;
  background:
    linear-gradient(
      180deg,
      rgba(2,6,23,0.96),
      rgba(2,6,23,0.78)
    );
  border: 1px solid rgba(148,163,184,0.12);
  backdrop-filter: blur(18px);
  box-shadow:
    0 12px 35px rgba(0,0,0,0.28);
}

.arena-exit-game-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 42px;
  padding: 0 15px;
  border-radius: 12px;
  color: #f8fafc;
  font-weight: 900;
  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,0.10),
      rgba(255,255,255,0.04)
    );
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.08);
  transition:
    transform .18s ease,
    border-color .18s ease,
    background .18s ease;
}

.arena-exit-game-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(248,113,113,0.38);
  background: rgba(127,29,29,0.22);
}

.ludo-board-shell {
  padding: clamp(8px, 1.4vw, 16px);
  border-radius: 28px;
  background:
    linear-gradient(
      145deg,
      rgba(30,41,59,0.98),
      rgba(2,6,23,0.98)
    );
  border:
    1px solid rgba(255,255,255,0.10);
  box-shadow:
    0 30px 80px rgba(0,0,0,0.48),
    0 0 55px rgba(14,165,233,0.08);
}

.ludo-token {
  transform-origin: center;
  transition:
    transform .18s ease,
    filter .18s ease;
  box-shadow:
    0 6px 13px rgba(0,0,0,0.32),
    inset 0 2px 4px rgba(255,255,255,0.42);
}

.ludo-token.user-token {
  background:
    radial-gradient(
      circle at 35% 25%,
      #fb7185,
      #dc2626 52%,
      #7f1d1d
    );
}

.ludo-token.ai-token {
  background:
    radial-gradient(
      circle at 35% 25%,
      #60a5fa,
      #2563eb 52%,
      #1e3a8a
    );
}

@keyframes ludoTokenGlow {
  50% {
    filter:
      brightness(1.25)
      drop-shadow(
        0 0 12px
        rgba(56,189,248,0.95)
      );
  }
}

.ludo-token.legal-token {
  animation:
    ludoTokenPulse 850ms infinite,
    ludoTokenGlow 1300ms infinite;
}

.dice-card {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(56,189,248,0.13),
      transparent 60%
    ),
    rgba(15,23,42,0.86);
}

.dice-face {
  box-shadow:
    0 14px 35px rgba(0,0,0,0.28),
    inset 0 0 0 1px rgba(15,23,42,0.10);
}

.arena-primary-btn {
  min-height: 46px;
  background:
    linear-gradient(
      135deg,
      #0284c7,
      #2563eb 55%,
      #7c3aed
    );
  box-shadow:
    0 10px 24px rgba(37,99,235,0.22);
  transition:
    transform .18s ease,
    filter .18s ease;
}

.arena-primary-btn:not(:disabled):hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

/* =========================================================
   PREMIUM 8-BALL TABLE
========================================================= */

.pool-table-wrap {
  position: relative;
  padding: clamp(7px, 1.2vw, 14px);
  border-radius: 28px;
  background:
    linear-gradient(
      145deg,
      #3b2414,
      #120b06 42%,
      #3b2414
    );
  border:
    1px solid rgba(251,191,36,0.16);
  box-shadow:
    0 35px 100px rgba(0,0,0,0.55),
    0 0 70px rgba(14,165,233,0.08);
}

.pool-canvas {
  width: 100%;
  max-width: 1200px;
  margin: auto;
  border-radius: 18px;
  box-shadow:
    inset 0 0 0 2px rgba(255,255,255,0.08),
    0 18px 55px rgba(0,0,0,0.46);
}

.pool-info-card {
  background:
    linear-gradient(
      145deg,
      rgba(15,23,42,0.96),
      rgba(2,6,23,0.86)
    );
  box-shadow:
    0 12px 30px rgba(0,0,0,0.20);
}

.pool-controls {
  background:
    linear-gradient(
      145deg,
      rgba(15,23,42,0.96),
      rgba(2,6,23,0.90)
    );
  box-shadow:
    0 18px 50px rgba(0,0,0,0.30);
}

/* =========================================================
   EXIT CONFIRMATION
========================================================= */

.match-exit-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0,0,0,0.76);
  backdrop-filter: blur(12px);
}

.match-exit-modal {
  width: min(430px, 100%);
  box-sizing: border-box;
  padding: 30px;
  border-radius: 24px;
  text-align: center;
  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(248,113,113,0.12),
      transparent 45%
    ),
    linear-gradient(
      145deg,
      #111827,
      #020617
    );
  border:
    1px solid rgba(248,113,113,0.25);
  box-shadow:
    0 35px 100px rgba(0,0,0,0.65),
    0 0 45px rgba(239,68,68,0.10);
  animation:
    exitModalIn .18s ease-out;
}

@keyframes exitModalIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.match-exit-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: rgba(245,158,11,0.10);
  font-size: 30px;
}

.match-exit-kicker {
  color: #f87171;
  font-size: 9px;
  font-weight: 1000;
  letter-spacing: 2px;
}

.match-exit-modal h2 {
  margin: 8px 0;
  font-size: 25px;
}

.match-exit-modal p {
  margin: 0 auto;
  max-width: 330px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.65;
}

.match-exit-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 22px;
}

.match-exit-actions button {
  min-height: 46px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 900;
  transition:
    transform .18s ease,
    filter .18s ease;
}

.match-exit-actions button:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
}

.match-stay-btn {
  border:
    1px solid rgba(56,189,248,0.22);
  background:
    rgba(14,165,233,0.10);
  color: #bae6fd;
}

.match-exit-confirm-btn {
  border:
    1px solid rgba(248,113,113,0.28);
  background:
    linear-gradient(
      135deg,
      #991b1b,
      #dc2626
    );
  color: #fff;
}

/* =========================================================
   FULLSCREEN / MOBILE
========================================================= */

@media (min-width: 1000px) {
  .arena-game-page {
    padding-left: 24px;
    padding-right: 24px;
  }

  .ludo-layout {
    grid-template-columns:
      minmax(650px, 1fr)
      320px;
  }

  .ludo-board-shell {
    width: min(
      calc(100vh - 190px),
      860px
    );
    justify-self: center;
  }
}

@media (max-width: 850px) {
  .arena-game-page {
    min-height: 100svh;
  }

  .ludo-layout {
    width: 100%;
  }

  .ludo-board-shell {
    width: 100%;
  }

  .pool-table-wrap {
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }
}

@media (max-width: 600px) {
  .arena-game-header {
    top: 5px;
    margin-bottom: 10px;
    border-radius: 14px;
  }

  .arena-game-title {
    font-size: 18px;
  }

  .arena-game-subtitle {
    font-size: 9px;
  }

  .arena-bet-badge {
    font-size: 10px;
  }

  .arena-exit-game-btn {
    min-height: 38px;
    padding: 0 11px;
    font-size: 10px;
  }

  .ludo-board-shell {
    padding: 6px;
    border-radius: 18px;
  }

  .pool-table-wrap {
    padding: 5px;
    border-radius: 18px;
  }

  .pool-canvas {
    border-radius: 12px;
  }

  .match-exit-modal {
    padding: 24px 18px;
    border-radius: 20px;
  }

  .match-exit-actions {
    grid-template-columns: 1fr;
  }
}
`;

/* =========================================================
   LUDO EXTRA STYLES
========================================================= */

const GAME_POLISH = `
.arena-game-page * {box-sizing:border-box}
.arena-game-page {width:100%;min-height:100dvh;background:radial-gradient(ellipse at center,#284b25,#061b15);color:#fff}
.arena-game-header {padding:10px 0;max-width:1280px}
.arena-back-btn {background:linear-gradient(#334155,#182535);border:1px solid #62748c;border-radius:12px;padding:12px 18px;color:#fff;font-weight:700;cursor:pointer}
.ludo-stage {width:min(78vh,740px,100%);margin:auto}
.ludo-board-shell {width:100%;padding:9px;border:3px solid #b9885b;border-radius:28px;background:#ac774b;box-shadow:0 18px 50px #0008}
.ludo-board {display:grid;grid-template:repeat(15,1fr)/repeat(15,1fr);aspect-ratio:1;position:relative;isolation:isolate;border-radius:17px;overflow:hidden;width:100%;background:white}
.ludo-cell {border:1px solid #26302d;position:relative}
.home-inset {z-index:1;background:#0003;border-radius:22%;pointer-events:none}
.center-triangles {grid-area:7 / 7 / 10 / 10;z-index:3;background:conic-gradient(from -45deg,#35bc43 0deg 90deg,#f74448 90deg 180deg,#4e87e8 180deg 270deg,#f5dc29 270deg 360deg);border:2px solid #182b22}
.ludo-token {position:relative;z-index:6;width:86%;height:86%;align-self:center;justify-self:center;margin:0;padding:0;border:3px solid #ffe257;border-radius:50%;color:#fff;font-size:clamp(9px,2vw,24px);box-shadow:inset 0 3px 4px #fff8,0 4px 0 #a37814,0 5px 5px #0007;opacity:1;transition:grid-row 75ms,grid-column 75ms;min-width:0;min-height:0}
.ludo-token:disabled {opacity:1}
.ludo-token.legal-token {cursor:pointer;animation:ludoGlow .8s infinite alternate}
@keyframes ludoGlow {to{box-shadow:0 0 0 4px white,0 0 20px #fff}}
.safe-star {display:grid;place-items:center;height:100%;font-size:clamp(10px,2vw,25px);color:#596268}
.ludo-player-row {display:flex;justify-content:space-between;gap:12px;margin:13px 0}
.ludo-player {display:flex;align-items:center;gap:10px;width:48%;min-width:0;border-radius:16px;padding:8px;background:#00170a99;border:2px solid transparent}
.current-player {border-color:var(--player-color);box-shadow:0 0 22px #d7f56b22}
.player-avatar {width:58px;height:58px;flex-shrink:0;border-radius:50%;overflow:hidden;border:3px solid #ddd;display:grid;place-items:center;background:linear-gradient(135deg,#394867,#142331);font-size:28px}
.player-avatar.is-active {border-color:var(--player-color);box-shadow:0 0 10px var(--player-color)}
.player-avatar img {width:100%;height:100%;object-fit:cover}
.player-name {flex:1;min-width:0;font-size:14px;font-weight:800;overflow:hidden;text-overflow:ellipsis}
.player-name small,.pool-player small,.pool-prize small {display:block;font-size:11px;color:#cbd5e1;margin-top:5px}
.corner-dice {width:55px;height:55px;flex-shrink:0;display:grid;place-items:center;font-family:serif;font-size:48px;line-height:1;padding:0;border:4px solid var(--player-color);border-radius:12px;background:#f9f4dc;color:#17212a;box-shadow:0 4px 0 #0006;cursor:pointer}
.corner-dice:disabled {opacity:.55;cursor:default}
.current-player .corner-dice:disabled {opacity:1}
.dice-rolling {animation:diceShake .12s infinite alternate}
@keyframes diceShake {from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}
.ludo-live-status {text-align:center;padding:12px;background:#00150bcc;border-radius:12px;font-size:14px;min-height:44px}
.pool-player-bar {max-width:1100px;margin:12px auto;display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border:1px solid #526078;border-radius:20px;background:linear-gradient(#243044,#0a1220);gap:10px}
.pool-player {display:flex;align-items:center;gap:12px;font-size:16px}.pool-prize {text-align:center;color:#facc15;font-size:24px;font-weight:900}
.pool-canvas {width:min(100%,1200px);border:2px solid #5f737c;border-radius:24px;box-shadow:0 22px 65px #0009;touch-action:none}
.pool-table-wrap {max-width:1280px;width:100%;overflow:hidden}
.pool-controls {max-width:1200px}
.game-entry {position:fixed;inset:0;background:radial-gradient(circle,#143345,#020617);z-index:20000;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff}
.entry-spinner {width:70px;height:70px;border:4px solid #ffffff22;border-top-color:#38bdf8;border-bottom-color:#facc15;border-radius:50%;animation:entrySpin .8s linear infinite}
@keyframes entrySpin {to{transform:rotate(360deg)}}
.game-entry p {color:#94a3b8}
.match-exit-overlay {position:fixed;inset:0;z-index:21000;background:#000b;display:grid;place-items:center;padding:20px}
.match-exit-modal {width:min(420px,100%);background:#111d31;border:1px solid #52647e;border-radius:22px;padding:30px;color:#fff;text-align:center;box-shadow:0 25px 90px #000}
.match-exit-actions {display:flex;gap:10px;margin-top:22px}.match-exit-actions button {flex:1;padding:13px;border:0;border-radius:10px;color:white;font-weight:700;cursor:pointer}.match-stay-btn {background:#14854b}.match-exit-confirm-btn {background:#bb3547}
@media(min-width:1000px){.professional-ludo {padding:12px 24px}.ludo-stage {width:min(calc(100dvh - 310px),740px);min-width:420px}}
@media(max-width:600px){.arena-game-page {padding:8px}.ludo-stage {width:100%}.ludo-board-shell {padding:5px;border-radius:20px}.ludo-player {padding:5px;gap:5px}.player-avatar {width:40px;height:40px;font-size:22px}.player-name {font-size:11px}.corner-dice {width:42px;height:42px;font-size:35px;border-width:3px}.ludo-token {border-width:2px}.pool-player-bar {padding:9px}.pool-player {font-size:12px;gap:6px}.pool-prize {font-size:17px}.arena-game-title {font-size:19px}}
`;

const POOL_BALL_COLORS=['#f8fafc','#f5be24','#276bc9','#ef3b47','#8059c9','#ee792b','#38a972','#973f30','#111821'];
function PoolBallBadge({number,cleared=false}) {
  const color=POOL_BALL_COLORS[number===8?8:(number-1)%8+1];
  return <span className={`pool-ball-badge ${number>8?'badge-stripe':''} ${cleared?'badge-cleared':''}`} style={{'--ball-color':color}} aria-label={`${number}${cleared?' pocketed':''}`}><i>{number}</i></span>;
}
function createPoolSurface(){
  const canvas=document.createElement('canvas');canvas.width=POOL_WIDTH*2;canvas.height=POOL_HEIGHT*2;
  const c=canvas.getContext('2d');c.scale(2,2);
  const round=(x,y,w,h,r,fill)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();};
  c.shadowColor='#000b';c.shadowBlur=14;c.shadowOffsetY=5;round(3,3,894,494,27,'#131927');c.shadowBlur=0;c.shadowOffsetY=0;
  const outer=c.createLinearGradient(0,0,0,500);outer.addColorStop(0,'#7e7886');outer.addColorStop(.12,'#222b3b');outer.addColorStop(.86,'#222635');outer.addColorStop(1,'#7d6e7c');round(5,5,890,490,24,outer);
  const wood=c.createLinearGradient(0,0,0,500);wood.addColorStop(0,'#66272c');wood.addColorStop(.055,'#ba5e61');wood.addColorStop(.085,'#3e141b');wood.addColorStop(.45,'#692b32');wood.addColorStop(.89,'#4b1922');wood.addColorStop(.95,'#a94f52');wood.addColorStop(1,'#43222b');round(10,10,880,480,20,wood);
  c.save();c.beginPath();c.roundRect(10,10,880,480,20);c.clip();
  for(let i=0;i<170;i++){c.strokeStyle=`rgba(${i%2?'245,181,165':'26,9,17'},${i%2?.035:.08})`;c.lineWidth=.6;c.beginPath();c.moveTo(10,10+i*2.85);c.bezierCurveTo(290,6+i*2.9,580,15+i*2.8,890,10+i*2.85);c.stroke();}c.restore();
  const felt=c.createRadialGradient(420,220,40,450,250,550);felt.addColorStop(0,'#50b6c9');felt.addColorStop(.65,'#2993af');felt.addColorStop(1,'#175971');round(POOL_RAIL,POOL_RAIL,816,416,3,felt);
  // The cloth grain is cached once; there is no random noise in the frame loop.
  let seed=3457;c.save();c.beginPath();c.rect(42,42,816,416);c.clip();
  for(let i=0;i<17000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=42+(seed%81600)/100;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const y=42+(seed%41600)/100;c.fillStyle=i%2?'#ffffff0b':'#00324b0d';c.fillRect(x,y,.6,.6);}c.restore();
  const cushion=(points,vertical=false)=>{const g=vertical?c.createLinearGradient(30,0,50,0):c.createLinearGradient(0,30,0,46);g.addColorStop(0,'#083442');g.addColorStop(.5,'#329ab3');g.addColorStop(1,'#75d7e8');c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=g;c.fill();c.strokeStyle='#a1e6ed88';c.lineWidth=.75;c.stroke();};
  cushion([[65,30],[427,30],[419,42],[74,42]]);cushion([[473,30],[835,30],[826,42],[481,42]]);
  cushion([[74,458],[419,458],[427,470],[65,470]]);cushion([[481,458],[826,458],[835,470],[473,470]]);
  cushion([[30,66],[42,76],[42,424],[30,434]],true);cushion([[858,76],[870,66],[870,434],[858,424]],true);
  c.strokeStyle='#0e435888';c.lineWidth=1;c.beginPath();c.moveTo(240,43);c.lineTo(240,457);c.stroke();
  c.beginPath();c.arc(240,250,2,0,Math.PI*2);c.fillStyle='#cdfaff77';c.fill();
  [140,240,340,560,660,760].forEach(x=>{[21,479].forEach(y=>{c.beginPath();c.arc(x,y,2.6,0,Math.PI*2);const d=c.createRadialGradient(x-1,y-1,0,x,y,3);d.addColorStop(0,'#eef1ff');d.addColorStop(1,'#48465b');c.fillStyle=d;c.fill();});});
  [140,250,360].forEach(y=>[21,879].forEach(x=>{c.beginPath();c.arc(x,y,2.5,0,Math.PI*2);c.fillStyle='#d0b6c1';c.fill();}));
  POOL_POCKETS.forEach(([x,y])=>{const g=c.createRadialGradient(x,y,5,x,y,28);g.addColorStop(0,'#000');g.addColorStop(.82,'#030305');g.addColorStop(1,'#50101b');c.beginPath();c.arc(x,y,26,0,Math.PI*2);c.fillStyle=g;c.fill();c.strokeStyle='#b7859299';c.lineWidth=1.8;c.stroke();c.beginPath();c.arc(x,y,21,Math.PI,Math.PI*1.8);c.strokeStyle='#000';c.lineWidth=3;c.stroke();});
  return canvas;
}
function drawPoolBall(ctx,ball){
  const {x,y,number}=ball,r=BALL_RADIUS,color=POOL_BALL_COLORS[number===8?8:(number-1)%8+1];
  ctx.save();ctx.shadowColor='#001a27aa';ctx.shadowBlur=4;ctx.shadowOffsetX=1.5;ctx.shadowOffsetY=2.5;
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);const sphere=ctx.createRadialGradient(x-r*.32,y-r*.38,r*.04,x,y,r);
  const base=ball.type==='cue'||ball.type==='stripe'?'#f3f7fa':color;sphere.addColorStop(0,'#fff');sphere.addColorStop(.25,base);sphere.addColorStop(.7,base);sphere.addColorStop(1,ball.type==='cue'?'#828f99':'#162b3c');ctx.fillStyle=sphere;ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
  if(ball.type==='stripe'){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();const band=ctx.createLinearGradient(0,y-r*.5,0,y+r*.5);band.addColorStop(0,color);band.addColorStop(.35,color);band.addColorStop(1,'#162335');ctx.fillStyle=band;ctx.fillRect(x-r,y-r*.55,r*2,r*1.1);ctx.restore();}
  if(ball.type!=='cue'){ctx.beginPath();ctx.arc(x,y,r*.48,0,Math.PI*2);ctx.fillStyle='#f5f5f0';ctx.fill();ctx.font=`bold ${number>9?7:8}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#131722';ctx.fillText(String(number),x,y+.25);}
  ctx.beginPath();ctx.ellipse(x-r*.34,y-r*.44,r*.24,r*.12,-.6,0,Math.PI*2);ctx.fillStyle='#ffffffbb';ctx.fill();ctx.restore();
}
function drawPoolAim(ctx,cue,balls,angle,pulling,power){
  const dx=Math.cos(angle),dy=Math.sin(angle),r=BALL_RADIUS;
  const limits=[dx>0?(POOL_WIDTH-POOL_RAIL-r-cue.x)/dx:dx<0?(POOL_RAIL+r-cue.x)/dx:Infinity,dy>0?(POOL_HEIGHT-POOL_RAIL-r-cue.y)/dy:dy<0?(POOL_RAIL+r-cue.y)/dy:Infinity];
  let distance=Math.min(...limits),target=null;
  balls.forEach(b=>{if(b===cue||b.pocketed)return;const vx=b.x-cue.x,vy=b.y-cue.y,projection=vx*dx+vy*dy,perp2=vx*vx+vy*vy-projection*projection;
    if(projection>0&&perp2<r*r*4){const hit=projection-Math.sqrt(r*r*4-perp2);if(hit>=0&&hit<distance){distance=hit;target=b;}}
  });
  const hx=cue.x+dx*distance,hy=cue.y+dy*distance;
  ctx.save();ctx.strokeStyle='#172b35';ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(cue.x,cue.y);ctx.lineTo(hx,hy);ctx.stroke();ctx.strokeStyle='#fcffff';ctx.lineWidth=1.8;ctx.stroke();
  ctx.beginPath();ctx.arc(hx,hy,r,0,Math.PI*2);ctx.strokeStyle='#fff';ctx.lineWidth=2.3;ctx.stroke();
  if(target){const nx=(target.x-hx)/(r*2),ny=(target.y-hy)/(r*2);ctx.beginPath();ctx.moveTo(target.x,target.y);ctx.lineTo(target.x+nx*80,target.y+ny*80);ctx.stroke();const projection=dx*nx+dy*ny;const tx=dx-projection*nx,ty=dy-projection*ny;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+tx*65,hy+ty*65);ctx.stroke();}
  ctx.translate(cue.x,cue.y);ctx.rotate(angle+Math.PI);
  const pull=pulling?power*.35:0,near=17+pull,far=near+245;
  const shaft=ctx.createLinearGradient(0,-5,0,5);shaft.addColorStop(0,'#806a36');shaft.addColorStop(.3,'#f7e0a0');shaft.addColorStop(.65,'#c1a252');shaft.addColorStop(1,'#473b21');ctx.beginPath();ctx.moveTo(near,-1.8);ctx.lineTo(far,-4.5);ctx.lineTo(far,4.5);ctx.lineTo(near,1.8);ctx.closePath();ctx.fillStyle=shaft;ctx.fill();ctx.strokeStyle='#17232b';ctx.lineWidth=.8;ctx.stroke();
  ctx.fillStyle='#163333';ctx.fillRect(near-3,-2,4,4);ctx.fillStyle='#baf2f8';ctx.fillRect(near-4,-2,2,4);
  ctx.fillStyle='#15232c';for(let i=0;i<7;i++)ctx.fillRect(near+110+i*12,-3.5,3,7);
  ctx.fillStyle='#d6bc6b';ctx.fillRect(far-9,-4.5,4,9);ctx.restore();
}
const POOL_PRO_STYLES=`
.professional-pool.arena-game-page {padding:12px;min-height:100dvh;background:radial-gradient(ellipse at 50% 38%,#29374b,#111b2c 65%,#080f1b);font-family:Inter,system-ui,sans-serif}
.pool-game-shell {width:min(100%,1400px);margin:auto}
.pool-hud {display:grid;grid-template-columns:48px minmax(0,1fr) 88px minmax(0,1fr) 48px;align-items:center;gap:14px;padding:5px 4px 10px}
.pool-menu-button,.pool-icon-button {display:grid;place-items:center;flex-shrink:0;width:44px;height:44px;padding:7px;border-radius:12px;border:2px solid #607084;background:linear-gradient(#3b5163,#131f32);color:#e8f4ff;cursor:pointer;box-shadow:0 3px 8px #0008;font-size:22px;font-weight:800}
.pool-menu-button {background:linear-gradient(#3da542,#13531b);color:#ecffdb;border-color:#91bd72}
.pool-menu-button svg,.pool-icon-button svg {width:100%;height:100%}
.pool-contender {display:flex;align-items:center;gap:12px;min-width:0}
.pool-contender-user {justify-content:flex-end}.pool-contender-ai {justify-content:flex-start}
.pool-contender .player-avatar {width:70px;height:70px;border-radius:16px;border:3px solid #71808e;font-size:25px;box-shadow:0 4px 10px #0008;background:linear-gradient(130deg,#334767,#131c30)}
.pool-contender.contender-active .player-avatar {border-color:#66ec5b;box-shadow:0 0 0 3px #66ec5b33,0 3px 15px #0008}
.pool-contender-ai.contender-active .player-avatar {border-color:#67d8ff}
.pool-contender-details {min-width:0;width:min(100%,340px)}
.pool-nameplate {display:flex;align-items:center;justify-content:space-between;gap:8px;background:linear-gradient(#070c16,#1a2130);border:1px solid #4a586c;border-radius:5px;padding:4px 8px;margin-bottom:7px;color:#f4f6ff;font-weight:800;font-size:14px;box-shadow:inset 0 2px 4px #000}
.pool-nameplate span {overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.pool-nameplate small {font-size:9px;color:#9cadc3;white-space:nowrap}
.pool-ball-row {display:flex;align-items:center;justify-content:space-between;gap:3px}
.pool-ball-badge {position:relative;display:inline-grid;place-items:center;flex-shrink:0;width:25px;height:25px;border-radius:50%;background:radial-gradient(circle at 35% 25%,#ffffff 0%,var(--ball-color) 30%,var(--ball-color) 60%,#142135 100%);box-shadow:0 2px 2px #000a,inset 0 0 0 1px #cceaff66;border:1px solid #121e2f}
.pool-ball-badge i {display:grid;place-items:center;border-radius:50%;background:#fffff5;color:#111b28;font:bold 10px Arial;width:13px;height:13px;font-style:normal;z-index:1}
.pool-ball-badge.badge-stripe {background:linear-gradient(#f0f1f0 15%,var(--ball-color) 27%,var(--ball-color) 70%,#e2ebf1 82%)}
.pool-ball-badge.badge-cleared {background:#0e1421;box-shadow:inset 0 0 0 1px #000;border-color:#566074}.pool-ball-badge.badge-cleared i {visibility:hidden}
.pool-match-prize {display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #87909e;background:linear-gradient(#121b28,#09121d);border-radius:16px;padding:5px;box-shadow:0 3px 6px #0008;min-height:78px}
.pool-match-prize svg {height:30px;width:46px}.pool-match-prize strong {color:#ffe437;font-size:21px;line-height:1}.pool-match-prize small {font-size:7px;color:#afbccd;letter-spacing:1px;margin-top:4px}
.pool-topline {display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:11px;color:#9db3c8;padding:3px 76px 10px}.pool-topline strong {font-size:13px;color:#d6e9ff;letter-spacing:.5px}
.pool-playfield {display:grid;grid-template-columns:52px minmax(0,1fr) 52px;gap:12px;align-items:stretch;width:min(100%,calc((100dvh - 245px)*1.8 + 128px));min-width:0;margin:auto}
.pool-table-stage {position:relative;min-width:0;aspect-ratio:9/5}
.pool-pro-canvas {display:block;width:100%;height:100%;aspect-ratio:9/5;touch-action:none;border-radius:24px;box-shadow:0 26px 60px #000b,0 0 0 1px #b6d9e533;user-select:none;image-rendering:auto;filter:contrast(1.035) saturate(1.08)}
.pool-power-column {display:flex;align-items:center;flex-direction:column;gap:8px;padding:12px 4px 8px;background:linear-gradient(180deg,#25364a,#0d1725);border:1px solid #53657a;border-radius:17px;box-shadow:inset 0 0 0 1px #ffffff0a,0 8px 22px #0005}
.pool-power-column label {color:#a9bdd2;font-size:7px;font-weight:900;letter-spacing:.9px}.pool-power-column>strong {font-size:10px;color:#eef8ff}.pool-power-column>small{font-size:6px;line-height:1.1;text-align:center;color:#8fa8be;font-weight:800}
.cue-pull-rail{--cue-pull:50%;position:relative;flex:1;width:38px;min-height:105px;max-height:330px;border-radius:18px;background:linear-gradient(90deg,#080d15,#26384b 48%,#080d15);border:1px solid #66798c;box-shadow:inset 0 0 12px #000,0 0 0 1px #ffffff0d;overflow:hidden;touch-action:none;cursor:ns-resize;user-select:none}
.cue-pull-rail:before{content:"";position:absolute;left:50%;top:8px;bottom:8px;width:2px;transform:translateX(-50%);background:linear-gradient(#ffffff18,#8bdcff55,#ffffff18);border-radius:99px}
.cue-controller-stick{position:absolute;z-index:3;left:50%;top:calc(7px + (var(--cue-pull) * .34));width:15px;height:72%;transform:translateX(-50%);transition:top .12s cubic-bezier(.2,.8,.2,1);filter:drop-shadow(0 3px 3px #000a)}
.cue-pull-rail.is-pulling .cue-controller-stick{transition:none}
.cue-controller-stick:before{content:"";position:absolute;left:5px;top:0;width:5px;height:100%;border-radius:5px;background:linear-gradient(90deg,#5d4823,#f2d28a 35%,#b98c43 70%,#3e2d18);box-shadow:inset 1px 0 #fff6}
.cue-controller-stick i{position:absolute;left:4px;top:-2px;width:7px;height:8px;border-radius:3px;background:linear-gradient(#dffcff,#67d5df)}
.cue-controller-stick b{position:absolute;left:3px;bottom:4px;width:9px;height:20%;border-radius:5px;background:linear-gradient(90deg,#171d26,#57331f,#161b22)}
.cue-controller-stick span{position:absolute;left:2px;bottom:0;width:11px;height:7px;border-radius:5px;background:#c89b52}
.cue-controller-ball{position:absolute;z-index:4;left:50%;top:7px;width:14px;height:14px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle at 35% 28%,#fff,#e8eef4 55%,#83909d);box-shadow:0 2px 6px #000b}
.cue-controller-glow{position:absolute;left:6px;right:6px;top:8px;height:calc(var(--cue-pull) * .55);border-radius:12px;background:linear-gradient(#55e6ff12,#f7ce5c22,#ff724b35);pointer-events:none}
.ai-cue-controller .cue-pull-rail{cursor:default}.ai-cue-controller .cue-controller-stick{transition:top .16s linear}
.pool-pocket-rack {display:flex;align-items:center;flex-direction:column;gap:8px;border-radius:18px;background:linear-gradient(90deg,#1a2638,#314057,#131c2c);border:2px solid #5d6a7e;padding:9px 5px;box-shadow:inset 0 0 0 2px #0e1524}
.rack-label {font-size:7px;color:#91a0b7;letter-spacing:.8px;font-weight:800}.rack-channel {flex:1;display:flex;flex-direction:column-reverse;align-items:center;justify-content:flex-start;gap:2px;width:100%;border:1px solid #8a94a688;border-radius:20px;background:#0c1422;padding:8px 3px;overflow:hidden}.rack-channel .pool-ball-badge {width:22px;height:22px}.rack-channel .pool-ball-badge i {width:11px;height:11px;font-size:8px}.pool-pocket-rack .pool-icon-button {width:30px;height:30px;border-width:1px;border-radius:9px;font-size:18px}.empty-rack-lines {height:100%;width:100%;border:1px solid #94a9c233;border-radius:20px;box-shadow:inset 0 0 0 3px #0007}
.pool-shot-footer {display:flex;align-items:center;gap:10px;width:min(100%,1100px);margin:12px auto 0;padding:10px 15px;background:#0c1725;border:1px solid #2e4257;border-radius:12px;font-size:12px;color:#c9e3f2}.pool-shot-footer p {margin:0;flex:1}.pool-status-dot {width:7px;height:7px;border-radius:50%;background:#55c98c;box-shadow:0 0 8px #55c98c88;flex-shrink:0}.pool-shot-footer button {background:transparent;border:0;color:#7bcadf;cursor:pointer;font-size:11px;white-space:nowrap}.pool-hand-footer {border-color:#ac8b31;color:#ffe09a}.pool-rotate-hint {display:none;font-size:9px;color:#93aac3}
.professional-pool:fullscreen {overflow:auto;display:flex;align-items:center;justify-content:center}.professional-pool:fullscreen .pool-game-shell {max-width:1500px}
.ludo-setup-modal,.ludo-setup-modal * {box-sizing:border-box}.ludo-setup-modal {max-height:calc(100dvh - 32px);overflow:auto;position:relative;width:min(530px,100%);background:linear-gradient(145deg,#183626,#101e30);border:1px solid #577961;border-radius:24px;padding:30px;color:#fff;box-shadow:0 25px 90px #0008}.ludo-setup-modal h2 {margin:8px 0 5px;font-size:26px}.ludo-setup-modal>p {color:#b2c6bf;font-size:13px;line-height:1.5}.setup-eyebrow {font-size:10px;letter-spacing:2px;color:#97df9d;font-weight:800}.setup-close {position:absolute;right:14px;top:10px;border:0;background:transparent;color:#b4c7c3;font-size:27px;cursor:pointer}.ludo-mode-options {display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0 8px}.ludo-mode-options button {padding:14px;border-radius:12px;border:1px solid #466252;background:#0b1924;color:#d1dcd8;cursor:pointer}.ludo-mode-options button.selected {border-color:#9ee28c;background:#204331;box-shadow:0 0 0 1px #9ee28c55}.ludo-mode-options strong,.ludo-mode-options span {display:block}.ludo-mode-options span {font-size:10px;margin-top:5px;color:#a9bdb5}.online-room-label {margin:4px 0 16px}.player-count-options {display:flex;gap:9px;margin:23px 0}.player-count-options button {flex:1;background:#0b1924;border:1px solid #466252;border-radius:12px;padding:15px 6px;color:#d1dcd8;cursor:pointer}.player-count-options button.selected {border-color:#9ee28c;background:#204331;box-shadow:0 0 0 1px #9ee28c55}.player-count-options strong {display:block;font-size:16px}.player-count-options span {display:block;font-size:10px;margin-top:7px}.setup-bet-label {display:flex;align-items:center;gap:12px;font-size:14px;font-weight:700}.setup-bet-label input {min-width:0;width:120px;padding:10px 12px;border:1px solid #577568;border-radius:9px;background:#09161d;color:#fff;font-size:17px}.setup-bet-label>span {color:#93b7a3;font-size:12px}.ludo-prize-preview {display:flex;justify-content:space-between;margin-top:20px;border-radius:13px;background:#06171199;padding:15px}.ludo-prize-preview small {display:block;color:#9db2a7;font-size:11px}.ludo-prize-preview strong {display:block;margin-top:5px;color:#fde365;font-size:20px}.setup-stake-note {font-size:11px!important}.setup-error {color:#ffb8ad!important}.inactive-player {opacity:.45}.inactive-dot {width:18px;height:18px;border-radius:50%;background:var(--player-color);margin:10px}
.coming-games-grid{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:2px}.coming-game-card{position:relative;cursor:default!important;opacity:.72;filter:saturate(.72)}.coming-game-card:hover{transform:none!important}.coming-soon-pill{margin-left:auto;align-self:center;padding:7px 9px;border-radius:999px;border:1px solid #8fa5ba55;background:#09131ecc;color:#a8bfd2;font-size:8px;font-weight:900;letter-spacing:.5px;white-space:nowrap}@media(max-width:900px){.coming-games-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.coming-games-grid{grid-template-columns:1fr}.coming-soon-pill{font-size:7px}}
@media(max-width:760px){.professional-pool.arena-game-page {padding:8px}.pool-hud {grid-template-columns:34px minmax(0,1fr) 55px minmax(0,1fr) 30px;gap:5px;padding:2px 0 8px}.pool-contender {gap:5px}.pool-contender .player-avatar {width:42px;height:48px;border-radius:10px;border-width:2px;font-size:18px}.pool-nameplate {font-size:10px;padding:3px 4px;gap:2px}.pool-nameplate small {display:none}.pool-ball-row {gap:1px}.pool-ball-badge {width:15px;height:15px}.pool-ball-badge i {font-size:7px;width:9px;height:9px}.pool-match-prize {min-height:57px;border-radius:11px;padding:3px}.pool-match-prize svg {height:20px;width:32px}.pool-match-prize strong {font-size:17px}.pool-match-prize small {font-size:5px;letter-spacing:.2px}.pool-menu-button,.pool-hud>.pool-icon-button {width:30px;height:34px;padding:5px;border-width:1px;border-radius:9px}.pool-topline {padding:0 40px 7px;font-size:8px}.pool-topline strong {font-size:10px}.pool-playfield {grid-template-columns:33px minmax(0,1fr) 30px;gap:5px;width:100%}.pool-power-column {padding:7px 3px 5px;gap:5px;border-radius:10px}.pool-power-column label {font-size:6px;letter-spacing:0}.pool-power-column>strong {font-size:9px}.cue-pull-rail {width:25px;min-height:55px}.pool-power-column>small{font-size:5px}.pool-pocket-rack {padding:5px 2px;gap:4px;border-radius:12px}.rack-label {font-size:5px;letter-spacing:0}.rack-channel {padding:3px 0;gap:1px}.rack-channel .pool-ball-badge {width:17px;height:17px}.rack-channel .pool-ball-badge i {width:10px;height:10px;font-size:7px}.pool-pocket-rack .pool-icon-button {width:21px;height:22px;padding:1px}.pool-pro-canvas {border-radius:13px}.pool-shot-footer {padding:8px 10px;font-size:10px;gap:6px}.pool-shot-footer button {font-size:9px}.pool-rotate-hint {display:block}.ludo-setup-modal {padding:22px}.player-count-options strong {font-size:14px}}
@media(max-width:500px) and (orientation:portrait){.pool-hud {grid-template-columns:30px minmax(0,1fr) 48px minmax(0,1fr);gap:5px}.pool-hud>.pool-icon-button {display:none}.pool-contender-user,.pool-contender-ai {flex-direction:column;gap:5px}.pool-contender-user .pool-contender-details {order:2}.pool-contender .player-avatar {width:49px;height:53px}.pool-contender-details {width:100%}.pool-ball-row {justify-content:center}.pool-topline {padding:3px 2px 8px}.pool-playfield {grid-template-columns:30px minmax(0,1fr) 27px;gap:3px}.pool-shot-footer {flex-wrap:wrap}.pool-rotate-hint {width:100%;text-align:center}.pool-pocket-rack .rack-channel .pool-ball-badge {width:14px;height:14px}.rack-channel .pool-ball-badge i {width:8px;height:8px;font-size:6px}}
@media(max-height:520px) and (orientation:landscape){.professional-pool.arena-game-page {padding:5px}.pool-hud {padding:0 3px 4px}.pool-contender .player-avatar {width:43px;height:46px}.pool-match-prize {min-height:48px}.pool-match-prize svg {height:19px}.pool-topline {padding-bottom:4px}.pool-playfield {width:min(100%,calc((100dvh - 148px)*1.8 + 85px))}.pool-shot-footer {margin-top:6px;padding:5px 10px}.pool-power-column {padding-top:7px;gap:5px}.pool-power-track {min-height:45px}}

.online-match-tools{margin:14px 0;padding:12px;border:1px solid #466252;border-radius:14px;background:#081720}.online-action-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px}.online-action-tabs button{padding:10px 6px;border-radius:10px;border:1px solid #456071;background:#102334;color:#d9efff;font-weight:800;cursor:pointer;font-size:11px}.online-action-tabs button.selected{border-color:#78e99a;background:#19432e;box-shadow:0 0 0 1px #78e99a44}.online-match-tools .online-room-label{margin:0}.nightmare-ai-badge{font-size:9px;color:#ffcf55;font-weight:900;letter-spacing:.8px}
`;
