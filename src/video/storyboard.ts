import type { VideoProps } from "./CreatorVideo";

export type Shot = { title: string; caption: string };
export function storyboard(idea: string): Shot[] {
  const sentences = idea
    .trim()
    .split(/(?<=[。！？!?；;，,\n])/u)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.flatMap((sentence) => {
    const chars = Array.from(sentence);
    const shots: Shot[] = [];
    for (let start = 0; start < chars.length; start += 34) {
      const caption = chars.slice(start, start + 34).join("");
      shots.push({
        title: caption.replace(/[。！？!?；;，,]+$/u, ""),
        caption,
      });
    }
    return shots;
  });
}

export function buildVideo(
  idea: string,
  image: string,
  styleId: string,
): VideoProps {
  const content = idea.trim() || "一张图片，一段故事。";
  const shots = storyboard(content);
  return {
    idea: content,
    title: shots[0]?.title.slice(0, 34) || "一张图片，一段故事。",
    image,
    styleId,
    ratio: "16:9",
    seconds: Math.min(
      90,
      Math.max(12, Math.ceil(Array.from(content).length / 7), shots.length * 3),
    ),
  };
}

export function motionPlan(idea: string) {
  const subject = /香水|瓶身|瓶子|perfume/i.test(idea)
    ? "bottle"
    : /咖啡|茶杯|coffee/i.test(idea)
      ? "cup"
      : /山峦|山峰|山脉|日落|山水|风景/i.test(idea)
        ? "landscape"
        : /立方|方块|cube/i.test(idea)
          ? "cube"
          : /几何|玻璃|晶体|水晶|科技|geometry/i.test(idea)
            ? "crystal"
            : "type";
  return {
    subject,
    speed: /快速|快节奏|动感/i.test(idea)
      ? 2
      : /缓缓|缓慢|慢镜/i.test(idea)
        ? 0.45
        : 1,
    rotate: /旋转|转动|rotation/i.test(idea),
    float: /悬浮|漂浮|浮动/i.test(idea),
    zoom: /推进|拉近|放大/i.test(idea),
  };
}
