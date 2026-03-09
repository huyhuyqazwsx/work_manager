import { HolidaySession } from '@domain/enum/enum';

export class PreviewLeaveRequestDto {
  userId: string;
  leaveTypeCode: string;
  fromDate: string;
  toDate: string;
  fromSession: HolidaySession;
  toSession: HolidaySession;
}
