import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Res,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import express from 'express';
import * as IInviteService from '../../application/interface/IInviteService';
import { FileInterceptor } from '@nestjs/platform-express';
import { InviteImportResponse } from '../../application/dto/invite-import.response';
import { FileSizeExceptionFilter } from '../../../../helper/filter_file';
import { UserStatus } from '../../../../domain/enum/enum';
import * as inviteTypes_1 from '../../../../domain/type/invite.types';

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
  downloadTemplate(@Res() res: express.Response) {
    const buffer = this.inviteService.inviteTemplateDownload();

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
  @UseFilters(FileSizeExceptionFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async importInviteExcel(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<InviteImportResponse> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    //Check
    if (!file.originalname.endsWith('.xlsx')) {
      throw new BadRequestException('Only .xlsx files are supported');
    }

    return this.inviteService.importFromExcel(file);
  }

  @Post()
  async importUserInvite(
    @Body() dto: inviteTypes_1.InviteForm,
  ): Promise<UserStatus> {
    return await this.inviteService.inviteSingleUser(dto);
  }
}
