import { EventType, EventPayload } from './types.js';
import { enqueueEvent, TxClient } from './outbox.js';
import prisma from '../config/db.js';

class EventEmitter {
  private getEventPrefix(eventType: string): string {
    const lower = eventType.toLowerCase();
    if (lower.includes('order')) return 'order';
    if (lower.includes('inbound')) return 'inbound';
    if (lower.includes('outbound')) return 'outbound';
    if (lower.includes('packing')) return 'packing';
    if (lower.includes('sorting')) return 'sorting';
    if (lower.includes('shipping') || lower.includes('shipment')) return 'shipping';
    if (lower.includes('inventory')) return 'inventory-check';
    return 'general';
  }

  async emit(
    eventType: EventType,
    entityType: string,
    entityId: string,
    data: Record<string, unknown> = {},
    userId?: string,
    tx?: TxClient
  ): Promise<void> {
    const process = eventType.split('_')[0];

    const payload: EventPayload = {
      eventType,
      process,
      entityType,
      entityId,
      userId,
      data,
      timestamp: new Date().toISOString(),
    };

    await enqueueEvent(eventType, entityType, entityId, payload as unknown as Record<string, unknown>, tx);

    console.log(`[EVENT] ${eventType} - ${entityType}:${entityId}`);
  }

  async getEvents(process?: string, limit = 100) {
    return (prisma as any).eventLog.findMany({
      where: process ? { process } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getOutboxEvents(limit = 100) {
    return (prisma as any).outbox.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const eventEmitter = new EventEmitter();
