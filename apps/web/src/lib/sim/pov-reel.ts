import { MUSTER_CREW } from "@/lib/data/fleet";

/**
 * The down-camera clip pool. These are not per-aircraft files: every crew
 * aircraft draws from all four, because in practice a judge opens one feed and
 * watches that. Splitting the pool between the two aircraft would have spent
 * half the footage on a feed nobody opens, and left the one on screen repeating
 * after two clips.
 */
const CLIPS = ["/pov/pov-1.mp4", "/pov/pov-2.mp4", "/pov/pov-3.mp4", "/pov/pov-4.mp4"];

export type Reels = Record<string, string[]>;

/** What each aircraft opened on last time, so it does not open on it again. */
const lastOpener: Record<string, string | undefined> = {};

function shuffled(id: string): string[] {
  const pool = [...CLIPS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j] as string, pool[i] as string];
  }

  // A plain shuffle opens on the same clip about one run in four, and two
  // demos back to back that start with the same ten seconds is the thing that
  // makes a pool look like a single video. Index 1 is itself random, so
  // swapping into it costs no variety.
  if (pool[0] === lastOpener[id]) [pool[0], pool[1]] = [pool[1] as string, pool[0] as string];
  lastOpener[id] = pool[0];
  return pool;
}

/**
 * Give each crew aircraft its own order over the whole pool, redealt on every
 * run and never opening twice running on the same clip. One feed therefore shows about fifty seconds of distinct footage before
 * it comes round again, against a ninety second muster, and the two aircraft
 * are unlikely to be on the same clip at the same moment.
 *
 * Only the muster crew gets a feed at all: the survey aircraft is flying its own
 * grid on the other side of the ranch and its imagery reaches this console as
 * PastureView, not as video.
 */
export function dealReels(): Reels {
  return Object.fromEntries(MUSTER_CREW.map((id) => [id, shuffled(id)]));
}

export function isCrew(id: string): boolean {
  return (MUSTER_CREW as readonly string[]).includes(id);
}
