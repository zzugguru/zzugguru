import { awakeningStage, connectMemory, createMemoryGame, familyAtPoint, MEMORY_CLUES, REQUIRED_BY_FAMILY, type FamilyId, type MemoryGameState } from '../shared/gameLogic';
import { canActivateDevice, canInteract, clearDirections, createFlow, movePlayer, PLAYER_SIZE, transitionFlow, type FlowState, type Point } from '../shared/mapLogic';
import { MEMORY_ROOM_MAP, requirePlayableMap, SPACESHIP_MAP, type PlayableMapAssetEntry } from '../shared/mapAssetManifest';
import { collectNearby, collectionAvailable, createCollection, MEMORY_OBJECTS, nearbyMemoryObject, type CollectionState } from '../shared/collectionLogic';
import { chooseLettingGo, createLettingGo, LETTING_GO_MEMORIES, type LettingGoChoice, type LettingGoState } from '../shared/lettingGoLogic';
import { advanceEpilogue, ARCHIVE_DOOR, ARCHIVE_RECORDS, createEpilogue, enterArchive, JOURNAL_LINES, MONTAGE, moveEpiloguePlayer, nearArchiveDoor, nearbyArchiveRecord, placeArchiveRecord, startEpilogue, type EpilogueState } from '../shared/epilogueLogic';
import { drawMemoryRoomBackground, selectChapter03Background } from './memoryRoomBackground';

type Screen = 'map' | 'playing' | 'awakening' | 'result' | 'letting-go' | 'epilogue';
type Direction = 'up' | 'down' | 'left' | 'right';
type Controls = {
  map: HTMLElement;
  directions: readonly HTMLButtonElement[];
  interact: HTMLButtonElement;
  choices: HTMLElement;
  choiceButtons: readonly HTMLButtonElement[];
  returnButton: HTMLButtonElement;
  retryButton: HTMLButtonElement;
  lettingChoices: HTMLElement;
  lettingButtons: readonly HTMLButtonElement[];
  epilogueNext: HTMLButtonElement;
  liveRegion: HTMLElement;
};
const FAMILY: readonly { id: FamilyId; name: string }[] = [
  { id: 'wife', name: '아내' }, { id: 'son', name: '큰아들' }, { id: 'daughter', name: '작은딸' },
];

export class MemoryReconstructionGame {
  private readonly context: CanvasRenderingContext2D;
  private screen: Screen = 'map';
  private state: MemoryGameState = createMemoryGame();
  private player: Point = { ...SPACESHIP_MAP.spawn };
  private pressed = new Set<Direction>();
  private flow: FlowState = createFlow();
  private collection: CollectionState = createCollection();
  private lettingGo: LettingGoState = createLettingGo();
  private epilogue: EpilogueState = createEpilogue();
  private silenceUntil = 0;
  private awakeningStartedAt = 0;
  private previousTime = performance.now();
  private lastAnnouncement = '';
  private readonly spaceshipImage = new Image();
  private readonly memoryRoomImage = new Image();

  constructor(private readonly canvas: HTMLCanvasElement, private readonly controls: Controls) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context를 만들 수 없습니다.');
    this.context = context;
    requirePlayableMap(SPACESHIP_MAP);
    requirePlayableMap(MEMORY_ROOM_MAP);
    this.spaceshipImage.src = new URL('../assets/chapter03-spaceship-lab.png', import.meta.url).href;
    this.memoryRoomImage.src = new URL('../assets/chapter03-memory-room-v2.png', import.meta.url).href;
  }

  mount(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.clearMovement);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.addEventListener('click', this.onCanvasClick);
    this.controls.directions.forEach((button) => {
      const direction = button.dataset.direction as Direction;
      const start = (event: Event) => { event.preventDefault(); this.pressed.add(direction); };
      const stop = () => this.pressed.delete(direction);
      button.addEventListener('pointerdown', start);
      button.addEventListener('pointerup', stop);
      button.addEventListener('pointercancel', stop);
      button.addEventListener('pointerleave', stop);
    });
    this.controls.interact.addEventListener('click', this.interact);
    this.controls.returnButton.addEventListener('click', this.returnToMap);
    this.controls.retryButton.addEventListener('click', this.retryPuzzle);
    this.controls.lettingButtons.forEach((button) => button.addEventListener('click', () => {
      if (this.screen === 'letting-go') this.chooseLettingGo(button.dataset.choice as LettingGoChoice);
    }));
    this.controls.epilogueNext.addEventListener('click', this.advanceEpilogue);
    this.controls.choiceButtons.forEach((button, index) => button.addEventListener('click', () => {
      if (this.screen === 'playing') this.choose(FAMILY[index].id);
    }));
    requestAnimationFrame(this.loop);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const direction = this.directionFor(event.code);
    if (direction && (this.screen === 'map' || (this.screen === 'epilogue' && ['corridor', 'archive'].includes(this.epilogue.phase)))) {
      event.preventDefault();
      this.pressed.add(direction);
      return;
    }
    if ((event.code === 'Enter' || event.code === 'KeyE') && this.screen === 'map') {
      event.preventDefault(); this.interact(); return;
    }
    if ((event.code === 'Enter' || event.code === 'KeyE') && this.screen === 'epilogue') {
      if (event.repeat) return;
      event.preventDefault();
      if (this.epilogue.phase === 'corridor') this.enterArchive();
      else if (this.epilogue.phase === 'archive') this.placeArchiveRecord();
      else if (this.epilogue.phase !== 'silence') this.advanceEpilogue();
      return;
    }
    const index = ['Digit1', 'Digit2', 'Digit3', 'Numpad1', 'Numpad2', 'Numpad3'].indexOf(event.code);
    if (this.screen === 'playing' && index >= 0 && !event.repeat) {
      event.preventDefault(); this.choose(FAMILY[index % 3].id);
    }
    if (this.screen === 'letting-go' && index >= 0 && !event.repeat) {
      event.preventDefault(); this.chooseLettingGo(['hold', 'record', 'release'][index % 3] as LettingGoChoice);
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const direction = this.directionFor(event.code);
    if (direction) this.pressed.delete(direction);
  };

  private readonly clearMovement = (): void => clearDirections(this.pressed);
  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.clearMovement();
  };

  private directionFor(code: string): Direction | null {
    if (code === 'ArrowUp' || code === 'KeyW') return 'up';
    if (code === 'ArrowDown' || code === 'KeyS') return 'down';
    if (code === 'ArrowLeft' || code === 'KeyA') return 'left';
    if (code === 'ArrowRight' || code === 'KeyD') return 'right';
    return null;
  }

  private readonly interact = (): void => {
    if (this.screen === 'epilogue') {
      if (this.epilogue.phase === 'corridor') this.enterArchive();
      else if (this.epilogue.phase === 'archive') this.placeArchiveRecord();
      return;
    }
    if (this.screen === 'map' && collectionAvailable(this.flow)) {
      const next = collectNearby(this.collection, this.player);
      this.collection = next;
      if (next.completed) {
        this.lettingGo = createLettingGo();
        this.screen = 'letting-go';
        requestAnimationFrame(() => this.controls.lettingButtons[0].focus());
      }
      return;
    }
    const next = transitionFlow(this.flow, { type: 'interact', allowed: canActivateDevice(this.player, this.flow.deviceComplete, this.currentMap()) });
    if (next === this.flow) return;
    this.flow = next;
    this.state = createMemoryGame();
    this.screen = 'playing';
    this.clearMovement();
    requestAnimationFrame(() => this.controls.choiceButtons[0].focus());
  };

  private readonly returnToMap = (): void => {
    if (this.screen !== 'result') return;
    this.flow = transitionFlow(this.flow, { type: 'return-to-map' });
    this.screen = 'map';
    this.player = { ...(this.flow.deviceComplete ? MEMORY_ROOM_MAP.spawn : SPACESHIP_MAP.spawn) };
    requestAnimationFrame(() => this.controls.directions[0].focus());
  };

  private readonly retryPuzzle = (): void => {
    if (this.screen !== 'result' || this.state.status !== 'failure') return;
    this.flow = transitionFlow(this.flow, { type: 'retry' });
    this.state = createMemoryGame();
    this.screen = 'playing';
    requestAnimationFrame(() => this.controls.choiceButtons[0].focus());
  };

  private readonly onCanvasClick = (event: MouseEvent): void => {
    if (this.screen === 'epilogue' && this.epilogue.phase !== 'archive' && this.epilogue.phase !== 'silence') {
      this.advanceEpilogue(); return;
    }
    if (this.screen !== 'playing') return;
    const bounds = this.canvas.getBoundingClientRect();
    const family = familyAtPoint(
      (event.clientX - bounds.left) * (this.canvas.width / bounds.width),
      (event.clientY - bounds.top) * (this.canvas.height / bounds.height),
    );
    if (family) this.choose(family);
  };

  private choose(family: FamilyId): void {
    this.state = connectMemory(this.state, family);
    if (this.state.status === 'success') {
      this.screen = 'awakening';
      this.awakeningStartedAt = performance.now();
    } else if (this.state.status === 'failure') {
      this.flow = transitionFlow(this.flow, { type: 'puzzle-failure' });
      this.screen = 'result';
      requestAnimationFrame(() => this.controls.retryButton.focus());
    }
  }

  private chooseLettingGo(choice: LettingGoChoice): void {
    this.lettingGo = chooseLettingGo(this.lettingGo, choice);
    if (this.lettingGo.completed) {
      this.epilogue = startEpilogue(createEpilogue(), this.lettingGo);
      this.screen = 'epilogue';
      this.silenceUntil = performance.now() + 2_000;
      requestAnimationFrame(() => this.canvas.focus());
    }
  }

  private readonly advanceEpilogue = (): void => {
    if (this.screen !== 'epilogue' || this.epilogue.phase === 'archive' || this.epilogue.phase === 'silence' || this.epilogue.phase === 'complete') return;
    this.epilogue = advanceEpilogue(this.epilogue);
    if (this.epilogue.phase === 'archive') this.player = { x: 80, y: 260 };
    if (this.epilogue.phase === 'complete') requestAnimationFrame(() => this.canvas.focus());
  };

  private placeArchiveRecord(): void {
    this.epilogue = placeArchiveRecord(this.epilogue, this.player);
    if (this.epilogue.phase === 'archive-complete') requestAnimationFrame(() => this.controls.epilogueNext.focus());
  }

  private enterArchive(): void {
    const next = enterArchive(this.epilogue, this.player);
    if (next === this.epilogue) return;
    this.epilogue = next;
    this.player = { x: 80, y: 260 };
  }

  private readonly loop = (time: number): void => {
    const delta = Math.min(32, time - this.previousTime);
    this.previousTime = time;
    if (this.screen === 'map') this.updateMap(delta);
    if (this.screen === 'epilogue' && ['corridor', 'archive'].includes(this.epilogue.phase)) this.updateMap(delta);
    if (this.screen === 'epilogue' && this.epilogue.phase === 'silence' && time >= this.silenceUntil) {
      this.epilogue = advanceEpilogue(this.epilogue);
      this.player = { x: 80, y: 260 };
      requestAnimationFrame(() => this.controls.directions[0].focus());
    }
    if (this.screen === 'awakening' && time - this.awakeningStartedAt >= 3_600) {
      this.flow = transitionFlow(this.flow, { type: 'puzzle-success' });
      this.screen = 'result';
      requestAnimationFrame(() => this.controls.returnButton.focus());
    }
    this.render();
    requestAnimationFrame(this.loop);
  };

  private updateMap(delta: number): void {
    let dx = Number(this.pressed.has('right')) - Number(this.pressed.has('left'));
    let dy = Number(this.pressed.has('down')) - Number(this.pressed.has('up'));
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    this.player = this.screen === 'epilogue'
      ? moveEpiloguePlayer(this.player, dx * delta * 0.18, dy * delta * 0.18)
      : movePlayer(this.player, dx * delta * 0.18, dy * delta * 0.18, this.currentMap());
  }

  private render(): void {
    this.context.fillStyle = '#030712'; this.context.fillRect(0, 0, 960, 540);
    if (this.screen === 'map') this.drawMap();
    else if (this.screen === 'playing') this.drawPuzzle();
    else if (this.screen === 'awakening') this.drawAwakening();
    else if (this.screen === 'letting-go') this.drawLettingGo();
    else if (this.screen === 'epilogue') this.drawEpilogue();
    else this.drawResult();
    this.syncControls();
  }

  private drawMap(): void {
    const ctx = this.context;
    const map = this.currentMap();
    const background = selectChapter03Background(this.flow.deviceComplete, this.spaceshipImage, this.memoryRoomImage);
    if (!drawMemoryRoomBackground(ctx, background)) {
      ctx.fillStyle = '#111827'; ctx.fillRect(map.bounds.x, map.bounds.y, map.bounds.width, map.bounds.height);
      ctx.strokeStyle = '#374151';
      for (let x = map.bounds.x; x <= map.bounds.x + map.bounds.width; x += 48) for (let y = map.bounds.y; y <= map.bounds.y + map.bounds.height; y += 48) ctx.strokeRect(x, y, 48, 48);
      ctx.lineWidth = 8; ctx.strokeStyle = '#312e81'; ctx.strokeRect(map.bounds.x, map.bounds.y, map.bounds.width, map.bounds.height);
      for (const obstacle of map.collisions) {
        if (map.device && obstacle === map.device.bounds) continue;
        ctx.fillStyle = '#1f2937'; ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.strokeStyle = '#374151'; ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      }
    }
    if (map.device) {
      const device = map.device.bounds;
      ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 3; ctx.strokeRect(device.x, device.y, device.width, device.height);
    }
    if (collectionAvailable(this.flow)) this.drawMemoryArea();
    ctx.fillStyle = '#c7d2fe'; ctx.font = '14px system-ui'; ctx.textAlign = 'left'; ctx.fillText('출입 금지 연구 구역 · 영수', 56, 48);
    ctx.fillStyle = '#f9fafb'; ctx.fillRect(this.player.x, this.player.y, PLAYER_SIZE, PLAYER_SIZE);
    ctx.fillStyle = '#312e81'; ctx.fillRect(this.player.x + 5, this.player.y + 5, 6, 6); ctx.fillRect(this.player.x + 16, this.player.y + 5, 6, 6);
    if (canInteract(this.player, map) && !this.flow.deviceComplete) {
      ctx.fillStyle = '#312e81'; ctx.fillRect(300, 448, 360, 42);
      ctx.fillStyle = '#f9fafb'; ctx.textAlign = 'center'; ctx.font = '700 16px system-ui'; ctx.fillText('E 또는 ENTER · 기억 재구성 장치 작동', 480, 475);
    }
  }

  private drawMemoryArea(): void {
    const ctx = this.context;
    const familyNpcs = [
      { name: '아내', ...MEMORY_ROOM_MAP.familyMarkers!.wife },
      { name: '큰아들', ...MEMORY_ROOM_MAP.familyMarkers!.son },
      { name: '작은딸', ...MEMORY_ROOM_MAP.familyMarkers!.daughter },
    ];
    for (const npc of familyNpcs) {
      ctx.fillStyle = '#818cf8'; ctx.fillRect(npc.x, npc.y, 24, 30);
      ctx.fillStyle = '#f9fafb'; ctx.font = '13px system-ui'; ctx.textAlign = 'center'; ctx.fillText(npc.name, npc.x + 12, npc.y - 7);
    }
    for (const item of MEMORY_OBJECTS) {
      if (this.collection.collected.includes(item.id)) continue;
      ctx.fillStyle = '#c7d2fe'; ctx.beginPath(); ctx.arc(item.markerX, item.markerY, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#818cf8'; ctx.strokeRect(item.markerX - 14, item.markerY - 14, 28, 28);
      ctx.fillStyle = '#f9fafb'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(item.name, item.markerX, item.markerY - 21);
    }
    ctx.fillStyle = '#111827'; ctx.fillRect(56, 86, 260, 56);
    ctx.fillStyle = '#f9fafb'; ctx.font = '700 16px system-ui'; ctx.textAlign = 'left';
    ctx.fillText(`추억 정리 ${this.collection.collected.length} / ${MEMORY_OBJECTS.length}`, 72, 112);
    ctx.fillStyle = '#c7d2fe'; ctx.font = '13px system-ui'; ctx.fillText(`남은 물건 ${MEMORY_OBJECTS.length - this.collection.collected.length}개`, 72, 133);
    if (nearbyMemoryObject(this.player, this.collection)) {
      ctx.fillStyle = '#312e81'; ctx.fillRect(300, 448, 360, 42);
      ctx.fillStyle = '#f9fafb'; ctx.textAlign = 'center'; ctx.font = '700 16px system-ui'; ctx.fillText('E 또는 ENTER · 추억 물건 정리', 480, 475);
    }
    if (this.collection.message) {
      ctx.fillStyle = 'rgba(17,24,39,.94)'; ctx.fillRect(150, 488, 660, 48);
      ctx.fillStyle = this.collection.completed ? '#f9fafb' : '#c7d2fe'; ctx.textAlign = 'center'; ctx.font = '14px system-ui';
      const latest = MEMORY_OBJECTS.find((item) => item.id === this.collection.collected.at(-1));
      ctx.fillText(latest ? `${latest.speaker}: ${latest.memory}` : this.collection.message.slice(0, 60), 480, 508);
      if (latest) ctx.fillText(`${latest.gapSpeaker}: ${latest.gap}`.slice(0, 82), 480, 527);
    }
    if (this.collection.completed) {
      ctx.fillStyle = 'rgba(3,7,18,.9)'; ctx.fillRect(210, 160, 540, 210);
      ctx.strokeStyle = '#818cf8'; ctx.strokeRect(210, 160, 540, 210);
      ctx.fillStyle = '#818cf8'; ctx.font = '700 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText('CHAPTER 03 · 중간 기록 완료', 480, 208);
      ctx.fillStyle = '#f9fafb'; ctx.font = '700 25px system-ui'; ctx.fillText('기억의 테두리', 480, 250);
      ctx.fillStyle = '#c7d2fe'; ctx.font = '16px system-ui'; ctx.fillText('가족은 영수가 기억하는 모습과 시간 안에서만 존재했다.', 480, 292);
      ctx.fillText('이제 그들을 붙잡는 일과 다시 보내주는 일이 남아 있다.', 480, 326);
    }
  }

  private drawPuzzle(): void {
    const ctx = this.context; ctx.fillStyle = '#111827'; ctx.fillRect(26, 22, 908, 496);
    ctx.fillStyle = '#818cf8'; ctx.textAlign = 'left'; ctx.font = '700 15px system-ui'; ctx.fillText(`MEMORY ${this.state.clueIndex + 1} / ${MEMORY_CLUES.length}`, 54, 58);
    ctx.textAlign = 'right'; ctx.fillStyle = this.state.stability === 1 ? '#fb7185' : '#c7d2fe'; ctx.fillText(`장치 안정성 ${'●'.repeat(this.state.stability)}${'○'.repeat(3 - this.state.stability)}`, 906, 58);
    ctx.textAlign = 'center'; ctx.fillStyle = '#f9fafb'; ctx.font = '700 27px system-ui'; ctx.fillText(`“${MEMORY_CLUES[this.state.clueIndex].label}”`, 480, 130);
    ctx.fillStyle = '#c7d2fe'; ctx.font = '16px system-ui'; ctx.fillText('이 기억은 누구의 것입니까?', 480, 168);
    FAMILY.forEach((family, index) => {
      const x = 54 + index * 294; const complete = this.state.completed[family.id] === REQUIRED_BY_FAMILY[family.id];
      ctx.fillStyle = complete ? '#312e81' : '#111827'; ctx.fillRect(x, 265, 264, 190); ctx.strokeStyle = complete ? '#818cf8' : '#374151'; ctx.strokeRect(x, 265, 264, 190);
      ctx.fillStyle = '#f9fafb'; ctx.font = '700 25px system-ui'; ctx.fillText(family.name, x + 132, 348);
      ctx.fillStyle = '#c7d2fe'; ctx.font = '16px system-ui'; ctx.fillText(`${this.state.completed[family.id]} / ${REQUIRED_BY_FAMILY[family.id]} 기억 연결`, x + 132, 386);
    });
    ctx.fillStyle = this.state.feedback.includes('일치하지') ? '#fb7185' : '#c7d2fe'; ctx.fillText(this.state.feedback, 480, 492);
  }

  private drawAwakening(): void {
    const stage = awakeningStage(performance.now() - this.awakeningStartedAt); const ctx = this.context;
    ctx.fillStyle = '#111827'; ctx.fillRect(26, 22, 908, 496); ctx.textAlign = 'center'; ctx.fillStyle = '#f9fafb'; ctx.font = '700 30px system-ui'; ctx.fillText('생체 용기 개방 중', 480, 126);
    FAMILY.forEach((family, index) => { const x = 54 + index * 294; const open = stage > index; ctx.fillStyle = open ? '#312e81' : '#111827'; ctx.fillRect(x, 185, 264, 220); ctx.strokeStyle = open ? '#818cf8' : '#374151'; ctx.strokeRect(x, 185, 264, 220); ctx.fillStyle = '#f9fafb'; ctx.font = '700 23px system-ui'; ctx.fillText(family.name, x + 132, 270); ctx.font = '16px system-ui'; ctx.fillText(open ? `${index + 1}번째 용기 개방 · 눈을 떴다` : '생체 신호 대기 중', x + 132, 320); });
  }

  private drawResult(): void {
    const success = this.state.status === 'success'; const ctx = this.context;
    ctx.fillStyle = '#111827'; ctx.fillRect(26, 22, 908, 496); ctx.textAlign = 'center'; ctx.fillStyle = success ? '#818cf8' : '#fb7185'; ctx.font = '700 16px system-ui'; ctx.fillText(success ? 'RECONSTRUCTION COMPLETE' : 'CONNECTION LOST', 480, 112);
    ctx.fillStyle = '#f9fafb'; ctx.font = '700 38px system-ui'; ctx.fillText(success ? '세 개의 생체 용기가 열렸다' : '기억 연결이 붕괴했다', 480, 174);
    ctx.fillStyle = '#c7d2fe'; ctx.font = '19px system-ui'; ctx.fillText(success ? '가족은 영수의 기억으로 재구성된 존재였다.' : '장치로 돌아가 다시 시도할 수 있습니다.', 480, 250);
    ctx.font = '16px system-ui'; ctx.fillText('아래 버튼을 눌러 연구 구역으로 돌아가세요.', 480, 310);
  }

  private drawLettingGo(): void {
    const ctx = this.context;
    ctx.fillStyle = '#111827'; ctx.fillRect(26, 22, 908, 496);
    ctx.textAlign = 'center'; ctx.fillStyle = '#818cf8'; ctx.font = '700 15px system-ui';
    ctx.fillText(`기억 연결 정리 ${this.lettingGo.resolved.length} / ${LETTING_GO_MEMORIES.length}`, 480, 58);
    if (this.lettingGo.completed) {
      ctx.fillStyle = '#f9fafb'; ctx.font = '700 34px system-ui'; ctx.fillText('기록 보존 준비 완료', 480, 160);
      ctx.fillStyle = '#c7d2fe'; ctx.font = '18px system-ui'; ctx.fillText('기억은 삭제되지 않았다. 사랑했던 시간은 기록 보관소에 남는다.', 480, 225);
      ctx.fillText('이제 가족과 마지막 식탁에 앉아 작별할 시간이 남았다.', 480, 267);
      ctx.strokeStyle = '#818cf8'; ctx.strokeRect(330, 320, 300, 90);
      ctx.fillStyle = '#f9fafb'; ctx.font = '700 20px system-ui'; ctx.fillText('다음 · 마지막 식탁', 480, 373);
      return;
    }
    const memory = LETTING_GO_MEMORIES[this.lettingGo.index];
    ctx.fillStyle = '#c7d2fe'; ctx.font = '16px system-ui'; ctx.fillText(`${memory.family}와 연결된 기억`, 480, 100);
    ctx.fillStyle = '#f9fafb'; ctx.font = '700 30px system-ui'; ctx.fillText(memory.object, 480, 145);
    ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(210, 260); ctx.lineTo(480, 185); ctx.lineTo(750, 260); ctx.stroke();
    ctx.fillStyle = '#312e81'; ctx.beginPath(); ctx.arc(210, 260, 36, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(750, 260, 36, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f9fafb'; ctx.font = '700 15px system-ui'; ctx.fillText(memory.family, 210, 266); ctx.fillText(memory.object, 750, 266);
    ctx.font = '18px system-ui'; ctx.fillText(memory.prompt, 480, 330);
    ctx.fillStyle = this.lettingGo.lastChoiceCorrect === false ? '#fb7185' : '#c7d2fe'; ctx.font = '16px system-ui';
    ctx.fillText(this.lettingGo.feedback.slice(0, 82), 480, 390);
  }

  private drawEpilogue(): void {
    const ctx = this.context; const phase = this.epilogue.phase;
    ctx.fillStyle = '#111827'; ctx.fillRect(26, 22, 908, 496); ctx.textAlign = 'center';
    if (phase === 'silence') {
      ctx.fillStyle = '#374151'; ctx.font = '16px system-ui'; ctx.fillText('빈 연구실 · 우주선의 낮은 진동만 들린다.', 480, 290); return;
    }
    if (phase === 'corridor') {
      ctx.fillStyle = '#1f2937'; ctx.fillRect(48, 90, 864, 400); ctx.strokeStyle = '#374151';
      for (let x = 48; x < 912; x += 48) ctx.strokeRect(x, 90, 48, 400);
      ctx.fillStyle = '#312e81'; ctx.fillRect(ARCHIVE_DOOR.x - 34, ARCHIVE_DOOR.y - 50, 68, 100);
      ctx.fillStyle = '#f9fafb'; ctx.font = '13px system-ui'; ctx.fillText('기록 보관소', ARCHIVE_DOOR.x, ARCHIVE_DOOR.y + 5);
      ctx.fillRect(this.player.x, this.player.y, PLAYER_SIZE, PLAYER_SIZE);
      ctx.fillStyle = '#c7d2fe'; ctx.font = '16px system-ui'; ctx.fillText(this.epilogue.message, 480, 55); return;
    }
    if (phase === 'archive' || phase === 'archive-complete') {
      ctx.fillStyle = '#c7d2fe'; ctx.font = '700 15px system-ui'; ctx.fillText('기록 보관소', 480, 48);
      ctx.textAlign = 'left'; ctx.fillStyle = '#fb7185'; ctx.fillText('생체 재구성: 비활성', 54, 76); ctx.fillStyle = '#818cf8'; ctx.fillText('기억 보존: 활성', 240, 76);
      for (const record of ARCHIVE_RECORDS) {
        const placed = this.epilogue.placed.includes(record.id); ctx.fillStyle = placed ? '#312e81' : '#1f2937'; ctx.fillRect(record.x - 32, record.y - 24, 64, 48);
        ctx.strokeStyle = placed ? '#f9fafb' : '#818cf8'; ctx.strokeRect(record.x - 32, record.y - 24, 64, 48);
        ctx.fillStyle = '#c7d2fe'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(placed ? '보존 완료' : record.name, record.x, record.y + 4);
      }
      ctx.fillStyle = '#f9fafb'; ctx.fillRect(this.player.x, this.player.y, PLAYER_SIZE, PLAYER_SIZE);
      ctx.fillStyle = '#c7d2fe'; ctx.font = '14px system-ui'; ctx.fillText(`기록 배치 ${this.epilogue.placed.length} / ${ARCHIVE_RECORDS.length}`, 480, 470);
      ctx.fillText(this.epilogue.message.slice(0, 90), 480, 500); return;
    }
    if (phase === 'montage') {
      ctx.fillStyle = '#818cf8'; ctx.font = '700 15px system-ui'; ctx.fillText(`새로운 일상 ${this.epilogue.step + 1} / ${MONTAGE.length}`, 480, 100);
      ctx.fillStyle = '#f9fafb'; ctx.font = '700 25px system-ui'; ctx.fillText(MONTAGE[this.epilogue.step], 480, 270); return;
    }
    if (phase === 'homeworld') {
      ctx.fillStyle = '#c7d2fe'; ctx.beginPath(); ctx.arc(330, 130, 48, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(640, 105, 32, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#312e81'; ctx.fillRect(0, 380, 960, 160); ctx.fillStyle = '#f9fafb'; ctx.font = '700 26px system-ui'; ctx.fillText('두 개의 달 아래, 외계 가족이 기다리고 있었다.', 480, 240);
      ctx.font = '17px system-ui'; ctx.fillText('어머니: “돌아온 기분이 어떠니?”', 480, 290); ctx.fillText('영수: “아직은 낯설어요. 그래도 천천히 집이 되겠죠.”', 480, 325); return;
    }
    if (phase === 'journal') {
      ctx.fillStyle = '#f9fafb'; ctx.font = '700 26px system-ui'; ctx.fillText('마지막 경비일지', 480, 100); ctx.font = '18px system-ui';
      JOURNAL_LINES.slice(0, this.epilogue.step + 1).forEach((line, index) => ctx.fillText(line, 480, 170 + index * 48)); return;
    }
    if (phase === 'credits') { ctx.fillStyle = '#f9fafb'; ctx.font = '700 38px system-ui'; ctx.fillText('CHAPTER 03 · 마지막 저녁', 480, 240); ctx.font = '16px system-ui'; ctx.fillText('잃어버린 가족을 찾았고, 떠나간 가족에게 작별했다.', 480, 290); return; }
    if (phase === 'postcredits' || phase === 'complete') { ctx.fillStyle = '#f9fafb'; ctx.font = '22px system-ui'; ctx.fillText(this.epilogue.message, 480, 270); if (phase === 'complete') { ctx.fillStyle = '#818cf8'; ctx.font = '15px system-ui'; ctx.fillText('END', 480, 330); } }
  }

  private syncControls(): void {
    this.controls.map.hidden = this.screen !== 'map' && !(this.screen === 'epilogue' && ['corridor', 'archive'].includes(this.epilogue.phase));
    this.controls.choices.hidden = this.screen !== 'playing';
    this.controls.returnButton.hidden = this.screen !== 'result';
    this.controls.retryButton.hidden = this.screen !== 'result' || this.state.status !== 'failure';
    this.controls.lettingChoices.hidden = this.screen !== 'letting-go' || this.lettingGo.completed;
    const epilogueCanAdvance = this.screen === 'epilogue' && !['silence', 'corridor', 'archive', 'complete'].includes(this.epilogue.phase);
    this.controls.epilogueNext.hidden = !epilogueCanAdvance;
    const nearDevice = this.screen === 'map' && canActivateDevice(this.player, this.flow.deviceComplete, this.currentMap());
    const nearObject = this.screen === 'map' && collectionAvailable(this.flow) && nearbyMemoryObject(this.player, this.collection) !== null;
    const nearRecord = this.screen === 'epilogue' && nearbyArchiveRecord(this.player, this.epilogue) !== null;
    const nearDoor = this.screen === 'epilogue' && this.epilogue.phase === 'corridor' && nearArchiveDoor(this.player);
    this.controls.interact.disabled = !nearDevice && !nearObject && !nearRecord && !nearDoor;
    this.controls.interact.textContent = nearDoor ? '기록 보관소 입장 · E' : nearRecord ? '기록 배치 · E' : nearObject ? '추억 정리 · E' : '장치 작동 · E';
    this.controls.choiceButtons.forEach((button) => { button.disabled = this.screen !== 'playing'; });
    this.controls.lettingButtons.forEach((button) => { button.disabled = this.screen !== 'letting-go' || this.lettingGo.completed; });
    let message = '출입 금지 연구 구역입니다. 방향키나 WASD로 영수를 이동하세요.';
    if (this.screen === 'map' && nearDevice) message = '기억 재구성 장치 앞입니다. E 또는 Enter로 작동하세요.';
    if (this.screen === 'map' && this.flow.deviceComplete) message = this.collection.completed
      ? `${this.collection.message} Chapter03 중간 기록을 완료했습니다.`
      : this.collection.collected.length > 0
        ? `${this.collection.message} ${this.collection.collected.length}개 완료, ${MEMORY_OBJECTS.length - this.collection.collected.length}개 남았습니다.`
        : `가족과 함께 추억을 정리합니다. ${MEMORY_OBJECTS.length}개 남았습니다.`;
    if (nearObject) message = `${nearbyMemoryObject(this.player, this.collection)?.name} 앞입니다. E 또는 Enter로 정리하세요.`;
    if (this.screen === 'playing') message = `${this.state.feedback} 현재 기억은 ${MEMORY_CLUES[this.state.clueIndex].label}, 안정성 ${this.state.stability}입니다.`;
    if (this.screen === 'awakening') message = `생체 용기 개방 중. ${awakeningStage(performance.now() - this.awakeningStartedAt)}개가 열렸습니다.`;
    if (this.screen === 'result') message = this.state.status === 'success' ? '재구성에 성공했습니다. 연구 구역으로 돌아가세요.' : '재구성에 실패했습니다. 연구 구역으로 돌아가 재시도할 수 있습니다.';
    if (this.screen === 'letting-go') message = this.lettingGo.completed
      ? '모든 기억 연결을 정리했습니다. 기억은 삭제하지 않고 기록으로 남겼습니다. 다음 장면은 마지막 식탁입니다.'
      : `${LETTING_GO_MEMORIES[this.lettingGo.index].object}. ${this.lettingGo.feedback} ${this.lettingGo.resolved.length}개 완료. 붙잡는다, 기록으로 남긴다, 놓아준다 중 선택하세요.`;
    if (this.screen === 'epilogue') message = `${this.epilogue.phase}. ${this.epilogue.message}`;
    if (message !== this.lastAnnouncement) { this.lastAnnouncement = message; this.controls.liveRegion.textContent = message; }
  }

  private currentMap(): PlayableMapAssetEntry {
    return this.flow.deviceComplete ? MEMORY_ROOM_MAP : SPACESHIP_MAP;
  }
}
