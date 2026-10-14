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
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventBusService } from '../events/event-bus.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  companyId?: string;
}

@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        return callback(null, true);
      }
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }
      // Allow raw IP access
      if (origin.match(/^https?:\/\/187\.127\.149\.196(:\d+)?$/)) {
        return callback(null, true);
      }
      // Allow nip.io wildcard domains
      if (origin.match(/^https?:\/\/.*187\.127\.149\.196\.nip\.io(:\d+)?$/)) {
        return callback(null, true);
      }
      const frontendUrl = process.env.FRONTEND_URL;
      if (frontendUrl && origin === frontendUrl) {
        return callback(null, true);
      }
      const extraOrigins = (process.env.EXTRA_CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
      if (extraOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventBusService: EventBusService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Try multiple ways to get the token
      let token = client.handshake.auth?.token;

      if (!token) {
        const authHeader = client.handshake.headers?.authorization;
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.replace('Bearer ', '');
        }
      }

      if (!token) {
        const queryToken = client.handshake.query?.token;
        if (typeof queryToken === 'string') {
          token = queryToken;
        }
      }

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        // Don't disconnect - just log warning
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });

      // Support both sub (standard) and userId
      const userId = payload.sub || payload.userId;
      if (userId && payload.type === 'access') {
        client.userId = userId;
        client.companyId = payload.companyId;

        // Track user socket
        if (!this.userSockets.has(client.userId)) {
          this.userSockets.set(client.userId, new Set());
        }
        this.userSockets.get(client.userId)!.add(client.id);

        // Join user to their personal room
        client.join(`user:${client.userId}`);
        if (client.companyId) {
          client.join(`company:${client.companyId}`);
        }

        this.logger.log(`Client connected: ${client.id} (User: ${client.userId})`);

        // Send connected event
        client.emit('connected', { success: true, userId: client.userId });
      } else {
        this.logger.warn(`Client ${client.id} - Invalid token payload`);
      }
    } catch (error: any) {
      this.logger.warn(`Client ${client.id} - Token verification failed: ${error.message}`);
      // Don't disconnect - just log warning
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    if (client.userId) {
      const userSocketSet = this.userSockets.get(client.userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
    }
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { modules: string[] },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    const { modules } = data;
    modules.forEach((module) => {
      client.join(`module:${module}`);
    });

    this.logger.log(`User ${client.userId} subscribed to modules: ${modules.join(', ')}`);
    return { success: true, subscribed: modules };
  }

  // Helper methods for sending notifications
  sendToUser(userId: string, event: string, data: any) {
    if (!this.server) {
      this.logger.warn(`Cannot send real-time notification to user ${userId}: WebSocket server not initialized`);
      return;
    }
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToCompany(companyId: string, event: string, data: any) {
    if (!this.server) {
      this.logger.warn(`Cannot send real-time notification to company ${companyId}: WebSocket server not initialized`);
      return;
    }
    this.server.to(`company:${companyId}`).emit(event, data);
  }

  sendToModule(module: string, event: string, data: any) {
    if (!this.server) {
      this.logger.warn(`Cannot send real-time notification to module ${module}: WebSocket server not initialized`);
      return;
    }
    this.server.to(`module:${module}`).emit(event, data);
  }

  broadcast(event: string, data: any) {
    if (!this.server) {
      this.logger.warn(`Cannot broadcast real-time notification event ${event}: WebSocket server not initialized`);
      return;
    }
    this.server.emit(event, data);
  }
}
