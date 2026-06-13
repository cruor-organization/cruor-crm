import { describe, expect, it } from 'vitest';

import { TOOL_SPECS } from '../agents/tools.js';

import { mockChat, mockEmbeddings } from './mock.js';
import type { AgentEvent, ChatTurnInput } from './types.js';

describe('mockEmbeddings', () => {
  it('devolve vetores 1536 unitários e determinísticos', async () => {
    const [a1] = await mockEmbeddings.embed(['eucalipto']);
    const [a2] = await mockEmbeddings.embed(['eucalipto']);
    expect(a1).toHaveLength(1536);
    const norm = Math.sqrt(a1!.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 5);
    expect(a1).toEqual(a2); // determinístico
  });

  it('textos diferentes → vetores diferentes', async () => {
    const [a, b] = await mockEmbeddings.embed(['rosa', 'eucalipto']);
    expect(a).not.toEqual(b);
  });
});

describe('mockChat', () => {
  it('emite tool_call → tool_result → product_card → tokens → done', async () => {
    const input: ChatTurnInput = {
      orgId: 'org-1',
      orgName: 'Teste',
      currentMonth: 6,
      retrievedChunks: [],
      history: [],
      userMessage: 'eucalipto',
    };
    const events: AgentEvent[] = [];
    const exec = (name: string, _i: unknown): Promise<unknown> => {
      expect(name).toBe('searchProducts');
      return Promise.resolve({ items: [{ sku: 'SEED-EUCA-001', name: 'Eucalipto' }] });
    };
    await mockChat.streamTurn(input, TOOL_SPECS, exec, (e) => events.push(e));

    const types = events.map((e) => e.type);
    expect(types[0]).toBe('tool_call');
    expect(types).toContain('tool_result');
    expect(types).toContain('product_card');
    expect(types).toContain('token');
    expect(types.at(-1)).toBe('done');
  });

  it('sem resultados não emite product_card', async () => {
    const input: ChatTurnInput = {
      orgId: 'org-1',
      orgName: 'Teste',
      currentMonth: 6,
      retrievedChunks: [],
      history: [],
      userMessage: 'inexistente',
    };
    const events: AgentEvent[] = [];
    await mockChat.streamTurn(input, TOOL_SPECS, () => Promise.resolve({ items: [] }), (e) =>
      events.push(e),
    );
    expect(events.map((e) => e.type)).not.toContain('product_card');
    expect(events.at(-1)?.type).toBe('done');
  });
});
