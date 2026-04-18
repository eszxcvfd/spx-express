import prisma from '../config/db.js';
import { EventType } from './types.js';
import { randomUUID } from 'crypto';
import type { PrismaClient } from '@prisma/client';

export interface OutboxEnvelope {
  id: string;
  eventType: EventType;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  attempts: number;
  lastError: string | null;
  lockedAt: Date | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TxClient = PrismaClient | any;

export async function enqueueEvent(
  eventType: EventType,
  entityType: string,
  entityId: string,
  payload: Record<string, unknown> = {},
  tx?: TxClient
): Promise<OutboxEnvelope> {
  const now = new Date();
  const client = tx || prisma;

  const envelope = await client.outbox.create({
    data: {
      id: randomUUID(),
      eventType,
      entityType,
      entityId,
      payload: payload as object,
      status: 'PENDING',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log(`[OUTBOX] Enqueued event: ${eventType} for ${entityType}:${entityId}`);

  return envelope as unknown as OutboxEnvelope;
}

export async function getPendingEvents(limit = 100): Promise<OutboxEnvelope[]> {
  const events = await prisma.outbox.findMany({
    where: {
      status: { in: ['PENDING', 'FAILED'] },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  return events as unknown as OutboxEnvelope[];
}

export async function lockEvent(id: string): Promise<OutboxEnvelope | null> {
  try {
    const envelope = await prisma.outbox.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        lockedAt: new Date(),
        attempts: { increment: 1 },
        updatedAt: new Date(),
      },
    });
    return envelope as unknown as OutboxEnvelope;
  } catch {
    return null;
  }
}

export async function markEventProcessed(id: string): Promise<void> {
  await prisma.outbox.update({
    where: { id },
    data: {
      status: 'PROCESSED',
      processedAt: new Date(),
      lockedAt: null,
      updatedAt: new Date(),
    },
  });
}

export async function markEventFailed(id: string, error: string): Promise<void> {
  await prisma.outbox.update({
    where: { id },
    data: {
      status: 'FAILED',
      lastError: error,
      lockedAt: null,
      updatedAt: new Date(),
    },
  });
}

export async function getOutboxStats() {
  const [pending, processing, processed, failed] = await Promise.all([
    prisma.outbox.count({ where: { status: 'PENDING' } }),
    prisma.outbox.count({ where: { status: 'PROCESSING' } }),
    prisma.outbox.count({ where: { status: 'PROCESSED' } }),
    prisma.outbox.count({ where: { status: 'FAILED' } }),
  ]);

  return { pending, processing, processed, failed };
}
