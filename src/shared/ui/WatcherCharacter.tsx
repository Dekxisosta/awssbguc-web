"use client";

import { useEffect, useRef, useState } from "react";

interface WatcherCharacterProps {
  /** When true the eyes close (e.g. a password field is focused) */
  eyesClosed: boolean;
}

// Eye socket geometry (SVG coordinate space, viewBox 0 0 120 120)
const LEFT_EYE  = { cx: 44, cy: 52, rx: 10, ry: 11 };
const RIGHT_EYE = { cx: 76, cy: 52, rx: 10, ry: 11 };
const PUPIL_R   = 4;   // pupil radius
const MAX_SHIFT = 4.5; // max pupil travel from socket centre

function clampPupil(
  mouseX: number,
  mouseY: number,
  socket: { cx: number; cy: number; rx: number; ry: number },
  svgRect: DOMRect,
  viewBoxW: number,
  viewBoxH: number
): { x: number; y: number } {
  // Map screen coords → SVG viewBox coords
  const scaleX = viewBoxW / svgRect.width;
  const scaleY = viewBoxH / svgRect.height;
  const svgX = (mouseX - svgRect.left) * scaleX;
  const svgY = (mouseY - svgRect.top)  * scaleY;

  const dx = svgX - socket.cx;
  const dy = svgY - socket.cy;
  const dist = Math.hypot(dx, dy) || 1;
  const travel = Math.min(dist, MAX_SHIFT);
  return {
    x: socket.cx + (dx / dist) * travel,
    y: socket.cy + (dy / dist) * travel,
  };
}

export function WatcherCharacter({ eyesClosed }: WatcherCharacterProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [leftPupil,  setLeftPupil]  = useState({ x: LEFT_EYE.cx,  y: LEFT_EYE.cy  });
  const [rightPupil, setRightPupil] = useState({ x: RIGHT_EYE.cx, y: RIGHT_EYE.cy });

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      setLeftPupil(clampPupil(e.clientX, e.clientY, LEFT_EYE,  rect, 120, 120));
      setRightPupil(clampPupil(e.clientX, e.clientY, RIGHT_EYE, rect, 120, 120));
    }
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  // Eyelid close amount: 0 = open, 1 = fully closed
  // (used implicitly via the eyesClosed prop passed to EyeSocket)

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 120 120"
      width="120"
      height="120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="select-none"
    >
      {/* ── Shadow ── */}
      <ellipse cx="60" cy="116" rx="28" ry="4" fill="rgba(0,0,0,0.18)" />

      {/* ── Head ── */}
      <circle cx="60" cy="60" r="44" fill="#1e2a35" />
      {/* subtle rim highlight */}
      <circle cx="60" cy="60" r="44" fill="none" stroke="#2e3f50" strokeWidth="2" />

      {/* AWS-green cap stripe */}
      <path
        d="M16 52 A44 44 0 0 1 104 52"
        fill="#00e482"
        opacity="0.12"
      />

      {/* ── Ears ── */}
      <ellipse cx="16"  cy="62" rx="6" ry="9" fill="#1e2a35" stroke="#2e3f50" strokeWidth="1.5" />
      <ellipse cx="104" cy="62" rx="6" ry="9" fill="#1e2a35" stroke="#2e3f50" strokeWidth="1.5" />
      {/* inner ear */}
      <ellipse cx="16"  cy="62" rx="3" ry="5" fill="#152030" opacity="0.7" />
      <ellipse cx="104" cy="62" rx="3" ry="5" fill="#152030" opacity="0.7" />

      {/* ── Eyebrows ── */}
      <g stroke="#00e482" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
        {/* left brow — raises slightly when eyes closed */}
        <line
          x1="34" y1={eyesClosed ? 35 : 38}
          x2="54" y2={eyesClosed ? 33 : 37}
          style={{ transition: "y1 0.2s ease, y2 0.2s ease" }}
        />
        {/* right brow */}
        <line
          x1="66" y1={eyesClosed ? 33 : 37}
          x2="86" y2={eyesClosed ? 35 : 38}
          style={{ transition: "y1 0.2s ease, y2 0.2s ease" }}
        />
      </g>

      {/* ── Left eye ── */}
      <EyeSocket socket={LEFT_EYE} pupil={leftPupil} closed={eyesClosed} />

      {/* ── Right eye ── */}
      <EyeSocket socket={RIGHT_EYE} pupil={rightPupil} closed={eyesClosed} />

      {/* ── Nose ── */}
      <ellipse cx="60" cy="70" rx="4" ry="2.5" fill="#0f1e2c" opacity="0.6" />

      {/* ── Mouth ── */}
      <path
        d={eyesClosed
          ? "M 48 82 Q 60 78 72 82"   // slight frown / neutral when peeking
          : "M 48 82 Q 60 90 72 82"   // happy smile when open
        }
        fill="none"
        stroke="#8ca0b0"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ transition: "d 0.25s ease" }}
      />

      {/* Blush dots */}
      <circle cx="32" cy="72" r="7" fill="#ff6b6b" opacity="0.15" />
      <circle cx="88" cy="72" r="7" fill="#ff6b6b" opacity="0.15" />
    </svg>
  );
}

/* ── Eye socket sub-component ─────────────────────────────────────────── */

function EyeSocket({
  socket,
  pupil,
  closed,
}: {
  socket: { cx: number; cy: number; rx: number; ry: number };
  pupil: { x: number; y: number };
  closed: boolean;
}) {
  const { cx, cy, rx, ry } = socket;

  return (
    <g>
      {/* White sclera */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="white" />

      {/* Pupil — only render when eye is open enough */}
      {!closed && (
        <circle
          cx={pupil.x}
          cy={pupil.y}
          r={PUPIL_R}
          fill="#0f1923"
        />
      )}

      {/* Pupil shine */}
      {!closed && (
        <circle
          cx={pupil.x - 1.2}
          cy={pupil.y - 1.5}
          r={1.2}
          fill="white"
          opacity="0.9"
        />
      )}

      {/* Upper eyelid */}
      <path
        d={`
          M ${cx - rx} ${cy}
          A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}
          A ${rx} ${ry} 0 0 0 ${cx - rx} ${cy}
        `}
        fill="#1e2a35"
        style={{
          transform: `scaleY(${closed ? 1 : 0})`,
          transformOrigin: `${cx}px ${cy}px`,
          transition: "transform 0.18s cubic-bezier(0.4,0,0.2,1)",
        }}
      />

      {/* Lower eyelid (closes upward to meet upper) */}
      <path
        d={`
          M ${cx - rx} ${cy}
          A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy}
          A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy}
        `}
        fill="#1e2a35"
        style={{
          transform: `scaleY(${closed ? 1 : 0})`,
          transformOrigin: `${cx}px ${cy}px`,
          transition: "transform 0.18s cubic-bezier(0.4,0,0.2,1)",
        }}
      />

      {/* Eye outline */}
      <ellipse
        cx={cx} cy={cy} rx={rx} ry={ry}
        fill="none"
        stroke="#2e3f50"
        strokeWidth="1.5"
      />
    </g>
  );
}
