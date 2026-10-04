import React, { Children, cloneElement, forwardRef, isValidElement, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import './CardSwap.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  customClass?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ customClass, ...rest }, ref) => (
  <div ref={ref} {...rest} className={`card ${customClass ?? ''} ${rest.className ?? ''}`.trim()} />
));
Card.displayName = 'Card';

const makeSlot = (i: number, distX: number, distY: number, total: number) => {
  return {
    x: i * (distX * 0.12),
    y: i * (distY * 0.08),
    z: -i * 30,
    scale: 1 - i * 0.03,
    zIndex: total - i
  };
};

const placeNow = (el: HTMLElement | null, slot: ReturnType<typeof makeSlot>, skew: number) => {
  if (!el) return;
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    scale: slot.scale,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });
};

interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  onCardClick?: (idx: number) => void;
  skewAmount?: number;
  easing?: 'linear' | 'elastic';
  children: React.ReactNode;
}

const CardSwapComponent: React.FC<CardSwapProps> = ({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = 'elastic',
  children
}) => {
  const config =
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2
        };

  const childArr = useMemo(() => Children.toArray(children), [children]);

  const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<number | undefined>();
  const container = useRef<HTMLDivElement | null>(null);

  const getCardEl = (idx: number) => {
    if (!container.current) return null;
    return container.current.querySelector(`[data-index="${idx}"]`) as HTMLElement | null;
  };

  useEffect(() => {
    const total = childArr.length;
    childArr.forEach((_, i) => placeNow(getCardEl(i), makeSlot(i, cardDistance, verticalDistance, total), skewAmount));

    const swap = () => {
      if (order.current.length < 2) return;

      const [front, ...rest] = order.current;
      const elFront = getCardEl(front);
      if (!elFront) return;

      const tl = gsap.timeline();
      tlRef.current = tl;

      tl.to(elFront, {
        y: '+=500',
        duration: config.durDrop,
        ease: config.ease
      });

      tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const el = getCardEl(idx);
        if (!el) return;
        const slot = makeSlot(i, cardDistance, verticalDistance, childArr.length);
        tl.set(el, { zIndex: slot.zIndex }, 'promote');
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            scale: slot.scale,
            skewY: skewAmount,
            duration: config.durMove,
            ease: config.ease
          },
          'promote'
        );
      });

      const backSlot = makeSlot(rest.length, cardDistance, verticalDistance, childArr.length);
      tl.set(elFront, { zIndex: 0 }, 'promote');

      const delay = config.returnDelay;
      rest.forEach((idx, i) => {
        const el = getCardEl(idx);
        if (!el) return;
        tl.to(
          el,
          {
            x: backSlot.x,
            y: backSlot.y,
            z: backSlot.z,
            duration: config.durReturn,
            ease: config.ease
          },
          `+=${delay}`
        );
      });

      tl.to(
        elFront,
        {
          x: backSlot.x,
          y: backSlot.y,
          z: backSlot.z,
          scale: backSlot.scale,
          duration: config.durReturn,
          ease: config.ease
        },
        'return'
      );

      tl.call(() => {
        order.current = [...rest, front];
      });
    };

    swap();
    intervalRef.current = window.setInterval(swap, delay);

    if (pauseOnHover && container.current) {
      const node = container.current;
      const pause = () => {
        tlRef.current?.pause();
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
      const resume = () => {
        tlRef.current?.play();
        intervalRef.current = window.setInterval(swap, delay);
      };
      node.addEventListener('mouseenter', pause);
      node.addEventListener('mouseleave', resume);
      return () => {
        node.removeEventListener('mouseenter', pause);
        node.removeEventListener('mouseleave', resume);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing, childArr.length]);

  const rendered = childArr.map((child, i) =>
    isValidElement(child) ? (
      <div
        key={i}
        data-index={i}
        style={{ width, height, ...((child.props as any).style ?? {}) }}
        onClick={(e: React.MouseEvent) => {
          (child.props as any).onClick?.(e);
          onCardClick?.(i);
        }}
      >
        {cloneElement(child as React.ReactElement<any>, {})}
      </div>
    ) : child
  );

  return (
    <div ref={container} className="card-swap-container" style={{ width, height }}>
      {rendered}
    </div>
  );
};

export default CardSwapComponent;
