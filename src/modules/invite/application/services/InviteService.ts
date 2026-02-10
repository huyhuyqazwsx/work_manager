import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import * as XLSX from 'xlsx';

import {
  InviteExcelRow,
  InviteImportResult,
} from '../../../../domain/type/invite.types';

import { IInviteService } from '../interface/IInviteService';
import * as userServiceInterface from '../../../user/application/interfaces/user.service.interface';
import { UserRole } from '../../../../domain/enum/enum';

@Injectable()
export class InviteService implements IInviteService {
  // private readonly logger = new Logger(InviteService.name);

  constructor(
    @Inject('IUserService')
    private readonly userService: userServiceInterface.IUserService,
  ) {}

  async importFromExcel(
    file: Express.Multer.File,
  ): Promise<InviteImportResult> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets['Invites'];

    if (!sheet) {
      throw new BadRequestException('Sheet "Invites" not found');
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false,
    });

    const result: InviteImportResult = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];

      try {
        const row = this.validateRow(rawRow);
        await this.userService.createPendingUserAndSendInvite(
          row.email,
          row.role,
        );
        result.success++;
      } catch (error) {
        result.failed++;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const emailValue =
          typeof rawRow['email'] === 'string' ? rawRow['email'] : undefined;

        result.errors.push({
          row: i + 2, // +2 vì header là row 1
          email: emailValue,
          reason: errorMessage,
        });
      }
    }

    return result;
  }

  /* ================= VALIDATION ================= */

  validateRow(row: Record<string, unknown>): InviteExcelRow {
    const emailRaw = row['email'];
    const roleRaw = row['role'];

    const email =
      typeof emailRaw === 'string' || typeof emailRaw === 'number'
        ? String(emailRaw).trim()
        : '';

    const role =
      typeof roleRaw === 'string' || typeof roleRaw === 'number'
        ? String(roleRaw).trim().toUpperCase()
        : '';

    if (!email) {
      throw new Error('Email is required');
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new Error(
        `Invalid role. Allowed: ${Object.values(UserRole).join(', ')}`,
      );
    }

    return {
      email,
      role: role as UserRole,
    };
  }

  private isValidEmail(email: string): boolean {
    return /^\S+@\S+\.\S+$/.test(email);
  }
}
