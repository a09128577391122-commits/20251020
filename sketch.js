// --- 圓的設定 ---
let circles = [];
const COLORS = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
const NUM_CIRCLES = 20;

// 【新增】音效與計分相關變數
let popSound; 
const SOUND_FILE = 'pop.mp3'; // <-- 請將此替換成你的音效檔案名稱
let score = 0;
const FIXED_TEXT = '412730615';
const TEXT_COLOR = '#fb5607';
const TEXT_SIZE = 32;
// 目標顏色：#ffca3a (R:255, G:202, B:58)
const TARGET_R = 255;
const TARGET_G = 202;
const TARGET_B = 58;

// 【新增】preload 函數用於載入音效
function preload() {
  // 載入音效檔案
  popSound = loadSound(SOUND_FILE, 
    () => console.log('Sound loaded successfully'), 
    () => console.log('Sound failed to load'));
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  noStroke();
  // 初始化圓
  circles = [];
  for (let i = 0; i < NUM_CIRCLES; i++) {
    circles.push({
      x: random(width),
      y: random(height),
      r: random(50, 200),
      // 這裡直接使用 COLORS 陣列中的字串，雖然儲存為 p5.Color 物件
      color: color(random(COLORS)), 
      alpha: random(80, 255),
      speed: random(1, 5),
      popped: false,
      particles: []
    });
  }
  // 設定音效的整體音量，避免太吵
  if (popSound.isLoaded()) {
    popSound.setVolume(0.5); 
  }
}

function draw() {
  background('#fcf6bd');
  
  // 設定文字樣式
  textSize(TEXT_SIZE);
  fill(TEXT_COLOR);
  
  // 1. 顯示左上角固定文字
  textAlign(LEFT, TOP);
  text(FIXED_TEXT, 10, 10); // 留邊距 10px
  
  // 2. 顯示右上角分數
  textAlign(RIGHT, TOP);
  text("分數: " + score, width - 10, 10); // 留邊距 10px
  
  
  for (let c of circles) {
    // 氣球未爆破才顯示並移動
    if (!c.popped) {
      // *** 已移除隨機爆破邏輯 ***

      c.y -= c.speed;
      if (c.y + c.r / 2 < 0) { // 如果圓完全移出畫面頂端
        c.y = height + c.r / 2;  // 從底部重新出現
        c.x = random(width);
        c.r = random(50, 200);
        c.color = color(random(COLORS));
        c.alpha = random(80, 255);
        c.speed = random(1, 5);
      }
      
      // 繪製氣球
      c.color.setAlpha(c.alpha); // 設定透明度
      fill(c.color); // 使用設定的顏色
      circle(c.x, c.y, c.r); // 畫圓

      // 在圓的右上方1/4圓的中間產生方形（原本裝飾）
      let squareSize = c.r / 6;
      let angle = -PI / 4; // 右上45度
      let distance = c.r / 2 * 0.65;
      let squareCenterX = c.x + cos(angle) * distance;
      let squareCenterY = c.y + sin(angle) * distance;
      fill(255, 255, 255, 120); // 白色透明
      rect(squareCenterX, squareCenterY, squareSize, squareSize);
      
    } else {
      // 更新並繪製爆破粒子
      updateAndDrawParticles(c);
    }
  }
}

// 【新增】滑鼠點擊偵測與計分邏輯
function mousePressed() {
  // 從後往前迭代，確保點擊到的是最上層的氣球
  for (let i = circles.length - 1; i >= 0; i--) {
    let c = circles[i];
    
    // 檢查氣球未爆破 且 滑鼠在氣球範圍內
    if (!c.popped) {
      let d = dist(mouseX, mouseY, c.x, c.y);
      if (d < c.r / 2) {
        
        // 1. 爆破氣球
        popCircle(c);
        
        // 2. 計分邏輯
        let circleR = red(c.color);
        let circleG = green(c.color);
        let circleB = blue(c.color);
        
        // 比對目標顏色 #ffca3a (R:255, G:202, B:58)
        if (circleR === TARGET_R && circleG === TARGET_G && circleB === TARGET_B) {
          score += 1; // 正確顏色加 1 分
        } else {
          score -= 1; // 其他顏色扣 1 分
        }
        
        // 點擊後跳出迴圈，只處理一個氣球
        return; 
      }
    }
  }
}

function popCircle(c) {
  // 【修改】播放音效
  if (popSound && popSound.isLoaded() && !popSound.isPlaying()) {
     // 播放音效。使用 rate(random(0.9, 1.1)) 可以讓每次爆破的音高略有不同
     popSound.play();
  }
  
  c.popped = true;
  c.particles = [];
  let count = floor(map(c.r, 50, 200, 8, 28)); // 依氣球大小決定碎片數
  for (let i = 0; i < count; i++) {
    let angle = random(TWO_PI);
    let speed = random(1, 6) * (c.r / 100);
    c.particles.push({
      x: c.x,
      y: c.y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed - random(0, 2),
      life: floor(random(30, 90)),
      size: random(3, 8),
      color: color(red(c.color), green(c.color), blue(c.color), 255)
    });
  }
}

function updateAndDrawParticles(c) {
  let alive = 0;
  for (let p of c.particles) {
    if (p.life > 0) {
      // 更新
      p.vy += 0.12; // 模擬重力
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.life--;
      // 繪製（用小圓代表碎片）
      fill(red(p.color), green(p.color), blue(p.color), map(p.life, 0, 90, 0, 255));
      circle(p.x, p.y, p.size);
      alive++;
    }
  }
  // 若所有粒子都消失，重生氣球（從底部出現）
  if (alive === 0) {
    respawnCircle(c);
  }
}

function respawnCircle(c) {
  c.popped = false;
  c.particles = [];
  c.x = random(width);
  c.y = height + c.r / 2 + random(20, 200);
  c.r = random(50, 200);
  c.color = color(random(COLORS));
  c.alpha = random(80, 255);
  c.speed = random(1, 5);
}

function windowResized() {
  // 保持簡單：重新調整畫布並將圓隨機重新分布（維持原本行為）
  resizeCanvas(windowWidth, windowHeight);
  for (let c of circles) {
    c.x = random(width);
    c.y = random(height);
  }
}