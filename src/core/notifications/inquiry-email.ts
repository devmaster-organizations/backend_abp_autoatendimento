import nodemailer from 'nodemailer';

type SmtpAuthMethod = 'login' | 'oauth2';

type InquiryEmailInput = {
  requesterName: string;
  requesterEmail: string;
  question: string;
  to: string;
  cc: string | null;
};

type InquiryEmailResult = {
  messageId: string;
  accepted: string[];
  rejected: string[];
  response: string;
};

type MailConfig = {
  smtpHost: string | undefined;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string | undefined;
  smtpPass: string | undefined;
  smtpFrom: string | undefined;
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

export const sendInquiryEmail = async (input: InquiryEmailInput): Promise<InquiryEmailResult | null> => {
  const config = readMailConfig();
  const transporter = createTransporter(config);

  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP not configured for inquiry email.');
    }

    console.warn('[INQUIRY_EMAIL] SMTP not configured. Skipping dispatch in dev.');
    return null;
  }

  const subject = `Duvida recebida - ${input.requesterName}`;
  const text = [
    'Nova duvida recebida pelo autoatendimento.',
    '',
    `Nome: ${input.requesterName}`,
    `Email do solicitante: ${input.requesterEmail}`,
    '',
    'Mensagem:',
    input.question,
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>Nova duvida recebida</h2>
      <p><strong>Nome:</strong> ${input.requesterName}</p>
      <p><strong>Email do solicitante:</strong> ${input.requesterEmail}</p>
      <p><strong>Mensagem:</strong></p>
      <p style="white-space: pre-line;">${input.question}</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: config.smtpFrom,
    to: input.to,
    cc: input.cc || undefined,
    subject,
    text,
    html,
    replyTo: input.requesterEmail,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted.map(String),
    rejected: info.rejected.map(String),
    response: info.response,
  };
};
