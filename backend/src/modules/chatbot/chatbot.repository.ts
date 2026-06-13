/**
 * Persistência do chatbot RAG (§10.8): Conversation + Message. Multi-tenant:
 * organizationId em todas as queries; conversas escopadas ao (org, user).
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';

export const chatbotRepository = {
  listConversations(organizationId: string, userId: string) {
    return prisma.conversation.findMany({
      where: { organizationId, userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
      take: 100,
    });
  },

  createConversation(organizationId: string, userId: string, title: string | null) {
    return prisma.conversation.create({
      data: { organizationId, userId, title },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
  },

  getConversation(organizationId: string, id: string, userId: string) {
    return prisma.conversation.findFirst({
      where: { id, organizationId, userId },
      select: { id: true, title: true, userId: true, createdAt: true, updatedAt: true },
    });
  },

  getMessages(conversationId: string) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, toolCalls: true, createdAt: true },
    });
  },

  addMessage(params: {
    organizationId: string;
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    toolCalls?: Prisma.InputJsonValue;
  }) {
    return prisma.message.create({
      data: {
        organizationId: params.organizationId,
        conversationId: params.conversationId,
        role: params.role,
        content: params.content,
        ...(params.toolCalls !== undefined ? { toolCalls: params.toolCalls } : {}),
      },
      select: { id: true, role: true, content: true, toolCalls: true, createdAt: true },
    });
  },

  touch(conversationId: string, title?: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), ...(title ? { title } : {}) },
      select: { id: true },
    });
  },
};
