import React from "react";
import { storyboard, motionPlan } from "./storyboard";
import { Subject } from "./Subject";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const styles = [
  {
    id: "glass",
    name: "玻璃科技",
    desc: "通透材质 · 悬浮几何",
    accent: "#a1efce",
    bg: "#0b2327",
    icon: "◇",
  },
  {
    id: "minimal",
    name: "极简产品",
    desc: "纯净留白 · 柔和光影",
    accent: "#c08e57",
    bg: "#f0ece4",
    icon: "○",
  },
  {
    id: "cinema",
    name: "电影叙事",
    desc: "暖调颗粒 · 缓慢推进",
    accent: "#f1be88",
    bg: "#29201e",
    icon: "◒",
  },
  {
    id: "neon",
    name: "霓虹动感",
    desc: "撞色光晕 · 节奏律动",
    accent: "#c2a3ff",
    bg: "#19112d",
    icon: "✳",
  },
] as const;
export type VideoProps = {
  idea: string;
  title: string;
  styleId: string;
  image: string;
  ratio: string;
  seconds: number;
};
export const initialVideo: VideoProps = {
  idea: "让灵感悬浮，让每一个想法都有自己的光。以通透的玻璃和缓缓旋转的几何体，开启一段新的创作。",
  title: "让想法，\n动起来。",
  styleId: "glass",
  image: "",
  ratio: "16:9",
  seconds: 12,
};
export const dimensions = (ratio: string) =>
  ratio === "9:16"
    ? { width: 1080, height: 1920 }
    : ratio === "1:1"
      ? { width: 1080, height: 1080 }
      : { width: 1920, height: 1080 };
export const makeTitle = (idea: string) =>
  idea
    .trim()
    .split(/[。！!？?\n，,]/)[0]
    .slice(0, 22) || "让想法，动起来。";

export const Crystal: React.FC<{ accent: string; rotation?: number }> = ({
  accent,
  rotation = 0,
}) => (
  <svg
    viewBox="0 0 300 300"
    style={{
      width: "100%",
      height: "100%",
      overflow: "visible",
      transform: `rotate(${rotation}deg)`,
    }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="crystal" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor={accent} stopOpacity=".75" />
        <stop offset="1" stopColor={accent} stopOpacity=".04" />
      </linearGradient>
    </defs>
    <ellipse
      cx="150"
      cy="155"
      rx="127"
      ry="119"
      fill="none"
      stroke={accent}
      strokeOpacity=".18"
    />
    <ellipse
      cx="150"
      cy="155"
      rx="108"
      ry="127"
      fill="none"
      stroke={accent}
      strokeOpacity=".6"
      transform="rotate(35 150 155)"
    />
    <ellipse
      cx="150"
      cy="155"
      rx="67"
      ry="125"
      fill="none"
      stroke="#decc91"
      strokeOpacity=".65"
      transform="rotate(-22 150 155)"
    />
    <path
      d="M150 38 233 128 204 226 110 255 67 160Z"
      fill="url(#crystal)"
      stroke={accent}
      strokeWidth="1.5"
    />
    <path
      d="m150 38-18 119 101-29-123 127 22-98-65 3 137 66-72-69 18-119 54 188"
      fill="none"
      stroke={accent}
      strokeOpacity=".65"
    />
    <path d="m132 157 101-29-83-90Z" fill={accent} fillOpacity=".25" />
    <circle cx="233" cy="128" r="4" fill={accent} />
  </svg>
);

export const CreatorVideo: React.FC<VideoProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const theme = styles.find((s) => s.id === props.styleId) || styles[0];
  const light = props.styleId === "minimal";
  const color = light ? "#282a27" : "#f0f6f2";
  const portrait = height > width;
  const shots = storyboard(props.idea);
  const sceneLength = durationInFrames / Math.max(1, shots.length);
  const scene = Math.min(shots.length - 1, Math.floor(frame / sceneLength));
  const localFrame = frame - Math.floor(scene * sceneLength);
  const enter = spring({ frame: localFrame + 8, fps, config: { damping: 22 } });
  const shot = shots[scene] || { title: props.title, caption: props.idea };
  const plan = motionPlan(props.idea);
  const u = width / (portrait ? 1080 : 1920);
  return (
    <AbsoluteFill
      style={{
        background: theme.bg,
        color,
        fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${65 + Math.sin(frame / 60) * 15}% 45%, ${theme.accent}30, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.12,
          backgroundImage: `linear-gradient(${theme.accent}35 1px,transparent 1px),linear-gradient(90deg,${theme.accent}35 1px,transparent 1px)`,
          backgroundSize: `${100 * u}px ${100 * u}px`,
          transform: `translateY(${frame * 0.08}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 90 * u,
          right: 90 * u,
          top: 70 * u,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 22 * u,
          letterSpacing: 5 * u,
          opacity: 0.65,
        }}
      >
        <span>YOUR IDEA. IN MOTION.</span>
        <span>
          {String(scene + 1).padStart(2, "0")} /{" "}
          {String(shots.length).padStart(2, "0")}
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: portrait ? "16%" : "57%",
          top: portrait ? "36%" : "15%",
          width: portrait ? "68%" : "39%",
          height: portrait ? "40%" : "72%",
          transform: `translateY(${plan.float ? Math.sin(frame / (30 / plan.speed)) * 18 : 0}px) scale(${1 + (frame / durationInFrames) * (plan.zoom || props.styleId === "cinema" ? 0.12 : 0.025)})`,
        }}
      >
        {props.image ? (
          <Img
            src={props.image}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 32 * u,
              boxShadow: "0 45px 100px #0005",
            }}
          />
        ) : (
          <Subject
            idea={props.idea}
            accent={theme.accent}
            frame={frame}
            title={shot.title}
          />
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: 90 * u,
          top: portrait ? "14%" : "32%",
          width: portrait ? "84%" : "49%",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 30}px)`,
        }}
      >
        <div
          style={{
            fontSize: 22 * u,
            letterSpacing: 4 * u,
            color: theme.accent,
            marginBottom: 32 * u,
          }}
        >
          {theme.name}
        </div>
        <div
          style={{
            fontSize: (shot.title.length > 20 ? 65 : 86) * u,
            fontWeight: 650,
            lineHeight: 1.2,
            whiteSpace: "pre-line",
            overflowWrap: "anywhere",
          }}
        >
          {shot.title}
        </div>
        {!portrait && (
          <div
            style={{
              width: "85%",
              fontSize: 27 * u,
              lineHeight: 1.8,
              opacity: 0.62,
              marginTop: 32 * u,
            }}
          >
            {shot.caption}
          </div>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: 90 * u,
          right: 90 * u,
          bottom: 90 * u,
          padding: 30 * u,
          border: `1px solid ${theme.accent}40`,
          borderRadius: 20 * u,
          background: light ? "#ffffff75" : "#ffffff08",
          fontSize: 27 * u,
          lineHeight: 1.65,
          display: "flex",
          justifyContent: "space-between",
          gap: 40 * u,
        }}
      >
        <span>{shot.caption}</span>
        <span style={{ color: theme.accent, whiteSpace: "nowrap" }}>
          ✦ MOTION
        </span>
      </div>
      {props.styleId === "cinema" && (
        <>
          <div
            style={{
              position: "absolute",
              top: 0,
              width: "100%",
              height: 24,
              background: "#000",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              height: 24,
              background: "#000",
            }}
          />
        </>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          height: 5,
          background: theme.accent,
          width: `${((frame + 1) / durationInFrames) * 100}%`,
        }}
      />
    </AbsoluteFill>
  );
};
