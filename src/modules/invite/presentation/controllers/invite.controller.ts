import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import express from 'express';
import * as IInviteService from '../../application/interface/IInviteService';
import { FileInterceptor } from '@nestjs/platform-express';
import { InviteImportResult } from '../../../../domain/type/invite.types';

@ApiTags('Invites')
@ApiBearerAuth()
@Controller('invites')
export class InviteController {
  constructor(
    @Inject('IInviteService')
    private readonly inviteService: IInviteService.IInviteService,
  ) {}

  @Get('template')
  @ApiOperation({ summary: 'Download invite Excel template' })
  async downloadTemplate(@Res() res: express.Response) {
    const buffer = await this.inviteService.inviteTemplateDownload();

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

  @Post('import')
  @ApiOperation({ summary: 'Import invite list from Excel (.xlsx)' })
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

    // Optional: quick mime / extension guard
    if (!file.originalname.endsWith('.xlsx')) {
      throw new BadRequestException('Only .xlsx files are supported');
    }

    return this.inviteService.importFromExcel(file);
  }
}
