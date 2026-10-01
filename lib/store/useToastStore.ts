import { create } from "zustand";

interface Toast {
  id: number;
  message: string;
  description?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, description?: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (message, description) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, description }] }));
    setTimeout(() => get().dismiss(id), 2200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Von überall aufrufbar: toast("Gespeichert"). */
export const toast = (message: string, description?: string) => useToastStore.getState().push(message, description);
