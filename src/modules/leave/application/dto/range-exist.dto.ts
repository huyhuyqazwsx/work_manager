import { HolidaySession } from '@domain/enum/enum';

export class RangeExistItemDto {
  fromDate: Date;
  toDate: Date;
  fromSession: HolidaySession;
  toSession: HolidaySession;
}

export class RangeExistDto {
  range: RangeExistItemDto[];
}
