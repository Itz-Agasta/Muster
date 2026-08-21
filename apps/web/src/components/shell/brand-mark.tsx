/**
 * The Muster mark: a paddock boundary with one deliberate break in it, and the
 * mob inside heading for the break.
 *
 * The break is the gate, which is the whole product in one shape. Mustering is
 * not watching a herd, it is moving one out of somewhere and into somewhere
 * else, and a closed ring would have said monitoring.
 *
 * Drawn in currentColor so it takes the primary token in both themes rather
 * than carrying a hex that has to be maintained twice. The standalone tab icon
 * at app/icon.svg is the same geometry with the colours baked in, because a
 * favicon has no stylesheet to inherit from.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden focusable="false">
      <path
        d="M27.5 22.5 L16 29.5 L3 23 L3 9 L16 2.5 L27.5 9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14.2" cy="16" r="4.5" fill="currentColor" />
    </svg>
  );
}
