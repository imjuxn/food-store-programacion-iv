import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.22em] text-orange-600">{eyebrow}</p><h1 className="text-3xl font-black tracking-tight text-stone-950 sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-stone-600">{description}</p>}</div>{action}</div>;
}
