"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { QUIZ_STEPS, type QuizOption } from "@/lib/mock/quiz";
import { playSound } from "@/lib/sound";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useStyleStore } from "@/lib/store/useStyleStore";
import { cn } from "@/lib/utils";

type Selection = Record<"vibes" | "colors" | "icons", string[]>;

const variants = {
  enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
};

export function VibeCheck() {
  const router = useRouter();
  const completeOnboarding = useStyleStore((s) => s.completeOnboarding);

  // step 0..2 = Quiz, step 3 = Ergebnis
  const [[step, dir], setStep] = useState<[number, number]>([0, 1]);
  const [selection, setSelection] = useState<Selection>({ vibes: [], colors: [], icons: [] });

  const isResult = step === QUIZ_STEPS.length;
  const current = QUIZ_STEPS[step];

  const go = (delta: number) => {
    // Ergebnis-Screen: Erfolgs-Sound, sonst Whoosh beim Schrittwechsel
    playSound(step + delta === QUIZ_STEPS.length ? "success" : "whoosh");
    setStep(([s]) => [s + delta, delta]);
  };

  const toggle = (id: string) => {
    playSound("click"); // Auswahl antippen
    if (!current) return;
    setSelection((prev) => {
      const list = prev[current.id];
      if (list.includes(id)) return { ...prev, [current.id]: list.filter((x) => x !== id) };
      // Bei erreichtem Limit ältesten Eintrag ersetzen -> fühlt sich flüssiger an als blockieren
      const next = list.length >= current.max ? [...list.slice(1), id] : [...list, id];
      return { ...prev, [current.id]: next };
    });
  };

  const finish = () => {
    playSound("click");
    completeOnboarding(selection);
    useAuthStore.getState().completeOnboarding(); // Konto merkt sich: Vibe Check erledigt
    router.push("/");
  };

  const canContinue = current ? selection[current.id].length > 0 : true;

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden px-5 pb-6 pt-8">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/25 blur-[100px]" />

      {/* Progress */}
      <header className="relative z-10 mb-6 flex items-center gap-3">
        {step > 0 && !isResult ? (
          <button
            onClick={() => go(-1)}
            aria-label="Zurück"
            className="glass grid h-9 w-9 place-items-center rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <div className="h-9 w-9" />
        )}
        <div className="flex flex-1 gap-1.5">
          {QUIZ_STEPS.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={false}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          ))}
        </div>
      </header>

      <div className="relative z-10 flex-1">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.section
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {isResult ? (
              <Result selection={selection} />
            ) : (
              <>
                <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight">
                  {current.title}
                </h1>
                <p className="mt-2 text-sm text-zinc-400">{current.subtitle}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {current.options.map((opt, i) => (
                    <OptionCard
                      key={opt.id}
                      option={opt}
                      index={i}
                      selected={selection[current.id].includes(opt.id)}
                      onToggle={() => toggle(opt.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <footer className="relative z-10 mt-6">
        {isResult ? (
          <button
            onClick={finish}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent font-display text-lg font-semibold text-white shadow-glow transition active:scale-[0.98]"
          >
            Start Exploring <ArrowRight className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={() => go(1)}
            disabled={!canContinue}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent font-display text-lg font-semibold text-white shadow-glow transition active:scale-[0.98] disabled:bg-white/10 disabled:text-zinc-500 disabled:shadow-none"
          >
            {step === QUIZ_STEPS.length - 1 ? "Ergebnis zeigen" : "Weiter"}
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </footer>
    </main>
  );
}

function OptionCard({
  option,
  index,
  selected,
  onToggle,
}: {
  option: QuizOption;
  index: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const Icon = option.icon;
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl border bg-gradient-to-br p-4 text-left backdrop-blur-md transition-colors",
        option.gradient,
        selected ? "border-accent ring-2 ring-accent/60" : "border-white/10",
      )}
    >
      <div className="text-5xl leading-none">
        {option.emoji}
        {Icon && <Icon className="h-11 w-11 text-white/90" strokeWidth={1.5} />}
        {option.swatches && (
          <div className="flex -space-x-2">
            {option.swatches.map((c) => (
              <span
                key={c}
                className="h-10 w-10 rounded-full border-2 border-zinc-900"
                style={{ background: c }}
              />
            ))}
          </div>
        )}
      </div>
      <span className="font-display text-lg font-semibold leading-tight">{option.label}</span>
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-accent"
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function Result({ selection }: { selection: Selection }) {
  const label = (stepIdx: number, id: string) =>
    QUIZ_STEPS[stepIdx].options.find((o) => o.id === id)?.label ?? id;
  const chips = [
    ...selection.vibes.map((id) => label(0, id)),
    ...selection.colors.map((id) => label(1, id)),
    ...selection.icons.map((id) => label(2, id)),
  ];

  return (
    <div className="flex flex-col items-center pt-10 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 15 }}
        className="grid h-20 w-20 place-items-center rounded-3xl bg-accent shadow-glow"
      >
        <Sparkles className="h-9 w-9" />
      </motion.div>
      <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight">
        Dein Style-Profil
        <br />
        <span className="text-accent-soft">ist ready.</span>
      </h1>
      <p className="mt-3 max-w-xs text-sm text-zinc-400">
        Wir haben deinen Feed schon nach deinem Vibe sortiert.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {chips.map((c, i) => (
          <motion.span
            key={c}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            className="glass rounded-full px-3 py-1.5 text-sm"
          >
            {c}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
