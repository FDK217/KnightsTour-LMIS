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
let lmisDebug = { fallbackUsed: false, foundBy: null, input: [], bestPath: [] }; // Debug information for LMIS processing

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
    
    // Hide all view panels and remove their active state
    document.querySelectorAll('.view-panel').forEach(p => {
        p.classList.remove('active');
        p.classList.add('hidden');
    });

    // Show the selected view and mark it active
    const view = document.getElementById(`${tab}-view`);
    if (view) {
        view.classList.remove('hidden');
        view.classList.add('active');
    }

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
function validateLMISInput(inputStr) {
    if (!inputStr || inputStr.trim() === '') {
        return { valid: false, message: "Input kosong!" };
    }

    const raw = inputStr.split(',');
    let numbers = [];

    for (let val of raw) {
        val = val.trim();
        if (val === '') {
            return { valid: false, message: "Format input salah (ada koma ganda)." };
        }

        let num = Number(val);
        if (isNaN(num)) {
            return { valid: false, message: `Input bukan angka: "${val}"` };
        }

        numbers.push(num);
    }

    if (numbers.length === 0) {
        return { valid: false, message: "Tidak ada angka valid!" };
    }

    return { valid: true, numbers };
}


let lmisBestPath = [];
function isSubsequence(arr, sub) {
    let i = 0, j = 0;
    while (i < arr.length && j < sub.length) {
        if (arr[i] === sub[j]) j++;
        i++;
    }
    return j === sub.length;
}

function isIncreasing(seq) {
    for (let i = 1; i < seq.length; i++) {
        if (seq[i] <= seq[i - 1]) return false;
    }
    return true;
}


function startLMIS() {
    const inputStr = document.getElementById('lmis-input').value;

    // Validate & parse input using helper
    const validation = validateLMISInput(inputStr);
    if (!validation.valid) {
        alert(validation.message);
        return;
    }
    lmisInput = validation.numbers;



    const container = document.getElementById('tree-visualization');
    const resultBox = document.getElementById('lmis-result');
    container.innerHTML = '';
    resultBox.innerHTML = '<em>Memproses...</em>';

    // Create visual nodes (include index badge)
    lmisInput.forEach((num, idx) => {
        let n = document.createElement('div');
        n.className = 'num-node';
        n.innerHTML = `
            <div class="num-val">${num}</div>
            <div class="num-idx">#${idx}</div>
        `;
        container.appendChild(n);
    });

    // Reset logic
    lmisBestPath = [];
    lmisDebug = { fallbackUsed: false, foundBy: null, input: lmisInput.slice(), bestPath: [] };
    updateStatus("Mencari LMIS dengan Tree Search...", 10);

    try {
        // Run Recursive Search
        findLMISRecursive(-1, 0, []);

        // Fallback: if nothing found, pick a single maximum element
        if (!lmisBestPath || lmisBestPath.length === 0) {
            if (lmisInput.length > 0) {
                const maxVal = Math.max(...lmisInput);
                lmisBestPath = [maxVal];
                lmisDebug.fallbackUsed = true;
                lmisDebug.foundBy = 'fallback-max';
            }
        } else {
            lmisDebug.foundBy = 'tree-search';
        }
        lmisDebug.bestPath = lmisBestPath.slice();

        // Visualize and display final result (visualizeLMIS will update #lmis-result)
        visualizeLMIS(lmisBestPath);

        // Debug log (visible in console) to aid troubleshooting
        console.log('LMIS input:', lmisInput, 'bestPath:', lmisBestPath);

        updateStatus("Jawaban LMIS ditampilkan", 100);
    } catch (err) {
        console.error('LMIS error:', err);
        resultBox.innerHTML = `<p style="color:red"><strong>Error saat memproses LMIS:</strong> ${err.message}</p>`;
        updateStatus("Error saat memproses LMIS", 0);
    }
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

    // Branch 1: Include currIndex (Only if monotonically increasing)
    if (prevIndex === -1 || lmisInput[currIndex] > lmisInput[prevIndex]) {
        let newPath = [...currentPath, lmisInput[currIndex]];
        findLMISRecursive(currIndex, currIndex + 1, newPath);
    }

    // Branch 2: Exclude currIndex
    findLMISRecursive(prevIndex, currIndex + 1, currentPath);
}

function visualizeLMIS(bestPath) {
    const nodes = document.querySelectorAll('.num-node');
    const resultBox = document.getElementById('lmis-result');

    // Dim all nodes first
    nodes.forEach(n => {
        n.classList.remove('included');
        n.classList.add('dimmed');
    });

    // Highlight the nodes that are part of the best path in order and capture indices
    let pathIndex = 0;
    const bestIndices = [];
    lmisInput.forEach((num, index) => {
        if (pathIndex < bestPath.length && num === bestPath[pathIndex]) {
            if (nodes[index]) {
                nodes[index].classList.remove('dimmed');
                nodes[index].classList.add('included');
            }
            bestIndices.push(index);
            pathIndex++;
        }
    });

    // Show results (handle empty bestPath gracefully)
    if (!bestPath || bestPath.length === 0) {
        resultBox.innerHTML = `
            <h3>Jawaban LMIS</h3>
            <p><strong>Input:</strong> [ ${lmisInput.join(', ')} ]</p>
            <p><strong>Longest Monotonically Increasing Subsequence:</strong> <em>tidak ditemukan</em></p>
            <p><strong>Panjang LMIS:</strong> 0</p>
        `;
    } else {
        const indices0 = bestIndices.join(', ');
        const indices1 = bestIndices.map(i => i + 1).join(', ');
        resultBox.innerHTML = `
            <h3>Jawaban LMIS</h3>
            <p><strong>Input:</strong> [ ${lmisInput.join(', ')} ]</p>
            <p><strong>Longest Monotonically Increasing Subsequence:</strong></p>
            <p style="font-size:18px;">
                ➜ [ <strong>${bestPath.join(', ')}</strong> ]
            </p>
            <p><strong>Panjang LMIS:</strong> ${bestPath.length}</p>
            <p><strong>Indeks (0-based):</strong> [ ${indices0} ]</p>
            <p><strong>Indeks (1-based):</strong> [ ${indices1} ]</p>
            <p><small>Metode: Tree Search (Include / Exclude)</small></p>
        `;
    }

    // Append a small debug panel so results are visible without opening the console
    try {
        const debugObj = {
            input: lmisDebug.input || lmisInput,
            bestPath: bestPath,
            fallbackUsed: lmisDebug.fallbackUsed,
            foundBy: lmisDebug.foundBy
        };

        resultBox.innerHTML += `
            <details style="margin-top:12px;color:var(--text-muted);">
                <summary style="cursor:pointer">Debug Info</summary>
                <pre style="white-space:pre-wrap;background:rgba(255,255,255,0.02);padding:8px;border-radius:6px;margin-top:8px;color:var(--text-muted)">${JSON.stringify(debugObj, null, 2)}</pre>
            </details>
        `;
    } catch (e) {
        // Ignore debug rendering errors
        console.warn('Could not render LMIS debug panel:', e);
    }

    updateStatus("Jawaban LMIS ditampilkan", 100);
}
