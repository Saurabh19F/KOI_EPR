import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Notification } from './entities/notification.entity';
import * as nodemailer from 'nodemailer';
import * as twilio from 'twilio';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;
  private twilioClient: any = null;
  private recentNotifications = new Map<string, number>();

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @Optional() private configService?: ConfigService,
  ) {
    this.initializeTransporter();
    this.initializeTwilio();
  }

  private initializeTransporter() {
    if (!this.configService) return;
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && port && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port: Number(port),
          secure: Number(port) === 465,
          auth: {
            user,
            pass,
          },
        });
        this.logger.log('Nodemailer SMTP Transporter initialized successfully');
      } catch (err) {
        this.logger.error('Failed to initialize SMTP transporter:', err.message);
      }
    } else {
      this.logger.warn('SMTP configuration not fully provided. Falling back to mock email logging.');
    }
  }

  private initializeTwilio() {
    if (!this.configService) return;
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      try {
        this.twilioClient = twilio(accountSid, authToken);
        this.logger.log('Twilio Client initialized successfully');
      } catch (err) {
        this.logger.error('Failed to initialize Twilio client:', err.message);
      }
    } else {
      this.logger.warn('Twilio configuration not fully provided. Falling back to mock WhatsApp logging.');
    }
  }

  // ============ Email Notifications ============

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const resetUrl = `${this.configService?.get('APP_URL', 'http://localhost:3000')}/auth/reset-password?token=${token}`;

    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password for your KOI-ERP account. Click the button below to choose a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">Reset Password</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
        <p style="font-size: 12px; color: #777;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your KOI-ERP Password',
      html,
      text: `Hello ${name},\n\nWe received a request to reset your password for your KOI-ERP account. Go to ${resetUrl} to reset your password.\n\nIf you did not request this, please ignore this email.`,
    });
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.configService?.get('APP_URL', 'http://localhost:3000')}/auth/verify-email?token=${token}`;

    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Verify Your Email Address</h2>
        <p>Thank you for registering on KOI-ERP. Click the button below to verify your email address:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
        <p style="font-size: 12px; color: #777;">If you did not register for a KOI-ERP account, please ignore this email.</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your KOI-ERP Email Address',
      html,
      text: `Hello,\n\nThank you for registering on KOI-ERP. Go to ${verifyUrl} to verify your email address.\n\nIf you did not register for this, please ignore this email.`,
    });
  }

  async sendEmail(data: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    const from = this.configService?.get<string>('SMTP_FROM') || '"KOI-ERP" <no-reply@koierp.com>';

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text || '',
        });
        this.logger.log(`Email sent successfully to ${data.to}: ${data.subject}`);
        return;
      } catch (err) {
        this.logger.error(`Failed to send email to ${data.to} via SMTP: ${err.message}`);
      }
    }

    this.logger.log(`[MOCK EMAIL] To: ${data.to} | Subject: ${data.subject}`);
    console.log(`
      =====================================
      MOCK EMAIL SENT
      =====================================
      From: ${from}
      To: ${data.to}
      Subject: ${data.subject}
      =====================================
      ${data.html.substring(0, 500)}...
      =====================================
    `);
  }

  // ============ WhatsApp / SMS Notifications ============

  async sendWhatsApp(data: {
    to: string;
    message: string;
  }): Promise<void> {
    const from = this.configService?.get<string>('TWILIO_FROM_NUMBER') || 'whatsapp:+14155238886';
    const formattedTo = data.to.startsWith('whatsapp:') ? data.to : `whatsapp:${data.to}`;

    if (this.twilioClient) {
      try {
        await this.twilioClient.messages.create({
          from,
          body: data.message,
          to: formattedTo,
        });
        this.logger.log(`WhatsApp sent successfully to ${data.to}`);
        return;
      } catch (err) {
        this.logger.error(`Failed to send WhatsApp to ${data.to} via Twilio: ${err.message}`);
      }
    }

    this.logger.log(`[MOCK WHATSAPP] To: ${data.to} | Message: ${data.message}`);
    console.log(`
      =====================================
      MOCK WHATSAPP SENT
      =====================================
      From: ${from}
      To: ${formattedTo}
      Message: ${data.message}
      =====================================
    `);
  }

  // ============ Database Notifications ============

  async createNotification(data: {
    companyId: string;
    userId: string;
    title: string;
    message: string;
    moduleName?: string;
    recordId?: string;
    notificationType?: string;
    sendRealtime?: boolean;
  }): Promise<Notification> {
    const signature = `${data.userId}:${data.title}:${data.message}:${data.recordId || ''}`;
    const now = Date.now();
    const lastCreated = this.recentNotifications.get(signature);

    if (lastCreated && (now - lastCreated) < 5000) {
      this.logger.log(`Duplicate notification detected in-memory, skipping DB insert for user ${data.userId}`);
      // Find the last one from DB to return
      try {
        const existing = await this.notificationRepo.findOne({
          where: {
            userId: data.userId,
            title: data.title,
            message: data.message,
            moduleName: data.moduleName || null as any,
            recordId: data.recordId || null as any,
          },
          order: { createdAt: 'DESC' },
        });
        if (existing) return existing;
      } catch (err) {
        this.logger.warn(`Failed to fetch existing duplicate from DB: ${err.message}`);
      }
    }

    // Register signature in memory synchronously
    this.recentNotifications.set(signature, now);

    // Clean up cache to prevent memory leaks
    setTimeout(() => {
      this.recentNotifications.delete(signature);
    }, 10000);

    const notification = this.notificationRepo.create({
      companyId: data.companyId,
      userId: data.userId,
      title: data.title,
      message: data.message,
      moduleName: data.moduleName,
      recordId: data.recordId,
      notificationType: data.notificationType || 'in_app',
      status: 'pending',
    });

    const saved = await this.notificationRepo.save(notification);
    this.logger.log(`Notification created: ${saved.notificationId} for user ${data.userId}`);

    return saved;
  }

  async createAndSend(data: {
    companyId: string;
    userId: string;
    title: string;
    message: string;
    moduleName?: string;
    recordId?: string;
    notificationType?: string;
  }): Promise<{ notification: Notification; sent: boolean }> {
    const notification = await this.createNotification(data);
    return { notification, sent: true };
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationRepo.update({ notificationId }, {
      status: 'read',
      readAt: new Date(),
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { userId, status: 'pending' },
      { status: 'read', readAt: new Date() },
    );
  }

  async getUserNotifications(userId: string, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    moduleName?: string;
  }): Promise<{ data: Notification[]; total: number }> {
    const { limit = 50, offset = 0, unreadOnly = false, moduleName } = options || {};

    const queryBuilder = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (unreadOnly) {
      queryBuilder.andWhere('notification.status = :status', { status: 'pending' });
    }

    if (moduleName) {
      queryBuilder.andWhere('notification.moduleName = :moduleName', { moduleName });
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, status: 'pending' },
    });
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepo.delete({ notificationId, userId });
  }

  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepo
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('status = :status', { status: 'read' })
      .execute();

    return result.affected || 0;
  }

  async getNotificationById(notificationId: string): Promise<Notification | null> {
    return this.notificationRepo.findOne({ where: { notificationId } });
  }
}
