import type { ActiveTool, AnimalKind } from './types';
import type { AnimalBehaviorState } from './wildlife';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function angleDiff(from: number, to: number): number {
  let diff = (to - from) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export function dampAngle(
  current: number,
  target: number,
  rate: number,
  dt: number,
): number {
  const diff = angleDiff(current, target);
  const alpha = 1 - Math.exp(-Math.max(0, rate) * Math.max(0, dt));
  return current + diff * alpha;
}

export function dampScalar(
  current: number,
  target: number,
  rate: number,
  dt: number,
): number {
  const alpha = 1 - Math.exp(-Math.max(0, rate) * Math.max(0, dt));
  return current + (target - current) * alpha;
}

export interface PlanarVelocityStepInput {
  vx: number;
  vz: number;
  inputX: number;
  inputZ: number;
  maxSpeed: number;
  accelRate: number;
  decelRate: number;
  dt: number;
}

export interface PlanarVelocityStepOutput {
  vx: number;
  vz: number;
  speed: number;
  moveYaw: number | null;
}

/**
 * Exponentially damped planar velocity for responsive starts and weighty,
 * natural stops without abrupt zero-frame snapping.
 */
export function stepPlanarVelocity(
  input: PlanarVelocityStepInput,
): PlanarVelocityStepOutput {
  const { vx, vz, inputX, inputZ, maxSpeed, accelRate, decelRate, dt } = input;
  const inLen = Math.hypot(inputX, inputZ);
  const hasInput = inLen > 0.01;
  const throttle = Math.min(1, inLen);

  const targetVx = hasInput ? (inputX / inLen) * maxSpeed * throttle : 0;
  const targetVz = hasInput ? (inputZ / inLen) * maxSpeed * throttle : 0;
  const rate = hasInput ? accelRate : decelRate;
  const alpha = 1 - Math.exp(-Math.max(0, rate) * Math.max(0, dt));

  let nextVx = vx + (targetVx - vx) * alpha;
  let nextVz = vz + (targetVz - vz) * alpha;
  let speed = Math.hypot(nextVx, nextVz);

  if (!hasInput && speed < 0.08) {
    nextVx = 0;
    nextVz = 0;
    speed = 0;
  }

  return {
    vx: nextVx,
    vz: nextVz,
    speed,
    moveYaw: speed > 0.15 ? Math.atan2(nextVx, nextVz) : null,
  };
}

export interface BipedGaitInput {
  walkPhase: number;
  speed: number;
  maxSpeed: number;
  isCreeping: boolean;
  idleTime: number;
  /** 1 -> 0 over swing duration, 0 when not swinging */
  swingProgress: number;
  activeTool: ActiveTool;
  turnBank: number;
  /** True while player is actively drawing/aiming bow before shot or during quick shot */
  isAiming?: boolean;
}

export interface BipedGaitPose {
  leftHipX: number;
  leftKneeX: number;
  rightHipX: number;
  rightKneeX: number;
  leftShoulderX: number;
  leftElbowX: number;
  leftShoulderZ: number;
  rightShoulderX: number;
  rightElbowX: number;
  rightShoulderZ: number;
  torsoPitchX: number;
  torsoTwistY: number;
  torsoRollZ: number;
  pelvisY: number;
  headPitchX: number;
  /** 0..1 bowstring draw pullback */
  bowStringPull: number;
  /** 0..1 active slash arc visibility/progress */
  slashAlpha: number;
  /** -1..1 slash sweep progress */
  slashSweep: number;
}

/**
 * Computes full-body procedural biped locomotion, crouch stealth posture,
 * two-handed bow draw + snap release, weight-shifted windup->cleave axe swing,
 * and idle breathing.
 */
export function computeBipedGait(input: BipedGaitInput): BipedGaitPose {
  const normSpeed = clamp(input.speed / Math.max(0.1, input.maxSpeed), 0, 1.35);
  const moveBlend = clamp(normSpeed, 0, 1);
  const crouch = input.isCreeping ? 1 : 0;

  // Stride phase & leg swing
  const strideAmp = (input.isCreeping ? 0.42 : 0.68) * moveBlend;
  const s = Math.sin(input.walkPhase);
  const c = Math.cos(input.walkPhase);

  // Subtle crouch hip bend keeps stance low during Shift creep
  const crouchHipOffset = crouch * -0.22;
  const crouchKneeBase = crouch * 0.44;

  const leftHipX = s * strideAmp + crouchHipOffset;
  const rightHipX = -s * strideAmp + crouchHipOffset;

  // Knees flex smoothly during back-lift / pass-through and extend toward heel-strike
  const leftKneeBend = Math.max(0, -s * 0.65 + c * 0.48) * moveBlend;
  const rightKneeBend = Math.max(0, s * 0.65 - c * 0.48) * moveBlend;
  const leftKneeX = clamp(leftKneeBend + crouchKneeBase, 0, 1.25);
  const rightKneeX = clamp(rightKneeBend + crouchKneeBase, 0, 1.25);

  // Pelvis vertical bounce + crouch sink + calm idle breath
  const idleBreath = Math.sin(input.idleTime * 2.1) * 0.014 * (1 - moveBlend);
  const strideBounce = Math.abs(Math.sin(input.walkPhase)) * (input.isCreeping ? 0.035 : 0.075) * moveBlend;
  let pelvisY = strideBounce - crouch * 0.09 + idleBreath;

  // Forward athletic lean on sprint/creep + turn bank roll + hip/shoulder counter-twist
  let torsoPitchX =
    moveBlend * (input.isCreeping ? 0.24 : 0.14) +
    Math.sin(input.idleTime * 2.1) * 0.015 * (1 - moveBlend);
  let torsoTwistY = -s * 0.12 * moveBlend;
  let torsoRollZ = clamp(input.turnBank, -0.22, 0.22) + c * 0.03 * moveBlend;
  let headPitchX = -torsoPitchX * 0.55 + Math.sin(input.idleTime * 1.4) * 0.025 * (1 - moveBlend);

  // Natural arm counterbalance when walking/running
  let leftShoulderX = -s * strideAmp * 0.72;
  let leftElbowX = -0.22 - Math.max(0, -s) * 0.35 * moveBlend;
  let leftShoulderZ = 0.09 + crouch * 0.06;

  let rightShoulderX = s * strideAmp * 0.62;
  let rightElbowX = -0.26 - Math.max(0, s) * 0.3 * moveBlend;
  let rightShoulderZ = -0.09 - crouch * 0.06;

  let bowStringPull = 0;
  let slashAlpha = 0;
  let slashSweep = 0;

  // Tool pose & active windup -> strike -> follow-through
  const p = clamp(input.swingProgress, 0, 1); // 1 just triggered -> 0 finished
  if (input.activeTool === 'bow') {
    const aimBias = input.isAiming ? 1 : 0;
    leftShoulderX = -1.24 + s * 0.06 * moveBlend;
    leftElbowX = -0.14;
    leftShoulderZ = -0.2;

    if (p > 0) {
      // Phase 1 (elapsed 0..0.28): quick crisp draw back to cheek
      // Phase 2 (elapsed 0.28..1.0): explosive snap release + bow kick + re-nock
      const elapsed = 1 - p;
      if (elapsed < 0.28) {
        const t = elapsed / 0.28;
        const draw = Math.sin(t * Math.PI * 0.5);
        bowStringPull = 0.28 + draw * 0.72;
        rightShoulderX = -1.16 - draw * 0.32;
        rightElbowX = -0.92 - draw * 0.42;
        rightShoulderZ = 0.24;
        torsoTwistY += 0.24 + draw * 0.14;
        torsoPitchX -= draw * 0.06;
        headPitchX += 0.04;
      } else {
        const t = (elapsed - 0.28) / 0.72;
        const snap = Math.exp(-t * 6.5);
        const settle = 1 - Math.exp(-t * 5.0);
        bowStringPull = snap * 0.16 * Math.cos(t * 18); // brief string twang oscillation
        leftShoulderX = -1.24 - snap * 0.14 + s * 0.06 * moveBlend * settle;
        rightShoulderX = -1.48 * (1 - settle) - 1.08 * settle;
        rightElbowX = -0.52 * snap - 0.82 * (1 - snap);
        rightShoulderZ = 0.28 - settle * 0.1;
        torsoTwistY += 0.38 * (1 - settle) + 0.18 * settle;
        torsoPitchX += snap * 0.05;
      }
    } else {
      bowStringPull = aimBias ? 0.55 : 0.18;
      rightShoulderX = -1.1 + s * 0.05 * moveBlend;
      rightElbowX = aimBias ? -1.02 : -0.82;
      rightShoulderZ = 0.18;
      torsoTwistY += 0.18 + aimBias * 0.1;
    }
  } else if (p > 0) {
    // Weight-shifted 3-phase axe cleave: overhead windup -> explosive diagonal cleave -> follow-through
    const elapsed = 1 - p;
    if (elapsed < 0.26) {
      const t = elapsed / 0.26;
      const ease = t * t;
      rightShoulderX = -0.38 - ease * 1.92; // raise high overhead & back
      rightElbowX = -0.35 - ease * 0.62;
      rightShoulderZ = -0.32 * ease;
      leftShoulderX -= ease * 0.42;
      leftElbowX -= ease * 0.3;
      torsoTwistY -= ease * 0.48;
      torsoPitchX -= ease * 0.14;
      torsoRollZ -= ease * 0.1;
      pelvisY += ease * 0.035;
    } else if (elapsed < 0.64) {
      const t = (elapsed - 0.26) / 0.38;
      const slam = Math.sin(t * Math.PI * 0.5);
      rightShoulderX = -2.3 + slam * 2.82; // explosive diagonal cleave
      rightElbowX = -0.97 + slam * 0.82;
      rightShoulderZ = -0.32 + slam * 0.48;
      leftShoulderX -= (1 - slam) * 0.42 - slam * 0.22;
      torsoTwistY = -0.48 + slam * 0.96;
      torsoPitchX += -0.14 + slam * 0.36;
      torsoRollZ += -0.1 + slam * 0.2;
      pelvisY -= slam * 0.065;
      slashAlpha = Math.sin(t * Math.PI);
      slashSweep = t * 2 - 1;
    } else {
      const t = (elapsed - 0.64) / 0.36;
      const recover = 1 - (1 - t) * (1 - t);
      rightShoulderX = 0.52 * (1 - recover) + s * strideAmp * 0.62 * recover;
      rightElbowX = -0.15 * (1 - recover) - 0.26 * recover;
      rightShoulderZ = 0.16 * (1 - recover) - 0.09 * recover;
      torsoTwistY = 0.48 * (1 - recover) + torsoTwistY * recover;
      torsoPitchX = (torsoPitchX + 0.22) * (1 - recover) + torsoPitchX * recover;
      pelvisY -= 0.065 * (1 - recover);
      slashAlpha = Math.max(0, (1 - t * 2.5) * 0.35);
      slashSweep = 1;
    }
  }

  return {
    leftHipX,
    leftKneeX,
    rightHipX,
    rightKneeX,
    leftShoulderX,
    leftElbowX,
    leftShoulderZ,
    rightShoulderX,
    rightElbowX,
    rightShoulderZ,
    torsoPitchX,
    torsoTwistY,
    torsoRollZ,
    pelvisY,
    headPitchX,
    bowStringPull,
    slashAlpha,
    slashSweep,
  };
}

export interface QuadrupedGaitInput {
  kind: AnimalKind;
  state: AnimalBehaviorState;
  walkPhase: number;
  speed: number;
  maxWanderSpeed: number;
  time: number;
  animalId: number;
}

export interface QuadrupedGaitPose {
  /** Upper leg hip/shoulder rotations [FL, FR, BL, BR] */
  legUpperX: [number, number, number, number];
  /** Lower leg knee/hock rotations [FL, FR, BL, BR] */
  legLowerX: [number, number, number, number];
  bodyY: number;
  spinePitchX: number;
  spineRollZ?: number;
  headPitchX: number;
  headYawY: number;
  tailPitchX: number;
  tailYawY: number;
  earPitchX: number;
  trunkPitchX: number;
}

/**
 * Computes species-authentic quadruped locomotion with anatomical knee/hock flexion,
 * shoulder/haunch weight transfer (spineRollZ), rabbit bounding, cervid/musk-ox grazing dips,
 * predator windup crouches, and ambient idles.
 */
export function computeQuadrupedGait(
  input: QuadrupedGaitInput,
): QuadrupedGaitPose {
  const { kind, state, walkPhase, speed, maxWanderSpeed, time, animalId } = input;
  const moveBlend = clamp(speed / Math.max(0.25, maxWanderSpeed), 0, 1.5);
  const strideNorm = clamp(moveBlend, 0, 1);
  const ambientPhase = time * 2.2 + animalId * 1.37;
  const breath = Math.sin(ambientPhase) * 0.014;

  let legUpperX: [number, number, number, number] = [0, 0, 0, 0];
  let legLowerX: [number, number, number, number] = [0, 0, 0, 0];
  let bodyY = breath;
  let spinePitchX = 0;
  let spineRollZ = Math.cos(ambientPhase * 0.6) * 0.012 * (1 - strideNorm);
  let headPitchX = Math.sin(ambientPhase * 0.8) * 0.035;
  let headYawY = Math.sin(ambientPhase * 0.45) * 0.095 * (1 - strideNorm * 0.65);
  let tailPitchX = Math.sin(ambientPhase * 1.4) * 0.07;
  let tailYawY = Math.sin(ambientPhase * 1.7) * 0.16;
  let earPitchX = Math.sin(ambientPhase * 1.9) * 0.075;
  let trunkPitchX = Math.sin(ambientPhase * 1.1) * 0.16;

  if (state === 'windup') {
    const coil = 0.5 + 0.5 * Math.sin(time * 20 + animalId);
    const isCat = kind === 'lynx' || kind === 'sabertooth';
    const isMassive = kind === 'mammoth' || kind === 'polar_bear';
    bodyY = isMassive ? -0.07 : isCat ? -0.21 : -0.17;
    spinePitchX = kind === 'mammoth' ? 0.14 : isCat ? 0.28 : 0.22;
    spineRollZ = Math.sin(time * 24 + animalId) * 0.045;
    headPitchX = kind === 'mammoth' ? -0.28 : 0.3;
    headYawY = Math.sin(time * 16 + animalId) * 0.05;
    legUpperX = [-0.44, -0.44, 0.36, 0.36];
    legLowerX = [0.58, 0.58, -0.48, -0.48];
    tailPitchX = -0.36;
    tailYawY = Math.sin(time * 15) * 0.28;
    earPitchX = -0.4;
    trunkPitchX = -0.46 + coil * 0.22;
    return {
      legUpperX,
      legLowerX,
      bodyY,
      spinePitchX,
      spineRollZ,
      headPitchX,
      headYawY,
      tailPitchX,
      tailYawY,
      earPitchX,
      trunkPitchX,
    };
  }

  if (state === 'lunge') {
    const isMassive = kind === 'mammoth' || kind === 'polar_bear';
    const pouncePulse = Math.sin(time * 24 + animalId) * 0.06;
    bodyY = isMassive ? 0.11 + pouncePulse : 0.24 + pouncePulse;
    spinePitchX = isMassive ? -0.12 : -0.24;
    spineRollZ = Math.sin(time * 18) * 0.04;
    headPitchX = 0.18;
    headYawY = 0;
    legUpperX = [0.82, 0.72, -0.84, -0.76];
    legLowerX = [-0.3, -0.24, 0.56, 0.5];
    tailPitchX = 0.26;
    tailYawY = 0;
    earPitchX = -0.32;
    trunkPitchX = 0.48;
    return {
      legUpperX,
      legLowerX,
      bodyY,
      spinePitchX,
      spineRollZ,
      headPitchX,
      headYawY,
      tailPitchX,
      tailYawY,
      earPitchX,
      trunkPitchX,
    };
  }

  if (state === 'alert') {
    bodyY = 0.025 + breath * 0.5;
    spinePitchX = -0.045;
    spineRollZ = 0;
    headPitchX = -0.18;
    headYawY = Math.sin(time * 2.8 + animalId) * 0.2;
    earPitchX = 0.22;
    tailPitchX = 0.16;
    tailYawY = 0;
    return {
      legUpperX,
      legLowerX,
      bodyY,
      spinePitchX,
      spineRollZ,
      headPitchX,
      headYawY,
      tailPitchX,
      tailYawY,
      earPitchX,
      trunkPitchX,
    };
  }

  if (kind === 'hare') {
    const hop = Math.abs(Math.sin(walkPhase)) * strideNorm;
    const pitch = Math.cos(walkPhase) * 0.21 * strideNorm;
    const frontSwing = Math.sin(walkPhase) * 0.72 * strideNorm;
    const hindSwing = -Math.sin(walkPhase) * 0.82 * strideNorm;

    bodyY = hop * 0.3 + breath;
    spinePitchX = pitch;
    spineRollZ = Math.sin(walkPhase * 0.5) * 0.03 * strideNorm;
    legUpperX = [frontSwing, frontSwing, hindSwing, hindSwing];
    legLowerX = [
      Math.max(0, -frontSwing) * 0.68,
      Math.max(0, -frontSwing) * 0.68,
      Math.max(0, hindSwing) * 0.58,
      Math.max(0, hindSwing) * 0.58,
    ];
    headPitchX = -pitch * 0.48 + Math.sin(ambientPhase * 1.4) * 0.045;
    earPitchX = -pitch * 0.78 + Math.sin(walkPhase) * 0.14 * strideNorm;
    tailPitchX = pitch * 0.52;
  } else {
    const gallopBlend = clamp((moveBlend - 0.92) * 1.65, 0, 1);
    const amp =
      kind === 'mammoth'
        ? 0.36
        : kind === 'musk_ox'
          ? 0.4
          : kind === 'polar_bear'
            ? 0.48
            : kind === 'stag' || kind === 'frost_stag'
              ? 0.62
              : kind === 'sabertooth' || kind === 'aurora_fenrir'
                ? 0.66
                : 0.6;

    const pFL = walkPhase;
    const pBR = walkPhase + 0.2 * (1 - gallopBlend);
    const pFR = walkPhase + Math.PI * (1 - gallopBlend * 0.72);
    const pBL = walkPhase + Math.PI * (1 - gallopBlend * 0.62);

    const phases = [pFL, pFR, pBL, pBR] as const;
    for (let i = 0; i < 4; i++) {
      const ph = phases[i];
      // Second harmonic adds natural asymmetric reach vs push-off
      const swing =
        (Math.sin(ph) + 0.14 * Math.sin(ph * 2 - 0.4)) * amp * strideNorm;
      const lift = Math.max(0, -Math.cos(ph)) * strideNorm;
      legUpperX[i] = swing;
      const isFront = i < 2;
      legLowerX[i] = isFront ? lift * 0.78 : -lift * 0.62;
    }

    const bounceAmp =
      kind === 'mammoth' || kind === 'musk_ox'
        ? 0.05
        : kind === 'polar_bear'
          ? 0.062
          : 0.082;
    bodyY = Math.abs(Math.sin(walkPhase)) * bounceAmp * strideNorm + breath;
    spinePitchX =
      state === 'curious'
        ? 0.08
        : Math.cos(walkPhase * (1 + gallopBlend)) * 0.075 * moveBlend;
    spineRollZ = Math.cos(walkPhase) * 0.048 * strideNorm;

    const isGrazer = kind === 'stag' || kind === 'frost_stag' || kind === 'musk_ox';
    if (isGrazer && state === 'wander' && speed < 1.1) {
      const grazeWave = Math.max(0, Math.sin(time * 0.9 + animalId * 2.1));
      headPitchX = grazeWave * 0.54;
      headYawY = Math.sin(time * 1.6 + animalId) * 0.16 * grazeWave;
    } else if (state === 'curious') {
      headPitchX = -0.12;
      headYawY = Math.sin(time * 1.9 + animalId) * 0.24;
      earPitchX = 0.18;
    } else {
      headPitchX =
        Math.sin(walkPhase * 2 - 0.5) * 0.068 * strideNorm +
        Math.sin(ambientPhase * 0.7) * 0.028;
      earPitchX =
        Math.cos(walkPhase * 2) * 0.065 * strideNorm +
        Math.sin(ambientPhase * 1.9) * 0.05;
    }

    tailYawY = Math.sin(walkPhase + animalId) * (0.26 * strideNorm + 0.1);
    tailPitchX = -0.08 + Math.cos(walkPhase * 2) * 0.095 * strideNorm;
    if (kind === 'mammoth') {
      trunkPitchX =
        Math.sin(walkPhase * 0.8) * 0.24 * strideNorm +
        Math.sin(ambientPhase) * 0.14;
    }
  }

  return {
    legUpperX,
    legLowerX,
    bodyY,
    spinePitchX,
    spineRollZ,
    headPitchX,
    headYawY,
    tailPitchX,
    tailYawY,
    earPitchX,
    trunkPitchX,
  };
}

export interface TouchpadVectorOutput {
  /** Normalized horizontal world movement vector (-1..1), scaled by analog magnitude */
  dx: number;
  /** Normalized depth world movement vector (-1..1), scaled by analog magnitude */
  dz: number;
  /** Clamped visual thumb puck offset X in pixels */
  knobX: number;
  /** Clamped visual thumb puck offset Y in pixels */
  knobY: number;
  /** Analog deflection magnitude in [0, 1] after deadzone */
  magnitude: number;
  /** True when gently deflecting touchpad in the inner stealth/stalk ring */
  isStalking: boolean;
}

/**
 * Converts pointer delta (offsetX, offsetY) relative to touchpad center into
 * smooth 360-degree analog movement vector (dx, dz) and clamped thumb puck coordinates.
 */
export function computeTouchpadVector(
  offsetX: number,
  offsetY: number,
  maxRadius: number,
  deadzoneRatio = 0.12,
): TouchpadVectorOutput {
  const safeRadius = Math.max(1, maxRadius);
  const rawDist = Math.hypot(offsetX, offsetY);
  if (rawDist < 1e-4) {
    return { dx: 0, dz: 0, knobX: 0, knobY: 0, magnitude: 0, isStalking: false };
  }

  const clampedDist = Math.min(rawDist, safeRadius);
  const nx = offsetX / rawDist;
  const ny = offsetY / rawDist;
  const knobX = nx * clampedDist;
  const knobY = ny * clampedDist;

  const rawNorm = clampedDist / safeRadius;
  const dzClamped = clamp(deadzoneRatio, 0, 0.45);
  if (rawNorm <= dzClamped) {
    return { dx: 0, dz: 0, knobX, knobY, magnitude: 0, isStalking: false };
  }

  const magnitude = clamp((rawNorm - dzClamped) / (1 - dzClamped), 0, 1);
  return {
    dx: nx * magnitude,
    dz: ny * magnitude,
    knobX,
    knobY,
    magnitude,
    isStalking: magnitude > 0 && magnitude <= 0.55,
  };
}

