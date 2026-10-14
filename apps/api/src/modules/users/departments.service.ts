import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CurrentUserDto } from '../../common/dto/current-user.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,
  ) {}

  private validateCompanyAccess(currentUser: CurrentUserDto | undefined, companyId?: string | null) {
    if (!currentUser || currentUser.isSuperAdmin) return;
    if (!companyId || companyId !== currentUser.companyId) {
      throw new ForbiddenException('Access denied to another company');
    }
  }

  async findAll(currentUser?: CurrentUserDto): Promise<Department[]> {
    const where: any = { isActive: true };
    if (currentUser && !currentUser.isSuperAdmin) {
      where.companyId = currentUser.companyId;
    }

    return this.departmentRepo.find({
      where,
      order: { departmentName: 'ASC' },
    });
  }

  async findOne(id: string, currentUser?: CurrentUserDto): Promise<Department> {
    const department = await this.departmentRepo.findOne({
      where: { departmentId: id },
    });
    this.validateCompanyAccess(currentUser, department?.companyId);
    return department;
  }

  async create(data: Partial<Department>, currentUser?: CurrentUserDto): Promise<Department> {
    if (currentUser && !currentUser.isSuperAdmin) {
      data.companyId = currentUser.companyId;
    }
    const dept = this.departmentRepo.create(data);
    return this.departmentRepo.save(dept);
  }

  async update(id: string, data: Partial<Department>): Promise<Department> {
    await this.departmentRepo.update(id, data);
    return this.findOne(id);
  }
}
