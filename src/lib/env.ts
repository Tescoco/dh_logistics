export function getEnv(name: string, defaultsTo?: string): string {
  const value = process.env[name] ?? defaultsTo;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const ENV = {
  MONGODB_URI: () => getEnv("MONGODB_URI"),
  JWT_SECRET: () => getEnv("JWT_SECRET"),
  NODE_ENV: () => process.env.NODE_ENV ?? "development",
};
