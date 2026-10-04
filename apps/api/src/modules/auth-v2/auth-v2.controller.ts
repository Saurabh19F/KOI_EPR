import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiHeader,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthV2Service } from './auth-v2.service';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  SetupTwoFactorDto,
  VerifyTwoFactorSetupDto,
  VerifyTwoFactorDto,
  DisableTwoFactorDto,
  CreateApiKeyDto,
  RevokeSessionDto,
  RevokeOtherSessionsDto,
  LoginActivityQueryDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { LoginDto } from '../auth/dto/login.dto';

@ApiTags('Auth V2')
@Controller('auth-v2')
export class AuthV2Controller {
  constructor(private readonly authV2Service: AuthV2Service) {}

  // ============ Core Authentication ============

  @Post('seed')
  @UseGuards(JwtAuthGuard)
  @Permissions('ADMIN_USERS')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed demo users', description: 'Reset demo user passwords using DEMO_USER_PASSWORD env var' })
  @ApiResponse({ status: 200, description: 'Demo users seeded successfully' })
  @ApiResponse({ status: 500, description: 'DEMO_USER_PASSWORD not configured' })
  async seedUsers() {
    return this.authV2Service.seedDemoUsers();
  }

  @Post('login')
  @ApiOperation({ summary: 'User login', description: 'Authenticate user with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Ip() ip: string) {
    return this.authV2Service.login(loginDto, ip);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token', description: 'Get new access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authV2Service.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user', description: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: any) {
    // Support both sub and userId from JWT payload
    const userId = req.user?.sub || req.user?.userId;
    return this.authV2Service.getProfile(userId);
  }

  // ============ Password Reset ============

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'Reset email sent if account exists' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authV2Service.forgotPassword(dto.email, ip, userAgent);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authV2Service.resetPassword(dto.token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for logged in user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Request() req: any,
  ) {
    return this.authV2Service.changePassword(req.user.userId, dto.currentPassword, dto.newPassword);
  }

  // ============ Two Factor Authentication ============

  @UseGuards(JwtAuthGuard)
  @Post('two-factor/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate 2FA setup' })
  @ApiResponse({ status: 200, description: '2FA setup initiated' })
  async setupTwoFactor(
    @Body() dto: SetupTwoFactorDto,
    @Request() req: any,
  ) {
    return this.authV2Service.setupTwoFactor(req.user.userId, dto.method || 'totp');
  }

  @UseGuards(JwtAuthGuard)
  @Post('two-factor/verify-setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify and enable 2FA' })
  @ApiResponse({ status: 200, description: '2FA enabled' })
  async verifyTwoFactorSetup(
    @Body() dto: VerifyTwoFactorSetupDto,
    @Request() req: any,
  ) {
    return this.authV2Service.verifyTwoFactorSetup(req.user.userId, dto.code);
  }

  @Post('two-factor/verify')
  @ApiOperation({ summary: 'Verify 2FA code during login' })
  @ApiResponse({ status: 200, description: 'Code verified' })
  async verifyTwoFactor(@Body() dto: VerifyTwoFactorDto) {
    return this.authV2Service.verifyTwoFactor(dto.userId, dto.code, dto.backupCode, dto.challengeToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('two-factor/disable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled' })
  async disableTwoFactor(
    @Body() dto: DisableTwoFactorDto,
    @Request() req: any,
  ) {
    return this.authV2Service.disableTwoFactor(req.user.userId, dto.password, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('two-factor/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get 2FA status' })
  @ApiResponse({ status: 200, description: '2FA status' })
  async getTwoFactorStatus(@Request() req: any) {
    return this.authV2Service.getTwoFactorStatus(req.user.userId);
  }

  // ============ Session Management ============

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active sessions' })
  @ApiResponse({ status: 200, description: 'Active sessions list' })
  async getSessions(@Request() req: any) {
    return this.authV2Service.getUserSessions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  async revokeSession(
    @Body() dto: RevokeSessionDto,
    @Request() req: any,
  ) {
    return this.authV2Service.revokeSession(dto.sessionId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all other sessions' })
  @ApiResponse({ status: 200, description: 'All sessions revoked except current' })
  async revokeOtherSessions(
    @Body() dto: RevokeOtherSessionsDto,
    @Request() req: any,
  ) {
    return this.authV2Service.revokeAllOtherSessions(req.user.userId, dto.currentSessionId);
  }

  // ============ API Key Management ============

  @UseGuards(JwtAuthGuard)
  @Post('api-keys')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created (shown only once)' })
  async createApiKey(
    @Body() dto: CreateApiKeyDto,
    @Request() req: any,
  ) {
    return this.authV2Service.createApiKey(req.user.userId, req.user.companyId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('api-keys')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all API keys' })
  @ApiResponse({ status: 200, description: 'API keys list' })
  async getApiKeys(@Request() req: any) {
    return this.authV2Service.getApiKeys(req.user.userId, req.user.companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('api-keys/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked' })
  async revokeApiKey(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.authV2Service.revokeApiKey(id, req.user.userId);
  }

  // ============ Login Activity ============

  @UseGuards(JwtAuthGuard)
  @Get('login-activity')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get login activity log' })
  @ApiResponse({ status: 200, description: 'Login activity' })
  async getLoginActivity(
    @Query() query: LoginActivityQueryDto,
    @Request() req: any,
  ) {
    return this.authV2Service.getLoginActivity(req.user.userId, query);
  }

  // ============ Security Audit ============

  @UseGuards(JwtAuthGuard)
  @Get('security-audit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get security audit log' })
  @ApiResponse({ status: 200, description: 'Security audit log' })
  async getSecurityAuditLog(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('eventType') eventType: string,
    @Request() req: any,
  ) {
    return this.authV2Service.getSecurityAuditLog(req.user.userId, { page, limit, eventType });
  }

  // ============ Email Verification ============

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authV2Service.verifyEmail(dto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async resendVerification(@Request() req: any) {
    const user = await this.authV2Service['usersService'].findById(req.user.userId);
    if (user) {
      return this.authV2Service.createEmailVerification(req.user.userId, user.email);
    }
    return { message: 'User not found' };
  }

  // ============ Token Blacklisting ============

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(@Headers('authorization') authorization?: string) {
    const token = authorization?.startsWith('Bearer ') ? authorization.substring(7) : undefined;
    if (token) {
      return this.authV2Service.logout(token);
    }
    return { message: 'Logged out successfully' };
  }
}
