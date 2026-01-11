// 3D Gallery Room - Three.js Implementation with Entry Door

let scene, camera, renderer;
let cssRenderer, cssScene;
let raycaster;
let posters = [];
let entryDoor;
let entryDoorGroup;
let numberGameObject;

// Game state
let game_state = 'entry'; // 'entry', 'entering', 'inside', 'exiting'
let is_animating = false;

// Movement state
const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
};
const MOVE_SPEED = 0.15;
const LOOK_SPEED = 0.002;

// Camera rotation
let pitch = 0;
let yaw = 0;

// Pointer lock state
let is_pointer_locked = false;

// Room dimensions
const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 12;
const ROOM_DEPTH = 20;

// Player bounds
const PLAYER_RADIUS = 1;
const PLAYER_HEIGHT = 0;

// Door dimensions
const DOOR_WIDTH = 4;
const DOOR_HEIGHT = 8;

// Poster data
const posterData = [
    {
        name: 'Train Trivia',
        url: 'Train-trivia/index.html',
        position: 'back',
        colors: { primary: '#8B4513', secondary: '#D2691E', accent: '#FFD700' },
        icon: '🚂'
    },
    {
        name: 'Ski Game',
        url: 'skigame/index.html',
        position: 'right',
        colors: { primary: '#1E90FF', secondary: '#87CEEB', accent: '#FFFFFF' },
        icon: '⛷️'
    },
    {
        name: 'Packers Roster',
        url: 'Packers-cards/index.html',
        position: 'left',
        colors: { primary: '#203731', secondary: '#FFB612', accent: '#FFFFFF' },
        icon: '🏈'
    }
];

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Camera setup - start outside the room looking at entry door
    // Door center Y is at floor + half door height
    const doorCenterY = -ROOM_HEIGHT / 2 + DOOR_HEIGHT / 2;
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, doorCenterY, ROOM_DEPTH / 2 + 8);
    camera.lookAt(0, doorCenterY, ROOM_DEPTH / 2);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // CSS3D Renderer for HTML elements in 3D space
    cssScene = new THREE.Scene();
    cssRenderer = new THREE.CSS3DRenderer();
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0';
    cssRenderer.domElement.style.left = '0';
    document.getElementById('canvas-container').appendChild(cssRenderer.domElement);
    
    // Setup number game in 3D space
    setupNumberGame3D();

    // Raycaster for click detection
    raycaster = new THREE.Raycaster();

    // Lighting
    setupLighting();

    // Build the entry wall (what you see first)
    buildEntryScene();

    // Build the room (hidden initially by the wall)
    buildRoom();

    // Add posters inside
    createPosters();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onClick);
    
    // Pointer lock
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', onPointerLockError);

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            
            // Check if returning from a poster page
            if (sessionStorage.getItem('returnToRoom') === 'true') {
                sessionStorage.removeItem('returnToRoom');
                startInsideRoom();
            }
        }, 500);
    }, 1000);

    // Hide instructions on entry screen
    const instructions = document.getElementById('instructions');
    if (instructions) {
        instructions.style.display = 'none';
    }

    // Setup number game
    setupNumberGame();

    // Start animation loop
    animate();
}

function startInsideRoom() {
    // Position camera inside the room
    camera.position.set(0, 0, 0);
    
    // Face the back wall (where Train Trivia is)
    yaw = 0;
    pitch = 0;
    updateCamera();
    
    // Open and close the door (so it's closed)
    entryDoor.rotation.y = 0;
    
    // Update game state
    game_state = 'inside';
    
    // Show instructions for inside view
    const instructions = document.getElementById('instructions');
    if (instructions) {
        instructions.innerHTML = '<p>Click to look around • WASD to move • Click posters to enter • Click door to exit</p>';
        instructions.style.display = 'block';
        instructions.style.opacity = '1';
    }
}

function setupNumberGame3D() {
    const numberGame = document.getElementById('number-game');
    
    // Create CSS3D object from the number game element
    numberGameObject = new THREE.CSS3DObject(numberGame);
    
    // Position on the wall just to the left of the door frame
    // This is where the door would cover it when opening
    const doorCenterY = -ROOM_HEIGHT / 2 + DOOR_HEIGHT / 2;
    numberGameObject.position.set(-DOOR_WIDTH / 2 - 1.8, doorCenterY, ROOM_DEPTH / 2 - 0.05);
    numberGameObject.scale.set(0.012, 0.012, 0.012); // Scale down the HTML element
    
    cssScene.add(numberGameObject);
}

function setupNumberGame() {
    const input = document.getElementById('number-input');
    const submitBtn = document.getElementById('number-submit');
    const response = document.getElementById('number-response');
    
    function processNumber() {
        const num = parseInt(input.value);
        let message = '';
        
        // Remove any existing rotation
        document.getElementById('canvas-container').classList.remove('rotating');
        
        switch(num) {
            case 118:
                message = 'fume';
                break;
            case 67:
                message = '🔄';
                const canvas = document.getElementById('canvas-container');
                canvas.classList.remove('rotating');
                void canvas.offsetWidth; // Force reflow to restart animation
                canvas.classList.add('rotating');
                break;
            case 69:
                message = 'cheeky ;)';
                break;
            case 420:
                message = 'blaze it 🔥';
                break;
            case 666:
                message = 'hail satan 😈';
                break;
            case 789:
                message = 'why he do dat?';
                break;
            default:
                message = 'try again';
        }
        
        response.textContent = message;
        response.classList.add('show');
        
        // Hide response after 3 seconds
        setTimeout(() => {
            response.classList.remove('show');
        }, 3000);
    }
    
    submitBtn.addEventListener('click', processNumber);
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            processNumber();
        }
    });
}

function setupLighting() {
    // Ambient light - increased so room is visible from outside
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Main spotlight from above (inside room)
    const mainLight = new THREE.SpotLight(0xfff5e6, 1.5);
    mainLight.position.set(0, ROOM_HEIGHT / 2 - 1, 0);
    mainLight.angle = Math.PI / 3;
    mainLight.penumbra = 0.5;
    mainLight.decay = 1;
    mainLight.distance = 30;
    mainLight.castShadow = true;
    scene.add(mainLight);

    // Light for entry door (outside)
    const entryLight = new THREE.PointLight(0xfff5e6, 1, 20);
    entryLight.position.set(0, 4, ROOM_DEPTH / 2 + 5);
    scene.add(entryLight);

    // Accent lights for posters
    const posterLights = [
        { position: [-ROOM_WIDTH / 2 + 1, 2, 0], target: [-ROOM_WIDTH / 2, 0, 0] },
        { position: [ROOM_WIDTH / 2 - 1, 2, 0], target: [ROOM_WIDTH / 2, 0, 0] },
        { position: [0, 3, -ROOM_DEPTH / 2 + 1], target: [0, 0, -ROOM_DEPTH / 2] },
        { position: [0, 3, ROOM_DEPTH / 2 - 1], target: [0, 0, ROOM_DEPTH / 2] }
    ];

    posterLights.forEach(lightConfig => {
        const light = new THREE.SpotLight(0xfff8dc, 0.8);
        light.position.set(...lightConfig.position);
        light.target.position.set(...lightConfig.target);
        light.angle = Math.PI / 6;
        light.penumbra = 0.3;
        light.decay = 1.5;
        light.distance = 15;
        scene.add(light);
        scene.add(light.target);
    });
}

function buildEntryScene() {
    // Yellow wall material
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFDB58,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide
    });

    // Create the front wall with a door hole
    // Door sits on the floor, so we need wall sections around it
    const wallY = 0;
    const floorY = -ROOM_HEIGHT / 2;
    const doorTopY = floorY + DOOR_HEIGHT; // Door top at floor + door height
    
    // Left section of wall (full height)
    const leftWallWidth = (ROOM_WIDTH - DOOR_WIDTH) / 2;
    const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(leftWallWidth, ROOM_HEIGHT),
        wallMaterial
    );
    leftWall.position.set(-DOOR_WIDTH / 2 - leftWallWidth / 2, wallY, ROOM_DEPTH / 2);
    leftWall.rotation.y = Math.PI;
    scene.add(leftWall);

    // Right section of wall (full height)
    const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(leftWallWidth, ROOM_HEIGHT),
        wallMaterial
    );
    rightWall.position.set(DOOR_WIDTH / 2 + leftWallWidth / 2, wallY, ROOM_DEPTH / 2);
    rightWall.rotation.y = Math.PI;
    scene.add(rightWall);

    // Top section above door (from door top to ceiling)
    const topWallHeight = ROOM_HEIGHT - DOOR_HEIGHT;
    const topWall = new THREE.Mesh(
        new THREE.PlaneGeometry(DOOR_WIDTH, topWallHeight),
        wallMaterial
    );
    topWall.position.set(0, doorTopY + topWallHeight / 2, ROOM_DEPTH / 2);
    topWall.rotation.y = Math.PI;
    scene.add(topWall);

    // Create the entry door
    createEntryDoor();

    // Floor outside
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d2817,
        roughness: 0.8,
        metalness: 0.05,
        side: THREE.DoubleSide
    });

    const outsideFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(ROOM_WIDTH + 10, 15),
        floorMaterial
    );
    outsideFloor.position.set(0, -ROOM_HEIGHT / 2, ROOM_DEPTH / 2 + 7.5);
    outsideFloor.rotation.x = -Math.PI / 2;
    scene.add(outsideFloor);
}

function createEntryDoor() {
    entryDoorGroup = new THREE.Group();
    
    // Door frame
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a3728,
        roughness: 0.6,
        metalness: 0.2
    });
    
    const frameThickness = 0.2;
    const frameDepth = 0.15;
    
    // Calculate door center Y position (door bottom at floor level)
    const doorCenterY = -ROOM_HEIGHT / 2 + DOOR_HEIGHT / 2; // Door sits on floor
    
    // Left frame
    const leftFrame = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, DOOR_HEIGHT + frameThickness, frameDepth),
        frameMaterial
    );
    leftFrame.position.set(-DOOR_WIDTH / 2 - frameThickness / 2, doorCenterY, ROOM_DEPTH / 2);
    scene.add(leftFrame);
    
    // Right frame
    const rightFrame = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, DOOR_HEIGHT + frameThickness, frameDepth),
        frameMaterial
    );
    rightFrame.position.set(DOOR_WIDTH / 2 + frameThickness / 2, doorCenterY, ROOM_DEPTH / 2);
    scene.add(rightFrame);
    
    // Top frame
    const topFrame = new THREE.Mesh(
        new THREE.BoxGeometry(DOOR_WIDTH + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    topFrame.position.set(0, doorCenterY + DOOR_HEIGHT / 2 + frameThickness / 2, ROOM_DEPTH / 2);
    scene.add(topFrame);

    // Door panel with texture (just wood, no text or icon)
    const doorTexture = createDoorTexture('', '');
    const doorMaterial = new THREE.MeshStandardMaterial({
        map: doorTexture,
        roughness: 0.5,
        metalness: 0.1
    });
    
    entryDoor = new THREE.Mesh(
        new THREE.BoxGeometry(DOOR_WIDTH, DOOR_HEIGHT, 0.1),
        doorMaterial
    );
    
    // Position door - pivot point on left edge for opening animation
    // Door sits on floor
    entryDoor.geometry.translate(DOOR_WIDTH / 2, 0, 0);
    entryDoor.position.set(-DOOR_WIDTH / 2, doorCenterY, ROOM_DEPTH / 2);
    
    entryDoorGroup.add(entryDoor);
    entryDoorGroup.position.set(0, 0, 0);
    scene.add(entryDoorGroup);
    
    // Door handle
    const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.3,
        metalness: 0.8
    });
    
    // Outside handle (front of door)
    const handleOutside = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        handleMaterial
    );
    handleOutside.position.set(DOOR_WIDTH - 0.4, 0, 0.1);
    entryDoor.add(handleOutside);
    
    // Inside handle (back of door)
    const handleInside = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        handleMaterial
    );
    handleInside.position.set(DOOR_WIDTH - 0.4, 0, -0.1);
    entryDoor.add(handleInside);
    
    // "Click to Enter" sign on door
    const signTexture = createSignTexture('Click to Enter');
    const signMaterial = new THREE.MeshStandardMaterial({
        map: signTexture,
        roughness: 0.4,
        metalness: 0.6
    });
    
    const sign = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.8, 0.05),
        signMaterial
    );
    sign.position.set(DOOR_WIDTH / 2, 0, 0.08);
    entryDoor.add(sign);
    
    // "Click to Exit" sign on inside of door
    const exitSignTexture = createSignTexture('Click to Exit');
    const exitSignMaterial = new THREE.MeshStandardMaterial({
        map: exitSignTexture,
        roughness: 0.4,
        metalness: 0.6
    });
    
    const exitSign = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.8, 0.05),
        exitSignMaterial
    );
    exitSign.position.set(DOOR_WIDTH / 2, 0, -0.08);
    exitSign.rotation.y = Math.PI; // Face the inside of the room
    entryDoor.add(exitSign);
}

function createSignTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 164;
    const ctx = canvas.getContext('2d');
    
    // Bright shiny gold background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.2, '#FFEC8B');
    gradient.addColorStop(0.4, '#FFFACD');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(0.6, '#FFFACD');
    gradient.addColorStop(0.8, '#FFD700');
    gradient.addColorStop(1, '#DAA520');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    
    // Inner border
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
    
    // Text settings
    ctx.font = 'bold 56px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillText(text, canvas.width / 2 + 3, canvas.height / 2 + 3);
    
    // Text outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    
    // Main text fill
    ctx.fillStyle = '#1a0a00';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Highlight on text
    ctx.fillStyle = 'rgba(80, 40, 20, 0.8)';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function createDoorTexture(text, icon) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Wood gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(0.5, '#A0522D');
    gradient.addColorStop(1, '#6B3E12');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Wood grain effect
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, 0);
        ctx.bezierCurveTo(
            Math.random() * canvas.width, canvas.height / 3,
            Math.random() * canvas.width, canvas.height * 2 / 3,
            Math.random() * canvas.width, canvas.height
        );
        ctx.stroke();
    }

    // Door panels (raised rectangles)
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(40, 40, canvas.width - 80, 280);
    ctx.fillRect(40, 360, canvas.width - 80, 280);
    ctx.fillRect(40, 680, canvas.width - 80, 280);
    
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, canvas.width - 80, 280);
    ctx.strokeRect(40, 360, canvas.width - 80, 280);
    ctx.strokeRect(40, 680, canvas.width - 80, 280);

    return new THREE.CanvasTexture(canvas);
}

function buildRoom() {
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFDB58,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d2817,
        roughness: 0.8,
        metalness: 0.05,
        side: THREE.DoubleSide
    });

    // Glass ceiling material
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0,
        side: THREE.DoubleSide,
        transmission: 0.9
    });

    // Back wall - solid wall (no door)
    const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT),
        wallMaterial
    );
    backWall.position.set(0, 0, -ROOM_DEPTH / 2);
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT),
        wallMaterial
    );
    leftWall.position.x = -ROOM_WIDTH / 2;
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT),
        wallMaterial
    );
    rightWall.position.x = ROOM_WIDTH / 2;
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // Front wall (inside view) - with door opening
    // Door sits on the floor
    const floorY = -ROOM_HEIGHT / 2;
    const doorTopY = floorY + DOOR_HEIGHT;
    
    const frontWallLeftWidth = (ROOM_WIDTH - DOOR_WIDTH) / 2;
    
    const frontWallLeft = new THREE.Mesh(
        new THREE.PlaneGeometry(frontWallLeftWidth, ROOM_HEIGHT),
        wallMaterial
    );
    frontWallLeft.position.set(-DOOR_WIDTH / 2 - frontWallLeftWidth / 2, 0, ROOM_DEPTH / 2);
    scene.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(
        new THREE.PlaneGeometry(frontWallLeftWidth, ROOM_HEIGHT),
        wallMaterial
    );
    frontWallRight.position.set(DOOR_WIDTH / 2 + frontWallLeftWidth / 2, 0, ROOM_DEPTH / 2);
    scene.add(frontWallRight);

    // Top section above entry door (from door top to ceiling)
    const frontTopWallHeight = ROOM_HEIGHT - DOOR_HEIGHT;
    const frontWallTop = new THREE.Mesh(
        new THREE.PlaneGeometry(DOOR_WIDTH, frontTopWallHeight),
        wallMaterial
    );
    frontWallTop.position.set(0, doorTopY + frontTopWallHeight / 2, ROOM_DEPTH / 2);
    scene.add(frontWallTop);


    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH),
        floorMaterial
    );
    floor.position.y = -ROOM_HEIGHT / 2;
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Glass ceiling with metal frame
    createGlassCeiling(glassMaterial);
    
    // Sky and sun above the ceiling
    createSkyAndSun();
    
    // Sun patch on floor with text
    createSunPatch();

    // Baseboards
    addBaseboards();
}

function createGlassCeiling(glassMaterial) {
    // Create a grid of glass panels with metal frames
    const panelCountX = 4;
    const panelCountZ = 4;
    const panelWidth = ROOM_WIDTH / panelCountX;
    const panelDepth = ROOM_DEPTH / panelCountZ;
    const frameWidth = 0.15;
    
    // Metal frame material
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.3,
        metalness: 0.8
    });
    
    // Create glass panels
    for (let x = 0; x < panelCountX; x++) {
        for (let z = 0; z < panelCountZ; z++) {
            const panel = new THREE.Mesh(
                new THREE.PlaneGeometry(panelWidth - frameWidth, panelDepth - frameWidth),
                glassMaterial
            );
            panel.position.set(
                -ROOM_WIDTH / 2 + panelWidth / 2 + x * panelWidth,
                ROOM_HEIGHT / 2,
                -ROOM_DEPTH / 2 + panelDepth / 2 + z * panelDepth
            );
            panel.rotation.x = Math.PI / 2;
            scene.add(panel);
        }
    }
    
    // Create frame beams (horizontal)
    for (let i = 0; i <= panelCountX; i++) {
        const beam = new THREE.Mesh(
            new THREE.BoxGeometry(frameWidth, 0.2, ROOM_DEPTH),
            frameMaterial
        );
        beam.position.set(-ROOM_WIDTH / 2 + i * panelWidth, ROOM_HEIGHT / 2, 0);
        scene.add(beam);
    }
    
    for (let i = 0; i <= panelCountZ; i++) {
        const beam = new THREE.Mesh(
            new THREE.BoxGeometry(ROOM_WIDTH, 0.2, frameWidth),
            frameMaterial
        );
        beam.position.set(0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2 + i * panelDepth);
        scene.add(beam);
    }
}

function createSkyAndSun() {
    // Sky dome above the room
    const skyGeometry = new THREE.SphereGeometry(50, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        side: THREE.BackSide
    });
    
    // Create gradient sky texture
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 512;
    skyCanvas.height = 512;
    const skyCtx = skyCanvas.getContext('2d');
    
    const skyGradient = skyCtx.createLinearGradient(0, 0, 0, skyCanvas.height);
    skyGradient.addColorStop(0, '#1e90ff');      // Deep blue at top
    skyGradient.addColorStop(0.4, '#87ceeb');    // Light blue
    skyGradient.addColorStop(0.7, '#b0e0e6');    // Pale blue
    skyGradient.addColorStop(1, '#fffacd');      // Warm horizon
    skyCtx.fillStyle = skyGradient;
    skyCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);
    
    // Add some wispy clouds
    skyCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 8; i++) {
        const cx = Math.random() * skyCanvas.width;
        const cy = 100 + Math.random() * 200;
        const rx = 40 + Math.random() * 60;
        const ry = 15 + Math.random() * 20;
        skyCtx.beginPath();
        skyCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        skyCtx.fill();
    }
    
    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    skyMaterial.map = skyTexture;
    
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.position.y = ROOM_HEIGHT / 2;
    scene.add(sky);
    
    // Sun sphere
    const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd44
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, ROOM_HEIGHT / 2 + 15, 0);
    scene.add(sun);
    
    // Sun glow (larger transparent sphere)
    const glowGeometry = new THREE.SphereGeometry(5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffee88,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(sun.position);
    scene.add(glow);
    
    // Sunlight coming through
    const sunLight = new THREE.DirectionalLight(0xfff5e0, 2);
    sunLight.position.set(0, ROOM_HEIGHT + 10, 0);
    sunLight.target.position.set(0, -ROOM_HEIGHT / 2, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -10;
    sunLight.shadow.camera.right = 10;
    sunLight.shadow.camera.top = 10;
    sunLight.shadow.camera.bottom = -10;
    scene.add(sunLight);
    scene.add(sunLight.target);
}

function createSunPatch() {
    // Create the sun patch texture with "Follow the Sun" text
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Warm sunlight gradient (circular)
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, 'rgba(255, 245, 200, 0.9)');
    gradient.addColorStop(0.3, 'rgba(255, 235, 180, 0.7)');
    gradient.addColorStop(0.6, 'rgba(255, 220, 150, 0.4)');
    gradient.addColorStop(0.85, 'rgba(255, 200, 100, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 180, 80, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle rays
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.fillStyle = '#fff8dc';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-30, canvas.width / 2);
        ctx.lineTo(30, canvas.width / 2);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
    
    // "Follow the Sun" text
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#8B4513';
    ctx.font = 'italic 72px "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow for depth
    ctx.shadowColor = 'rgba(139, 69, 19, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    ctx.fillText('Follow the Sun', canvas.width / 2, canvas.height / 2 - 20);
    
    // Sun icon below text
    ctx.shadowBlur = 4;
    ctx.font = '100px serif';
    ctx.fillText('☀️', canvas.width / 2, canvas.height / 2 + 80);
    
    // Create texture and mesh
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const patchGeometry = new THREE.PlaneGeometry(10, 10);
    const patchMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    
    const sunPatch = new THREE.Mesh(patchGeometry, patchMaterial);
    sunPatch.position.set(0, -ROOM_HEIGHT / 2 + 0.02, 0); // Slightly above floor to prevent z-fighting
    sunPatch.rotation.x = -Math.PI / 2;
    scene.add(sunPatch);
}

function addBaseboards() {
    const baseboardMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d1f14,
        roughness: 0.7
    });
    const baseboardHeight = 0.3;
    const baseboardDepth = 0.1;
    const floorY = -ROOM_HEIGHT / 2;

    // Left baseboard
    const leftBaseboard = new THREE.Mesh(
        new THREE.BoxGeometry(baseboardDepth, baseboardHeight, ROOM_DEPTH),
        baseboardMaterial
    );
    leftBaseboard.position.set(-ROOM_WIDTH / 2 + baseboardDepth / 2, floorY + baseboardHeight / 2, 0);
    scene.add(leftBaseboard);

    // Right baseboard
    const rightBaseboard = new THREE.Mesh(
        new THREE.BoxGeometry(baseboardDepth, baseboardHeight, ROOM_DEPTH),
        baseboardMaterial
    );
    rightBaseboard.position.set(ROOM_WIDTH / 2 - baseboardDepth / 2, floorY + baseboardHeight / 2, 0);
    scene.add(rightBaseboard);
    
    // Back baseboard (full width)
    const backBaseboard = new THREE.Mesh(
        new THREE.BoxGeometry(ROOM_WIDTH, baseboardHeight, baseboardDepth),
        baseboardMaterial
    );
    backBaseboard.position.set(0, floorY + baseboardHeight / 2, -ROOM_DEPTH / 2 + baseboardDepth / 2);
    scene.add(backBaseboard);
    
    // Front baseboard - left section (from left wall to door)
    const frontLeftWidth = (ROOM_WIDTH - DOOR_WIDTH) / 2;
    const frontLeftBaseboard = new THREE.Mesh(
        new THREE.BoxGeometry(frontLeftWidth, baseboardHeight, baseboardDepth),
        baseboardMaterial
    );
    frontLeftBaseboard.position.set(-DOOR_WIDTH / 2 - frontLeftWidth / 2, floorY + baseboardHeight / 2, ROOM_DEPTH / 2 - baseboardDepth / 2);
    scene.add(frontLeftBaseboard);
    
    // Front baseboard - right section (from door to right wall)
    const frontRightBaseboard = new THREE.Mesh(
        new THREE.BoxGeometry(frontLeftWidth, baseboardHeight, baseboardDepth),
        baseboardMaterial
    );
    frontRightBaseboard.position.set(DOOR_WIDTH / 2 + frontLeftWidth / 2, floorY + baseboardHeight / 2, ROOM_DEPTH / 2 - baseboardDepth / 2);
    scene.add(frontRightBaseboard);
}

function createPosterTexture(data) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, data.colors.primary);
    gradient.addColorStop(1, darkenColor(data.colors.primary, 20));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = data.colors.secondary;
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.strokeStyle = data.colors.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, canvas.width - 70, canvas.height - 70);

    ctx.font = '120px serif';
    ctx.textAlign = 'center';
    ctx.fillText(data.icon, canvas.width / 2, 200);

    ctx.fillStyle = data.colors.accent;
    ctx.font = 'bold 48px "Georgia", serif';
    ctx.fillText(data.name, canvas.width / 2, 320);

    ctx.strokeStyle = data.colors.secondary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 360);
    ctx.lineTo(canvas.width - 100, 360);
    ctx.stroke();

    ctx.fillStyle = data.colors.secondary;
    ctx.font = '24px "Georgia", serif';
    ctx.fillText('Click to Enter', canvas.width / 2, 420);

    drawThemeDecorations(ctx, data, canvas);

    return new THREE.CanvasTexture(canvas);
}

function drawThemeDecorations(ctx, data, canvas) {
    ctx.fillStyle = data.colors.secondary;
    ctx.globalAlpha = 0.3;

    if (data.name === 'Train Trivia') {
        for (let y = 480; y < 600; y += 30) {
            ctx.fillRect(100, y, canvas.width - 200, 5);
            for (let x = 110; x < canvas.width - 110; x += 40) {
                ctx.fillRect(x, y - 10, 8, 25);
            }
        }
    } else if (data.name === 'Ski Game') {
        ctx.beginPath();
        ctx.moveTo(80, 600);
        ctx.lineTo(150, 480);
        ctx.lineTo(220, 600);
        ctx.lineTo(280, 500);
        ctx.lineTo(350, 600);
        ctx.lineTo(400, 520);
        ctx.lineTo(432, 600);
        ctx.closePath();
        ctx.fill();
    } else if (data.name === 'Packers Roster') {
        for (let y = 480; y < 620; y += 35) {
            ctx.fillRect(80, y, canvas.width - 160, 3);
        }
        ctx.font = 'bold 80px "Georgia", serif';
        ctx.textAlign = 'center';
        ctx.fillText('G', canvas.width / 2, 560);
    }

    ctx.globalAlpha = 1;
}

function darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function createPosters() {
    posterData.forEach(data => {
        const texture = createPosterTexture(data);
        const posterWidth = 4;
        const posterHeight = 5;

        const posterGeometry = new THREE.PlaneGeometry(posterWidth, posterHeight);
        const posterMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.3,
            metalness: 0.1
        });

        const poster = new THREE.Mesh(posterGeometry, posterMaterial);
        poster.castShadow = true;
        poster.receiveShadow = true;

        const frameGeometry = new THREE.BoxGeometry(posterWidth + 0.3, posterHeight + 0.3, 0.15);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.5,
            metalness: 0.3
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);

        const posterGroup = new THREE.Group();
        posterGroup.add(frame);
        poster.position.z = 0.08;
        posterGroup.add(poster);

        if (data.position === 'left') {
            posterGroup.position.set(-ROOM_WIDTH / 2 + 0.1, 0, 0);
            posterGroup.rotation.y = Math.PI / 2;
        } else if (data.position === 'right') {
            posterGroup.position.set(ROOM_WIDTH / 2 - 0.1, 0, 0);
            posterGroup.rotation.y = -Math.PI / 2;
        } else if (data.position === 'front') {
            // Position to the left of the door (door is 3 units wide, centered at 0)
            // Poster is 4 units wide, so place it to the left where there's solid wall
            posterGroup.position.set(-DOOR_WIDTH / 2 - 2.5, 0, ROOM_DEPTH / 2 - 0.1);
            posterGroup.rotation.y = Math.PI;
        } else if (data.position === 'back') {
            // Position on the back wall (opposite of front wall)
            posterGroup.position.set(0, 0, -ROOM_DEPTH / 2 + 0.1);
            posterGroup.rotation.y = 0;
        }

        posterGroup.userData = { url: data.url, name: data.name };
        posters.push(posterGroup);
        scene.add(posterGroup);
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    if (game_state !== 'inside') return;
    
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.forward = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            keys.backward = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.right = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.forward = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            keys.backward = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.right = false;
            break;
    }
}

function onMouseMove(event) {
    if (!is_pointer_locked || game_state !== 'inside') return;
    
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    yaw -= movementX * LOOK_SPEED;
    pitch -= movementY * LOOK_SPEED;
    
    pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch));
}

function onClick(event) {
    if (is_animating) return;
    
    if (game_state === 'entry') {
        // Check if clicking on entry door
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(entryDoor, true);

    if (intersects.length > 0) {
            animateEnterRoom();
        }
    } else if (game_state === 'inside') {
        if (!is_pointer_locked) {
            renderer.domElement.requestPointerLock();
            return;
        }
        
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        
        // Check entry door (to exit)
        const doorIntersects = raycaster.intersectObject(entryDoor, true);
        if (doorIntersects.length > 0) {
            document.exitPointerLock();
            animateExitRoom();
            return;
        }
        
        // Check posters
        const posterIntersects = raycaster.intersectObjects(posters, true);
        if (posterIntersects.length > 0) {
            let posterGroup = posterIntersects[0].object;
        while (posterGroup.parent && !posterGroup.userData.url) {
            posterGroup = posterGroup.parent;
        }
        if (posterGroup.userData.url) {
            document.exitPointerLock();
                animateToPage(posterGroup.position.clone(), posterGroup.userData.url);
            }
        }
    }
}

function animateEnterRoom() {
    is_animating = true;
    game_state = 'entering';
    
    const instructions = document.getElementById('instructions');
    instructions.style.opacity = '0';
    
    // Fade out number game as door opens (simulates door covering it)
    const numberGame = document.getElementById('number-game');
    numberGame.style.transition = 'opacity 0.3s ease';
    numberGame.style.opacity = '0';
    
    // Door center Y position
    const doorCenterY = -ROOM_HEIGHT / 2 + DOOR_HEIGHT / 2;
    
    // Door opening animation
    const doorStartRotation = 0;
    const doorEndRotation = -Math.PI / 2;
    
    // Camera path - go through door center, then rise to room center
    // Start position (outside looking at door)
    const cameraStart = camera.position.clone();
    // End position - center of the room at eye level
    const cameraEnd = new THREE.Vector3(0, 0, 0);
    
    const startTime = Date.now();
    const doorDuration = 800;
    const walkDuration = 1500;
    const totalDuration = doorDuration + walkDuration;
    
    function animationLoop() {
        const elapsed = Date.now() - startTime;
        
        // Packers poster position on back wall
        const posterPosition = new THREE.Vector3(0, 0, -ROOM_DEPTH / 2 + 0.1);
        
        if (elapsed < doorDuration) {
            // Door opening phase - camera moves forward slightly and looks at poster
            const doorProgress = elapsed / doorDuration;
            const eased = easeInOutCubic(doorProgress);
            entryDoor.rotation.y = doorStartRotation + (doorEndRotation - doorStartRotation) * eased;
            
            // Move camera forward slightly to peer through the opening
            const peekDistance = 1.5; // How far forward to move
            const peekZ = cameraStart.z - peekDistance * eased;
            camera.position.set(0, doorCenterY, peekZ);
            
            // Always look at the Packers poster on back wall
            camera.lookAt(posterPosition);
        } else if (elapsed < totalDuration) {
            // Walking through phase - pan into room while facing poster
            const walkProgress = (elapsed - doorDuration) / walkDuration;
            const eased = easeInOutCubic(walkProgress);
            
            // Interpolate position - go through door center then rise to eye level
            const peekStart = new THREE.Vector3(0, doorCenterY, cameraStart.z - 1.5);
            const currentPos = new THREE.Vector3();
            currentPos.lerpVectors(peekStart, cameraEnd, eased);
            camera.position.copy(currentPos);
            
            // Always look at Packers poster on back wall during pan
            camera.lookAt(posterPosition);
        } else {
            // Animation complete
            camera.position.copy(cameraEnd);
            
            // Calculate yaw to face Packers poster on back wall
            // Camera is at (0, 0, 0), poster is at (0, 0, -ROOM_DEPTH/2 + 0.1)
            // In Three.js default: yaw=0 looks down negative Z, yaw=Math.PI looks down positive Z
            yaw = 0; // Face toward back wall (negative Z direction where poster is)
            pitch = 0;
            
            // Update camera orientation immediately using the yaw/pitch
            updateCamera();
            
            game_state = 'inside';
            is_animating = false;
            
            // Update instructions for inside view
            instructions.innerHTML = '<p>Click to look around • WASD to move • Click posters to enter • Click door to exit</p>';
            instructions.style.display = 'block';
            instructions.style.opacity = '1';
            
            // Close the door behind us
            animateCloseDoor();
            
            return;
        }
        
        requestAnimationFrame(animationLoop);
    }
    
    animationLoop();
}

function animateCloseDoor() {
    const doorStartRotation = entryDoor.rotation.y;
    const doorEndRotation = 0; // Closed position
    const startTime = Date.now();
    const duration = 500;
    
    function closeDoorLoop() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);
        
        entryDoor.rotation.y = doorStartRotation + (doorEndRotation - doorStartRotation) * eased;
        
        if (progress < 1) {
            requestAnimationFrame(closeDoorLoop);
        }
    }
    
    closeDoorLoop();
}

function animateExitRoom() {
    is_animating = true;
    game_state = 'exiting';
    
    const instructions = document.getElementById('instructions');
    instructions.style.opacity = '0';
    
    // Door center Y position
    const doorCenterY = -ROOM_HEIGHT / 2 + DOOR_HEIGHT / 2;
    
    // Door opening animation (opens inward, so positive rotation from inside)
    const doorStartRotation = entryDoor.rotation.y;
    const doorEndRotation = Math.PI / 2;
    
    // Camera path - transition from eye level to door center, then through door
    const cameraStart = camera.position.clone();
    // Position in front of door (inside, at door center height)
    const cameraAtDoor = new THREE.Vector3(0, doorCenterY, ROOM_DEPTH / 2 - 1);
    // Position outside after exiting (at door center height)
    const cameraEnd = new THREE.Vector3(0, doorCenterY, ROOM_DEPTH / 2 + 8);
    
    const startTime = Date.now();
    const walkToDoorDuration = 800;
    const doorDuration = 600;
    const walkOutDuration = 1000;
    const totalDuration = walkToDoorDuration + doorDuration + walkOutDuration;
    
    function animationLoop() {
        const elapsed = Date.now() - startTime;
        
        if (elapsed < walkToDoorDuration) {
            // Walk toward door phase - transition from current height to door center
            const progress = elapsed / walkToDoorDuration;
            const eased = easeInOutCubic(progress);
            
            const currentPos = new THREE.Vector3();
            currentPos.lerpVectors(cameraStart, cameraAtDoor, eased);
            camera.position.copy(currentPos);
            camera.lookAt(0, doorCenterY, ROOM_DEPTH / 2);
        } else if (elapsed < walkToDoorDuration + doorDuration) {
            // Door opening phase
            const doorProgress = (elapsed - walkToDoorDuration) / doorDuration;
            const eased = easeInOutCubic(doorProgress);
            entryDoor.rotation.y = doorStartRotation + (doorEndRotation - doorStartRotation) * eased;
            camera.lookAt(0, doorCenterY, ROOM_DEPTH / 2);
        } else if (elapsed < totalDuration) {
            // Walking through door and outside
            const walkProgress = (elapsed - walkToDoorDuration - doorDuration) / walkOutDuration;
            const eased = easeInOutCubic(walkProgress);
            
            const currentPos = new THREE.Vector3();
            currentPos.lerpVectors(cameraAtDoor, cameraEnd, eased);
            camera.position.copy(currentPos);
            camera.lookAt(0, doorCenterY, ROOM_DEPTH / 2);
        } else {
            // Animation complete - reset to entry state
            camera.position.copy(cameraEnd);
            camera.lookAt(0, doorCenterY, ROOM_DEPTH / 2);
            
            // Close the door
            entryDoor.rotation.y = 0;
            
            pitch = 0;
            yaw = Math.PI; // Face toward door
            
            game_state = 'entry';
            is_animating = false;
            
            // Fade in number game after door closes
            const numberGame = document.getElementById('number-game');
            numberGame.style.transition = 'opacity 0.3s ease';
            numberGame.style.opacity = '1';
            
            // Hide instructions on entry screen
            instructions.style.display = 'none';
            
            return;
        }
        
        requestAnimationFrame(animationLoop);
    }
    
    animationLoop();
}

function animateToPage(targetPosition, url) {
    is_animating = true;
    
    const startPosition = camera.position.clone();
    const startTime = Date.now();
    const duration = 800;

    function zoomAnimation() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);

        camera.position.lerpVectors(startPosition, targetPosition, eased * 0.7);
        
        if (progress < 1) {
            requestAnimationFrame(zoomAnimation);
        } else {
            // Remember we should return to inside the room
            sessionStorage.setItem('returnToRoom', 'true');
            window.location.href = url;
        }
    }

    zoomAnimation();
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function onPointerLockChange() {
    is_pointer_locked = document.pointerLockElement === renderer.domElement;
}

function onPointerLockError() {
    console.error('Pointer lock failed');
}

function updateMovement() {
    if (!is_pointer_locked || game_state !== 'inside') return;
    
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    
    const movement = new THREE.Vector3();
    
    if (keys.forward) movement.add(forward);
    if (keys.backward) movement.sub(forward);
    if (keys.right) movement.add(right);
    if (keys.left) movement.sub(right);
    
    if (movement.length() > 0) {
        movement.normalize();
    }
    
    let newPosX = camera.position.x + movement.x * MOVE_SPEED;
    let newPosZ = camera.position.z + movement.z * MOVE_SPEED;
    
    const minX = -ROOM_WIDTH / 2 + PLAYER_RADIUS;
    const maxX = ROOM_WIDTH / 2 - PLAYER_RADIUS;
    const minZ = -ROOM_DEPTH / 2 + PLAYER_RADIUS;
    const maxZ = ROOM_DEPTH / 2 - PLAYER_RADIUS - 2; // Don't walk through entry door
    
    newPosX = Math.max(minX, Math.min(maxX, newPosX));
    newPosZ = Math.max(minZ, Math.min(maxZ, newPosZ));
    
    camera.position.x = newPosX;
    camera.position.z = newPosZ;
}

function updateCamera() {
    if (game_state !== 'inside') return;
    
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    quaternion.setFromEuler(euler);
    camera.quaternion.copy(quaternion);
}

function checkCrosshairHover() {
    if (!is_pointer_locked || game_state !== 'inside') {
        document.getElementById('crosshair').classList.remove('hover');
        return;
    }
    
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const crosshair = document.getElementById('crosshair');
    
    // Check entry door (to exit)
    const doorIntersects = raycaster.intersectObject(entryDoor, true);
    if (doorIntersects.length > 0) {
        crosshair.classList.add('hover');
        return;
    }
    
    // Check posters
    const posterIntersects = raycaster.intersectObjects(posters, true);
    if (posterIntersects.length > 0) {
        crosshair.classList.add('hover');
    } else {
        crosshair.classList.remove('hover');
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (game_state === 'inside') {
    updateMovement();
    updateCamera();
    checkCrosshairHover();

    // Subtle floating animation for posters
    const time = Date.now() * 0.001;
    posters.forEach((poster, index) => {
        const offset = index * Math.PI * 0.5;
        const baseY = poster.userData.baseY || poster.position.y;
        if (!poster.userData.baseY) poster.userData.baseY = baseY;
        poster.position.y = baseY + Math.sin(time + offset) * 0.02;
    });
    }
    
    // Update crosshair visibility
    const crosshair = document.getElementById('crosshair');
    crosshair.style.display = (game_state === 'inside' && is_pointer_locked) ? 'block' : 'none';

    renderer.render(scene, camera);
    cssRenderer.render(cssScene, camera);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
