import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ========== USERS ==========
  @Post()
  @Permissions('ADMIN_USERS')
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() data: any, @CurrentUser() user: any) {
    return this.usersService.create(data, user);
  }

  @Get()
  @Permissions('ADMIN_USERS')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('isActive') isActive?: boolean,
    @CurrentUser() user?: any,
  ) {
    return this.usersService.findAllUsers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      departmentId,
      isActive,
    }, user);
  }

  // ========== ROLES ==========
  @Get('roles/permissions')
  @Permissions('ADMIN_ROLES')
  @ApiOperation({ summary: 'Get all permissions' })
  getPermissions() {
    return this.usersService.getPermissions();
  }

  @Get('roles')
  @Permissions('ADMIN_ROLES')
  @ApiOperation({ summary: 'Get all roles, optionally filtered by department' })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  getRoles(@Query('departmentId') departmentId: string, @CurrentUser() user: any) {
    return this.usersService.findAllRoles(user, departmentId);
  }

  @Get('roles/:id')
  @Permissions('ADMIN_ROLES')
  @ApiOperation({ summary: 'Get role by ID' })
  getRole(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findRoleById(id, user);
  }

  @Post('roles')
  @Permissions('ADMIN_ROLES')
  @ApiOperation({ summary: 'Create a new role' })
  createRole(@Body() data: any, @CurrentUser() user: any) {
    return this.usersService.createRole(data, user);
  }

  @Patch('roles/:id')
  @Permissions('ADMIN_ROLES')
  @ApiOperation({ summary: 'Update a role' })
  updateRole(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    return this.usersService.updateRole(id, data, user);
  }

  // ========== DEPARTMENTS ==========
  @Get('departments')
  @Permissions('ADMIN_SETTINGS')
  @ApiOperation({ summary: 'Get all departments' })
  getDepartments(@CurrentUser() user: any) {
    return this.usersService.findAllDepartments(user);
  }

  @Post('departments')
  @Permissions('ADMIN_SETTINGS')
  @ApiOperation({ summary: 'Create a new department' })
  createDepartment(@Body() data: any, @CurrentUser() user: any) {
    return this.usersService.createDepartment(data, user);
  }

  // ========== INDIVIDUAL USERS (Wildcards at the bottom) ==========
  @Get('email/:email')
  @Permissions('ADMIN_USERS')
  @ApiOperation({ summary: 'Get user by email' })
  findByEmail(@Param('email') email: string, @CurrentUser() user: any) {
    return this.usersService.findByEmail(email, user);
  }

  @Get(':id')
  @Permissions('ADMIN_USERS')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOne(id, user);
  }

  @Patch(':id')
  @Permissions('ADMIN_USERS')
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    return this.usersService.update(id, data, user);
  }

  @Patch(':id/change-password')
  @Permissions('ADMIN_USERS')
  @ApiOperation({ summary: 'Change user password' })
  changePassword(
    @Param('id') id: string,
    @Body() body: { currentPassword: string; newPassword: string },
    @CurrentUser() user: any,
  ) {
    return this.usersService.changePassword(id, body.currentPassword, body.newPassword, user);
  }

  @Patch(':id/assign-roles')
  @Permissions('ADMIN_ROLES')
  @ApiOperation({ summary: 'Assign roles to user' })
  assignRoles(@Param('id') id: string, @Body() body: { roleIds: string[] }, @CurrentUser() user: any) {
    return this.usersService.assignRoles(id, body.roleIds, user);
  }

  @Delete(':id')
  @Permissions('ADMIN_USERS')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a user (soft delete)' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.delete(id, user);
  }
}
