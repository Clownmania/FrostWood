import test from 'node:test';
import assert from 'node:assert/strict';
import {
  angleDiff,
  computeBipedGait,
  computeQuadrupedGait,
  computeTouchpadVector,
  dampAngle,
  stepPlanarVelocity,
} from './kinematics';

test('dampAngle wraps cleanly across +/-PI boundary via shortest arc', () => {
  const from = Math.PI - 0.1;
  const to = -Math.PI + 0.1;
  const diff = angleDiff(from, to);
  assert.ok(Math.abs(diff - 0.2) < 1e-6);

  const next = dampAngle(from, to, 12, 0.05);
  assert.ok(Math.abs(angleDiff(next, to)) < Math.abs(diff));
  assert.ok(next > from);
});

test('stepPlanarVelocity smoothly accelerates and decelerates to rest', () => {
  let vx = 0;
  let vz = 0;
  for (let i = 0; i < 12; i++) {
    const res = stepPlanarVelocity({
      vx,
      vz,
      inputX: 1,
      inputZ: 0,
      maxSpeed: 8.4,
      accelRate: 22,
      decelRate: 18,
      dt: 0.016,
    });
    vx = res.vx;
    vz = res.vz;
  }
  assert.ok(vx > 7.5 && vx <= 8.4);
  assert.equal(vz, 0);

  // Release keys -> smooth glide down toward 0
  const coast = stepPlanarVelocity({
    vx,
    vz,
    inputX: 0,
    inputZ: 0,
    maxSpeed: 8.4,
    accelRate: 22,
    decelRate: 18,
    dt: 0.032,
  });
  assert.ok(coast.speed > 0 && coast.speed < vx);
});

test('computeBipedGait produces knee flexion, creep crouch, and axe cleave phases', () => {
  const sprintPose = computeBipedGait({
    walkPhase: Math.PI * 0.5,
    speed: 8.4,
    maxSpeed: 8.4,
    isCreeping: false,
    idleTime: 0,
    swingProgress: 0,
    activeTool: 'axe',
    turnBank: 0.08,
  });

  const creepPose = computeBipedGait({
    walkPhase: Math.PI * 0.5,
    speed: 4.2,
    maxSpeed: 4.2,
    isCreeping: true,
    idleTime: 0,
    swingProgress: 0,
    activeTool: 'axe',
    turnBank: 0,
  });

  assert.ok(sprintPose.rightKneeX > 0.2, 'backswing knee should flex naturally');
  assert.ok(creepPose.pelvisY < sprintPose.pelvisY, 'creep lowers center of gravity');
  assert.ok(creepPose.torsoPitchX > sprintPose.torsoPitchX, 'creep leans forward');

  const windup = computeBipedGait({
    walkPhase: 0,
    speed: 0,
    maxSpeed: 8.4,
    isCreeping: false,
    idleTime: 0,
    swingProgress: 0.75,
    activeTool: 'axe',
    turnBank: 0,
  });
  const cleave = computeBipedGait({
    walkPhase: 0,
    speed: 0,
    maxSpeed: 8.4,
    isCreeping: false,
    idleTime: 0,
    swingProgress: 0.55,
    activeTool: 'axe',
    turnBank: 0,
  });
  assert.ok(windup.rightShoulderX < -1.2, 'windup raises axe overhead');
  assert.ok(cleave.rightShoulderX > windup.rightShoulderX, 'cleave drives arm forward');
  assert.ok(cleave.slashAlpha > 0.8, 'cleave displays glowing slash arc');
  assert.equal(windup.slashAlpha, 0, 'windup hides slash arc before strike');

  const bowDraw = computeBipedGait({
    walkPhase: 0,
    speed: 0,
    maxSpeed: 8.4,
    isCreeping: false,
    idleTime: 0,
    swingProgress: 0.85,
    activeTool: 'bow',
    turnBank: 0,
    isAiming: true,
  });
  const bowSnap = computeBipedGait({
    walkPhase: 0,
    speed: 0,
    maxSpeed: 8.4,
    isCreeping: false,
    idleTime: 0,
    swingProgress: 0.25,
    activeTool: 'bow',
    turnBank: 0,
  });
  assert.ok(bowDraw.bowStringPull > 0.65, 'bow draw pulls string taut back');
  assert.ok(Math.abs(bowSnap.bowStringPull) < 0.2, 'bow release snaps string forward');
});

test('computeQuadrupedGait models hare bounding hops, wolf windup crouch, and mammoth trunk swing', () => {
  const hareHop = computeQuadrupedGait({
    kind: 'hare',
    state: 'flee',
    walkPhase: Math.PI * 0.5,
    speed: 7.4,
    maxWanderSpeed: 1.9,
    time: 2,
    animalId: 1,
  });
  assert.ok(hareHop.bodyY > 0.15);
  assert.equal(hareHop.legUpperX[0], hareHop.legUpperX[1]);
  assert.equal(hareHop.legUpperX[2], hareHop.legUpperX[3]);

  const wolfWindup = computeQuadrupedGait({
    kind: 'wolf',
    state: 'windup',
    walkPhase: 0,
    speed: 0,
    maxWanderSpeed: 2.8,
    time: 4,
    animalId: 2,
  });
  assert.ok(wolfWindup.bodyY < 0, 'predator crouches during windup');
  assert.ok(wolfWindup.legLowerX[0] > 0.3, 'front knees bend in crouch');

  const mammothWalk = computeQuadrupedGait({
    kind: 'mammoth',
    state: 'wander',
    walkPhase: 1.2,
    speed: 1.55,
    maxWanderSpeed: 1.55,
    time: 3,
    animalId: 3,
  });
  assert.ok(Math.abs(mammothWalk.trunkPitchX) > 0.01);
  assert.ok(mammothWalk.legLowerX.some((v) => Math.abs(v) > 0.01));

  const saberLunge = computeQuadrupedGait({
    kind: 'sabertooth',
    state: 'lunge',
    walkPhase: 0.6,
    speed: 17.4,
    maxWanderSpeed: 2.85,
    time: 5,
    animalId: 4,
  });
  const oxWalk = computeQuadrupedGait({
    kind: 'musk_ox',
    state: 'wander',
    walkPhase: 1.0,
    speed: 1.75,
    maxWanderSpeed: 1.75,
    time: 5,
    animalId: 5,
  });
  const fenrirWindup = computeQuadrupedGait({
    kind: 'aurora_fenrir',
    state: 'windup',
    walkPhase: 0,
    speed: 0,
    maxWanderSpeed: 3.0,
    time: 6,
    animalId: 6,
  });
  assert.ok(saberLunge.bodyY > 0.1, 'sabertooth leaps in lunge');
  assert.ok(oxWalk.legLowerX.some((v) => Math.abs(v) > 0.01));
  assert.ok(fenrirWindup.bodyY < 0, 'aurora_fenrir crouches in windup');
});

test('computeTouchpadVector applies deadzone, clamps puck radius, and outputs 360-degree analog vectors', () => {
  const dead = computeTouchpadVector(2, -1, 44, 0.12);
  assert.equal(dead.magnitude, 0);
  assert.equal(dead.dx, 0);
  assert.equal(dead.dz, 0);

  // Half-tilt enters stalking zone
  const stalk = computeTouchpadVector(0, -18, 44, 0.12);
  assert.ok(stalk.magnitude > 0.2 && stalk.magnitude <= 0.55);
  assert.equal(stalk.isStalking, true);
  assert.ok(stalk.dz < 0);

  // Full diagonal drag outside boundary clamps puck to maxRadius and normalizes vector to length 1
  const fullDiag = computeTouchpadVector(60, -60, 44, 0.12);
  assert.ok(Math.abs(fullDiag.magnitude - 1) < 1e-6);
  assert.equal(fullDiag.isStalking, false);
  assert.ok(Math.abs(Math.hypot(fullDiag.knobX, fullDiag.knobY) - 44) < 1e-5);
  assert.ok(Math.abs(Math.hypot(fullDiag.dx, fullDiag.dz) - 1) < 1e-5);
});

