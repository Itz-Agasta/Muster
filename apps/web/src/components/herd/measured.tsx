"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Charts need a pixel width to lay out marks, and the shell's columns collapse,
 * so the width has to be measured rather than assumed. ResizeObserver keeps this
 * off the scroll and resize event paths.
 */
export function Measured({
  children,
  className,
  min = 320,
}: {
  children: (width: number) => React.ReactNode;
  className?: string;
  min?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {width >= min ? children(Math.round(width)) : null}
    </div>
  );
}
