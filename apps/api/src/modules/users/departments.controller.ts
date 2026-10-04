import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @Permissions('ADMIN_SETTINGS')
  findAll(@CurrentUser() user: any) {
    return this.departmentsService.findAll(user);
  }

  @Get(':id')
  @Permissions('ADMIN_SETTINGS')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.departmentsService.findOne(id, user);
  }

  @Post()
  @Permissions('ADMIN_SETTINGS')
  create(@Body() data: { code: string; name: string; description?: string }, @CurrentUser() user: any) {
    return this.departmentsService.create(data, user);
  }
}
