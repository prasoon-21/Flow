import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim(), password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? 'Unable to sign in');
      }

      const nextPath =
        typeof router.query.next === 'string' && router.query.next.startsWith('/') ? router.query.next : '/';
      await router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign in · Aurika Flow</title>
      </Head>
      <div className="login-shell">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-head">
            <h1>Aurika Flow</h1>
            <p>Sign in using your operator credentials.</p>
          </div>

          <label>
            <span>User ID</span>
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="e.g. drmorepen_admin"
              autoComplete="username"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="error-line">{error}</p> : null}

          <button className="login-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top, rgba(92, 113, 255, 0.18), rgba(8, 11, 30, 0.95));
          padding: 40px 16px;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.98);
          border-radius: 28px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(41, 53, 110, 0.3);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .login-head h1 {
          font-size: 26px;
          margin: 0 0 6px 0;
          color: #11163c;
        }

        .login-head p {
          margin: 0;
          color: #5e648c;
          font-size: 14px;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          color: #4a4f6a;
        }

        input {
          border-radius: 16px;
          border: 1px solid rgba(93, 109, 182, 0.4);
          padding: 12px 14px;
          font-size: 15px;
          background: rgba(255, 255, 255, 0.9);
        }

        .error-line {
          color: #d13b3b;
          font-size: 13px;
          margin: 0;
        }

        .login-btn {
          border: none;
          border-radius: 20px;
          padding: 12px;
          background: linear-gradient(120deg, #5162ff, #7c8fff);
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
