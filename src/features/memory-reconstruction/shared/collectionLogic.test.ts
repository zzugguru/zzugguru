import { describe, expect, it } from 'vitest';
import { collectNearby, collectionAvailable, createCollection, MEMORY_OBJECTS, nearbyMemoryObject } from './collectionLogic';
import { createFlow, transitionFlow } from './mapLogic';

describe('Chapter03 memory object collection', () => {
  it('uses five story-grounded objects and family memory gaps', () => {
    expect(MEMORY_OBJECTS.map((item) => item.name)).toEqual(['가족사진', '시장의 장바구니', '우주선 수리 도구', '별 관측 렌즈', '마지막 식사의 그릇']);
    expect(MEMORY_OBJECTS.some((item) => item.gap.includes('괜찮아요, 아버지.'))).toBe(true);
    expect(MEMORY_OBJECTS.some((item) => item.gap.includes('나는 어디에 있어'))).toBe(true);
  });

  it('rejects distant interaction and prevents duplicate collection', () => {
    const initial = createCollection();
    expect(collectNearby(initial, { x: 600, y: 240 })).toBe(initial);
    const photoPosition = { x: MEMORY_OBJECTS[0].x - 13, y: MEMORY_OBJECTS[0].y - 13 };
    const once = collectNearby(initial, photoPosition);
    expect(once.collected).toEqual(['photo']);
    expect(collectNearby(once, photoPosition)).toBe(once);
  });

  it('enforces the 72px interaction boundary', () => {
    const item = MEMORY_OBJECTS[0];
    expect(nearbyMemoryObject({ x: item.x + 72 - 13, y: item.y - 13 }, createCollection())?.id).toBe(item.id);
    expect(nearbyMemoryObject({ x: item.x + 72.01 - 13, y: item.y - 13 }, createCollection())).toBeNull();
  });

  it('opens collection only after puzzle success and map return', () => {
    const puzzle = transitionFlow(createFlow(), { type: 'interact', allowed: true });
    const failedMap = transitionFlow(transitionFlow(puzzle, { type: 'puzzle-failure' }), { type: 'return-to-map' });
    const successMap = transitionFlow(transitionFlow(puzzle, { type: 'puzzle-success' }), { type: 'return-to-map' });
    expect(collectionAvailable(createFlow())).toBe(false);
    expect(collectionAvailable(failedMap)).toBe(false);
    expect(collectionAvailable(successMap)).toBe(true);
  });

  it('completes exactly when every object is organized', () => {
    let state = createCollection();
    for (const item of MEMORY_OBJECTS) state = collectNearby(state, { x: item.x - 13, y: item.y - 13 });
    expect(state.completed).toBe(true);
    expect(state.collected).toHaveLength(5);
    expect(state.message).toContain('작은딸: “아빠, 이것도 먹어.”');
    expect(state.message).toContain('모든 물건을 정리했다.');
    expect(collectNearby(state, { x: 0, y: 0 })).toBe(state);
    expect(nearbyMemoryObject({ x: 0, y: 0 }, state)).toBeNull();
  });
});
