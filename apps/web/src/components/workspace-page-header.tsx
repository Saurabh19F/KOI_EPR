import type { ReactNode } from 'react';

interface WorkspacePageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}

export function WorkspacePageHeader({ title, description, children }: WorkspacePageHeaderProps) {
  return (
    <header className="workspace-page-header">
      <div className="min-w-0">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="workspace-header-actions">{children}</div>}
    </header>
  );
}
