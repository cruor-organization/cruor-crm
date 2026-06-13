/**
 * Manifesto das tools de domínio do chatbot (§10.8) — slice 1: só read-only com
 * serviço backend existente. A execução é HTTP (HMAC) para /internal/tools/:name.
 * Adiadas: getMetric, searchMeetingNotes, suggestSeasonalCatalog,
 * findVisuallySimilarProducts, recommendSubstitute, draftQuoteForCustomer.
 */
import { z } from 'zod';

import type { ToolSpec } from '../providers/types.js';

/** Schemas Zod .strict() para validar input antes de bater no backend. */
export const toolInputSchemas = {
  searchProducts: z
    .object({
      query: z.string().min(1),
      category: z.string().optional(),
      limit: z.number().int().min(1).max(20).default(8),
    })
    .strict(),
  getProductAvailability: z
    .object({
      sku: z.string().min(1),
    })
    .strict(),
  getCustomer: z
    .object({
      query: z.string().min(1),
    })
    .strict(),
  getCustomerOrderHistory: z
    .object({
      customerId: z.string().min(1),
      monthsBack: z.number().int().min(1).max(36).default(12),
    })
    .strict(),
} as const;

export type ToolName = keyof typeof toolInputSchemas;

export const TOOL_SPECS: ToolSpec[] = [
  {
    name: 'searchProducts',
    description: 'Pesquisa o catálogo por texto/categoria. Devolve SKUs, nomes, PVP e stock.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: { type: 'string', description: 'Texto de pesquisa (nome, material, cor).' },
        category: { type: 'string', description: 'Categoria opcional para filtrar.' },
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 8 },
      },
      required: ['query'],
    },
  },
  {
    name: 'getProductAvailability',
    description: 'Stock atual e próxima chegada prevista de um produto pelo SKU.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: { sku: { type: 'string', description: 'SKU do produto.' } },
      required: ['sku'],
    },
  },
  {
    name: 'getCustomer',
    description: 'Ficha de uma florista (cliente) por nome ou email + últimas encomendas.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: { query: { type: 'string', description: 'Nome comercial ou email do cliente.' } },
      required: ['query'],
    },
  },
  {
    name: 'getCustomerOrderHistory',
    description: 'Histórico de encomendas de um cliente nos últimos N meses.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        customerId: { type: 'string' },
        monthsBack: { type: 'integer', minimum: 1, maximum: 36, default: 12 },
      },
      required: ['customerId'],
    },
  },
];

export function isToolName(name: string): name is ToolName {
  return name in toolInputSchemas;
}
