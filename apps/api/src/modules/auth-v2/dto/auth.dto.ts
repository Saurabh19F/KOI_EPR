import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============ Password Reset DTOs ============

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  @Min(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character',
  })
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @Min(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character',
  })
  newPassword: string;
}

// ============ 2FA DTOs ============

export class SetupTwoFactorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  method?: string; // totp, sms, email
}

export class VerifyTwoFactorSetupDto {
  @ApiProperty()
  @IsString()
  secret: string;

  @ApiProperty()
  @IsString()
  code: string;
}

export class VerifyTwoFactorDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  challengeToken: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backupCode?: string;
}

export class DisableTwoFactorDto {
  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsString()
  code: string;
}

export class TwoFactorStatusDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiProperty()
  @IsString()
  method: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  backupCodesRemaining?: number;
}

// ============ Session Management DTOs ============

export class SessionInfoDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  deviceInfo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  lastActivityAt: Date;

  @ApiProperty()
  @IsString()
  createdAt: Date;
}

export class RevokeSessionDto {
  @ApiProperty()
  @IsString()
  sessionId: string;
}

export class RevokeOtherSessionsDto {
  @ApiProperty()
  @IsString()
  currentSessionId: string;
}

// ============ API Key DTOs ============

export class CreateApiKeyDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  expiresInDays?: number;
}

export class ApiKeyResponseDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  keyPrefix: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  createdAt: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expiresAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastUsedAt?: Date;
}

export class ApiKeyCreatedDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  apiKey: string; // Only shown once at creation

  @ApiProperty()
  @IsString()
  keyPrefix: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expiresAt?: Date;
}

// ============ Login Activity DTOs ============

export class LoginActivityQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  event?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  success?: boolean;
}

// ============ Security Settings DTOs ============

export class UpdateSecuritySettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requirePasswordChange?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireTwoFactor?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sessionTimeoutMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxLoginAttempts?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lockoutDurationMinutes?: number;
}

// ============ Token Revocation DTOs ============

export class RevokeTokenDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

// ============ Email Verification DTOs ============

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

// ============ Import ============
import { IsArray } from 'class-validator';
