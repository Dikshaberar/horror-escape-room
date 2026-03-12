// ===== HORROR ESCAPE ROOM - GAME JS =====

const G = {
  room: 1, lives: 3, inventory: [], timeLeft: 300,
  timer: null, jsTimer: null, gameOver: false, won: false,
  collected: [], timeElapsed: 0
};

const ROOMS = {
  1: {
    name:"🕸️ ROOM 1 — The Entry", bg:"/static/images/room1_bg.jpg", tint:"t1",
    desc:"You wake up gasping. The air is thick and cold. Spider webs hang from every corner. A dim light flickers above you. There is a locked door ahead and an old drawer beside you...",
    actions:[
      {id:"drawer",label:"🗄️ Search Drawer",fn:"searchDrawer"},
      {id:"webs",label:"🕸️ Examine Webs",fn:"examineWebs"},
      {id:"door1",label:"🚪 Try The Door",fn:"checkDoor1"},
      {id:"note1",label:"📝 Read Wall Note",fn:"readNote1"}
    ],
    next:2, need:"rusty_key", jsChance:0.008
  },
  2: {
    name:"🪜 ROOM 2 — The Staircase", bg:"/static/images/room2_bg.jpg", tint:"t2",
    desc:"You step into a dark staircase. The steps creak under your weight. Somewhere below, something breathes. A flashlight lies on the fourth step. Shadows move at the bottom...",
    actions:[
      {id:"flash",label:"🔦 Grab Flashlight",fn:"grabFlash"},
      {id:"down",label:"⬇️ Go Down Stairs",fn:"goDown"},
      {id:"listen",label:"👂 Listen Carefully",fn:"listenStairs"},
      {id:"wall",label:"🔍 Check Wall Marks",fn:"checkWall"}
    ],
    next:3, need:"code_1", jsChance:0.012
  },
  3: {
    name:"🏚️ ROOM 3 — Abandoned Hall", bg:"/static/images/room3_bg.jpg", tint:"t3",
    desc:"You enter a collapsed hallway. Papers and debris cover the floor. A broken table sits in the corner. There is a padlocked cabinet against the wall. Something scratches behind it...",
    actions:[
      {id:"papers",label:"📄 Search Papers",fn:"searchPapers"},
      {id:"cabinet",label:"🔒 Open Cabinet",fn:"openCabinet"},
      {id:"table",label:"🪑 Move The Table",fn:"moveTable"},
      {id:"ceiling",label:"👀 Look At Ceiling",fn:"lookCeiling"}
    ],
    next:4, need:"gate_key", jsChance:0.018
  },
  4: {
    name:"🌉 ROOM 4 — The Final Bridge", bg:"/static/images/room4_bg.jpg", tint:"t4",
    desc:"You reach the final bridge. Fog is everywhere. The rotting wooden planks groan beneath you. At the end stands a locked gate with a keypad. Combine your clues to enter the code...",
    actions:[
      {id:"planks",label:"🪵 Check Planks",fn:"checkPlanks"},
      {id:"fog",label:"🌫️ Look Into Fog",fn:"lookFog"},
      {id:"code",label:"🔑 Enter Gate Code",fn:"enterCode"},
      {id:"back",label:"⬅️ Go Back",fn:"goBack"}
    ],
    next:null, need:null, jsChance:0.025
  }
};

// Audio helpers
function snd(id,v=0.5){try{const e=document.getElementById(id);if(e){e.currentTime=0;e.volume=v;e.play().catch(()=>{});}}catch(e){}}
function stopSnd(id){try{const e=document.getElementById(id);if(e){e.pause();e.currentTime=0;}}catch(e){}}

// Init
function initGame(){
  G.room=1;G.lives=3;G.inventory=[];G.timeLeft=300;
  G.gameOver=false;G.won=false;G.collected=[];G.timeElapsed=0;
  shownNotifs = new Set();
  // Reset jumpscare chances
  ROOMS[1].jsChance=0.008;ROOMS[2].jsChance=0.012;ROOMS[3].jsChance=0.018;ROOMS[4].jsChance=0.025;
  applyDifficulty();
  document.getElementById('gameOver').classList.add('hidden');
  document.getElementById('winScreen').classList.add('hidden');
  updateHearts();
  loadRoom(1);
  startTimer();
  startJS();
  const m=document.getElementById('bgMusic');
  if(m){m.volume=0.3;m.play().catch(()=>{});}
  // Show difficulty notif
  const d=localStorage.getItem('hDifficulty')||'medium';
  setTimeout(()=>showProgressNotif(`💀 Difficulty: ${d.toUpperCase()} — Good luck surviving...`),1500);
}

// Load room
function loadRoom(n){
  G.room=n;
  const r=ROOMS[n];
  setTimeout(()=>checkNotifs(),1200);
  snd('stepSound',0.4);
  setTimeout(()=>snd('doorSound',0.5),300);
  const bg=document.getElementById('roomBg');
  bg.style.opacity='0';
  setTimeout(()=>{bg.style.backgroundImage=`url('${r.bg}')`;bg.style.transition='opacity 1.5s';bg.style.opacity='1';},500);
  document.getElementById('colorTint').className='color-tint '+r.tint;
  document.getElementById('roomName').textContent=r.name;
  document.getElementById('roomDesc').textContent=r.desc;
  buildActions(r.actions);
  buildNav(r);
  updateFog(n);
}

function buildActions(actions){
  const c=document.getElementById('actionBtns');
  c.innerHTML='';
  actions.forEach(a=>{
    const b=document.createElement('button');
    b.className='abtn';b.id=a.id;b.textContent=a.label;
    b.onclick=()=>window[a.fn]&&window[a.fn](b);
    c.appendChild(b);
  });
}

function buildNav(r){
  const c=document.getElementById('navBtns');
  c.innerHTML='';
  if(r.next){
    const b=document.createElement('button');
    b.className='nbtn';b.textContent=`➡️ MOVE TO ROOM ${r.next}`;
    b.onclick=tryNext;c.appendChild(b);
  }
}

function updateFog(n){
  const op=[0.5,0.8,1.0,1.3][n-1]||0.5;
  document.querySelectorAll('.fog').forEach(f=>f.style.opacity=op);
}

// Timer
function startTimer(){
  clearInterval(G.timer);
  G.timer=setInterval(()=>{
    if(G.gameOver||G.won)return;
    G.timeLeft--;G.timeElapsed++;
    const m=Math.floor(G.timeLeft/60),s=G.timeLeft%60;
    const el=document.getElementById('timer');
    el.textContent=`0${m}:${s.toString().padStart(2,'0')}`;
    if(G.timeLeft<=60)el.classList.add('warn');
    if(G.timeLeft<=60)snd('hbSound',0.3);
    checkNotifs();
    if(G.timeLeft<=0)triggerDeath("⏰ Time ran out! Darkness consumed you...");
  },1000);
}

// Hearts
function updateHearts(){
  ['h1','h2','h3'].forEach((id,i)=>{
    const e=document.getElementById(id);
    if(e){if(i<G.lives){e.classList.remove('lost');e.textContent='❤️';}
    else{e.classList.add('lost');e.textContent='🖤';}}
  });
  const v=document.getElementById('vignette');
  if(v){v.className='vignette';if(G.lives===2)v.classList.add('low');if(G.lives===1)v.classList.add('crit');}
}

function loseLife(reason="Something scared you!"){
  if(G.gameOver)return;
  G.lives--;updateHearts();
  document.body.classList.add('shake');
  setTimeout(()=>document.body.classList.remove('shake'),400);
  showMsg(`💔 ${reason} — Lives: ${G.lives}`);
  if(G.lives<=0)setTimeout(()=>triggerDeath("You lost all sanity! The darkness took over..."),1500);
}

// Jump scare
function startJS(){
  clearInterval(G.jsTimer);
  G.jsTimer=setInterval(()=>{
    if(G.gameOver||G.won)return;
    if(Math.random()<ROOMS[G.room].jsChance)triggerJS();
  },1000);
}

function triggerJS(){
  const o=document.getElementById('js-overlay');
  o.style.display='flex';
  snd('jsSound',0.9);
  loseLife("The ghost found you!");
  setTimeout(()=>o.style.display='none',600);
}

// Flicker
function flicker(){
  const f=document.getElementById('flicker');
  [0,80,150,200,300].forEach((t,i)=>{
    setTimeout(()=>f.style.opacity=i%2===0?'0.15':'0',t);
  });
}
setInterval(()=>{if(Math.random()<0.12)flicker();},3500);

// Message
function showMsg(txt,dur=3000){
  const m=document.getElementById('msg');
  m.textContent=txt;m.classList.remove('hidden');
  clearTimeout(window._mt);
  window._mt=setTimeout(()=>m.classList.add('hidden'),dur);
}

// Inventory
function addItem(emoji,name,id){
  if(G.collected.includes(id))return false;
  G.collected.push(id);G.inventory.push({emoji,name,id});
  const c=document.getElementById('invItems');
  c.innerHTML=G.inventory.map(i=>`<span class="inv-item">${i.emoji} ${i.name}</span>`).join('');
  return true;
}
function has(id){return G.collected.includes(id);}

// Puzzle
function openPuzzle(title,hint,answer,onOk){
  const p=document.getElementById('puzzle');
  const inner=document.getElementById('puzzleInner');
  inner.innerHTML=`<h2>🔒 ${title}</h2><p>${hint}</p>
    <div class="p-input">
      <input type="text" id="pAns" placeholder="Enter code..." maxlength="10"/>
      <button class="p-submit" onclick="checkPuzzle('${answer}')">SUBMIT</button>
    </div>
    <p id="pFb" style="color:#cc0000;min-height:18px;font-size:.82rem;"></p>`;
  p.classList.remove('hidden');
  window._pOk=onOk;
  document.getElementById('pAns')?.focus();
}

function checkPuzzle(correct){
  const inp=document.getElementById('pAns');
  const fb=document.getElementById('pFb');
  if(inp.value.trim()===correct){
    fb.style.color='#00cc44';fb.textContent='✅ CORRECT!';
    setTimeout(()=>{closePuzzle();window._pOk&&window._pOk();},800);
  } else {
    fb.textContent='❌ WRONG! Try again...';
    loseLife("Wrong code! Something stirred...");
    inp.value='';inp.focus();
  }
}

function closePuzzle(){document.getElementById('puzzle').classList.add('hidden');}

// Nav
function tryNext(){
  const r=ROOMS[G.room];
  if(r.need&&!has(r.need)){
    showMsg(`🔒 Can't proceed! Find: ${r.need.replace(/_/g,' ')}`);
    loseLife("You tried to force through. Something pushed back...");
    return;
  }
  snd('stepSound',0.5);loadRoom(r.next);
}

// ===== ROOM 1 =====
window.searchDrawer=function(b){
  if(has('rusty_key')){showMsg("Already found the key.");return;}
  b.disabled=true;
  showMsg("You reach into the cold drawer... Your fingers close around metal. 🗝️ Found Rusty Key!");
  addItem('🗝️','Rusty Key','rusty_key');
};
window.examineWebs=function(b){
  b.disabled=true;
  showMsg("The webs look freshly made... something large made these. Faint scratching sounds above.");
  flicker();
};
window.checkDoor1=function(){
  if(has('rusty_key')){showMsg("You use the rusty key! Door creaks open... Moving to Room 2!");loadRoom(2);}
  else{showMsg("🔒 Door is locked. You need a key...");flicker();}
};
window.readNote1=function(b){
  b.disabled=true;
  showMsg('📝 Note reads: "They are watching. The code is split in 4 pieces. First piece: 1 — Find the rest!"',5000);
};

// ===== ROOM 2 =====
window.grabFlash=function(b){
  if(has('flashlight')){showMsg("Already have it.");return;}
  b.disabled=true;addItem('🔦','Flashlight','flashlight');
  showMsg("You grabbed the flashlight. The beam cuts through darkness.");
};
window.goDown=function(b){
  if(!has('flashlight')){showMsg("Too dark without light! Find a flashlight first!");return;}
  b.disabled=true;
  showMsg("You descend slowly... At the bottom you find paper with '3' written in blood.");
  addItem('📄','Code Piece: 3','code_1');
};
window.listenStairs=function(b){
  b.disabled=true;
  if(Math.random()<0.5){
    showMsg("You hear slow breathing below... it stops. Then FOOTSTEPS start coming toward you! 😱");
    loseLife("Something touched you in the dark!");
  } else {
    showMsg("Complete silence... then faint dripping. Water? Or something else?");
  }
};
window.checkWall=function(b){
  b.disabled=true;
  showMsg("Scratched into wall: 'Second piece: 4. Don't look behind you.' You look. Nothing. Then a whisper...");
  addItem('🔢','Code Piece: 4','wall_code');flicker();
};

// ===== ROOM 3 =====
window.searchPapers=function(b){
  b.disabled=true;
  showMsg("Dusty papers... One says: 'THE CODE IS 1 _ 4 7 — The missing number is found on the stairs.'");
};
window.openCabinet=function(){
  if(!has('rusty_key')){showMsg("Padlocked! Need a key.");return;}
  openPuzzle("Locked Cabinet",
    "4-digit lock. Code pieces found: 1 (note), 3 (stairs), 4 (wall), 7 (?). Enter full code:",
    "1347",
    ()=>{
      addItem('🗝️','Gate Key','gate_key');
      showMsg("✅ Cabinet opens! Inside — a gate key and note: 'The bridge awaits.'");
    }
  );
};
window.moveTable=function(b){
  b.disabled=true;
  if(Math.random()<0.4){
    showMsg("As you push the table, something GRABS your arm from underneath! You pull free!");
    loseLife("Something grabbed you!");triggerJS();
  } else {
    showMsg("You move the table. Written on floor: 'ROOM 4 IS THE END. CODE ENDS IN 7.'");
    addItem('📄','Final Clue: 7','floor_clue');
  }
};
window.lookCeiling=function(b){
  b.disabled=true;
  showMsg("Scratch marks cover the entire ceiling. Going in circles. Whoever was here before... lost their mind.");
  flicker();
};

// ===== ROOM 4 =====
window.checkPlanks=function(b){
  b.disabled=true;
  showMsg("Some planks look broken. Walk carefully or you'll fall into dark water below...");
};
window.lookFog=function(b){
  b.disabled=true;
  if(Math.random()<0.6){
    showMsg("You stare into the fog... A face stares back. It SMILES. 😱");
    triggerJS();
  } else {
    showMsg("Nothing but grey fog. You can't tell where the bridge ends.");
  }
};
window.enterCode=function(){
  if(!has('gate_key')){showMsg("Need the gate key! Go back and search Room 3.");return;}
  openPuzzle("🚪 FINAL GATE",
    "Enter the 4-digit escape code you discovered throughout your journey:",
    "1347",
    ()=>triggerWin()
  );
};
window.goBack=function(){
  if(G.room>1){loadRoom(G.room-1);showMsg("You go back...");}
};

// Game Over
function triggerDeath(reason="You didn't survive..."){
  if(G.gameOver)return;G.gameOver=true;
  clearInterval(G.timer);clearInterval(G.jsTimer);
  stopSnd('bgMusic');stopSnd('hbSound');snd('goSound',0.8);
  const e=G.timeElapsed,m=Math.floor(e/60),s=e%60;
  document.getElementById('goReason').textContent=reason;
  document.getElementById('goTime').textContent=`${m}:${s.toString().padStart(2,'0')}`;
  setTimeout(()=>document.getElementById('gameOver').classList.remove('hidden'),1000);
}

// Win
function triggerWin(){
  if(G.won)return;G.won=true;
  clearInterval(G.timer);clearInterval(G.jsTimer);
  stopSnd('bgMusic');stopSnd('hbSound');
  const m=Math.floor(G.timeLeft/60),s=G.timeLeft%60;
  document.getElementById('winTime').textContent=`${m}:${s.toString().padStart(2,'0')}`;
  document.getElementById('winLives').textContent=G.lives;
  setTimeout(()=>document.getElementById('winScreen').classList.remove('hidden'),800);
}

// Save score
function saveScore(){
  const name=document.getElementById('pName').value.trim()||'Anonymous';
  const scores=JSON.parse(localStorage.getItem('hScores')||'[]');
  scores.push({name,timeLeft:G.timeLeft,lives:G.lives,date:new Date().toLocaleDateString()});
  scores.sort((a,b)=>b.timeLeft-a.timeLeft);
  localStorage.setItem('hScores',JSON.stringify(scores.slice(0,10)));
  showMsg(`✅ Score saved for ${name}!`);
}

function restartGame(){initGame();}

window.addEventListener('load',initGame);

// ===== DIFFICULTY SYSTEM =====
function applyDifficulty(){
  const d = localStorage.getItem('hDifficulty') || 'medium';
  if(d === 'easy'){ G.lives=5; G.timeLeft=480; }
  else if(d === 'hard'){ G.lives=1; G.timeLeft=180; }
  else { G.lives=3; G.timeLeft=300; }
  // Update jumpscare chances
  const mult = d==='easy'?0.3 : d==='hard'?2.5 : 1;
  Object.keys(ROOMS).forEach(k=>ROOMS[k].jsChance *= mult);
}

// ===== PROGRESS NOTIFICATIONS =====
const NOTIFS = {
  room2: ["👁️ It knows you moved... the air grows colder.", "🩸 Something dripped from the ceiling above you."],
  room3: ["💀 Three rooms down. It's getting closer.", "👂 You can hear it breathing now."],
  room4: ["😱 This is it. The final room. Don't look behind you.", "🎹 The piano stopped playing. It found you."],
  timer180: ["⏰ 3 minutes left... panic is setting in."],
  timer60:  ["⚠️ 1 MINUTE LEFT! RUN!", "💀 It can smell your fear now."],
  life2:    ["💔 Only 2 lives left... your mind is fracturing."],
  life1:    ["🆘 LAST LIFE! One more scare and it's over!"],
};

let shownNotifs = new Set();

function checkNotifs(){
  const room = G.room;
  const key = `room${room}`;
  if(!shownNotifs.has(key) && NOTIFS[key]){
    const msgs = NOTIFS[key];
    showProgressNotif(msgs[Math.floor(Math.random()*msgs.length)]);
    shownNotifs.add(key);
  }
  const tkey = `timer${G.timeLeft}`;
  if((G.timeLeft===180||G.timeLeft===60) && !shownNotifs.has(tkey) && NOTIFS[tkey]){
    const msgs = NOTIFS[tkey];
    showProgressNotif(msgs[Math.floor(Math.random()*msgs.length)]);
    shownNotifs.add(tkey);
  }
}

function showProgressNotif(msg){
  let n = document.getElementById('progressNotif');
  if(!n){
    n = document.createElement('div');
    n.id = 'progressNotif';
    n.style.cssText='position:fixed;top:80px;right:20px;z-index:200;background:rgba(0,0,0,.92);border:1px solid rgba(204,0,0,.5);border-left:3px solid #cc0000;padding:12px 18px;max-width:280px;font-size:.8rem;letter-spacing:1px;color:rgba(240,236,228,.9);font-family:"Special Elite",cursive;line-height:1.5;display:none;transition:all .4s;';
    document.body.appendChild(n);
  }
  n.textContent = msg;
  n.style.display='block';
  n.style.transform='translateX(0)';
  n.style.opacity='1';
  clearTimeout(window._pnt);
  window._pnt = setTimeout(()=>{
    n.style.transform='translateX(110%)';
    n.style.opacity='0';
    setTimeout(()=>n.style.display='none', 400);
  }, 4000);
}
