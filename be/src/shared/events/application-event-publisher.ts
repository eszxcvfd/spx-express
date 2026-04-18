import prisma from '../../config/db.js';
import { eventEmitter } from '../../events/emitter.js';
import type { EventType } from '../../events/types.js';
import type { TxClient } from '../../events/outbox.js';

export async function publishEvent(
  eventType: EventType,
  entityType: string,
  entityId: string,
  data: Record<string, unknown> = {},
  userId?: string,
): Promise<void> {
  await eventEmitter.emit(eventType, entityType, entityId, data, userId);
}

export async function publishEventWithTx(
  tx: TxClient,
  eventType: EventType,
  entityType: string,
  entityId: string,
  data: Record<string, unknown> = {},
  userId?: string,
): Promise<void> {
  await eventEmitter.emit(eventType, entityType, entityId, data, userId, tx);
}

export async function listEvents(process?: string, limit = 100) {
  return prisma.eventLog.findMany({
    where: process ? { process } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
