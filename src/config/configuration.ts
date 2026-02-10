export default () => ({
  app: {
    frontendUrl: process.env.FE_URL || 'https://localhost:5173',
  },

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

  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    ttl: {
      verification: parseInt(
        process.env.REDIS_TTL_VERIFICATION || '172800',
        10,
      ),
      refreshToken: parseInt(
        process.env.REDIS_TTL_REFRESH_TOKEN || '604800',
        10,
      ), // 7 days
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRATION,
    refreshExpiration: `${Math.floor(Number(process.env.REDIS_TTL_REFRESH_TOKEN) / 86400)}d`,
  },
});
