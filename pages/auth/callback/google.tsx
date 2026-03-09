import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function GoogleAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Completing Google sign-in…');

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    const { code, state, error } = router.query;
    if (typeof error === 'string') {
      setStatus(`Authorization failed: ${error}`);
      return;
    }
    if (typeof code === 'string' && typeof state === 'string') {
      void exchangeCode(code, state);
    } else {
      setStatus('Missing authorization code.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  async function exchangeCode(code: string, state: string) {
    try {
      setStatus('Requesting access token…');
      const response = await fetch('/api/google/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Token exchange failed');
      }
      window.opener?.postMessage(
        {
          type: 'google-auth-success',
          tokens: data.tokens,
          profile: data.profile,
        },
        window.location.origin
      );
      setStatus('Success! You can close this window.');
      setTimeout(() => window.close(), 1000);
    } catch (err) {
      console.error(err);
      setStatus('Unable to complete Google sign-in.');
      window.opener?.postMessage(
        {
          type: 'google-auth-error',
          error: (err as Error).message,
        },
        window.location.origin
      );
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <p>{status}</p>
    </div>
  );
}
