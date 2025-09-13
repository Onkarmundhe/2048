class Game2048 {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
        this.gameOver = false;
        this.won = false;
        this.boardSize = 4;
        this.cellGap = 15;
        this.boardPadding = 15;

        this.gameBoard = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.gameOverElement = document.getElementById('game-over');
        this.restartBtn = document.getElementById('restart-btn');
        this.tryAgainBtn = document.getElementById('try-again-btn');

        // Set default cellSize
        this.cellSize = 100;

        this.init();
        this.setupEventListeners();
        this.setupResizeListener();

        // Force a render after everything is set up
        setTimeout(() => {
            this.updateBoardDimensions();
            this.render();
        }, 200);
    }

    init() {
        this.initializeGrid();
        this.updateScoreDisplay();
        this.addRandomTile();
        this.addRandomTile();
        this.render();
    }

    initializeGrid() {
        this.grid = [];
        for (let i = 0; i < this.boardSize; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.grid[i][j] = null;
            }
        }
        this.score = 0;
        this.gameOver = false;
        this.won = false;
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;

            let moved = false;
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    moved = this.move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    moved = this.move('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    moved = this.move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    moved = this.move('right');
                    break;
            }

            if (moved) {
                this.addRandomTile();
                this.render();
                this.checkGameOver();
            }
        });

        this.restartBtn.addEventListener('click', () => this.restart());
        this.tryAgainBtn.addEventListener('click', () => this.restart());

        // Touch support for mobile
        this.setupTouchSupport();
    }

    setupTouchSupport() {
        let startX, startY, endX, endY;

        this.gameBoard.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            e.preventDefault(); // Prevent scrolling when touching the game board
        });

        this.gameBoard.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Prevent scrolling during swipe
        });

        this.gameBoard.addEventListener('touchend', (e) => {
            if (!startX || !startY || this.gameOver) return;

            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;

            const diffX = startX - endX;
            const diffY = startY - endY;
            const minSwipeDistance = window.innerWidth < 768 ? 30 : 50;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Horizontal swipe
                if (Math.abs(diffX) > minSwipeDistance) {
                    const moved = diffX > 0 ? this.move('left') : this.move('right');
                    if (moved) {
                        this.addRandomTile();
                        this.render();
                        this.checkGameOver();
                    }
                }
            } else {
                // Vertical swipe
                if (Math.abs(diffY) > minSwipeDistance) {
                    const moved = diffY > 0 ? this.move('up') : this.move('down');
                    if (moved) {
                        this.addRandomTile();
                        this.render();
                        this.checkGameOver();
                    }
                }
            }

            startX = startY = endX = endY = null;
        });
    }

    setupResizeListener() {
        window.addEventListener('resize', () => {
            this.updateBoardDimensions();
            this.render();
        });
    }

    updateBoardDimensions() {
        if (!this.gameBoard) {
            // Fallback if gameBoard is not available yet
            this.cellSize = 100;
            return;
        }

        try {
            // Get the actual game board container dimensions
            const gameBoardRect = this.gameBoard.getBoundingClientRect();

            // Calculate responsive dimensions based on the container size
            const availableSize = Math.min(gameBoardRect.width, gameBoardRect.height);
            const totalGapSpace = this.cellGap * (this.boardSize - 1);
            const totalPaddingSpace = this.boardPadding * 2;

            // Calculate cell size to fit within the available space
            this.cellSize = Math.floor((availableSize - totalGapSpace - totalPaddingSpace) / this.boardSize);

            // Ensure minimum cell size for very small screens
            this.cellSize = Math.max(this.cellSize, 50);
        } catch (error) {
            console.warn('Error updating board dimensions:', error);
            this.cellSize = 100; // Fallback size
        }
    }

    move(direction) {
        let moved = false;
        const previousGrid = this.grid.map(row => [...row]);

        switch (direction) {
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
        }

        // Check if grid actually changed
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (previousGrid[i][j] !== this.grid[i][j]) {
                    return true;
                }
            }
        }

        return moved;
    }

    moveLeft() {
        let moved = false;
        for (let i = 0; i < this.boardSize; i++) {
            const row = this.grid[i].filter(cell => cell !== null);
            const newRow = [];
            let merged = false;

            for (let j = 0; j < row.length; j++) {
                if (j < row.length - 1 && row[j].value === row[j + 1].value && !merged) {
                    const newValue = row[j].value * 2;
                    newRow.push({ value: newValue, merged: true });
                    this.score += newValue;
                    if (newValue === 2048 && !this.won) {
                        this.won = true;
                        setTimeout(() => alert('Congratulations! You reached 2048!'), 100);
                    }
                    j++; // Skip next tile as it's merged
                    merged = true;
                    moved = true;
                } else {
                    newRow.push({ value: row[j].value, merged: false });
                    merged = false;
                }
            }

            // Fill remaining spaces with null
            while (newRow.length < this.boardSize) {
                newRow.push(null);
            }

            if (JSON.stringify(this.grid[i]) !== JSON.stringify(newRow)) {
                moved = true;
            }

            this.grid[i] = newRow;
        }
        return moved;
    }

    moveRight() {
        this.reverseRows();
        const moved = this.moveLeft();
        this.reverseRows();
        return moved;
    }

    moveUp() {
        this.transpose();
        const moved = this.moveLeft();
        this.transpose();
        return moved;
    }

    moveDown() {
        this.transpose();
        const moved = this.moveRight();
        this.transpose();
        return moved;
    }

    reverseRows() {
        for (let i = 0; i < this.boardSize; i++) {
            this.grid[i].reverse();
        }
    }

    transpose() {
        const newGrid = [];
        for (let i = 0; i < this.boardSize; i++) {
            newGrid[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                newGrid[i][j] = this.grid[j][i];
            }
        }
        this.grid = newGrid;
    }

    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.grid[i][j] === null) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            this.grid[randomCell.row][randomCell.col] = { value: value, merged: false };
        }
    }

    checkGameOver() {
        // Check for empty cells
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.grid[i][j] === null) {
                    return;
                }
            }
        }

        // Check for possible merges
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const current = this.grid[i][j];
                if (current === null) continue;

                // Check right neighbor
                if (j < this.boardSize - 1 && this.grid[i][j + 1] &&
                    current.value === this.grid[i][j + 1].value) {
                    return;
                }

                // Check bottom neighbor
                if (i < this.boardSize - 1 && this.grid[i + 1][j] &&
                    current.value === this.grid[i + 1][j].value) {
                    return;
                }
            }
        }

        // No moves available
        this.gameOver = true;
        this.gameOverElement.classList.remove('hidden');
    }

    updateScoreDisplay() {
        this.scoreElement.textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
        }
        this.bestScoreElement.textContent = this.bestScore;
    }

    render() {
        this.updateScoreDisplay();
        this.updateBoardDimensions();

        // Clear existing tiles
        const existingTiles = this.gameBoard.querySelectorAll('.tile');
        existingTiles.forEach(tile => tile.remove());

        // Create new tiles
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = this.grid[i][j];
                if (cell !== null) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${cell.value}`;
                    if (cell.merged) {
                        tile.classList.add('merged');
                        // Reset merged flag after animation
                        setTimeout(() => {
                            cell.merged = false;
                        }, 200);
                    }

                    tile.textContent = cell.value;
                    const left = this.boardPadding + j * (this.cellSize + this.cellGap);
                    const top = this.boardPadding + i * (this.cellSize + this.cellGap);

                    tile.style.left = `${left}px`;
                    tile.style.top = `${top}px`;
                    tile.style.width = `${this.cellSize}px`;
                    tile.style.height = `${this.cellSize}px`;
                    tile.style.position = 'absolute';

                    // Ensure tiles are visible
                    tile.style.display = 'flex';
                    tile.style.justifyContent = 'center';
                    tile.style.alignItems = 'center';
                    tile.style.zIndex = '15';

                    this.gameBoard.appendChild(tile);
                }
            }
        }
    }

    restart() {
        this.gameOverElement.classList.add('hidden');
        this.initializeGrid();
        this.updateScoreDisplay();
        this.addRandomTile();
        this.addRandomTile();
        this.render();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
