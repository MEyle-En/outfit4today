import { create } from "zustand";
import { haptic } from "@/lib/utils/haptic";

export type ToastKind = "success" | "error";

interface Toast {
  id: number;
  message: string;
  description?: string;
  kind: ToastKind;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, description?: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;
/** Anzeigedauer, danach gleitet der Toast wieder nach oben raus */
const DURATION = 3000;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (message, description, kind = "success") => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, description, kind }] }));
    haptic(kind === "error" ? "error" : "success");
    setTimeout(() => get().dismiss(id), DURATION);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Von überall aufrufbar: toast("Gespeichert") oder toast("Fehler", "Details", "error"). */
export const toast = (message: string, description?: string, kind: ToastKind = "success") =>
  useToastStore.getState().push(message, description, kind);
