import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { S3Service } from './s3.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly s3Service: S3Service,
  ) {}

  private resolveUploadPath(key: string): string | null {
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    const targetPath = path.resolve(uploadDir, key);
    const isInsideUploadDir = targetPath === uploadDir || targetPath.startsWith(uploadDir + path.sep);

    return isInsideUploadDir ? targetPath : null;
  }

  @Post('presigned-upload')
  @ApiOperation({ summary: 'Generate presigned URL for direct upload' })
  async generatePresignedUpload(
    @Body() body: {
      fileName: string;
      mimeType: string;
      fileSize: number;
      moduleName: string;
    },
    @Req() req: Request,
  ) {
    const companyId = (req.user as any)?.companyId || 'default';

    const presignedData = await this.s3Service.generateUploadUrl(
      companyId,
      body.moduleName,
      body.fileName,
      body.mimeType,
      body.fileSize,
    );

    return {
      success: true,
      data: presignedData,
    };
  }

  @Post('confirm-upload')
  @ApiOperation({ summary: 'Confirm file upload after presigned URL upload' })
  async confirmUpload(
    @Body() body: {
      storageKey: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
      moduleName: string;
      recordId: string;
    },
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.userId || 'system';
    const companyId = (req.user as any)?.companyId || 'default';

    const file = await this.filesService.saveFile({
      companyId,
      entityType: body.moduleName,
      entityId: body.recordId,
      fileName: body.fileName,
      fileUrl: this.s3Service.getPublicUrl(body.storageKey),
      fileSize: body.fileSize,
      mimeType: body.mimeType,
      uploadedBy: userId,
      isActive: true,
    });

    return {
      success: true,
      data: file,
      storageKey: body.storageKey,
    };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Direct file upload (alternative to presigned)' })
  async upload(
    @Body() body: {
      entityType: string;
      entityId: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    },
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.userId || 'system';
    const companyId = (req.user as any)?.companyId || 'default';

    const file = await this.filesService.saveFile({
      companyId,
      entityType: body.entityType,
      entityId: body.entityId,
      fileName: body.fileName,
      fileUrl: body.fileUrl,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
      uploadedBy: userId,
      isActive: true,
    });

    return {
      success: true,
      data: file,
    };
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get files for an entity' })
  async getByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const files = await this.filesService.findByEntity(entityType, entityId);
    return {
      success: true,
      data: files,
    };
  }

  @Get('presigned-download/:fileId')
  @ApiOperation({ summary: 'Generate presigned download URL' })
  async generatePresignedDownload(@Param('fileId') fileId: string) {
    const file = await this.filesService.getFile(fileId);
    if (!file) {
      return {
        success: false,
        message: 'File not found',
      };
    }

    const downloadData = await this.s3Service.generateDownloadUrl(fileId);
    return {
      success: true,
      data: downloadData,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update file metadata' })
  async updateFile(
    @Param('id') id: string,
    @Body() body: { fileName?: string; fileUrl?: string },
  ) {
    const file = await this.filesService.updateFile(id, body);
    return {
      success: true,
      data: file,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Param('id') id: string) {
    const file = await this.filesService.getFile(id);
    if (file) {
      // Delete from S3 if we have a fileUrl
      if (file.fileUrl) {
        try {
          await this.s3Service.deleteFile(file.fileId);
        } catch (e) {
          // Ignore S3 delete errors
        }
      }
    }
    await this.filesService.deleteFile(id);
    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate file type and size' })
  @ApiQuery({ name: 'mimeType', required: true })
  @ApiQuery({ name: 'fileSize', required: true })
  async validateFile(
    @Query('mimeType') mimeType: string,
    @Query('fileSize') fileSize: string,
  ) {
    try {
      this.s3Service.validateFile(mimeType, parseInt(fileSize, 10));
      return {
        success: true,
        valid: true,
      };
    } catch (error) {
      return {
        success: true,
        valid: false,
        message: (error as Error).message,
      };
    }
  }

  @Put('local/*')
  @ApiOperation({ summary: 'Upload file to local dev storage' })
  async uploadLocalFile(@Req() req: Request, @Res() res: Response) {
    const rawUrl = req.url;
    const localIdx = rawUrl.indexOf('/local/');
    if (localIdx === -1) {
      return res.status(400).json({ success: false, message: 'Invalid local upload path' });
    }
    const key = decodeURIComponent(rawUrl.substring(localIdx + 7));
    const targetPath = this.resolveUploadPath(key);
    if (!targetPath) {
      return res.status(400).json({ success: false, message: 'Invalid local upload path' });
    }

    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });

    const fileStream = fs.createWriteStream(targetPath);
    req.pipe(fileStream);

    fileStream.on('finish', () => {
      res.status(200).send('OK');
    });

    fileStream.on('error', (err) => {
      res.status(500).json({ success: false, message: err.message });
    });
  }

  @Get('local/*')
  @ApiOperation({ summary: 'Serve file from local dev storage' })
  async serveLocalFile(@Req() req: Request, @Res() res: Response) {
    const rawUrl = req.url;
    const localIdx = rawUrl.indexOf('/local/');
    if (localIdx === -1) {
      return res.status(400).json({ success: false, message: 'Invalid local file path' });
    }
    const key = decodeURIComponent(rawUrl.substring(localIdx + 7));
    const targetPath = this.resolveUploadPath(key);
    if (!targetPath) {
      return res.status(400).json({ success: false, message: 'Invalid local file path' });
    }

    if (!fs.existsSync(targetPath)) {
      return res.status(404).send('File not found');
    }

    res.sendFile(targetPath);
  }
}
