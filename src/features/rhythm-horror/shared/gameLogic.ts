export const BPM = 120;
export const BEAT_MS = 60_000 / BPM;
export const LEAD_IN_BEATS = 4;
export const DURATION_BEATS = 120;
export const STAGE_DURATION_MS = 60_000;
export const EXIT_X = 1_790;
export const STAGE_WIDTH = 1_920;

export type RhythmPhase = 'light' | 'dark';
export type MonsterMode = 'idle' | 'patrol' | 'investigate' | 'chase';
export type StageResult = 'playing' | 'escaped' | 'dead';

export interface BeatNote {
  id: number;
  timeMs: number;
  beatInBar: 1 | 2 | 3 | 4;
  phase: RhythmPhase;
  hidden: boolean;
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  crouch: boolean;
  run: boolean;
  interact: boolean;
}

export interface StageState {
  playerX: number;
  monsterX: number;
  monsterMode: MonsterMode;
  monsterTargetX: number;
  checkpointX: number;
  hearts: number;
  tension: number;
  lastNoiseX: number | null;
  noiseUntilMs: number;
  invulnerableUntilMs: number;
  lastObstacle: number | null;
  lastPhase: RhythmPhase;
  wasMoving: boolean;
  result: StageResult;
  feedback: string;
  feedbackUntilMs: number;
}

export const QUIET_ZONES = [70, 670, 1_250] as const;
export const NOISE_OBSTACLES = [470, 1_030, 1_470] as const;
export const COVER_ZONES = [520, 1_080, 1_520] as const;

export function phaseForBeat(beatInBar: number): RhythmPhase {
  return beatInBar === 1 || beatInBar === 2 ? 'light' : 'dark';
}

export function isHiddenBeat(id: number): boolean {
  if (id < 60) return false;
  if (id < 96) return id % 8 === 5;
  return id % 8 === 1 || id % 8 === 5;
}

export function buildBeatChart(): BeatNote[] {
  return Array.from({ length: DURATION_BEATS }, (_, id) => {
    const beatInBar = ((id % 4) + 1) as 1 | 2 | 3 | 4;
    return {
      id,
      timeMs: (id + LEAD_IN_BEATS) * BEAT_MS,
      beatInBar,
      phase: phaseForBeat(beatInBar),
      hidden: isHiddenBeat(id),
    };
  });
}

export function beatAt(timeMs: number): BeatNote {
  const id = Math.max(0, Math.floor(timeMs / BEAT_MS) - LEAD_IN_BEATS);
  const beatInBar = ((id % 4) + 1) as 1 | 2 | 3 | 4;
  return {
    id,
    timeMs: (id + LEAD_IN_BEATS) * BEAT_MS,
    beatInBar,
    phase: phaseForBeat(beatInBar),
    hidden: isHiddenBeat(id),
  };
}

export function createStageState(checkpointX: number = QUIET_ZONES[0]): StageState {
  return {
    playerX: checkpointX,
    monsterX: checkpointX - 420,
    monsterMode: 'idle',
    monsterTargetX: checkpointX,
    checkpointX,
    hearts: 3,
    tension: 10,
    lastNoiseX: null,
    noiseUntilMs: 0,
    invulnerableUntilMs: 0,
    lastObstacle: null,
    lastPhase: 'light',
    wasMoving: false,
    result: 'playing',
    feedback: '불이 꺼질 때 움직이세요',
    feedbackUntilMs: 4_000,
  };
}

function near(value: number, target: number, radius: number): boolean {
  return Math.abs(value - target) <= radius;
}

function moveToward(value: number, target: number, amount: number): number {
  if (value < target) return Math.min(target, value + amount);
  return Math.max(target, value - amount);
}

function makeNoise(state: StageState, timeMs: number, message: string, severe = false): StageState {
  const hearts = Math.max(0, state.hearts - (severe && timeMs >= state.invulnerableUntilMs ? 1 : 0));
  return {
    ...state,
    hearts,
    tension: Math.min(100, state.tension + (severe ? 24 : 14)),
    lastNoiseX: state.playerX,
    noiseUntilMs: timeMs + 2_500,
    invulnerableUntilMs: severe ? timeMs + 1_000 : state.invulnerableUntilMs,
    monsterMode: hearts <= 1 ? 'chase' : 'investigate',
    monsterTargetX: state.playerX,
    feedback: message,
    feedbackUntilMs: timeMs + 1_500,
  };
}

export function isInCover(playerX: number): boolean {
  return COVER_ZONES.some((coverX) => near(playerX, coverX, 48));
}

export function stepStage(
  current: StageState,
  input: PlayerInput,
  timeMs: number,
  deltaMs: number,
): StageState {
  if (current.result !== 'playing') return current;

  const beat = beatAt(timeMs);
  const direction = Number(input.right) - Number(input.left);
  const wantsToMove = direction !== 0;
  const crossedIntoLight = current.lastPhase === 'dark' && beat.phase === 'light';
  const finalChase = timeMs >= 50_000;
  let state = { ...current, lastPhase: beat.phase, wasMoving: wantsToMove };

  if (timeMs >= STAGE_DURATION_MS) {
    return { ...state, result: 'dead', feedback: '비상문이 봉쇄되었습니다', feedbackUntilMs: Number.POSITIVE_INFINITY };
  }

  if (beat.phase === 'light' && wantsToMove && !(finalChase && input.run) && (!current.wasMoving || crossedIntoLight)) {
    state = makeNoise(state, timeMs, '빛이 켜졌다 — 움직임이 발각됐다', true);
    if (state.hearts <= 0) {
      return { ...state, result: 'dead', feedback: '세 번째 소음이 놈을 불러냈다', feedbackUntilMs: Number.POSITIVE_INFINITY };
    }
  }

  if ((beat.phase === 'dark' || (finalChase && input.run)) && wantsToMove) {
    const running = input.run && (state.monsterMode === 'chase' || finalChase);
    const speed = input.crouch ? 35 : running ? 225 : 50;
    const previousX = state.playerX;
    state.playerX = Math.max(30, Math.min(EXIT_X, state.playerX + direction * speed * (deltaMs / 1_000)));
    state.tension = Math.min(100, state.tension + (running ? 8 : 2) * (deltaMs / 1_000));

    const hitObstacle = NOISE_OBSTACLES.find((obstacleX) =>
      state.lastObstacle !== obstacleX
      && Math.min(previousX, state.playerX) <= obstacleX
      && Math.max(previousX, state.playerX) >= obstacleX,
    );
    if (hitObstacle !== undefined && !input.crouch) {
      state = makeNoise({ ...state, lastObstacle: hitObstacle }, timeMs, '철제 물체가 쓰러졌다 — 소음 발생');
    }
  }

  const reachedCheckpoint = [...QUIET_ZONES].reverse().find((checkpoint) => state.playerX >= checkpoint);
  if (reachedCheckpoint !== undefined && reachedCheckpoint > state.checkpointX) {
    state.checkpointX = reachedCheckpoint;
    state.monsterMode = 'idle';
    state.monsterX = reachedCheckpoint - 360;
    state.lastNoiseX = null;
    state.feedback = '안전 구역 확보';
    state.feedbackUntilMs = timeMs + 1_400;
  }

  const distance = Math.abs(state.monsterX - state.playerX);
  const hidden = input.crouch && isInCover(state.playerX);
  if (!finalChase && state.monsterMode === 'chase' && hidden) {
    state.monsterMode = 'patrol';
    state.feedback = '시야에서 벗어났다';
    state.feedbackUntilMs = timeMs + 1_000;
  }
  if (finalChase) state.monsterMode = 'chase';
  else if (state.lastNoiseX !== null && timeMs < state.noiseUntilMs && state.monsterMode !== 'chase') {
    state.monsterMode = 'investigate';
    state.monsterTargetX = state.lastNoiseX;
  } else if (beat.phase === 'light' && state.monsterMode !== 'chase') state.monsterMode = 'idle';
  else if (beat.phase === 'dark' && state.monsterMode === 'idle') state.monsterMode = 'patrol';

  if (!hidden && distance < (beat.phase === 'light' ? 100 : 185)) {
    state.monsterMode = 'chase';
    state.feedback = '발각됐다 — 달려!';
    state.feedbackUntilMs = timeMs + 1_200;
  }

  if (state.monsterMode === 'investigate' && beat.phase === 'dark') {
    state.monsterX = moveToward(state.monsterX, state.monsterTargetX, 105 * (deltaMs / 1_000));
  } else if (state.monsterMode === 'patrol') {
    state.monsterX = moveToward(state.monsterX, state.playerX - 130, 68 * (deltaMs / 1_000));
  } else if (state.monsterMode === 'chase') {
    const canBreakLightRule = finalChase;
    if (beat.phase === 'dark' || canBreakLightRule) {
      state.monsterX = moveToward(state.monsterX, state.playerX, (finalChase ? 185 : 155) * (deltaMs / 1_000));
    }
  }

  const newDistance = Math.abs(state.monsterX - state.playerX);
  state.tension = Math.max(0, Math.min(100, state.tension + (newDistance < 320 ? 12 : -5) * (deltaMs / 1_000)));

  if (newDistance < 30 && timeMs >= state.invulnerableUntilMs) {
    const hearts = state.hearts - 1;
    if (hearts <= 0) {
      return { ...state, hearts: 0, result: 'dead', feedback: '어둠이 당신을 붙잡았다', feedbackUntilMs: Number.POSITIVE_INFINITY };
    }
    state = {
      ...state,
      hearts,
      playerX: state.checkpointX,
      monsterX: state.checkpointX - 420,
      monsterMode: 'idle',
      invulnerableUntilMs: timeMs + 1_500,
      feedback: '붙잡혔다 — 안전 구역으로 후퇴',
      feedbackUntilMs: timeMs + 1_800,
    };
  }

  if (input.interact && state.playerX >= EXIT_X - 24 && timeMs < 55_000) {
    return { ...state, feedback: '비상문 전력 복구 중', feedbackUntilMs: timeMs + 1_000 };
  }
  if (input.interact && state.playerX >= EXIT_X - 24) {
    return { ...state, result: 'escaped', feedback: '비상문 개방', feedbackUntilMs: Number.POSITIVE_INFINITY };
  }

  return state;
}
