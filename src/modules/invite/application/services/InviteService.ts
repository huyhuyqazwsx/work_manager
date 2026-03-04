import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { IInviteService } from '../interface/IInviteService';
import * as userServiceInterface from '../../../user/application/interfaces/user.service.interface';

import { join } from 'path';
import { existsSync } from 'node:fs';
import { readFileSync } from 'fs';

import * as ExcelJS from 'exceljs';
import { InviteForm, InviteImportError } from '@domain/type/invite.types';
import { InviteFormDto } from '../dto/import-invite.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { InviteUsersResult } from '../../../user/application/dto/invite-user-result.dto';
import { InviteImportResponse } from '../dto/invite-import.response';
import { UserStatus } from '@domain/enum/enum';

@Injectable()
export class InviteService implements IInviteService {
  // private readonly logger = new Logger(InviteService.name);

  constructor(
    @Inject('IUserService')
    private readonly userService: userServiceInterface.IUserService,
  ) {}

  inviteTemplateDownload(): Buffer {
    const filePath = join(
      process.cwd(),
      'src',
      'assets',
      'templates',
      'Invite-Sky-template.xlsx',
    );

    if (!existsSync(filePath)) {
      throw new NotFoundException(`Invite template not found`);
    }

    return readFileSync(filePath);
  }

  async inviteSingleUser(invite: InviteForm): Promise<UserStatus> {
    const invites: InviteForm[] = [];
    invites.push(invite);

    const result = await this.userService.inviteUsersFromExcel(invites);

    if (result.PENDING.length > 0) {
      return UserStatus.PENDING;
    } else if (result.ACTIVE.length > 0) {
      return UserStatus.ACTIVE;
    } else if (result.INACTIVE.length > 0) {
      return UserStatus.INACTIVE;
    } else throw new NotFoundException(`User Status not found`);
  }

  async importFromExcel(
    file: Express.Multer.File,
  ): Promise<InviteImportResponse> {
    const sheet = await this.loadSheet(file);

    this.validateHeader(sheet);

    const { validData, errors, total } = await this.validateAllRows(sheet);

    if (errors.length > 0) {
      return new InviteImportResponse(total, 0, errors.length, [], errors);
    }

    const inviteResult = await this.processInvites(validData);

    return new InviteImportResponse(
      total,
      validData.length,
      0,
      validData,
      [],
      inviteResult,
    );
  }

  private async loadSheet(
    file: Express.Multer.File,
  ): Promise<ExcelJS.Worksheet> {
    if (!file?.buffer) {
      throw new BadRequestException('Invalid file buffer');
    }

    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = new Uint8Array(file.buffer).buffer;
    await workbook.xlsx.load(arrayBuffer);

    const sheet = workbook.worksheets[0];

    if (!sheet) {
      throw new BadRequestException('Sheet not found');
    }

    return sheet;
  }

  private validateHeader(sheet: ExcelJS.Worksheet): void {
    const headerRow = sheet.getRow(1);

    const expectedHeaders = [
      'Code',
      'Email',
      'Department',
      'Job Position',
      'Contract Type',
      'Joining Date',
      'Contract Signed Date',
      'Role',
    ];

    const actualHeaders = [
      headerRow.getCell(1).text.trim(),
      headerRow.getCell(2).text.trim(),
      headerRow.getCell(3).text.trim(),
      headerRow.getCell(4).text.trim(),
      headerRow.getCell(5).text.trim(),
      headerRow.getCell(6).text.trim(),
      headerRow.getCell(7).text.trim(),
      headerRow.getCell(8).text.trim(),
    ];

    if (JSON.stringify(expectedHeaders) !== JSON.stringify(actualHeaders)) {
      throw new BadRequestException('Invalid template format');
    }
  }

  private async validateAllRows(sheet: ExcelJS.Worksheet): Promise<{
    validData: InviteForm[];
    errors: InviteImportError[];
    total: number;
  }> {
    const validData: InviteForm[] = [];
    const errors: InviteImportError[] = [];
    let total = 0;

    //Check Duplicate
    const emailMap = new Map<string, { count: number; rows: number[] }>();

    for (let rowNumber = 3; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);

      const code = row.getCell(1).text?.trim();
      const email = row.getCell(2).text.trim();
      const department = row.getCell(3).text.trim();
      const position = row.getCell(4).text?.trim();
      const contractType = row.getCell(5).text.trim();
      const joinDate = row.getCell(6).value as Date;
      const contractSignedDate = row.getCell(7).value as Date | undefined;
      const role = row.getCell(8).text.trim();

      // Skip empty rows
      if (!email && !department && !contractType && !joinDate && !role) {
        continue;
      }

      total++;

      const dto = plainToInstance(InviteFormDto, {
        employeeCode: code,
        email,
        department,
        position,
        contractType,
        joinDate,
        contractSignedDate,
        role,
      });

      const validationErrors = await validate(dto);

      if (validationErrors.length > 0) {
        validationErrors.forEach((err) => {
          const field = err.property as InviteImportError['field'];
          const value = dto[field as keyof InviteFormDto];

          if (err.constraints) {
            Object.values(err.constraints).forEach((message) => {
              errors.push({
                row: rowNumber,
                field,
                email,
                value,
                reason: message,
              });
            });
          }
        });
      } else {
        // Duplicate email
        if (email) {
          const normalizedEmail = email.toLowerCase();

          if (!emailMap.has(normalizedEmail)) {
            emailMap.set(normalizedEmail, { count: 0, rows: [] });
          }

          const entry = emailMap.get(normalizedEmail)!;
          entry.count++;
          entry.rows.push(rowNumber);
        }

        // Valid data
        validData.push({
          employeeCode: dto.employeeCode,
          email: dto.email,
          department: dto.department,
          position: dto.position,
          contractType: dto.contractType,
          joinDate: dto.joinDate,
          contractSignedDate: dto.contractSignedDate,
          role: dto.role,
        });
      }
    }

    //Handle
    for (const [email, entry] of emailMap) {
      if (entry.count > 1) {
        for (const rowNumber of entry.rows) {
          errors.push({
            row: rowNumber,
            field: 'email',
            email,
            value: email,
            reason: `Duplicate email. Appears ${entry.count} times in rows: ${entry.rows.join(', ')}`,
          });
        }
      }
    }

    return { validData, errors, total };
  }

  private async processInvites(
    invites: InviteForm[],
  ): Promise<InviteUsersResult> {
    return await this.userService.inviteUsersFromExcel(invites);
  }
}
