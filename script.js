
/* ----------------------------------
   1) 설정값
---------------------------------- */

// 시작 이미지
const START_IMAGE = "images/img0.png";

// 랜덤 교체용 이미지 풀
const IMAGE_POOL = [
  "images/img0.png",
  "images/img1.png",
  "images/img2.png",
  "images/img3.png",
  "images/img4.png",
  "images/img5.png",
  "images/img6.png",
  "images/img7.png",
  "images/img8.png",
  "images/img9.png",
  "images/img10.png",
  "images/img11.png",
  "images/img12.png",
  "images/img13.png"
];

// 엔딩에서 사용할 이미지 풀
const ENDING_IMAGE_POOL = [
  "images/img0.png",
  "images/img1.png",
  "images/img2.png",
  "images/img3.png",
  "images/img4.png",
  "images/img5.png",
  "images/img6.png",
  "images/img7.png",
  "images/img8.png",
  "images/img9.png",
  "images/img10.png",
  "images/img11.png",
  "images/img12.png",
  "images/img13.png"
];

// 커서 따라오는 속도
const FOLLOW_SPEED = 0.4;

// 충돌 판정 여유
const HIT_PADDING = 10;

// 이미지가 한 번 바뀐 직후 잠깐 잠금
const COOLDOWN_MS = 250;

// 안내 문구 유지 횟수
const GUIDE_HIT_TARGET = 5;

// 투명 여백 대응용 충돌 박스 축소 비율
const HITBOX_SHRINK_RATIO = 0.28;

// 엔딩 조건
const ENDING_HIT_COUNT = 117;


/* ----------------------------------
   2) 마일스톤 문구 설정
---------------------------------- */
const MILESTONES = [
  { count: 25, text: "꽤 혼냈다!" },
  { count: 50, text: "많이 혼냈다!" },
  { count: 75, text: "충분히 혼냈다!" },
  { count: 100, text: "마음껏 혼냈다!" },
  { count: 117, text: "다 혼냈다!" }
];


/* ----------------------------------
   3) 요소 가져오기
---------------------------------- */
const toyWrap = document.getElementById("toyWrap");
const mainImage = document.getElementById("mainImage");
const guideMessage = document.getElementById("guideMessage");
const hitCounter = document.getElementById("hitCounter");
const milestoneMessage = document.getElementById("milestoneMessage");
const endingScreen = document.getElementById("endingScreen");
const endingTitle = document.getElementById("endingTitle");
const cursor = document.getElementById("cursor");


/* ----------------------------------
   4) 시작 이미지 고정
---------------------------------- */
mainImage.setAttribute("src", START_IMAGE);


/* ----------------------------------
   5) 커서 위치 상태
---------------------------------- */
let targetX = -200;
let targetY = -200;
let currentX = targetX;
let currentY = targetY;


/* ----------------------------------
   6) 상태값
---------------------------------- */
let isLocked = false;
let hitCount = 0;
let guideVisible = true;
let wasTouchingImage = false;
let endingStarted = false;

// 이미 보여준 마일스톤 중 가장 최근 횟수
let lastMilestoneCount = 0;

// 엔딩 반복용 interval id
let rainIntervalId = null;


/* ----------------------------------
   7) 포인터 위치 받기
---------------------------------- */
function updatePointerPosition(x, y) {
  targetX = x;
  targetY = y;
}

window.addEventListener("mousemove", (e) => {
  updatePointerPosition(e.clientX, e.clientY);
});

window.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches && e.touches[0]) {
      updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  },
  { passive: false }
);

window.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches && e.touches[0]) {
      updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  },
  { passive: false }
);


/* ----------------------------------
   8) 커서 애니메이션
---------------------------------- */
function animateCursor() {
  currentX += (targetX - currentX) * FOLLOW_SPEED;
  currentY += (targetY - currentY) * FOLLOW_SPEED;

  cursor.style.left = `${currentX}px`;
  cursor.style.top = `${currentY}px`;

  // 엔딩 시작 전까지만 충돌 체크
  if (!endingStarted) {
    checkCollision();
  }

  requestAnimationFrame(animateCursor);
}
animateCursor();


/* ----------------------------------
   9) 충돌 판정
---------------------------------- */
function isOverlapping(rect1, rect2, padding = 0) {
  return !(
    rect1.right - padding < rect2.left ||
    rect1.left + padding > rect2.right ||
    rect1.bottom - padding < rect2.top ||
    rect1.top + padding > rect2.bottom
  );
}

function shrinkRect(rect, ratio = 0.2) {
  const shrinkX = rect.width * ratio;
  const shrinkY = rect.height * ratio;

  return {
    left: rect.left + shrinkX,
    right: rect.right - shrinkX,
    top: rect.top + shrinkY,
    bottom: rect.bottom - shrinkY,
    width: rect.width - shrinkX * 2,
    height: rect.height - shrinkY * 2
  };
}

function checkCollision() {
  const cursorRect = cursor.getBoundingClientRect();
  const imageRect = mainImage.getBoundingClientRect();

  // 투명 여백 대응: 충돌 영역을 안쪽으로 줄임
  const reducedImageRect = shrinkRect(imageRect, HITBOX_SHRINK_RATIO);
  const isTouchingNow = isOverlapping(cursorRect, reducedImageRect, HIT_PADDING);

  // "새로 닿는 순간"에만 반응
  if (isTouchingNow && !wasTouchingImage && !isLocked) {
    wasTouchingImage = true;
    changeMainImage();
    return;
  }

  // 떨어지면 다시 반응 가능
  if (!isTouchingNow) {
    wasTouchingImage = false;
  }
}


/* ----------------------------------
   10) 이미지 교체
---------------------------------- */
function changeMainImage() {
  if (endingStarted) return;

  isLocked = true;
  hitCount += 1;

  // 카운터 / 마일스톤 / 엔딩 체크
  updateUIByHitCount();

  // 117회에 도달하면 엔딩 시작
  if (hitCount >= ENDING_HIT_COUNT) {
    startEnding();
    return;
  }

  const currentSrc = mainImage.getAttribute("src");
  const nextSrc = getRandomImageExcept(currentSrc);

  gsap.killTweensOf(mainImage);

  gsap.timeline({
    onComplete: () => {
      setTimeout(() => {
        isLocked = false;
      }, COOLDOWN_MS);
    }
  })
    .to(mainImage, {
      scale: 1.08,
      duration: 0.12,
      ease: "power2.out"
    })
    .add(() => {
      mainImage.setAttribute("src", nextSrc);
    })
    .to(mainImage, {
      scale: 1,
      duration: 0.18,
      ease: "back.out(2)"
    });
}


/* ----------------------------------
   11) UI 갱신
---------------------------------- */
function updateUIByHitCount() {
  // 1) 안내문구 / 카운터 처리
  if (guideVisible) {
    if (hitCount >= GUIDE_HIT_TARGET) {
      guideVisible = false;
      guideMessage.classList.add("hidden");
      hitCounter.classList.remove("hidden");
      hitCounter.textContent = `${hitCount}번 혼냈다!`;
    }
  } else {
    hitCounter.textContent = `${hitCount}번 혼냈다!`;
  }

  // 2) 마일스톤 문구 처리
  const reachedMilestone = getReachedMilestone(hitCount);

  if (reachedMilestone && reachedMilestone.count !== lastMilestoneCount) {
    lastMilestoneCount = reachedMilestone.count;
    showMilestoneMessage(reachedMilestone.text);
  }
}

function getReachedMilestone(count) {
  let matched = null;

  for (const milestone of MILESTONES) {
    if (count >= milestone.count) {
      matched = milestone;
    }
  }

  return matched;
}

function showMilestoneMessage(text) {
  milestoneMessage.textContent = text;
  milestoneMessage.classList.remove("hidden");

  gsap.killTweensOf(milestoneMessage);

  gsap.fromTo(
    milestoneMessage,
    { opacity: 0, y: 8, scale: 0.96 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.35,
      ease: "power2.out"
    }
  );
}


/* ----------------------------------
   12) 랜덤 이미지 선택
---------------------------------- */
function getRandomImageExcept(currentSrc) {
  const currentFileName = currentSrc.split("/").pop();

  const candidates = IMAGE_POOL.filter((path) => {
    return path.split("/").pop() !== currentFileName;
  });

  if (candidates.length === 0) return currentSrc;

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}


/* ----------------------------------
   13) 엔딩 시작
---------------------------------- */
function startEnding() {
  if (endingStarted) return;
  endingStarted = true;

  // 혹시 이전 interval이 있으면 정리
  if (rainIntervalId) {
    clearInterval(rainIntervalId);
    rainIntervalId = null;
  }

  // 메인 플레이 영역 숨김
  toyWrap.classList.add("hidden");

  // 엔딩 화면 표시
  endingScreen.classList.remove("hidden");

  // 중앙 문구 세팅
  endingTitle.textContent = "다 혼냈다!";

  // 커서를 엔딩에서 숨기고 싶으면 아래 줄 주석 해제
  // cursor.classList.add("hidden");

  // 중앙 문구 등장 애니메이션
  gsap.killTweensOf(endingTitle);
  gsap.set(endingTitle, {
    opacity: 0,
    scale: 0.85,
    y: 10
  });

  gsap.to(endingTitle, {
    opacity: 1,
    scale: 1,
    y: 0,
    duration: 0.7,
    ease: "back.out(1.8)"
  });

  // 1) 중앙에서 폭발하듯 퍼지는 연출
  createExplosionBurst();

  // 2) 잠깐 뒤부터 비처럼 계속 떨어지는 연출 시작
  setTimeout(() => {
    createLoopingRain();
  }, 700);
}


/* ----------------------------------
   14) 엔딩 연출
---------------------------------- */

/* 중앙에서 폭발하듯 퍼지는 연출 */
function createExplosionBurst() {
  const burstCount = window.innerWidth < 768 ? 26 : 40;
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  for (let i = 0; i < burstCount; i++) {
    const img = document.createElement("img");
    img.className = "rain-image";
    img.src =
      ENDING_IMAGE_POOL[Math.floor(Math.random() * ENDING_IMAGE_POOL.length)];
    img.alt = "";

    endingScreen.appendChild(img);

    const size = randomBetween(
      window.innerWidth < 768 ? 60 : 80,
      window.innerWidth < 768 ? 120 : 170
    );

    // 중앙에서 바깥으로 퍼질 목표 위치
    const angle = Math.random() * Math.PI * 2;
    const distance = randomBetween(
      window.innerWidth < 768 ? 120 : 180,
      window.innerWidth < 768 ? 320 : 520
    );

    const targetX = centerX + Math.cos(angle) * distance;
    const targetY = centerY + Math.sin(angle) * distance;

    const rotationStart = randomBetween(-30, 30);
    const rotationEnd = rotationStart + randomBetween(-360, 360);

    gsap.set(img, {
      x: centerX - size / 2,
      y: centerY - size / 2,
      width: size,
      height: size,
      rotation: rotationStart,
      scale: 0.2,
      opacity: 0
    });

    // 폭발하듯 퍼지기
    gsap.to(img, {
      x: targetX - size / 2,
      y: targetY - size / 2,
      rotation: rotationEnd,
      scale: 1,
      opacity: 1,
      duration: randomBetween(0.6, 1.1),
      ease: "power3.out"
    });

    // 퍼진 뒤 서서히 사라지기
    gsap.to(img, {
      opacity: 0,
      duration: 0.5,
      delay: randomBetween(1.0, 1.5),
      onComplete: () => {
        img.remove();
      }
    });
  }
}

/* 엔딩 비를 계속 반복해서 생성 */
function createLoopingRain() {
  spawnRainWave();

  rainIntervalId = setInterval(() => {
    spawnRainWave();
  }, 1400);
}

/* 한 번에 여러 장이 비처럼 떨어지는 웨이브 */
function spawnRainWave() {
  const waveCount = window.innerWidth < 768 ? 12 : 18;

  for (let i = 0; i < waveCount; i++) {
    createOneRainDrop(i * 0.08);
  }
}

/* 이미지 1개를 위에서 아래로 떨어뜨리기 */
function createOneRainDrop(delay = 0) {
  const img = document.createElement("img");
  img.className = "rain-image";
  img.src =
    ENDING_IMAGE_POOL[Math.floor(Math.random() * ENDING_IMAGE_POOL.length)];
  img.alt = "";

  endingScreen.appendChild(img);

  const size = randomBetween(
    window.innerWidth < 768 ? 64 : 80,
    window.innerWidth < 768 ? 120 : 170
  );

  const startX = Math.random() * window.innerWidth;
  const startY = -size - randomBetween(0, 180);
  const endY = window.innerHeight + size + 120;

  const driftX = randomBetween(-120, 120);
  const startRotation = randomBetween(-45, 45);
  const endRotation = startRotation + randomBetween(180, 720);
  const duration = randomBetween(2.8, 4.8);

  gsap.set(img, {
    x: startX,
    y: startY,
    width: size,
    height: size,
    rotation: startRotation,
    opacity: 1
  });

  gsap.to(img, {
    x: startX + driftX,
    y: endY,
    rotation: endRotation,
    duration,
    delay,
    ease: "none",
    onComplete: () => {
      img.remove();
    }
  });
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}


/* ----------------------------------
   15) 리사이즈 대응
---------------------------------- */
window.addEventListener("resize", () => {
  targetX = Math.min(targetX, window.innerWidth);
  targetY = Math.min(targetY, window.innerHeight);
  currentX = Math.min(currentX, window.innerWidth);
  currentY = Math.min(currentY, window.innerHeight);
});
