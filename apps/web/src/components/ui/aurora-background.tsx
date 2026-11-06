'use client';

import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  className?: string;
  colors?: string[];
  speed?: 'slow' | 'normal' | 'fast';
}

const speedMap = { slow: '20s', normal: '12s', fast: '6s' };

export function AuroraBackground({
  className,
  colors = ['#2563eb', '#2563eb', '#fcfeff', '#2563eb'],
  speed = 'normal',
}: AuroraBackgroundProps) {
  const duration = speedMap[speed];

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {colors.map((color, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-30 blur-[100px]"
          style={{
            background: color,
            width: `${40 + i * 10}%`,
            height: `${40 + i * 10}%`,
            left: `${10 + i * 20}%`,
            top: `${10 + ((i * 30) % 60)}%`,
            animation: `aurora-drift ${duration} ease-in-out infinite alternate`,
            animationDelay: `${i * -3}s`,
          }}
        />
      ))}
    </div>
  );
}
