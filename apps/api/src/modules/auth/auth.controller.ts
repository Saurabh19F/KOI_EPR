import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsAdminGuard } from './guards/is-admin.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('seed-demo')
  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @ApiOperation({ summary: 'Seed demo users with passwords' })
  @ApiResponse({ status: 200, description: 'Demo users seeded successfully' })
  async seedDemoUsers() {
    return this.authService.seedDemoUsers();
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password for demo users (admin only)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'DEMO_USER_PASSWORD not configured' })
  async resetDemoPasswords() {
    return this.authService.seedDemoUsers();
  }
}
