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

export interface LeaveStatusEmailPayload {
  employeeName: string;
  leaveTypeCode?: string | null;
  fromDate: string;
  toDate: string;
  totalDays: number;
  managerName?: string | null;
  rejectReason?: string | null;
}
