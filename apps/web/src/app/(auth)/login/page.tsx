"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  LockKeyhole,
  Mail,
  Pause,
  Play,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { LogisticsScene } from "./logistics-scene";
import styles from "./login.module.css";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
const recoverySchema = loginSchema.pick({ email: true });
type LoginFormData = z.infer<typeof loginSchema>;
type Screen = "login" | "forgot" | "sent" | "create";
const rememberedEmailKey = "koi-remembered-email";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated } =
    useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [screen, setScreen] = useState<Screen>("login");
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [formFocused, setFormFocused] = useState(false);
  const reduceMotion = useReducedMotion();
  const still = !!reduceMotion || paused || hidden;
  const heading = useRef<HTMLHeadingElement>(null);
  const previousScreen = useRef(screen);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const sceneX = useSpring(pointerX, { stiffness: 45, damping: 25 });
  const sceneY = useSpring(pointerY, { stiffness: 45, damping: 25 });
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
  const recovery = useForm<Pick<LoginFormData, "email">>({
    resolver: zodResolver(recoverySchema),
  });

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);
  useEffect(() => {
    try {
      const email = localStorage.getItem(rememberedEmailKey);
      if (email) {
        setValue("email", email);
        setRemember(true);
      }
    } catch {
      /* Login remains available when browser storage is restricted. */
    }
    const visibility = () => setHidden(document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [setValue]);
  useEffect(() => {
    if (still) {
      pointerX.set(0);
      pointerY.set(0);
    }
  }, [still, pointerX, pointerY]);

  function moveScene(event: PointerEvent<HTMLElement>) {
    if (still || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left - bounds.width / 2) * 0.012);
    pointerY.set((event.clientY - bounds.top - bounds.height / 2) * 0.012);
  }
  function switchScreen(next: Screen) {
    clearError();
    setRecoveryError("");
    if (next === "forgot") recovery.setValue("email", getValues("email") || "");
    setScreen(next);
  }
  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      try {
        if (remember) localStorage.setItem(rememberedEmailKey, data.email);
        else localStorage.removeItem(rememberedEmailKey);
      } catch {
        /* Remembering an address is optional. */
      }
      router.replace("/dashboard");
    } catch {
      /* Authentication errors are rendered from the existing store. */
    }
  };
  const requestReset = recovery.handleSubmit(async ({ email }) => {
    setRecoveryError("");
    try {
      await api.post("/auth-v2/forgot-password", { email }, { timeout: 15000 });
      setScreen("sent");
    } catch {
      setRecoveryError(
        "We couldn’t send your request. Please try again or contact your workspace administrator.",
      );
    }
  });
  const titles: Record<Screen, string> = {
    login: "Welcome back.",
    forgot: "Back on track.",
    sent: "Check your inbox.",
    create: "Your journey starts here.",
  };

  return (
    <MotionConfig reducedMotion="user">
      <main
        className={styles.page}
        data-still={still}
        onPointerMove={moveScene}
        onPointerLeave={() => {
          pointerX.set(0);
          pointerY.set(0);
        }}
      >
        <div className={styles.ambient} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />
        <header className={styles.header}>
          <a
            href="/login"
            className={styles.brand}
            aria-label="Krishna Overseas home"
          >
            <span className={styles.logo}>
              <img src="/koi-logo-square.jpeg" alt="" width="44" height="44" />
            </span>
            <span>
              KRISHNA OVERSEAS
              <span className={styles.brandSub}>
                CONNECTED LOGISTICS. SIMPLIFIED.
              </span>
            </span>
          </a>
          <div className={styles.headerRight}>
            <span className={styles.workspaceLabel}>
              <span /> YOUR WORLD. CONNECTED.
            </span>
            <button
              type="button"
              className={styles.motionToggle}
              onClick={() => setPaused(!paused)}
              aria-pressed={paused}
              aria-label={
                paused
                  ? "Play background animation"
                  : "Pause background animation"
              }
              disabled={!!reduceMotion}
              title={
                reduceMotion
                  ? "Reduced motion is enabled on your device"
                  : "Toggle background animation"
              }
            >
              {paused || reduceMotion ? (
                <Play size={15} />
              ) : (
                <Pause size={15} />
              )}
              <span>{paused || reduceMotion ? "Motion off" : "Motion on"}</span>
            </button>
          </div>
        </header>
        <div className={styles.content}>
          <section
            className={styles.story}
            aria-label="Animated logistics network"
          >
            <div className={styles.sceneWrap}>
              <motion.div
                className={styles.sceneCanvas}
                style={{ x: sceneX, y: sceneY }}
              >
                <LogisticsScene />
              </motion.div>
              <div className={styles.sceneLegend}>
                <div className={`${styles.sceneTag} ${styles.airTag}`}>
                  <span className={styles.tagDot} />
                  <span>
                    AIR FREIGHT<small>Beyond boundaries</small>
                  </span>
                  <ArrowRight size={15} />
                </div>
                <div className={`${styles.sceneTag} ${styles.roadTag}`}>
                  <span className={styles.tagDot} />
                  <span>
                    CONNECTED BY ROAD<small>Every mile matters</small>
                  </span>
                  <ArrowRight size={15} />
                </div>
                <div className={`${styles.sceneTag} ${styles.shipTag}`}>
                  <span className={styles.tagDot} />
                  <span>
                    SHIP<small>Ocean freight</small>
                  </span>
                  <ArrowRight size={15} />
                </div>
              </div>
            </div>
            <div className={styles.storyFooter}>
              <span>
                <Globe2 size={17} /> Global reach.
              </span>
              <span>
                <ShieldCheck size={17} /> Complete control.
              </span>
              <span>
                <CheckCircle2 size={17} /> One workspace.
              </span>
            </div>
          </section>
          <motion.div
            className={styles.cardEntrance}
            initial={still ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className={styles.cardHalo} aria-hidden="true" />
            <div className={styles.cardFloat} data-focused={formFocused}>
              <section
                className={styles.card}
                aria-labelledby="login-heading"
                onFocusCapture={() => setFormFocused(true)}
                onBlurCapture={(event) => {
                  if (
                    !event.currentTarget.contains(
                      event.relatedTarget as Node | null,
                    )
                  )
                    setFormFocused(false);
                }}
              >
                <div className={styles.cardTopline}>
                  <span className={styles.portalIcon}>
                    <LockKeyhole size={20} />
                  </span>
                  <span>YOUR WORKSPACE AWAITS</span>
                  <span className={styles.secureDot} />
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={screen}
                    initial={still ? false : { opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: still ? 0 : -12 }}
                    transition={{ duration: still ? 0 : 0.2 }}
                    onAnimationComplete={() => {
                      if (previousScreen.current !== screen) {
                        heading.current?.focus();
                        previousScreen.current = screen;
                      }
                    }}
                  >
                    <h1 id="login-heading" tabIndex={-1} ref={heading}>
                      {titles[screen]}
                    </h1>
                    <p className={styles.subtitle}>
                      {screen === "login"
                        ? "Sign in and get your world moving."
                        : screen === "forgot"
                          ? "Let’s help you find your way back to your workspace."
                          : screen === "sent"
                            ? "Your next step is just an email away."
                            : "A connected workspace for your entire team."}
                    </p>
                    {screen === "login" && (
                      <form
                        onSubmit={handleSubmit(onSubmit)}
                        noValidate
                        aria-busy={isLoading}
                      >
                        {error && (
                          <p className={styles.error} role="alert">
                            {error}
                          </p>
                        )}
                        <div className={styles.field}>
                          <label htmlFor="email">Work email</label>
                          <div className={styles.inputWrap}>
                            <Mail size={18} aria-hidden="true" />
                            <input
                              id="email"
                              type="email"
                              autoComplete="username"
                              placeholder="you@company.com"
                              aria-invalid={!!errors.email}
                              aria-describedby={
                                errors.email ? "email-error" : undefined
                              }
                              {...register("email", { onChange: clearError })}
                            />
                          </div>
                          {errors.email && (
                            <p
                              id="email-error"
                              className={styles.error}
                              role="alert"
                            >
                              {errors.email.message}
                            </p>
                          )}
                        </div>
                        <div className={styles.field}>
                          <label htmlFor="password">Password</label>
                          <div className={styles.inputWrap}>
                            <LockKeyhole size={18} aria-hidden="true" />
                            <input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              placeholder="Enter your password"
                              aria-invalid={!!errors.password}
                              aria-describedby={
                                errors.password ? "password-error" : undefined
                              }
                              {...register("password", {
                                onChange: clearError,
                              })}
                            />
                            <button
                              className={styles.eye}
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                              aria-pressed={showPassword}
                            >
                              {showPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                          {errors.password && (
                            <p
                              id="password-error"
                              className={styles.error}
                              role="alert"
                            >
                              {errors.password.message}
                            </p>
                          )}
                        </div>
                        <div className={styles.options}>
                          <label className={styles.remember}>
                            <input
                              type="checkbox"
                              checked={remember}
                              aria-describedby="remember-hint"
                              onChange={(event) => {
                                setRemember(event.target.checked);
                                if (!event.target.checked) {
                                  try {
                                    localStorage.removeItem(rememberedEmailKey);
                                  } catch {}
                                }
                              }}
                            />
                            Remember me
                          </label>
                          <button
                            type="button"
                            className={styles.textButton}
                            onClick={() => switchScreen("forgot")}
                          >
                            Forgot password?
                          </button>
                        </div>
                        <p id="remember-hint" className={styles.rememberHint}>
                          Remembers your email on this device.
                        </p>
                        <button
                          type="submit"
                          className={styles.submit}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <span className={styles.spinner} />
                              Signing in…
                            </>
                          ) : (
                            <>
                              Sign in to workspace
                              <ArrowRight size={19} />
                            </>
                          )}
                        </button>
                        <div className={styles.divider}>
                          <span />
                          YOUR NEXT MILE STARTS HERE
                          <span />
                        </div>
                        <p className={styles.create}>
                          New to Krishna Overseas?{" "}
                          <button
                            className={styles.textButton}
                            type="button"
                            onClick={() => switchScreen("create")}
                          >
                            Create account <ArrowRight size={14} />
                          </button>
                        </p>
                      </form>
                    )}
                    {screen === "forgot" && (
                      <form
                        onSubmit={requestReset}
                        noValidate
                        aria-busy={recovery.formState.isSubmitting}
                      >
                        <div className={styles.field}>
                          <label htmlFor="recovery-email">Work email</label>
                          <div className={styles.inputWrap}>
                            <Mail size={18} aria-hidden="true" />
                            <input
                              id="recovery-email"
                              type="email"
                              autoComplete="email"
                              placeholder="you@company.com"
                              aria-invalid={!!recovery.formState.errors.email}
                              aria-describedby={
                                recovery.formState.errors.email
                                  ? "recovery-error"
                                  : undefined
                              }
                              {...recovery.register("email")}
                            />
                          </div>
                          {recovery.formState.errors.email && (
                            <p
                              id="recovery-error"
                              className={styles.error}
                              role="alert"
                            >
                              {recovery.formState.errors.email.message}
                            </p>
                          )}
                        </div>
                        <p className={styles.helper}>
                          Enter the email connected to your workspace and we’ll
                          send you a password reset link.
                        </p>
                        {recoveryError && (
                          <p className={styles.error} role="alert">
                            {recoveryError}
                          </p>
                        )}
                        <button
                          className={styles.submit}
                          disabled={recovery.formState.isSubmitting}
                        >
                          {recovery.formState.isSubmitting ? (
                            <>
                              <span className={styles.spinner} />
                              Sending request…
                            </>
                          ) : (
                            <>
                              Send reset link
                              <ArrowRight size={18} />
                            </>
                          )}
                        </button>
                        <button
                          className={styles.back}
                          type="button"
                          onClick={() => switchScreen("login")}
                          disabled={recovery.formState.isSubmitting}
                        >
                          <ArrowLeft size={16} />
                          Back to sign in
                        </button>
                      </form>
                    )}
                    {screen === "sent" && (
                      <div className={styles.infoPanel}>
                        <span className={styles.successIcon}>
                          <Check size={25} />
                        </span>
                        <p role="status">
                          If an account matches that email, you’ll receive a
                          link to reset your password. Check your spam folder
                          too.
                        </p>
                        <p className={styles.helper}>
                          Still need help? Contact your workspace administrator.
                        </p>
                        <button
                          className={styles.submit}
                          type="button"
                          onClick={() => switchScreen("login")}
                        >
                          Back to sign in
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    )}
                    {screen === "create" && (
                      <div className={styles.infoPanel}>
                        <span className={styles.successIcon}>
                          <UserPlus size={25} />
                        </span>
                        <p>
                          Your workspace administrator creates and manages team
                          accounts. Ask them to add your work email to Krishna
                          Overseas.
                        </p>
                        <div className={styles.accessNote}>
                          <ShieldCheck size={20} />
                          <span>
                            Already invited? Use the credentials provided by
                            your administrator to sign in.
                          </span>
                        </div>
                        <button
                          className={styles.submit}
                          type="button"
                          onClick={() => switchScreen("login")}
                        >
                          Back to sign in
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                <div className={styles.cardSecurity}>
                  <ShieldCheck size={15} /> Your workspace. Securely connected.
                </div>
              </section>
            </div>
            <p className={styles.belowCard}>
              <span /> BUILT FOR THE WAY YOUR WORLD MOVES
            </p>
          </motion.div>
        </div>
        <footer className={styles.footer}>
          <span>© {new Date().getFullYear()} Krishna Overseas Inc.</span>
          <span>
            From the first mile to the last.{" "}
            <span className={styles.footerAccent}>Always moving forward.</span>
          </span>
          <span className={styles.footerRight}>
            <Globe2 size={13} /> KOI ERP WORKSPACE
          </span>
        </footer>
      </main>
    </MotionConfig>
  );
}
