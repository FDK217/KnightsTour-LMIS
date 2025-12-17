/**
 * GLOBAL VARIABLES
 */
let currentTab = 'knight';
let isRunning = false;
let animationSpeed = 50;

// Knight Variables
const boardSize = 8;
let board = [];
let knightPath = [];
let startPos = { x: 0, y: 0 }; // Default start
let tourType = 'open'; // 'open' or 'closed'
let abortController = null; // To stop async tasks

// LMIS Variables
let lmisInput = [];

/**
 * INITIALIZATION
 */
document.addEventListener('DOMContentLoaded', () => {
    createBoard();
    
    // Speed Slider Listener
    document.getElementById('speed-slider').addEventListener('input', (e) => {
        animationSpeed = 101 - e.target.value; // Invert so higher value = faster
    });
});

/**
 * UI CONTROL FUNCTIONS
 */
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[onclick="switchTab('${tab}')"]`).classList.add('active');
    
    document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(`${tab}-view`).classList.remove('hidden');

    document.getElementById('knight-controls').classList.toggle('hidden', tab !== 'knight');
    document.getElementById('lmis-controls').classList.toggle('hidden', tab !== 'lmis');
}

function updateStatus(text, progress = 0) {
    document.getElementById('status-text').innerText = text;
    document.getElementById('progress-fill').style.width = `${progress}%`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms * 5)); // Base multiplier
}

/**
 * ==========================================
 * TASK 1: KNIGHT'S TOUR LOGIC
 * ==========================================
 */

function createBoard() {
    const boardEl = document.getElementById('chessboard');
    boardEl.innerHTML = '';
    
    for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell', (x + y) % 2 === 0 ? 'light' : 'dark');
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.addEventListener('click', () => selectStart(x, y));
            boardEl.appendChild(cell);
        }
    }
    // Highlight default start
    selectStart(startPos.x, startPos.y, false);
}

function selectStart(x, y, manual = true) {
    if (isRunning) return;
    
    // Clear previous start
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('start', 'visited', 'current'));
    document.getElementById('lines-layer').innerHTML = ''; // Clear lines
    
    startPos = { x, y };
    const idx = y * boardSize + x;
    const cells = document.querySelectorAll('.cell');
    if(cells[idx]) cells[idx].classList.add('start');
    
    if (manual) updateStatus(`Posisi Awal: (${x}, ${y})`, 0);
}

function setTourType(type) {
    tourType = type;
    document.getElementById('btn-open').classList.toggle('active', type === 'open');
    document.getElementById('btn-closed').classList.toggle('active', type === 'closed');
}

function resetKnightBoard() {
    isRunning = false;
    if(abortController) abortController.abort(); // Kill running process
    createBoard();
    updateStatus("Reset Selesai", 0);
}

// Moves: (x, y) offsets
const moves = [
    [2, 1], [1, 2], [-1, 2], [-2, 1],
    [-2, -1], [-1, -2], [1, -2], [2, -1]
];

function isValid(x, y, visited) {
    return x >= 0 && x < boardSize && y >= 0 && y < boardSize && visited[y][x] === -1;
}

// Heuristic: Count valid moves from (x, y)
function getDegree(x, y, visited) {
    let count = 0;
    for (let i = 0; i < 8; i++) {
        if (isValid(x + moves[i][0], y + moves[i][1], visited)) count++;
    }
    return count;
}

async function startKnightTour() {
    if (isRunning) return;
    isRunning = true;
    abortController = new AbortController();
    const signal = abortController.signal;

    updateStatus("Menghitung Jalur...", 10);
    
    // Clear board visual
    document.querySelectorAll('.cell').forEach(c => {
        c.classList.remove('visited', 'current');
        c.innerText = '';
    });
    document.getElementById('lines-layer').innerHTML = '';

    // Initialize logic board
    let visited = Array(boardSize).fill().map(() => Array(boardSize).fill(-1));
    let path = [];
    
    // Solve Logic
    let success = solveWarnsdorff(startPos.x, startPos.y, 1, visited, path);

    if (success) {
        updateStatus("Menganimasikan...", 20);
        try {
            await animateTour(path, signal);
            updateStatus("Tour Selesai!", 100);
        } catch (e) {
            updateStatus("Dibatalkan.");
        }
    } else {
        updateStatus("Gagal menemukan solusi (Coba posisi lain).", 0);
    }
    isRunning = false;
}

// Warnsdorff's Algorithm implementation
function solveWarnsdorff(x, y, moveCount, visited, path) {
    visited[y][x] = moveCount;
    path.push({ x, y });

    if (moveCount === 64) {
        // If closed tour required, check if last connects to start
        if (tourType === 'closed') {
            for (let i = 0; i < 8; i++) {
                let nx = x + moves[i][0];
                let ny = y + moves[i][1];
                if (nx === startPos.x && ny === startPos.y) return true;
            }
            // Backtrack if not closed
            visited[y][x] = -1;
            path.pop();
            return false;
        }
        return true;
    }

    // Get all valid next moves
    let nextMoves = [];
    for (let i = 0; i < 8; i++) {
        let nx = x + moves[i][0];
        let ny = y + moves[i][1];
        if (isValid(nx, ny, visited)) {
            nextMoves.push({ x: nx, y: ny, degree: getDegree(nx, ny, visited) });
        }
    }

    // Sort by degree (Warnsdorff's rule)
    nextMoves.sort((a, b) => a.degree - b.degree);

    for (let move of nextMoves) {
        if (solveWarnsdorff(move.x, move.y, moveCount + 1, visited, path)) return true;
    }

    // Backtrack
    visited[y][x] = -1;
    path.pop();
    return false;
}

/**
 * Animate the knight's tour on the board
 */
async function animateTour(path, signal) {
    const cells = document.querySelectorAll('.cell');
    const cellSize = document.querySelector('.cell').offsetWidth;
    const linesLayer = document.getElementById('lines-layer');
    
    // Clear previous lines
    linesLayer.innerHTML = '';
    
    // Path strings for both white and black lines
    let whitePath = '';
    let blackPath = '';
    
    for (let i = 0; i < path.length; i++) {
        if (signal.aborted) throw new Error('Animation aborted');
        
        const {x, y} = path[i];
        const cellIndex = y * boardSize + x;
        const cell = cells[cellIndex];
        
        // Mark as visited
        cell.classList.add('visited');
        cell.innerText = i + 1;
        
        // Update current position
        document.querySelectorAll('.current').forEach(el => el.classList.remove('current'));
        cell.classList.add('current');
        
        // Calculate center of the cell
        const centerX = (x + 0.5) * cellSize;
        const centerY = (y + 0.5) * cellSize;
        
        // Add to paths
        const pathCommand = i === 0 ? 'M' : 'L';
        whitePath += `${pathCommand} ${centerX} ${centerY} `;
        blackPath += `${pathCommand} ${centerX} ${centerY} `;
        
        // Clear and redraw lines
        linesLayer.innerHTML = '';
        
        // Draw white semi-transparent line (thicker, in the background)
        if (i > 0) {
            const whitePathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            whitePathEl.setAttribute('d', whitePath);
            whitePathEl.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)');
            whitePathEl.setAttribute('stroke-width', '8');
            whitePathEl.setAttribute('fill', 'none');
            whitePathEl.setAttribute('stroke-linecap', 'round');
            whitePathEl.setAttribute('stroke-linejoin', 'round');
            linesLayer.appendChild(whitePathEl);
        }
        
        // Draw thin black line (thinner, on top)
        if (i > 0) {
            const blackPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            blackPathEl.setAttribute('d', blackPath);
            blackPathEl.setAttribute('stroke', 'rgba(0, 0, 0, 0.7)');
            blackPathEl.setAttribute('stroke-width', '2');
            blackPathEl.setAttribute('fill', 'none');
            blackPathEl.setAttribute('stroke-linecap', 'round');
            blackPathEl.setAttribute('stroke-linejoin', 'round');
            linesLayer.appendChild(blackPathEl);
        }
        
        // Update status
        updateStatus(`Langkah: ${i+1}/64`, 20 + (i / 64) * 70);
        
        // Add some delay between moves for visualization
        await sleep(animationSpeed);
    }
}

/**
 * ==========================================
 * TASK 2: LMIS (TREE APPLICATION)
 * ==========================================
 */

let lmisBestPath = [];

function startLMIS() {
    const inputStr = document.getElementById('lmis-input').value;
    // Parse input
    try {
        lmisInput = inputStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        if (lmisInput.length === 0) throw new Error();
    } catch (e) {
        alert("Input tidak valid!");
        return;
    }

    const container = document.getElementById('tree-visualization');
    container.innerHTML = '';
    
    // Create visual nodes
    lmisInput.forEach(num => {
        let n = document.createElement('div');
        n.className = 'num-node';
        n.innerText = num;
        container.appendChild(n);
    });

    // Reset logic
    lmisBestPath = [];
    updateStatus("Mencari LMIS dengan Tree Search...", 0);

    // Run Recursive Search
    findLMISRecursive(-1, 0, []);
    
    // Visualize Result
    visualizeLMIS(lmisBestPath);
}

// Tree / Recursive Logic for LMIS
// State: (Previous Index, Current Index, Current Path)
function findLMISRecursive(prevIndex, currIndex, currentPath) {
    // Base Case: Reached end of array
    if (currIndex === lmisInput.length) {
        if (currentPath.length > lmisBestPath.length) {
            lmisBestPath = [...currentPath];
        }
        return;
    }

    // Branch 1: Exclude currIndex
    findLMISRecursive(prevIndex, currIndex + 1, currentPath);

    // Branch 2: Include currIndex (Only if monotonically increasing)
    if (prevIndex === -1 || lmisInput[currIndex] > lmisInput[prevIndex]) {
        let newPath = [...currentPath, lmisInput[currIndex]];
        findLMISRecursive(currIndex, currIndex + 1, newPath);
    }
}

function visualizeLMIS(bestPath) {
    const nodes = document.querySelectorAll('.num-node');
    const resultBox = document.getElementById('lmis-result');
    
    // Reset styles
    nodes.forEach(n => n.className = 'num-node dimmed');

    // Highlight logic
    let pathIndex = 0;
    lmisInput.forEach((num, index) => {
        // If this number is in the best path (and in correct order)
        if (pathIndex < bestPath.length && num === bestPath[pathIndex]) {
            nodes[index].className = 'num-node included';
            pathIndex++;
        }
    });

    resultBox.innerHTML = `
        <h3>Hasil Akhir</h3>
        <p>Sequence Terpanjang: <strong>[ ${bestPath.join(', ')} ]</strong></p>
        <p>Panjang: <strong>${bestPath.length}</strong></p>
        <p><small>Solusi ditemukan menggunakan pencarian kedalaman (Tree/Recursive).</small></p>
    `;
    
    updateStatus("Pencarian LMIS Selesai", 100);
}