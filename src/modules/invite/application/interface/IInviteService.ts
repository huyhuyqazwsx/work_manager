import { InviteForm, InviteImportResult } from '@domain/type/invite.types';
import { UserStatus } from '@domain/enum/enum';

export interface IInviteService {
  inviteTemplateDownload(): Buffer;
  importFromExcel(file: Express.Multer.File): Promise<InviteImportResult>;
  inviteSingleUser(invite: InviteForm): Promise<UserStatus>;
}
