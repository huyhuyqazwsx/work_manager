import {
  InviteExcelRow,
  InviteImportResult,
} from '../../../../domain/type/invite.types';

export interface IInviteService {
  importFromExcel(file: Express.Multer.File): Promise<InviteImportResult>;

  validateRow(row: any): InviteExcelRow;
}
