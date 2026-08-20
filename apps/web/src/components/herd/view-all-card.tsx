import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { num } from "@/lib/format";

/**
 * Closes the card grid. The screen shows the head that need a decision, not the
 * whole mob, so the tile has to say how many are being held back.
 */
export function ViewAllCard({ remaining }: { remaining: number }) {
  return (
    <Link
      href="/herd/all"
      className="border-border bg-card hover:border-ink-faint hover:bg-accent/40 focus-visible:ring-ring flex flex-col justify-between gap-3 rounded-md border border-dashed p-3.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <div>
        <p className="text-foreground text-[0.78rem] font-semibold tracking-[-0.01em]">
          View all head
        </p>
        <p className="text-muted-foreground mt-1 text-[11px] leading-[1.5]">
          {num(remaining)} more in this filter, holding condition.
        </p>
      </div>
      <span className="text-primary flex items-center gap-1.5 text-[11px] font-medium">
        Open the register
        <ArrowRight className="size-3" />
      </span>
    </Link>
  );
}
