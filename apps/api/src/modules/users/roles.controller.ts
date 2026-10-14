import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('ADMIN_ROLES')
  @ApiOperation({ summary: 'Get all roles' })
  findAll(@CurrentUser() user: any) {
    return this.rolesService.findAll(user);
  }

  @Get('permissions')
  @Permissions('ADMIN_ROLES')
  @ApiOperation({ summary: 'Get all permissions' })
  getPermissions() {
    return this.rolesService.getPermissions();
  }

  @Get(':id')
  @Permissions('ADMIN_ROLES')
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rolesService.findOne(id, user);
  }

  @Post()
  @Permissions('ADMIN_ROLES')
  @ApiOperation({ summary: 'Create new role' })
  create(@Body() data: { name: string; description?: string; permissionIds?: string[] }, @CurrentUser() user: any) {
    return this.rolesService.create(data, user);
  }

  @Patch(':id/permissions')
  @Permissions('ADMIN_ROLES')
  @ApiOperation({ summary: 'Assign permissions to role' })
  assignPermissions(
    @Param('id') id: string,
    @Body() body: { permissionIds: string[] },
    @CurrentUser() user: any,
  ) {
    return this.rolesService.assignPermissions(id, body.permissionIds, user);
  }
}
