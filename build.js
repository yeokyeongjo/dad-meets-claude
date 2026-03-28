const fs = require('fs');

const screenshotB64 = fs.readFileSync('C:/Users/GA/아빠와클로드/screenshot.png').toString('base64');
const indexHtml = fs.readFileSync('C:/Users/GA/아빠와클로드/index.html', 'utf8');

// Start from the index.html, embed screenshot as base64
let html = indexHtml.replace(
  'src="screenshot.png"',
  'src="data:image/png;base64,' + screenshotB64 + '"'
);

// Replace minesweeper link with anchor to embedded game
html = html.replace(
  '<a href="minesweeper.html" class="game-link">🎮 지뢰찾기 직접 해보기</a>',
  '<a href="#game-embed" class="game-link" onclick="var g=document.getElementById(\'game-embed\');g.style.display=\'block\';g.scrollIntoView({behavior:\'smooth\'});return false;">🎮 지뢰찾기 직접 해보기</a>'
);

// Replace conversation.html link with anchor to embedded conversation
html = html.replace(
  '<a href="conversation.html" class="full-log-btn">전체 대화 기록 보기</a>',
  '<a href="#conv-embed" id="conv-toggle-btn" class="full-log-btn" onclick="var g=document.getElementById(\'conv-embed\');g.style.display=\'block\';g.scrollIntoView({behavior:\'smooth\'});return false;">전체 대화 기록 보기</a>'
);

// Minesweeper game HTML (embedded)
const minesweeperEmbed = `
<div id="game-embed" style="display:none; margin: 40px auto; max-width: 800px; background: #c0c0c0; border-radius: 16px; padding: 30px; text-align: center;">
  <h2 style="margin-bottom:10px; font-size:24px; color:#333;">지뢰찾기 💣</h2>
  <div style="margin-bottom:12px; display:flex; gap:8px; justify-content:center;">
    <button onclick="mineInit(9,9,10)" id="d-easy" style="padding:6px 16px;font-size:15px;cursor:pointer;background:#c0c0c0;border:2px outset #fff;font-weight:bold;">쉬움</button>
    <button onclick="mineInit(12,12,25)" id="d-medium" style="padding:6px 16px;font-size:15px;cursor:pointer;background:#c0c0c0;border:2px outset #fff;font-weight:bold;">보통</button>
    <button onclick="mineInit(16,16,50)" id="d-hard" style="padding:6px 16px;font-size:15px;cursor:pointer;background:#c0c0c0;border:2px outset #fff;font-weight:bold;">어려움</button>
  </div>
  <div style="display:flex;gap:20px;align-items:center;justify-content:center;margin-bottom:10px;background:#999;padding:8px 20px;border:2px inset #fff;font-size:20px;font-weight:bold;color:red;font-family:'Courier New',monospace;width:fit-content;margin-left:auto;margin-right:auto;">
    <span id="mine-count" style="background:#000;padding:4px 10px;min-width:50px;text-align:center;">010</span>
    <button id="face-btn" onclick="restartGame()" style="font-size:26px;cursor:pointer;background:#c0c0c0;border:2px outset #fff;padding:2px 6px;line-height:1;">😀</button>
    <span id="timer" style="background:#000;padding:4px 10px;min-width:50px;text-align:center;">000</span>
  </div>
  <div id="board" oncontextmenu="return false" style="display:inline-grid;gap:0;border:3px inset #fff;background:#c0c0c0;"></div>
  <div style="margin-top:14px;font-size:15px;color:#555;line-height:1.8;">
    <b>왼쪽 클릭</b> = 칸 열기 &nbsp;|&nbsp; <b>오른쪽 클릭</b> = 깃발 꽂기<br>
    숫자 = 주변 8칸에 있는 지뢰 개수 | 지뢰를 모두 피하면 승리!
  </div>
</div>
<style>
  .cell{width:36px;height:36px;border:2px outset #fff;background:#c0c0c0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;cursor:pointer;user-select:none;}
  .cell.revealed{border:1px solid #999;background:#d0d0d0;cursor:default;}
  .cell.mine-exploded{background:red;}
  .cell.flagged::after{content:'🚩';font-size:18px;}
  .n1{color:blue}.n2{color:green}.n3{color:red}.n4{color:darkblue}.n5{color:darkred}.n6{color:teal}.n7{color:black}.n8{color:gray}
</style>
<script>
let rows,cols,totalMines,mBoard,mRevealed,mFlagged,mMines,gameOver,gameWon,firstClick,timerInterval,seconds,flagCount;
function mineInit(r,c,m){rows=r;cols=c;totalMines=m;document.querySelectorAll('#game-embed button[id^="d-"]').forEach(b=>b.style.background='#c0c0c0');if(r===9)document.getElementById('d-easy').style.background='#a0a0a0';else if(r===12)document.getElementById('d-medium').style.background='#a0a0a0';else document.getElementById('d-hard').style.background='#a0a0a0';restartGame();}
function restartGame(){gameOver=false;gameWon=false;firstClick=true;flagCount=0;seconds=0;clearInterval(timerInterval);document.getElementById('timer').textContent='000';document.getElementById('mine-count').textContent=String(totalMines).padStart(3,'0');document.getElementById('face-btn').textContent='😀';mBoard=Array.from({length:rows},()=>Array(cols).fill(0));mRevealed=Array.from({length:rows},()=>Array(cols).fill(false));mFlagged=Array.from({length:rows},()=>Array(cols).fill(false));mMines=Array.from({length:rows},()=>Array(cols).fill(false));renderBoard();}
function placeMines(sR,sC){let p=0;while(p<totalMines){let r=Math.floor(Math.random()*rows),c=Math.floor(Math.random()*cols);if(mMines[r][c])continue;if(Math.abs(r-sR)<=1&&Math.abs(c-sC)<=1)continue;mMines[r][c]=true;p++;}for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){if(mMines[r][c]){mBoard[r][c]=-1;continue;}let cnt=0;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){let nr=r+dr,nc=c+dc;if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&mMines[nr][nc])cnt++;}mBoard[r][c]=cnt;}}
function renderBoard(){const el=document.getElementById('board');el.style.gridTemplateColumns='repeat('+cols+', 36px)';el.innerHTML='';for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const cell=document.createElement('div');cell.className='cell';cell.dataset.r=r;cell.dataset.c=c;cell.addEventListener('click',()=>handleClick(r,c));cell.addEventListener('contextmenu',e=>{e.preventDefault();handleFlag(r,c);});el.appendChild(cell);}}
function getCell(r,c){return document.querySelector('.cell[data-r="'+r+'"][data-c="'+c+'"]');}
function handleClick(r,c){if(gameOver||gameWon||mFlagged[r][c]||mRevealed[r][c])return;if(firstClick){firstClick=false;placeMines(r,c);timerInterval=setInterval(()=>{seconds++;document.getElementById('timer').textContent=String(seconds).padStart(3,'0');},1000);}if(mMines[r][c]){gameOver=true;clearInterval(timerInterval);document.getElementById('face-btn').textContent='😵';revealAll(r,c);return;}reveal(r,c);checkWin();}
function reveal(r,c){if(r<0||r>=rows||c<0||c>=cols)return;if(mRevealed[r][c]||mFlagged[r][c])return;mRevealed[r][c]=true;const cell=getCell(r,c);cell.classList.add('revealed');if(mBoard[r][c]>0){cell.textContent=mBoard[r][c];cell.classList.add('n'+mBoard[r][c]);}else if(mBoard[r][c]===0){for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)reveal(r+dr,c+dc);}}
function handleFlag(r,c){if(gameOver||gameWon||mRevealed[r][c])return;const cell=getCell(r,c);mFlagged[r][c]=!mFlagged[r][c];if(mFlagged[r][c]){cell.classList.add('flagged');flagCount++;}else{cell.classList.remove('flagged');flagCount--;}document.getElementById('mine-count').textContent=String(totalMines-flagCount).padStart(3,'0');}
function revealAll(cR,cC){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const cell=getCell(r,c);if(mMines[r][c]){cell.classList.add('revealed');cell.textContent='💣';if(r===cR&&c===cC)cell.classList.add('mine-exploded');}}}
function checkWin(){let u=0;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(!mRevealed[r][c])u++;if(u===totalMines){gameWon=true;clearInterval(timerInterval);document.getElementById('face-btn').textContent='😎';for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(mMines[r][c]){mFlagged[r][c]=true;getCell(r,c).classList.add('flagged');}document.getElementById('mine-count').textContent='000';setTimeout(()=>alert('축하합니다! 클리어! 🎉\\n시간: '+seconds+'초'),200);}}
mineInit(9,9,10);
</script>`;

// Load raw conversation blocks
const convBlocks = fs.readFileSync('C:/Users/GA/아빠와클로드/conv_blocks.html', 'utf8').replace('<!-- CONVERSATION_BLOCKS -->\n', '');

// Conversation embed
const convEmbed = `
<div id="conv-embed" style="display:none; background:#1e1e1e; border-radius:16px; margin:40px auto; max-width:800px; overflow:hidden;">
  <div style="background:#252526;border-bottom:1px solid #3c3c3c;padding:24px;text-align:center;">
    <h2 style="font-family:'JetBrains Mono',monospace;font-size:18px;color:#4ec9b0;font-weight:600;">> cat conversation.log</h2>
    <div style="font-size:14px;color:#808080;margin-top:6px;">전체 대화 기록</div>
  </div>
  <div style="padding:24px 20px; max-width:800px; margin:0 auto;">
    <div style="text-align:center;font-size:12px;color:#555;font-family:'JetBrains Mono',monospace;margin:16px 0 20px;letter-spacing:1px;">— 2026-03-28 FRI —</div>
    ` + convBlocks + `
  </div>
  <div style="text-align:center;padding:20px;border-top:1px solid #3c3c3c;color:#555;font-size:13px;font-family:'JetBrains Mono',monospace;">
    조여경 × Claude | 2026-03-28 <span style="color:#3c3c3c;">EOF</span>
    <br><br>
    <button onclick="document.getElementById('conv-embed').style.display='none';document.getElementById('conv-toggle-btn').scrollIntoView({behavior:'smooth'});" style="padding:12px 32px;background:#252526;color:#4ec9b0;border:1px solid #3c3c3c;border-radius:8px;font-family:'JetBrains Mono',monospace;font-size:14px;cursor:pointer;font-weight:600;transition:background 0.2s;" onmouseover="this.style.background='#333'" onmouseout="this.style.background='#252526'">대화 기록 접기 ▲</button>
  </div>
</div>`;

// Floating scroll-to-top button
const floatingBtn = `
<button onclick="window.scrollTo({top:0,behavior:'smooth'})" id="scroll-top-btn" style="position:fixed;bottom:28px;right:28px;width:48px;height:48px;border-radius:50%;background:#5a3e2b;color:#fff;border:none;font-size:22px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.25);z-index:999;transition:opacity 0.3s,transform 0.2s;opacity:0;pointer-events:none;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">↑</button>
<script>
window.addEventListener('scroll', function() {
  var btn = document.getElementById('scroll-top-btn');
  if (window.scrollY > 400) { btn.style.opacity='1'; btn.style.pointerEvents='auto'; }
  else { btn.style.opacity='0'; btn.style.pointerEvents='none'; }
});
</script>`;

// Insert before closing </body>
html = html.replace('</body>', minesweeperEmbed + '\n' + convEmbed + '\n' + floatingBtn + '\n</body>');

// Update title
html = html.replace('<title>아빠와 클로드의 첫 만남</title>', '<title>아빠와 클로드의 첫 만남 💛</title>');

fs.writeFileSync('C:/Users/GA/아빠와_클로드_첫만남_완전판.html', html, 'utf8');
console.log('Done! File size:', (fs.statSync('C:/Users/GA/아빠와_클로드_첫만남_완전판.html').size / 1024).toFixed(0) + 'KB');
