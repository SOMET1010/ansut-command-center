import { Construction } from "lucide-react";

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="mt-8 rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
        <Construction className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-3 text-lg font-semibold">Bientôt disponible</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ce module sera livré en {phase}.</p>
      </div>
    </div>
  );
}
