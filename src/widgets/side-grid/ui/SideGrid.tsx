"use client";

import { useEffect, useRef } from "react";

const CELL = 20; // px per cell
const MAX_CONTENT_WIDTH = 1280; // matches max-w-7xl

const COLORS = [
  "rgba(168,85,247,0.55)",  // purple
  "rgba(0,228,130,0.45)",   // brand green
  "rgba(99,102,241,0.50)",  // indigo
  "rgba(168,85,247,0.30)",  // purple dim
];

// How many seconds a full fade-in → fade-out cycle takes
const BLINK_DURATION_S = 3.2;

interface Cell {
  row: number;
  col: number;
  color: string;
  // phase goes 0 → 1 → 0 over BLINK_DURATION_S seconds
  phase: number;
  // offset so cells don't all start at the same point
  phaseOffset: number;
}

function runGrid(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d")!;
  let rafId: number;
  let lastTs = 0;
  let cells: Cell[] = [];

  function computeSideWidth() {
    return Math.max(0, Math.floor((window.innerWidth - MAX_CONTENT_WIDTH) / 2));
  }

  function resize() {
    const sideW = computeSideWidth();
    canvas.width = sideW;
    canvas.height = window.innerHeight;
    cells = []; // rebuild on resize
    populate();
  }

  function populate() {
    const cols = Math.floor(canvas.width / CELL);
    const rows = Math.floor(canvas.height / CELL);
    if (cols === 0 || rows === 0) return;

    // ~10 % of all cells are active at any time
    const count = Math.max(1, Math.round(cols * rows * 0.10));
    cells = Array.from({ length: count }, () => ({
      row: Math.floor(Math.random() * rows),
      col: Math.floor(Math.random() * cols),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      phase: Math.random(),       // current position in blink cycle (0–1)
      phaseOffset: Math.random(), // stagger start
    }));
  }

  function draw(ts: number) {
    const dt = lastTs ? (ts - lastTs) / 1000 : 0;
    lastTs = ts;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cols = Math.floor(canvas.width / CELL);
    const rows = Math.floor(canvas.height / CELL);
    if (cols === 0 || rows === 0) {
      rafId = requestAnimationFrame(draw);
      return;
    }

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(canvas.width, r * CELL);
      ctx.stroke();
    }

    // Animated cells
    const speed = dt / BLINK_DURATION_S;
    for (const cell of cells) {
      cell.phase = (cell.phase + speed) % 1;

      // alpha follows a smooth sine pulse: 0 → peak → 0
      const alpha = Math.pow(Math.sin(cell.phase * Math.PI), 2);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = cell.color;
      ctx.fillRect(cell.col * CELL + 1, cell.row * CELL + 1, CELL - 2, CELL - 2);
      ctx.restore();
    }

    rafId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  rafId = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
  };
}

export function SideGrid() {
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    if (leftRef.current)  cleanups.push(runGrid(leftRef.current));
    if (rightRef.current) cleanups.push(runGrid(rightRef.current));
    return () => cleanups.forEach((fn) => fn());
  }, []);

  const style: React.CSSProperties = {
    position: "fixed",
    top: 0,
    zIndex: -1,
    pointerEvents: "none",
    // fade out near top and bottom so it doesn't feel clipped
    maskImage: "linear-gradient(to bottom, transparent 0%, black 6%, black 88%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 6%, black 88%, transparent 100%)",
  };

  return (
    <>
      <canvas ref={leftRef}  aria-hidden="true" style={{ ...style, left: 0 }} />
      <canvas ref={rightRef} aria-hidden="true" style={{ ...style, right: 0 }} />
    </>
  );
}
