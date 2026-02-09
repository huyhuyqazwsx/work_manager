import { Injectable, Logger } from '@nestjs/common';
import { IMailService } from '../interfaces/mail.service.interface';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { VerificationEmailTemplate } from '../templates/verification-email.template';

@Injectable()
export class MailService implements IMailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter<SMTPTransport.SentMessageInfo>;
  constructor(private configService: ConfigService) {
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

  async sendRawEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: `"Task Manager" <${this.configService.get<string>('smtp.user')}>`,
        to,
        subject,
        html,
      });
      this.logger.debug('Email sent to: ', info.messageId);
    } catch (error) {
      this.logger.error('Failed to sent email to ${to}: ', error);
      throw new Error('Failed to send email');
    }
  }
}
