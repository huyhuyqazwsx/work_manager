import { EmailType } from '@domain/enum/enum';

export interface InviteEmailPayload {
  verificationToken: string;
}

export type EmailPayloadMap = {
  [EmailType.INVITE]: InviteEmailPayload;
};
