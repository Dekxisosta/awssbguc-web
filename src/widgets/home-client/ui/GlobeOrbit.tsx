"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  animate,
  type AnimationPlaybackControls,
} from "framer-motion";

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
        style={{ x: springX, y: springY, display: "block", clipPath: "url(#cloud-pill)" }}
        onDragStart={onDragStart}
        onDrag={(_, info) => { rawDragX.set(info.offset.x); rawDragY.set(info.offset.y); }}
        onDragEnd={onDragEnd}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        whileHover={{ scale: 1.12, zIndex: 30 }}
        className="cursor-[inherit] select-none whitespace-nowrap bg-[#00e482] px-4 py-2 font-mono text-xs font-semibold text-[#0f1923] shadow-sm hover:bg-[#00c974]"
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
            className="pointer-events-none fixed w-56 rounded-lg border border-[#00e482]/25 bg-white px-3 py-2 shadow-lg"
            style={{
              zIndex: 9999,
              left: pillRect.left + pillRect.width / 2 - 112,
              top:  pillRect.top - 8,
              transform: "translateY(-100%)",
            }}
          >
            <p className="mb-1 font-mono text-xs font-bold text-[#00874d]">
              {tag.label}
            </p>
            <p className="text-xs leading-snug text-neutral-600">
              {tag.desc}
            </p>
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white"
            />
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}

// ─── Container with SVG lines ────────────────────────────────────────────────

/**
 * Renders a hidden <svg> with a reusable cloud clipPath definition.
 * Each pill references it via clip-path: url(#cloud-pill).
 * The viewBox is 100×44 — normalised so the pill content fills nicely.
 */
function CloudClipDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <clipPath id="cloud-pill" clipPathUnits="objectBoundingBox">
          {/*
            Cloud shape expressed in 0–1 space (objectBoundingBox).
            A classic fluffy cloud: wide base with three rounded bumps on top.
          */}
          <path d="
            M 0.18,0.72
            C 0.06,0.72 0.00,0.62 0.00,0.52
            C 0.00,0.40 0.08,0.32 0.18,0.30
            C 0.18,0.18 0.26,0.08 0.38,0.08
            C 0.44,0.08 0.50,0.10 0.54,0.15
            C 0.58,0.06 0.66,0.00 0.76,0.00
            C 0.88,0.00 0.98,0.10 1.00,0.22
            C 1.00,0.22 1.00,0.22 1.00,0.24
            C 1.00,0.38 0.92,0.48 0.82,0.50
            C 0.84,0.54 0.84,0.58 0.84,0.62
            C 0.84,0.68 0.78,0.72 0.72,0.72
            Z
          " />
        </clipPath>
      </defs>
    </svg>
  );
}

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

      const stroke = "rgba(0,0,0,1)";

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
        line.setAttribute("stroke-width", "1");
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("stroke-dasharray", "4 4");
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
      <CloudClipDefs />
      <svg
        ref={svgRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ overflow: "visible" }}
      />
      {TAGS.map((tag, i) => (
        <DriftTag key={tag.label} tag={tag} index={i} />
      ))}
    </div>
  );
}
