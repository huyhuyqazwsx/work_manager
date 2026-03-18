import { LeaveMonthlyReportDto } from '@modules/report/application/dto/leave-monthly-report';
import { LeaveYearlyReportDto } from '@modules/report/application/dto/leave-yearly-report';

export interface IReportService {
  /**
   * Báo cáo theo dõi phép tháng.
   *
   * Luồng xử lý:
   * 1. Validate department tồn tại
   * 2. Lấy danh sách users của department
   * 3. Query MIN(fromDate)/MAX(toDate) của tất cả đơn APPROVED trong tháng
   *    → xác định rangeStart/rangeEnd cần build map
   * 4. Query holiday 1 lần duy nhất theo range
   * 5. Build dayFlagMap [rangeStart → rangeEnd]:
   *    - Duyệt từng ngày → đánh WEEKEND (CN/T7)
   *    - Gom holidays theo ngày → đánh HOLIDAY_FULL / HOLIDAY_MORNING / HOLIDAY_AFTERNOON
   *    - Bỏ qua holiday nếu ngày đã là WEEKEND
   * 6. Query tất cả đơn APPROVED của department trong tháng
   * 7. Group đơn theo userId
   *
   * Với mỗi user:
   *   Với mỗi đơn leave:
   *     remainingPaid = req.paidDays
   *     Duyệt từng ngày trong đơn [reqStart → reqEnd]:
   *       WEEKEND           → skip
   *       HOLIDAY_FULL      → NL, totalHoliday += 1
   *       HOLIDAY_MORNING/  → NL/2, totalHoliday += 0.5
   *       AFTERNOON           nửa còn lại: paid>0 → paid-=0.5 / paid=0 → unpaid+=0.5
   *       ngày thường:
   *         Nếu ngày đã có symbol /2 (từ đơn trước cùng ngày) → upgrade lên full (P/2 → P)
   *         paid > 0 → resolveSymbol(leaveTypeCode, isHalf), paid -= dayValue
   *         paid = 0 → KL hoặc KL/2
   *
   * @param month - Tháng cần report (1-12)
   * @param year - Năm cần report
   * @returns LeaveMonthlyReportDto - Dữ liệu từng ngày của từng nhân viên
   */
  getLeaveMonthlyReportAll(
    month: number,
    year: number,
  ): Promise<LeaveMonthlyReportDto>;

  getLeaveYearlyReportAll(year: number): Promise<LeaveYearlyReportDto>;
}
