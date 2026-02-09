export interface VerificationEmailParams {
  userName: string;
  verificationLink: string;
  expiresInHours: number;
}

export class VerificationEmailTemplate {
  static getSubject(): string {
    return 'Verify Your Account - Task Management';
  }

  static getHtml(params: VerificationEmailParams): string {
    const { userName, verificationLink, expiresInHours } = params;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account</title>
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
            color: #2563eb;
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
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .link {
            color: #2563eb;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Task Management!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>Thank you for registering! Please verify your email address to activate your account.</p>
            
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </p>
            
            <p>Or copy and paste this link into your browser:</p>
            <p class="link">${verificationLink}</p>
            
            <p>
              <strong>
                This link will expire in ${expiresInHours} hours.
              </strong>
            </p>
            
            <p>If you didn't create an account, you can safely ignore this email.</p>
            
            <p>Best regards,<br>The Task Management Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Task Management. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
