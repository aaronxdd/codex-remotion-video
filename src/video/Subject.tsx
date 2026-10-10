import React from "react";
import { Crystal } from "./CreatorVideo";
import { motionPlan } from "./storyboard";

export function Subject({
  idea,
  accent,
  frame,
  title,
}: {
  idea: string;
  accent: string;
  frame: number;
  title: string;
}) {
  const plan = motionPlan(idea);
  const angle = plan.rotate ? frame * 0.1 * plan.speed : 0;
  if (plan.subject === "crystal")
    return <Crystal accent={accent} rotation={angle} />;
  if (plan.subject === "type")
    return (
      <div
        style={{
          height: "100%",
          display: "grid",
          placeItems: "center",
          padding: "10%",
          color: accent,
          fontSize: 110,
          fontWeight: 700,
          lineHeight: 1.3,
          textAlign: "center",
          border: `1px solid ${accent}55`,
          borderRadius: 40,
          background: `linear-gradient(145deg,${accent}20,transparent)`,
          transform: `rotate(${Math.sin(frame / 50) * 2}deg)`,
        }}
      >
        {title.slice(0, 8)}
      </div>
    );
  return (
    <svg
      viewBox="0 0 400 400"
      style={{
        width: "100%",
        height: "100%",
        filter: `drop-shadow(0 20px 35px ${accent}30)`,
        transform: `rotateY(${angle}deg)`,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="subject-fill" x2="1" y2="1">
          <stop stopColor={accent} stopOpacity=".65" />
          <stop offset="1" stopColor={accent} stopOpacity=".08" />
        </linearGradient>
      </defs>
      {plan.subject === "bottle" ? (
        <>
          <ellipse
            cx="200"
            cy="352"
            rx="105"
            ry="15"
            fill={accent}
            opacity=".15"
          />
          <rect
            x="155"
            y="52"
            width="90"
            height="68"
            rx="12"
            fill={accent}
            opacity=".85"
          />
          <rect x="183" y="120" width="34" height="25" fill={accent} />
          <rect
            x="105"
            y="143"
            width="190"
            height="193"
            rx="25"
            fill="url(#subject-fill)"
            stroke={accent}
            strokeWidth="2"
          />
          <rect
            x="137"
            y="197"
            width="126"
            height="72"
            rx="4"
            fill={accent}
            opacity=".65"
          />
          <text
            x="200"
            y="240"
            textAnchor="middle"
            fontSize="18"
            fill="#15251d"
          >
            EAU DE PARFUM
          </text>
          <path d="M121 180v116" stroke={accent} strokeWidth="3" opacity=".7" />
        </>
      ) : plan.subject === "cup" ? (
        <>
          <ellipse
            cx="187"
            cy="323"
            rx="136"
            ry="20"
            fill={accent}
            opacity=".18"
          />
          <path
            d="M78 155h212l-22 126q-7 35-76 35t-88-35Z"
            fill="url(#subject-fill)"
            stroke={accent}
            strokeWidth="3"
          />
          <path
            d="M290 167q95-9 41 79l-51 15"
            fill="none"
            stroke={accent}
            strokeWidth="12"
          />
          <ellipse
            cx="184"
            cy="155"
            rx="106"
            ry="25"
            fill={accent}
            opacity=".3"
          />
          {[140, 185, 230].map((x, i) => (
            <path
              key={x}
              d={`M${x} 120q-25-20 0-40t0-40`}
              fill="none"
              stroke={accent}
              strokeWidth="4"
              opacity={0.3 + Math.sin(frame / 20 + i) * 0.2}
              transform={`translate(0 ${Math.sin(frame / 25 + i) * 8})`}
            />
          ))}
        </>
      ) : plan.subject === "landscape" ? (
        <>
          <circle cx="287" cy="108" r="45" fill={accent} opacity=".8" />
          <path
            d="M0 310 125 90 270 310Z"
            fill="url(#subject-fill)"
            stroke={accent}
          />
          <path d="M140 320 290 175 400 320Z" fill={accent} opacity=".3" />
          <path
            d="M0 342h400M30 364h340M75 386h250"
            stroke={accent}
            opacity=".4"
          />
        </>
      ) : (
        <>
          <path
            d="m200 60 137 76v143l-137 76-137-76V136Z"
            fill="url(#subject-fill)"
            stroke={accent}
            strokeWidth="2"
          />
          <path
            d="m63 136 137 77 137-77M200 213v142"
            stroke={accent}
            strokeWidth="2"
          />
          <path d="m200 60 137 76-137 77-137-77Z" fill={accent} opacity=".25" />
        </>
      )}
    </svg>
  );
}
