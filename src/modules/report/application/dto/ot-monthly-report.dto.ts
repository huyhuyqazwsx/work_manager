export interface OTDetailRowDto {
  stt: number;
  userCode: string;
  fullName: string;
  departmentName: string;
  workDate: Date;
  startTime: Date;
  endTime: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  actualHours: number;
}

export interface OTSummaryRowDto {
  stt: number;
  userCode: string;
  fullName: string;
  totalHours: number;
  total: number; // số lần OT
}

export interface OTMonthlyReportDto {
  month: number;
  year: number;
  departmentName: string;
  detailRows: OTDetailRowDto[];
  summaryRows: OTSummaryRowDto[];
}
