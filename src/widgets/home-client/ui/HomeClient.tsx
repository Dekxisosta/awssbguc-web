"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { bodyFont, displayFont, hd } from "@/src/shared/config/fonts";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { GlobeOrbit } from "./GlobeOrbit";
import { SOCIALS, MAILTO } from "@/src/shared/config/socials";
import type { PublicMemberProfile } from "@/src/entities/member";

/**
 * Home page in the style of a pixel-art portfolio:
 *  - black ground, butter-yellow type, Jersey 10 (pixel) for headlines, JetBrains Mono for text (both from src/shared/config/fonts.ts)
 *  - one motif: a vertical stripe "tunnel" with stepped edges, reused as thin dividers
 *  - the hero is a two-column split: text on the left, a full-colour photo with a striped panel and a butter card on the right
 *  - hard offset shadows and square corners, no blur, no gradients, no rounded anything
 *  - only the moving side pixels use the green-teal palette from the Operations poster
 */

// Fonts live in src/shared/config/fonts.ts. Re-exported so existing imports from this widget keep working.
export { hd };

const HERO_IMAGES = ["/images/hero/1.jpg", "/images/hero/2.jpg", "/images/hero/3.jpg", "/images/hero/4.jpg"];

const STRIPES: [string, number][] = [
  ["#b32a0e", 8], ["#2c8f8f", 10], ["#000000", 3], ["#3aaa6e", 14], ["#b32a0e", 9], ["#000000", 3],
  ["#5f9e80", 8], ["#2c8f8f", 12], ["#3aaa6e", 9], ["#000000", 3], ["#b32a0e", 11], ["#2c8f8f", 10],
];
const STRIPE_BG = (() => {
  let at = 0;
  const stops = STRIPES.map(([c, w]) => {
    const s = `${c} ${at}% ${at + w}%`;
    at += w;
    return s;
  });
  return `linear-gradient(90deg, ${stops.join(", ")})`;
})();

export const wrap = "mx-auto w-full max-w-[1300px] px-5 sm:px-8";
// Home page only: lets desktop content use more of the screen. Other pages keep `wrap`.
const WIDE_MAX = 1680;
export const wrapWide = "mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-16";
export const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2c8f8f]";
export const btnDark = `inline-block border-4 border-black bg-black px-6 py-3 text-lg text-[#fff7a1] shadow-[4px_4px_0_#b32a0e] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#b32a0e] ${focus}`;

export function Stripes({ className = "h-4" }: { className?: string }) {
  return <div aria-hidden="true" className={className} style={{ background: STRIPE_BG }} />;
}

// ─── WIP banner (unchanged) ──────────────────────────────────────────────────

function WIPBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    if (!sessionStorage.getItem("wip-dismissed")) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem("wip-dismissed", "1");
    setVisible(false);
  }

  // Escape closes the dialog.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop: flat black, no blur, like the rest of the site */}
          <motion.div
            key="wip-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[99990] bg-black/80"
            onClick={dismiss}
            aria-hidden="true"
          />

          {/* Dialog: same OS-window look as the hero (title bar, stripe divider, hard shadow) */}
          <motion.div
            key="wip-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wip-title"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="pointer-events-none fixed inset-0 z-[99991] flex items-center justify-center px-4"
          >
            <div
              className={`${bodyFont.className} pointer-events-auto relative w-full max-w-md border-4 border-[#2c8f8f] bg-black text-[#fff7a1] shadow-[8px_8px_0_#b32a0e]`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 bg-[#2c8f8f] px-2 py-1 text-sm text-black">
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden="true" className="h-3 w-3 shrink-0 border-2 border-black" />
                  <span className="truncate">work_in_progress.txt</span>
                </span>
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Close"
                  className={`grid h-5 w-5 shrink-0 place-items-center border-2 border-black bg-[#b32a0e] text-[#fff7a1] ${focus}`}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" aria-hidden="true">
                    <path d="M1 1 9 9M9 1 1 9" />
                  </svg>
                </button>
              </div>
              <Stripes className="h-3" />

              <div className="p-6">
                <div className="flex items-center gap-4">
                  <Image src="/icons/logo.webp" alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
                  <h2 id="wip-title" className={`${hd} text-5xl`}>
                    Work in progress
                  </h2>
                </div>

                <p className="mt-5 leading-relaxed">
                  This site is still being built. Some pages or features may be incomplete, broken, or missing.
                </p>
                <p className="mt-3 leading-relaxed">
                  Spotted something? Let us know at{" "}
                  <a href={MAILTO} className={`text-[#2c8f8f] underline underline-offset-4 ${focus}`}>
                    {SOCIALS.email}
                  </a>{" "}
                  and we&apos;ll get it fixed.
                </p>

                <button
                  type="button"
                  onClick={dismiss}
                  autoFocus
                  className={`${displayFont.className} mt-6 w-full border-4 border-black bg-[#fff7a1] py-3 text-3xl leading-none text-black shadow-[4px_4px_0_#2c8f8f] transition-[transform,box-shadow] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#2c8f8f] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none motion-reduce:transition-none ${focus}`}
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ─── Animated pixels at the page edges ───────────────────────────────────────

// The moving side pixels use the green-teal palette from the Operations poster; the rest of the page keeps the original colors.
const RAIN_COLORS = ["#2cf57f", "#1fb877", "#0d5c55", "#1b9c94", "#d9ffe9"];
const CELL = 20; // size of one moving pixel (was 12)
const SIDE_PIXEL_OPACITY = 0.35; // overall transparency of the moving pixels (1 = solid)

// Left, up, right, down: every pixel walks in this order and then repeats it.
const DIRS: [number, number][] = [[-1, 0], [0, -1], [1, 0], [0, 1]];

type Mover = {
  x: number;
  y: number;
  dir: number; // index into DIRS
  left: number; // cells left to walk before turning
  runs: number[]; // length of each leg, per direction
  trail: { x: number; y: number }[]; // newest first
  len: number;
  color: string;
};

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

/**
 * Pixels that crawl along the page edges: left, up, right, down, repeat. Each leg is a few cells long
 * (and a little different per pixel, so they drift instead of tracing identical squares), and each pixel
 * leaves a short fading trail. Densest at the outer edge, fading out toward the content.
 */
export function SidePixels({ side, contentWidth = 1300 }: { side: "left" | "right"; contentWidth?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    let w = 0, h = 0, cols = 0, rows = 0;
    let movers: Mover[] = [];
    const pick = () => RAIN_COLORS[Math.floor(Math.random() * RAIN_COLORS.length)];
    // 1 at the outer edge, fading toward the content
    const strength = (col: number) => {
      const fromOuter = side === "left" ? col : cols - 1 - col;
      return Math.max(0, 1 - fromOuter / Math.max(cols, 1));
    };

    const setup = () => {
      w = Math.max(1, wrap.clientWidth);
      h = Math.max(1, wrap.clientHeight);
      canvas.width = w;
      canvas.height = h;
      cols = Math.floor(w / CELL);
      rows = Math.ceil(h / CELL);
      movers = [];
      if (cols < 1) return;
      for (let c = 0; c < cols; c++) {
        const n = Math.round((strength(c) * rows) / 12);
        for (let i = 0; i < n; i++) {
          const runs = [rand(2, 5), rand(2, 5), rand(2, 5), rand(2, 5)];
          const dir = rand(0, 3);
          movers.push({ x: c, y: rand(0, rows - 1), dir, left: runs[dir], runs, trail: [], len: rand(4, 9), color: pick() });
        }
      }
    };

    const draw = (advance: boolean) => {
      ctx.clearRect(0, 0, w, h);
      for (const m of movers) {
        if (advance) {
          m.trail.unshift({ x: m.x, y: m.y });
          if (m.trail.length > m.len) m.trail.pop();
          const [dx, dy] = DIRS[m.dir];
          m.x = (m.x + dx + cols) % cols;
          m.y = (m.y + dy + rows) % rows;
          if (--m.left <= 0) {
            m.dir = (m.dir + 1) % 4;
            m.left = m.runs[m.dir];
          }
        }
        ctx.fillStyle = m.color;
        const cells = [{ x: m.x, y: m.y }, ...m.trail];
        cells.forEach((cell, k) => {
          const a = Math.ceil((1 - k / (m.len + 1)) * 4) / 4 * strength(cell.x); // four hard fade steps down the trail
          if (a <= 0.05) return;
          ctx.globalAlpha = Math.min(1, Math.ceil(a * 4) / 4) * SIDE_PIXEL_OPACITY;
          ctx.fillRect(cell.x * CELL, cell.y * CELL, CELL - 3, CELL - 3);
        });
      }
      ctx.globalAlpha = 1;
    };

    setup();
    draw(false);
    const ro = new ResizeObserver(() => {
      setup();
      draw(false);
    });
    ro.observe(wrap);

    // ~3 steps per second: slow, blocky drift, and cheap on tall pages.
    const timer = reduce ? undefined : window.setInterval(() => !document.hidden && draw(true), 320);
    return () => {
      ro.disconnect();
      if (timer) window.clearInterval(timer);
    };
  }, [side, reduce]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{ width: `clamp(16px, calc((100% - ${contentWidth}px) / 2), 320px)` }}
      className={`pointer-events-none absolute inset-y-0 z-0 ${side === "left" ? "left-0" : "right-0"}`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

// ─── Pixel clouds (background) ───────────────────────────────────────────────

/** Cloud sprites: "X" is a filled pixel. Kept small so the drift reads as blocky, not smooth. */
const CLOUD_SHAPES: string[][] = [
  [
    "......XXXX........",
    "...XXXXXXXXXX.XX..",
    "..XXXXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXXXXXX",
    ".XXXXXXXXXXXXXXXX.",
  ],
  [
    "....XXX.......",
    "..XXXXXXX.XX..",
    ".XXXXXXXXXXXX.",
    "XXXXXXXXXXXXXX",
  ],
  [
    "...XX.....",
    ".XXXXXX.X.",
    "XXXXXXXXXX",
  ],
];

const CLOUD_PX = 12; // size of one cloud pixel in viewBox units
const CLOUD_VB_W = 1440;
const CLOUD_VB_H = 900;

// y: top edge, s: scale, dur: seconds to cross the screen, delay: negative so they start spread out,
// x: resting position when motion is reduced, o: opacity (kept very low on purpose).
const CLOUDS = [
  { shape: 0, y: 60,  s: 2,   dur: 170, delay: -30,  x: 160,  c: "#fff7a1", o: 0.05 },
  { shape: 2, y: 170, s: 1.5, dur: 120, delay: -90,  x: 900,  c: "#2c8f8f", o: 0.07 },
  { shape: 1, y: 300, s: 2.5, dur: 210, delay: -140, x: 520,  c: "#fff7a1", o: 0.04 },
  { shape: 0, y: 450, s: 1.5, dur: 150, delay: -60,  x: 1100, c: "#3aaa6e", o: 0.05 },
  { shape: 2, y: 580, s: 2,   dur: 130, delay: -10,  x: 300,  c: "#fff7a1", o: 0.05 },
  { shape: 1, y: 700, s: 1.5, dur: 190, delay: -120, x: 780,  c: "#2c8f8f", o: 0.06 },
  { shape: 0, y: 810, s: 2.5, dur: 240, delay: -170, x: 40,   c: "#fff7a1", o: 0.04 },
];

/** Merge each row of a sprite into horizontal runs so a cloud is a handful of rects, not hundreds. */
function cloudRects(rows: string[]) {
  const rects: { x: number; y: number; w: number }[] = [];
  rows.forEach((row, r) => {
    let start = -1;
    for (let c = 0; c <= row.length; c++) {
      const on = c < row.length && row[c] === "X";
      if (on && start < 0) start = c;
      if (!on && start >= 0) {
        rects.push({ x: start * CLOUD_PX, y: r * CLOUD_PX, w: (c - start) * CLOUD_PX });
        start = -1;
      }
    }
  });
  return rects;
}

/** Very faint pixel clouds drifting left to right behind the page. Static when reduced motion is on. */
export function PixelClouds() {
  const reduce = useReducedMotion();
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${CLOUD_VB_W} ${CLOUD_VB_H}`}
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    >
      {CLOUDS.map((cl, i) => {
        const rows = CLOUD_SHAPES[cl.shape];
        const width = rows[0].length * CLOUD_PX * cl.s;
        return (
          <g key={i} fill={cl.c} opacity={cl.o}>
            <g transform={reduce ? `translate(${cl.x} 0)` : undefined}>
              {!reduce && (
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from={`${-width} 0`}
                  to={`${CLOUD_VB_W} 0`}
                  dur={`${cl.dur}s`}
                  begin={`${cl.delay}s`}
                  repeatCount="indefinite"
                />
              )}
              <g transform={`translate(0 ${cl.y}) scale(${cl.s})`}>
                {cloudRects(rows).map((r, k) => (
                  <rect key={k} x={r.x} y={r.y} width={r.w} height={CLOUD_PX} />
                ))}
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Photo ───────────────────────────────────────────────────────────────────
// Plain, smoothly scaled photo (no pixelation). Name and props are kept so existing callers still work;
// width/height only set the aspect ratio now.

const PW = 40;
const PH = 50;

export function PixelPhoto({ src, width = PW, height = PH }: { src: string; width?: number; height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      style={{ aspectRatio: `${width} / ${height}` }}
      className="block w-full object-cover"
    />
  );
}

// ─── Wandering duck ──────────────────────────────────────────────────────────

const DUCK_PX = 4;
const DUCK_COLS = 39;
const DUCK_ROWS = 48;
const DUCK_W = DUCK_COLS * DUCK_PX;

/**
 * The duck is a horizontal sprite sheet (public/images/duck/duck-sprites.svg): frames sit side by side,
 * each DUCK_COLS x DUCK_ROWS units. Frame 0 is the standing pose; the walk cycle loops through all of them.
 * After adding frames to the SVG, update DUCK_FRAME_COUNT to match.
 */
const DUCK_SHEET = "/images/duck/duck-sprites.svg";
const DUCK_FRAME_COUNT = 2;

function DuckSprite({ frame }: { frame: number }) {
  return (
    <div
      style={{
        width: DUCK_W,
        height: DUCK_ROWS * DUCK_PX,
        backgroundImage: `url(${DUCK_SHEET})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${DUCK_FRAME_COUNT * 100}% 100%`,
        backgroundPosition: `${DUCK_FRAME_COUNT > 1 ? (frame / (DUCK_FRAME_COUNT - 1)) * 100 : 0}% 0`,
      }}
    />
  );
}

const DUCK_LINES = ["Join Us!", "I love matcha!"];

/**
 * An engineer duck (hard hat, laptop under one wing, coffee in the other) that strolls back and forth
 * under the hero's right-hand text and alternates between "Join Us!" and "I love matcha!".
 * Stands still (saying "Join Us!") when reduced motion is on.
 */
function WanderingDuck() {
  const reduce = useReducedMotion();
  const [pos, setPos] = useState(0.5); // 0..1 along the walkable strip
  const [dur, setDur] = useState(0);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [walking, setWalking] = useState(false);
  const [frame, setFrame] = useState(0);
  const [line, setLine] = useState(0);
  const posRef = useRef(0.5);
  const walkingRef = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const wander = () => {
    let target = Math.random();
    while (Math.abs(target - posRef.current) < 0.2) target = Math.random();
    const dist = Math.abs(target - posRef.current);
    setFacing(target > posRef.current ? 1 : -1);
    setDur(dist * 7); // a full pass takes about 7 seconds
    setLine((l) => (l + 1) % DUCK_LINES.length);
    setPos(target);
    posRef.current = target;
    walkingRef.current = true;
    setWalking(true);
  };

  const arrived = () => {
    if (!walkingRef.current) return;
    walkingRef.current = false;
    setWalking(false);
    timer.current = window.setTimeout(wander, 1800 + Math.random() * 2400);
  };

  useEffect(() => {
    if (reduce) return;
    timer.current = window.setTimeout(wander, 1200);
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  // Alternate leg poses while walking.
  useEffect(() => {
    if (!walking) {
      setFrame(0);
      return;
    }
    const id = window.setInterval(() => setFrame((f) => (f + 1) % DUCK_FRAME_COUNT), 180);
    return () => window.clearInterval(id);
  }, [walking]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative mt-6 h-[260px] w-full border-b-4 border-dashed border-[#2c8f8f]/40 lg:mt-[2vh] lg:h-[clamp(252px,30vh,300px)] xl:mt-0"
    >
      <div className="absolute bottom-0 left-0 h-full" style={{ width: `calc(100% - ${DUCK_W}px)` }}>
        <motion.div
          className="absolute bottom-0"
          initial={false}
          animate={{ left: `${pos * 100}%` }}
          transition={{ duration: reduce ? 0 : dur, ease: "linear" }}
          onAnimationComplete={arrived}
        >
          <motion.div
            className="relative"
            style={{ width: DUCK_W }}
            animate={walking && !reduce ? { y: [0, -4, 0] } : { y: 0 }}
            transition={walking ? { duration: 0.36, repeat: Infinity, ease: "easeInOut" } : { duration: 0.1 }}
          >
            <div
              className="absolute bottom-full mb-3 -translate-x-1/2 whitespace-nowrap border-4 border-black bg-[#fff7a1] px-3 py-1 text-lg leading-none text-black shadow-[4px_4px_0_#2c8f8f]"
              style={{ left: `${facing === 1 ? 65 : 35}%` }}
            >
              {DUCK_LINES[line]}
              <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b-4 border-r-4 border-black bg-[#fff7a1]" />
            </div>
            <div style={{ transform: `scaleX(${facing})` }}>
              <DuckSprite frame={frame} />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Map ─────────────────────────────────────────────────────────────────────

/** The world map, drawn as-is (no downscaling, alpha thresholding or hard-edge scaling). */
function PixelMap({ src, width = 128, height = 80 }: { src: string; width?: number; height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      decoding="async"
      style={{ aspectRatio: `${width} / ${height}` }}
      className="block h-auto w-full object-contain"
    />
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

// A tiny "OS window" frame used by the hero: title bar with square window buttons, then the content.
function TitleBar({ title, tone }: { title: string; tone: "teal" | "ink" }) {
  const bar = tone === "teal" ? "bg-[#2c8f8f] text-black" : "bg-black text-[#fff7a1]";
  const btn = tone === "teal" ? "border-black" : "border-[#fff7a1]";
  return (
    <div aria-hidden="true" className={`flex items-center justify-between gap-3 px-2 py-1 ${bar}`}>
      <span className="flex min-w-0 items-center gap-2 text-sm">
        <span className={`h-3 w-3 shrink-0 border-2 ${btn}`} />
        <span className="truncate">{title}</span>
      </span>
      <span className="flex shrink-0 gap-1">
        <span className={`h-3.5 w-3.5 border-2 ${btn}`} />
        <span className={`h-3.5 w-3.5 border-2 ${btn}`} />
        <span className={`grid h-3.5 w-3.5 place-items-center border-2 ${btn} ${tone === "teal" ? "bg-black" : "bg-[#b32a0e]"}`} />
      </span>
    </div>
  );
}

function Tunnel({ registeredCount, participantCount }: { registeredCount: number; participantCount: number }) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  // Advance every 5s. Picking a dot changes `index`, which restarts this timer.
  useEffect(() => {
    if (reduce) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearTimeout(id);
  }, [index, reduce]);

  const stats = [
    { value: registeredCount, label: "registered" },
    { value: participantCount, label: "participants" },
  ].filter((s) => s.value > 0);

  return (
    <div className="relative mx-auto w-full max-w-[780px] pb-8 lg:mr-0">
      {/* Slim striped panel peeking out behind the photo and the card. */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 top-12 w-[34%]" style={{ background: STRIPE_BG }} />

      {/* Floating logo, like a desktop icon sitting on the stripes. Hidden on phones where the card spans the width. */}
      <motion.div
        aria-hidden="true"
        className="absolute bottom-14 left-[3%] z-20 hidden w-[18%] max-w-[130px] flex-col items-center gap-1 sm:flex"
        animate={reduce ? undefined : { y: [0, -12, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="block w-full border-4 border-black bg-black p-2 shadow-[6px_6px_0_#000]">
          <Image src="/icons/logo.webp" alt="" width={120} height={120} className="h-auto w-full" />
        </span>
        <span className="bg-black px-1.5 py-0.5 text-xs text-[#fff7a1]">AWSSBG-UC</span>
      </motion.div>

      {/* Photo viewer window */}
      <div className="relative ml-[10%] border-4 border-black bg-black shadow-[8px_8px_0_#000]">
        <TitleBar title="event_highlights.jpg" tone="teal" />
        <div className="relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:h-[clamp(200px,calc((100svh-64px)*0.5-3.5rem),584px)]">
          {HERO_IMAGES.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 48vw, 92vw"
              className={`object-cover transition-opacity duration-700 motion-reduce:transition-none ${i === index ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between border-t-4 border-[#2c8f8f] bg-black px-3 text-sm text-[#fff7a1]">
          <span aria-live="off">
            photo {index + 1} of {HERO_IMAGES.length}
          </span>
          <div className="flex">
            {HERO_IMAGES.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1} of ${HERO_IMAGES.length}`}
                aria-current={i === index}
                className={`p-1.5 ${focus}`}
              >
                <span className={`block h-2.5 w-2.5 border border-[#fff7a1] ${i === index ? "bg-[#fff7a1]" : "bg-transparent"}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Join dialog window */}
      <div className="relative z-10 -mt-10 ml-auto w-[92%] border-4 border-black bg-[#fff7a1] text-black shadow-[8px_8px_0_#000] sm:w-[72%]">
        <TitleBar title="join.exe" tone="ink" />
        <div className="p-5 text-center">
          <h2 className={`${hd} text-4xl text-balance xl:text-5xl`}>
            Ready to build with us?
            <motion.span
              aria-hidden="true"
              className="ml-1 inline-block h-[0.8em] w-[0.45em] translate-y-[0.08em] bg-black align-baseline"
              animate={reduce ? undefined : { opacity: [1, 1, 0, 0] }}
              transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
            />
          </h2>
          <p className="mt-2 leading-snug">Free for every University of Cabuyao student. No experience needed.</p>
          {stats.length > 0 && (
            <dl className="mt-3 flex justify-center gap-8">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse">
                  <dt className="text-sm">{s.label}</dt>
                  <dd className={`${hd} text-4xl tabular-nums`}>{s.value.toLocaleString()}</dd>
                </div>
              ))}
            </dl>
          )}
          <Link
            href="/signup"
            className={`${displayFont.className} group mt-5 flex w-full items-center justify-center gap-3 border-4 border-black bg-[#b32a0e] px-4 py-3 text-3xl leading-none text-[#fff7a1] shadow-[6px_6px_0_#000] transition-[transform,box-shadow] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none motion-reduce:transition-none sm:text-4xl ${focus}`}
          >
            <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center bg-black">
              <span className="block h-3.5 w-3 bg-[#fff7a1] [clip-path:polygon(0_0,100%_50%,0_100%)]" />
            </span>
            Join the community
          </Link>
          <Link href="/events" className={`mt-3 inline-block underline underline-offset-4 ${focus}`}>
            See upcoming events
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── AWS technology ticker ───────────────────────────────────────────────────

// Text-only marquee under the hero tagline. No hover or click behaviour, it just scrolls.
const AWS_TECH = [
  "Amazon EC2", "Amazon S3", "AWS Lambda", "Amazon DynamoDB", "Amazon RDS", "Amazon VPC",
  "AWS IAM", "Amazon CloudFront", "Amazon Route 53", "Amazon ECS", "Amazon EKS", "AWS CloudFormation",
  "AWS CDK", "Amazon API Gateway", "Amazon SNS", "Amazon SQS", "Amazon CloudWatch", "AWS Amplify",
  "Amazon SageMaker", "Amazon Bedrock", "Kiro",
];
const TICKER_DOTS = ["#b32a0e", "#2c8f8f", "#3aaa6e", "#5f9e80"];

function AwsTicker() {
  const reduce = useReducedMotion();
  const list = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className={`flex shrink-0 items-center ${reduce ? "w-full flex-wrap gap-y-1" : ""}`}>
      {AWS_TECH.map((name, i) => (
        <li key={name} className="flex items-center whitespace-nowrap pr-5">
          <span aria-hidden="true" className="mr-5 h-2.5 w-2.5 shrink-0" style={{ background: TICKER_DOTS[i % TICKER_DOTS.length] }} />
          {name}
        </li>
      ))}
    </ul>
  );
  return (
    <div aria-label="AWS technologies we work with" role="group" className="w-full min-w-0 max-w-full overflow-hidden border-b-4 border-[#2c8f8f] py-2 text-lg">
      {reduce ? (
        list(false)
      ) : (
        <motion.div
          className="flex w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 250, repeat: Infinity, ease: "linear" }}
        >
          {list(false)}
          {list(true)}
        </motion.div>
      )}
    </div>
  );
}

function Hero({ registeredCount, participantCount }: { registeredCount: number; participantCount: number }) {
  const socials = [
    { label: "Discord", href: SOCIALS.discord, external: true },
    { label: "Facebook", href: SOCIALS.facebook, external: true },
    { label: "Email", href: MAILTO, external: false },
  ];
  return (
    <section className={`${wrapWide} flex flex-col pb-10 pt-4 lg:min-h-[calc(100svh-64px)] lg:pb-6`}>
      <nav aria-label="Find us" className="flex flex-wrap justify-center gap-3 lg:justify-end">
        {socials.map((l) => (
          <a
            key={l.label}
            href={l.href}
            {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={`border-4 border-[#2c8f8f] px-3 py-1 transition-colors hover:bg-[#2c8f8f] hover:text-black ${focus}`}
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div className="mt-4 grid flex-1 grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10 xl:gap-20">
        <div className="min-w-0 text-left">
          {/* Magazine-style stack: kicker, masthead, deck between rules, big statement, body + duck. */}
          <p className="text-xl">Hi, we are</p>
          <h1 className={`${hd} mt-2 whitespace-nowrap text-[length:clamp(2.75rem,15vw,6rem)] lg:text-[length:clamp(4rem,min(7vw,14vh),8.5rem)]`}>
            <span className="sr-only">Amazon Web Services Student Builder Group - University of Cabuyao</span>
            <span aria-hidden="true">AWSSBG - UC</span>
          </h1>
          <p className={`${displayFont.className} mt-3 border-y-4 border-[#2c8f8f] py-2 text-2xl uppercase leading-none tracking-wide text-[#2c8f8f] sm:text-3xl`}>
            Amazon Web Services Student Builder Group - University of Cabuyao
          </p>
          <AwsTicker />
          <p className={`${hd} mt-5 text-[length:clamp(2.75rem,min(4.4vw,8vh),5.25rem)] lg:mt-[2.5vh]`}>
            We&apos;re{" "}
            <span className="underline decoration-[#3aaa6e] decoration-4 underline-offset-8">students</span>,{" "}
            <span className="underline decoration-[#b89a0a] decoration-4 underline-offset-8">builders</span>,{" "}
            <span className="underline decoration-[#2c8f8f] decoration-4 underline-offset-8">tinkerers</span>,{" "}
            <span className="underline decoration-[#b32a0e] decoration-4 underline-offset-8">dreamers</span>.
          </p>
          <div className="mt-5 xl:mt-[2vh] xl:grid xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:items-center xl:gap-8">
            <p className="max-w-xl border-l-4 border-[#b89a0a] pl-4 text-lg leading-snug">
              The AWS Student Builder Group of the University of Cabuyao. We run workshops, ship projects, and learn AWS together, for free.
            </p>
            <WanderingDuck />
          </div>
        </div>

        <Tunnel registeredCount={registeredCount} participantCount={participantCount} />
      </div>
    </section>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

export function Section({ title, intro, children, wide = false }: { title: string; intro?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <>
      <Stripes />
      <section className={`${wide ? wrapWide : wrap} py-14 sm:py-20`}>
        <h2 className={`${hd} text-6xl sm:text-8xl`}>{title}</h2>
        {intro && <p className={`mt-5 text-lg leading-relaxed ${wide ? "max-w-2xl" : "max-w-xl"}`}>{intro}</p>}
        <div className="mt-10">{children}</div>
      </section>
    </>
  );
}

// ─── Community partners ──────────────────────────────────────────────────────

// isCircle: true  -> fixed square tile, logo cropped to a circle (round seals and badges).
// isCircle: false -> same tile height, width follows the logo's own aspect ratio, no cropping (default).
const COMMUNITY_PARTNERS: { name: string; logo: string; href?: string; isCircle?: boolean }[] = [
  { name: "TutorialsDojo",                                                              logo: "/images/logos/tutorials-dojo.png",  href: "https://tutorialsdojo.com/" },
  { name: "BayanHealth",                                                                logo: "/images/logos/bayanhealth.png",      href: "https://bayanhealth.com/" },
  { name: "DEVCON Laguna Chapter",                                                      logo: "/images/logos/devcon-laguna.png" },
  { name: "Association of Computer Science Students - UC",                              logo: "/images/logos/acss-uc.png",         isCircle: true },
  { name: "Society of Information Technology Students - UC",                            logo: "/images/logos/sits-uc.png",         isCircle: true },
  { name: "Junior Mechatronics and Robotics Society of the Philippines - UC Chapter",   logo: "/images/logos/jmrsp-uc.png",         isCircle: true },
  { name: "Junior Institute of Electronics Engineers of the Philippines - UC",          logo: "/images/logos/jieep-uc.png",         isCircle: true },
  { name: "Association of Computer Engineering Students - UC",                          logo: "/images/logos/aces-uc.png",         isCircle: true },
  { name: "AWS Learning Club - Polar",                                                  logo: "/images/logos/awslc-polar.png",     isCircle: true },
  { name: "AWS Student Builder Group - Aeris",                                          logo: "/images/logos/awssbg-aeris.png",    isCircle: true },
  { name: "AWS Student User Group Philippines",                                         logo: "/images/logos/awsug-ph.png",        isCircle: true },
];

function PartnerTile({ name, logo, href, isCircle }: { name: string; logo: string; href?: string; isCircle: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null; // logo file missing: drop the tile instead of showing a broken image
  // No background, border or padding: the logo itself is the tile.
  const frame = "relative block h-24";
  const tile = isCircle ? (
    // Round seal: fixed square tile, logo cropped to a circle.
    <span className={`${frame} w-24`}>
      <span className="relative block h-full w-full overflow-hidden rounded-full">
        <Image src={logo} alt={name} title={name} fill sizes="80px" className="object-contain" onError={() => setFailed(true)} />
      </span>
    </span>
  ) : (
    // Any other logo: same tile height as the rest, width follows the image's own aspect ratio.
    // width/height 0 + h-full/w-auto lets the browser size it from the file; max-w caps very wide logos.
    <span className={`${frame} w-fit max-w-[18rem]`}>
      <Image
        src={logo}
        alt={name}
        title={name}
        width={0}
        height={0}
        sizes="288px"
        className="block h-full w-auto max-w-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`group block w-fit ${focus}`}>
      {tile}
    </a>
  ) : (
    <span className="group block w-fit">{tile}</span>
  );
}

function Partners() {
  return (
    <Section wide title="Community partners" intro="Student organizations and cloud communities that run events with us.">
      <div className="flex flex-wrap gap-6">
        {COMMUNITY_PARTNERS.map((p) => (
          <PartnerTile key={p.name} name={p.name} logo={p.logo} href={p.href} isCircle={p.isCircle ?? false} />
        ))}
      </div>
    </Section>
  );
}

// ─── What and why AWSSBG-UC ──────────────────────────────────────────────────

const PILLARS = [
  { title: "Education", body: "Hands-on labs, workshops, and certification prep on real AWS infrastructure.", icon: "/images/additional/wrench2.png", border: "border-[#2c8f8f]" },
  { title: "Outreach", body: "Events, partnerships, and programs that bring cloud skills to more students.", icon: "/images/additional/community.png", border: "border-[#b89a0a]" },
  { title: "Governance", body: "Constitution-backed processes, officer roles, and democratic decision-making.", icon: "/images/additional/key2.png", border: "border-[#b32a0e]" },
  { title: "Institutional growth", body: "Alumni networks, school partnerships, and a track record that outlasts any batch.", icon: "/images/additional/ladder.png", border: "border-[#3aaa6e]" },
  { title: "Recognition", body: "Certifications, competition wins, and org-wide recognition for members who level up.", icon: "/images/additional/trophy2.png", border: "border-[#2c8f8f]" },
  { title: "Technical innovation", body: "Hackathons, internal tools, and projects that solve real problems with cloud tech.", icon: "/images/additional/thunder2.png", border: "border-[#b89a0a]" },
];

function About() {
  return (
    <>
      {/* Custom section (not <Section>) so the title, text and images share one row and line up. */}
      <Stripes />
      <section className={`${wrapWide} py-14 sm:py-20`}>
        <div className="grid items-center gap-10 md:grid-cols-[1fr_auto] lg:gap-16">
          <div>
            <h2 className={`${hd} text-6xl sm:text-8xl`}>What is AWSSBG-UC?</h2>
            <p className="mt-6 max-w-3xl text-2xl leading-snug xl:text-3xl">
              We&apos;re the AWS Student Builder Group at the University of Cabuyao. We run workshops, ship projects, and build cloud skills together, all free and all on AWS. Every UC student is welcome. No experience needed.
            </p>
          </div>
          {/* Stacked: duck engineer in front, logo/mascot behind it at the upper right. */}
          <div className="relative mx-auto w-44 sm:w-52 lg:w-60">
            <Image
              src="/icons/temp_mascot.webp"
              alt="AWSSBG-UC mascot"
              width={220}
              height={220}
              className="absolute -right-4 top-0 z-0 h-auto w-3/5 sm:-right-8"
            />
            {/* Save the SVG as public/images/additional/duck-engineer.svg.
                `unoptimized` because next/image blocks SVGs unless dangerouslyAllowSVG is enabled. */}
            <Image
              src="/images/additional/duck-engineer.svg"
              alt="Pixel-art engineer duck with a hard hat, laptop and coffee"
              width={368}
              height={472}
              unoptimized
              className="relative z-10 h-auto w-full"
            />
          </div>
        </div>
      </section>

      <Section wide title="Why join?" intro="Six pillars guide everything we do, with AWS cloud technology as the common thread.">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <li key={p.title} className={`border-4 ${p.border} p-5`}>
              <Image src={p.icon} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
              <h3 className={`${hd} mt-6 text-3xl`}>{p.title}</h3>
              <p className="mt-2 leading-snug">{p.body}</p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

// ─── What is AWS ─────────────────────────────────────────────────────────────

function WhatIsAws() {
  return (
    <Section wide title="What is AWS?">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="text-2xl leading-snug xl:text-3xl">
            Amazon Web Services powers millions of businesses, from startups to governments. With over 200 services spanning compute, storage, databases, AI/ML, and security, it&apos;s the on-ramp to building anything at scale.
          </p>
          <p className="mt-5 leading-relaxed text-[#fff7a1]/80">
            As a member you get hands-on time with the same infrastructure used by Netflix, Airbnb, and NASA. Hover a service in the globe to see what it does.
          </p>
          <Link href="/aws" className={`mt-8 inline-block border-4 border-[#fff7a1] px-6 py-3 text-lg transition-colors hover:bg-[#fff7a1] hover:text-black ${focus}`}>
            Browse free AWS resources
          </Link>
        </div>
        <div className="relative mx-auto w-full max-w-[640px] border-4 border-[#b89a0a] bg-[#fff7a1] p-4 text-black shadow-[8px_8px_0_#b89a0a]">
          <PixelMap src="/images/hero/globe.png" />
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2">
            <GlobeOrbit />
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Members ─────────────────────────────────────────────────────────────────

const MEMBER_BORDERS = ["border-[#2c8f8f]", "border-[#b89a0a]", "border-[#b32a0e]", "border-[#3aaa6e]"];

function MemberCard({ member, border }: { member: PublicMemberProfile; border: string }) {
  const name = member.display_name ?? member.username ?? "Member";
  const skills = (member.skills ?? []).slice(0, 3);
  return (
    <li className={`relative border-4 ${border} p-4 transition-colors focus-within:bg-[#fff7a1]/5 hover:bg-[#fff7a1]/5`}>
      <div className="flex items-center gap-4">
        {member.avatar_url ? (
          <div className="relative h-20 w-20 shrink-0 border-4 border-[#fff7a1]">
            {/* `unoptimized` skips the next.config remotePatterns check for external avatar hosts. */}
            <Image
              src={member.avatar_url}
              alt=""
              fill
              sizes="80px"
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <span className={`${hd} flex h-20 w-20 shrink-0 items-center justify-center border-4 border-[#fff7a1] bg-[#fff7a1] text-5xl text-black`}>
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h3 className={`${hd} truncate text-3xl`}>
            {member.username ? (
              <Link href={`/members/${encodeURIComponent(member.username)}`} className={`after:absolute after:inset-0 ${focus}`}>
                {name}
              </Link>
            ) : (
              name
            )}
          </h3>
          {member.username && <p className="truncate text-sm text-[#fff7a1]/70">@{member.username}</p>}
        </div>
      </div>
      {skills.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Skills">
          {skills.map((skill) => (
            <li key={skill} className="border-2 border-[#fff7a1]/60 px-2 py-0.5 text-xs">
              {skill}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Members({ members, memberCount }: { members: PublicMemberProfile[]; memberCount: number }) {
  const intro =
    memberCount > 0
      ? `${memberCount.toLocaleString()} ${memberCount === 1 ? "member has" : "members have"} a public profile in our directory.`
      : "Member profiles show up here once students add theirs to the directory.";
  return (
    <Section wide title="Meet our members" intro={intro}>
      {members.length > 0 && (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((m, i) => (
            <MemberCard key={m.member_id} member={m} border={MEMBER_BORDERS[i % MEMBER_BORDERS.length]} />
          ))}
        </ul>
      )}
      <Link
        href={memberCount > 0 ? "/members" : "/signup"}
        className={`${members.length > 0 ? "mt-10" : ""} inline-block border-4 border-[#fff7a1] px-6 py-3 text-lg transition-colors hover:bg-[#fff7a1] hover:text-black ${focus}`}
      >
        {memberCount > 0 ? "See all members" : "Join the community"}
      </Link>
    </Section>
  );
}

// ─── Final CTA ───────────────────────────────────────────────────────────────

function JoinCta() {
  const reduce = useReducedMotion();
  return (
    <>
      <Stripes className="h-4" />
      <section className="bg-[#fff7a1] text-black">
        <div className={`${wrapWide} py-16 sm:py-24`}>
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-8">
            <div className="text-center">
              <h2 className={`${hd} text-[clamp(4.5rem,10vw,9rem)]`}>
                What are you
                <br />
                waiting for?
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-xl leading-snug">
                Joining is free and open to every University of Cabuyao student. Make an account and come to the next event.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link href="/signup" className={`${btnDark} px-10 py-4 text-xl`}>
                  Join now, it&apos;s free
                </Link>
                <Link href="/about" className={`inline-block border-4 border-black px-8 py-3.5 text-xl transition-colors hover:bg-black hover:text-[#fff7a1] ${focus}`}>
                  Learn more
                </Link>
              </div>
            </div>

            {/* Crying duck at the side, vertically centered with the text. The bubble floats above it so it doesn't shift the centering. */}
            <div className="relative mx-auto mt-14 lg:mt-0">
              <div className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap border-4 border-black bg-black px-4 py-2 text-lg leading-none text-[#fff7a1] shadow-[4px_4px_0_#b32a0e]">
                Please join us... I&apos;m begging you
                <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b-4 border-r-4 border-black bg-black" />
              </div>
              {/* Save the SVG as public/images/additional/duck-crying.svg */}
              <motion.div
                animate={reduce ? undefined : { y: [0, -4, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/images/additional/duck-crying.svg"
                  alt="A pixel-art duck crying and begging you to join"
                  width={384}
                  height={472}
                  unoptimized
                  className="h-auto w-48 sm:w-60 lg:w-72"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      <Stripes className="h-4" />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function HomeClient({
  registeredCount = 0,
  participantCount = 0,
  members = [],
  memberCount = 0,
}: {
  registeredCount?: number;
  participantCount?: number;
  members?: PublicMemberProfile[];
  memberCount?: number;
}) {
  return (
    <div className={`${bodyFont.className} relative isolate bg-black tracking-normal text-[#fff7a1]`}>
      <WIPBanner />
      <PixelClouds />
      <SidePixels side="left" contentWidth={1680} />
      <SidePixels side="right" contentWidth={1680} />
      <div className="relative z-10">
        <Hero registeredCount={registeredCount} participantCount={participantCount} />
        <Partners />
        <About />
        <WhatIsAws />
        <Members members={members} memberCount={memberCount} />
        <JoinCta />
      </div>
    </div>
  );
}