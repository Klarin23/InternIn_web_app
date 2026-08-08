import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function RoleCard({
  href,
  icon: Icon,
  iconClass,
  title,
  description,
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-md border border-border bg-card p-5 transition hover:border-primary hover:shadow-sm"
    >
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-sm ${iconClass}`}
      >
        <Icon className="h-7 w-7" strokeWidth={2.25} />
      </div>
      <div className="flex-1">
        <h5 className="mb-0.5 font-semibold text-foreground">{title}</h5>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
