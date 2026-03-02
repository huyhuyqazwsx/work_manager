export interface LeaveRequestEmailParams {
  employeeName: string;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason?: string | null;
}
