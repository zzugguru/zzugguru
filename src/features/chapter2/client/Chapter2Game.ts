import { Game } from './Game';
import { InputState } from './input';
import { Sequence } from './Sequence';
import { ToyInteractionScene } from './toyInteractionScene';
import { DialogueScene } from './dialogueScene';
import { FamilyPhotoScene } from './familyPhotoScene';
import { createWindowScene } from './windowScene';
import { createCctvRoomScene } from './cctvRoomScene';
import { CctvConsoleScene } from './cctvConsoleScene';
import { createEncounterScene } from './encounterScene';
import { createEarthMemoryScene } from './earthMemoryScene';
import { MemorySequenceScene } from './memorySequenceScene';
import { MemoryPreservationScene } from './memoryPreservationScene';
import { createDutyLogScene } from './dutyLogScene';
import { DutyLogReadingScene } from './dutyLogReadingScene';

export class Chapter2Game {
  private readonly input = new InputState();
  private readonly bounds: { width: number; height: number };
  private readonly sequence: Sequence;
  private readonly game: Game;
  private lastTimestamp: number | null = null;
  private completionNotified = false;

  constructor(canvas: HTMLCanvasElement, private readonly onComplete: () => void = () => undefined) {
    this.bounds = { width: canvas.width, height: canvas.height };

    this.sequence = new Sequence([
      () => createCctvRoomScene(),
      () => new CctvConsoleScene(),
      () => createEncounterScene(),
      () =>
        new DialogueScene([
          { speaker: '', text: '형광등이 희미하게 깜빡인다.' },
          { speaker: '', text: '천장 너머에서 낮고 무거운 진동음이 들려온다.' },
          { speaker: '영수', text: '당신이야?' },
          { speaker: '', text: '여자는 대답하지 않는다.' },
          { speaker: '', text: '모든 CCTV 화면이 하얗게 변한다.' },
          { speaker: '', text: '경비실의 모든 불이 꺼졌다.' },
        ]),
      () => new ToyInteractionScene(),
      () => new DialogueScene([{ speaker: '낯선 존재', text: '이온.' }]),
      () =>
        new MemorySequenceScene([
          '번쩍 들어 올려지던 순간, 커다랗고 따뜻한 손의 감촉.',
          '누나가 장난을 치듯 장난감을 채가더니 웃으며 도망친다.',
          '멀어지는 문 틈으로 보이던, 눈물 맺힌 채 뻗어오던 손.',
        ]),
      () =>
        new DialogueScene([
          { speaker: '영수', text: '그 이름이…… 왜 익숙하지?' },
          { speaker: '낯선 존재', text: '우리가 너를 잃어버렸다.' },
        ]),
      () => new FamilyPhotoScene(),
      () => createEarthMemoryScene(),
      () => new MemoryPreservationScene(),
      () => createWindowScene(),
      () =>
        new DialogueScene([
          { speaker: '', text: '영수는 우주선 창밖으로 지구를 바라본다.' },
          { speaker: '', text: '한동안 푸른 지구를 바라보다가 고개를 끄덕인다.' },
          { speaker: '영수', text: '나는 김영수일까, 이온일까. 아니면 둘 다일까.' },
          { speaker: '외계 누나', text: '네가 품고 있는 기억 전부가 바로 너 자신이야.' },
          { speaker: '영수', text: '그럼 가자.' },
          { speaker: '외계 누나', text: '집으로?' },
          { speaker: '영수', text: '일단 가족들이 있는 곳으로.' },
        ]),
      () => createDutyLogScene(),
      () => new DutyLogReadingScene(),
    ]);

    this.game = new Game(canvas, (context, canvasEl) => {
      const now = performance.now();
      const deltaSeconds = this.lastTimestamp === null ? 0 : (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;

      this.sequence.update(this.input, deltaSeconds, this.bounds);
      this.sequence.render(context, canvasEl);
      this.input.clearFrame();
      if (this.sequence.isComplete() && !this.completionNotified) {
        this.completionNotified = true;
        this.stop();
        this.onComplete();
      }
    });
  }

  mount(): void {
    this.game.start();
  }

  stop(): void {
    this.game.stop();
    this.input.dispose();
  }
}
