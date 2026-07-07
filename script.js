// --- JAVASCRIPT GAME LOGIC ---

// 1. setup the canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 2. Global Game Variable
let frames = 0; // Tracks game time
let lives = 3;
let score = 0;
let gameOver = false;
let gameStarted = false;
let spawnTimer = 90;
const groundY = 320; // where the floor sits on the Y axis

// Audio setup
const bgMusic = new Audio('ost.mp3');
bgMusic.loop = true;

const jumpSound = new Audio ('jump.mp3');
const punchSound = new Audio('punch.mp3');

let bgmStarted = false;

//Image preloading
const bgImg = new Image();
bgImg.src = 'onepiecebackground.png';

const luffyRunImg = new Image();
luffyRunImg.src = 'luffy_running.png';

const luffyPunchImg = new Image();
luffyPunchImg.src = 'luffy_punch.png';

// store marine img in array to pick random
const marineImages = [
    new Image(),
    new Image(),
    new Image()
];
marineImages[0].src = 'marrine_1.png';
marineImages[1].src = 'marrine_2.png';
marineImages[2].src = 'marrine_3.png';

// 3. Player Object Definition
const player = {
    x: 50,
    y: 200,
    w: 60, //Width
    h: 60, //Height
    dy: 0, // Vertical velocity
    gravity: 0.6, // how fast the player falls
    jumpPower: -10, //How high the player jumps
    isGrounded: false,
    isAttacking: false,
    attackTimer: 0, // How long the arm stays stretched
    //NEW: Damage mechanics
    isInvincible: false,
    invincibleTimer:0
};

//4. Enemy Array
let enemies = [];

// NEW: Reset Function for Game Over
function resetGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    enemies = [];
    player.x = 50;
    player.y = 200;
    player.dy = 0;
    player.isInvincible = false;
    frames = 0;
    spawnTimer = 90;
}

//5. Input Handling (keyboard)
document.addEventListener('keydown', (e) => {

    if (!bgmStarted) {
        bgMusic.play();
        bgmStarted = true;
    }

    if (e.code === 'Space'){
        e.preventDefault();
    }

    if(!gameStarted && e.code === 'Enter') {
        gameStarted = true;
        resetGame();
        return;
    }

    //NEW: restart game if game over
    if (gameOver && e.code === 'Enter') {
        resetGame();
        return;
    }
    // Jump if space is pressed and we are on the ground
    if (e.code === 'Space' && player.isGrounded && !gameOver && gameStarted) {
        player.dy = player.jumpPower;
        player.isGrounded = false;

        jumpSound.currentTime = 0;
        jumpSound.play();
    }

    // Attack if 'F' is pressed and we aren't already attacking
    if (e.code === 'KeyF' && !player.isAttacking && !gameOver && gameStarted) {
        player.isAttacking = true;
        player.attackTimer = 8; // The attack lasts for 8 frames

        punchSound.currentTime = 0;
        punchSound.play();
    }
});

// 6. Update Game Logic (Physics, Movement, Collisions)
function update() {
    //New: Stop updating physics if Game Over
    if (gameOver || !gameStarted) return;

    //Apply gravity to player
    player.dy += player.gravity;
    player.y += player.dy;

    //Stop player from falling through the ground
    if (player.y + player.h >= groundY) {
        player.y = groundY - player.h;
        player.dy = 0;
        player.isGrounded = true;
    }

    spawnTimer--;

    //Spawn enemies every 90 frames (roughly 1.5 seconds)
    if (spawnTimer <= 0) {
        //Generate a random number: 0,1, or 2
        let randomMarine = Math.floor(Math.random() * 3);

        let currentSpeed = Math.min(12, 4 + (frames / 500));

        enemies.push({
            x: canvas.width, // Spawn on the far right
            y: groundY - 60, // Sit perfectly on the ground
            w: 60,
            h: 60,
            speed: currentSpeed, // Scroll speed to the left
            imageIndex: randomMarine
        });

        let currentSpawnRate = Math.max(35, 90 - Math.floor(frames / 100));

        spawnTimer = currentSpawnRate;
    }

    //Define the attack hitbox(the yellow arm)
    let attackBox = {
        x: player.x + player.w,
        y: player.y + 25,
        w: 150,
        h: 10
    };

    //Update enemies(Looping backwards prevents flickering when removing array items)
    for (let i = enemies.length - 1; i >=0; i--) {
        let e = enemies[i];
        e.x -= e.speed; //Move enemy left

        // Check collision between attack arm and enemy
        if (player.isAttacking) {
            if (e.x < attackBox.x + attackBox.w &&
                e.x + e.w > attackBox.x &&
                e.y < attackBox.y + attackBox.h &&
                e.y + e.h > attackBox.y) {

                // Destroy enemy by removing from array 
                enemies.splice(i, 1);

                score += 100;
                
                continue; // Skip the rest of this loop iteration    
            }
        }

        //New: Collision: Enemy hits Player

        let pX = player.x + 15;
        let pY = player.y + 10;
        let pW = player.w - 30;
        let pH = player.h - 10;

        let eX = e.x + 15;
        let eY = e.y + 15;
        let eW = e.w - 30;
        let eH = e.h - 15;

        if (!player.isInvincible &&
            eX < pX + pW &&
            eX + eW > pX &&
            eY < pY + pH &&
            eY + eH > pY) {

            lives--; //Take damage
            player.isInvincible = true;
            player.invincibleTimer = 60; //1 s of I-frames(at 60 fps)

            if (lives <=0) {
                gameOver = true;
            }
        }
        

        // Remove enemies that scroll off the left side of the screen
        if (e.x + e.w < 0) {
            enemies.splice(i, 1);
        }
    }

    // Handle attack snapping back
    if (player.isAttacking) {
        player.attackTimer--;
        if (player.attackTimer <=0) {
            player.isAttacking = false; // Arm snaps back
        }
    }

    // New: handle invinciblity timer
    if (player.isInvincible) {
        player.invincibleTimer--;
        if (player.invincibleTimer <= 0) {
            player.isInvincible = false;
        }
    }

    frames++;
}

//7. Draw Everything to the Screen
function draw(){
    //background
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    
    // Draw Flat Ground Line
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();

    // --- FIX: Player Drawing Logic Grouped Together ---
    if (player.isAttacking) {
        // Draw the punch sprite 
        ctx.drawImage(luffyPunchImg, player.x, player.y, player.w, player.h);
        
        // Draw Attack (yellow Rectangle stretching right)
        ctx.fillStyle = 'yellow';
        ctx.fillRect(player.x + player.w, player.y + 25, 150, 10);
    } else {
        // Draw the running sprite if not attacking
        if (!player.isInvincible || frames % 10 < 5) {
            ctx.drawImage(luffyRunImg, player.x, player.y, player.w, player.h);
        }
    }
    // --------------------------------------------------

    // Draw Score and Lives
    ctx.fillStyle = 'black';
    ctx.font = '20px "Comic Sans MS"';
    ctx.fillText("SCORE: " + score, 20, 30);
    ctx.fillText("LIVES: " + lives, canvas.width - 120, 30);

    // Draw enemies
    enemies.forEach(enemy => {
        let currentMarineImg = marineImages[enemy.imageIndex];
        ctx.drawImage(currentMarineImg, enemy.x, enemy.y, enemy.w, enemy.h);
    });

    // Draw Game OVER SCREEN
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Dark overlay
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'red';
        ctx.font = 'bold 40px "Comic Sans MS"';
        ctx.textAlign = 'center';
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = 'yellow';
        ctx.font = '20px "Comic Sans MS"';
        ctx.fillText("Press ENTER to Restart", canvas.width / 2, canvas.height / 2 + 20);

        ctx.textAlign = 'left'; // Reset text alignment for the next frame
    }
     if (!gameStarted) {
         ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
     
         ctx.fillStyle = '#00FF00';
         ctx.font = 'bold 40px "Comic Sans MS"';
         ctx.textAlign = 'center';
         ctx.fillText("LUFFY'S GRAND LINE RUN", canvas.width / 2, canvas.height / 2-20);
     
         if (Math.floor(Date.now() / 500) % 2 === 0) {
             ctx.fillStyle = 'yellow';
             ctx.font = '20px "Comic Sans MS"';
             ctx.fillText("Press ENTER to Start", canvas.width / 2, canvas.height / 2 + 30);
         }
     
         ctx.textAlign = 'left';
    }
}

//8. The Main Game Loop
function loop() {
    update();
    draw();
    requestAnimationFrame(loop); //loops over and over creating gluid motion
}

//Start the game!
loop();