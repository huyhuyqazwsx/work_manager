import { Inject, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

import { IInviteService } from '../interface/IInviteService';
import * as userServiceInterface from '../../../user/application/interfaces/user.service.interface';
import { InviteFormSchema } from '../../../../domain/form/invite-form.schema';
import { UserRole } from '../../../../domain/enum/enum';
import {
  formatDate,
  toSafeString,
  validateEmail,
  validateHireDate,
  validateRole,
} from '../../../../helper/invite-validation.helper';
import {
  InviteForm,
  InviteImportError,
  InviteImportResult,
} from '../../../../domain/type/invite.types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class InviteService implements IInviteService {
  // private readonly logger = new Logger(InviteService.name);

  constructor(
    @Inject('IUserService')
    private readonly userService: userServiceInterface.IUserService,
  ) {}

  async inviteTemplateDownload(): Promise<Buffer> {
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invite Template', {
      views: [{ state: 'frozen', ySplit: 2 }], // Freeze first 2 rows
    });

    // Get headers from schema
    const headers = Object.keys(InviteFormSchema);

    // Get example data
    const exampleRow = Object.entries(InviteFormSchema).map(([, config]) => {
      return config.example ?? '';
    });

    // ===== ROW 1: EXAMPLE DATA =====
    const row1 = worksheet.getRow(1);
    row1.values = exampleRow;
    row1.height = 28;

    // Style for example row
    row1.eachCell((cell) => {
      cell.font = {
        name: 'Calibri',
        size: 11,
        italic: true,
        color: { argb: 'FF595959' }, // Gray text
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }, // Light gray background
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      };
    });

    // ===== ROW 2: HEADERS =====
    const row2 = worksheet.getRow(2);
    row2.values = headers;
    row2.height = 36;

    // Style for header row
    row2.eachCell((cell) => {
      cell.font = {
        name: 'Calibre',
        size: 12,
        bold: true,
        color: { argb: 'FFFFFFFF' }, // White text
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }, // Professional blue
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });

    // ===== COLUMN WIDTHS =====
    worksheet.columns = [
      { key: 'email', width: 35 },
      { key: 'role', width: 20 },
      { key: 'hireDate', width: 18 },
      { key: 'departmentCode', width: 24 },
    ];

    // ===== OPTIONAL: ADD DATA VALIDATION FOR FUTURE ROWS =====
    // Example: Date validation for hireDate column
    worksheet
      .getColumn(3)
      .eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        if (rowNumber > 2) {
          // Skip example and header rows
          cell.dataValidation = {
            type: 'date',
            operator: 'greaterThan',
            formulae: [new Date(2000, 0, 1)],
            showErrorMessage: true,
            errorTitle: 'Invalid Date',
            error: 'Please enter a valid date (YYYY-MM-DD)',
          };
        }
      });

    // ===== WORKBOOK PROPERTIES =====
    workbook.creator = 'Sky Global';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.title = 'Employee Invite Template';
    workbook.subject = 'Employee Onboarding';

    // ===== GENERATE BUFFER =====
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  async importFromExcel(
    file: Express.Multer.File,
  ): Promise<InviteImportResult> {
    // 1. CHECK FILE SIZE
    if (file.size > MAX_FILE_SIZE) {
      return {
        total: 0,
        success: 0,
        failed: 1,
        validData: [],
        errors: [
          {
            row: 0,
            field: 'file',
            reason: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          },
        ],
      };
    }

    const validData: InviteForm[] = [];
    const allErrors: InviteImportError[] = [];
    let totalRows = 0;

    try {
      // 2. LOAD EXCEL
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = new Uint8Array(file.buffer).buffer;
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return {
          total: 0,
          success: 0,
          failed: 1,
          validData: [],
          errors: [
            {
              row: 0,
              field: 'file',
              reason: 'No worksheet found in Excel file',
            },
          ],
        };
      }

      // 3. VALIDATE ROWS
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= 2) return; // Skip example + header

        totalRows++;

        const values = row.values as unknown[];
        const [, email, role, hireDate, departmentCode] = values;

        const errors: InviteImportError[] = [];

        // Validate using helpers
        const emailError = validateEmail(email, rowNumber);
        if (emailError) errors.push(emailError);

        const roleError = validateRole(role, rowNumber);
        if (roleError) errors.push(roleError);

        const dateError = validateHireDate(hireDate, rowNumber);
        if (dateError) errors.push(dateError);

        // Add to validData or errors
        if (errors.length === 0) {
          validData.push({
            email: toSafeString(email).trim(),
            role: toSafeString(role).trim().toUpperCase() as UserRole,
            hireDate: formatDate(hireDate),
            departmentCode: departmentCode
              ? toSafeString(departmentCode).trim()
              : undefined,
          });
        } else {
          allErrors.push(...errors);
        }
      });

      if (totalRows === 0) {
        allErrors.push({ row: 0, field: 'file', reason: 'No data rows found' });
      }

      return {
        total: totalRows,
        success: validData.length,
        failed: allErrors.length,
        validData,
        errors: allErrors,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to parse Excel';
      return {
        total: 0,
        success: 0,
        failed: 1,
        validData: [],
        errors: [{ row: 0, field: 'file', reason: errorMessage }],
      };
    }
  }
}
