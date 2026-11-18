"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import styles from "../../login/login.module.css";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Include uppercase, lowercase, a number, and a special character (@$!%*?&).",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don’t match.",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token"));
    setReady(true);
  }, []);

  const submit = handleSubmit(async ({ newPassword }) => {
    if (!token) return;
    setError("");
    try {
      await api.post(
        "/auth-v2/reset-password",
        { token, newPassword },
        { timeout: 15000 },
      );
      setDone(true);
      setToken(null);
      window.history.replaceState(null, "", window.location.pathname);
    } catch {
      setError(
        "Unable to reset your password. The link may have expired or already been used. Try again or request a new link from sign in.",
      );
    }
  });

  return (
    <main className={styles.page} data-still="true">
      <div className={styles.ambient} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/login" className={styles.brand}>
          <span className={styles.logo}>
            <img src="/koi-logo-square.jpeg" alt="" width="44" height="44" />
          </span>
          <span>
            KRISHNA OVERSEAS
            <span className={styles.brandSub}>
              CONNECTED LOGISTICS. SIMPLIFIED.
            </span>
          </span>
        </Link>
      </header>
      <div className={styles.resetContent}>
        <section
          className={`${styles.card} ${styles.resetCard}`}
          aria-labelledby="reset-heading"
        >
          <div className={styles.cardTopline}>
            <span className={styles.portalIcon}>
              <LockKeyhole size={20} />
            </span>
            SECURE ACCOUNT RECOVERY
          </div>
          <h2 id="reset-heading">
            {done ? "Ready to move." : "A fresh start."}
          </h2>
          {!ready ? (
            <p className={styles.subtitle} role="status">
              Preparing password reset…
            </p>
          ) : done ? (
            <div className={styles.infoPanel}>
              <span className={styles.successIcon}>
                <Check size={25} />
              </span>
              <p role="status">
                Your password has been reset. Sign in with your new password to
                continue.
              </p>
              <Link href="/login" className={styles.submit}>
                Back to sign in
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : !token ? (
            <div className={styles.infoPanel}>
              <p role="alert">
                This reset link is missing its token. Return to sign in and
                select Forgot password to request a new link.
              </p>
              <Link href="/login" className={styles.submit}>
                Back to sign in
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <>
              <p className={styles.subtitle}>
                Choose a new password for your workspace.
              </p>
              <form onSubmit={submit} noValidate aria-busy={isSubmitting}>
                <div className={styles.field}>
                  <label htmlFor="new-password">New password</label>
                  <div className={styles.inputWrap}>
                    <LockKeyhole size={18} aria-hidden="true" />
                    <input
                      id="new-password"
                      autoComplete="new-password"
                      type={show ? "text" : "password"}
                      aria-invalid={!!errors.newPassword}
                      aria-describedby={
                        errors.newPassword
                          ? "new-password-error password-hint"
                          : "password-hint"
                      }
                      {...register("newPassword")}
                    />
                    <button
                      className={styles.eye}
                      type="button"
                      onClick={() => setShow(!show)}
                      aria-label={show ? "Hide passwords" : "Show passwords"}
                      aria-pressed={show}
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p
                      className={styles.error}
                      role="alert"
                      id="new-password-error"
                    >
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>
                <p className={styles.helper} id="password-hint">
                  Use at least 8 characters with uppercase, lowercase, a number,
                  and a special character (@$!%*?&).
                </p>
                <div className={styles.field}>
                  <label htmlFor="confirm-password">Confirm password</label>
                  <div className={styles.inputWrap}>
                    <LockKeyhole size={18} aria-hidden="true" />
                    <input
                      id="confirm-password"
                      autoComplete="new-password"
                      type={show ? "text" : "password"}
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={
                        errors.confirmPassword
                          ? "confirm-password-error"
                          : undefined
                      }
                      {...register("confirmPassword")}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p
                      className={styles.error}
                      role="alert"
                      id="confirm-password-error"
                    >
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                {error && (
                  <p className={styles.error} role="alert">
                    {error}
                  </p>
                )}
                <button className={styles.submit} disabled={isSubmitting}>
                  {isSubmitting ? "Updating password…" : "Reset password"}
                  <ArrowRight size={18} />
                </button>
                <Link className={styles.back} href="/login">
                  Back to sign in
                </Link>
              </form>
            </>
          )}
          <div className={styles.cardSecurity}>
            <ShieldCheck size={15} />
            Your workspace. Securely connected.
          </div>
        </section>
      </div>
    </main>
  );
}
