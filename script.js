
        
        // --- Game Setup Constants (Design Coordinates) ---
        const DESIGN_WIDTH = 700;
        const DESIGN_HEIGHT = 600;
        
        // These constants remain fixed relative to the design grid
        const PADDLE_WIDTH_DESIGN = 80;
        const PADDLE_HEIGHT_DESIGN = 8;
        const BALL_RADIUS_DESIGN = 10;
        const BRICK_ROWS = 9; 
        const BRICK_COLS = 10; 
        const PADDLE_SPEED = 35; // Pixel speed in DESIGN coordinates
        
        const BRICK_COLORS = [
            '#ff4444', '#ff6600', '#ff9900', '#ffcc00', '#ccff00', 
            '#66ff00', '#00ccff', '#0066ff', '#6600ff'
        ];
        
        // --- Responsive Variables ---
        let scaleFactorX = 1;
        let scaleFactorY = 1;
        let isMovingLeft = false;
        let isMovingRight = false;

        // --- DOM and Context ---
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        
        // --- 1. MapGenerator Class in JS ---
        class MapGenerator {
            constructor(row, col) {
                this.map = [];
                this.row = row;
                this.col = col;
                
                this.brickWidth = Math.floor(540 / col);
                this.brickHeight = Math.floor(150 / row);

                for (let i = 0; i < row; i++) {
                    this.map[i] = [];
                    for (let j = 0; j < col; j++) {
                        this.map[i][j] = 1;
                    }
                }
            }

            draw() {
                for (let i = 0; i < this.row; i++) {
                    for (let j = 0; j < this.col; j++) {
                        if (this.map[i][j] > 0) {
                            // Convert design coordinates to scaled coordinates
                            const brickX = (80 + j * this.brickWidth) * scaleFactorX;
                            const brickY = (50 + i * this.brickHeight) * scaleFactorY;
                            const bw = this.brickWidth * scaleFactorX;
                            const bh = this.brickHeight * scaleFactorY;

                            ctx.fillStyle = BRICK_COLORS[i % BRICK_COLORS.length];
                            ctx.fillRect(brickX, brickY, bw, bh);

                            ctx.strokeStyle = '#333';
                            ctx.lineWidth = 2 * scaleFactorX; // Scale line width
                            ctx.strokeRect(brickX, brickY, bw, bh);
                        }
                    }
                }
            }

            setBrick(value, row, col) {
                this.map[row][col] = value;
            }
        }

        // --- 2. GamePlay State Initialization ---
        let play = true;
        let score = 0;
        let totalBrick = BRICK_ROWS * BRICK_COLS;
        let ballposX = 350; // Design X
        let ballposY = 450; // Design Y
        let ballXdir = -2; 
        let ballYdir = -3;
        let playerX = (DESIGN_WIDTH - PADDLE_WIDTH_DESIGN) / 2; // Design X for Paddle
        let map = new MapGenerator(BRICK_ROWS, BRICK_COLS);
        
        // --- 3. Core Drawing Logic (Scaled) ---
        function drawGame() {
            // 1. Calculate the current scale factors
            scaleFactorX = canvas.width / DESIGN_WIDTH;
            scaleFactorY = canvas.height / DESIGN_HEIGHT;
            const borderSize = 5 * scaleFactorX;
            
            // Clear canvas
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Borders (Scaled)
            ctx.fillStyle = '#4cc9f0'; 
            ctx.fillRect(0, 0, canvas.width, borderSize); // Top
            ctx.fillRect(0, borderSize, borderSize, canvas.height); // Left
            ctx.fillRect(canvas.width - borderSize, borderSize, borderSize, canvas.height); // Right

            // Paddle (Scaled)
            const paddleScaledWidth = PADDLE_WIDTH_DESIGN * scaleFactorX;
            const paddleScaledHeight = PADDLE_HEIGHT_DESIGN * scaleFactorY;
            const paddleXScaled = playerX * scaleFactorX;
            const paddleYScaled = 550 * scaleFactorY;

            ctx.fillStyle = '#1e90ff';
            ctx.fillRect(paddleXScaled, paddleYScaled, paddleScaledWidth, paddleScaledHeight);

            // Bricks (Handled by MapGenerator)
            map.draw();

            // Ball (Scaled)
            const ballRadiusScaled = BALL_RADIUS_DESIGN * scaleFactorX;
            const ballXScaled = ballposX * scaleFactorX;
            const ballYScaled = ballposY * scaleFactorY;

            ctx.fillStyle = '#ff6347'; 
            ctx.beginPath();
            ctx.arc(ballXScaled + ballRadiusScaled, ballYScaled + ballRadiusScaled, ballRadiusScaled, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();

            // Score display (Scaled Font)
            ctx.fillStyle = '#4cc9f0';
            ctx.font = `${Math.floor(24 * scaleFactorY)}px serif`;
            ctx.textAlign = 'start';
            ctx.fillText('Score : ' + score, 550 * scaleFactorX, 35 * scaleFactorY);
            
            // Game Over and Win messages (Scaled Font and Position)
            if (!play) {
                ctx.font = `bold ${Math.floor(40 * scaleFactorY)}px serif`;
                ctx.textAlign = 'center';
                const messageY = 300 * scaleFactorY;

                if (totalBrick <= 0) {
                    ctx.fillStyle = '#4cc9f0';
                    ctx.fillText('🏆 YOU WON!! Score: ' + score, canvas.width / 2, messageY);
                } else if (ballposY >= 570) {
                    ctx.fillStyle = '#ff4444';
                    ctx.fillText('💀 GAME OVER! Score: ' + score, canvas.width / 2, messageY);
                }

                ctx.font = `bold ${Math.floor(30 * scaleFactorY)}px serif`;
                ctx.fillText('Press Enter to Restart', canvas.width / 2, messageY + (50 * scaleFactorY));
                
                cancelAnimationFrame(animationFrameId);
            }
        }
        
        // --- 4. Game Logic (Using Design Coordinates) ---
        function updateGame() {
            if (play) {
                // Handle continuous paddle movement (for touch/held keys)
                if (isMovingLeft) {
                    playerX = Math.max(playerX - (PADDLE_SPEED / 10), 5); 
                }
                if (isMovingRight) {
                    playerX = Math.min(playerX + (PADDLE_SPEED / 10), DESIGN_WIDTH - PADDLE_WIDTH_DESIGN - 5); 
                }

                ballposX += ballXdir;
                ballposY += ballYdir;

                const borderLimit = 5;

                // Wall collisions (Left, Right, Top) - Using DESIGN coordinates
                if (ballposX < borderLimit || ballposX > DESIGN_WIDTH - borderLimit - (BALL_RADIUS_DESIGN * 2)) {
                    ballXdir = -ballXdir;
                }
                if (ballposY < borderLimit) {
                    ballYdir = -ballYdir;
                }
                
                // Bottom boundary (Game Over)
                if (ballposY >= 570) {
                    play = false;
                }
                
                // Paddle collision (Using DESIGN coordinates)
                const ballBottom = ballposY + BALL_RADIUS_DESIGN * 2;
                const paddleTop = 550;

                if (ballBottom >= paddleTop && ballBottom <= paddleTop + PADDLE_HEIGHT_DESIGN &&
                    ballposX + BALL_RADIUS_DESIGN > playerX && ballposX + BALL_RADIUS_DESIGN < playerX + PADDLE_WIDTH_DESIGN) {
                    ballYdir = -ballYdir;
                }

                // Brick collision loop (Using DESIGN coordinates)
                for (let i = 0; i < map.row; i++) {
                    for (let j = 0; j < map.col; j++) {
                        if (map.map[i][j] > 0) {
                            
                            const brickX = 80 + j * map.brickWidth;
                            const brickY = 50 + i * map.brickHeight;
                            const bw = map.brickWidth;
                            const bh = map.brickHeight;
                            
                            // Simple collision detection (AABB)
                            if (ballposX + BALL_RADIUS_DESIGN * 2 > brickX && ballposX < brickX + bw &&
                                ballposY + BALL_RADIUS_DESIGN * 2 > brickY && ballposY < brickY + bh) {
                                
                                map.setBrick(0, i, j);
                                totalBrick--;
                                
                                const points = BRICK_ROWS - i;
                                score += points * 5; 
                                
                                if (score % 10 === 0 && score > 0) {
                                    increaseBallSpeed();
                                }
                                
                                // Collision logic to flip direction (simplified)
                                if (ballposX + BALL_RADIUS_DESIGN * 2 <= brickX || ballposX + 1 >= brickX + bw) {
                                    ballXdir = -ballXdir;
                                } else {
                                    ballYdir = -ballYdir;
                                }
                                
                                break; 
                            }
                        }
                    }
                }
                
                if (totalBrick <= 0) {
                    play = false;
                }
            }
        }
        
        function increaseBallSpeed() {
            const increaseFactor = 0.5;

            if (Math.abs(ballXdir) < 10) { 
                ballXdir += (ballXdir > 0 ? increaseFactor : -increaseFactor);
            }

            if (Math.abs(ballYdir) < 10) { 
                ballYdir += (ballYdir > 0 ? increaseFactor : -increaseFactor);
            }
        }

        // --- 5. Game Loop & Initialization ---
        function gameLoop() {
            updateGame();
            drawGame();
            animationFrameId = requestAnimationFrame(gameLoop);
        }

        function resetGame() {
            play = true;
            ballposX = 350;
            ballposY = 450;
            ballXdir = -2;
            ballYdir = -3;
            playerX = (DESIGN_WIDTH - PADDLE_WIDTH_DESIGN) / 2;
            score = 0;
            totalBrick = BRICK_ROWS * BRICK_COLS;
            map = new MapGenerator(BRICK_ROWS, BRICK_COLS);
        }
        
        // --- 6. Input Handling (Keyboard and Touch/Mouse) ---

        // Function to control paddle movement based on input state
        function setPaddleMovement(isLeft, isStart) {
            if (isLeft) {
                isMovingLeft = isStart;
            } else {
                isMovingRight = isStart;
            }
        }

        // Global function for touch/mouse controls (used in HTML)
        window.movePaddle = function(direction, isStart) {
            if (direction === -1) { // Left
                setPaddleMovement(true, isStart);
            } else if (direction === 1) { // Right
                setPaddleMovement(false, isStart);
            }
        }

        document.addEventListener('keydown', (e) => {
            const code = e.keyCode;
            
            if (code === 37) { // Left Arrow
                isMovingLeft = true;
            } else if (code === 39) { // Right Arrow
                isMovingRight = true;
            } else if (code === 13) { // Enter Key (Restart)
                if (!play) {
                    resetGame();
                    gameLoop();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const code = e.keyCode;
            
            if (code === 37) { // Left Arrow
                isMovingLeft = false;
            } else if (code === 39) { // Right Arrow
                isMovingRight = false;
            }
        });

        // Initialize and handle window resize for responsiveness
        function setupResponsiveness() {
            const adjustCanvasSize = () => {
                const containerWidth = window.innerWidth * 0.95; // 95vw from CSS
                const maxHeight = 600;

                // Set canvas dimensions based on CSS calculations
                let calculatedWidth = Math.min(containerWidth, DESIGN_WIDTH);
                let calculatedHeight = calculatedWidth * (DESIGN_HEIGHT / DESIGN_WIDTH);
                
                // Ensure max height is not exceeded
                if (calculatedHeight > maxHeight) {
                    calculatedHeight = maxHeight;
                    calculatedWidth = calculatedHeight * (DESIGN_WIDTH / DESIGN_HEIGHT);
                }

                // Set internal canvas resolution
                canvas.width = calculatedWidth;
                canvas.height = calculatedHeight;
            };

            adjustCanvasSize();
            window.addEventListener('resize', adjustCanvasSize);
        }

        // --- 7. Window Load ---
        window.onload = function() {
            setupResponsiveness();
            gameLoop();
        };
