// --- JAVASCRIPT GAME LOGIC ---

// 1. setup the canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 2. Global Game Variable
let frames = 0; // Tracks game time
let lives = 3;
let score = 0;
let gameOver = false;
const groundY = 320; // where the floor sits on the Y axis

// 3. Player Object Definition
const player = {
    x: 50,
    y: 200,
    w: 30, //Width
    h: 30, //Height
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
}

//5. Input Handling (keyboard)
document.addEventListener('keydown', (e) => {
    //NEW: restart game if game over
    if (gameOver && e.code === 'Enter') {
        resetGame();
        return;
    }
    // Jump if space is pressed and we are on the ground
    if (e.code === 'Space' && player.isGrounded && !gameOver) {
        player.dy = player.jumpPower;
        player.isGrounded = false;
    }
    // Attack if 'F' is pressed and we aren't already attacking
    if (e.code === 'KeyF' && !player.isAttacking && !gameOver) {
        player.isAttacking = true;
        player.attackTimer = 8; // The attack lasts for 8 frames
    }
});

// 6. Update Game Logic (Physics, Movement, Collisions)
function update() {
    //New: Stop updating physics if Game Over
    if (gameOver) return;

    //Apply gravity to player
    player.dy += player.gravity;
    player.y += player.dy;

    //Stop player from falling through the ground
    if (player.y + player.h >= groundY) {
        player.y = groundY - player.h;
        player.dy = 0;
        player.isGrounded = true;
    }

    //Spawn enemies every 90 frames (roughly 1.5 seconds)
    if (frames % 90 === 0) {
        enemies.push({
            x: canvas.width, // Spawn on the far right
            y: groundY - 30, // Sit perfectly on the ground
            w: 30,
            h: 30,
            speed: 4 // Scroll speed to the left
        });
    }

    //Define the attack hitbox(the yellow arm)
    let attackBox = {
        x: player.x + player.w,
        y: player.y + 10,
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
        if (!player.isInvincible &&
            e.x < player.x + player.w &&
            e.x + e.w > player.x &&
            e.y < player.y + player.h &&
            e.y + e.h > player.y) {

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
    // Clear canvas & Draw Sky Blue Background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Flat Ground Line
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();

    //New: Draw Score and Lives
    ctx.fillStyle = 'black';
    ctx.font = '20px "Comic Sans MS"';
    ctx.fillText("SCORE: " + score, 20, 30);
    ctx.fillText("LIVES: " + lives, canvas.width - 120, 30);

    //New: Draw Player with blinking effect if invincible
    if (!player.isInvincible || frames % 10 < 5) {
        ctx.fillStyle = 'red';
        ctx.fillRect(player.x, player.y, player.w, player.h);
    }

    //Draw Attack (yellow Rectangle stretching right)
    if (player.isAttacking) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(player.x + player.w, player.y + 10, 150, 10);
    }

    //Draw Enemies (Navy Blue Squares)
    ctx.fillStyle = 'navy';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    });

    // NEW: Draw Game OVER SCREEN
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
}

//8. The Main Game Loop
function loop() {
    update();
    draw();
    requestAnimationFrame(loop); //loops over and over creating gluid motion
}

//Start the game!
loop();