export interface DayCell {
  day: number;
  dayOfWeek: string; // 'CN' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7'
  isWeekend: boolean;
  symbol: string | null; // 'P' | 'P/2' | 'NL' | 'KL' | 'KX/2' | null
}

export interface LeaveMonthlyRowDto {
  stt: number;
  userCode: string;
  fullName: string;
  contractType: string;
  joinDate: Date | null;
  contractSignedDate: Date | null;
  days: DayCell[];
  totalLeave: number;
  totalHoliday: number;
  totalUnpaid: number;
  departmentName: string;
}

export interface LeaveMonthlyReportDto {
  month: number;
  year: number;
  rows: LeaveMonthlyRowDto[];
}
