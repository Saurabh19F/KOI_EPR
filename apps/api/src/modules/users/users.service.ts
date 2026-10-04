import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Department } from './entities/department.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { CurrentUserDto } from '../../common/dto/current-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  private validateCompanyAccess(currentUser: CurrentUserDto | undefined, companyId?: string | null) {
    if (!currentUser || currentUser.isSuperAdmin) {
      return;
    }
    if (!companyId) {
      return;
    }
    if (companyId !== currentUser.companyId) {
      throw new ForbiddenException('Access denied to another company');
    }
  }

  private async paginate<T>(
    repo: Repository<T>,
    page: number = 1,
    limit: number = 20,
    where: any = {},
    order: any = { createdAt: 'DESC' },
    relations: string[] = [],
  ): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * limit;
    const [data, total] = await repo.findAndCount({
      where,
      order,
      relations,
      skip,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ========== USERS ==========
  async create(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    departmentId?: string;
    companyId?: string;
    roleIds?: string[];
    isSuperAdmin?: boolean;
  }, currentUser?: CurrentUserDto) {
    // Check if current user can create super admin
    if (data.isSuperAdmin && (!currentUser?.isSuperAdmin)) {
      throw new ForbiddenException('Only super admins can create super admin users');
    }

    // Check email uniqueness
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Determine company ID - use provided, current user's company, or first company for super admin
    let companyId = data.companyId;
    if (currentUser && !currentUser.isSuperAdmin) {
      companyId = currentUser.companyId;
    } else if (!companyId && currentUser?.companyId) {
      companyId = currentUser.companyId;
    }

    const user = this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      departmentId: data.departmentId,
      companyId: companyId,
      isSuperAdmin: data.isSuperAdmin || false,
      createdBy: currentUser?.userId,
      updatedBy: currentUser?.userId,
    });

    const savedUser = await this.userRepository.save(user);

    // Assign roles if provided
    if (data.roleIds && data.roleIds.length > 0) {
      await this.assignRoles(savedUser.userId, data.roleIds, currentUser);
    }

    return this.findOne(savedUser.userId);
  }

  async findAllUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    companyId?: string;
    isActive?: boolean;
  } = {}, currentUser?: CurrentUserDto): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 20, search, departmentId, companyId, isActive } = params;

    const where: any = { deletedAt: IsNull() };

    // Non-super admins can only see users from their company
    if (currentUser && !currentUser.isSuperAdmin) {
      where.companyId = currentUser.companyId;
    } else if (companyId) {
      where.companyId = companyId;
    }

    if (departmentId) where.departmentId = departmentId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.name = ILike(`%${search}%`);
    }

    return this.paginate(
      this.userRepository,
      page,
      limit,
      where,
      { createdAt: 'DESC' },
      ['department', 'role'],
    );
  }

  async findOne(id: string, currentUser?: CurrentUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId: id, deletedAt: IsNull() },
      relations: ['department'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.validateCompanyAccess(currentUser, user.companyId);

    return user;
  }

  async findByEmail(email: string, currentUser?: CurrentUserDto): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
      relations: ['department'],
    });

    if (user) {
      this.validateCompanyAccess(currentUser, user.companyId);
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { userId: id, deletedAt: IsNull() },
      relations: ['department'],
    });
  }

  async findByIdWithRole(id: string): Promise<User | null> {
    // Simple query without joins - permissions will be handled separately
    const user = await this.userRepository.findOne({
      where: { userId: id, deletedAt: IsNull() },
      relations: ['role', 'department'],
    });
    return user;
  }

  async findByEmailWithRole(email: string): Promise<User | null> {
    // Simple query without joins
    const user = await this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
      relations: ['role', 'department'],
    });
    return user;
  }

  async update(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    departmentId?: string;
    isActive?: boolean;
    password?: string;
    preferences?: Record<string, any>;
    avatar?: string;
  }, currentUser?: CurrentUserDto) {
    const user = await this.findOne(id, currentUser);

    if (currentUser && !currentUser.isSuperAdmin) {
      delete (data as any).companyId;
      delete (data as any).isSuperAdmin;
      delete (data as any).roleId;
      delete (data as any).roleIds;
    }

    // Check email uniqueness if changing email
    if (data.email && data.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: data.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    Object.assign(user, {
      ...data,
      updatedBy: currentUser?.userId,
    });

    await this.userRepository.save(user);

    return this.findOne(id);
  }

  async delete(id: string, currentUser?: CurrentUserDto) {
    const user = await this.findOne(id, currentUser);

    // Prevent deleting self
    if (currentUser && user.userId === currentUser.userId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    // Prevent deleting super admin by non-super admin
    if (user.isSuperAdmin && (!currentUser?.isSuperAdmin)) {
      throw new ForbiddenException('Only super admins can delete super admin users');
    }

    user.deletedAt = new Date();
    user.isActive = false;
    user.updatedBy = currentUser?.userId;
    await this.userRepository.save(user);
    return { deleted: true };
  }

  async assignRoles(userId: string, roleIds: string[], currentUser?: CurrentUserDto) {
    const user = await this.findOne(userId, currentUser);

    if (roleIds.length > 0) {
      const rolesToAssign = await this.roleRepository.findByIds(roleIds);
      const hasSuperAdminRole = rolesToAssign.some(r => r.roleCode === 'ADMIN');

      if (hasSuperAdminRole && (!currentUser?.isSuperAdmin)) {
        throw new ForbiddenException('Only super admins can assign admin roles');
      }

      if (currentUser && !currentUser.isSuperAdmin && currentUser.companyId) {
        const crossTenantRole = rolesToAssign.find(r => r.companyId && r.companyId !== currentUser.companyId);
        if (crossTenantRole) {
          throw new ForbiddenException('Cannot assign roles from another company');
        }
      }

      const validRoles = rolesToAssign.filter(r => r.isActive);
      if (validRoles.length === 0) {
        throw new BadRequestException('No valid active roles found');
      }

      user.roleId = validRoles[0].roleId;
    } else {
      user.roleId = null as any;
    }

    user.updatedBy = currentUser?.userId;
    await this.userRepository.save(user);

    return this.findOne(userId);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string, currentUser?: CurrentUserDto) {
    const user = await this.findOne(id, currentUser);

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update(id, {
      password: hashedPassword,
      updatedAt: new Date(),
    });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  }

  async updateLastLogin(userId: string, ipAddress?: string) {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress || null,
    });
  }

  // ========== ROLES ==========
  async findAllRoles(currentUser?: CurrentUserDto, departmentId?: string) {
    const where: any[] = [];
    const base: any = { isActive: true };

    if (currentUser && !currentUser.isSuperAdmin) {
      base.companyId = currentUser.companyId;
    }

    if (departmentId) {
      where.push({ ...base, departmentId });
      where.push({ ...base, departmentId: null as any });
    } else {
      where.push(base);
    }

    return this.roleRepository.find({
      where,
      relations: ['permissions'],
      order: { level: 'ASC' },
    });
  }

  async findRoleById(id: string, currentUser?: CurrentUserDto): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { roleId: id, isActive: true },
    });
    if (!role) throw new NotFoundException('Role not found or inactive');
    this.validateCompanyAccess(currentUser, role.companyId);
    return role;
  }

  async getPermissions() {
    return this.permissionRepository.find({
      order: { moduleName: 'ASC', permissionCode: 'ASC' },
    });
  }

  async createRole(data: {
    roleName: string;
    roleCode: string;
    description?: string;
    level?: number;
    permissionIds?: string[];
    companyId?: string;
  }, currentUser?: CurrentUserDto) {
    // Check role code uniqueness
    const existing = await this.roleRepository.findOne({
      where: { roleCode: data.roleCode },
    });
    if (existing) {
      throw new ConflictException('Role with this code already exists');
    }

    // Determine company ID
    let companyId = data.companyId;
    if (currentUser && !currentUser.isSuperAdmin) {
      companyId = currentUser.companyId;
    } else if (!companyId && currentUser?.companyId) {
      companyId = currentUser.companyId;
    }

    const role = this.roleRepository.create({
      roleName: data.roleName,
      roleCode: data.roleCode,
      description: data.description,
      level: data.level || 3,
      companyId: companyId,
    });

    return this.roleRepository.save(role);
  }

  async updateRole(id: string, data: {
    roleName?: string;
    description?: string;
    isActive?: boolean;
    permissionIds?: string[];
  }, currentUser?: CurrentUserDto) {
    const role = await this.roleRepository.findOne({
      where: { roleId: id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }
    this.validateCompanyAccess(currentUser, role.companyId);

    // Prevent deactivating the last admin role
    if (data.isActive === false && role.roleCode === 'ADMIN') {
      const otherAdmins = await this.roleRepository.count({
        where: { roleCode: 'ADMIN', isActive: true, roleId: id as any },
      });
      if (otherAdmins === 1) {
        throw new BadRequestException('Cannot deactivate the last admin role');
      }
    }

    Object.assign(role, {
      roleName: data.roleName ?? role.roleName,
      description: data.description ?? role.description,
      isActive: data.isActive ?? role.isActive,
    });

    if (data.permissionIds) {
      const permissions = await this.permissionRepository.findByIds(data.permissionIds);
      role.permissions = permissions;
    }

    await this.roleRepository.save(role);

    return this.roleRepository.findOne({
      where: { roleId: id },
      relations: ['permissions'],
    });
  }

  // ========== DEPARTMENTS ==========
  async findAllDepartments(currentUser?: CurrentUserDto) {
    const where: any = { isActive: true };

    // Non-super admins can only see departments from their company
    if (currentUser && !currentUser.isSuperAdmin) {
      where.companyId = currentUser.companyId;
    }

    return this.departmentRepository.find({
      where,
      order: { departmentName: 'ASC' },
    });
  }

  async createDepartment(data: {
    departmentName: string;
    departmentCode: string;
    description?: string;
    headUserId?: string;
    companyId?: string;
  }, currentUser?: CurrentUserDto) {
    // Check department code uniqueness
    const existing = await this.departmentRepository.findOne({
      where: { departmentCode: data.departmentCode },
    });
    if (existing) {
      throw new ConflictException('Department with this code already exists');
    }

    // Determine company ID
    let companyId = data.companyId;
    if (currentUser && !currentUser.isSuperAdmin) {
      companyId = currentUser.companyId;
    } else if (!companyId && currentUser?.companyId) {
      companyId = currentUser.companyId;
    }

    const department = this.departmentRepository.create({
      ...data,
      companyId: companyId,
    });

    return this.departmentRepository.save(department);
  }
}
