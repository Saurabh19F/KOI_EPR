'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calculator, ClipboardList, Eye, EyeOff, FileCheck2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import styles from './login.module.css';

const loginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch {
      // Error is handled by the store.
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <section className={styles.story} aria-label="KOI workspace">
          <div>
            <h2>Krishna Overseas<br />ERP workspace</h2>
            <p>Manage sales enquiries, compare purchase quotes, and track production and warehouse stock.</p>
          </div>
          <figure className={styles.workflow}>
            <figcaption>Sales enquiry workflow</figcaption>
            <ol>
              <li><span className={styles.enquiry}><ClipboardList aria-hidden="true" /></span>Sales enquiry</li>
              <li><span className={styles.costing}><Calculator aria-hidden="true" /></span>Rate calculation</li>
              <li><span className={styles.quote}><FileCheck2 aria-hidden="true" /></span>Sales quotation</li>
            </ol>
          </figure>
        </section>
        <section className={styles.signin} aria-labelledby="login-heading">
          <div className={styles.brand}>
            <img src="/koi-logo-square.jpeg" alt="" width="40" height="40" />
            Krishna Overseas Inc.
          </div>
          <h1 id="login-heading">Welcome back</h1>
          <p className={styles.subtitle}>Sign in to your KOI ERP workspace.</p>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div>
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@company.com"
                aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email', { onChange: clearError })} />
              {errors.email && <p id="email-error" className={styles.error} role="alert">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <div className={styles.password}>
                <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  placeholder="Enter your password" aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password', { onChange: clearError })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p id="password-error" className={styles.error} role="alert">{errors.password.message}</p>}
            </div>
            <details className={styles.help}>
              <summary>Forgot password?</summary>
              <p>Contact your workspace administrator for help accessing your account.</p>
            </details>
            <button type="submit" className={styles.submit} disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
