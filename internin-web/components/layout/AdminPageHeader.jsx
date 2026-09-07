"use client";

/**
 * Admin Page Header System — signature visuelle des menus Admin.
 * Shell global (nav, search, notifs) reste dans AppHeader.
 * Ce composant gère identité de page : context, titre, description, metadata, actions.
 */

import { cn } from "@/lib/utils";

/**
 * @param {string} context - e.g. "ADMIN / ORGANIZATIONS"
 * @param {string} title - Page title (h1)
 * @param {string} [description]
 * @param {React.ReactNode} [metadata] - discrete status line
 * @param {React.ReactNode} [status] - e.g. operational dot
 * @param {React.ReactNode} [actions] - primary / secondary actions (right)
 * @param {boolean} [divider=true]
 * @param {string} [className]
 */
export default function AdminPageHeader({
  context,
  title,
  description,
  metadata,
  status,
  actions,
  divider = true,
  className,
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        divider && "border-b border-border pb-5",
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl space-y-1.5">
        {context && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {context}
          </p>
        )}
        {title && (
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        )}
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {status && <div className="pt-0.5">{status}</div>}
        {metadata && (
          <p className="pt-0.5 text-xs text-muted-foreground">{metadata}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
