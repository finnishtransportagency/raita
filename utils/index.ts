// General utils and helpers

export function getEnv(name: string, context?: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name}-environment variable has not been set${
        context ? ` at context of ${context}` : ''
      }`,
    );
  }
  return value;
}

export const getEnvForContext = (context: string) => (name: string) =>
  getEnv(name, context);
