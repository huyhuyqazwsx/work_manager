import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService implements OnModuleInit {
  private supabase!: SupabaseClient;
  private readonly BUCKET = 'leave-attachments';

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
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
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

  //==========Private===========
  private async ensureBucketExists(): Promise<void> {
    const { data: buckets, error } = await this.supabase.storage.listBuckets();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to list buckets: ${String(error.message)}`,
      );
    }

    const exists = buckets?.some((b) => b.name === this.BUCKET);
    if (exists) return;

    const { error: createError } = await this.supabase.storage.createBucket(
      this.BUCKET,
      {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ],
      },
    );

    if (createError) {
      throw new InternalServerErrorException(
        `Failed to create bucket: ${String(createError.message)}`,
      );
    }
  }
}
