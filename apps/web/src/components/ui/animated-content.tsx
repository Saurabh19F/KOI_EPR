'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AnimationVariant =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'scale'
  | 'blur'
  | 'slide-up'
  | 'flip';

interface AnimatedContentProps {
  children: ReactNode;
  variant?: AnimationVariant;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  threshold?: number;
}

const variantStyles: Record<AnimationVariant, { from: string; to: string }> = {
  'fade-up': {
    from: 'opacity-0 translate-y-8',
    to: 'opacity-100 translate-y-0',
  },
  'fade-down': {
    from: 'opacity-0 -translate-y-8',
    to: 'opacity-100 translate-y-0',
  },
  'fade-left': {
    from: 'opacity-0 -translate-x-8',
    to: 'opacity-100 translate-x-0',
  },
  'fade-right': {
    from: 'opacity-0 translate-x-8',
    to: 'opacity-100 translate-x-0',
  },
  scale: {
    from: 'opacity-0 scale-90',
    to: 'opacity-100 scale-100',
  },
  blur: {
    from: 'opacity-0 blur-sm scale-95',
    to: 'opacity-100 blur-0 scale-100',
  },
  'slide-up': {
    from: 'opacity-0 translate-y-12',
    to: 'opacity-100 translate-y-0',
  },
  flip: {
    from: 'opacity-0 [transform:rotateX(15deg)_translateY(10px)]',
    to: 'opacity-100 [transform:rotateX(0deg)_translateY(0)]',
  },
};

export function AnimatedContent({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 600,
  className,
  once = true,
  threshold = 0.1,
}: AnimatedContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  const styles = variantStyles[variant];

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all [will-change:transform,opacity,filter]',
        isVisible ? styles.to : styles.from,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  );
}

export function StaggerChildren({
  children,
  staggerMs = 80,
  variant = 'fade-up',
  className,
}: {
  children: ReactNode;
  staggerMs?: number;
  variant?: AnimationVariant;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const styles = variantStyles[variant];

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              className={cn(
                'transition-all [will-change:transform,opacity,filter]',
                isVisible ? styles.to : styles.from
              )}
              style={{
                transitionDuration: '600ms',
                transitionDelay: `${i * staggerMs}ms`,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}
