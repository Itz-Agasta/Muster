import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { HERD_STATS } from "@/lib/data/herd";
import { num } from "@/lib/format";

/**
 * The one place the console admits what it is. Everything else on screen is
 * built to be believed, so this page is deliberately blunt rather than a
 * half-built table that would undercut the rest.
 */
export default function Page() {
  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto p-5">
      <div className="flex max-w-[440px] flex-col gap-4">
        <p className="field-label">Register · all head</p>

        <h1 className="text-foreground text-[1.6rem] leading-[1.15] font-semibold tracking-[-0.02em]">
          You clicked it. It is a demo.
        </h1>

        <p className="text-muted-foreground text-[12.5px] leading-[1.6]">
          All {num(HERD_STATS.total)} head are real records in this build, and the charts on the
          previous screen are drawn from every one of them. A paginated register of the other{" "}
          {num(HERD_STATS.healthy)} healthy animals was not the part worth building first, and
          honestly, what were you expecting?
        </p>

        <p className="text-muted-foreground text-[12.5px] leading-[1.6]">
          The {HERD_STATS.flagged} flagged and {HERD_STATS.monitoring} monitored head are the ones a
          station manager acts on today. They are all on the previous screen.
        </p>

        <Link
          href="/herd"
          className="border-border text-foreground hover:bg-accent focus-visible:ring-ring mt-1 flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-[12px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArrowLeft className="size-3.5" />
          Back to Herd Health
        </Link>
      </div>
    </div>
  );
}
