import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export interface PresignedUploadUrl {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

export interface PresignedDownloadUrl {
  downloadUrl: string;
  key: string;
  expiresIn: number;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
];

const MAX_FILE_SIZES: Record<string, number> = {
  'image/jpeg': 10 * 1024 * 1024, // 10MB
  'image/png': 10 * 1024 * 1024,
  'image/gif': 5 * 1024 * 1024,
  'image/webp': 10 * 1024 * 1024,
  'image/svg+xml': 2 * 1024 * 1024,
  'application/pdf': 25 * 1024 * 1024, // 25MB
  'application/msword': 25 * 1024 * 1024,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 25 * 1024 * 1024,
  'application/vnd.ms-excel': 25 * 1024 * 1024,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 25 * 1024 * 1024,
  'text/plain': 5 * 1024 * 1024,
  'text/csv': 10 * 1024 * 1024,
  'application/zip': 50 * 1024 * 1024,
  'application/x-rar-compressed': 50 * 1024 * 1024,
};

@Injectable()
export class S3Service {
  private s3Client: S3Client | null = null;
  private bucket: string;
  private region: string;
  private endpoint: string | null;
  private forcePathStyle: boolean;
  private useLocalStorage: boolean;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get('AWS_REGION', 'us-east-1');
    this.bucket = this.configService.get('AWS_S3_BUCKET', 'erp-files');
    this.endpoint = this.configService.get('AWS_S3_ENDPOINT', null);
    this.forcePathStyle = this.configService.get('AWS_S3_FORCE_PATH_STYLE', 'false') === 'true';
    this.useLocalStorage = !this.configService.get('AWS_ACCESS_KEY_ID', null);

    if (!this.useLocalStorage) {
      this.s3Client = new S3Client({
        region: this.region,
        endpoint: this.endpoint,
        forcePathStyle: this.forcePathStyle,
        credentials: {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID', ''),
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY', ''),
        },
      });
    }
  }

  validateFile(mimeType: string, fileSize: number): void {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `File type ${mimeType} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    const maxSize = MAX_FILE_SIZES[mimeType] || 10 * 1024 * 1024; // Default 10MB
    if (fileSize > maxSize) {
      throw new BadRequestException(
        `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(0)}MB for ${mimeType}`
      );
    }
  }

  async generateUploadUrl(
    companyId: string,
    moduleName: string,
    fileName: string,
    mimeType: string,
    fileSize: number,
  ): Promise<PresignedUploadUrl> {
    this.validateFile(mimeType, fileSize);

    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const key = `companies/${companyId}/${moduleName}/${uuidv4()}.${ext}`;
    const expiresIn = 3600; // 1 hour

    if (this.useLocalStorage || !this.s3Client) {
      // Return a mock URL for local development
      const baseUrl = this.configService.get('API_URL', 'http://localhost:3001');
      const publicUrl = `${baseUrl}/api/v1/files/local/${encodeURIComponent(key)}`;
      return {
        uploadUrl: publicUrl,
        key,
        publicUrl,
        expiresIn,
      };
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
      Metadata: {
        originalName: Buffer.from(fileName).toString('base64'),
        companyId,
        moduleName,
      },
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
    const publicUrl = this.endpoint
      ? `${this.endpoint}/${this.bucket}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return {
      uploadUrl,
      key,
      publicUrl,
      expiresIn,
    };
  }

  async generateDownloadUrl(key: string): Promise<PresignedDownloadUrl> {
    const expiresIn = 3600; // 1 hour

    if (this.useLocalStorage || !this.s3Client) {
      const baseUrl = this.configService.get('API_URL', 'http://localhost:3001');
      return {
        downloadUrl: `${baseUrl}/api/v1/files/local/${encodeURIComponent(key)}`,
        key,
        expiresIn,
      };
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

    return {
      downloadUrl,
      key,
      expiresIn,
    };
  }

  async deleteFile(key: string): Promise<void> {
    if (this.useLocalStorage || !this.s3Client) {
      return; // Local storage cleanup would be handled differently
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async getFileMetadata(key: string): Promise<{ size: number; lastModified: Date } | null> {
    if (this.useLocalStorage || !this.s3Client) {
      return null;
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return {
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
      };
    } catch {
      return null;
    }
  }

  getPublicUrl(key: string): string {
    if (this.useLocalStorage) {
      const baseUrl = this.configService.get('API_URL', 'http://localhost:3001');
      return `${baseUrl}/api/v1/files/local/${encodeURIComponent(key)}`;
    }

    return this.endpoint
      ? `${this.endpoint}/${this.bucket}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
    if (this.useLocalStorage || !this.s3Client) {
      const uploadDir = path.resolve(process.cwd(), 'uploads');
      const targetPath = path.resolve(uploadDir, key);
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.writeFile(targetPath, buffer);
      return this.getPublicUrl(key);
    }

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));

    return this.getPublicUrl(key);
  }
}
