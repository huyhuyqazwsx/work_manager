export interface IMailService {
  sendRawEmail(
    to: string | string[],
    subject: string,
    html: string,
    cc?: string | string[],
    bcc?: string | string[],
  ): Promise<void>;
  sendWelcomeEmail(email: string, userName: string): Promise<void>;
  sendVerificationEmail(
    email: string,
    verificationToken: string,
  ): Promise<void>;
  sendLeaveRequest(
    to: string | string[],
    params: {
      employeeName: string;
      employeeId: string;
      leaveTypeName: string;
      fromDate: string;
      fromTime?: string;
      toDate: string;
      toTime?: string;
      totalDays: number;
      reason?: string | null;
      note?: string | null;
      managerName: string;
      actionLink: string;
    },
    cc?: string | string[],
  ): Promise<void>;
}
