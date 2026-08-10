import { awakeningStage, connectMemory, createMemoryGame, familyAtPoint, MEMORY_CLUES, REQUIRED_BY_FAMILY, type FamilyId, type MemoryGameState } from '../shared/gameLogic';
import { canActivateDevice, canInteract, clearDirections, createFlow, movePlayer, PLAYER_SIZE, transitionFlow, type FlowState, type Point } from '../shared/mapLogic';
import { MEMORY_ROOM_MAP, requirePlayableMap, SPACESHIP_MAP, type PlayableMapAssetEntry } from '../shared/mapAssetManifest';
import { collectNearby, collectionAvailable, createCollection, MEMORY_OBJECTS, nearbyMemoryObject, type CollectionState } from '../shared/collectionLogic';
import { chooseLettingGo, createLettingGo, LETTING_GO_MEMORIES, type LettingGoChoice, type LettingGoState } from '../shared/lettingGoLogic';
import { advanceEpilogue, ARCHIVE_DOOR, ARCHIVE_RECORDS, ARCHIVE_ROOM_DOOR, ARCHIVE_SPAWN, createEpilogue, enterArchive, JOURNAL_LINES, MONTAGE, moveEpiloguePlayer, nearArchiveDoor, nearbyArchiveRecord, placeArchiveRecord, QUARTERS_SPAWN, startEpilogue, type EpilogueState } from '../shared/epilogueLogic';
import { advanceWarning, createWarning, WARNING_LINES, type WarningState } from '../shared/wardenWarningLogic';
import { advanceBlackout, BLACKOUT_LINES, createBlackout, type BlackoutState } from '../shared/blackoutLogic';
import {
  advanceRescueDialogue, completeRescue, createRescue, nearbyRescueTarget, rescueAvailable,
  RESCUE_COMPLETE_LINE, RESCUE_TARGETS, startRescueDialogue, type RescueDialogueState, type RescueState, type RescueTargetId,
} from '../shared/rescueLogic';
import { advanceDinner, createDinner, DINNER_CRACK_STEP, DINNER_LINES, type DinnerState } from '../shared/dinnerIllusionLogic';
import { renderDialogueBox } from '../shared/dialogueBox';
import { drawMemoryRoomBackground, selectChapter03Background } from './memoryRoomBackground';
import { selectEpilogueBackground } from './epilogueBackground';
import { drawPlayerSprite, facingFromMovement, type PlayerFacing } from './playerSprite';
import { drawInteractionObject, type InteractionObjectAsset } from './interactionObjectSprite';
import { drawFamilyNpcSprite, familyNpcAssetPath, familyNpcDestination } from './familyNpcSprite';
import { alienFamilyAssetPath, alienFamilyDestination, drawAlienFamilyNpc } from './alienFamilyNpcSprite';
import { bioVesselAssetPath, drawBioVesselPanel, puzzleVesselState, type BioVesselState } from './bioVesselSprite';

type Screen = 'map' | 'warning' | 'blackout' | 'rescue' | 'dinner' | 'playing' | 'awakening' | 'result' | 'letting-go' | 'epilogue';
type Direction = 'up' | 'down' | 'left' | 'right';
type Controls = {
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
  private playerFacing: PlayerFacing = 'down';
  private pressed = new Set<Direction>();
  private flow: FlowState = createFlow();
  private collection: CollectionState = createCollection();
  private lettingGo: LettingGoState = createLettingGo();
  private epilogue: EpilogueState = createEpilogue();
  private warning: WarningState = createWarning();
  private warningFadeStartedAt = 0;
  private blackout: BlackoutState = createBlackout();
  private blackoutFadeStartedAt = 0;
  private rescue: RescueState = createRescue();
  private rescueDialogue: RescueDialogueState | null = null;
  private rescueReleaseStartedAt = 0;
  private rescueOutro: 'none' | 'line' | 'fade' = 'none';
  private rescueFadeStartedAt = 0;
  private dinner: DinnerState = createDinner();
  private dinnerFadeStartedAt = 0;
  private silenceUntil = 0;
  private awakeningStartedAt = 0;
  private previousTime = performance.now();
  private lastAnnouncement = '';
  private readonly spaceshipImage = new Image();
  private readonly memoryRoomImage = new Image();
  private readonly playerImage = new Image();
  private readonly quartersImage = new Image();
  private readonly archiveImage = new Image();
  private readonly objectImage = new Image();
  private readonly familyImages: Readonly<Record<FamilyId, HTMLImageElement>> = {
    wife: new Image(),
    son: new Image(),
    daughter: new Image(),
  };
  private readonly alienFamilyImages: Readonly<Record<RescueTargetId, HTMLImageElement>> = {
    father: new Image(),
    mother: new Image(),
    sister: new Image(),
  };
  private readonly bioVesselImages: Readonly<Record<FamilyId, HTMLImageElement>> = {
    wife: new Image(),
    son: new Image(),
    daughter: new Image(),
  };

  constructor(private readonly canvas: HTMLCanvasElement, private readonly controls: Controls) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context를 만들 수 없습니다.');
    this.context = context;
    requirePlayableMap(SPACESHIP_MAP);
    requirePlayableMap(MEMORY_ROOM_MAP);
    this.spaceshipImage.src = new URL('../assets/chapter03-spaceship-lab.png', import.meta.url).href;
    this.memoryRoomImage.src = new URL('../assets/chapter03-memory-room-v2.png', import.meta.url).href;
    this.playerImage.src = new URL('../../../assets/yeongsu-alien-suit-sprites.png', import.meta.url).href;
    this.quartersImage.src = new URL('../assets/yeongsu-quarters.png', import.meta.url).href;
    this.archiveImage.src = new URL('../assets/chapter03-archive.png', import.meta.url).href;
    this.objectImage.src = new URL('../assets/interaction-objects.png', import.meta.url).href;
    for (const family of FAMILY) this.familyImages[family.id].src = familyNpcAssetPath(family.id);
    for (const family of FAMILY) this.bioVesselImages[family.id].src = bioVesselAssetPath(family.id);
    for (const target of RESCUE_TARGETS) this.alienFamilyImages[target.id].src = alienFamilyAssetPath(target.id);
  }

  mount(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.clearMovement);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.addEventListener('click', this.onCanvasClick);
    this.controls.returnButton.addEventListener('click', this.returnToMap);
    this.controls.retryButton.addEventListener('click', this.retryPuzzle);
    this.controls.lettingButtons.forEach((button) => button.addEventListener('click', () => {
      if (this.screen === 'letting-go') this.chooseLettingGo(button.dataset.choice as LettingGoChoice);
    }));
    this.controls.epilogueNext.addEventListener('click', () => {
      if (this.screen === 'warning' || this.screen === 'blackout' || this.screen === 'rescue' || this.screen === 'dinner') this.interact();
      else this.advanceEpilogue();
    });
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
    if ((event.code === 'Enter' || event.code === 'KeyE') && this.screen === 'warning') {
      event.preventDefault(); this.interact(); return;
    }
    if ((event.code === 'Enter' || event.code === 'KeyE') && this.screen === 'blackout') {
      event.preventDefault(); this.interact(); return;
    }
    if ((event.code === 'Enter' || event.code === 'KeyE') && this.screen === 'rescue') {
      event.preventDefault(); this.interact(); return;
    }
    if ((event.code === 'Enter' || event.code === 'KeyE') && this.screen === 'dinner') {
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
    if (this.screen === 'warning') {
      const wasSeen = this.warning.seen;
      this.warning = advanceWarning(this.warning);
      if (!wasSeen && this.warning.seen) this.warningFadeStartedAt = performance.now();
      return;
    }
    if (this.screen === 'blackout') {
      const wasSeen = this.blackout.seen;
      this.blackout = advanceBlackout(this.blackout);
      if (!wasSeen && this.blackout.seen) this.blackoutFadeStartedAt = performance.now();
      return;
    }
    if (this.screen === 'dinner') {
      const wasSeen = this.dinner.seen;
      this.dinner = advanceDinner(this.dinner);
      if (!wasSeen && this.dinner.seen) this.dinnerFadeStartedAt = performance.now();
      return;
    }
    if (this.screen === 'rescue' && this.rescueOutro === 'line') {
      this.rescueOutro = 'fade';
      this.rescueFadeStartedAt = performance.now();
      return;
    }
    if (this.screen === 'rescue' && this.rescueDialogue) {
      const target = RESCUE_TARGETS.find((candidate) => candidate.id === this.rescueDialogue!.targetId)!;
      const wasSeen = this.rescueDialogue.seen;
      this.rescueDialogue = advanceRescueDialogue(this.rescueDialogue, target);
      if (!wasSeen && this.rescueDialogue.seen) {
        this.rescue = completeRescue(this.rescue, target.id);
        this.rescueReleaseStartedAt = performance.now();
      }
      return;
    }
    if (this.screen === 'map' && collectionAvailable(this.flow) && !this.collection.completed) {
      const next = collectNearby(this.collection, this.player);
      this.collection = next;
      if (next.completed && !this.blackout.seen) {
        // 비트2: letting-go로 곧장 보내는 대신 정전·변모 컷씬(blackout)을 먼저 거친다.
        // `!this.blackout.seen`은 바깥 `!this.collection.completed` 가드로 인해 현재는 항상 참이지만,
        // "blackout을 이미 봤다면 다시 시작하지 않는다"는 불변조건을 명시적으로 남겨둔다.
        this.blackout = createBlackout();
        this.screen = 'blackout';
        this.clearMovement();
        requestAnimationFrame(() => this.controls.epilogueNext.focus());
      }
      return;
    }
    if (this.screen === 'map' && rescueAvailable(this.blackout.seen, this.rescue)) {
      const target = nearbyRescueTarget(this.player, this.rescue);
      if (target) {
        this.rescueDialogue = startRescueDialogue(target);
        this.screen = 'rescue';
        this.clearMovement();
        requestAnimationFrame(() => this.controls.epilogueNext.focus());
      }
      return;
    }
    if (this.screen === 'map' && !this.warning.seen && canActivateDevice(this.player, this.flow.deviceComplete, this.currentMap())) {
      this.screen = 'warning';
      this.clearMovement();
      requestAnimationFrame(() => this.controls.epilogueNext.focus());
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
    requestAnimationFrame(() => this.canvas.focus());
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
    if (this.screen === 'warning') { this.interact(); return; }
    if (this.screen === 'blackout') { this.interact(); return; }
    if (this.screen === 'rescue') { this.interact(); return; }
    if (this.screen === 'dinner') { this.interact(); return; }
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
    if (this.epilogue.phase === 'archive') this.player = { ...ARCHIVE_SPAWN };
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
    this.player = { ...ARCHIVE_SPAWN };
    requestAnimationFrame(() => this.canvas.focus());
  }

  private readonly loop = (time: number): void => {
    const delta = Math.min(32, time - this.previousTime);
    this.previousTime = time;
    if (this.screen === 'map') this.updateMap(delta);
    if (this.screen === 'epilogue' && ['corridor', 'archive'].includes(this.epilogue.phase)) this.updateMap(delta);
    if (this.screen === 'epilogue' && this.epilogue.phase === 'silence' && time >= this.silenceUntil) {
      this.epilogue = advanceEpilogue(this.epilogue);
      this.player = { ...QUARTERS_SPAWN };
      requestAnimationFrame(() => this.canvas.focus());
    }
    if (this.screen === 'warning' && this.warning.seen && time - this.warningFadeStartedAt >= 420) {
      this.screen = 'map';
      this.interact();
    }
    if (this.screen === 'blackout' && this.blackout.seen && time - this.blackoutFadeStartedAt >= 420) {
      // 비트3: 정전 연출이 끝나면 letting-go로 곧장 가지 않고 구출 단계(map 화면)로 돌아간다.
      this.screen = 'map';
      this.player = { ...SPACESHIP_MAP.spawn };
      requestAnimationFrame(() => this.canvas.focus());
    }
    if (this.screen === 'rescue' && this.rescueDialogue?.seen && this.rescueOutro === 'none' && time - this.rescueReleaseStartedAt >= 400) {
      if (this.rescue.completed) {
        this.rescueOutro = 'line';
        this.rescueDialogue = null;
        requestAnimationFrame(() => this.controls.epilogueNext.focus());
      } else {
        this.screen = 'map';
        this.rescueDialogue = null;
        requestAnimationFrame(() => this.canvas.focus());
      }
    }
    if (this.screen === 'rescue' && this.rescueOutro === 'fade' && time - this.rescueFadeStartedAt >= 420) {
      // 비트4: 구출 완료 페이드가 끝나면 letting-go로 곧장 가지 않고 마지막 저녁식탁 환상 인식 장면(dinner)을 먼저 거친다.
      this.dinner = createDinner();
      this.screen = 'dinner';
      requestAnimationFrame(() => this.controls.epilogueNext.focus());
    }
    if (this.screen === 'dinner' && this.dinner.seen && time - this.dinnerFadeStartedAt >= 420) {
      this.lettingGo = createLettingGo();
      this.screen = 'letting-go';
      requestAnimationFrame(() => this.controls.lettingButtons[0].focus());
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
    this.playerFacing = facingFromMovement(dx, dy, this.playerFacing);
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    this.player = this.screen === 'epilogue'
      ? moveEpiloguePlayer(this.player, dx * delta * 0.18, dy * delta * 0.18, this.epilogue.phase === 'corridor' ? 'corridor' : 'archive')
      : movePlayer(this.player, dx * delta * 0.18, dy * delta * 0.18, this.currentMap());
  }

  private render(): void {
    this.context.fillStyle = '#030712'; this.context.fillRect(0, 0, 960, 540);
    if (this.screen === 'map') this.drawMap();
    else if (this.screen === 'warning') this.drawWarning();
    else if (this.screen === 'blackout') this.drawBlackout();
    else if (this.screen === 'rescue') this.drawRescue();
    else if (this.screen === 'dinner') this.drawDinner();
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
    const background = map.id === SPACESHIP_MAP.id ? this.spaceshipImage : this.memoryRoomImage;
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
      const drawn = drawInteractionObject(ctx, this.objectImage, 'reconstruction-device', {
        x: device.x + device.width / 2, y: device.y + device.height / 2,
      }, { width: 150, height: 150 }, this.flow.deviceComplete);
      if (!drawn) { ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 3; ctx.strokeRect(device.x, device.y, device.width, device.height); }
    }
    if (collectionAvailable(this.flow) && !rescueAvailable(this.blackout.seen, this.rescue)) this.drawMemoryArea();
    if (rescueAvailable(this.blackout.seen, this.rescue)) this.drawRescueTargets();
    ctx.fillStyle = '#c7d2fe'; ctx.font = '14px system-ui'; ctx.textAlign = 'left'; ctx.fillText('출입 금지 연구 구역 · 영수', 56, 48);
    this.drawPlayer();
    if (canInteract(this.player, map) && !this.flow.deviceComplete) {
      ctx.fillStyle = '#312e81'; ctx.fillRect(300, 448, 360, 42);
      ctx.fillStyle = '#f9fafb'; ctx.textAlign = 'center'; ctx.font = '700 16px system-ui'; ctx.fillText('E 또는 ENTER · 기억 재구성 장치 작동', 480, 475);
    }
  }

  private drawMemoryArea(): void {
    const ctx = this.context;
    const familyNpcs: readonly { id: FamilyId; name: string; x: number; y: number }[] = [
      { id: 'wife', name: '아내', ...MEMORY_ROOM_MAP.familyMarkers!.wife },
      { id: 'son', name: '큰아들', ...MEMORY_ROOM_MAP.familyMarkers!.son },
      { id: 'daughter', name: '작은딸', ...MEMORY_ROOM_MAP.familyMarkers!.daughter },
    ];
    for (const npc of familyNpcs) {
      const anchor = { centerX: npc.x + 12, feetY: npc.y + 30 };
      if (!drawFamilyNpcSprite(ctx, this.familyImages[npc.id], anchor)) {
        ctx.fillStyle = '#818cf8'; ctx.fillRect(npc.x, npc.y, 24, 30);
      }
      const destination = familyNpcDestination(anchor);
      ctx.fillStyle = '#f9fafb'; ctx.font = '13px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(npc.name, anchor.centerX, destination.y - 7);
    }
    for (const item of MEMORY_OBJECTS) {
      if (this.collection.collected.includes(item.id)) continue;
      const drawn = drawInteractionObject(ctx, this.objectImage, item.id as InteractionObjectAsset,
        { x: item.markerX, y: item.markerY }, { width: 52, height: 52 });
      if (!drawn) {
        ctx.fillStyle = '#c7d2fe'; ctx.beginPath(); ctx.arc(item.markerX, item.markerY, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#818cf8'; ctx.strokeRect(item.markerX - 14, item.markerY - 14, 28, 28);
      }
      ctx.fillStyle = '#f9fafb'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(item.name, item.markerX, item.markerY - 29);
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
      const x = 54 + index * 294; const rect = { x, y: 265, width: 264, height: 190 };
      const vesselState = puzzleVesselState(this.state, family.id);
      drawBioVesselPanel(ctx, this.bioVesselImages[family.id], rect, vesselState, performance.now(), {
        name: family.name,
        progress: `${this.state.completed[family.id]}/${REQUIRED_BY_FAMILY[family.id]} 기억 연결`,
      });
    });
    ctx.fillStyle = this.state.feedback.includes('일치하지') ? '#fb7185' : '#c7d2fe'; ctx.fillText(this.state.feedback, 480, 492);
  }

  private drawAwakening(): void {
    const stage = awakeningStage(performance.now() - this.awakeningStartedAt); const ctx = this.context;
    ctx.fillStyle = '#111827'; ctx.fillRect(26, 22, 908, 496); ctx.textAlign = 'center'; ctx.fillStyle = '#f9fafb'; ctx.font = '700 30px system-ui'; ctx.fillText('생체 용기 개방 중', 480, 126);
    FAMILY.forEach((family, index) => {
      const x = 54 + index * 294; const open = stage > index; const vesselState: BioVesselState = open ? 'open' : 'connected';
      const rect = { x, y: 185, width: 264, height: 220 };
      drawBioVesselPanel(ctx, this.bioVesselImages[family.id], rect, vesselState, performance.now(), { name: family.name });
    });
  }

  private drawResult(): void {
    const success = this.state.status === 'success'; const ctx = this.context;
    ctx.fillStyle = '#111827'; ctx.fillRect(26, 22, 908, 496); ctx.textAlign = 'center'; ctx.fillStyle = success ? '#818cf8' : '#fb7185'; ctx.font = '700 16px system-ui'; ctx.fillText(success ? 'RECONSTRUCTION COMPLETE' : 'CONNECTION LOST', 480, 112);
    ctx.fillStyle = '#f9fafb'; ctx.font = '700 38px system-ui'; ctx.fillText(success ? '세 개의 생체 용기가 열렸다' : '기억 연결이 붕괴했다', 480, 174);
    ctx.fillStyle = '#c7d2fe'; ctx.font = '19px system-ui'; ctx.fillText(success ? '가족은 영수의 기억으로 재구성된 존재였다.' : '장치로 돌아가 다시 시도할 수 있습니다.', 480, 250);
    ctx.font = '16px system-ui'; ctx.fillText('아래 버튼을 눌러 연구 구역으로 돌아가세요.', 480, 310);
  }

  private drawWarning(): void {
    const ctx = this.context;
    const map = this.currentMap();
    const background = selectChapter03Background(false, this.spaceshipImage, this.memoryRoomImage);
    if (!drawMemoryRoomBackground(ctx, background)) {
      ctx.fillStyle = '#111827'; ctx.fillRect(map.bounds.x, map.bounds.y, map.bounds.width, map.bounds.height);
      ctx.lineWidth = 8; ctx.strokeStyle = '#312e81'; ctx.strokeRect(map.bounds.x, map.bounds.y, map.bounds.width, map.bounds.height);
    }
    if (map.device) {
      const device = map.device.bounds;
      ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 3; ctx.strokeRect(device.x, device.y, device.width, device.height);
    }
    ctx.fillStyle = '#c7d2fe'; ctx.font = '14px system-ui'; ctx.textAlign = 'left'; ctx.fillText('출입 금지 연구 구역 · 영수', 56, 48);
    this.drawPlayer();

    renderDialogueBox(ctx, this.canvas, WARNING_LINES[this.warning.step], 'E · Enter ▶ 다음');

    if (this.warning.seen) {
      const alpha = Math.min(1, (performance.now() - this.warningFadeStartedAt) / 420);
      ctx.fillStyle = `rgba(3,7,18,${alpha})`; ctx.fillRect(0, 0, 960, 540);
    }
  }

  private drawBlackout(): void {
    const ctx = this.context;
    const map = this.currentMap();
    const background = selectChapter03Background(true, this.spaceshipImage, this.memoryRoomImage);
    if (!drawMemoryRoomBackground(ctx, background)) {
      ctx.fillStyle = '#111827'; ctx.fillRect(map.bounds.x, map.bounds.y, map.bounds.width, map.bounds.height);
    }
    this.drawPlayer();

    const dimAlpha = 0.15 + Math.min(this.blackout.step, BLACKOUT_LINES.length - 1) * 0.12;
    ctx.fillStyle = `rgba(3,7,18,${dimAlpha})`; ctx.fillRect(0, 0, 960, 540);

    renderDialogueBox(ctx, this.canvas, BLACKOUT_LINES[this.blackout.step], 'E · Enter ▶ 다음');

    if (this.blackout.seen) {
      const alpha = Math.min(1, (performance.now() - this.blackoutFadeStartedAt) / 420);
      ctx.fillStyle = `rgba(3,7,18,${alpha})`; ctx.fillRect(0, 0, 960, 540);
    }
  }

  /** 구출한 인원이 늘수록 우주선이 안정을 되찾는 것을 배경 밝기로 보여준다. */
  private rescueDimAlpha(): number {
    return Math.max(0.2, 0.5 - this.rescue.rescued.length * 0.15);
  }

  private drawRescueTargets(): void {
    const ctx = this.context;
    ctx.fillStyle = `rgba(3,7,18,${this.rescueDimAlpha()})`; ctx.fillRect(0, 0, 960, 540);
    for (const target of RESCUE_TARGETS) {
      if (this.rescue.rescued.includes(target.id)) continue;
      const drawn = drawAlienFamilyNpc(ctx, this.alienFamilyImages[target.id], target);
      if (!drawn) {
        ctx.fillStyle = '#c7d2fe'; ctx.beginPath(); ctx.arc(target.x, target.y, 12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 2; ctx.strokeRect(target.x - 16, target.y - 16, 32, 32);
      }
      const destination = alienFamilyDestination(target);
      ctx.fillStyle = '#f9fafb'; ctx.font = '12px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(target.name, target.x, destination.y - 7);
    }
    ctx.fillStyle = '#111827'; ctx.fillRect(56, 86, 260, 40);
    ctx.fillStyle = '#f9fafb'; ctx.font = '700 16px system-ui'; ctx.textAlign = 'left';
    ctx.fillText(`가족 구출 ${this.rescue.rescued.length} / ${RESCUE_TARGETS.length}`, 72, 112);
    const nearby = nearbyRescueTarget(this.player, this.rescue);
    if (nearby) {
      ctx.fillStyle = '#312e81'; ctx.fillRect(300, 448, 360, 42);
      ctx.fillStyle = '#f9fafb'; ctx.textAlign = 'center'; ctx.font = '700 16px system-ui'; ctx.fillText(`E 또는 ENTER · ${nearby.name} 구출`, 480, 475);
    }
  }

  private drawRescue(): void {
    const ctx = this.context;
    const map = this.currentMap();
    const background = this.spaceshipImage;
    if (!drawMemoryRoomBackground(ctx, background)) {
      ctx.fillStyle = '#111827'; ctx.fillRect(map.bounds.x, map.bounds.y, map.bounds.width, map.bounds.height);
    }
    if (this.rescueDialogue) {
      const target = RESCUE_TARGETS.find((candidate) => candidate.id === this.rescueDialogue!.targetId)!;
      if (!drawAlienFamilyNpc(ctx, this.alienFamilyImages[target.id], target)) {
        ctx.fillStyle = '#c7d2fe'; ctx.beginPath(); ctx.arc(target.x, target.y, 12, 0, Math.PI * 2); ctx.fill();
      }
    }
    this.drawPlayer();
    ctx.fillStyle = `rgba(3,7,18,${this.rescueDimAlpha()})`; ctx.fillRect(0, 0, 960, 540);

    if (this.rescueDialogue) {
      const target = RESCUE_TARGETS.find((candidate) => candidate.id === this.rescueDialogue!.targetId)!;
      renderDialogueBox(ctx, this.canvas, target.lines[this.rescueDialogue.step], 'E · Enter ▶ 다음');
      if (this.rescueDialogue.seen) {
        // 대사가 끝난 인물이 빛으로 풀려나는 짧은 이펙트. 대화창(하단 396~516px)에 가려지지 않도록
        // 목표물의 맵 좌표가 아니라 대화창 위쪽의 고정 위치에 그린다.
        const released = Math.min(1, (performance.now() - this.rescueReleaseStartedAt) / 400);
        ctx.strokeStyle = `rgba(199,210,254,${1 - released})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(480, 250, 14 + released * 60, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (this.rescueOutro !== 'none') {
      renderDialogueBox(ctx, this.canvas, RESCUE_COMPLETE_LINE, this.rescueOutro === 'line' ? 'E · Enter ▶ 다음' : '');
    }

    if (this.rescueOutro === 'fade') {
      const alpha = Math.min(1, (performance.now() - this.rescueFadeStartedAt) / 420);
      ctx.fillStyle = `rgba(3,7,18,${alpha})`; ctx.fillRect(0, 0, 960, 540);
    }
  }

  private drawDinner(): void {
    const ctx = this.context;
    const map = this.currentMap();
    const background = selectChapter03Background(true, this.spaceshipImage, this.memoryRoomImage);
    if (!drawMemoryRoomBackground(ctx, background)) {
      ctx.fillStyle = '#111827'; ctx.fillRect(map.bounds.x, map.bounds.y, map.bounds.width, map.bounds.height);
    }
    this.drawPlayer();

    if (this.dinner.step >= DINNER_CRACK_STEP) {
      // 거짓 식탁이 깨지기 시작하는 균열 연출 — DESIGN.md의 기존 danger 토큰(#fb7185) 재사용, 새 배경 없음.
      const crackAlpha = Math.min(0.45, (this.dinner.step - DINNER_CRACK_STEP + 1) * 0.12);
      ctx.fillStyle = `rgba(251,113,133,${crackAlpha})`; ctx.fillRect(0, 0, 960, 540);
    }

    renderDialogueBox(ctx, this.canvas, DINNER_LINES[this.dinner.step], 'E · Enter ▶ 다음');

    if (this.dinner.seen) {
      const alpha = Math.min(1, (performance.now() - this.dinnerFadeStartedAt) / 420);
      ctx.fillStyle = `rgba(3,7,18,${alpha})`; ctx.fillRect(0, 0, 960, 540);
    }
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
    const epilogueBackground = selectEpilogueBackground(phase, this.quartersImage, this.archiveImage);
    const epilogueBackgroundReady = epilogueBackground !== null && drawMemoryRoomBackground(ctx, epilogueBackground);
    if (phase === 'silence') {
      if (!epilogueBackgroundReady) { ctx.fillStyle = '#1f2937'; ctx.fillRect(48, 90, 864, 400); }
      ctx.fillStyle = 'rgba(3,7,18,.82)'; ctx.fillRect(170, 445, 620, 48);
      ctx.fillStyle = '#c7d2fe'; ctx.font = '16px system-ui';
      ctx.fillText('영수의 작은 방 · 우주선의 낮은 진동만 들린다.', 480, 475); return;
    }
    if (phase === 'corridor') {
      if (!epilogueBackgroundReady) {
        ctx.fillStyle = '#1f2937'; ctx.fillRect(48, 90, 864, 400); ctx.strokeStyle = '#374151';
        for (let x = 48; x < 912; x += 48) ctx.strokeRect(x, 90, 48, 400);
        ctx.fillStyle = '#312e81'; ctx.fillRect(ARCHIVE_DOOR.x - 34, ARCHIVE_DOOR.y - 50, 68, 100);
      } else {
        ctx.fillStyle = 'rgba(49,46,129,.2)'; ctx.fillRect(ARCHIVE_DOOR.x - 34, ARCHIVE_DOOR.y - 50, 68, 100);
        ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 2; ctx.strokeRect(ARCHIVE_DOOR.x - 34, ARCHIVE_DOOR.y - 50, 68, 100);
      }
      drawInteractionObject(ctx, this.objectImage, 'archive-door', ARCHIVE_DOOR, { width: 62, height: 76 });
      ctx.fillStyle = '#f9fafb'; ctx.font = '13px system-ui'; ctx.fillText('기록 보관소', ARCHIVE_DOOR.x, ARCHIVE_DOOR.y + 52);
      this.drawPlayer();
      ctx.fillStyle = '#c7d2fe'; ctx.font = '16px system-ui'; ctx.fillText(this.epilogue.message, 480, 55); return;
    }
    if (phase === 'archive' || phase === 'archive-complete') {
      ctx.fillStyle = '#c7d2fe'; ctx.font = '700 15px system-ui'; ctx.fillText('기록 보관소', 480, 48);
      ctx.textAlign = 'left'; ctx.fillStyle = '#fb7185'; ctx.fillText('생체 재구성: 비활성', 54, 76); ctx.fillStyle = '#818cf8'; ctx.fillText('기억 보존: 활성', 240, 76);
      const doorDrawn = drawInteractionObject(ctx, this.objectImage, 'archive-door', ARCHIVE_ROOM_DOOR, { width: 62, height: 76 });
      if (!doorDrawn) {
        ctx.fillStyle = '#1f2937'; ctx.fillRect(ARCHIVE_ROOM_DOOR.x - 31, ARCHIVE_ROOM_DOOR.y - 38, 62, 76);
        ctx.strokeStyle = '#818cf8'; ctx.strokeRect(ARCHIVE_ROOM_DOOR.x - 31, ARCHIVE_ROOM_DOOR.y - 38, 62, 76);
      }
      for (const record of ARCHIVE_RECORDS) {
        const placed = this.epilogue.placed.includes(record.id);
        const asset = `archive-${record.id}` as InteractionObjectAsset;
        const drawn = drawInteractionObject(ctx, this.objectImage, asset, record, { width: 58, height: 64 }, placed);
        if (!drawn) {
          ctx.fillStyle = placed ? '#312e81' : '#1f2937'; ctx.fillRect(record.x - 32, record.y - 24, 64, 48);
          ctx.strokeStyle = placed ? '#f9fafb' : '#818cf8'; ctx.strokeRect(record.x - 32, record.y - 24, 64, 48);
        }
        ctx.fillStyle = '#c7d2fe'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(placed ? '보존 완료' : record.name, record.x, record.y + 42);
      }
      this.drawPlayer();
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

  private drawPlayer(): void {
    if (drawPlayerSprite(this.context, this.playerImage, this.player, this.playerFacing)) return;
    this.context.fillStyle = '#f9fafb';
    this.context.fillRect(this.player.x, this.player.y, PLAYER_SIZE, PLAYER_SIZE);
    this.context.fillStyle = '#312e81';
    this.context.fillRect(this.player.x + 5, this.player.y + 5, 6, 6);
    this.context.fillRect(this.player.x + 16, this.player.y + 5, 6, 6);
  }

  private syncControls(): void {
    this.controls.choices.hidden = this.screen !== 'playing';
    this.controls.returnButton.hidden = this.screen !== 'result';
    this.controls.retryButton.hidden = this.screen !== 'result' || this.state.status !== 'failure';
    this.controls.lettingChoices.hidden = this.screen !== 'letting-go' || this.lettingGo.completed;
    const epilogueCanAdvance = this.screen === 'epilogue' && !['silence', 'corridor', 'archive', 'complete'].includes(this.epilogue.phase);
    const warningCanAdvance = this.screen === 'warning' && !this.warning.seen;
    const blackoutCanAdvance = this.screen === 'blackout' && !this.blackout.seen;
    const rescueCanAdvance = this.screen === 'rescue'
      && ((!!this.rescueDialogue && !this.rescueDialogue.seen) || this.rescueOutro === 'line');
    const dinnerCanAdvance = this.screen === 'dinner' && !this.dinner.seen;
    this.controls.epilogueNext.hidden = !epilogueCanAdvance && !warningCanAdvance && !blackoutCanAdvance && !rescueCanAdvance && !dinnerCanAdvance;
    this.controls.choiceButtons.forEach((button) => { button.disabled = this.screen !== 'playing'; });
    this.controls.lettingButtons.forEach((button) => { button.disabled = this.screen !== 'letting-go' || this.lettingGo.completed; });
    const nearDevice = this.screen === 'map' && canActivateDevice(this.player, this.flow.deviceComplete, this.currentMap());
    const nearObject = this.screen === 'map' && collectionAvailable(this.flow) && nearbyMemoryObject(this.player, this.collection) !== null;
    const nearbyRescue = this.screen === 'map' && rescueAvailable(this.blackout.seen, this.rescue)
      ? nearbyRescueTarget(this.player, this.rescue)
      : null;
    let message = '출입 금지 연구 구역입니다. 방향키나 WASD로 영수를 이동하세요.';
    if (this.screen === 'warning') {
      const line = WARNING_LINES[this.warning.step];
      message = `${line.speaker}: ${line.text}` + (this.warning.seen ? '' : ' E 또는 Enter, 화면 클릭으로 계속하세요.');
    }
    if (this.screen === 'blackout') {
      const line = BLACKOUT_LINES[this.blackout.step];
      message = (line.speaker ? `${line.speaker}: ${line.text}` : line.text) + (this.blackout.seen ? '' : ' E 또는 Enter, 화면 클릭으로 계속하세요.');
    }
    if (this.screen === 'rescue' && this.rescueDialogue) {
      const target = RESCUE_TARGETS.find((candidate) => candidate.id === this.rescueDialogue!.targetId)!;
      const line = target.lines[this.rescueDialogue.step];
      message = (line.speaker ? `${line.speaker}: ${line.text}` : line.text) + (this.rescueDialogue.seen ? '' : ' E 또는 Enter, 화면 클릭으로 계속하세요.');
    }
    if (this.screen === 'rescue' && this.rescueOutro === 'line') {
      message = `${RESCUE_COMPLETE_LINE.text} E 또는 Enter, 화면 클릭으로 계속하세요.`;
    }
    if (this.screen === 'rescue' && this.rescueOutro === 'fade') message = RESCUE_COMPLETE_LINE.text;
    if (this.screen === 'dinner') {
      const line = DINNER_LINES[this.dinner.step];
      message = (line.speaker ? `${line.speaker}: ${line.text}` : line.text) + (this.dinner.seen ? '' : ' E 또는 Enter, 화면 클릭으로 계속하세요.');
    }
    if (this.screen === 'map' && nearDevice) message = '기억 재구성 장치 앞입니다. E 또는 Enter로 작동하세요.';
    if (this.screen === 'map' && this.flow.deviceComplete) message = this.collection.completed
      ? `${this.collection.message} Chapter03 중간 기록을 완료했습니다.`
      : this.collection.collected.length > 0
        ? `${this.collection.message} ${this.collection.collected.length}개 완료, ${MEMORY_OBJECTS.length - this.collection.collected.length}개 남았습니다.`
        : `가족과 함께 추억을 정리합니다. ${MEMORY_OBJECTS.length}개 남았습니다.`;
    if (this.screen === 'map' && rescueAvailable(this.blackout.seen, this.rescue)) {
      message = `우주선이 낯선 풍경으로 바뀌었다. 흩어진 가족 ${RESCUE_TARGETS.length - this.rescue.rescued.length}명을 더 찾아야 합니다.`;
    }
    if (nearObject) message = `${nearbyMemoryObject(this.player, this.collection)?.name} 앞입니다. E 또는 Enter로 정리하세요.`;
    if (nearbyRescue) message = `${nearbyRescue.name} 앞입니다. E 또는 Enter로 구출하세요.`;
    if (this.screen === 'playing') message = `${this.state.feedback} 현재 기억은 ${MEMORY_CLUES[this.state.clueIndex].label}, 안정성 ${this.state.stability}입니다.`;
    if (this.screen === 'awakening') message = `생체 용기 개방 중. ${awakeningStage(performance.now() - this.awakeningStartedAt)}개가 열렸습니다.`;
    if (this.screen === 'result') message = this.state.status === 'success' ? '재구성에 성공했습니다. 연구 구역으로 돌아가세요.' : '재구성에 실패했습니다. 연구 구역으로 돌아가 재시도할 수 있습니다.';
    if (this.screen === 'letting-go') message = this.lettingGo.completed
      ? '모든 기억 연결을 정리했습니다. 기억은 삭제하지 않고 기록으로 남겼습니다. 다음 장면은 마지막 식탁입니다.'
      : `${LETTING_GO_MEMORIES[this.lettingGo.index].object}. ${this.lettingGo.feedback} ${this.lettingGo.resolved.length}개 완료. 붙잡는다, 기록으로 남긴다, 놓아준다 중 선택하세요.`;
    if (this.screen === 'epilogue') message = `${this.epilogue.phase}. ${this.epilogue.message}`;
    if (this.screen === 'epilogue' && this.epilogue.phase === 'corridor' && nearArchiveDoor(this.player)) {
      message = '기록 보관소 입구입니다. E 또는 Enter로 입장하세요.';
    }
    const nearbyRecord = this.screen === 'epilogue' ? nearbyArchiveRecord(this.player, this.epilogue) : null;
    if (nearbyRecord) message = `${nearbyRecord.name} 앞입니다. E 또는 Enter로 기록을 배치하세요.`;
    if (message !== this.lastAnnouncement) { this.lastAnnouncement = message; this.controls.liveRegion.textContent = message; }
  }

  private currentMap(): PlayableMapAssetEntry {
    if (this.screen === 'rescue' || (this.screen === 'map' && rescueAvailable(this.blackout.seen, this.rescue))) return SPACESHIP_MAP;
    return this.flow.deviceComplete ? MEMORY_ROOM_MAP : SPACESHIP_MAP;
  }
}
