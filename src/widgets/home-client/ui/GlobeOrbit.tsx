"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Pixelify_Sans } from "next/font/google";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  animate,
  type AnimationPlaybackControls,
} from "framer-motion";

const pixel = Pixelify_Sans({ subsets: ["latin"], display: "swap" });

/**
 * Pixel cloud silhouette: every edge is axis-aligned and every step is a fixed 6px, so the bumps
 * stay blocky at any label width (the pill height is fixed, the width follows the label).
 */
const PIXEL_CLOUD =
  "polygon(0 14px, 6px 14px, 6px 8px, 14px 8px, 14px 0, 42% 0, 42% 4px, calc(100% - 14px) 4px, calc(100% - 14px) 8px, calc(100% - 6px) 8px, calc(100% - 6px) 14px, 100% 14px, 100% calc(100% - 8px), calc(100% - 6px) calc(100% - 8px), calc(100% - 6px) 100%, 6px 100%, 6px calc(100% - 8px), 0 calc(100% - 8px))";

const SERVICES: { label: string; desc: string }[] = [
  { label: "EC2",        desc: "Virtual servers in the cloud — scalable compute capacity." },
  { label: "S3",         desc: "Object storage built to store and retrieve any amount of data." },
  { label: "Lambda",     desc: "Run code without provisioning servers — pay per invocation." },
  { label: "RDS",        desc: "Managed relational databases for MySQL, Postgres, and more." },
  { label: "CloudFront", desc: "Global CDN that delivers content with low latency." },
  { label: "IAM",        desc: "Control access to AWS services and resources securely." },
  { label: "DynamoDB",   desc: "Fast, flexible NoSQL database for any scale." },
  { label: "SageMaker",  desc: "Build, train, and deploy ML models at scale." },
  { label: "EKS",        desc: "Managed Kubernetes service for containerised workloads." },
  { label: "Bedrock",    desc: "Foundation models from top AI companies via a single API." },
  { label: "Amplify",    desc: "Full-stack framework for building web & mobile apps on AWS." },
  { label: "Route 53",   desc: "Scalable DNS and domain registration service." },
];

function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}
function rand(seed: number, min: number, max: number) {
  return min + seededRand(seed) * (max - min);
}

interface TagDef {
  label: string;
  desc: string;
  x: number;
  y: number;
  driftX: number[];
  driftY: number[];
  duration: number;
  delay: number;
}

const TAGS: TagDef[] = SERVICES.map(({ label, desc }, i) => {
  const seed = i * 7;
  const col = i % 4;
  const row = Math.floor(i / 4);
  const baseX = 10 + col * 22 + rand(seed, -6, 6);
  const baseY = 15 + row * 28 + rand(seed + 1, -8, 8);
  const r = 8;
  return {
    label, desc, x: baseX, y: baseY,
    driftX: [0, rand(seed+2,-r,r), rand(seed+3,-r,r), rand(seed+4,-r,r), 0],
    driftY: [0, rand(seed+5,-r,r), rand(seed+6,-r,r), rand(seed+7,-r,r), 0],
    duration: rand(seed+8, 6, 11),
    delay:    rand(seed+9, 0, 4),
  };
});

// Pre-compute neighbour connections (2 nearest per tag)
const CONNECTIONS: [number, number][] = (() => {
  const pairs = new Set<string>();
  TAGS.forEach((a, i) => {
    TAGS
      .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter(({ j }) => j !== i)
      .sort((x, y) => x.d - y.d)
      .slice(0, 2)
      .forEach(({ j }) => pairs.add([Math.min(i,j), Math.max(i,j)].join("-")));
  });
  return [...pairs].map(k => k.split("-").map(Number) as [number, number]);
})();

// ─── Single draggable tag ────────────────────────────────────────────────────

function DriftTag({ tag, index }: { tag: TagDef; index: number }) {
  const [hovered, setHovered] = useState(false);
  const pillRef = useRef<HTMLSpanElement>(null);
  const [pillRect, setPillRect] = useState<DOMRect | null>(null);

  const driftX = useMotionValue(0);
  const driftY = useMotionValue(0);
  const rawDragX = useMotionValue(0);
  const rawDragY = useMotionValue(0);
  const springX  = useSpring(rawDragX, { stiffness: 120, damping: 18, mass: 0.8 });
  const springY  = useSpring(rawDragY, { stiffness: 120, damping: 18, mass: 0.8 });

  const dragging = useRef(false);
  const driftCtrlX = useRef<AnimationPlaybackControls | null>(null);
  const driftCtrlY = useRef<AnimationPlaybackControls | null>(null);

  const startDrift = useCallback(() => {
    const opts = {
      duration: tag.duration,
      delay:    tag.delay,
      repeat:   Infinity,
      repeatType: "loop" as const,
      ease:     "easeInOut" as const,
    };
    driftCtrlX.current = animate(driftX, tag.driftX, opts);
    driftCtrlY.current = animate(driftY, tag.driftY, opts);
  }, [driftX, driftY, tag]);

  const stopDrift = useCallback(() => {
    driftCtrlX.current?.stop();
    driftCtrlY.current?.stop();
  }, []);

  useEffect(() => { startDrift(); return () => stopDrift(); }, [startDrift, stopDrift]);

  function onDragStart() {
    dragging.current = true;
    setHovered(false);
    stopDrift();
  }
  function onDragEnd() {
    dragging.current = false;
    rawDragX.set(0);
    rawDragY.set(0);
    setTimeout(startDrift, 850);
  }
  function onMouseEnter() {
    if (dragging.current) return;
    if (pillRef.current) setPillRect(pillRef.current.getBoundingClientRect());
    setHovered(true);
  }
  function onMouseLeave() {
    setHovered(false);
  }

  return (
    <motion.div
      data-tag={index}
      style={{
        position: "absolute",
        left: `${tag.x}%`,
        top:  `${tag.y}%`,
        x: driftX,
        y: driftY,
        cursor: "grab",
      }}
      whileTap={{ cursor: "grabbing" }}
    >
      <motion.span
        ref={pillRef}
        data-pill={index}
        drag
        dragMomentum={false}
        dragElastic={0.18}
        style={{ x: springX, y: springY, display: "block", clipPath: PIXEL_CLOUD }}
        onDragStart={onDragStart}
        onDrag={(_, info) => { rawDragX.set(info.offset.x); rawDragY.set(info.offset.y); }}
        onDragEnd={onDragEnd}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        whileHover={{ zIndex: 30 }}
        className={`${pixel.className} cursor-[inherit] select-none whitespace-nowrap bg-[#3aaa6e] px-5 py-3 text-sm leading-none text-black transition-colors hover:bg-[#b89a0a]`}
      >
        {tag.label}
      </motion.span>

      {/* Tooltip portalled to body — zero effect on container layout/measurement */}
      {hovered && pillRect && createPortal(
        <AnimatePresence>
          <motion.div
            key={`tooltip-${tag.label}`}
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            className={`${pixel.className} pointer-events-none fixed w-56 border-4 border-black bg-[#fff7a1] px-3 py-2 shadow-[4px_4px_0_#b89a0a]`}
            style={{
              zIndex: 9999,
              left: pillRect.left + pillRect.width / 2 - 112,
              top:  pillRect.top - 8,
              transform: "translateY(-100%)",
            }}
          >
            <p className="mb-1 text-sm text-black">
              {tag.label}
            </p>
            <p className="text-xs leading-snug text-black/80">
              {tag.desc}
            </p>
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-full -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-black"
            />
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}

// ─── Container with SVG lines ────────────────────────────────────────────────

export function GlobeOrbit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const rafRef       = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    const svg       = svgRef.current;
    if (!container || !svg) return;

    function tick() {
      const cRect = container!.getBoundingClientRect();
      const pills = container!.querySelectorAll<HTMLElement>("[data-pill]");

      const centres: { x: number; y: number }[] = [];
      pills.forEach(el => {
        const r = el.getBoundingClientRect();
        centres.push({
          x: r.left - cRect.left + r.width  / 2,
          y: r.top  - cRect.top  + r.height / 2,
        });
      });

      svg!.setAttribute("width",  String(cRect.width));
      svg!.setAttribute("height", String(cRect.height));

      const stroke = "#000000";

      const existing = svg!.querySelectorAll("line");
      CONNECTIONS.forEach(([i, j], idx) => {
        const a = centres[i], b = centres[j];
        if (!a || !b) return;
        let line = existing[idx] as SVGLineElement | undefined;
        if (!line) {
          line = document.createElementNS("http://www.w3.org/2000/svg", "line") as SVGLineElement;
          svg!.appendChild(line);
        }
        line.setAttribute("x1", String(a.x));
        line.setAttribute("y1", String(a.y));
        line.setAttribute("x2", String(b.x));
        line.setAttribute("y2", String(b.y));
        line.setAttribute("stroke", stroke);
        line.setAttribute("stroke-width", "3");
        line.setAttribute("stroke-linecap", "butt");
        line.setAttribute("stroke-dasharray", "6 6");
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: 320 }}
      aria-label="AWS services cloud"
    >
      <svg
        ref={svgRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ overflow: "visible", shapeRendering: "crispEdges" }}
      />
      {TAGS.map((tag, i) => (
        <DriftTag key={tag.label} tag={tag} index={i} />
      ))}
    </div>
  );
}