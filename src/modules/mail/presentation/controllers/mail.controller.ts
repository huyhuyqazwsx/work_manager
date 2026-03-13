import { Body, Controller, Inject, Post } from '@nestjs/common';
import * as mailServiceInterface_1 from '../../application/interfaces/mail.service.interface';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SendVerificationMailDto } from '../../application/dto/send-verification-mail.dto';
import { SendMailDto } from '../../application/dto/send-mail.dto';
import { SendLeaveRequestMailDto } from '../../application/dto/send-leave-request-mail.dto';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  constructor(
    @Inject('IMailService')
    private mailService: mailServiceInterface_1.IMailService,
  ) {}

  @Post('send-verification')
  @ApiOperation({ summary: 'Send verification email' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  async sendVerification(@Body() dto: SendVerificationMailDto) {
    await this.mailService.sendVerificationEmail(
      dto.email,
      dto.verificationToken,
    );

    return {
      success: true,
      message: 'Verification email sent',
    };
  }

  @Post('send-raw')
  @ApiOperation({ summary: 'Send custom email' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  async sendRaw(@Body() dto: SendMailDto) {
    await this.mailService.sendRawEmail(dto.to, dto.subject, dto.html);

    return {
      success: true,
      message: 'Email sent',
    };
  }

  @Post('send-leave-request')
  @ApiOperation({ summary: 'Send leave request notification email' })
  async sendLeaveRequest(@Body() dto: SendLeaveRequestMailDto) {
    await this.mailService.sendLeaveRequest(
      dto.to,
      {
        employeeName: dto.employeeName,
        employeeCode: dto.employeeCode,
        departmentName: dto.departmentName,
        leaveTypeCode: dto.leaveTypeCode,

        fromDate: dto.fromDate,
        toDate: dto.toDate,
        fromSession: dto.fromSession,
        toSession: dto.toSession,

        totalDays: dto.totalDays,
        reason: dto.reason,

        managerName: dto.managerName,
        actionLink: dto.actionLink,
      },
      dto.cc,
    );

    return {
      success: true,
      message: 'Leave request email sent',
    };
  }
}
