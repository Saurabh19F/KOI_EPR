import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsEnum, MinLength, MaxLength, IsUrl, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CompanyStatus, SubscriptionStatus } from '../entities/company.entity';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Krishna Enterprises' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  companyName: string;

  @ApiPropertyOptional({ example: 'KRISHNA_ENTERPRISES' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  companyCode?: string;

  @ApiPropertyOptional({ example: 'krishna-enterprises' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ example: 'Krishna Enterprises Pvt Ltd' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  legalName?: string;

  @ApiProperty({ example: 'admin@company.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsString()
  @IsOptional()
  primaryContactPhone?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '123 Main Street, Andheri West' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: '27ABCDE1234F1Z5' })
  @IsString()
  @IsOptional()
  gstNumber?: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F' })
  @IsString()
  @IsOptional()
  panNumber?: string;

  @ApiPropertyOptional({ example: 'https://logo.png' })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'Krishna Enterprises Updated' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  legalName?: string;

  @ApiPropertyOptional({ example: 'Krishna' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsString()
  @IsOptional()
  primaryContactPhone?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '123 Main Street, Andheri West' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: '27ABCDE1234F1Z5' })
  @IsString()
  @IsOptional()
  gstNumber?: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F' })
  @IsString()
  @IsOptional()
  panNumber?: string;

  @ApiPropertyOptional({ example: 'https://logo.png' })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @IsOptional()
  maxUsers?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @IsOptional()
  maxStorageMb?: number;

  @ApiPropertyOptional({ enum: CompanyStatus })
  @IsEnum(CompanyStatus)
  @IsOptional()
  status?: CompanyStatus;
}

export class CompanyBrandingDto {
  @ApiPropertyOptional({ example: 'https://logo.png' })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://favicon.ico' })
  @IsUrl()
  @IsOptional()
  faviconUrl?: string;

  @ApiPropertyOptional({ example: '#2563EB' })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#64748B' })
  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @ApiPropertyOptional({ example: '#22C55E' })
  @IsString()
  @IsOptional()
  successColor?: string;

  @ApiPropertyOptional({ example: '#F59E0B' })
  @IsString()
  @IsOptional()
  warningColor?: string;

  @ApiPropertyOptional({ example: '#EF4444' })
  @IsString()
  @IsOptional()
  dangerColor?: string;

  @ApiPropertyOptional({ example: 'Inter, sans-serif' })
  @IsString()
  @IsOptional()
  fontFamily?: string;

  @ApiPropertyOptional({ example: 'Welcome to our portal' })
  @IsString()
  @IsOptional()
  loginPageHeading?: string;

  @ApiPropertyOptional({ example: 'Please login to continue' })
  @IsString()
  @IsOptional()
  loginPageSubheading?: string;

  @ApiPropertyOptional({ example: 'https://background.jpg' })
  @IsUrl()
  @IsOptional()
  loginPageBackgroundUrl?: string;

  @ApiPropertyOptional({ example: 'https://email-header.png' })
  @IsUrl()
  @IsOptional()
  emailHeaderUrl?: string;

  @ApiPropertyOptional({ example: '© 2024 Company Name. All rights reserved.' })
  @IsString()
  @IsOptional()
  emailFooterText?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  showPlatformBranding?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  showPoweredBy?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customCss?: string;
}

export class CompanySettingsDto {
  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 'DD/MM/YYYY' })
  @IsString()
  @IsOptional()
  dateFormat?: string;

  @ApiPropertyOptional({ example: 'hh:mm A' })
  @IsString()
  @IsOptional()
  timeFormat?: string;

  @ApiPropertyOptional({ example: 18 })
  @IsNumber()
  @IsOptional()
  defaultGstPercent?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsNumber()
  @IsOptional()
  taskSlaHours?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  emailNotificationsEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  emailReminderEnabled?: boolean;

  @ApiPropertyOptional({ example: 3 })
  @IsNumber()
  @IsOptional()
  emailReminderDays?: number;
}

export class CompanyDomainDto {
  @ApiProperty({ example: 'erp.company.com' })
  @IsString()
  @IsEmail()
  domain: string;

  @ApiPropertyOptional({ example: 'custom' })
  @IsString()
  @IsOptional()
  domainType?: string;
}

export class CompanyContactDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'CEO' })
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiProperty({ example: 'john@company.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '400001' })
  @IsString()
  @IsOptional()
  postalCode?: string;
}

export class SignupDto {
  @ApiProperty({ example: 'Krishna Enterprises' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  companyName: string;

  @ApiProperty({ example: 'admin@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  adminName: string;

  @ApiProperty({ example: 'securepassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'starter' })
  @IsString()
  @IsOptional()
  planCode?: string;

  @ApiPropertyOptional({ example: 'TECHNOLOGY' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsString()
  @IsOptional()
  country?: string;
}
