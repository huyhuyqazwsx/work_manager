export class PreviewLeaveResponseDto {
  actualLeaveDays: number; // số ngày hợp lệ
  remainingAfterRequest: number; // số ngày dư sau khi trừ
  warnings: string[]; // cảnh báo nếu có
}
