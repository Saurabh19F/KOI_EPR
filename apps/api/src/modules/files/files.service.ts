import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from './entities/file.entity';
import { Attachment } from './entities/attachment.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
  ) {}

  async saveFile(fileData: Partial<FileEntity>): Promise<FileEntity> {
    const file = this.fileRepository.create(fileData);
    return this.fileRepository.save(file);
  }

  async findByEntity(entityType: string, entityId: string): Promise<FileEntity[]> {
    return this.fileRepository.find({
      where: { entityType, entityId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getFile(id: string): Promise<FileEntity | null> {
    return this.fileRepository.findOne({ where: { fileId: id } });
  }

  async updateFile(id: string, data: Partial<FileEntity>): Promise<FileEntity | null> {
    await this.fileRepository.update({ fileId: id }, data);
    return this.getFile(id);
  }

  async deleteFile(id: string): Promise<void> {
    await this.fileRepository.update(id, { isActive: false });
  }

  async saveAttachment(data: Partial<Attachment>): Promise<Attachment> {
    const attachment = this.attachmentRepository.create(data);
    return this.attachmentRepository.save(attachment);
  }

  async findAttachments(moduleName: string, recordId: string): Promise<Attachment[]> {
    return this.attachmentRepository.find({
      where: { moduleName, recordId, isActive: true },
      order: { uploadedAt: 'DESC' },
    });
  }

  async deleteAttachment(id: string): Promise<void> {
    await this.attachmentRepository.update(id, { isActive: false });
  }

  async countByEntity(entityType: string, entityId: string): Promise<number> {
    return this.fileRepository.count({
      where: { entityType, entityId, isActive: true },
    });
  }
}
