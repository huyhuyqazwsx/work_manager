import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Post,
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
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
import { FileSizeExceptionFilter } from '@helper/filters/file-size.filter';
import { UserRole, UserStatus } from '@domain/enum/enum';
import * as inviteTypes_1 from '../../../../domain/type/invite.types';
import { AppError, AppException } from '@domain/errors';
import { AccessTokenGuard } from '@modules/jwt/guards/access-token.guard';
import { RolesGuard } from '@modules/jwt/guards/roles.guard';
import { Roles } from '@modules/jwt/decorators/roles.decorator';

@UseGuards(AccessTokenGuard, RolesGuard)
@ApiTags('Invites')
@ApiBearerAuth()
@Roles(UserRole.HR)
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
      throw new AppException(
        AppError.BAD_REQUEST,
        'File is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    //Check
    if (!file.originalname.endsWith('.xlsx')) {
      throw new AppException(
        AppError.BAD_REQUEST,
        'Only .xlsx files are supported',
        HttpStatus.BAD_REQUEST,
      );
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
