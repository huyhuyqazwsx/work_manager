import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService implements OnModuleInit {
  private supabase!: SupabaseClient;
  private readonly BUCKET = 'leave-attachments';
  private readonly logger = new Logger('StorageService');

  constructor(private configService: ConfigService) {}

  onModuleInit(): void {
    const url = this.configService.get<string>('supabase.url');
    const key = this.configService.get<string>('supabase.serviceRoleKey');

    if (!url || !key) {
      throw new Error('Missing Supabase config: url or serviceRoleKey');
    }

    this.supabase = createClient(url, key) as SupabaseClient;
    void this.ensureBucketExists();
  }

  async uploadImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.mimetype)) {
      throw new InternalServerErrorException('Only image files are allowed');
    }

    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;

    const { data, error } = await this.supabase.storage
      .from(this.BUCKET)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      const message =
        typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Upload failed';
      throw new InternalServerErrorException(message);
    }

    if (!data) throw new InternalServerErrorException('Upload failed');

    return this.getPublicUrl(data.path);
  }

  getPublicUrl(path: string): string {
    const result = this.supabase.storage
      .from(this.BUCKET)
      .getPublicUrl(path) as { data: { publicUrl: string } };

    return result.data.publicUrl;
  }

  async deleteImage(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.BUCKET)
      .remove([path]);

    if (error) {
      const message =
        typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Delete failed';
      throw new InternalServerErrorException(message);
    }
  }

  async saveLocal(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string; absPath: string }> {
    const uploadDir = path.join(process.cwd(), 'uploads', userId);
    await fs.mkdir(uploadDir, { recursive: true });

    const fileName = `${randomUUID()}-${file.originalname}`;
    const absPath = path.join(uploadDir, fileName);
    await fs.writeFile(absPath, file.buffer);

    const baseUrl = this.configService.get<string>('app.baseUrl');
    const url = `${baseUrl}/uploads/${userId}/${fileName}`;

    return { url, absPath };
  }

  async uploadFromLocal(localPath: string): Promise<string> {
    const buffer = await fs.readFile(localPath); // đọc được vì là absolute path
    const fileName = path.basename(localPath);
    const parts = localPath.split(path.sep);
    const userId = parts[parts.length - 2];

    const file: Express.Multer.File = {
      buffer,
      originalname: fileName,
      mimetype: this.getMimeType(fileName),
    } as Express.Multer.File;

    return this.uploadImage(userId, file);
  }

  //==========Private===========
  private async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets, error } =
        await this.supabase.storage.listBuckets();

      if (error) {
        this.logger.warn(`Failed to list buckets: ${String(error.message)}`);
        return;
      }

      const exists = buckets?.some((b) => b.name === this.BUCKET);
      if (exists) return;

      const { error: createError } = await this.supabase.storage.createBucket(
        this.BUCKET,
        {
          public: true,
          fileSizeLimit: 5242880,
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        },
      );

      if (createError) {
        this.logger.warn(
          `Failed to create bucket: ${String(createError.message)}`,
        );
        return;
      }

      this.logger.log(`Bucket "${this.BUCKET}" created successfully`);
    } catch (err) {
      this.logger.warn(
        'Supabase storage unavailable, will fallback to local',
        err,
      );
    }
  }
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();

    if (ext === '.pdf') return 'application/pdf';
    if (ext === '.png') return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';

    return 'application/octet-stream';
  }
}
