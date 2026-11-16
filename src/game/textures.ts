import * as THREE from 'three';

export interface ProceduralTextureSet {
  snowMap: THREE.CanvasTexture;
  snowBump: THREE.CanvasTexture;
  snowRoughness: THREE.CanvasTexture;
  timberMap: THREE.CanvasTexture;
  timberBump: THREE.CanvasTexture;
  barkMap: THREE.CanvasTexture;
  barkBump: THREE.CanvasTexture;
  birchBarkMap: THREE.CanvasTexture;
  birchBarkBump: THREE.CanvasTexture;
  logEndMap: THREE.CanvasTexture;
  stoneMap: THREE.CanvasTexture;
  stoneBump: THREE.CanvasTexture;
  rockMap: THREE.CanvasTexture;
  rockBump: THREE.CanvasTexture;
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
  metalBump: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
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
    const shade = Math.floor(92 + rand() * 78);
    sbctx.fillStyle = `rgba(${shade},${shade},${shade},0.32)`;
    sbctx.beginPath();
    sbctx.ellipse(x, y, rx, ry, -0.24, 0, Math.PI * 2);
    sbctx.fill();
  }
  for (let i = 0; i < 1800; i++) {
    const v = Math.floor(110 + rand() * 65);
    sbctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    sbctx.fillRect(rand() * 512, rand() * 512, 2, 2);
  }
  const snowBump = configureTexture(snowBumpCanvas, {
    repeatX: 18,
    repeatY: 18,
    anisotropy,
  });

  const [snowRoughCanvas, srctx] = makeCanvas(512);
  srctx.fillStyle = '#cfcfcf';
  srctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2400; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    // Darker pixels = crisp icy sun-glint facets
    const v = i % 9 === 0 ? 52 : Math.floor(175 + rand() * 65);
    srctx.fillStyle = `rgb(${v},${v},${v})`;
    srctx.fillRect(x, y, i % 9 === 0 ? 2 : 3, i % 9 === 0 ? 2 : 3);
  }
  const snowRoughness = configureTexture(snowRoughCanvas, {
    repeatX: 18,
    repeatY: 18,
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

  // 8. Packed Gravel & Frost-Dusted Cobble Footpath Texture + Bump
  const [trailCanvas, trctx] = makeCanvas(512);
  const [trailBumpCanvas, trbctx] = makeCanvas(512);
  trctx.fillStyle = '#8b7f74';
  trctx.fillRect(0, 0, 512, 512);
  trbctx.fillStyle = '#757575';
  trbctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 600; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 4 + rand() * 14;
    const v = Math.floor(110 + rand() * 55);
    trctx.fillStyle = `rgba(${v},${v - 6},${v - 14},0.45)`;
    trctx.beginPath();
    trctx.ellipse(x, y, r, r * 0.78, rand() * Math.PI, 0, Math.PI * 2);
    trctx.fill();

    const bv = Math.floor(125 + rand() * 90);
    trbctx.fillStyle = `rgba(${bv},${bv},${bv},0.55)`;
    trbctx.beginPath();
    trbctx.ellipse(x, y, r, r * 0.78, rand() * Math.PI, 0, Math.PI * 2);
    trbctx.fill();
  }
  // Frost dusting along path edges
  const edgeGradL = trctx.createLinearGradient(0, 0, 96, 0);
  edgeGradL.addColorStop(0, 'rgba(224, 236, 246, 0.85)');
  edgeGradL.addColorStop(1, 'rgba(224, 236, 246, 0)');
  trctx.fillStyle = edgeGradL;
  trctx.fillRect(0, 0, 96, 512);
  const edgeGradR = trctx.createLinearGradient(512, 0, 416, 0);
  edgeGradR.addColorStop(0, 'rgba(224, 236, 246, 0.85)');
  edgeGradR.addColorStop(1, 'rgba(224, 236, 246, 0)');
  trctx.fillStyle = edgeGradR;
  trctx.fillRect(416, 0, 96, 512);
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

  // 12. Hammered & Brushed Forged Metal Bump
  const [metalBumpCanvas, mbctx] = makeCanvas(256);
  mbctx.fillStyle = '#808080';
  mbctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 360; i++) {
    const shade = Math.floor(95 + rand() * 70);
    mbctx.fillStyle = `rgba(${shade},${shade},${shade},0.35)`;
    mbctx.beginPath();
    mbctx.arc(rand() * 256, rand() * 256, 4 + rand() * 10, 0, Math.PI * 2);
    mbctx.fill();
  }
  for (let y = 0; y < 256; y += 3) {
    mbctx.fillStyle = 'rgba(200,200,200,0.12)';
    mbctx.fillRect(0, y, 256, 1);
  }
  const metalBump = configureTexture(metalBumpCanvas, { anisotropy });

  // 13. Soft radial contact shadow disc
  const [shadowCanvas, shctx] = makeCanvas(128);
  const grad = shctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(10, 18, 32, 0.62)');
  grad.addColorStop(0.55, 'rgba(10, 18, 32, 0.28)');
  grad.addColorStop(1, 'rgba(10, 18, 32, 0)');
  shctx.fillStyle = grad;
  shctx.fillRect(0, 0, 128, 128);
  const contactShadowMap = new THREE.CanvasTexture(shadowCanvas);

  const allTextures = [
    snowMap,
    snowBump,
    snowRoughness,
    timberMap,
    timberBump,
    barkMap,
    barkBump,
    birchBarkMap,
    birchBarkBump,
    logEndMap,
    stoneMap,
    stoneBump,
    rockMap,
    rockBump,
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
    metalBump,
    contactShadowMap,
  ];

  return {
    snowMap,
    snowBump,
    snowRoughness,
    timberMap,
    timberBump,
    barkMap,
    barkBump,
    birchBarkMap,
    birchBarkBump,
    logEndMap,
    stoneMap,
    stoneBump,
    rockMap,
    rockBump,
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
    metalBump,
    contactShadowMap,
    dispose: () => {
      for (const tex of allTextures) {
        tex.dispose();
      }
    },
  };
}
