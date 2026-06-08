import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * Imperative confirm dialog — drop-in replacement for window.confirm().
 *
 * Usage:
 *   if (!(await confirmDialog({
 *     title: "Supprimer ?",
 *     description: "Cette action est irréversible.",
 *     confirmLabel: "Supprimer",
 *     destructive: true,
 *   }))) return;
 *
 * Mount <ConfirmRoot /> ONCE at the application root.
 */

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmState = ConfirmOptions & { open: boolean };

const DEFAULT_STATE: ConfirmState = {
  open: false,
  title: "",
  description: "",
  confirmLabel: "Confirmer",
  cancelLabel: "Annuler",
  destructive: false,
};

let externalSet: ((s: ConfirmState) => void) | null = null;
let pendingResolver: ((v: boolean) => void) | null = null;

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  // Fallback if ConfirmRoot was not mounted (e.g., SSR or tests).
  if (!externalSet) {
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      const msg = options.description
        ? `${options.title}\n\n${options.description}`
        : options.title;
      return Promise.resolve(window.confirm(msg));
    }
    return Promise.resolve(false);
  }
  // Resolve any previous unresolved confirm to false.
  if (pendingResolver) {
    pendingResolver(false);
    pendingResolver = null;
  }
  return new Promise<boolean>((resolve) => {
    pendingResolver = resolve;
    externalSet!({
      open: true,
      title: options.title,
      description: options.description ?? "",
      confirmLabel: options.confirmLabel ?? "Confirmer",
      cancelLabel: options.cancelLabel ?? "Annuler",
      destructive: !!options.destructive,
    });
  });
}

export function ConfirmRoot() {
  const [state, setState] = useState<ConfirmState>(DEFAULT_STATE);

  useEffect(() => {
    externalSet = setState;
    return () => {
      externalSet = null;
    };
  }, []);

  function resolve(value: boolean) {
    if (pendingResolver) {
      pendingResolver(value);
      pendingResolver = null;
    }
    setState((s) => ({ ...s, open: false }));
  }

  return (
    <AlertDialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) resolve(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state.title}</AlertDialogTitle>
          {state.description && (
            <AlertDialogDescription>{state.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => resolve(false)}>
            {state.cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => resolve(true)}
            className={cn(
              state.destructive &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
          >
            {state.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
