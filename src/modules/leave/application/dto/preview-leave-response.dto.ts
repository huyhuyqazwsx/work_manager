export class PreviewLeaveResponseDto {
  actualLeaveDays: number; // số ngày hợp lệ
  paidDays: number; // số ngày trả
  unpaidDays: number; // số ngày không lương
  weekendDays: number;
  holidayDays: number;
  warnings: string[]; // cảnh báo nếu có
}
