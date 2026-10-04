import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Department } from './entities/department.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission, Department])],
  controllers: [UsersController, RolesController, DepartmentsController],
  providers: [UsersService, RolesService, DepartmentsService],
  exports: [UsersService, RolesService, DepartmentsService],
})
export class UsersModule {}
