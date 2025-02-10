const board = document.getElementById('board');
const cells = document.querySelectorAll('[data-cell]');
const status = document.getElementById('status');
const restartButton = document.getElementById('restartButton');
const toggleModeButton = document.getElementById('toggleMode');
const toggleThemeButton = document.getElementById('toggleTheme');
const moveSound = document.getElementById('moveSound');
const winSound = document.getElementById('winSound');
const scoreX = document.getElementById('scoreX');
const scoreO = document.getElementById('scoreO');
const toggleSoundButton = document.getElementById('toggleSound');
let isSoundEnabled = true;

let scores = {
    X: 0,
    O: 0
};
let isXTurn = true;
let gameActive = true;
let isComputerMode = false;
let currentTheme = 'dark';

const themes = ['dark', 'light', 'neon'];

const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
    [0, 4, 8], [2, 4, 6]             // Diagonais
];

// Cache de sons para reduzir delay
const moveSoundCache = [];
const SOUND_CACHE_SIZE = 3;

// Inicializa o cache de sons
for (let i = 0; i < SOUND_CACHE_SIZE; i++) {
    const sound = new Audio('sounds/move.mp3');
    sound.preload = 'auto';
    moveSoundCache.push(sound);
}

let currentSoundIndex = 0;

function playMoveSound() {
    if (!isSoundEnabled) return;
    
    try {
        // Usa o próximo som do cache
        const sound = moveSoundCache[currentSoundIndex];
        sound.currentTime = 0;
        sound.play().catch(error => console.log("Erro ao tocar o som:", error));
        
        // Atualiza o índice para o próximo som do cache
        currentSoundIndex = (currentSoundIndex + 1) % SOUND_CACHE_SIZE;
    } catch (error) {
        console.log("Erro ao manipular o som:", error);
    }
}

function handleClick(e) {
    // Previne comportamento de toque padrão apenas em dispositivos móveis
    if (e && e.type === 'touchend') {
        e.preventDefault();
    }
    
    const cell = e.target;
    if (!gameActive || cell.classList.contains('x') || cell.classList.contains('o')) {
        return;
    }

    const currentClass = isXTurn ? 'x' : 'o';
    placeMark(cell, currentClass);
    
    // Toca o som imediatamente
    playMoveSound();

    if (checkWin(currentClass)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        swapTurns();
        updateStatus();
        
        if (isComputerMode && !isXTurn) {
            setTimeout(computerMove, 500);
        }
    }
}

function computerMove() {
    if (!gameActive) return;

    let bestScore = -Infinity;
    let bestMove;

    // Encontra a melhor jogada usando minimax
    for (let i = 0; i < cells.length; i++) {
        if (!cells[i].classList.contains('x') && !cells[i].classList.contains('o')) {
            cells[i].classList.add('o');
            let score = minimax(cells, 0, false);
            cells[i].classList.remove('o');
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    // Executa a melhor jogada simulando um evento
    if (bestMove !== undefined) {
        const fakeEvent = { target: cells[bestMove] };
        handleClick(fakeEvent);
    }
}

function minimax(cells, depth, isMaximizing) {
    // Verifica se há um vencedor ou empate
    const result = checkGameState();
    if (result !== null) {
        return result;
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < cells.length; i++) {
            if (!cells[i].classList.contains('x') && !cells[i].classList.contains('o')) {
                cells[i].classList.add('o');
                let score = minimax(cells, depth + 1, false);
                cells[i].classList.remove('o');
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < cells.length; i++) {
            if (!cells[i].classList.contains('x') && !cells[i].classList.contains('o')) {
                cells[i].classList.add('x');
                let score = minimax(cells, depth + 1, true);
                cells[i].classList.remove('x');
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkGameState() {
    // Verifica vitória do O (computador)
    for (let combination of winningCombinations) {
        if (combination.every(index => cells[index].classList.contains('o'))) {
            return 10;
        }
    }
    
    // Verifica vitória do X (jogador)
    for (let combination of winningCombinations) {
        if (combination.every(index => cells[index].classList.contains('x'))) {
            return -10;
        }
    }
    
    // Verifica empate
    if ([...cells].every(cell => cell.classList.contains('x') || cell.classList.contains('o'))) {
        return 0;
    }
    
    // Jogo ainda em andamento
    return null;
}

function placeMark(cell, currentClass) {
    cell.classList.add(currentClass);
    
    if (currentClass === 'x') {
        // Cria as linhas do X
        const line1 = document.createElement('div');
        const line2 = document.createElement('div');
        
        line1.className = 'x-line x-line-1';
        line2.className = 'x-line x-line-2';
        
        cell.appendChild(line1);
        cell.appendChild(line2);
    } else if (currentClass === 'o') {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        
        svg.setAttribute('viewBox', '0 0 100 100');
        circle.setAttribute('cx', '50');
        circle.setAttribute('cy', '50');
        circle.setAttribute('r', '40');
        
        svg.appendChild(circle);
        cell.appendChild(svg);
    }
}

function swapTurns() {
    isXTurn = !isXTurn;
}

function updateStatus() {
    status.textContent = `Vez do jogador ${isXTurn ? 'X' : 'O'}`;
}

function checkWin(currentClass) {
    for (let i = 0; i < winningCombinations.length; i++) {
        if (winningCombinations[i].every(index => cells[index].classList.contains(currentClass))) {
            drawWinningLine(i);
            return true;
        }
    }
    return false;
}

function drawWinningLine(index) {
    const line = document.createElement('div');
    line.classList.add('line');
    
    switch(index) {
        case 6: // Diagonal principal (top-left to bottom-right)
            line.style.width = '140%';
            line.style.top = '50%';
            line.style.left = '-20%';
            line.style.transform = 'translateY(-50%) rotate(45deg)';
            line.style.transformOrigin = 'center';
            line.style.animation = 'growDiagonal1 0.5s ease-in forwards';
            break;
        case 7: // Diagonal secundária (top-right to bottom-left)
            line.style.width = '140%';
            line.style.top = '50%';
            line.style.left = '-20%';
            line.style.transform = 'translateY(-50%) rotate(-45deg)';
            line.style.transformOrigin = 'center';
            line.style.animation = 'growDiagonal2 0.5s ease-in forwards';
            break;
        default:
            if (index >= 0 && index <= 2) {
                // Linhas horizontais
                line.classList.add('horizontal', `line-${index}`);
                line.style.animation = 'growHorizontal 0.5s ease-in forwards';
            } else if (index >= 3 && index <= 5) {
                // Linhas verticais
                line.classList.add('vertical', `line-${index - 3}`);
                line.style.animation = 'growVertical 0.5s ease-in forwards';
            }
    }

    board.appendChild(line);
}

function isDraw() {
    return [...cells].every(cell => {
        return cell.classList.contains('x') || cell.classList.contains('o');
    });
}

function endGame(draw) {
    gameActive = false;
    if (draw) {
        status.textContent = 'Empate!';
    } else {
        const winner = isXTurn ? 'X' : 'O';
        status.textContent = `${winner} Venceu!`;
        scores[winner]++;
        updateScoreboard();
        
        // Toca o som de vitória apenas se o som estiver habilitado
        if (isSoundEnabled) {
            try {
                winSound.currentTime = 0;
                const playPromise = winSound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log("Erro ao tocar o som de vitória:", error);
                    });
                }
            } catch (error) {
                console.log("Erro ao manipular o som de vitória:", error);
            }
        }
        
        startConfetti();
    }
}

function updateScoreboard() {
    scoreX.textContent = scores.X;
    scoreO.textContent = scores.O;
}

function startConfetti() {
    particlesJS('particles', {
        particles: {
            number: { value: 100 },
            color: { value: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'] },
            shape: { type: 'circle' },
            opacity: { value: 0.8, random: true },
            size: { value: 5, random: true },
            move: {
                enable: true,
                speed: 6,
                direction: 'none',
                random: true,
                straight: false,
                out_mode: 'out'
            }
        }
    });

    setTimeout(() => {
        particlesJS('particles', { particles: { number: { value: 0 } } });
    }, 3000);
}

function startGame() {
    gameActive = true;
    isXTurn = true;
    cells.forEach(cell => {
        cell.classList.remove('x', 'o');
        // Remove todos os elementos filhos (SVGs e linhas do X)
        while (cell.firstChild) {
            cell.firstChild.remove();
        }
        // Remove todos os event listeners anteriores
        cell.removeEventListener('click', handleClick);
        cell.removeEventListener('touchend', handleClick);
        // Adiciona eventos para mouse e touch
        cell.addEventListener('click', handleClick, { once: true });
        cell.addEventListener('touchend', handleClick, { once: true });
    });
    const previousLine = board.querySelector('.line');
    if (previousLine) {
        previousLine.remove();
    }
    updateStatus();
    particlesJS('particles', { particles: { number: { value: 0 } } });
}

// Atualiza o modo de jogo para incluir dificuldade
function toggleMode() {
    isComputerMode = !isComputerMode;
    toggleModeButton.textContent = `Modo: ${isComputerMode ? 'vs IA' : '2 Jogadores'}`;
    startGame();
}

function toggleTheme() {
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    currentTheme = themes[nextIndex];
    document.body.setAttribute('data-theme', currentTheme);
}

function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    toggleSoundButton.innerHTML = isSoundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
}

restartButton.addEventListener('click', startGame);
toggleModeButton.addEventListener('click', toggleMode);
toggleThemeButton.addEventListener('click', toggleTheme);
toggleSoundButton.addEventListener('click', toggleSound);

// Previne zoom em duplo toque em dispositivos móveis
document.addEventListener('touchmove', function(e) {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });

// Previne comportamentos indesejados de toque
document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Inicialização
document.body.setAttribute('data-theme', currentTheme);
startGame();