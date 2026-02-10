import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Inject,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import express from 'express';
import * as XLSX from 'xlsx';
import * as IInviteService from '../../application/interface/IInviteService';
import { InviteImportResult } from '../../../../domain/type/invite.types';

@ApiTags('Invites')
@ApiBearerAuth()
@Controller('invites')
export class InviteController {
  constructor(
    @Inject('IInviteService')
    private readonly inviteService: IInviteService.IInviteService,
  ) {}

  /* ================= DOWNLOAD EXCEL TEMPLATE ================= */

  @Get('template')
  @ApiOperation({ summary: 'Download invite Excel template' })
  downloadTemplate(@Res() res: express.Response) {
    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.json_to_sheet([
      {
        email: 'user@company.com',
        role: 'EMPLOYEE',
      },
    ]);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invites');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=invite_template.xlsx',
    );

    res.send(buffer);
  }

  /* ================= IMPORT EXCEL ================= */

  @Post('import')
  @ApiOperation({ summary: 'Import invite list from Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importInviteExcel(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<InviteImportResult> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.inviteService.importFromExcel(file);
  }
}
