import nodemailer from 'nodemailer';

type PasswordResetEmailInput = {
  to: string;
  token: string;
  expiresAt: Date;
};

type SmtpAuthMethod = 'login' | 'oauth2';

type MailConfig = {
  smtpHost: string | undefined;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string | undefined;
  smtpPass: string | undefined;
  smtpFrom: string | undefined;
  frontendUrl: string;
  authMethod: SmtpAuthMethod;
  oauth2TenantId: string;
  oauth2ClientId: string | undefined;
  oauth2ClientSecret: string | undefined;
  oauth2RefreshToken: string | undefined;
  oauth2AccessToken: string | undefined;
  oauth2AccessUrl: string;
};

const normalizeAuthMethod = (value: string | undefined): SmtpAuthMethod => {
  if (value?.trim().toLowerCase() === 'oauth2') {
    return 'oauth2';
  }

  return 'login';
};

const readMailConfig = (): MailConfig => {
  const oauth2TenantId = process.env.SMTP_OAUTH2_TENANT_ID?.trim() || 'common';

  return {
    smtpHost: process.env.SMTP_HOST?.trim(),
    smtpPort: Number(process.env.SMTP_PORT ?? '587'),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER?.trim(),
    smtpPass: process.env.SMTP_PASS?.trim(),
    smtpFrom: process.env.SMTP_FROM?.trim(),
    frontendUrl: process.env.FRONTEND_URL?.trim() || 'http://localhost:3000',
    authMethod: normalizeAuthMethod(process.env.SMTP_AUTH_METHOD),
    oauth2TenantId,
    oauth2ClientId: process.env.SMTP_OAUTH2_CLIENT_ID?.trim(),
    oauth2ClientSecret: process.env.SMTP_OAUTH2_CLIENT_SECRET?.trim(),
    oauth2RefreshToken: process.env.SMTP_OAUTH2_REFRESH_TOKEN?.trim(),
    oauth2AccessToken: process.env.SMTP_OAUTH2_ACCESS_TOKEN?.trim(),
    oauth2AccessUrl:
      process.env.SMTP_OAUTH2_ACCESS_URL?.trim()
      || `https://login.microsoftonline.com/${oauth2TenantId}/oauth2/v2.0/token`,
  };
};

const hasBaseSmtpConfig = (config: MailConfig) =>
  Boolean(config.smtpHost && config.smtpPort && config.smtpUser && config.smtpFrom);

const hasOauth2RefreshConfig = (config: MailConfig) =>
  Boolean(config.oauth2ClientId && config.oauth2ClientSecret && config.oauth2RefreshToken);

const buildConfigHelp = (config: MailConfig): string => {
  if (config.authMethod === 'oauth2') {
    return 'Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_FROM and OAuth2 vars (SMTP_OAUTH2_ACCESS_TOKEN OR SMTP_OAUTH2_CLIENT_ID/SMTP_OAUTH2_CLIENT_SECRET/SMTP_OAUTH2_REFRESH_TOKEN).';
  }

  return 'Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM.';
};

const createTransporter = (config: MailConfig) => {
  if (!hasBaseSmtpConfig(config)) {
    return null;
  }

  if (config.authMethod === 'oauth2') {
    if (config.oauth2AccessToken) {
      return nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          type: 'OAuth2',
          user: config.smtpUser,
          accessToken: config.oauth2AccessToken,
        },
      });
    }

    if (hasOauth2RefreshConfig(config)) {
      return nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          type: 'OAuth2',
          user: config.smtpUser,
          clientId: config.oauth2ClientId,
          clientSecret: config.oauth2ClientSecret,
          refreshToken: config.oauth2RefreshToken,
          accessUrl: config.oauth2AccessUrl,
        },
      });
    }

    return null;
  }

  if (!config.smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
};

export const sendPasswordResetEmail = async ({ to, token, expiresAt }: PasswordResetEmailInput) => {
  const config = readMailConfig();
  const resetLink = `${config.frontendUrl}/reset-password?email=${encodeURIComponent(to)}`;

  const text = [
    'Voce solicitou a recuperacao da sua senha.',
    '',
    `Token de recuperacao: ${token}`,
    `Valido ate: ${expiresAt.toISOString()}`,
    '',
    `Abra a pagina: ${resetLink}`,
    'Cole o token e defina a nova senha.',
    '',
    'Se voce nao solicitou essa alteracao, ignore este e-mail.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 12px;">Recuperacao de senha</h2>
      <p>Voce solicitou a recuperacao da sua senha.</p>
      <p><strong>Token de recuperacao:</strong> ${token}</p>
      <p><strong>Valido ate:</strong> ${expiresAt.toISOString()}</p>
      <p>
        Abra a pagina
        <a href="${resetLink}">${resetLink}</a>
        e cole o token para definir a nova senha.
      </p>
      <p>Se voce nao solicitou essa alteracao, ignore este e-mail.</p>
    </div>
  `;

  const transporter = createTransporter(config);

  if (!transporter) {
    const warning = '[EMAIL] SMTP not configured. Falling back to token in logs.';

    if (process.env.NODE_ENV === 'production') {
      throw new Error(`${warning} ${buildConfigHelp(config)}`);
    }

    console.warn(`${warning} ${buildConfigHelp(config)}`);
    console.info(`[PASSWORD_RESET_TOKEN] ${to} => ${token}`);
    return;
  }

  await transporter.sendMail({
    from: config.smtpFrom,
    to,
    subject: 'Recuperacao de senha - Fatec Autoatendimento',
    text,
    html,
  });
};