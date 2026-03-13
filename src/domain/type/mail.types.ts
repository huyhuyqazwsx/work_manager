export interface LeaveRequestEmailPayload {
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  leaveTypeCode?: string | null;

  fromDate: string;
  toDate: string;
  fromSession: 'FULL' | 'MORNING' | 'AFTERNOON';
  toSession: 'FULL' | 'MORNING' | 'AFTERNOON';

  totalDays: number;
  reason?: string | null;

  managerName: string;
  actionLink: string;
}
