import { EmailType } from '@domain/enum/enum';

export interface InviteEmailPayload {
  token: string;
}

export type EmailPayloadMap = {
  [EmailType.INVITE]: InviteEmailPayload;
};

export function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}
