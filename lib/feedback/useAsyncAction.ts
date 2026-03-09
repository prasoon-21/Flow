import { useCallback } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { mapErrorToDescriptor } from './error-codes';

import { useState } from 'react';

interface UseAsyncActionOptions<TResult = unknown> {
  action: () => Promise<TResult>;
  messages?: {
    success?: (result: TResult) => { title?: string; message: string };
    empty?: (result: TResult) => { title?: string; message: string } | null;
  };
  deriveEmpty?: (result: TResult) => boolean;
}

export function useAsyncAction<TResult = unknown>(options: UseAsyncActionOptions<TResult>) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const trigger = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await options.action();
      const isEmpty = options.deriveEmpty?.(result) ?? false;
      const messageFactory = isEmpty ? options.messages?.empty : options.messages?.success;
      const payload = messageFactory?.(result);
      if (payload) {
        showToast({ variant: isEmpty ? 'info' : 'success', ...payload });
      }
      return result;
    } catch (error) {
      const descriptor = mapErrorToDescriptor(error);
      showToast({
        variant: 'error',
        message: descriptor.message,
        actionLabel: descriptor.actionLabel,
        onAction: descriptor.actionHref ? () => (window.location.href = descriptor.actionHref!) : undefined,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [options, showToast]);

  return { trigger, isLoading };
}
