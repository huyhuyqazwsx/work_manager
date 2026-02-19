import { InviteImportResult } from '../../../../domain/type/invite.types';

export interface IInviteService {
  inviteTemplateDownload(): Buffer;

  importFromExcel(file: Express.Multer.File): Promise<InviteImportResult>;
}
