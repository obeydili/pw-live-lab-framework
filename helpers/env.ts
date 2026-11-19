try {
  process.loadEnvFile('.env');
} catch {
  // It's okay if the file is missing in some environments
}

// Checked when a value is read, not when this module is imported, so the Playwright
// config and anything that doesn't need credentials loads without a complete .env.
function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Environment variable ${key} is not set. Copy .env.example to .env and fill it in, or export ${key} in the shell.`,
    );
  }
  return value;
}

export const env = {
  get BASE_URL(): string {
    return process.env.BASE_URL ?? 'http://localhost:3300';
  },
  get TRADER1_USERNAME(): string {
    return required('TRADER1_USERNAME');
  },
  get TRADER1_PASSWORD(): string {
    return required('TRADER1_PASSWORD');
  },
  get TRADER2_USERNAME(): string {
    return required('TRADER2_USERNAME');
  },
  get TRADER2_PASSWORD(): string {
    return required('TRADER2_PASSWORD');
  },
  get APPROVER1_USERNAME(): string {
    return required('APPROVER1_USERNAME');
  },
  get APPROVER1_PASSWORD(): string {
    return required('APPROVER1_PASSWORD');
  },
};
