'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useIsFetching } from '@tanstack/react-query';

export function WorkspaceDataView({ children }: { children: ReactNode }) {
  const pending = useIsFetching({ predicate: q => q.state.status === 'pending' });
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = content.current;
    if (!root) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new MutationObserver(records => {
      if (motion.matches) return;
      const cells = new Set<HTMLElement>();
      for (const record of records) {
        const cell = record.target.parentElement?.closest<HTMLElement>('td, .overview-value');
        if (cell && !cell.contains(document.activeElement)) cells.add(cell);
      }
      for (const cell of cells) {
        cell.animate([{ opacity: 0.6 }, { opacity: 1 }], { duration: 220 });
      }
    });
    observer.observe(root, { subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-w-0" aria-busy={pending > 0}>
      {pending > 0 && <span className="sr-only">Loading data…</span>}
      <div ref={content} className="erp-data-ready">{children}</div>
    </div>
  );
}
