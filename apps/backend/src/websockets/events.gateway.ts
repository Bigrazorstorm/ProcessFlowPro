import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export interface NotificationEvent {
  type: string;
  title: string;
  message: string;
  relatedItemId?: string;
  createdAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  /** Map of userId → Set of socket IDs */
  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
    // Remove from user-socket map
    for (const [userId, sockets] of this.userSockets.entries()) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Client sends 'join' with its userId to register for personal events.
   */
  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { userId } = data;
    if (!userId) return;

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    client.join(`user:${userId}`);
    this.logger.debug(`User ${userId} joined room user:${userId} (socket: ${client.id})`);
    client.emit('joined', { userId, socketId: client.id });
  }

  /**
   * Emit a notification event to a specific user's room.
   */
  emitNotification(userId: string, event: NotificationEvent): void {
    this.server.to(`user:${userId}`).emit('notification', event);
    this.logger.debug(`Emitted notification to user ${userId}: ${event.title}`);
  }

  /**
   * Broadcast an event to all connected clients (e.g. system announcements).
   */
  broadcast(eventName: string, data: unknown): void {
    this.server.emit(eventName, data);
  }

  /**
   * Return the number of currently connected sockets.
   */
  getConnectedCount(): number {
    return this.server.sockets.sockets.size;
  }
}
