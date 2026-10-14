import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CurrentUserDto } from '../../common/dto/current-user.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  private validateCompanyAccess(currentUser: CurrentUserDto | undefined, companyId?: string | null) {
    if (!currentUser || currentUser.isSuperAdmin) return;
    if (!companyId || companyId !== currentUser.companyId) {
      throw new ForbiddenException('Access denied to another company');
    }
  }

  async findAll(currentUser?: CurrentUserDto): Promise<Role[]> {
    const where: any = {};
    if (currentUser && !currentUser.isSuperAdmin) {
      where.companyId = currentUser.companyId;
    }

    return this.roleRepository.find({
      where,
      relations: ['permissions'],
      order: { level: 'ASC' },
    });
  }

  async findOne(id: string, currentUser?: CurrentUserDto): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { roleId: id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    this.validateCompanyAccess(currentUser, role.companyId);

    return role;
  }

  async create(data: any, currentUser?: CurrentUserDto): Promise<Role> {
    const { permissionIds, ...roleData } = data;
    if (currentUser && !currentUser.isSuperAdmin) {
      roleData.companyId = currentUser.companyId;
    }
    const role = this.roleRepository.create(roleData as Partial<Role>);
    
    if (permissionIds && permissionIds.length > 0) {
      const permissions = await this.permissionRepository.findByIds(permissionIds);
      role.permissions = permissions;
    }
    
    return this.roleRepository.save(role);
  }

  async update(id: string, data: any, currentUser?: CurrentUserDto): Promise<Role> {
    const role = await this.findOne(id, currentUser);
    const { permissionIds, ...roleData } = data;
    if (currentUser && !currentUser.isSuperAdmin) {
      delete roleData.companyId;
    }
    
    Object.assign(role, roleData);
    
    if (permissionIds !== undefined) {
      if (permissionIds.length > 0) {
        const permissions = await this.permissionRepository.findByIds(permissionIds);
        role.permissions = permissions;
      } else {
        role.permissions = [];
      }
    }
    
    return this.roleRepository.save(role);
  }

  async assignPermissions(roleId: string, permissionIds: string[], currentUser?: CurrentUserDto): Promise<Role> {
    const role = await this.findOne(roleId, currentUser);
    const permissions = await this.permissionRepository.findByIds(permissionIds);
    role.permissions = permissions;
    return this.roleRepository.save(role);
  }

  async getPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { moduleName: 'ASC', permissionCode: 'ASC' },
    });
  }
}
