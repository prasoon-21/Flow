export type KnownErrorCode = 'invalid_grant' | 'not_found';

interface ErrorDescriptor {
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

const ERROR_CATALOG: Record<KnownErrorCode, ErrorDescriptor> = {
  invalid_grant: {
    message: 'Email sync failed. Please reconnect your email account.',
    actionLabel: 'Reconnect',
    actionHref: '/settings/email',
  },
  not_found: {
    message: 'The requested resource is missing.',
  },
};

export function mapErrorToDescriptor(error: unknown): ErrorDescriptor {
  if (typeof error === 'object' && error !== null) {
    const extracted = error as { data?: { code?: string }; message?: string };
    const code = extracted.data?.code;
    if (code && code in ERROR_CATALOG) {
      return ERROR_CATALOG[code as KnownErrorCode];
    }
    if (extracted.message?.toLowerCase().includes('invalid_grant')) {
      return ERROR_CATALOG.invalid_grant;
    }
  }
  return {
    message: (error as Error)?.message ?? 'Something went wrong. Please try again.',
  };
}
