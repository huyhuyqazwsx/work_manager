export interface OTDetailReportItem {
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
