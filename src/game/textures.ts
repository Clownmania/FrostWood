import * as THREE from 'three';

export interface ProceduralTextureSet {
  snowMap: THREE.CanvasTexture;
  snowBump: THREE.CanvasTexture;
  snowNormal: THREE.CanvasTexture;
  snowRoughness: THREE.CanvasTexture;
  snowMicroNormal: THREE.CanvasTexture;
  snowClearcoatRoughness: THREE.CanvasTexture;
  timberMap: THREE.CanvasTexture;
  timberBump: THREE.CanvasTexture;
  timberNormal: THREE.CanvasTexture;
  barkMap: THREE.CanvasTexture;
  barkBump: THREE.CanvasTexture;
  barkNormal: THREE.CanvasTexture;
  birchBarkMap: THREE.CanvasTexture;
  birchBarkBump: THREE.CanvasTexture;
  logEndMap: THREE.CanvasTexture;
  stoneMap: THREE.CanvasTexture;
  stoneBump: THREE.CanvasTexture;
  stoneNormal: THREE.CanvasTexture;
  rockMap: THREE.CanvasTexture;
  rockBump: THREE.CanvasTexture;
  rockNormal: THREE.CanvasTexture;
  trailMap: THREE.CanvasTexture;
  trailBump: THREE.CanvasTexture;
  furMap: THREE.CanvasTexture;
  furBump: THREE.CanvasTexture;
  lynxFurMap: THREE.CanvasTexture;
  shaggyFurMap: THREE.CanvasTexture;
  fabricMap: THREE.CanvasTexture;
  fabricBump: THREE.CanvasTexture;
  iceMap: THREE.CanvasTexture;
  iceBump: THREE.CanvasTexture;
  iceNormal: THREE.CanvasTexture;
  iceRoughness: THREE.CanvasTexture;
  iceMicroNormal: THREE.CanvasTexture;
  lakeWaterMap: THREE.CanvasTexture;
  lakeWaterBump: THREE.CanvasTexture;
  lakeWaterNormal: THREE.CanvasTexture;
  lakeWaterRoughness: THREE.CanvasTexture;
  lakeFractureMap: THREE.CanvasTexture;
  lakeFractureAlpha: THREE.CanvasTexture;
  lakeFractureBump: THREE.CanvasTexture;
  lakeFractureNormal: THREE.CanvasTexture;
  lakeFractureRoughness: THREE.CanvasTexture;
  lakeFrostMap: THREE.CanvasTexture;
  lakeFrostAlpha: THREE.CanvasTexture;
  lakeFrostBump: THREE.CanvasTexture;
  lakeFrostNormal: THREE.CanvasTexture;
  lakeFrostRoughness: THREE.CanvasTexture;
  metalBump: THREE.CanvasTexture;
  metalNormal: THREE.CanvasTexture;
  metalRoughness: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  warmGlowMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function configureTexture(
  canvas: HTMLCanvasElement,
  options: {
    srgb?: boolean;
    repeatX?: number;
    repeatY?: number;
    anisotropy?: number;
  },
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = options.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  if (options.repeatX !== undefined || options.repeatY !== undefined) {
    tex.repeat.set(options.repeatX ?? 1, options.repeatY ?? 1);
  }
  if (options.anisotropy) {
    tex.anisotropy = options.anisotropy;
  }
  return tex;
}

/**
 * Computes a tangent-space RGB normal map texture from a grayscale heightfield canvas
 * using a wrapped 3x3 Sobel filter so tiled PBR surfaces receive crisp directional shading.
 */
function createNormalMapFromHeightCanvas(
  heightCanvas: HTMLCanvasElement,
  strength: number,
  options: {
    repeatX?: number;
    repeatY?: number;
    anisotropy?: number;
  } = {},
): THREE.CanvasTexture {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const srcCtx = heightCanvas.getContext('2d')!;
  const src = srcCtx.getImageData(0, 0, w, h).data;
  const [outCanvas, outCtx] = makeCanvas(w);
  const outImg = outCtx.createImageData(w, h);
  const dst = outImg.data;

  const sample = (x: number, y: number): number => {
    const wx = ((x % w) + w) % w;
    const wy = ((y % h) + h) % h;
    const idx = (wy * w + wx) * 4;
    return src[idx] / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);

      const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      const nx = -dx;
      const ny = -dy;
      const nz = 1.0;
      const invLen = 1.0 / Math.hypot(nx, ny, nz);

      const outIdx = (y * w + x) * 4;
      dst[outIdx] = Math.round(((nx * invLen) * 0.5 + 0.5) * 255);
      dst[outIdx + 1] = Math.round(((ny * invLen) * 0.5 + 0.5) * 255);
      dst[outIdx + 2] = Math.round(((nz * invLen) * 0.5 + 0.5) * 255);
      dst[outIdx + 3] = 255;
    }
  }
  outCtx.putImageData(outImg, 0, 0);
  return configureTexture(outCanvas, {
    srgb: false,
    repeatX: options.repeatX,
    repeatY: options.repeatY,
    anisotropy: options.anisotropy,
  });
}

export function createProceduralTextures(anisotropy: number): ProceduralTextureSet {
  const rand = createRng(48271);

  // 1. HD Wind-swept snow albedo + sastrugi drift bump + ice-crystal sparkle roughness
  const [snowCanvas, sctx] = makeCanvas(1024);
  sctx.fillStyle = '#e0ebf5';
  sctx.fillRect(0, 0, 1024, 1024);

  // Broad wind-carved snowdrift waves
  for (let i = 0; i < 950; i++) {
    const x = rand() * 1024;
    const y = rand() * 1024;
    const w = 36 + rand() * 145;
    const h = 10 + rand() * 28;
    sctx.fillStyle =
      i % 2 === 0 ? 'rgba(255, 255, 255, 0.28)' : 'rgba(176, 202, 228, 0.24)';
    sctx.beginPath();
    sctx.ellipse(x, y, w, h, -0.24, 0, Math.PI * 2);
    sctx.fill();
  }
  // Fine powder crystals & ice-grain flecks
  for (let i = 0; i < 4200; i++) {
    const x = rand() * 1024;
    const y = rand() * 1024;
    const sz = i % 7 === 0 ? 3 : 2;
    sctx.fillStyle =
      i % 3 === 0 ? 'rgba(255, 255, 255, 0.65)' : 'rgba(188, 210, 234, 0.36)';
    sctx.fillRect(x, y, sz, sz);
  }
  const snowMap = configureTexture(snowCanvas, {
    srgb: true,
    repeatX: 18,
    repeatY: 18,
    anisotropy,
  });

  const [snowBumpCanvas, sbctx] = makeCanvas(512);
  sbctx.fillStyle = '#808080';
  sbctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 480; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const rx = 18 + rand() * 54;
    const ry = rx * (0.28 + rand() * 0.16);
    const shade = Math.floor(82 + rand() * 98);
    sbctx.fillStyle = `rgba(${shade},${shade},${shade},0.36)`;
    sbctx.beginPath();
    sbctx.ellipse(x, y, rx, ry, -0.24, 0, Math.PI * 2);
    sbctx.fill();
  }
  for (let i = 0; i < 2200; i++) {
    const v = Math.floor(105 + rand() * 78);
    sbctx.fillStyle = `rgba(${v},${v},${v},0.38)`;
    sbctx.fillRect(rand() * 512, rand() * 512, 2, 2);
  }
  const snowBump = configureTexture(snowBumpCanvas, {
    repeatX: 18,
    repeatY: 18,
    anisotropy,
  });
  const snowNormal = createNormalMapFromHeightCanvas(snowBumpCanvas, 1.45, {
    repeatX: 18,
    repeatY: 18,
    anisotropy,
  });

  const [snowRoughCanvas, srctx] = makeCanvas(512);
  srctx.fillStyle = '#c8c8c8';
  srctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3200; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    // Darker pixels = crisp icy sun-glint facets
    const v = i % 7 === 0 ? 34 : Math.floor(168 + rand() * 70);
    srctx.fillStyle = `rgb(${v},${v},${v})`;
    srctx.fillRect(x, y, i % 7 === 0 ? 2 : 3, i % 7 === 0 ? 2 : 3);
  }
  const snowRoughness = configureTexture(snowRoughCanvas, {
    repeatX: 18,
    repeatY: 18,
    anisotropy,
  });

  // 1b. High-Frequency Snow Micro-Surface Detail (crystalline micro-facet normal + clearcoat sparkle roughness)
  const [snowMicroHeightCanvas, smhCtx] = makeCanvas(512);
  const [snowCcRoughCanvas, sccCtx] = makeCanvas(512);
  smhCtx.fillStyle = '#808080';
  smhCtx.fillRect(0, 0, 512, 512);
  sccCtx.fillStyle = '#d4d4d4';
  sccCtx.fillRect(0, 0, 512, 512);

  // Micro wind-crust ripples + tightly packed crystalline snow grains
  for (let i = 0; i < 650; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const rx = 5 + rand() * 14;
    const ry = 2 + rand() * 5;
    const shade = Math.floor(96 + rand() * 68);
    smhCtx.fillStyle = `rgba(${shade},${shade},${shade},0.38)`;
    smhCtx.beginPath();
    smhCtx.ellipse(x, y, rx, ry, -0.2 + (rand() - 0.5) * 0.35, 0, Math.PI * 2);
    smhCtx.fill();
  }
  for (let i = 0; i < 6800; i++) {
    const x = Math.floor(rand() * 512);
    const y = Math.floor(rand() * 512);
    const sz = i % 5 === 0 ? 3 : 2;
    const hVal = i % 2 === 0 ? Math.floor(172 + rand() * 78) : Math.floor(28 + rand() * 72);
    smhCtx.fillStyle = `rgba(${hVal},${hVal},${hVal},0.72)`;
    smhCtx.fillRect(x, y, sz, sz);

    // ~11% crisp sunlit hexagonal ice-crystal micro-facets (very low clearcoat roughness = sharp glints)
    if (i % 9 === 0) {
      const rv = Math.floor(14 + rand() * 26);
      sccCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
      sccCtx.fillRect(x, y, 2, 2);
    } else if (i % 3 === 0) {
      const rv = Math.floor(165 + rand() * 72);
      sccCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
      sccCtx.fillRect(x, y, 3, 3);
    }
  }
  const snowMicroNormal = createNormalMapFromHeightCanvas(snowMicroHeightCanvas, 2.35, {
    repeatX: 36,
    repeatY: 36,
    anisotropy,
  });
  const snowClearcoatRoughness = configureTexture(snowCcRoughCanvas, {
    repeatX: 36,
    repeatY: 36,
    anisotropy,
  });

  // 2. HD Nordic Timber Planks (color + bevel/grain bump)
  const [timberCanvas, tctx] = makeCanvas(512);
  const [timberBumpCanvas, tbctx] = makeCanvas(512);
  tctx.fillStyle = '#7e5233';
  tctx.fillRect(0, 0, 512, 512);
  tbctx.fillStyle = '#909090';
  tbctx.fillRect(0, 0, 512, 512);

  for (let row = 0; row < 10; row++) {
    const y = Math.floor((row * 512) / 10);
    const h = Math.floor(512 / 10);
    const r = 114 + ((row * 19) % 28);
    const g = 73 + ((row * 13) % 18);
    const b = 44 + ((row * 11) % 14);
    tctx.fillStyle = `rgb(${r},${g},${b})`;
    tctx.fillRect(0, y + 3, 512, h - 4);
    tbctx.fillStyle = '#a4a4a4';
    tbctx.fillRect(0, y + 3, 512, h - 4);

    // Plank seam shadow & bevel
    tctx.fillStyle = '#3b2112';
    tctx.fillRect(0, y, 512, 3);
    tbctx.fillStyle = '#343434';
    tbctx.fillRect(0, y, 512, 3);

    // Vertical joint stagger
    const jointX = ((row * 173 + 95) % 420) + 45;
    tctx.fillStyle = '#3d2313';
    tctx.fillRect(jointX, y, 3, h);
    tbctx.fillStyle = '#3a3a3a';
    tbctx.fillRect(jointX, y, 3, h);

    // Iron pegs / nail heads near plank joints
    for (const ny of [y + 12, y + h - 12]) {
      for (const nx of [jointX - 10, jointX + 12]) {
        tctx.fillStyle = '#2d2826';
        tctx.beginPath();
        tctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        tctx.fill();
        tbctx.fillStyle = '#dfdfdf';
        tbctx.beginPath();
        tbctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        tbctx.fill();
      }
    }

    // Organic wavy woodgrain lines
    for (let gIdx = 0; gIdx < 12; gIdx++) {
      const gy = y + 6 + gIdx * ((h - 10) / 12);
      tctx.strokeStyle = gIdx % 2 === 0 ? 'rgba(54, 28, 12, 0.24)' : 'rgba(168, 118, 76, 0.16)';
      tctx.lineWidth = 1.2;
      tbctx.strokeStyle = gIdx % 2 === 0 ? 'rgba(110,110,110,0.4)' : 'rgba(182,182,182,0.35)';
      tbctx.lineWidth = 1.2;
      tctx.beginPath();
      tbctx.beginPath();
      for (let x = 0; x <= 512; x += 16) {
        const wave = Math.sin(x * 0.03 + row * 1.9 + gIdx * 0.7) * 2.2;
        if (x === 0) {
          tctx.moveTo(x, gy + wave);
          tbctx.moveTo(x, gy + wave);
        } else {
          tctx.lineTo(x, gy + wave);
          tbctx.lineTo(x, gy + wave);
        }
      }
      tctx.stroke();
      tbctx.stroke();
    }

    // Occasional wood knot
    if (row % 3 === 1) {
      const kx = ((row * 137 + 210) % 400) + 56;
      const ky = y + h * 0.52;
      tctx.fillStyle = 'rgba(58, 30, 14, 0.55)';
      tctx.beginPath();
      tctx.ellipse(kx, ky, 10, 5.5, 0.1, 0, Math.PI * 2);
      tctx.fill();
      tbctx.fillStyle = '#686868';
      tbctx.beginPath();
      tbctx.ellipse(kx, ky, 10, 5.5, 0.1, 0, Math.PI * 2);
      tbctx.fill();
    }
  }
  const timberMap = configureTexture(timberCanvas, { srgb: true, anisotropy });
  const timberBump = configureTexture(timberBumpCanvas, { anisotropy });
  const timberNormal = createNormalMapFromHeightCanvas(timberBumpCanvas, 1.85, {
    anisotropy,
  });

  // 3. HD Deeply Fissured Pine Bark + Bump
  const [barkCanvas, bctx] = makeCanvas(512);
  const [barkBumpCanvas, bbctx] = makeCanvas(512);
  bctx.fillStyle = '#4e3527';
  bctx.fillRect(0, 0, 512, 512);
  bbctx.fillStyle = '#787878';
  bbctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 420; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const w = 5 + rand() * 14;
    const h = 30 + rand() * 95;
    const dark = i % 3 === 0;
    bctx.fillStyle = dark
      ? 'rgba(42, 26, 17, 0.72)'
      : i % 3 === 1
        ? 'rgba(98, 68, 48, 0.58)'
        : 'rgba(122, 89, 64, 0.42)';
    bctx.beginPath();
    bctx.roundRect(x, y, w, h, 3);
    bctx.fill();

    const bv = dark ? 44 : i % 3 === 1 ? 156 : 196;
    bbctx.fillStyle = `rgba(${bv},${bv},${bv},0.65)`;
    bbctx.beginPath();
    bbctx.roundRect(x, y, w, h, 3);
    bbctx.fill();
  }
  // Subtle alpine moss/lichen flecks
  for (let i = 0; i < 70; i++) {
    bctx.fillStyle = 'rgba(72, 98, 66, 0.25)';
    bctx.beginPath();
    bctx.ellipse(rand() * 512, rand() * 512, 4 + rand() * 9, 3 + rand() * 6, rand(), 0, Math.PI * 2);
    bctx.fill();
  }
  const barkMap = configureTexture(barkCanvas, { srgb: true, anisotropy });
  const barkBump = configureTexture(barkBumpCanvas, { anisotropy });
  const barkNormal = createNormalMapFromHeightCanvas(barkBumpCanvas, 2.1, {
    anisotropy,
  });

  // 4. HD Arctic Silver Birch / Elder Frostwood Bark + Bump
  const [birchCanvas, brctx] = makeCanvas(512);
  const [birchBumpCanvas, brbctx] = makeCanvas(512);
  brctx.fillStyle = '#ddd9d0';
  brctx.fillRect(0, 0, 512, 512);
  brbctx.fillStyle = '#9a9a9a';
  brbctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) {
    const y = rand() * 512;
    const x = rand() * 512;
    const w = 16 + rand() * 64;
    const h = 3 + rand() * 7;
    brctx.fillStyle = i % 4 === 0 ? '#3a3b42' : '#575a62';
    brctx.fillRect(x, y, w, h);
    brbctx.fillStyle = '#525252';
    brbctx.fillRect(x, y, w, h);
  }
  const birchBarkMap = configureTexture(birchCanvas, { srgb: true, anisotropy });
  const birchBarkBump = configureTexture(birchBumpCanvas, { anisotropy });

  // 5. Cut Log End-Grain Growth Rings
  const [logEndCanvas, lctx] = makeCanvas(256);
  lctx.fillStyle = '#c89b68';
  lctx.fillRect(0, 0, 256, 256);
  for (let r = 118; r > 6; r -= 7) {
    lctx.strokeStyle = r < 42 ? 'rgba(110, 68, 34, 0.65)' : 'rgba(148, 98, 52, 0.5)';
    lctx.lineWidth = r % 14 === 0 ? 2.4 : 1.4;
    lctx.beginPath();
    lctx.arc(128, 128, r, 0, Math.PI * 2);
    lctx.stroke();
  }
  for (let crack = 0; crack < 5; crack++) {
    const a = crack * 1.25 + 0.3;
    lctx.strokeStyle = 'rgba(72, 42, 22, 0.55)';
    lctx.lineWidth = 2;
    lctx.beginPath();
    lctx.moveTo(128, 128);
    lctx.lineTo(128 + Math.cos(a) * 95, 128 + Math.sin(a) * 95);
    lctx.stroke();
  }
  const logEndMap = configureTexture(logEndCanvas, { srgb: true, anisotropy });

  // 6. HD Chiseled Masonry Stone + Deep Mortar Bump
  const [stoneCanvas, stctx] = makeCanvas(512);
  const [stoneBumpCanvas, stbctx] = makeCanvas(512);
  stctx.fillStyle = '#474f5c';
  stctx.fillRect(0, 0, 512, 512);
  stbctx.fillStyle = '#383838';
  stbctx.fillRect(0, 0, 512, 512);

  for (let row = 0; row < 8; row++) {
    const y = row * 64 + 3;
    const h = 58;
    const offset = (row % 2) * 44;
    for (let col = -1; col < 7; col++) {
      const w = 78 + ((row * 13 + col * 17) % 24);
      const x = col * 88 + offset;
      const v = 96 + ((row * 23 + col * 31) % 42);
      stctx.fillStyle = `rgb(${v},${v + 7},${v + 16})`;
      stctx.beginPath();
      stctx.roundRect(x, y, w, h, 5);
      stctx.fill();

      // Stone highlight edge + mineral grain
      stctx.strokeStyle = 'rgba(210, 222, 238, 0.18)';
      stctx.lineWidth = 2;
      stctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

      const bv = 160 + ((row * 19 + col * 29) % 55);
      stbctx.fillStyle = `rgb(${bv},${bv},${bv})`;
      stbctx.beginPath();
      stbctx.roundRect(x, y, w, h, 5);
      stbctx.fill();
    }
  }
  for (let i = 0; i < 1600; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    stctx.fillStyle = i % 2 === 0 ? 'rgba(235,240,250,0.12)' : 'rgba(35,40,50,0.16)';
    stctx.fillRect(x, y, 2, 2);
    const gv = i % 2 === 0 ? 195 : 105;
    stbctx.fillStyle = `rgba(${gv},${gv},${gv},0.25)`;
    stbctx.fillRect(x, y, 2, 2);
  }
  const stoneMap = configureTexture(stoneCanvas, { srgb: true, anisotropy });
  const stoneBump = configureTexture(stoneBumpCanvas, { anisotropy });
  const stoneNormal = createNormalMapFromHeightCanvas(stoneBumpCanvas, 2.25, {
    anisotropy,
  });

  // 7. HD Natural Fractured Granite Outcrop Rock + Bump (for wild boulders & ridges)
  const [rockCanvas, rctx] = makeCanvas(512);
  const [rockBumpCanvas, rbctx] = makeCanvas(512);
  rctx.fillStyle = '#626c7b';
  rctx.fillRect(0, 0, 512, 512);
  rbctx.fillStyle = '#808080';
  rbctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 550; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const rx = 8 + rand() * 34;
    const ry = 6 + rand() * 24;
    const tone = Math.floor(74 + rand() * 68);
    rctx.fillStyle = `rgba(${tone},${tone + 6},${tone + 14},0.38)`;
    rctx.beginPath();
    rctx.ellipse(x, y, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
    rctx.fill();

    const bt = Math.floor(65 + rand() * 130);
    rbctx.fillStyle = `rgba(${bt},${bt},${bt},0.42)`;
    rbctx.beginPath();
    rbctx.ellipse(x, y, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
    rbctx.fill();
  }
  // Sharp granite fracture cracks
  for (let i = 0; i < 60; i++) {
    const sx = rand() * 512;
    const sy = rand() * 512;
    const ex = sx + (rand() - 0.5) * 90;
    const ey = sy + (rand() - 0.5) * 90;
    rctx.strokeStyle = 'rgba(35, 42, 52, 0.45)';
    rctx.lineWidth = 1.5 + rand() * 2;
    rctx.beginPath();
    rctx.moveTo(sx, sy);
    rctx.lineTo(ex, ey);
    rctx.stroke();

    rbctx.strokeStyle = 'rgba(32, 32, 32, 0.7)';
    rbctx.lineWidth = 2;
    rbctx.beginPath();
    rbctx.moveTo(sx, sy);
    rbctx.lineTo(ex, ey);
    rbctx.stroke();
  }
  const rockMap = configureTexture(rockCanvas, { srgb: true, anisotropy });
  const rockBump = configureTexture(rockBumpCanvas, { anisotropy });
  const rockNormal = createNormalMapFromHeightCanvas(rockBumpCanvas, 2.35, {
    anisotropy,
  });

  // 8. Packed Slate-Cobble & Frost-Edged Footpath Texture + Bump
  const [trailCanvas, trctx] = makeCanvas(512);
  const [trailBumpCanvas, trbctx] = makeCanvas(512);
  trctx.fillStyle = '#4e555e';
  trctx.fillRect(0, 0, 512, 512);
  trbctx.fillStyle = '#686868';
  trbctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 720; i++) {
    const x = 36 + rand() * 440;
    const y = rand() * 512;
    const r = 5 + rand() * 14;
    const cool = i % 3 === 0 ? 12 : 0;
    const v = Math.floor(82 + rand() * 44);
    trctx.fillStyle = `rgba(${v - cool},${v - 2 - Math.floor(cool * 0.4)},${v + 4},0.58)`;
    trctx.beginPath();
    trctx.ellipse(x, y, r, r * 0.76, rand() * Math.PI, 0, Math.PI * 2);
    trctx.fill();

    const bv = Math.floor(135 + rand() * 95);
    trbctx.fillStyle = `rgba(${bv},${bv},${bv},0.6)`;
    trbctx.beginPath();
    trbctx.ellipse(x, y, r, r * 0.76, rand() * Math.PI, 0, Math.PI * 2);
    trbctx.fill();
  }
  // Soft frost feathering strictly along outer curbs so center cobble stays dark and grounded
  const edgeGradL = trctx.createLinearGradient(0, 0, 68, 0);
  edgeGradL.addColorStop(0, 'rgba(218, 232, 245, 0.72)');
  edgeGradL.addColorStop(1, 'rgba(218, 232, 245, 0)');
  trctx.fillStyle = edgeGradL;
  trctx.fillRect(0, 0, 68, 512);
  const edgeGradR = trctx.createLinearGradient(512, 0, 444, 0);
  edgeGradR.addColorStop(0, 'rgba(218, 232, 245, 0.72)');
  edgeGradR.addColorStop(1, 'rgba(218, 232, 245, 0)');
  trctx.fillStyle = edgeGradR;
  trctx.fillRect(444, 0, 68, 512);
  const trailMap = configureTexture(trailCanvas, {
    srgb: true,
    repeatX: 1,
    repeatY: 4,
    anisotropy,
  });
  const trailBump = configureTexture(trailBumpCanvas, {
    repeatX: 1,
    repeatY: 4,
    anisotropy,
  });

  // 9. Realistic Fur / Pelt Fiber Texture + Bump
  const [furCanvas, fctx] = makeCanvas(256);
  const [furBumpCanvas, fbctx] = makeCanvas(256);
  fctx.fillStyle = '#e8e2d8';
  fctx.fillRect(0, 0, 256, 256);
  fbctx.fillStyle = '#808080';
  fbctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const len = 6 + rand() * 14;
    const shade = Math.floor(195 + rand() * 58);
    fctx.strokeStyle = `rgba(${shade},${shade - 4},${shade - 10},0.55)`;
    fctx.lineWidth = 1.4;
    fctx.beginPath();
    fctx.moveTo(x, y);
    fctx.lineTo(x + (rand() - 0.5) * 4, y + len);
    fctx.stroke();

    const bv = Math.floor(85 + rand() * 140);
    fbctx.strokeStyle = `rgba(${bv},${bv},${bv},0.6)`;
    fbctx.lineWidth = 1.4;
    fbctx.beginPath();
    fbctx.moveTo(x, y);
    fbctx.lineTo(x + (rand() - 0.5) * 4, y + len);
    fbctx.stroke();
  }
  const furMap = configureTexture(furCanvas, { srgb: true, anisotropy });
  const furBump = configureTexture(furBumpCanvas, { anisotropy });

  // 9b. Spotted Snow Lynx Pelt Texture
  const [lynxCanvas, lxctx] = makeCanvas(256);
  lxctx.fillStyle = '#c9cdd3';
  lxctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const v = Math.floor(178 + rand() * 58);
    lxctx.strokeStyle = `rgba(${v},${v - 2},${v + 2},0.52)`;
    lxctx.lineWidth = 1.4;
    lxctx.beginPath();
    lxctx.moveTo(x, y);
    lxctx.lineTo(x + (rand() - 0.5) * 3, y + 6 + rand() * 10);
    lxctx.stroke();
  }
  for (let i = 0; i < 95; i++) {
    const sx = rand() * 256;
    const sy = rand() * 256;
    const rx = 4 + rand() * 5;
    const ry = 3 + rand() * 4;
    lxctx.fillStyle = 'rgba(72, 76, 86, 0.5)';
    lxctx.beginPath();
    lxctx.ellipse(sx, sy, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
    lxctx.fill();
  }
  const lynxFurMap = configureTexture(lynxCanvas, { srgb: true, anisotropy });

  // 9c. Coarse Shaggy Winter Wool Texture (Mammoth / Polar Bear undercoat)
  const [shaggyCanvas, sgctx] = makeCanvas(256);
  sgctx.fillStyle = '#dcd8d2';
  sgctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const len = 10 + rand() * 22;
    const v = Math.floor(165 + rand() * 82);
    sgctx.strokeStyle = `rgba(${v},${v - 4},${v - 8},0.6)`;
    sgctx.lineWidth = 1.8;
    sgctx.beginPath();
    sgctx.moveTo(x, y);
    sgctx.lineTo(x + (rand() - 0.5) * 6, y + len);
    sgctx.stroke();
  }
  const shaggyFurMap = configureTexture(shaggyCanvas, { srgb: true, anisotropy });

  // 10. Woven Winter Wool / Canvas Weave Texture + Bump
  const [fabricCanvas, fabCtx] = makeCanvas(256);
  const [fabricBumpCanvas, fabBCtx] = makeCanvas(256);
  fabricCanvas.width = 256;
  fabCtx.fillStyle = '#e5e5e5';
  fabCtx.fillRect(0, 0, 256, 256);
  fabBCtx.fillStyle = '#808080';
  fabBCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 4) {
    fabCtx.fillStyle = y % 8 === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(180,180,180,0.18)';
    fabCtx.fillRect(0, y, 256, 2);
    fabBCtx.fillStyle = y % 8 === 0 ? '#a8a8a8' : '#646464';
    fabBCtx.fillRect(0, y, 256, 2);
  }
  for (let x = 0; x < 256; x += 4) {
    fabCtx.fillStyle = x % 8 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(170,170,170,0.14)';
    fabCtx.fillRect(x, 0, 2, 256);
    fabBCtx.fillStyle = x % 8 === 0 ? 'rgba(175,175,175,0.5)' : 'rgba(95,95,95,0.5)';
    fabBCtx.fillRect(x, 0, 2, 256);
  }
  const fabricMap = configureTexture(fabricCanvas, {
    srgb: true,
    repeatX: 2,
    repeatY: 2,
    anisotropy,
  });
  const fabricBump = configureTexture(fabricBumpCanvas, {
    repeatX: 2,
    repeatY: 2,
    anisotropy,
  });

  // 11. Glacial Crystal Ice Texture + Fracture Bump
  const [iceCanvas, ictx] = makeCanvas(512);
  const [iceBumpCanvas, ibctx] = makeCanvas(512);
  const iceGrad = ictx.createLinearGradient(0, 0, 512, 512);
  iceGrad.addColorStop(0, '#9ae7ff');
  iceGrad.addColorStop(0.5, '#68d2fa');
  iceGrad.addColorStop(1, '#bceeff');
  ictx.fillStyle = iceGrad;
  ictx.fillRect(0, 0, 512, 512);
  ibctx.fillStyle = '#808080';
  ibctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 120; i++) {
    const x1 = rand() * 512;
    const y1 = rand() * 512;
    const x2 = x1 + (rand() - 0.5) * 140;
    const y2 = y1 + (rand() - 0.5) * 140;
    ictx.strokeStyle =
      i % 2 === 0 ? 'rgba(245, 252, 255, 0.52)' : 'rgba(28, 128, 185, 0.34)';
    ictx.lineWidth = 1.2 + rand() * 2.2;
    ictx.beginPath();
    ictx.moveTo(x1, y1);
    ictx.lineTo(x2, y2);
    ictx.stroke();

    const bv = i % 2 === 0 ? 195 : 55;
    ibctx.strokeStyle = `rgba(${bv},${bv},${bv},0.65)`;
    ibctx.lineWidth = 2;
    ibctx.beginPath();
    ibctx.moveTo(x1, y1);
    ibctx.lineTo(x2, y2);
    ibctx.stroke();
  }
  const iceMap = configureTexture(iceCanvas, { srgb: true, anisotropy });
  const iceBump = configureTexture(iceBumpCanvas, { anisotropy });
  const iceNormal = createNormalMapFromHeightCanvas(iceBumpCanvas, 2.1, { anisotropy });

  // 11a-PBR. Glacial Ice Roughness + Micro-Surface Scratched Crystal Normal Map
  const [iceRoughCanvas, irCtx] = makeCanvas(512);
  const [iceMicroHeightCanvas, imhCtx] = makeCanvas(512);
  irCtx.fillStyle = '#242424'; // Polished specular glacial facets
  irCtx.fillRect(0, 0, 512, 512);
  imhCtx.fillStyle = '#808080';
  imhCtx.fillRect(0, 0, 512, 512);

  // Subtle internal crystalline planes & frosted pressure seams
  for (let i = 0; i < 180; i++) {
    const x1 = rand() * 512;
    const y1 = rand() * 512;
    const x2 = x1 + (rand() - 0.5) * 150;
    const y2 = y1 + (rand() - 0.5) * 150;
    const rv = Math.floor(90 + rand() * 88);
    irCtx.strokeStyle = `rgba(${rv},${rv},${rv},0.52)`;
    irCtx.lineWidth = 1.0 + rand() * 2.4;
    irCtx.beginPath();
    irCtx.moveTo(x1, y1);
    irCtx.lineTo(x2, y2);
    irCtx.stroke();

    const hv = i % 2 === 0 ? 198 : 62;
    imhCtx.strokeStyle = `rgba(${hv},${hv},${hv},0.58)`;
    imhCtx.lineWidth = 1.0 + rand() * 1.4;
    imhCtx.beginPath();
    imhCtx.moveTo(x1, y1);
    imhCtx.lineTo(x2, y2);
    imhCtx.stroke();
  }
  // Fine wind-etched micro-scratches & trapped air bubble pits
  for (let i = 0; i < 420; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const len = 8 + rand() * 44;
    const ang = -0.35 + (rand() - 0.5) * 0.9;
    const hv = i % 2 === 0 ? 168 : 92;
    imhCtx.strokeStyle = `rgba(${hv},${hv},${hv},0.42)`;
    imhCtx.lineWidth = 0.85;
    imhCtx.beginPath();
    imhCtx.moveTo(x, y);
    imhCtx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    imhCtx.stroke();
  }
  for (let i = 0; i < 1200; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 0.8 + rand() * 2.0;
    imhCtx.fillStyle = i % 3 === 0 ? 'rgba(210,210,210,0.48)' : 'rgba(58,58,58,0.42)';
    imhCtx.beginPath();
    imhCtx.arc(x, y, r, 0, Math.PI * 2);
    imhCtx.fill();
  }
  const iceRoughness = configureTexture(iceRoughCanvas, { anisotropy });
  const iceMicroNormal = createNormalMapFromHeightCanvas(iceMicroHeightCanvas, 1.95, {
    repeatX: 5,
    repeatY: 5,
    anisotropy,
  });

  // 11b. Deep Glacial Lagoon Water (Caustics + Ripple Normal + Reflection Roughness)
  const [lakeWaterCanvas, lwCtx] = makeCanvas(512);
  const [lakeWaterBumpCanvas, lwbCtx] = makeCanvas(512);
  const [lakeWaterRoughCanvas, lwrCtx] = makeCanvas(512);
  const lwGrad = lwCtx.createRadialGradient(256, 256, 28, 256, 256, 256);
  lwGrad.addColorStop(0, '#063b64');
  lwGrad.addColorStop(0.55, '#0b5b94');
  lwGrad.addColorStop(0.86, '#1484bf');
  lwGrad.addColorStop(1, '#47b5e3');
  lwCtx.fillStyle = lwGrad;
  lwCtx.fillRect(0, 0, 512, 512);
  lwbCtx.fillStyle = '#808080';
  lwbCtx.fillRect(0, 0, 512, 512);

  // Mirror-smooth center water, lightly frothed shoreline edge
  const lwrGrad = lwrCtx.createRadialGradient(256, 256, 36, 256, 256, 256);
  lwrGrad.addColorStop(0, '#141414');
  lwrGrad.addColorStop(0.74, '#222222');
  lwrGrad.addColorStop(0.92, '#4a4a4a');
  lwrGrad.addColorStop(1, '#7a7a7a');
  lwrCtx.fillStyle = lwrGrad;
  lwrCtx.fillRect(0, 0, 512, 512);

  // Subtle submerged caustic shimmer ribbons & capillary wave ripples
  for (let i = 0; i < 220; i++) {
    const cx = rand() * 512;
    const cy = rand() * 512;
    const rx = 14 + rand() * 54;
    const ry = 3 + rand() * 10;
    const ang = -0.35 + (rand() - 0.5) * 0.55;
    lwCtx.fillStyle =
      i % 2 === 0 ? 'rgba(130, 224, 255, 0.16)' : 'rgba(4, 34, 62, 0.22)';
    lwCtx.beginPath();
    lwCtx.ellipse(cx, cy, rx, ry, ang, 0, Math.PI * 2);
    lwCtx.fill();

    const bv = i % 2 === 0 ? 168 : 90;
    lwbCtx.fillStyle = `rgba(${bv},${bv},${bv},0.34)`;
    lwbCtx.beginPath();
    lwbCtx.ellipse(cx, cy, rx * 0.85, ry * 0.85, ang, 0, Math.PI * 2);
    lwbCtx.fill();
  }
  const lakeWaterMap = configureTexture(lakeWaterCanvas, { srgb: true, anisotropy });
  const lakeWaterBump = configureTexture(lakeWaterBumpCanvas, { anisotropy });
  const lakeWaterNormal = createNormalMapFromHeightCanvas(lakeWaterBumpCanvas, 2.25, {
    repeatX: 2,
    repeatY: 2,
    anisotropy,
  });
  const lakeWaterRoughness = configureTexture(lakeWaterRoughCanvas, { anisotropy });

  // 11c. Realistic Multi-Scale Ice Fracture Plate (Albedo + Alpha + Relief Bump + Specular Roughness)
  const [fracCanvas, fCtx] = makeCanvas(1024);
  const [fracAlphaCanvas, faCtx] = makeCanvas(1024);
  const [fracBumpCanvas, fbCtx] = makeCanvas(1024);
  const [fracRoughCanvas, frCtx] = makeCanvas(1024);

  // Clear glassy ice pane base with radial depth tint (deep sapphire center, frosted rim)
  const fBaseGrad = fCtx.createRadialGradient(512, 512, 40, 512, 512, 512);
  fBaseGrad.addColorStop(0, '#0f5080');
  fBaseGrad.addColorStop(0.55, '#2576ad');
  fBaseGrad.addColorStop(0.85, '#68b6de');
  fBaseGrad.addColorStop(1, '#bce6fa');
  fCtx.fillStyle = fBaseGrad;
  fCtx.fillRect(0, 0, 1024, 1024);

  // Alpha base: crystal-clear center window so sapphire water reads beneath crisp white fracture webs
  const faGrad = faCtx.createRadialGradient(512, 512, 60, 512, 512, 512);
  faGrad.addColorStop(0, '#323232');
  faGrad.addColorStop(0.68, '#707070');
  faGrad.addColorStop(1, '#dedede');
  faCtx.fillStyle = faGrad;
  faCtx.fillRect(0, 0, 1024, 1024);

  // Neutral bump & glassy clearcoat roughness on unbroken plates
  fbCtx.fillStyle = '#808080';
  fbCtx.fillRect(0, 0, 1024, 1024);
  frCtx.fillStyle = '#202020'; // Very smooth polished ice panes (low roughness = glossy)
  frCtx.fillRect(0, 0, 1024, 1024);

  // Internal frozen ice-plate strata & clouding streaks
  for (let i = 0; i < 180; i++) {
    const px = 90 + rand() * 844;
    const py = 90 + rand() * 844;
    const rx = 24 + rand() * 90;
    const ry = 8 + rand() * 28;
    const rot = rand() * Math.PI;
    const milky = i % 3 === 0;
    fCtx.fillStyle = milky ? 'rgba(222, 244, 255, 0.18)' : 'rgba(14, 66, 108, 0.18)';
    fCtx.beginPath();
    fCtx.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2);
    fCtx.fill();

    const av = milky ? 195 : 138;
    faCtx.fillStyle = `rgba(${av},${av},${av},0.22)`;
    faCtx.beginPath();
    faCtx.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2);
    faCtx.fill();

    const rv = milky ? 105 : 42;
    frCtx.fillStyle = `rgba(${rv},${rv},${rv},0.28)`;
    frCtx.beginPath();
    frCtx.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2);
    frCtx.fill();
  }

  // Recursive jagged glacial crack drawer across all 4 PBR maps simultaneously
  const drawJaggedCrack = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    width: number,
    jitter: number,
    depth: number,
  ) => {
    const segs = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / 26));
    const pts: Array<[number, number]> = [[x0, y0]];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    for (let s = 1; s < segs; s++) {
      const t = s / segs;
      const off = (rand() - 0.5) * jitter * Math.sin(t * Math.PI);
      pts.push([x0 + dx * t + nx * off, y0 + dy * t + ny * off]);
    }
    pts.push([x1, y1]);

    const tracePath = (ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.stroke();
    };

    // 1. Deep dark sapphire fissure core
    fCtx.lineCap = 'round';
    fCtx.lineJoin = 'round';
    fCtx.strokeStyle = depth === 0 ? 'rgba(6, 30, 56, 0.92)' : 'rgba(12, 50, 86, 0.72)';
    fCtx.lineWidth = width * 1.5;
    tracePath(fCtx);

    // 2. Crisp shattered white crystalline bevel along fissure edge
    fCtx.strokeStyle = depth === 0 ? 'rgba(246, 252, 255, 0.96)' : 'rgba(228, 246, 255, 0.82)';
    fCtx.lineWidth = Math.max(1.0, width * 0.62);
    tracePath(fCtx);

    // 3. Solid fracture visibility in alpha map
    faCtx.lineCap = 'round';
    faCtx.lineJoin = 'round';
    faCtx.strokeStyle = 'rgba(255, 255, 255, 0.96)';
    faCtx.lineWidth = width * 1.45;
    tracePath(faCtx);

    // 4. Relief bump: raised frost shoulder + carved V-trench inside crack
    fbCtx.lineCap = 'round';
    fbCtx.lineJoin = 'round';
    fbCtx.strokeStyle = 'rgba(228, 228, 228, 0.78)';
    fbCtx.lineWidth = width * 2.15;
    tracePath(fbCtx);
    fbCtx.strokeStyle = 'rgba(22, 22, 22, 0.94)';
    fbCtx.lineWidth = Math.max(1.0, width * 0.8);
    tracePath(fbCtx);

    // 5. Roughness: shattered crystal fractures diffuse light cleanly
    frCtx.lineCap = 'round';
    frCtx.lineJoin = 'round';
    frCtx.strokeStyle = 'rgba(228, 228, 228, 0.92)';
    frCtx.lineWidth = width * 1.75;
    tracePath(frCtx);

    // Secondary spiderweb branches
    if (depth < 2) {
      for (let i = 1; i < pts.length - 1; i++) {
        if (rand() < (depth === 0 ? 0.48 : 0.34)) {
          const [bx, by] = pts[i];
          const baseAng = Math.atan2(dy, dx);
          const side = rand() < 0.5 ? 1 : -1;
          const bAng = baseAng + side * (0.42 + rand() * 0.85);
          const bLen = (depth === 0 ? 55 : 28) + rand() * (depth === 0 ? 115 : 62);
          drawJaggedCrack(
            bx,
            by,
            bx + Math.cos(bAng) * bLen,
            by + Math.sin(bAng) * bLen,
            Math.max(1.0, width * 0.56),
            jitter * 0.55,
            depth + 1,
          );
        }
      }
    }
  };

  // Primary cross-lagoon pressure faults & radial shoreline fractures
  for (let i = 0; i < 12; i++) {
    const a1 = (i / 12) * Math.PI * 2 + rand() * 0.28;
    const r1 = 470 + rand() * 35;
    const r2 = i % 3 === 0 ? 45 + rand() * 140 : 120 + rand() * 210;
    const a2 = a1 + Math.PI * (0.65 + rand() * 0.7);
    drawJaggedCrack(
      512 + Math.cos(a1) * r1,
      512 + Math.sin(a1) * r1,
      512 + Math.cos(a2) * r2,
      512 + Math.sin(a2) * r2,
      3.4 + rand() * 2.4,
      36,
      0,
    );
  }
  // Starburst stress fracture hubs in the ice sheet
  const hubs: Array<[number, number]> = [
    [430, 480],
    [610, 420],
    [540, 620],
    [350, 600],
    [670, 580],
  ];
  for (const [hx, hy] of hubs) {
    const rays = 5 + Math.floor(rand() * 3);
    for (let r = 0; r < rays; r++) {
      const ang = (r / rays) * Math.PI * 2 + (rand() - 0.5) * 0.35;
      const len = 70 + rand() * 120;
      drawJaggedCrack(
        hx,
        hy,
        hx + Math.cos(ang) * len,
        hy + Math.sin(ang) * len,
        2.4 + rand() * 1.4,
        22,
        1,
      );
    }
  }

  // Trapped white-aqua air bubble pockets frozen inside the clear ice
  for (let b = 0; b < 420; b++) {
    const bx = 64 + rand() * 896;
    const by = 64 + rand() * 896;
    const rad = 1.4 + rand() * 4.5;
    fCtx.fillStyle = b % 4 === 0 ? 'rgba(245, 252, 255, 0.76)' : 'rgba(186, 234, 255, 0.45)';
    fCtx.beginPath();
    fCtx.arc(bx, by, rad, 0, Math.PI * 2);
    fCtx.fill();

    fbCtx.fillStyle = 'rgba(205, 205, 205, 0.55)';
    fbCtx.beginPath();
    fbCtx.arc(bx, by, rad, 0, Math.PI * 2);
    fbCtx.fill();
  }

  const lakeFractureMap = configureTexture(fracCanvas, { srgb: true, anisotropy });
  const lakeFractureAlpha = configureTexture(fracAlphaCanvas, { anisotropy });
  const lakeFractureBump = configureTexture(fracBumpCanvas, { anisotropy });
  const lakeFractureNormal = createNormalMapFromHeightCanvas(fracBumpCanvas, 1.9, {
    anisotropy,
  });
  const lakeFractureRoughness = configureTexture(fracRoughCanvas, { anisotropy });

  // 11d. Hoarfrost Plumes & Wind-Scoured Snow-Crust Overlay (Color + Alpha + Bump)
  const [frostCanvas, frstCtx] = makeCanvas(1024);
  const [frostAlphaCanvas, frstACtx] = makeCanvas(1024);
  const [frostBumpCanvas, frstBCtx] = makeCanvas(1024);

  const frstColorGrad = frstCtx.createRadialGradient(512, 512, 30, 512, 512, 512);
  frstColorGrad.addColorStop(0, '#c0e1f7');
  frstColorGrad.addColorStop(0.58, '#d9eefc');
  frstColorGrad.addColorStop(1, '#f2f8ff');
  frstCtx.fillStyle = frstColorGrad;
  frstCtx.fillRect(0, 0, 1024, 1024);

  // Alpha: perimeter frozen thick, center streaked with wind-blown snow & clear fractured ice windows
  const frstAGrad = frstACtx.createRadialGradient(512, 512, 48, 512, 512, 512);
  frstAGrad.addColorStop(0, '#303030');
  frstAGrad.addColorStop(0.55, '#606060');
  frstAGrad.addColorStop(0.84, '#b6b6b6');
  frstAGrad.addColorStop(1, '#f2f2f2');
  frstACtx.fillStyle = frstAGrad;
  frstACtx.fillRect(0, 0, 1024, 1024);

  frstBCtx.fillStyle = '#7c7c7c';
  frstBCtx.fillRect(0, 0, 1024, 1024);

  // Wind-swept sastrugi frost drift plumes across the lake surface
  for (let i = 0; i < 620; i++) {
    const x = rand() * 1024;
    const y = rand() * 1024;
    const rx = 28 + rand() * 115;
    const ry = 7 + rand() * 24;
    const rot = -0.26 + (rand() - 0.5) * 0.22;
    const bright = i % 3 !== 0;
    frstCtx.fillStyle = bright
      ? 'rgba(255, 255, 255, 0.44)'
      : 'rgba(154, 204, 238, 0.32)';
    frstCtx.beginPath();
    frstCtx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    frstCtx.fill();

    const av = bright ? 215 : 75;
    frstACtx.fillStyle = `rgba(${av},${av},${av},0.36)`;
    frstACtx.beginPath();
    frstACtx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    frstACtx.fill();

    const bv = bright ? 204 : 88;
    frstBCtx.fillStyle = `rgba(${bv},${bv},${bv},0.46)`;
    frstBCtx.beginPath();
    frstBCtx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    frstBCtx.fill();
  }

  // Carve darker fracture windows into frost alpha so underlying ice crack network peeks through!
  frstACtx.strokeStyle = 'rgba(16, 16, 16, 0.78)';
  frstACtx.lineCap = 'round';
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2 + rand() * 0.2;
    const r0 = 120 + rand() * 110;
    const r1 = 445 + rand() * 40;
    frstACtx.lineWidth = 6 + rand() * 7;
    frstACtx.beginPath();
    frstACtx.moveTo(512 + Math.cos(a) * r0, 512 + Math.sin(a) * r0);
    frstACtx.quadraticCurveTo(
      512 + Math.cos(a + 0.18) * ((r0 + r1) * 0.5),
      512 + Math.sin(a + 0.18) * ((r0 + r1) * 0.5),
      512 + Math.cos(a - 0.08) * r1,
      512 + Math.sin(a - 0.08) * r1,
    );
    frstACtx.stroke();
  }

  // Fine sparkling hoarfrost crystal needles
  for (let i = 0; i < 2800; i++) {
    const x = rand() * 1024;
    const y = rand() * 1024;
    const len = 3 + rand() * 8;
    const ang = rand() * Math.PI * 2;
    frstCtx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    frstCtx.lineWidth = 1;
    frstCtx.beginPath();
    frstCtx.moveTo(x, y);
    frstCtx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    frstCtx.stroke();

    frstACtx.fillStyle = 'rgba(240, 240, 240, 0.45)';
    frstACtx.fillRect(x, y, 2, 2);
  }

  const lakeFrostMap = configureTexture(frostCanvas, { srgb: true, anisotropy });
  const lakeFrostAlpha = configureTexture(frostAlphaCanvas, { anisotropy });
  const lakeFrostBump = configureTexture(frostBumpCanvas, { anisotropy });
  const lakeFrostNormal = createNormalMapFromHeightCanvas(frostBumpCanvas, 2.0, { anisotropy });

  const [lakeFrostRoughCanvas, lfrCtx] = makeCanvas(512);
  lfrCtx.fillStyle = '#bebebe';
  lfrCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2400; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const v = i % 8 === 0 ? 32 : Math.floor(155 + rand() * 82);
    lfrCtx.fillStyle = `rgb(${v},${v},${v})`;
    lfrCtx.fillRect(x, y, 2, 2);
  }
  const lakeFrostRoughness = configureTexture(lakeFrostRoughCanvas, { anisotropy });

  // 12. Hammered & Anisotropically Brushed Forged Metal (Bump + Normal + Roughness)
  const [metalBumpCanvas, mbctx] = makeCanvas(256);
  const [metalRoughCanvas, mrctx] = makeCanvas(256);
  mbctx.fillStyle = '#808080';
  mbctx.fillRect(0, 0, 256, 256);
  mrctx.fillStyle = '#484848';
  mrctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 360; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const r = 4 + rand() * 10;
    const shade = Math.floor(95 + rand() * 70);
    mbctx.fillStyle = `rgba(${shade},${shade},${shade},0.38)`;
    mbctx.beginPath();
    mbctx.arc(x, y, r, 0, Math.PI * 2);
    mbctx.fill();

    const rShade = Math.floor(42 + rand() * 78);
    mrctx.fillStyle = `rgba(${rShade},${rShade},${rShade},0.35)`;
    mrctx.beginPath();
    mrctx.arc(x, y, r, 0, Math.PI * 2);
    mrctx.fill();
  }
  // Fine horizontal brushed steel striations
  for (let y = 0; y < 256; y += 2) {
    const bVal = y % 4 === 0 ? 196 : 86;
    mbctx.fillStyle = `rgba(${bVal},${bVal},${bVal},0.16)`;
    mbctx.fillRect(0, y, 256, 1);
    const rVal = y % 4 === 0 ? 32 : 84;
    mrctx.fillStyle = `rgba(${rVal},${rVal},${rVal},0.22)`;
    mrctx.fillRect(0, y, 256, 1);
  }
  const metalBump = configureTexture(metalBumpCanvas, { anisotropy });
  const metalNormal = createNormalMapFromHeightCanvas(metalBumpCanvas, 1.85, { anisotropy });
  const metalRoughness = configureTexture(metalRoughCanvas, { anisotropy });

  // 13. Soft radial contact shadow disc
  const [shadowCanvas, shctx] = makeCanvas(128);
  const grad = shctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(6, 12, 24, 0.84)');
  grad.addColorStop(0.55, 'rgba(8, 15, 28, 0.42)');
  grad.addColorStop(1, 'rgba(8, 15, 28, 0)');
  shctx.fillStyle = grad;
  shctx.fillRect(0, 0, 128, 128);
  const contactShadowMap = new THREE.CanvasTexture(shadowCanvas);

  // 14. Soft radial warm light pool texture for additive fire/lantern glow on snow
  const [glowCanvas, glctx] = makeCanvas(128);
  const glowGrad = glctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  glowGrad.addColorStop(0, 'rgba(255, 232, 180, 0.95)');
  glowGrad.addColorStop(0.28, 'rgba(255, 178, 86, 0.55)');
  glowGrad.addColorStop(0.62, 'rgba(245, 128, 42, 0.18)');
  glowGrad.addColorStop(1, 'rgba(245, 110, 30, 0)');
  glctx.fillStyle = glowGrad;
  glctx.fillRect(0, 0, 128, 128);
  const warmGlowMap = new THREE.CanvasTexture(glowCanvas);
  warmGlowMap.colorSpace = THREE.SRGBColorSpace;

  const allTextures = [
    snowMap,
    snowBump,
    snowNormal,
    snowRoughness,
    snowMicroNormal,
    snowClearcoatRoughness,
    timberMap,
    timberBump,
    timberNormal,
    barkMap,
    barkBump,
    barkNormal,
    birchBarkMap,
    birchBarkBump,
    logEndMap,
    stoneMap,
    stoneBump,
    stoneNormal,
    rockMap,
    rockBump,
    rockNormal,
    trailMap,
    trailBump,
    furMap,
    furBump,
    lynxFurMap,
    shaggyFurMap,
    fabricMap,
    fabricBump,
    iceMap,
    iceBump,
    iceNormal,
    iceRoughness,
    iceMicroNormal,
    lakeWaterMap,
    lakeWaterBump,
    lakeWaterNormal,
    lakeWaterRoughness,
    lakeFractureMap,
    lakeFractureAlpha,
    lakeFractureBump,
    lakeFractureNormal,
    lakeFractureRoughness,
    lakeFrostMap,
    lakeFrostAlpha,
    lakeFrostBump,
    lakeFrostNormal,
    lakeFrostRoughness,
    metalBump,
    metalNormal,
    metalRoughness,
    contactShadowMap,
    warmGlowMap,
  ];

  return {
    snowMap,
    snowBump,
    snowNormal,
    snowRoughness,
    snowMicroNormal,
    snowClearcoatRoughness,
    timberMap,
    timberBump,
    timberNormal,
    barkMap,
    barkBump,
    barkNormal,
    birchBarkMap,
    birchBarkBump,
    logEndMap,
    stoneMap,
    stoneBump,
    stoneNormal,
    rockMap,
    rockBump,
    rockNormal,
    trailMap,
    trailBump,
    furMap,
    furBump,
    lynxFurMap,
    shaggyFurMap,
    fabricMap,
    fabricBump,
    iceMap,
    iceBump,
    iceNormal,
    iceRoughness,
    iceMicroNormal,
    lakeWaterMap,
    lakeWaterBump,
    lakeWaterNormal,
    lakeWaterRoughness,
    lakeFractureMap,
    lakeFractureAlpha,
    lakeFractureBump,
    lakeFractureNormal,
    lakeFractureRoughness,
    lakeFrostMap,
    lakeFrostAlpha,
    lakeFrostBump,
    lakeFrostNormal,
    lakeFrostRoughness,
    metalBump,
    metalNormal,
    metalRoughness,
    contactShadowMap,
    warmGlowMap,
    dispose: () => {
      for (const tex of allTextures) {
        tex.dispose();
      }
    },
  };
}
