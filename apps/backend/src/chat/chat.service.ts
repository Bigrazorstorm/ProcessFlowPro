import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ChatRoom, ChatMessage, ChatRoomType, CreateChatRoomDto, SendMessageDto } from './dto/chat.dto';

const MAX_MESSAGES_PER_ROOM = 500;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  /** tenantId → rooms */
  private rooms: Map<string, ChatRoom[]> = new Map();

  /** roomId → messages */
  private messages: Map<string, ChatMessage[]> = new Map();

  constructor() {
    // Seed a default "Allgemein" room for demonstration
    // Actual seeding happens per-tenant on first access
  }

  private ensureTenantRooms(tenantId: string): void {
    if (!this.rooms.has(tenantId)) {
      const generalRoom: ChatRoom = {
        id: uuidv4(),
        tenantId,
        name: 'Allgemein',
        description: 'Allgemeiner Team-Chat',
        type: ChatRoomType.GENERAL,
        createdBy: 'system',
        createdByName: 'System',
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
      };
      this.rooms.set(tenantId, [generalRoom]);
    }
  }

  // ─── Rooms ────────────────────────────────────────────────────────────────

  createRoom(tenantId: string, userId: string, userName: string, dto: CreateChatRoomDto): ChatRoom {
    this.ensureTenantRooms(tenantId);
    const room: ChatRoom = {
      id: uuidv4(),
      tenantId,
      name: dto.name,
      description: dto.description,
      type: dto.type ?? ChatRoomType.GENERAL,
      createdBy: userId,
      createdByName: userName,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
    };
    this.rooms.get(tenantId)!.push(room);
    this.logger.log(`Created chat room "${room.name}" for tenant ${tenantId}`);
    return room;
  }

  findAllRooms(tenantId: string): ChatRoom[] {
    this.ensureTenantRooms(tenantId);
    return this.rooms.get(tenantId)!;
  }

  findRoom(tenantId: string, roomId: string): ChatRoom {
    this.ensureTenantRooms(tenantId);
    const room = (this.rooms.get(tenantId) ?? []).find((r) => r.id === roomId);
    if (!room) throw new NotFoundException(`Chat room ${roomId} not found`);
    return room;
  }

  removeRoom(tenantId: string, roomId: string): void {
    this.ensureTenantRooms(tenantId);
    const rooms = this.rooms.get(tenantId) ?? [];
    const idx = rooms.findIndex((r) => r.id === roomId);
    if (idx === -1) throw new NotFoundException(`Chat room ${roomId} not found`);
    rooms.splice(idx, 1);
    this.messages.delete(roomId);
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  sendMessage(tenantId: string, roomId: string, userId: string, userName: string, dto: SendMessageDto): ChatMessage {
    const room = this.findRoom(tenantId, roomId);

    const msg: ChatMessage = {
      id: uuidv4(),
      roomId,
      tenantId,
      userId,
      userName,
      content: dto.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!this.messages.has(roomId)) {
      this.messages.set(roomId, []);
    }
    const msgs = this.messages.get(roomId)!;
    msgs.push(msg);

    // Limit stored messages per room
    if (msgs.length > MAX_MESSAGES_PER_ROOM) {
      msgs.splice(0, msgs.length - MAX_MESSAGES_PER_ROOM);
    }

    // Update room metadata
    room.messageCount = msgs.length;
    room.lastMessageAt = msg.createdAt;
    room.lastMessagePreview = msg.content.length > 60 ? msg.content.slice(0, 60) + '…' : msg.content;
    room.updatedAt = msg.createdAt;

    return msg;
  }

  findMessages(tenantId: string, roomId: string, limit = 50): ChatMessage[] {
    this.findRoom(tenantId, roomId); // validate room belongs to tenant
    const msgs = this.messages.get(roomId) ?? [];
    return msgs.slice(-limit);
  }

  deleteMessage(tenantId: string, roomId: string, messageId: string, requestingUserId: string): void {
    this.findRoom(tenantId, roomId);
    const msgs = this.messages.get(roomId) ?? [];
    const idx = msgs.findIndex((m) => m.id === messageId);
    if (idx === -1) throw new NotFoundException(`Message ${messageId} not found`);
    const msg = msgs[idx];
    if (msg.userId !== requestingUserId) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }
    msgs.splice(idx, 1);
  }
}
