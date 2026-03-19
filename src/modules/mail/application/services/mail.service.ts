import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { IMailService } from '../interfaces/mail.service.interface';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { VerificationEmailTemplate } from '../templates/verification-email.template';
import { buildLeaveRequestTemplate } from '../templates/leave-request-email.template';
import { BaseCrudService } from '@infra/crudservice/base-crud.service';
import { EmailQueue } from '@domain/entities/email-queue.entity';
import { EmailType } from '@domain/enum/enum';
import { InviteEmailPayload } from '@modules/mail/helper/mail-helper';
import * as cacheRepositoryInterface from '@domain/cache/cache.repository.interface';
import * as emailQueueRepositoryInterface from '@modules/mail/domain/email-queue.repository.interface';
import {
  LeaveRequestEmailPayload,
  LeaveStatusEmailPayload,
} from '@domain/type/mail.types';
import { AppError, AppException } from '@domain/errors';
import {
  buildLeaveApprovedTemplate,
  buildLeaveCancelledTemplate,
  buildLeaveRejectedTemplate,
} from '@modules/mail/application/templates/leave-status-email.template';

@Injectable()
export class MailService
  extends BaseCrudService<EmailQueue>
  implements IMailService
{
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter<SMTPTransport.SentMessageInfo>;
  constructor(
    private configService: ConfigService,
    @Inject('IEmailQueueRepository')
    protected repository: emailQueueRepositoryInterface.IEmailQueueRepository,
    @Inject('ICacheRepository')
    private readonly cache: cacheRepositoryInterface.ICacheRepository,
  ) {
    super(repository);

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('smtp.host'),
      port: this.configService.get<number>('smtp.port'),
      secure: false,
      auth: {
        user: this.configService.get<string>('smtp.user'),
        pass: this.configService.get<string>('smtp.pass'),
      },
    });
    this.logger.log('Mail service initialized');
  }

  async sendLeaveRequest(
    to: string | string[],
    params: LeaveRequestEmailPayload,
    cc?: string | string[],
  ): Promise<void> {
    const subject = `[SkyCorp HRM] ${params.departmentName} - ${params.employeeName} nghỉ phép ${params.fromDate} → ${params.toDate}`;

    const html = buildLeaveRequestTemplate(params);

    try {
      const info = await this.transporter.sendMail({
        from: `"SkyCorp HRM" <${this.configService.get<string>('smtp.user')}>`,
        to,
        cc,
        subject,
        html,
      });

      this.logger.log(`Leave request email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send leave request email`, error as Error);
      throw new AppException(
        AppError.INTERNAL_ERROR,
        'Failed to send leave request email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    const subject = 'Welcome to our company';
    const html = `
      <h1>Welcome ${userName}!</h1>
      <p>Your account has been successfully verified.</p>
      <p>You can now start using our platform.</p>
    `;
    await this.sendRawEmail(email, subject, html);
    this.logger.log(`Welcome email sent to: ${email}`);
  }

  async sendVerificationEmail(
    email: string,
    verificationToken: string,
  ): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ||
      'http://localhost:4200';
    const verificationLink = `${frontendUrl}/auth/verify?token=${verificationToken}`;

    const ttlSeconds =
      this.configService.get<number>('redis.ttl.verification') || 172800;

    const expiresInHours = Math.floor(ttlSeconds / 3600);

    const userName = email.split('@')[0];

    const subject = VerificationEmailTemplate.getSubject();
    const html = VerificationEmailTemplate.getHtml({
      userName,
      verificationLink,
      expiresInHours,
    });

    await this.sendRawEmail(email, subject, html);

    this.logger.log(`Verification email sent to: ${email}`);
  }

  async sendRawEmail(
    to: string | string[],
    subject: string,
    html: string,
    cc?: string | string[],
    bcc?: string | string[],
  ): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: `"Task Manager" <${this.configService.get<string>('smtp.user')}>`,
        to,
        cc,
        bcc,
        subject,
        html,
      });

      this.logger.debug(`Email sent successfully: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email`, error);
      throw new AppException(
        AppError.INTERNAL_ERROR,
        'Failed to send email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //HANDLE QUEUE
  async processEmailQueue(batchSize = 50): Promise<void> {
    const jobs = await this.repository.getEmailQueue(batchSize);
    if (!jobs.length) return;

    const successIds: string[] = [];

    for (const job of jobs) {
      try {
        switch (job.type as EmailType) {
          case EmailType.INVITE: {
            const payload = job.payload as unknown as InviteEmailPayload;
            const ttl = this.configService.get<number>(
              'redis.ttl.verification',
            )!;

            await this.cache.set(
              `verification:${job.emailSend}`,
              payload.verificationToken,
              ttl,
            );

            await this.sendVerificationEmail(
              job.emailSend!,
              payload.verificationToken,
            );

            this.logger.log(`Verification email processed: ${job.emailSend}`);
            break;
          }

          case EmailType.CREATE_LEAVE_REQUEST: {
            const payload = job.payload as unknown as LeaveRequestEmailPayload;

            await this.sendLeaveRequest(
              job.emailSend ?? [],
              payload,
              job.emailCC,
            );
            this.logger.log(job);
            break;
          }

          case EmailType.APPROVED_LEAVE_REQUEST: {
            const payload = job.payload as unknown as LeaveStatusEmailPayload;
            await this.sendRawEmail(
              job.emailSend ?? [],
              '[SkyCorp HRM] Yêu cầu nghỉ phép đã được phê duyệt',
              buildLeaveApprovedTemplate(payload),
              job.emailCC,
            );
            break;
          }

          case EmailType.REJECTED_LEAVE_REQUEST: {
            const payload = job.payload as unknown as LeaveStatusEmailPayload;
            await this.sendRawEmail(
              job.emailSend ?? [],
              '[SkyCorp HRM] Yêu cầu nghỉ phép bị từ chối',
              buildLeaveRejectedTemplate(payload),
              job.emailCC,
            );
            break;
          }

          case EmailType.CANCELLED_LEAVE_REQUEST: {
            const payload = job.payload as unknown as LeaveStatusEmailPayload;
            await this.sendRawEmail(
              job.emailSend ?? [],
              '[SkyCorp HRM] Yêu cầu nghỉ phép đã bị hủy',
              buildLeaveCancelledTemplate(payload),
              job.emailCC,
            );
            break;
          }

          default:
            this.logger.warn(`Unknown email type: ${job.type}`);
        }

        successIds.push(job.id);
      } catch (err) {
        this.logger.error(`Email job failed: ${job.id}`, err as Error);
      }
    }

    if (successIds.length) {
      await this.runInTransaction(async (tx) => {
        await this.repository.deleteMany(
          { id: { in: successIds } } as unknown as Partial<EmailQueue>,
          tx,
        );
      });
    }
  }
}
