import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { S3Service } from './s3.service';
import { FileEntity } from './entities/file.entity';
import { Attachment } from './entities/attachment.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity, Attachment]),
  ],
  controllers: [FilesController],
  providers: [FilesService, S3Service],
  exports: [FilesService, S3Service],
})
export class FilesModule {}
