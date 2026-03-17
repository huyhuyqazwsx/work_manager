export interface LeaveYearlyRowDto {
  stt: number;
  userCode: string;
  fullName: string;
  contractType: string;
  joinDate: Date | null;
  contractSignedDate: Date | null;
  employmentStatus: string;
  departmentName: string;
  totalAllowedDays: number;
  monthlyUsed: Record<number, number>;
  totalUsed: number;
  remaining: number;
}

export interface LeaveYearlyReportDto {
  year: number;
  rows: LeaveYearlyRowDto[];
}
