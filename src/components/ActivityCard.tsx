import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function ActivityCard({
  title,
  subtitle,
  icon,
  href,
  disabled,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  href?: string;
  disabled?: boolean;
}) {
  const className =
    "flex min-h-28 items-center justify-between gap-4 rounded-[24px] border bg-white p-5 text-left shadow-sm transition active:scale-[0.99]";

  const content = (
    <>
      <div className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-800">
          {icon}
        </span>
        <div>
          <h2 className="text-xl font-black">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">{subtitle}</p>
        </div>
      </div>
      <ChevronRight aria-hidden className="shrink-0 text-slate-400" size={22} />
    </>
  );

  if (disabled || !href) {
    return (
      <div className={`${className} border-slate-100 opacity-70`} aria-disabled>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={`${className} border-emerald-100`}>
      {content}
    </Link>
  );
}
