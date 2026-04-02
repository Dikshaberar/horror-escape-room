// horror escape room - main game file
// made by diksha berar

var G = {
  room: 1,
  lives: 3,
  inventory: [],
  timeLeft: 300,
  timer: null,
  jsTimer: null,
  gameOver: false,
  won: false,
  collected: [],
  timeElapsed: 0
};

// puzzle questions bank
var PUZZLE_BANK = [
  { q: "What is 13 + 8?", a: "21" },
  { q: "What is 25 - 7?", a: "18" },
  { q: "What is 6 x 4?", a: "24" },
  { q: "What is 36 / 6?", a: "6" },
  { q: "What is 9 x 9?", a: "81" },
  { q: "What is 100 - 37?", a: "63" },
  { q: "What is 7 x 8?", a: "56" },
  { q: "What is 45 + 19?", a: "64" },
  { q: "What is 72 / 8?", a: "9" },
  { q: "What is 11 x 11?", a: "121" },
  { q: "I have no body but come alive at night. What am I?", a: "nightmare" },
  { q: "The more you take, the more you leave behind. What am I?", a: "footsteps" },
  { q: "I speak without a mouth and hear without ears. What am I?", a: "echo" },
  { q: "What has keys but no locks, space but no room?", a: "keyboard" },
  { q: "What goes up but never comes down?", a: "age" },
  { q: "I have cities but no houses. I have mountains but no trees. What am I?", a: "map" },
  { q: "What can run but never walks, has a mouth but never talks?", a: "river" },
  { q: "The more you have of me, the less you see. What am I?", a: "darkness" },
  { q: "I am always hungry and must always be fed. What am I?", a: "fire" },
  { q: "What has hands but cannot clap?", a: "clock" },
  { q: "How many letters in GHOST?", a: "5" },
  { q: "How many letters in HORROR?", a: "6" },
  { q: "What is 3 squared?", a: "9" },
  { q: "How many sides does a triangle have?", a: "3" },
  { q: "How many months in a year?", a: "12" },
  { q: "What is 2 to the power of 5?", a: "32" },
  { q: "How many seconds in a minute?", a: "60" },
  { q: "What is 15% of 100?", a: "15" },
  { q: "How many days in a week?", a: "7" },
  { q: "What is 50 + 50?", a: "100" }
];

var SESSION_PUZZLES = {};

function generateSessionPuzzles() {
  // shuffle and pick 2 random puzzles
  var arr = PUZZLE_BANK.slice();
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  SESSION_PUZZLES.cabinet = arr[0];
  SESSION_PUZZLES.finalGate = arr[1];
}

// room data
var ROOMS = {
  1: {
    name: "🕸️ ROOM 1 — The Entry",
    bg: "/static/images/room1_bg.jpg",
    tint: "t1",
    desc: "You wake up gasping. The air is thick and cold. Spider webs hang from every corner. A dim light flickers above you. There is a locked door ahead and an old drawer beside you...",
    actions: [
      { id: "drawer", label: "🗄️ Search Drawer", fn: "searchDrawer" },
      { id: "webs", label: "🕸️ Examine Webs", fn: "examineWebs" },
      { id: "door1", label: "🚪 Try The Door", fn: "checkDoor1" },
      { id: "note1", label: "📝 Read Wall Note", fn: "readNote1" }
    ],
    next: 2, need: "rusty_key", jsChance: 0.008
  },
  2: {
    name: "🪜 ROOM 2 — The Staircase",
    bg: "/static/images/room2_bg.jpg",
    tint: "t2",
    desc: "You step into a dark staircase. The steps creak under your weight. Somewhere below, something breathes. A flashlight lies on the fourth step. Shadows move at the bottom...",
    actions: [
      { id: "flash", label: "🔦 Grab Flashlight", fn: "grabFlash" },
      { id: "down", label: "⬇️ Go Down Stairs", fn: "goDown" },
      { id: "listen", label: "👂 Listen Carefully", fn: "listenStairs" },
      { id: "wall", label: "🔍 Check Wall Marks", fn: "checkWall" }
    ],
    next: 3, need: "code_1", jsChance: 0.012
  },
  3: {
    name: "🏚️ ROOM 3 — Abandoned Hall",
    bg: "/static/images/room3_bg.jpg",
    tint: "t3",
    desc: "You enter a collapsed hallway. Papers and debris cover the floor. A broken table sits in the corner. There is a padlocked cabinet against the wall. Something scratches behind it...",
    actions: [
      { id: "papers", label: "📄 Search Papers", fn: "searchPapers" },
      { id: "cabinet", label: "🔒 Open Cabinet", fn: "openCabinet" },
      { id: "table", label: "🪑 Move The Table", fn: "moveTable" },
      { id: "ceiling", label: "👀 Look At Ceiling", fn: "lookCeiling" }
    ],
    next: 4, need: "gate_key", jsChance: 0.018
  },
  4: {
    name: "🌉 ROOM 4 — The Final Bridge",
    bg: "/static/images/room4_bg.jpg",
    tint: "t4",
    desc: "You reach the final bridge. Fog is everywhere. The rotting wooden planks groan beneath you. At the end stands a locked gate. Solve the final riddle to escape...",
    actions: [
      { id: "planks", label: "🪵 Check Planks", fn: "checkPlanks" },
      { id: "fog", label: "🌫️ Look Into Fog", fn: "lookFog" },
      { id: "code", label: "🔑 Enter Gate Code", fn: "enterCode" },
      { id: "back", label: "⬅️ Go Back", fn: "goBack" }
    ],
    next: null, need: null, jsChance: 0.025
  }
};

// play sound
function snd(id, v) {
  v = v || 0.5;
  try {
    var e = document.getElementById(id);
    if (e) { e.currentTime = 0; e.volume = v; e.play().catch(function(){}); }
  } catch(err) {}
}

function stopSnd(id) {
  try {
    var e = document.getElementById(id);
    if (e) { e.pause(); e.currentTime = 0; }
  } catch(err) {}
}

// start game
function initGame() {
  G.room = 1;
  G.lives = 3;
  G.inventory = [];
  G.timeLeft = 300;
  G.gameOver = false;
  G.won = false;
  G.collected = [];
  G.timeElapsed = 0;
  shownNotifs = new Set();

  generateSessionPuzzles();

  ROOMS[1].jsChance = 0.008;
  ROOMS[2].jsChance = 0.012;
  ROOMS[3].jsChance = 0.018;
  ROOMS[4].jsChance = 0.025;

  applyDifficulty();

  document.getElementById('gameOver').classList.add('hidden');
  document.getElementById('winScreen').classList.add('hidden');
  updateHearts();
  loadRoom(1);
  startTimer();
  startJS();

  var m = document.getElementById('bgMusic');
  if (m) { m.volume = 0.3; m.play().catch(function(){}); }

  var d = localStorage.getItem('hDifficulty') || 'medium';
  setTimeout(function() {
    showProgressNotif('💀 Difficulty: ' + d.toUpperCase() + ' — Good luck surviving...');
  }, 1500);
}

function loadRoom(n) {
  G.room = n;
  var r = ROOMS[n];
  setTimeout(function(){ checkNotifs(); }, 1200);
  snd('stepSound', 0.4);
  setTimeout(function(){ snd('doorSound', 0.5); }, 300);

  var bg = document.getElementById('roomBg');
  bg.style.opacity = '0';
  setTimeout(function() {
    bg.style.backgroundImage = "url('" + r.bg + "')";
    bg.style.transition = 'opacity 1.5s';
    bg.style.opacity = '1';
  }, 500);

  document.getElementById('colorTint').className = 'color-tint ' + r.tint;
  document.getElementById('roomName').textContent = r.name;
  document.getElementById('roomDesc').textContent = r.desc;
  buildActions(r.actions);
  buildNav(r);
  updateFog(n);
}

function buildActions(actions) {
  var c = document.getElementById('actionBtns');
  c.innerHTML = '';
  actions.forEach(function(a) {
    var b = document.createElement('button');
    b.className = 'abtn';
    b.id = a.id;
    b.textContent = a.label;
    b.onclick = function() { if (window[a.fn]) window[a.fn](b); };
    c.appendChild(b);
  });
}

function buildNav(r) {
  var c = document.getElementById('navBtns');
  c.innerHTML = '';
  if (r.next) {
    var b = document.createElement('button');
    b.className = 'nbtn';
    b.textContent = '➡️ MOVE TO ROOM ' + r.next;
    b.onclick = tryNext;
    c.appendChild(b);
  }
}

function updateFog(n) {
  var ops = [0.5, 0.8, 1.0, 1.3];
  var op = ops[n-1] || 0.5;
  document.querySelectorAll('.fog').forEach(function(f) {
    f.style.opacity = op;
  });
}

function startTimer() {
  clearInterval(G.timer);
  G.timer = setInterval(function() {
    if (G.gameOver || G.won) return;
    G.timeLeft--;
    G.timeElapsed++;
    var m = Math.floor(G.timeLeft / 60);
    var s = G.timeLeft % 60;
    var el = document.getElementById('timer');
    el.textContent = '0' + m + ':' + String(s).padStart(2, '0');
    if (G.timeLeft <= 60) el.classList.add('warn');
    if (G.timeLeft <= 60) snd('hbSound', 0.3);
    checkNotifs();
    if (G.timeLeft <= 0) triggerDeath("⏰ Time ran out! Darkness consumed you...");
  }, 1000);
}

function updateHearts() {
  ['h1','h2','h3'].forEach(function(id, i) {
    var e = document.getElementById(id);
    if (!e) return;
    if (i < G.lives) {
      e.classList.remove('lost');
      e.textContent = '❤️';
    } else {
      e.classList.add('lost');
      e.textContent = '🖤';
    }
  });
  var v = document.getElementById('vignette');
  if (v) {
    v.className = 'vignette';
    if (G.lives === 2) v.classList.add('low');
    if (G.lives === 1) v.classList.add('crit');
  }
}

function loseLife(reason) {
  reason = reason || "Something scared you!";
  if (G.gameOver) return;
  G.lives--;
  updateHearts();
  document.body.classList.add('shake');
  setTimeout(function(){ document.body.classList.remove('shake'); }, 400);
  showMsg('💔 ' + reason + ' — Lives: ' + G.lives);
  if (G.lives <= 0) {
    setTimeout(function(){ triggerDeath("You lost all sanity! The darkness took over..."); }, 1500);
  }
}

function startJS() {
  clearInterval(G.jsTimer);
  G.jsTimer = setInterval(function() {
    if (G.gameOver || G.won) return;
    if (Math.random() < ROOMS[G.room].jsChance) triggerJS();
  }, 1000);
}

function triggerJS() {
  var o = document.getElementById('js-overlay');
  o.style.display = 'flex';
  snd('jsSound', 0.9);
  loseLife("The ghost found you!");
  setTimeout(function(){ o.style.display = 'none'; }, 600);
}

function flicker() {
  var f = document.getElementById('flicker');
  [0, 80, 150, 200, 300].forEach(function(t, i) {
    setTimeout(function(){ f.style.opacity = i % 2 === 0 ? '0.15' : '0'; }, t);
  });
}
setInterval(function(){ if (Math.random() < 0.12) flicker(); }, 3500);

function showMsg(txt, dur) {
  dur = dur || 3000;
  var m = document.getElementById('msg');
  m.textContent = txt;
  m.classList.remove('hidden');
  clearTimeout(window._mt);
  window._mt = setTimeout(function(){ m.classList.add('hidden'); }, dur);
}

function addItem(emoji, name, id) {
  if (G.collected.includes(id)) return false;
  G.collected.push(id);
  G.inventory.push({ emoji: emoji, name: name, id: id });
  var c = document.getElementById('invItems');
  c.innerHTML = G.inventory.map(function(i){
    return '<span class="inv-item">' + i.emoji + ' ' + i.name + '</span>';
  }).join('');
  return true;
}

function has(id) {
  return G.collected.includes(id);
}

function openPuzzle(title, hint, answer, onOk) {
  var p = document.getElementById('puzzle');
  var inner = document.getElementById('puzzleInner');
  inner.innerHTML = '<h2>🔒 ' + title + '</h2>' +
    '<p style="color:#ffcc00;margin-bottom:10px;font-size:1rem;">❓ ' + hint + '</p>' +
    '<div class="p-input">' +
    '<input type="text" id="pAns" placeholder="Your answer..." maxlength="20"/>' +
    '<button class="p-submit" onclick="checkPuzzle(\'' + answer + '\')">SUBMIT</button>' +
    '</div>' +
    '<p id="pFb" style="color:#cc0000;min-height:18px;font-size:.82rem;"></p>';
  p.classList.remove('hidden');
  window._pOk = onOk;
  var inp = document.getElementById('pAns');
  if (inp) inp.focus();
}

function checkPuzzle(correct) {
  var inp = document.getElementById('pAns');
  var fb = document.getElementById('pFb');
  if (inp.value.trim().toLowerCase() === correct.toLowerCase()) {
    fb.style.color = '#00cc44';
    fb.textContent = '✅ CORRECT!';
    setTimeout(function() {
      closePuzzle();
      if (window._pOk) window._pOk();
    }, 800);
  } else {
    fb.textContent = '❌ WRONG! Try again...';
    loseLife("Wrong answer! Something stirred...");
    inp.value = '';
    inp.focus();
  }
}

function closePuzzle() {
  document.getElementById('puzzle').classList.add('hidden');
}

function tryNext() {
  var r = ROOMS[G.room];
  if (r.need && !has(r.need)) {
    showMsg("🔒 Can't proceed! Find: " + r.need.replace(/_/g, ' '));
    loseLife("You tried to force through. Something pushed back...");
    return;
  }
  snd('stepSound', 0.5);
  loadRoom(r.next);
}

// room 1 actions
window.searchDrawer = function(b) {
  if (has('rusty_key')) { showMsg("Already found the key."); return; }
  b.disabled = true;
  showMsg("You reach into the cold drawer... Your fingers close around metal. 🗝️ Found Rusty Key!");
  addItem('🗝️', 'Rusty Key', 'rusty_key');
};

window.examineWebs = function(b) {
  b.disabled = true;
  showMsg("The webs look freshly made... something large made these. Faint scratching sounds above.");
  flicker();
};

window.checkDoor1 = function() {
  if (has('rusty_key')) {
    showMsg("You use the rusty key! Door creaks open... Moving to Room 2!");
    loadRoom(2);
  } else {
    showMsg("🔒 Door is locked. You need a key...");
    flicker();
  }
};

window.readNote1 = function(b) {
  b.disabled = true;
  showMsg('📝 Note: "They are watching. Solve the puzzles to find your way out!"', 5000);
};

// room 2 actions
window.grabFlash = function(b) {
  if (has('flashlight')) { showMsg("Already have it."); return; }
  b.disabled = true;
  addItem('🔦', 'Flashlight', 'flashlight');
  showMsg("You grabbed the flashlight. The beam cuts through darkness.");
};

window.goDown = function(b) {
  if (!has('flashlight')) { showMsg("Too dark without light! Find a flashlight first!"); return; }
  b.disabled = true;
  showMsg("You descend slowly... At the bottom you find a crumpled paper.");
  addItem('📄', 'Crumpled Paper', 'code_1');
};

window.listenStairs = function(b) {
  b.disabled = true;
  if (Math.random() < 0.5) {
    showMsg("You hear slow breathing below... it stops. Then FOOTSTEPS start coming toward you! 😱");
    loseLife("Something touched you in the dark!");
  } else {
    showMsg("Complete silence... then faint dripping. Water? Or something else?");
  }
};

window.checkWall = function(b) {
  b.disabled = true;
  showMsg("Scratched into wall: 'Solve every lock to escape. The answers are within you.'");
  flicker();
};

// room 3 actions
window.searchPapers = function(b) {
  b.disabled = true;
  showMsg("Dusty papers... One says: 'Answer the cabinet riddle to get the gate key!'");
};

window.openCabinet = function() {
  if (!has('rusty_key')) { showMsg("Padlocked! Need a key."); return; }
  var pz = SESSION_PUZZLES.cabinet;
  openPuzzle("Locked Cabinet", pz.q, pz.a, function() {
    addItem('🗝️', 'Gate Key', 'gate_key');
    showMsg("✅ Cabinet opens! Inside — a gate key. The bridge awaits.");
  });
};

window.moveTable = function(b) {
  b.disabled = true;
  if (Math.random() < 0.4) {
    showMsg("As you push the table, something GRABS your arm from underneath! You pull free!");
    loseLife("Something grabbed you!");
    triggerJS();
  } else {
    showMsg("You move the table. Written on floor: 'Only the wise may cross the bridge.'");
    addItem('📄', 'Floor Message', 'floor_clue');
  }
};

window.lookCeiling = function(b) {
  b.disabled = true;
  showMsg("Scratch marks cover the entire ceiling. Going in circles. Whoever was here before... lost their mind.");
  flicker();
};

// room 4 actions
window.checkPlanks = function(b) {
  b.disabled = true;
  showMsg("Some planks look broken. Walk carefully or you'll fall into dark water below...");
};

window.lookFog = function(b) {
  b.disabled = true;
  if (Math.random() < 0.6) {
    showMsg("You stare into the fog... A face stares back. It SMILES. 😱");
    triggerJS();
  } else {
    showMsg("Nothing but grey fog. You can't tell where the bridge ends.");
  }
};

window.enterCode = function() {
  if (!has('gate_key')) { showMsg("Need the gate key! Go back and search Room 3."); return; }
  var pz = SESSION_PUZZLES.finalGate;
  openPuzzle("FINAL GATE", pz.q, pz.a, function() { triggerWin(); });
};

window.goBack = function() {
  if (G.room > 1) { loadRoom(G.room - 1); showMsg("You go back..."); }
};

function triggerDeath(reason) {
  reason = reason || "You didn't survive...";
  if (G.gameOver) return;
  G.gameOver = true;
  clearInterval(G.timer);
  clearInterval(G.jsTimer);
  stopSnd('bgMusic');
  stopSnd('hbSound');
  snd('goSound', 0.8);
  var e = G.timeElapsed;
  var m = Math.floor(e / 60);
  var s = e % 60;
  document.getElementById('goReason').textContent = reason;
  document.getElementById('goTime').textContent = m + ':' + String(s).padStart(2,'0');
  setTimeout(function(){ document.getElementById('gameOver').classList.remove('hidden'); }, 1000);
}

function triggerWin() {
  if (G.won) return;
  G.won = true;
  clearInterval(G.timer);
  clearInterval(G.jsTimer);
  stopSnd('bgMusic');
  stopSnd('hbSound');
  var m = Math.floor(G.timeLeft / 60);
  var s = G.timeLeft % 60;
  document.getElementById('winTime').textContent = m + ':' + String(s).padStart(2,'0');
  document.getElementById('winLives').textContent = G.lives;
  setTimeout(function(){ document.getElementById('winScreen').classList.remove('hidden'); }, 800);
}

function saveScore() {
  var name = document.getElementById('pName').value.trim() || 'Anonymous';
  var scores = JSON.parse(localStorage.getItem('hScores') || '[]');
  scores.push({ name: name, timeLeft: G.timeLeft, lives: G.lives, date: new Date().toLocaleDateString() });
  scores.sort(function(a, b){ return b.timeLeft - a.timeLeft; });
  localStorage.setItem('hScores', JSON.stringify(scores.slice(0, 10)));
  showMsg('✅ Score saved for ' + name + '!');
}

function restartGame() { initGame(); }

window.addEventListener('load', initGame);

// difficulty
function applyDifficulty() {
  var d = localStorage.getItem('hDifficulty') || 'medium';
  if (d === 'easy') { G.lives = 5; G.timeLeft = 480; }
  else if (d === 'hard') { G.lives = 1; G.timeLeft = 180; }
  else { G.lives = 3; G.timeLeft = 300; }
  var mult = d === 'easy' ? 0.3 : d === 'hard' ? 2.5 : 1;
  Object.keys(ROOMS).forEach(function(k){ ROOMS[k].jsChance *= mult; });
}

// notifications
var NOTIFS = {
  room2: ["👁️ It knows you moved... the air grows colder.", "🩸 Something dripped from the ceiling above you."],
  room3: ["💀 Three rooms down. It's getting closer.", "👂 You can hear it breathing now."],
  room4: ["😱 This is it. The final room. Don't look behind you.", "🎹 The piano stopped playing. It found you."],
  timer180: ["⏰ 3 minutes left... panic is setting in."],
  timer60: ["⚠️ 1 MINUTE LEFT! RUN!", "💀 It can smell your fear now."],
  life2: ["💔 Only 2 lives left... your mind is fracturing."],
  life1: ["🆘 LAST LIFE! One more scare and it's over!"]
};

var shownNotifs = new Set();

function checkNotifs() {
  var key = 'room' + G.room;
  if (!shownNotifs.has(key) && NOTIFS[key]) {
    var msgs = NOTIFS[key];
    showProgressNotif(msgs[Math.floor(Math.random() * msgs.length)]);
    shownNotifs.add(key);
  }
  var tkey = 'timer' + G.timeLeft;
  if ((G.timeLeft === 180 || G.timeLeft === 60) && !shownNotifs.has(tkey) && NOTIFS[tkey]) {
    var tmsgs = NOTIFS[tkey];
    showProgressNotif(tmsgs[Math.floor(Math.random() * tmsgs.length)]);
    shownNotifs.add(tkey);
  }
}

function showProgressNotif(msg) {
  var n = document.getElementById('progressNotif');
  if (!n) {
    n = document.createElement('div');
    n.id = 'progressNotif';
    n.style.cssText = 'position:fixed;top:80px;right:20px;z-index:200;background:rgba(0,0,0,.92);border:1px solid rgba(204,0,0,.5);border-left:3px solid #cc0000;padding:12px 18px;max-width:280px;font-size:.8rem;letter-spacing:1px;color:rgba(240,236,228,.9);font-family:"Special Elite",cursive;line-height:1.5;display:none;transition:all .4s;';
    document.body.appendChild(n);
  }
  n.textContent = msg;
  n.style.display = 'block';
  n.style.transform = 'translateX(0)';
  n.style.opacity = '1';
  clearTimeout(window._pnt);
  window._pnt = setTimeout(function() {
    n.style.transform = 'translateX(110%)';
    n.style.opacity = '0';
    setTimeout(function(){ n.style.display = 'none'; }, 400);
  }, 4000);
}
