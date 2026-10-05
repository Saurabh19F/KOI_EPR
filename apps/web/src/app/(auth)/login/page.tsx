'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Lock,
  Mail,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { KoiLogo } from '@/components/brand/KoiLogo';
import { useAuthStore } from '@/store/auth';

const loginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const quickUsers = [
  { email: 'jatin@erp.com', name: 'Jatin', role: 'Admin', tone: 'bg-amber-500' },
  { email: 'admin@erp.com', name: 'Admin', role: 'Admin', tone: 'bg-emerald-600' },
  { email: 'neha@erp.com', name: 'Neha', role: 'Sales', tone: 'bg-sky-600' },
  { email: 'hitesh@erp.com', name: 'Hitesh', role: 'Sales', tone: 'bg-sky-500' },
  { email: 'amit@erp.com', name: 'Amit', role: 'Purchase', tone: 'bg-orange-500' },
  { email: 'sunil@erp.com', name: 'Sunil', role: 'Purchase', tone: 'bg-orange-400' },
  { email: 'nipur@erp.com', name: 'Nipur', role: 'Costing', tone: 'bg-violet-500' },
  { email: 'kapil@erp.com', name: 'Kapil', role: 'Purchase', tone: 'bg-lime-600' },
  { email: 'mis@erp.com', name: 'MIS User', role: 'MIS', tone: 'bg-teal-500' },
];

const workflowCards = [
  {
    label: 'Sales',
    value: 'Enquiry to invoice',
    icon: TrendingUp,
    color: 'text-sky-700',
    bg: 'bg-sky-50',
  },
  {
    label: 'Purchase',
    value: 'Indent to GRN',
    icon: ShoppingCart,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
  },
  {
    label: 'Inventory',
    value: 'Stock and movement',
    icon: Boxes,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  {
    label: 'Rate',
    value: 'Costing and margin',
    icon: BarChart3,
    color: 'text-violet-700',
    bg: 'bg-violet-50',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const quickLogin = (email: string) => {
    clearError();
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'admin123', { shouldValidate: true });
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch {
      // Error is handled by the store.
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-slate-950">
      <div className="grid min-h-screen lg:h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:overflow-hidden">
        <section className="relative hidden h-full overflow-hidden border-r border-black/10 bg-[#f7f3ea] lg:flex lg:flex-col">
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          <div className="relative z-10 flex items-center justify-between px-10 py-6">
            <div className="flex items-center gap-4">
              <KoiLogo variant="icon" className="h-12 w-12 rounded-xl border-black/10" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9a6b36]">
                  Krishna Overseas Inc.
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">KOI ERP</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure workspace
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-center px-10 pb-7">
            <div className={`max-w-3xl ${mounted ? 'login-fade-up' : 'opacity-0'}`}>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d2a66c]/40 bg-white/70 px-3 py-1 text-xs font-semibold text-[#8a5b25] shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Operations command center
              </p>
              <h2 className="max-w-2xl text-4xl font-bold leading-[1.04] tracking-tight text-slate-950 2xl:text-5xl">
                Run sales, purchase, costing, and stock from one clean desk.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
                A focused ERP login for daily work: fast access, clear module context, and a workspace that feels like the system behind it.
              </p>
            </div>

            <div className={`mt-5 grid max-w-3xl grid-cols-4 gap-3 ${mounted ? 'login-fade-up login-delay-2' : 'opacity-0'}`}>
              {workflowCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-black/10 bg-white/80 p-2.5 shadow-sm backdrop-blur">
                    <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${item.bg} ${item.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-950">{item.label}</p>
                    <p className="mt-1 text-[11px] font-medium leading-4 text-slate-500">{item.value}</p>
                  </div>
                );
              })}
            </div>

            <div className={`mt-4 grid max-w-3xl grid-cols-[1.05fr_0.95fr] gap-4 ${mounted ? 'login-fade-up login-delay-3' : 'opacity-0'}`}>
              <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl shadow-slate-900/10">
                <img
                  src="/feature_sales_dashboard.png"
                  alt="KOI ERP sales dashboard"
                  className="h-36 w-full object-cover object-left-top"
                />
              </div>
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-black/10 bg-[#10231f] p-3 text-white shadow-lg">
                  <div className="flex items-center gap-3">
                    <PackageCheck className="h-5 w-5 text-emerald-300" />
                    <span className="text-sm font-semibold">Live operations</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold">56+</p>
                  <p className="mt-1 text-sm text-emerald-50/70">ERP panels connected to real workflows</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-[#9a6b36]" />
                    <span className="text-sm font-semibold text-slate-950">Data ready</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Masters, documents, reports, and workflow lists stay close to the actions teams use every day.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-5 sm:px-6 lg:px-10">
          <div
            className="absolute inset-0 opacity-[0.16] lg:hidden"
            style={{
              backgroundImage:
                'linear-gradient(rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className={`relative z-10 w-full max-w-[460px] ${mounted ? 'login-fade-up login-delay-1' : 'opacity-0'}`}>
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <KoiLogo variant="icon" className="h-10 w-10 border-slate-200" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a6b36]">KOI ERP</p>
                  <p className="text-sm font-bold text-slate-950">Krishna Overseas Inc.</p>
                </div>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
            </div>

            <div className="mb-4 rounded-xl border border-black/10 bg-white/85 p-3 shadow-lg shadow-slate-900/5 backdrop-blur lg:hidden">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d2a66c]/40 bg-[#fffaf2] px-2.5 py-1 text-[11px] font-semibold text-[#8a5b25]">
                <Sparkles className="h-3 w-3" />
                Operations command center
              </p>
              <h1 className="text-[1.7rem] font-bold leading-[1.05] tracking-tight text-slate-950">
                Run ERP work from one clean desk.
              </h1>
              <p className="mt-2 text-[13px] leading-5 text-slate-600">
                Fast access to sales, purchase, inventory, and rate workflows.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {workflowCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-lg border border-black/10 bg-white px-2.5 py-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${item.bg} ${item.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-950">{item.label}</p>
                          <p className="truncate text-[10px] font-medium text-slate-500">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-2xl shadow-slate-900/10 sm:p-5">
              <div className="mb-4 sm:mb-5">
                <div className="mb-4 hidden items-center gap-3 lg:flex">
                  <KoiLogo variant="wordmark" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a6b36]">
                  Sign in
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Welcome back</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500 sm:mt-2">
                  Enter your workspace credentials to continue.
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@company.com"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100 sm:h-10"
                      {...register('email', { onChange: clearError })}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
                      Password
                    </label>
                    <button type="button" className="text-xs font-bold text-[#9a6b36] transition hover:text-[#6e481d]">
                      Forgot password
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter password"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm font-medium text-slate-950 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100 sm:h-10"
                      {...register('password', { onChange: clearError })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#10231f] px-4 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-[#17352f] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10"
                >
                  {isLoading ? 'Signing in...' : 'Open dashboard'}
                  {!isLoading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}
                </button>
              </form>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Quick access</p>
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {quickUsers.map((user) => (
                    <button
                      key={user.email}
                      type="button"
                      onClick={() => quickLogin(user.email)}
                      className="min-w-0 rounded-lg border border-transparent bg-white px-2 py-2 text-left shadow-sm transition hover:border-[#d2a66c] hover:bg-[#fffaf2] sm:px-2.5 sm:py-1.5"
                    >
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${user.tone}`} />
                        <span className="truncate text-xs font-bold text-slate-950">{user.name}</span>
                      </div>
                      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">{user.role}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-5 text-center text-xs font-medium text-slate-500">
              Protected by role-based access and session scoped tokens.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
