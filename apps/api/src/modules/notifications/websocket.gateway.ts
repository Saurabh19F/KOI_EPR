import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userRooms: Map<string, { userId: string; companyId?: string }> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Extract and verify token from handshake
    const token = this.extractToken(client);

    if (token) {
      try {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET'),
        });

        if ((payload.sub || payload.userId) && payload.type === 'access') {
          const userId = payload.sub || payload.userId;
          const companyId = payload.companyId;

          // Join user room
          await client.join(`user:${userId}`);

          // Join company room if exists
          if (companyId) {
            await client.join(`company:${companyId}`);
          }

          // Track user
          this.userRooms.set(client.id, { userId, companyId });

          this.logger.log(`User ${userId} authenticated on socket ${client.id}`);

          // Send success event
          client.emit('authenticated', { success: true, userId });
          return;
        }
      } catch (error) {
        this.logger.warn(`Invalid token for socket ${client.id}`);
      }
    }

    // If no valid token, client will remain unauthenticated
    this.logger.log(`Client ${client.id} connected without authentication`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.userRooms.delete(client.id);
  }

  private extractToken(client: Socket): string | null {
    // Try Authorization header first
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try auth token in handshake
    const token = client.handshake.auth?.token;
    if (token && typeof token === 'string') {
      return token;
    }

    // Try token query parameter
    const queryToken = client.handshake.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }

  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; companyId?: string },
  ) {
    const { userId, companyId } = data;

    // Join user-specific room
    await client.join(`user:${userId}`);

    // Join company room if provided
    if (companyId) {
      await client.join(`company:${companyId}`);
    }

    // Track the socket
    this.userRooms.set(client.id, { userId, companyId });

    this.logger.log(`User ${userId} authenticated on socket ${client.id}`);

    return { event: 'authenticated', data: { success: true, userId } };
  }

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
    this.logger.debug(`Sent ${event} to user:${userId}`);
  }

  /**
   * Send notification to all users in a company
   */
  sendToCompany(companyId: string, event: string, data: any) {
    this.server.to(`company:${companyId}`).emit(event, data);
    this.logger.debug(`Sent ${event} to company:${companyId}`);
  }

  /**
   * Send notification to all connected users (admin broadcast)
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.debug(`Broadcast ${event} to all users`);
  }
}
