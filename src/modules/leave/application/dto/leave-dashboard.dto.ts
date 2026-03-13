export class AnnualLeaveDashboardDto {
  totalAllowedDays: number; // quota năm
  usedPaidDays: number; // đã dùng có lương
  usedUnpaidDays: number; // đã dùng không lương
  remainingPaidDays: number; // còn lại có lương
  totalDays: number; // đang chờ duyệt
  compensationHours: number;
}
