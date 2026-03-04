import { Injectable, Logger } from '@nestjs/common';
import { IMailService } from '../interfaces/mail.service.interface';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { VerificationEmailTemplate } from '../templates/verification-email.template';
import { buildLeaveRequestTemplate } from '../templates/leave-request-email.template';
import { BaseCrudService } from '@infra/crudservice/base-crud.service';
import { EmailQueue } from '@domain/entities/email-queue.entity';
import { PrismaEmailQueueRepository } from '@modules/mail/infrastructure/email-queue.repository';
import { EmailType } from '@domain/enum/enum';
import { chunk, InviteEmailPayload } from '@modules/mail/helper/mail-helper';

@Injectable()
export class MailService
  extends BaseCrudService<EmailQueue>
  implements IMailService
{
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter<SMTPTransport.SentMessageInfo>;
  constructor(
    private configService: ConfigService,
    repository: PrismaEmailQueueRepository,
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
    params: {
      employeeName: string;
      employeeId: string;
      leaveTypeName: string;
      fromDate: string;
      fromTime?: string;
      toDate: string;
      toTime?: string;
      totalDays: number;
      reason?: string | null;
      note?: string | null;
      managerName: string;
      actionLink: string;
    },
    cc?: string | string[],
  ): Promise<void> {
    const subject = `[SkyCorp HRM] Yêu cầu duyệt phép ngày ${params.fromDate} - ${params.employeeName}`;
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
      this.logger.error(`Failed to send leave request email`, error);
      throw new Error('Failed to send leave request email');
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
      throw new Error('Failed to send email');
    }
  }

  //HANDLE QUEUE
  async processEmailQueue(batchSize = 50): Promise<void> {
    const jobs = await this.repository.findAll();
    if (!jobs.length) return;

    const batches = chunk(jobs, batchSize);

    for (const batch of batches) {
      await this.runInTransaction(async (tx) => {
        await Promise.all(
          batch.map(async (job) => {
            switch (job.type as EmailType) {
              case EmailType.INVITE: {
                const payload = job.payload as unknown as InviteEmailPayload;
                // await this.sendVerificationEmail(job.email, payload.token);
                this.logger.log(`Verification email sent to: ${job.email}`);
                break;
              }
              default:
                this.logger.warn(`Unknown email type: ${job.type}`);
            }
          }),
        );

        await this.repository.deleteMany(
          {
            id: { in: batch.map((j) => j.id) },
          } as unknown as Partial<EmailQueue>,
          tx,
        );
      });
    }
  }
}
