export default () => ({
  zoho: {
    clientID: process.env.ZOHO_CLIENT_ID,
    clientSecret: process.env.ZOHO_CLIENT_SECRET,
    callbackURL:
      process.env.ZOHO_CALLBACK_URL ||
      'http://localhost:3000/api/v1/auth/zoho/callback',
    accountsDomain: process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com',
    scopes: ['email', 'profile', 'openid'],
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  },
});
