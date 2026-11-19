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
  /** True for peaceful townspeople/patrols carrying a bow lowered during casual walking */
  relaxedCarry?: boolean;
  /** True when character is resting/sleeping in a cabin bed */
  isSleeping?: boolean;
  /** Elapsed time in seconds during sleep animation */
  sleepTime?: number;
  /** True when character has fallen or waded into deep lake water and is swimming */
  isSwimming?: boolean;
  /** Elapsed time in seconds while swimming */
  swimTime?: number;
  /** True when character is airborne (jumping/falling) */
  isAirborne?: boolean;
  /** Current vertical velocity (m/s) when airborne */
  verticalVelocity?: number;
  /** 0..1 decaying landing absorption impact immediately upon touchdown */
  landingBounce?: number;
}

export interface BipedGaitPose {
  leftHipX: number;
  leftKneeX: number;
  rightHipX: number;
  rightKneeX: number;
  leftShoulderX: number;
  leftElbowX: number;
  leftShoulderZ: number;
  leftWristX?: number;
  rightShoulderX: number;
  rightElbowX: number;
  rightShoulderZ: number;
  rightWristX?: number;
  torsoPitchX: number;
  torsoTwistY: number;
  torsoRollZ: number;
  pelvisY: number;
  headPitchX: number;
  /** Body supine tilt (-PI/2 when lying flat on back in bed, +1.15 when swimming prone, 0 when standing) */
  bodyPitchX?: number;
  /** 0..1 bowstring draw pullback */
  bowStringPull: number;
  /** 0..1 bow limb flexion */
  bowLimbBend?: number;
  /** True when nocked arrow should be shown on bowstring */
  nockedArrowVisible?: boolean;
  /** 0..1 active slash arc visibility/progress */
  slashAlpha: number;
  /** -1..1 slash sweep progress */
  slashSweep: number;
}

/**
 * Computes buoyant water-treading and prone freestyle/breaststroke swimming kinematics
 * when the player falls or wades into Crystal Lagoon or wilderness lakes.
 */
export function computeSwimPose(input: BipedGaitInput): BipedGaitPose {
  const t = Math.max(0, input.swimTime ?? input.idleTime);
  const normSpeed = clamp(input.speed / Math.max(0.1, input.maxSpeed), 0, 1.25);
  const moveBlend = clamp(normSpeed, 0, 1);

  // Stroke cycle accelerates smoothly when actively swimming across the lake
  const strokePhase = input.walkPhase * 1.15 + t * (2.6 + moveBlend * 2.2);
  const kickPhase = strokePhase * 2.2;

  const sL = Math.sin(strokePhase);
  const cL = Math.cos(strokePhase);
  const sR = Math.sin(strokePhase + Math.PI);
  const cR = Math.cos(strokePhase + Math.PI);

  // Treading water (upright sculling) vs active forward prone freestyle stroke
  const treadLeftX = -1.05 + sL * 0.36;
  const treadLeftZ = 0.58 + cL * 0.34;
  const treadLeftElbow = -0.62 - Math.max(0, cL) * 0.32;

  const treadRightX = -1.05 + sR * 0.36;
  const treadRightZ = -0.58 - cR * 0.34;
  const treadRightElbow = -0.62 - Math.max(0, cR) * 0.32;

  // Forward freestyle crawl stroke when moving through water
  const crawlLeftX = -1.45 + sL * 1.15;
  const crawlLeftZ = 0.32 + Math.max(0, cL) * 0.52;
  const crawlLeftElbow = -0.35 - Math.max(0, -sL) * 0.65;

  const crawlRightX = -1.45 + sR * 1.15;
  const crawlRightZ = -0.32 - Math.max(0, cR) * 0.52;
  const crawlRightElbow = -0.35 - Math.max(0, -sR) * 0.65;

  const leftShoulderX = treadLeftX * (1 - moveBlend) + crawlLeftX * moveBlend;
  const leftShoulderZ = treadLeftZ * (1 - moveBlend) + crawlLeftZ * moveBlend;
  const leftElbowX = treadLeftElbow * (1 - moveBlend) + crawlLeftElbow * moveBlend;
  const leftWristX = 0.18 * sL;

  const rightShoulderX = treadRightX * (1 - moveBlend) + crawlRightX * moveBlend;
  const rightShoulderZ = treadRightZ * (1 - moveBlend) + crawlRightZ * moveBlend;
  const rightElbowX = treadRightElbow * (1 - moveBlend) + crawlRightElbow * moveBlend;
  const rightWristX = 0.18 * sR;

  // Alternating flutter kick legs beneath the water surface
  const kickAmp = 0.36 + moveBlend * 0.24;
  const kSin = Math.sin(kickPhase);
  const kCos = Math.cos(kickPhase);
  const leftHipX = kSin * kickAmp - 0.12 * (1 - moveBlend);
  const rightHipX = -kSin * kickAmp - 0.12 * (1 - moveBlend);
  const leftKneeX = clamp(0.28 + Math.max(0, -kCos) * 0.58, 0.1, 1.15);
  const rightKneeX = clamp(0.28 + Math.max(0, kCos) * 0.58, 0.1, 1.15);

  // Buoyant vertical immersion & prone body pitch
  const waveBob = Math.sin(t * 2.9) * 0.055 + Math.cos(strokePhase * 2) * 0.035 * moveBlend;
  const pelvisY = -0.46 + moveBlend * 0.12 + waveBob;
  const bodyPitchX = 0.24 + moveBlend * 0.88 + Math.sin(t * 2.2) * 0.04;
  const torsoPitchX = 0.08 * (1 - moveBlend) + Math.sin(strokePhase * 2) * 0.05;
  const torsoTwistY = -cL * (0.12 + moveBlend * 0.18);
  const torsoRollZ = sL * (0.08 + moveBlend * 0.16) + clamp(input.turnBank, -0.2, 0.2);
  // Keep head lifted above the water surface looking forward
  const headPitchX = -0.22 - moveBlend * 0.62 + Math.cos(t * 2.9) * 0.045;

  return {
    leftHipX,
    leftKneeX,
    rightHipX,
    rightKneeX,
    leftShoulderX,
    leftElbowX,
    leftShoulderZ,
    leftWristX,
    rightShoulderX,
    rightElbowX,
    rightShoulderZ,
    rightWristX,
    torsoPitchX,
    torsoTwistY,
    torsoRollZ,
    pelvisY,
    headPitchX,
    bodyPitchX,
    bowStringPull: 0,
    bowLimbBend: 0,
    nockedArrowVisible: false,
    slashAlpha: 0,
    slashSweep: 0,
  };
}

/**
 * Computes calm supine sleeping animation with smooth lie-down transition,
 * rhythmic chest breathing rise/fall, relaxed knee bend, and resting arms.
 */
export function computeSleepPose(sleepTime: number): BipedGaitPose {
  const t = Math.max(0, sleepTime);
  // Smooth 0.35s ease from standing upright into lying supine on mattress
  const rawLie = clamp(t / 0.35, 0, 1);
  const lieBlend = rawLie * rawLie * (3 - 2 * rawLie);
  const breath = Math.sin(t * 2.35);
  const slowDrift = Math.sin(t * 1.15);

  if (lieBlend === 0) {
    return {
      leftHipX: 0,
      leftKneeX: 0,
      rightHipX: 0,
      rightKneeX: 0,
      leftShoulderX: 0,
      leftElbowX: 0,
      leftShoulderZ: 0,
      leftWristX: 0,
      rightShoulderX: 0,
      rightElbowX: 0,
      rightShoulderZ: 0,
      rightWristX: 0,
      torsoPitchX: 0,
      torsoTwistY: 0,
      torsoRollZ: 0,
      pelvisY: 0,
      headPitchX: 0,
      bodyPitchX: 0,
      bowStringPull: 0,
      bowLimbBend: 0,
      nockedArrowVisible: false,
      slashAlpha: 0,
      slashSweep: 0,
    };
  }

  return {
    leftHipX: 0.06 * lieBlend,
    leftKneeX: (0.16 + slowDrift * 0.025) * lieBlend,
    rightHipX: 0.04 * lieBlend,
    rightKneeX: (0.21 - slowDrift * 0.025) * lieBlend,
    leftShoulderX: (-0.26 + breath * 0.032) * lieBlend,
    leftElbowX: -0.68 * lieBlend,
    leftShoulderZ: 0.18 * lieBlend,
    leftWristX: 0.06 * lieBlend,
    rightShoulderX: (-0.24 - breath * 0.028) * lieBlend,
    rightElbowX: -0.74 * lieBlend,
    rightShoulderZ: -0.18 * lieBlend,
    rightWristX: -0.06 * lieBlend,
    torsoPitchX: breath * 0.035 * lieBlend,
    torsoTwistY: slowDrift * 0.028 * lieBlend,
    torsoRollZ: 0,
    pelvisY: breath * 0.018 * lieBlend,
    headPitchX: (0.12 + slowDrift * 0.035) * lieBlend,
    bodyPitchX: (-Math.PI / 2) * lieBlend,
    bowStringPull: 0,
    bowLimbBend: 0,
    nockedArrowVisible: false,
    slashAlpha: 0,
    slashSweep: 0,
  };
}

/**
 * Computes full-body procedural biped locomotion, crouch stealth posture,
 * two-handed bow draw + anchor + snap release, weight-shifted windup->cleave axe swing,
 * sleeping supine breathing pose, swimming water strokes, and idle breathing.
 */
export function computeBipedGait(input: BipedGaitInput): BipedGaitPose {
  if (input.isSleeping) {
    return computeSleepPose(input.sleepTime ?? input.idleTime);
  }
  if (input.isSwimming) {
    return computeSwimPose(input);
  }
  const normSpeed = clamp(input.speed / Math.max(0.1, input.maxSpeed), 0, 1.35);
  const moveBlend = clamp(normSpeed, 0, 1);
  const sprintBoost = clamp((normSpeed - 0.75) * 1.4, 0, 0.35);
  const crouch = input.isCreeping ? 1 : 0;

  // Stride phase & leg swing with 2nd harmonic for natural heel-strike & toe-off
  const strideAmp = (input.isCreeping ? 0.46 : 0.74 + sprintBoost * 0.22) * moveBlend;
  const s = Math.sin(input.walkPhase);
  const c = Math.cos(input.walkPhase);
  const s2 = Math.sin(input.walkPhase * 2 - 0.35);

  // Subtle crouch hip bend keeps stance low during Shift creep
  const crouchHipOffset = crouch * -0.24;
  const crouchKneeBase = crouch * 0.46;

  const leftHipX = (s + 0.12 * s2) * strideAmp + crouchHipOffset;
  const rightHipX = (-s - 0.12 * s2) * strideAmp + crouchHipOffset;

  // Knees flex smoothly during back-lift / pass-through and extend toward heel-strike
  const leftKneeBend = Math.max(0, -s * 0.72 + c * 0.52) * moveBlend;
  const rightKneeBend = Math.max(0, s * 0.72 - c * 0.52) * moveBlend;
  const leftKneeX = clamp(leftKneeBend + crouchKneeBase, 0, 1.32);
  const rightKneeX = clamp(rightKneeBend + crouchKneeBase, 0, 1.32);

  // Pelvis vertical bounce + crouch sink + calm idle breath
  const idleBreath = Math.sin(input.idleTime * 2.2) * 0.016 * (1 - moveBlend);
  const strideBounce =
    Math.abs(Math.sin(input.walkPhase)) *
    (input.isCreeping ? 0.038 : 0.084 + sprintBoost * 0.025) *
    moveBlend;
  let pelvisY = strideBounce - crouch * 0.095 + idleBreath;

  // Forward athletic lean on sprint/creep + turn bank roll + hip/shoulder counter-twist
  let torsoPitchX =
    moveBlend * (input.isCreeping ? 0.26 : 0.16 + sprintBoost * 0.08) +
    Math.sin(input.idleTime * 2.2) * 0.018 * (1 - moveBlend);
  let torsoTwistY = -s * (0.16 + sprintBoost * 0.06) * moveBlend;
  let torsoRollZ = clamp(input.turnBank, -0.24, 0.24) + c * 0.042 * moveBlend;
  let headPitchX =
    -torsoPitchX * 0.58 + Math.sin(input.idleTime * 1.45) * 0.028 * (1 - moveBlend);

  // Natural athletic arm counterbalance when walking/running
  let leftShoulderX = -s * strideAmp * 0.78 - 0.06 * (1 - moveBlend);
  let leftElbowX = -0.26 - Math.max(0, -s) * 0.42 * moveBlend;
  let leftShoulderZ = 0.11 + crouch * 0.06;
  let leftWristX = -0.05 * moveBlend;

  let rightShoulderX = s * strideAmp * 0.68 - 0.08 * (1 - moveBlend);
  let rightElbowX = -0.32 - Math.max(0, s) * 0.36 * moveBlend;
  let rightShoulderZ = -0.11 - crouch * 0.06;
  let rightWristX = 0.06 * (1 - moveBlend);

  let bowStringPull = 0;
  let bowLimbBend = 0;
  let nockedArrowVisible = false;
  let slashAlpha = 0;
  let slashSweep = 0;

  // Tool pose & active windup -> strike -> follow-through
  const p = clamp(input.swingProgress, 0, 1); // 1 just triggered -> 0 finished
  if (input.activeTool === 'bow' && !(input.relaxedCarry && !input.isAiming && p <= 0)) {
    const aimBias = input.isAiming ? 1 : 0;
    leftShoulderX = -1.32 + s * 0.05 * moveBlend;
    leftElbowX = -0.1;
    leftShoulderZ = -0.22;
    leftWristX = 0.08;

    if (p > 0) {
      // Phase 1 (elapsed 0..0.30): fluid power draw back to cheek anchor + arrow nock
      // Phase 2 (elapsed 0.30..0.58): crisp snap release + bow kick + string harmonic
      // Phase 3 (elapsed 0.58..1.00): smooth follow-through & reach to quiver
      const elapsed = 1 - p;
      if (elapsed < 0.3) {
        const t = elapsed / 0.3;
        const draw = Math.sin(t * Math.PI * 0.5);
        bowStringPull = 0.32 + draw * 0.68;
        bowLimbBend = bowStringPull;
        nockedArrowVisible = true;
        leftShoulderX = -1.36 - draw * 0.06;
        rightShoulderX = -1.18 - draw * 0.36;
        rightElbowX = -0.94 - draw * 0.46;
        rightShoulderZ = 0.26;
        rightWristX = -0.18 * draw;
        torsoTwistY += 0.28 + draw * 0.18;
        torsoPitchX -= draw * 0.07;
        headPitchX += 0.05;
      } else {
        const t = (elapsed - 0.3) / 0.7;
        const snap = Math.exp(-t * 6.8);
        const settle = 1 - Math.exp(-t * 4.8);
        bowStringPull = snap * 0.18 * Math.cos(t * 22); // crisp bowstring twang oscillation
        bowLimbBend = Math.max(0, snap * 0.22);
        nockedArrowVisible = t > 0.65;
        leftShoulderX = -1.32 - snap * 0.18 + s * 0.05 * moveBlend * settle;
        leftWristX = 0.08 - snap * 0.14;
        rightShoulderX = -1.56 * (1 - settle) - 1.12 * settle;
        rightElbowX = -0.46 * snap - 0.86 * (1 - snap);
        rightShoulderZ = 0.32 - settle * 0.12;
        rightWristX = 0.22 * snap;
        torsoTwistY += 0.44 * (1 - settle) + 0.22 * settle;
        torsoPitchX += snap * 0.06;
      }
    } else {
      const idleDrawBreath = Math.sin(input.idleTime * 2.4) * 0.03;
      bowStringPull = (aimBias ? 0.68 : 0.22) + idleDrawBreath;
      bowLimbBend = bowStringPull * 0.85;
      nockedArrowVisible = true;
      rightShoulderX = -1.14 - aimBias * 0.14 + s * 0.05 * moveBlend;
      rightElbowX = aimBias ? -1.12 : -0.84;
      rightShoulderZ = 0.2 + aimBias * 0.05;
      rightWristX = aimBias ? -0.12 : -0.04;
      torsoTwistY += 0.22 + aimBias * 0.14;
    }
  } else if (input.activeTool === 'rod') {
    const rodBreath = Math.sin(input.idleTime * 2.1) * 0.04;
    if (p > 0) {
      const elapsed = 1 - p;
      const arc = Math.sin(elapsed * Math.PI);
      rightShoulderX = -0.82 - arc * 0.95;
      rightElbowX = -0.45 - arc * 0.35;
      rightShoulderZ = -0.08;
      rightWristX = -0.15 + arc * 0.45;
      leftShoulderX = -0.35 - arc * 0.25;
      leftElbowX = -0.55;
      torsoPitchX -= arc * 0.12;
    } else {
      rightShoulderX = -0.68 + rodBreath + s * 0.12 * moveBlend;
      rightElbowX = -0.52;
      rightShoulderZ = -0.06;
      rightWristX = 0.08;
      leftShoulderX = -0.28 + rodBreath * 0.5;
      leftElbowX = -0.48;
    }
  } else if (p > 0) {
    // Heroic 3-phase Barbarian Axe Cleave:
    // 1. Coil & high shoulder windup (0..0.28)
    // 2. Explosive diagonal timber-splitting cleave (0.28..0.64)
    // 3. Weighty follow-through & recovery (0.64..1.00)
    const elapsed = 1 - p;
    if (elapsed < 0.28) {
      const t = elapsed / 0.28;
      const ease = t * (2 - t);
      rightShoulderX = -0.42 - ease * 2.04; // raise high overhead & back
      rightElbowX = -0.38 - ease * 0.68;
      rightShoulderZ = -0.36 * ease;
      rightWristX = -0.38 * ease; // cock wrist back
      leftShoulderX -= ease * 0.56;
      leftElbowX -= ease * 0.38;
      leftShoulderZ = 0.18 * ease;
      torsoTwistY -= ease * 0.56;
      torsoPitchX -= ease * 0.18;
      torsoRollZ -= ease * 0.12;
      pelvisY += ease * 0.042;
      headPitchX -= ease * 0.08;
    } else if (elapsed < 0.64) {
      const t = (elapsed - 0.28) / 0.36;
      const slam = Math.sin(t * Math.PI * 0.5);
      rightShoulderX = -2.46 + slam * 3.08; // explosive diagonal cleave through target
      rightElbowX = -1.06 + slam * 0.92;
      rightShoulderZ = -0.36 + slam * 0.54;
      rightWristX = -0.38 + slam * 0.82; // snap wrist forward into the chop
      leftShoulderX = -0.56 * (1 - slam) + 0.28 * slam;
      leftElbowX = -0.58 * (1 - slam) - 0.22 * slam;
      torsoTwistY = -0.56 + slam * 1.12;
      torsoPitchX += -0.18 + slam * 0.44;
      torsoRollZ += -0.12 + slam * 0.24;
      pelvisY -= slam * 0.078;
      headPitchX += slam * 0.12;
      slashAlpha = Math.sin(t * Math.PI);
      slashSweep = t * 2 - 1;
    } else {
      const t = (elapsed - 0.64) / 0.36;
      const recover = 1 - (1 - t) * (1 - t);
      rightShoulderX = 0.62 * (1 - recover) + rightShoulderX * recover;
      rightElbowX = -0.14 * (1 - recover) + rightElbowX * recover;
      rightShoulderZ = 0.18 * (1 - recover) + rightShoulderZ * recover;
      rightWristX = 0.44 * (1 - recover) + rightWristX * recover;
      torsoTwistY = 0.56 * (1 - recover) + torsoTwistY * recover;
      torsoPitchX = (torsoPitchX + 0.26) * (1 - recover) + torsoPitchX * recover;
      pelvisY -= 0.078 * (1 - recover);
      slashAlpha = Math.max(0, (1 - t * 2.4) * 0.38);
      slashSweep = 1;
    }
  }

  const landingAbsorb = clamp(input.landingBounce ?? 0, 0, 1);
  if (input.isAirborne) {
    const vy = input.verticalVelocity ?? 0;
    const rise = clamp(vy / 7.0, -1, 1);
    const tuck = clamp(1 - Math.abs(rise) * 0.45, 0.35, 1.0);
    // Athletic mid-air leap tuck & brace
    const airLeftHip = -0.34 - rise * 0.14;
    const airRightHip = 0.22 - rise * 0.1;
    const airLeftKnee = 0.58 * tuck;
    const airRightKnee = 0.34 * tuck;
    pelvisY = 0.04;
    torsoPitchX += 0.12 - rise * 0.08;
    if (p <= 0 && input.activeTool !== 'bow') {
      leftShoulderX = -0.55 - rise * 0.35;
      leftShoulderZ = 0.28 + rise * 0.12;
      leftElbowX = -0.55;
      rightShoulderX = -0.45 - rise * 0.3;
      rightShoulderZ = -0.26 - rise * 0.12;
      rightElbowX = -0.52;
    }
    return {
      leftHipX: airLeftHip,
      leftKneeX: airLeftKnee,
      rightHipX: airRightHip,
      rightKneeX: airRightKnee,
      leftShoulderX,
      leftElbowX,
      leftShoulderZ,
      leftWristX,
      rightShoulderX,
      rightElbowX,
      rightShoulderZ,
      rightWristX,
      torsoPitchX,
      torsoTwistY,
      torsoRollZ,
      pelvisY,
      headPitchX,
      bowStringPull,
      bowLimbBend,
      nockedArrowVisible,
      slashAlpha,
      slashSweep,
    };
  }

  return {
    leftHipX: leftHipX - landingAbsorb * 0.22,
    leftKneeX: clamp(leftKneeX + landingAbsorb * 0.52, 0, 1.38),
    rightHipX: rightHipX - landingAbsorb * 0.2,
    rightKneeX: clamp(rightKneeX + landingAbsorb * 0.48, 0, 1.38),
    leftShoulderX,
    leftElbowX,
    leftShoulderZ,
    leftWristX,
    rightShoulderX,
    rightElbowX,
    rightShoulderZ,
    rightWristX,
    torsoPitchX: torsoPitchX + landingAbsorb * 0.16,
    torsoTwistY,
    torsoRollZ,
    pelvisY: pelvisY - landingAbsorb * 0.13,
    headPitchX,
    bowStringPull,
    bowLimbBend,
    nockedArrowVisible,
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
 * Computes species-authentic quadruped & avian locomotion with anatomical knee/hock flexion,
 * shoulder/haunch weight transfer (spineRollZ), snow owl wing-flapping glide, rabbit bounding,
 * cervid/musk-ox grazing dips, predator windup crouches, and ambient idles.
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

  if (kind === 'snow_owl') {
    // Avian swooping & wing-flapping kinematics:
    // Front pair [0, 1] drive left/right primary wings; Hind pair [2, 3] drive talons
    const flapFreq = walkPhase * 1.35 + ambientPhase * 1.4;
    const flapWave = Math.sin(flapFreq);
    const flapLift = Math.cos(flapFreq);
    const wingAmp = 0.25 + strideNorm * 0.55;
    bodyY = 0.32 + strideNorm * 0.28 + flapLift * 0.09 * (0.4 + strideNorm * 0.6);
    spinePitchX = strideNorm * 0.18 + flapWave * 0.05;
    spineRollZ = Math.sin(ambientPhase * 0.9) * 0.06 * strideNorm;
    headPitchX = -spinePitchX * 0.75 + Math.sin(ambientPhase * 1.2) * 0.04;
    headYawY =
      state === 'curious' || state === 'alert'
        ? Math.sin(time * 2.4 + animalId) * 0.42
        : Math.sin(ambientPhase * 0.7) * 0.18;
    legUpperX = [
      flapWave * wingAmp,
      flapWave * wingAmp,
      -0.35 * strideNorm,
      -0.35 * strideNorm,
    ];
    legLowerX = [
      Math.max(0, -flapWave) * 0.45,
      Math.max(0, -flapWave) * 0.45,
      0.42 * strideNorm,
      0.42 * strideNorm,
    ];
    tailPitchX = -0.12 + flapLift * 0.14;
    tailYawY = Math.sin(ambientPhase) * 0.08;
    earPitchX = state === 'alert' ? 0.24 : 0.08;
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

  if (state === 'windup') {
    const coil = 0.5 + 0.5 * Math.sin(time * 20 + animalId);
    const isCat = kind === 'lynx' || kind === 'sabertooth' || kind === 'wolverine';
    const isMassive = kind === 'mammoth' || kind === 'polar_bear' || kind === 'frost_boar';
    bodyY = isMassive ? -0.07 : isCat ? -0.21 : -0.17;
    spinePitchX = kind === 'mammoth' ? 0.14 : kind === 'frost_boar' ? 0.26 : isCat ? 0.28 : 0.22;
    spineRollZ = Math.sin(time * 24 + animalId) * 0.045;
    headPitchX = kind === 'mammoth' || kind === 'frost_boar' ? -0.32 : 0.3;
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
    const isMassive = kind === 'mammoth' || kind === 'polar_bear' || kind === 'frost_boar';
    const pouncePulse = Math.sin(time * 24 + animalId) * 0.06;
    bodyY = isMassive ? 0.11 + pouncePulse : 0.24 + pouncePulse;
    spinePitchX = isMassive ? -0.12 : -0.24;
    spineRollZ = Math.sin(time * 18) * 0.04;
    headPitchX = kind === 'frost_boar' ? 0.32 : 0.18;
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
            : kind === 'frost_boar'
              ? 0.56
              : kind === 'wolverine'
                ? 0.68
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
        : kind === 'polar_bear' || kind === 'frost_boar'
          ? 0.064
          : kind === 'wolverine'
            ? 0.092
            : 0.082;
    bodyY = Math.abs(Math.sin(walkPhase)) * bounceAmp * strideNorm + breath;
    spinePitchX =
      state === 'curious'
        ? 0.08
        : Math.cos(walkPhase * (1 + gallopBlend)) *
          (kind === 'wolverine' ? 0.11 : 0.075) *
          moveBlend;
    spineRollZ = Math.cos(walkPhase) * (kind === 'frost_boar' ? 0.062 : 0.048) * strideNorm;

    const isGrazer =
      kind === 'stag' ||
      kind === 'frost_stag' ||
      kind === 'musk_ox';
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
        Math.sin(ambientPhase * 0.7) * 0.028 +
        (kind === 'frost_boar' ? 0.1 : 0);
      earPitchX =
        Math.cos(walkPhase * 2) * 0.065 * strideNorm +
        Math.sin(ambientPhase * 1.9) * 0.05;
    }

    tailYawY = Math.sin(walkPhase + animalId) * (0.26 * strideNorm + 0.1);
    tailPitchX = -0.08 + Math.cos(walkPhase * 2) * 0.095 * strideNorm;
    if (kind === 'mammoth' || kind === 'frost_boar') {
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

const TWO_PI = Math.PI * 2;

export function normalizeCameraYaw(yaw: number): number {
  let next = yaw % TWO_PI;
  if (next < 0) next += TWO_PI;
  return next;
}

/**
 * Returns the camera orbit yaw positioned directly behind a character facing `playerYaw`
 * (+Z local forward -> behind is playerYaw + PI).
 */
export function getBehindPlayerCameraYaw(playerYaw: number): number {
  return normalizeCameraYaw(playerYaw + Math.PI);
}

/**
 * Advances continuous 360-degree camera orbit yaw cleanly in [0, 2π).
 */
export function stepCameraOrbitYaw(
  currentYaw: number,
  autoRotate: boolean,
  angularSpeedRadPerSec: number,
  dt: number,
): number {
  return autoRotate
    ? normalizeCameraYaw(currentYaw + angularSpeedRadPerSec * Math.max(0, dt))
    : normalizeCameraYaw(currentYaw);
}

/**
 * Third-person chase yaw steering: stays 100% stationary when idle or moving
 * straight forward/back, and gently swings behind lateral turning input so pure-keyboard
 * players can navigate smoothly around the world without automatic camera spinning.
 */
export function stepThirdPersonChaseYaw(
  currentYaw: number,
  steerInputX: number,
  forwardInputZ: number,
  turnRateRadPerSec: number,
  dt: number,
): number {
  if (Math.abs(steerInputX) <= 0.12 || forwardInputZ > 0.1) {
    return normalizeCameraYaw(currentYaw);
  }
  return normalizeCameraYaw(
    currentYaw - steerInputX * turnRateRadPerSec * Math.max(0, dt),
  );
}

export interface ThirdPersonCameraInput {
  targetX: number;
  targetY: number;
  targetZ: number;
  yaw: number;
  pitch: number;
  distance: number;
  shoulderOffset?: number;
  shoulderHeight?: number;
  lookAhead?: number;
  minPitch?: number;
  maxPitch?: number;
}

export interface ThirdPersonCameraPose {
  camX: number;
  camY: number;
  camZ: number;
  lookX: number;
  lookY: number;
  lookZ: number;
}

/**
 * Computes a third-person chase / over-the-shoulder camera transform behind the character
 * at `(targetX, targetY, targetZ)` looking ahead along the camera forward direction.
 */
export function computeThirdPersonCameraPose(
  input: ThirdPersonCameraInput,
): ThirdPersonCameraPose {
  const minPitch = input.minPitch ?? 0.12;
  const maxPitch = input.maxPitch ?? 0.92;
  const pitch = clamp(input.pitch, minPitch, maxPitch);
  const distance = clamp(input.distance, 3.8, 16.0);
  const shoulderOffset = input.shoulderOffset ?? 0.55;
  const shoulderHeight = input.shoulderHeight ?? 1.55;
  const lookAhead = input.lookAhead ?? 2.4;

  const sinY = Math.sin(input.yaw);
  const cosY = Math.cos(input.yaw);
  const horizDist = Math.cos(pitch) * distance;
  const vertOffset = Math.sin(pitch) * distance;

  // Camera sits behind (+sinY, +cosY) and slightly to character's right (+cosY, -sinY)
  const rightX = cosY * shoulderOffset;
  const rightZ = -sinY * shoulderOffset;

  const camX = input.targetX + sinY * horizDist + rightX;
  const camY = input.targetY + shoulderHeight + vertOffset;
  const camZ = input.targetZ + cosY * horizDist + rightZ;

  // Look slightly ahead of the hero's shoulder line toward the horizon/trail
  const lookX = input.targetX - sinY * lookAhead + rightX * 0.72;
  const lookY = input.targetY + shoulderHeight * 0.92;
  const lookZ = input.targetZ - cosY * lookAhead + rightZ * 0.72;

  return { camX, camY, camZ, lookX, lookY, lookZ };
}

/**
 * Rotates screen-space planar movement (rawX right, rawZ backward/+Z when yaw=0)
 * into world XZ space for any 360-degree camera orbit angle.
 */
export function transformCameraRelativeInput(
  rawX: number,
  rawZ: number,
  cameraYaw: number,
): { x: number; z: number } {
  const cosY = Math.cos(cameraYaw);
  const sinY = Math.sin(cameraYaw);
  return {
    x: rawX * cosY + rawZ * sinY,
    z: -rawX * sinY + rawZ * cosY,
  };
}

export interface ThirdPersonCameraDynamicsInput {
  baseFov: number;
  speed: number;
  maxSpeed: number;
  walkPhase: number;
  isAiming: boolean;
  isAirborne: boolean;
  isSwimming: boolean;
  landingBounce: number;
  trauma: number;
}

export interface ThirdPersonCameraDynamicsOutput {
  targetFov: number;
  strideBobY: number;
  strideSwayX: number;
  shakeAmplitude: number;
  traumaRollAmp: number;
}

/**
 * Computes AAA action-camera motion polish: sprint FOV dilation, bow aim tightening,
 * subtle locomotion stride breathing, and quadratic trauma camera shake + roll.
 */
export function computeThirdPersonCameraDynamics(
  input: ThirdPersonCameraDynamicsInput,
): ThirdPersonCameraDynamicsOutput {
  const speedRatio = clamp(input.speed / Math.max(0.1, input.maxSpeed), 0, 1.3);
  const sprintFov = clamp((speedRatio - 0.55) * 6.5, 0, 4.8);
  const aimFovShift = input.isAiming ? -4.2 : 0;
  const targetFov = clamp(input.baseFov + sprintFov + aimFovShift, 44, 62);

  const bobWeight =
    !input.isAirborne && !input.isSwimming ? clamp(speedRatio, 0, 1) : 0;
  const strideBobY =
    Math.sin(input.walkPhase * 2) * 0.036 * bobWeight -
    clamp(input.landingBounce, 0, 1) * 0.095;
  const strideSwayX = Math.cos(input.walkPhase) * 0.022 * bobWeight;

  const t = clamp(input.trauma, 0, 1);
  const shakeAmplitude = t * t * 0.55;
  const traumaRollAmp = t * t * 0.032;

  return {
    targetFov,
    strideBobY,
    strideSwayX,
    shakeAmplitude,
    traumaRollAmp,
  };
}



