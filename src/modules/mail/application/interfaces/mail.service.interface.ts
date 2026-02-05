export interface IMailService {
  sendVerificationEmail(
    email: string,
    verificationToken: string,
  ): Promise<void>;
  sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
  sendWelcomeEmail(email: string, userName: string): Promise<void>;
  sendRawEmail(to: string, subject: string, html: string): Promise<void>;
}
