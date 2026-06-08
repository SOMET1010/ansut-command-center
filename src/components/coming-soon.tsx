import { Construction, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="section-gap">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ce module est en cours de développement.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/50 px-8 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Construction className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mt-5 text-lg font-bold text-foreground">Bientôt disponible</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Ce module sera livré en <span className="font-semibold text-foreground">{phase}</span>.
          Nous travaillons activement à son développement.
        </p>
        <Button asChild variant="outline" className="mt-6 rounded-xl">
          <Link to="/dashboard">
            Retour au tableau de bord
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
