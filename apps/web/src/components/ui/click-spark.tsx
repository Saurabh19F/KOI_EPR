'use client';

import { useEffect, useRef } from 'react';

interface Spark {
  x: number;
  y: number;
  angle: number;
  speed: number;
  life: number;
  maxLife: number;
  size: number;
}

export function ClickSpark({ color = '#2563eb' }: { color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleClick = (e: globalThis.MouseEvent) => {
      const count = 8 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        sparksRef.current.push({
          x: e.clientX,
          y: e.clientY,
          angle: (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5,
          speed: 2 + Math.random() * 4,
          life: 1,
          maxLife: 0.4 + Math.random() * 0.3,
          size: 2 + Math.random() * 2,
        });
      }
    };
    window.addEventListener('click', handleClick);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dt = 0.016;
      sparksRef.current = sparksRef.current.filter((s) => {
        s.life -= dt / s.maxLife;
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed + 0.5;
        s.speed *= 0.96;

        if (s.life <= 0) return false;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = s.life * 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(rafRef.current);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
