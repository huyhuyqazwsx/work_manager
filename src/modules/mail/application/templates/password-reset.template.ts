export interface PasswordResetEmailParams {
  userName: string;
  resetLink: string;
}

export class PasswordResetEmailTemplate {
  static getSubject(): string {
    return 'Reset Your Password - Task Management';
  }

  static getHtml(params: PasswordResetEmailParams): string {
    const { userName, resetLink } = params;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #dc2626;
            margin: 0;
          }
          .content {
            background-color: white;
            padding: 20px;
            border-radius: 6px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #dc2626;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
          }
          .button:hover {
            background-color: #b91c1c;
          }
          .warning {
            background-color: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            
            <p>Or copy and paste this link:</p>
            <p style="color: #dc2626; word-break: break-all;">${resetLink}</p>
            
            <div class="warning">
              <strong>Security Notice:</strong>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password will not change unless you click the link above</li>
              </ul>
            </div>
            
            <p>Best regards,<br>The Task Management Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
