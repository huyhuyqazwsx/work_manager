import { IBaseCrudService } from '@domain/crudservice/base-crud.service.interface';
import { EmailQueue } from '@domain/entities/email-queue.entity';
import { LeaveRequestEmailPayload } from '@domain/type/mail.types';

export interface IMailService extends IBaseCrudService<EmailQueue> {
  //Send mail
  sendRawEmail(
    to: string | string[],
    subject: string,
    html: string,
    cc?: string | string[],
    bcc?: string | string[],
  ): Promise<void>;
  sendWelcomeEmail(email: string, userName: string): Promise<void>;
  sendVerificationEmail(
    email: string,
    verificationToken: string,
  ): Promise<void>;
  sendLeaveRequest(
    to: string | string[],
    params: LeaveRequestEmailPayload,
    cc?: string | string[],
  ): Promise<void>;

  //Handle queue
  processEmailQueue(batchSize?: number): Promise<void>;
}
