import { COVER_ZONES, NOISE_OBSTACLES, type MonsterMode, type RhythmPhase } from './gameLogic';

export interface TutorialContext {
  phase: RhythmPhase;
  playerX: number;
  monsterMode: MonsterMode;
  finalChase: boolean;
}

export interface TutorialTip {
  title: string;
  detail: string;
  danger: boolean;
}

function near(value: number, target: number, radius: number): boolean {
  return Math.abs(value - target) <= radius;
}

export function tutorialTipFor({ phase, playerX, monsterMode, finalChase }: TutorialContext): TutorialTip {
  const inCover = COVER_ZONES.some((coverX) => near(playerX, coverX, 48));
  const approachingObstacle = NOISE_OBSTACLES.some(
    (obstacleX) => playerX >= obstacleX - 90 && playerX <= obstacleX + 20,
  );

  if (monsterMode === 'chase' && inCover && !finalChase) {
    return {
      title: '엄폐물 안 · S',
      detail: 'S를 누르면 몸을 낮추고 괴물의 추격을 끊습니다.',
      danger: true,
    };
  }

  if (monsterMode === 'chase') {
    return phase === 'light'
      ? {
          title: '빛 · 모든 이동키 놓기',
          detail: '그대로 멈추세요. 괴물도 빛에서는 움직이지 못합니다.',
          danger: true,
        }
      : {
          title: '추격! · Shift + A/D',
          detail: '어둠일 때 달려서 괴물과 거리를 벌리세요.',
          danger: true,
        };
  }

  if (phase === 'light') {
    return {
      title: '빛 1·2 · 멈춤',
      detail: 'A/D와 Shift를 놓으세요. S는 누를 필요가 없습니다.',
      danger: false,
    };
  }

  if (approachingObstacle) {
    return {
      title: '철제 장애물 · S + A/D',
      detail: '몸을 낮춘 채 이동하면 느리지만 소음 없이 통과합니다.',
      danger: false,
    };
  }

  if (inCover) {
    return {
      title: '엄폐 가능 · S',
      detail: '상자 안에서 몸을 낮추면 추격을 끊을 수 있습니다.',
      danger: false,
    };
  }

  return {
    title: '어둠 3·4 · 이동',
    detail: 'A/D로 다음 엄폐물까지 이동하세요.',
    danger: false,
  };
}
