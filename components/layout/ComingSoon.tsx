import { Construction } from "lucide-react";

export function ComingSoon({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
      <div className="glass grid h-16 w-16 place-items-center rounded-2xl">
        <Construction className="h-7 w-7 text-accent-soft" />
      </div>
      <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-xs text-sm text-zinc-400">{hint}</p>
    </div>
  );
}
