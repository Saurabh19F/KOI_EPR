import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthV2Controller } from './auth-v2.controller';
import { AuthV2Service } from './auth-v2.service';
import { JwtStrategy } from '../auth/jwt.strategy';

// Entities
import {
  PasswordResetToken,
  EmailVerificationToken,
  TokenBlacklist,
  TwoFactorConfig,
  LoginActivity,
  Session,
  ApiKey,
  SecurityAuditLog,
} from './entities/auth-entities';

// Users module
import { UsersModule } from '../users/users.module';
import { Permission } from '../users/entities/permission.entity';

// Notifications module
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([
      PasswordResetToken,
      EmailVerificationToken,
      TokenBlacklist,
      TwoFactorConfig,
      LoginActivity,
      Session,
      ApiKey,
      SecurityAuditLog,
      Permission,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [AuthV2Controller],
  providers: [AuthV2Service, JwtStrategy],
  exports: [AuthV2Service, PassportModule],
})
export class AuthV2Module {}
