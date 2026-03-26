const DEFAULT_POSTGRES_HOST = 'localhost';
const DEFAULT_POSTGRES_PORT = '5432';
const DEFAULT_POSTGRES_USER = 'postgres';
const DEFAULT_POSTGRES_PASSWORD = 'password';
const DEFAULT_POSTGRES_DB = 'autoatendimento';

const encodeDatabasePart = (value: string) => encodeURIComponent(value);

export const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.POSTGRES_HOST ?? DEFAULT_POSTGRES_HOST;
  const port = process.env.POSTGRES_PORT ?? DEFAULT_POSTGRES_PORT;
  const user = process.env.POSTGRES_USER ?? DEFAULT_POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD ?? DEFAULT_POSTGRES_PASSWORD;
  const database = process.env.POSTGRES_DB ?? DEFAULT_POSTGRES_DB;

  return `postgresql://${encodeDatabasePart(user)}:${encodeDatabasePart(password)}@${host}:${port}/${database}?schema=public`;
};
