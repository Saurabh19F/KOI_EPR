'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function GradientText({
  children,
  className,
  from = '#2563eb',
  via = '#2563eb',
  to = '#2563eb',
  animate = true,
}: {
  children: ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
  animate?: boolean;
}) {
  return (
    <span
      className={cn('bg-clip-text text-transparent', animate && 'animate-gradient-text', className)}
      style={{
        backgroundImage: `linear-gradient(90deg, ${from}, ${via}, ${to}, ${from})`,
        backgroundSize: animate ? '200% auto' : '100% auto',
      }}
    >
      {children}
    </span>
  );
}

export function CountUp({
  end,
  duration = 380,
  prefix = '',
  suffix = '',
  className,
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(end);
      return;
    }
    const startTime = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}

export function TypeWriter({
  text,
  speed = 40,
  className,
  cursor = true,
}: {
  text: string;
  speed?: number;
  className?: string;
  cursor?: boolean;
}) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayed}
      {cursor && !done && (
        <span className="ml-0.5 inline-block w-[2px] h-[1em] bg-current animate-blink align-middle" />
      )}
    </span>
  );
}

export function SplitText({
  text,
  className,
  charClassName,
  staggerMs = 30,
}: {
  text: string;
  className?: string;
  charClassName?: string;
  staggerMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={cn('inline-flex flex-wrap', className)}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className={cn(
            'inline-block transition-all duration-500',
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4',
            charClassName
          )}
          style={{
            transitionDelay: `${i * staggerMs}ms`,
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </span>
  );
}
