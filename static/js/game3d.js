// ===== 3D HORROR ESCAPE ROOM =====
// Enhanced with Ghost Enemy, Hide Mechanic, Hidden Items, Footsteps

// --- GAME STATE ---
const G = {
    room: 1, lives: 3, inventory: [], timeLeft: 300,
    timer: null, jsTimer: null, gameOver: false, won: false,
    collected: [], timeElapsed: 0,
    isStarted: false,
    isHiding: false,        // NEW: hiding state
    ghostActive: false,     // NEW: ghost chasing
    ghostTimer: null,       // NEW: ghost timer
    flashlightOn: true,     // NEW: flashlight toggle
    sanityLevel: 100,       // NEW: sanity meter
};

// --- THREE.JS GLOBALS ---
let scene, camera, renderer, controls;
let flashlight, ambientLight;
let raycaster, mouse;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Ghost mesh
let ghostMesh = null;
let ghostVisible = false;
let ghostFootstepTimer = null;

// Interactable objects
let interactables = [];
let currentHoverObj = null;

// Room data for 3D generation
const ROOM_DATA = {
    1: {
        name: "🕸️ ROOM 1 — The Entry", bg: "/static/images/room1_bg.jpg", color: 0x334455,
        desc: "You wake up gasping. The air is thick and cold. A dim light flickers above you. There is a locked door ahead...",
        jsChance: 0.008,
        objects: [
            { id: "drawer", type: "box", pos: [4, 0, -4], size: [2, 2, 2], color: 0x5c4033, label: "🗄️ Search Drawer", action: "searchDrawer" },
            { id: "door1", type: "door", pos: [0, 0, -9.9], size: [4, 6, 0.2], color: 0x3e2723, label: "🚪 Try The Door", action: "checkDoor1" },
            { id: "note1", type: "plane", pos: [-4.9, 2, 0], rot: [0, Math.PI/2, 0], size: [1, 1], color: 0xffffee, label: "📝 Read Note", action: "readNote1" },
            { id: "wardrobe1", type: "box", pos: [-4, 0, 4], size: [2, 5, 2], color: 0x3e2000, label: "🚪 Hide In Wardrobe", action: "hideWardrobe" },   // NEW HIDE SPOT
            { id: "hidden_key2", type: "box", pos: [4.5, -2.5, 3], size: [0.3, 0.3, 0.3], color: 0xffdd00, label: "✨ Something glints...", action: "grabHiddenKey" }, // NEW HIDDEN ITEM
            { id: "webs", type: "plane", pos: [4.9, 4, 4.9], rot: [0, -Math.PI/4, 0], size: [3, 3], color: 0xaaaaaa, label: "🕸️ Examine Webs", action: "examineWebs", isTransparent: true }
        ]
    },
    2: {
        name: "🪜 ROOM 2 — The Staircase", bg: "/static/images/room2_bg.jpg", color: 0x221111,
        desc: "You step into a dark staircase. Somewhere below, something breathes...",
        jsChance: 0.012,
        objects: [
            { id: "flash", type: "box", pos: [2, -2, -3], size: [0.5, 0.5, 1], color: 0x222222, label: "🔦 Grab Flashlight", action: "grabFlash" },
            { id: "door2", type: "door", pos: [0, -4, -9.9], size: [4, 6, 0.2], color: 0x3e2723, label: "⬇️ Go Down (Next Room)", action: "goDownObj" },
            { id: "wallMarks", type: "plane", pos: [4.9, -1, -5], rot: [0, -Math.PI/2, 0], size: [2, 2], color: 0x440000, label: "🔍 Check Marks", action: "checkWall" },
            { id: "bed2", type: "box", pos: [3.5, -2, 3], size: [3, 1.5, 4], color: 0x1a0a00, label: "🛏️ Hide Under Bed", action: "hideBed" },  // NEW HIDE SPOT
            { id: "hidden_note2", type: "plane", pos: [-4.9, -1, 2], rot: [0, Math.PI/2, 0], size: [0.5, 0.5], color: 0xffeecc, label: "📄 Hidden Note", action: "readHiddenNote2" }, // NEW HIDDEN ITEM
        ],
        spawnY: -1
    },
    3: {
        name: "🏚️ ROOM 3 — Abandoned Hall", bg: "/static/images/room3_bg.jpg", color: 0x112211,
        desc: "You enter a collapsed hallway. Papers and debris cover the floor...",
        jsChance: 0.018,
        objects: [
            { id: "papers", type: "plane", pos: [0, -2.9, 0], rot: [-Math.PI/2, 0, 0], size: [2, 2], color: 0xddddcc, label: "📄 Search Papers", action: "searchPapers" },
            { id: "cabinet", type: "box", pos: [-4, 0, -4], size: [3, 5, 2], color: 0x4a4a4a, label: "🔒 Open Cabinet", action: "openCabinet" },
            { id: "table", type: "box", pos: [3, -1, 3], size: [4, 2, 3], color: 0x2e1a0f, label: "🪑 Move Table", action: "moveTable" },
            { id: "door3", type: "door", pos: [0, 0, -9.9], size: [4, 6, 0.2], color: 0x3e2723, label: "🚪 Go to Bridge", action: "tryRoom4" },
            { id: "closet3", type: "box", pos: [-4.5, 0, 2], size: [1.5, 5, 2.5], color: 0x2a1500, label: "🚪 Hide In Closet", action: "hideCloset" }, // NEW HIDE SPOT
            { id: "hidden_photo", type: "plane", pos: [0, 2, -9.5], rot: [0, 0, 0], size: [0.8, 0.8], color: 0xccccaa, label: "🖼️ Old Photograph", action: "examinePhoto" }, // NEW HIDDEN
        ]
    },
    4: {
        name: "🌉 ROOM 4 — The Final Bridge", bg: "/static/images/room4_bg.jpg", color: 0x111122,
        desc: "You reach the final bridge. The ghost is close. Fog everywhere...",
        jsChance: 0.025,
        objects: [
            { id: "gate", type: "door", pos: [0, 0, -9.9], size: [5, 7, 0.5], color: 0x111111, label: "🔑 Enter Gate Code", action: "enterCode" },
            { id: "fog_look", type: "box", pos: [-4, 0, -6], size: [2, 4, 1], color: 0x555555, label: "🌫️ Look Into Fog", action: "lookFog", isTransparent:true, opacity:0.1 },
            { id: "lastHide", type: "box", pos: [4, 0, 3], size: [2, 4, 2], color: 0x111111, label: "🪨 Hide Behind Pillar", action: "hidePillar" }, // NEW HIDE SPOT
        ],
        isBridge: true
    }
};

const texLoader = new THREE.TextureLoader();

function snd(id,v=0.5){try{const e=document.getElementById(id);if(e){e.currentTime=0;e.volume=v;e.play().catch(()=>{});}}catch(e){}}
function stopSnd(id){try{const e=document.getElementById(id);if(e){e.pause();e.currentTime=0;}}catch(e){}}

window.addEventListener('load', init3D);

function init3D() {
    const container = document.getElementById('canvas-container');
    
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.15);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.y = 2;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    flashlight = new THREE.SpotLight(0xffffff, 1, 30, Math.PI / 6, 0.5, 1);
    flashlight.position.set(0, 0, 0);
    flashlight.target.position.set(0, 0, -1);
    flashlight.castShadow = true;
    camera.add(flashlight);
    camera.add(flashlight.target);
    scene.add(camera);

    // Create ghost mesh
    createGhost();

    controls = new THREE.PointerLockControls(camera, document.body);
    
    document.getElementById('startOverlay').addEventListener('click', function() {
        if (!G.isStarted) startGame();
        controls.lock();
    });

    controls.addEventListener('lock', function () {
        document.getElementById('startOverlay').style.display = 'none';
        document.getElementById('crosshair').style.display = 'block';
    });

    controls.addEventListener('unlock', function () {
        if (!G.gameOver && !G.won && !document.getElementById('puzzle').classList.contains('hidden') === false) {
             document.getElementById('startOverlay').style.display = 'flex';
             document.getElementById('startOverlay').querySelector('h1').textContent = "PAUSED";
        }
        document.getElementById('crosshair').style.display = 'none';
    });

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(0, 0);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('resize', onWindowResize);

    // Flashlight toggle on F key
    document.addEventListener('keydown', function(e) {
        if (e.code === 'KeyF') toggleFlashlight();
        if (e.code === 'KeyH') tryHide(); // H to hide
    });

    buildRoom3D(1);
    animate();
}

// ===== NEW: GHOST SYSTEM =====
function createGhost() {
    const geo = new THREE.CylinderGeometry(0.3, 0.8, 2.5, 8);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0,
        emissive: 0x4488ff,
        emissiveIntensity: 0.5
    });
    ghostMesh = new THREE.Mesh(geo, mat);
    ghostMesh.position.set(0, 1, -15); // Start far away
    scene.add(ghostMesh);

    // Ghost glow light
    const ghostLight = new THREE.PointLight(0x4488ff, 0, 8);
    ghostMesh.add(ghostLight);
    ghostMesh.userData.light = ghostLight;
}

function spawnGhost() {
    if (!ghostMesh || G.isHiding || G.gameOver) return;
    
    ghostVisible = true;
    G.ghostActive = true;
    
    // Spawn behind player
    const angle = Math.random() * Math.PI * 2;
    ghostMesh.position.set(
        camera.position.x + Math.sin(angle) * 8,
        0,
        camera.position.z + Math.cos(angle) * 8
    );
    
    ghostMesh.material.opacity = 0;
    ghostMesh.userData.light.intensity = 0;
    
    // Show ghost
    showMsg("👻 Something is here...", 2000);
    startGhostFootsteps();
    
    // Fade ghost in
    let fadeIn = setInterval(() => {
        if (ghostMesh.material.opacity < 0.7) {
            ghostMesh.material.opacity += 0.05;
            ghostMesh.userData.light.intensity += 0.1;
        } else {
            clearInterval(fadeIn);
        }
    }, 50);

    // Auto despawn after 8 seconds if player survives
    clearTimeout(G.ghostTimer);
    G.ghostTimer = setTimeout(() => {
        despawnGhost();
    }, 8000);
}

function despawnGhost() {
    ghostVisible = false;
    G.ghostActive = false;
    stopGhostFootsteps();
    
    let fadeOut = setInterval(() => {
        if (ghostMesh.material.opacity > 0) {
            ghostMesh.material.opacity -= 0.05;
            ghostMesh.userData.light.intensity -= 0.05;
        } else {
            clearInterval(fadeOut);
            ghostMesh.position.set(0, 1, -50);
        }
    }, 50);
}

function updateGhost(delta) {
    if (!ghostVisible || !ghostMesh || G.isHiding) return;
    
    const playerPos = camera.position;
    const ghostPos = ghostMesh.position;
    
    // Move ghost toward player
    const dx = playerPos.x - ghostPos.x;
    const dz = playerPos.z - ghostPos.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    
    const speed = 1.5; // Ghost speed
    ghostPos.x += (dx / dist) * speed * delta;
    ghostPos.z += (dz / dist) * speed * delta;
    
    // Ghost bob up and down
    ghostPos.y = Math.sin(performance.now() * 0.002) * 0.5 + 1;
    
    // Face player
    ghostMesh.rotation.y = Math.atan2(dx, dz);
    
    // Flicker ghost
    if (Math.random() < 0.05) {
        ghostMesh.material.opacity = Math.random() * 0.4 + 0.3;
    }
    
    // If ghost reaches player
    if (dist < 1.5) {
        triggerGhostCatch();
    }
}

function triggerGhostCatch() {
    if (G.isHiding) return;
    despawnGhost();
    triggerJS();
    loseLife("👻 The ghost caught you!");
}

// ===== NEW: FOOTSTEP SOUNDS =====
let ghostFootstepInterval = null;

function startGhostFootsteps() {
    stopGhostFootsteps();
    ghostFootstepInterval = setInterval(() => {
        if (!ghostVisible || G.isHiding) return;
        
        // Play footstep at ghost volume based on distance
        const playerPos = camera.position;
        const ghostPos = ghostMesh.position;
        const dist = Math.sqrt(
            Math.pow(playerPos.x - ghostPos.x, 2) + 
            Math.pow(playerPos.z - ghostPos.z, 2)
        );
        
        const vol = Math.max(0, Math.min(1, 1 - dist/10));
        if (vol > 0.1) {
            snd('stepSound', vol * 0.6);
            showGhostWarning(dist);
        }
    }, 600);
}

function stopGhostFootsteps() {
    if (ghostFootstepInterval) {
        clearInterval(ghostFootstepInterval);
        ghostFootstepInterval = null;
    }
}

function showGhostWarning(dist) {
    const warningEl = document.getElementById('ghostWarning');
    if (!warningEl) return;
    
    if (dist < 3) {
        warningEl.textContent = "👻 IT'S RIGHT BEHIND YOU!";
        warningEl.style.color = '#ff0000';
        warningEl.style.opacity = '1';
    } else if (dist < 6) {
        warningEl.textContent = "👣 Getting closer...";
        warningEl.style.color = '#ff6600';
        warningEl.style.opacity = '0.8';
    } else {
        warningEl.textContent = "👣 You hear footsteps...";
        warningEl.style.color = '#ffaa00';
        warningEl.style.opacity = '0.6';
    }
    
    clearTimeout(warningEl._timer);
    warningEl._timer = setTimeout(() => {
        warningEl.style.opacity = '0';
    }, 1500);
}

// ===== NEW: HIDE MECHANIC =====
function hideIn(spotName) {
    if (G.isHiding) {
        // Come out of hiding
        exitHide();
        return;
    }
    
    G.isHiding = true;
    controls.unlock();
    
    // Screen goes dark
    const hideOverlay = document.getElementById('hideOverlay');
    if (hideOverlay) {
        hideOverlay.style.display = 'flex';
        hideOverlay.querySelector('p').textContent = `Hiding in ${spotName}... Press H or click to come out`;
    }
    
    showMsg(`🫣 You hide in the ${spotName}!`, 2000);
    
    // Ghost despawns if it was chasing
    if (G.ghostActive) {
        despawnGhost();
        showMsg("👻 You hear it pass by...", 3000);
    }
    
    // Auto exit after 10 seconds
    G.hideTimeout = setTimeout(() => {
        if (G.isHiding) exitHide();
    }, 10000);
}

function exitHide() {
    G.isHiding = false;
    const hideOverlay = document.getElementById('hideOverlay');
    if (hideOverlay) hideOverlay.style.display = 'none';
    controls.lock();
    showMsg("You step back out...", 1500);
    clearTimeout(G.hideTimeout);
}

function tryHide() {
    if (G.isHiding) {
        exitHide();
    }
}

// ===== NEW: FLASHLIGHT TOGGLE =====
function toggleFlashlight() {
    G.flashlightOn = !G.flashlightOn;
    flashlight.visible = G.flashlightOn;
    showMsg(G.flashlightOn ? "🔦 Flashlight ON" : "🔦 Flashlight OFF", 1000);
    
    // Turning off flashlight makes ghost less likely to find you
    if (!G.flashlightOn && G.ghostActive) {
        showMsg("👻 The ghost can't see you in the dark... maybe", 2000);
    }
}

// ===== NEW: SANITY SYSTEM =====
function updateSanity(amount) {
    G.sanityLevel = Math.max(0, Math.min(100, G.sanityLevel + amount));
    const bar = document.getElementById('sanityBar');
    if (bar) {
        bar.style.width = G.sanityLevel + '%';
        if (G.sanityLevel < 30) {
            bar.style.background = '#cc0000';
            // Sanity effects - screen distortion
            document.body.style.filter = `hue-rotate(${(100-G.sanityLevel)*2}deg) saturate(${0.5 + G.sanityLevel/100})`;
        } else if (G.sanityLevel < 60) {
            bar.style.background = '#ff6600';
            document.body.style.filter = 'none';
        } else {
            bar.style.background = '#00cc44';
            document.body.style.filter = 'none';
        }
    }
    if (G.sanityLevel <= 0) {
        triggerDeath("😵 You lost your mind! Sanity depleted...");
    }
}

function startGame() {
    G.isStarted = true;
    G.room=1;G.lives=3;G.inventory=[];G.timeLeft=300;
    G.gameOver=false;G.won=false;G.collected=[];G.timeElapsed=0;
    G.isHiding=false; G.ghostActive=false; G.sanityLevel=100;
    
    ROOM_DATA[1].jsChance=0.008;ROOM_DATA[2].jsChance=0.012;ROOM_DATA[3].jsChance=0.018;ROOM_DATA[4].jsChance=0.025;
    applyDifficulty();
    
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('winScreen').classList.add('hidden');
    updateHearts();
    updateSanity(0);
    
    loadRoom(1);
    startTimer();
    startJS();
    
    const m=document.getElementById('bgMusic');
    if(m){m.volume=0.3;m.load();m.play().catch(()=>{});}
    
    // Show controls hint
    showMsg("WASD Move | Mouse Look | E Interact | F Flashlight | H Hide", 5000);
}

let roomGroup = new THREE.Group();

function buildRoom3D(roomNum) {
    scene.remove(roomGroup);
    roomGroup = new THREE.Group();
    interactables = [];
    despawnGhost();
    scene.add(roomGroup);

    const rData = ROOM_DATA[roomNum];
    
    const roomSize = 10;
    const roomHeight = 6;
    
    const wallTex = texLoader.load(rData.bg);
    wallTex.wrapS = THREE.RepeatWrapping;
    wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(2, 2);

    const wallMat = new THREE.MeshStandardMaterial({ 
        map: wallTex, 
        color: rData.color,
        side: THREE.BackSide,
        roughness: 0.9
    });

    let roomGeo;
    if (rData.isBridge) {
        roomGeo = new THREE.PlaneGeometry(roomSize, roomSize*2);
        const floor = new THREE.Mesh(roomGeo, wallMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -roomHeight/2;
        floor.position.z = -roomSize/2;
        floor.receiveShadow = true;
        roomGroup.add(floor);
        scene.fog.color.setHex(0xaaaaaa);
        scene.fog.density = 0.08;
    } else {
        roomGeo = new THREE.BoxGeometry(roomSize, roomHeight, roomSize*2);
        const roomMesh = new THREE.Mesh(roomGeo, wallMat);
        roomMesh.position.y = 0;
        roomMesh.position.z = -roomSize/2;
        roomMesh.receiveShadow = true;
        roomGroup.add(roomMesh);
        scene.fog.color.setHex(0x000000);
        scene.fog.density = 0.15;
    }

    if (rData.objects) {
        rData.objects.forEach(objDef => {
            let geo, mat;
            
            if (objDef.type === 'box' || objDef.type === 'door') {
                geo = new THREE.BoxGeometry(...objDef.size);
            } else if (objDef.type === 'plane') {
                geo = new THREE.PlaneGeometry(...objDef.size);
            }

            mat = new THREE.MeshStandardMaterial({ 
                color: objDef.color,
                roughness: 0.8
            });

            if (objDef.isTransparent) {
                mat.transparent = true;
                mat.opacity = objDef.opacity || 0.5;
            }

            // Make hidden items glow slightly
            if (objDef.id && objDef.id.startsWith('hidden_')) {
                mat.emissive = new THREE.Color(0x332200);
                mat.emissiveIntensity = 0.3;
                // Add point light for glow
                const glow = new THREE.PointLight(0xffaa00, 0.5, 3);
                glow.position.set(...objDef.pos);
                roomGroup.add(glow);
            }

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(...objDef.pos);
            if(objDef.rot) mesh.rotation.set(...objDef.rot);
            
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            mesh.userData = { 
                label: objDef.label, 
                action: objDef.action,
                id: objDef.id
            };
            
            roomGroup.add(mesh);
            interactables.push(mesh);
        });
    }

    camera.position.set(0, rData.spawnY || 0, 4);
    camera.rotation.set(0, 0, 0);
    
    if (has('flashlight')) {
        flashlight.angle = Math.PI / 4;
        flashlight.intensity = 1.5;
        flashlight.distance = 50;
    } else {
        flashlight.angle = Math.PI / 8;
        flashlight.intensity = 0.8;
        flashlight.distance = 20;
    }

    // Spawn ghost after delay in higher rooms
    if (roomNum >= 2) {
        setTimeout(() => {
            if (!G.gameOver && !G.isHiding) {
                spawnGhost();
            }
        }, 5000 + Math.random() * 5000);
    }
}

function loadRoom(n) {
    if(n > 4 || n < 1) return;
    G.room = n;
    const r = ROOM_DATA[n];
    
    snd('stepSound',0.4);
    setTimeout(()=>snd('doorSound',0.5),300);
    
    buildRoom3D(n);

    const rColors = ['t1','t2','t3','t4'];
    document.getElementById('vignette').className = 'vignette ' + rColors[n-1];
    
    document.getElementById('roomName').textContent = r.name;
    showMsg(r.desc, 6000);
    
    // Sanity drops when entering new room
    updateSanity(-10);
}

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isWalking = false;

function onKeyDown(event) {
    if(!controls.isLocked) return;
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = true; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = true; break;
        case 'KeyE': interactWithHovered(); break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = false; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = false; break;
    }
}

function onMouseDown(event) {
    if(!controls.isLocked) return;
    if (event.button === 0) interactWithHovered();
}

function interactWithHovered() {
    if (currentHoverObj && currentHoverObj.userData.action) {
        const actionName = currentHoverObj.userData.action;
        if (typeof window[actionName] === 'function') {
            window[actionName](currentHoverObj);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (G.gameOver || G.won) return;

    const time = performance.now();

    if (controls.isLocked === true) {
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const speed = 30.0;
        if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

        const currentlyWalking = moveForward || moveBackward || moveLeft || moveRight;
        if (currentlyWalking && !isWalking) {
            isWalking = true;
            document.getElementById('stepSound').loop = true;
            snd('stepSound', 0.15);
        } else if (!currentlyWalking && isWalking) {
            isWalking = false;
            document.getElementById('stepSound').loop = false;
        }

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        
        const pos = controls.getObject().position;
        const b = 4.5;
        if(pos.x > b) pos.x = b;
        if(pos.x < -b) pos.x = -b;
        if(pos.z > 5) pos.z = 5;
        if(pos.z < -9.5) pos.z = -9.5;

        if (currentlyWalking) {
             camera.position.y = (ROOM_DATA[G.room].spawnY || 0) + 2 + Math.sin(time * 0.01) * 0.05;
        } else {
             camera.position.y = (ROOM_DATA[G.room].spawnY || 0) + 2;
        }

        // Update ghost
        updateGhost(delta);

        // Raycasting
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactables);

        const promptEl = document.getElementById('interactPrompt');
        const cross = document.getElementById('crosshair');

        if (intersects.length > 0 && intersects[0].distance < 4) {
            if (currentHoverObj !== intersects[0].object) {
                currentHoverObj = intersects[0].object;
                promptEl.textContent = "[E] " + currentHoverObj.userData.label;
                promptEl.style.display = 'block';
                cross.style.background = 'rgba(255,50,50,0.8)';
                cross.style.transform = 'translate(-50%,-50%) scale(1.5)';
            }
        } else {
            if (currentHoverObj !== null) {
                currentHoverObj = null;
                promptEl.style.display = 'none';
                cross.style.background = 'rgba(255,255,255,0.5)';
                cross.style.transform = 'translate(-50%,-50%) scale(1)';
            }
        }
    }

    if (Math.random() < 0.02) {
        flashlight.intensity = has('flashlight') ? 1.5 + (Math.random()-0.5)*0.2 : 0.8 + (Math.random()-0.5)*0.4;
    }

    prevTime = time;
    renderer.render(scene, camera);
}

// --- SYSTEMS ---

function addItem(emoji,name,id){
  if(G.collected.includes(id))return false;
  G.collected.push(id);G.inventory.push({emoji,name,id});
  const c=document.getElementById('invItems');
  c.innerHTML=G.inventory.map(i=>`<span class="inv-item">${i.emoji} ${i.name}</span>`).join('<br>');
  if(id === 'flashlight') {
      flashlight.angle = Math.PI / 4;
      flashlight.intensity = 1.5;
      flashlight.distance = 50;
  }
  updateSanity(5); // Finding items boosts sanity
  return true;
}
function has(id){return G.collected.includes(id);}

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
  updateSanity(-15);
  
  document.body.classList.add('shake');
  setTimeout(()=>document.body.classList.remove('shake'),400);
  
  const f=document.getElementById('flicker');
  f.style.background = '#cc0000';
  f.style.opacity = '0.5';
  setTimeout(()=>{f.style.opacity='0'; f.style.background='#fff';}, 200);

  showMsg(`💔 ${reason} — Lives: ${G.lives}`);
  if(G.lives<=0)setTimeout(()=>triggerDeath("You lost all sanity! The darkness took over..."),1500);
}

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
    if(G.timeLeft<=0)triggerDeath("⏰ Time ran out! Darkness consumed you...");
    
    // Sanity slowly drains over time
    if(G.timeElapsed % 15 === 0) updateSanity(-2);
    
    // Random ghost spawns
    if(G.timeElapsed % 30 === 0 && G.room >= 2 && !G.ghostActive && !G.isHiding) {
        if(Math.random() < 0.4) spawnGhost();
    }
  },1000);
}

function showMsg(txt,dur=3000){
  const m=document.getElementById('msg');
  m.textContent=txt;m.classList.remove('hidden');
  clearTimeout(window._mt);
  window._mt=setTimeout(()=>m.classList.add('hidden'),dur);
}

function openPuzzle(title,hint,answer,onOk){
  controls.unlock();
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
  setTimeout(()=>document.getElementById('pAns')?.focus(), 100);
}

window.checkPuzzle = function(correct){
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

window.closePuzzle = function(){
    document.getElementById('puzzle').classList.add('hidden');
    controls.lock();
}

function startJS(){
  clearInterval(G.jsTimer);
  G.jsTimer=setInterval(()=>{
    if(G.gameOver||G.won||!G.isStarted||G.isHiding)return;
    if(Math.random() < ROOM_DATA[G.room].jsChance) triggerJS();
  },1000);
}

function triggerJS(){
  const o=document.getElementById('js-overlay');
  o.style.display='flex';
  snd('jsSound',1.0);
  updateSanity(-20);
  setTimeout(()=>o.style.display='none',600);
}

function triggerDeath(reason="You didn't survive..."){
  if(G.gameOver)return;G.gameOver=true;
  controls.unlock();
  clearInterval(G.timer);clearInterval(G.jsTimer);
  stopSnd('bgMusic');stopSnd('hbSound');snd('goSound',0.8);
  despawnGhost();
  document.body.style.filter = 'none';
  const e=G.timeElapsed,m=Math.floor(e/60),s=e%60;
  document.getElementById('goReason').textContent=reason;
  document.getElementById('goTime').textContent=`${m}:${s.toString().padStart(2,'0')}`;
  setTimeout(()=>document.getElementById('gameOver').classList.remove('hidden'),1000);
}

function triggerWin(){
  if(G.won)return;G.won=true;
  controls.unlock();
  clearInterval(G.timer);clearInterval(G.jsTimer);
  stopSnd('bgMusic');stopSnd('hbSound');
  despawnGhost();
  document.body.style.filter = 'none';
  const m=Math.floor(G.timeLeft/60),s=G.timeLeft%60;
  document.getElementById('winTime').textContent=`${m}:${s.toString().padStart(2,'0')}`;
  document.getElementById('winLives').textContent=G.lives;
  setTimeout(()=>document.getElementById('winScreen').classList.remove('hidden'),800);
}

function applyDifficulty(){
  const d = localStorage.getItem('hDifficulty') || 'medium';
  if(d === 'easy'){ G.lives=5; G.timeLeft=480; }
  else if(d === 'hard'){ G.lives=1; G.timeLeft=180; }
  else { G.lives=3; G.timeLeft=300; }
  const mult = d==='easy'?0.3 : d==='hard'?2.5 : 1;
  Object.keys(ROOM_DATA).forEach(k=>ROOM_DATA[k].jsChance *= mult);
}

window.restartGame = function(){ window.location.reload(); }
window.saveScore = function() { showMsg(`✅ Score saved!`); }

// --- INTERACTION ACTIONS ---

window.searchDrawer = function(mesh){
  if(has('rusty_key')){showMsg("Empty.");return;}
  showMsg("You reach into the drawer... 🗝️ Found Rusty Key!");
  addItem('🗝️','Rusty Key','rusty_key');
  mesh.userData.label = "🗄️ Empty Drawer";
};

window.examineWebs = function(){
  showMsg("The webs look freshly made... faint scratching sounds above.");
  updateSanity(-3);
};

window.checkDoor1 = function(){
  if(has('rusty_key')){
      showMsg("You use the rusty key! Door opens...");
      loadRoom(2);
  } else {
      showMsg("🔒 Door is locked. You need a key...");
      updateSanity(-2);
  }
};

window.readNote1 = function(){
  showMsg('📝 Note: "They are watching. Code part 1: 1"', 5000);
};

// NEW: Hidden item in room 1
window.grabHiddenKey = function(mesh){
  if(has('extra_key')){showMsg("Already taken.");return;}
  addItem('🔑','Old Key','extra_key');
  showMsg("✨ You found a hidden old key! It might be useful...");
  roomGroup.remove(mesh);
  document.getElementById('interactPrompt').style.display = 'none';
};

// NEW: Hide in wardrobe room 1
window.hideWardrobe = function(){
  hideIn("wardrobe");
};

window.grabFlash = function(mesh){
  if(has('flashlight')){return;}
  addItem('🔦','Flashlight','flashlight');
  showMsg("Grabbed flashlight. F = toggle. Now you can see further!");
  roomGroup.remove(mesh);
  document.getElementById('interactPrompt').style.display = 'none';
};

window.goDownObj = function(){
  if(!has('flashlight')){showMsg("Too dark without light! Find a flashlight!");return;}
  loadRoom(3);
  showMsg("You descend...");
  if(!has('code_1')){
      addItem('📄','Code Piece: 3','code_1');
      showMsg("Found paper with '3' written in blood.");
  }
};

window.checkWall = function(){
  showMsg("Scratched into wall: 'Piece: 4.'");
  addItem('🔢','Code Piece: 4','wall_code');
};

// NEW: Hide under bed room 2
window.hideBed = function(){
  hideIn("bed");
};

// NEW: Hidden note room 2
window.readHiddenNote2 = function(){
  showMsg('📄 Hidden note: "She comes at night. Turn off your light to survive."', 5000);
  addItem('📝','Hidden Note','hidden_note2');
};

window.searchPapers = function(){
  showMsg("Dusty papers... One says: 'THE CODE IS 1 3 4 7'");
};

window.openCabinet = function(){
  if(!has('rusty_key')){showMsg("Cabinet locked! Need generic key.");return;}
  openPuzzle("Locked Cabinet",
    "Enter the 4-digit code from pieces (1-3-4-7):",
    "1347",
    ()=>{
      addItem('🗝️','Gate Key','gate_key');
      showMsg("✅ Cabinet opens! Inside — a gate key.");
    }
  );
};

window.moveTable = function(mesh){
  if(Math.random()<0.4){
    loseLife("Something grabbed you from underneath!");
    triggerJS();
  } else {
    showMsg("Floor says: 'END PORTAL: 1347'");
    mesh.position.y -= 1;
    mesh.userData.action = null;
  }
};

// NEW: Hide in closet room 3
window.hideCloset = function(){
  hideIn("closet");
};

// NEW: Old photograph room 3
window.examinePhoto = function(){
  showMsg("📸 A family photo... Everyone's eyes are scratched out. Written behind: 'FINAL: 7'", 5000);
  addItem('📸','Old Photo','photo');
  updateSanity(-8);
};

window.tryRoom4 = function(){
  loadRoom(4);    
};

window.lookFog = function(){
  if(Math.random()<0.6){
    showMsg("A face stares back. It SMILES. 😱");
    triggerJS();
    updateSanity(-10);
  } else {
    showMsg("Nothing but grey fog... for now.");
  }
};

// NEW: Hide behind pillar room 4
window.hidePillar = function(){
  hideIn("pillar");
};

window.enterCode = function(){
  if(!has('gate_key')){showMsg("Need the gate key from Room 3 cabinet.");return;}
  openPuzzle("🚪 FINAL GATE",
    "Enter the 4-digit escape code:",
    "1347",
    ()=>triggerWin()
  );
};
