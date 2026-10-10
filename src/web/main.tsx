import React, { useRef, useState, useMemo, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Player, type PlayerRef } from "@remotion/player";
import {
  CreatorVideo,
  Crystal,
  dimensions,
  initialVideo,
  styles,
  type VideoProps,
} from "../video/CreatorVideo";
import "./style.css";
import { buildVideo } from "../video/storyboard";

type Work = { id: string; date: string; video: VideoProps };
const icons = { create: "✦", works: "▤", help: "?", image: "▧" };
function readWorks(): Work[] {
  try {
    return JSON.parse(localStorage.getItem("motion-works") || "[]");
  } catch {
    return [];
  }
}
export function App() {
  const [idea, setIdea] = useState("");
  const [image, setImage] = useState("");
  const [filename, setFilename] = useState("");
  const [styleId, setStyle] = useState("glass");
  const hasContent = Boolean(idea.trim() || image);
  const video = useMemo(
    () =>
      hasContent
        ? buildVideo(idea, image, styleId)
        : { ...initialVideo, styleId },
    [idea, image, styleId, hasContent],
  );
  const [downloadVideo, setDownloadVideo] = useState<VideoProps | null>(null);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [tab, setTab] = useState("create");
  const [works, setWorks] = useState<Work[]>(readWorks);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [download, setDownload] = useState("");
  const [help, setHelp] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [created, setCreated] = useState(false);
  const [playing, setPlaying] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const player = useRef<PlayerRef>(null);
  useEffect(() => {
    player.current?.seekTo(0);
    player.current?.pause();
    setPlaying(false);
  }, [video, previewRevision]);

  const upload = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("请选择 JPG、PNG 或 WebP 图片。");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("图片不能超过 8 MB，请压缩后再试。");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(String(reader.result));
      setFilename(file.name);
      setError("");
    };
    reader.onerror = () => setError("无法读取图片，请重新选择。");
    reader.readAsDataURL(file);
  };
  const create = () => {
    if (!idea.trim() && !image) {
      setError("先写下你的想法，或者上传一张图片。");
      return;
    }
    const next = video;
    setPreviewRevision((revision) => revision + 1);
    setIdea(next.idea);
    setCreated(true);
    setError("");
    setDownload("");
    setNotice("预览已更新，可以播放或导出视频。");
    const work = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleString("zh-CN"),
      video: next,
    };
    const updated = [work, ...works].slice(0, 6);
    setWorks(updated);
    try {
      localStorage.setItem("motion-works", JSON.stringify(updated));
    } catch {
      setNotice("预览已更新；浏览器存储空间不足，本次作品仅保留在当前页面。");
    }
    window.setTimeout(() => {
      player.current?.seekTo(0);
      player.current?.play();
      setPlaying(true);
    }, 100);
  };
  const example = (text: string, style: string) => {
    setIdea(text);
    setStyle(style);
    setTab("create");
    setNotice("灵感已填入，点击「生成视频预览」即可查看。");
  };
  const exportVideo = async () => {
    if (!hasContent) {
      setError("先输入内容或上传图片。");
      return;
    }
    const snapshot = video;
    setCreated(true);
    setRendering(true);
    setProgress(0);
    setError("");
    setDownload("");
    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      const job = await response.json();
      if (!response.ok) throw new Error(job.error || "导出启动失败");
      const start = Date.now();
      while (Date.now() - start < 15 * 60 * 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const status = await fetch(`/api/render/${job.id}`);
        if (!status.ok) throw new Error("无法读取导出进度，请重试。");
        const data = await status.json();
        setProgress(Math.round(data.progress * 100));
        if (data.status === "failed")
          throw new Error(data.error || "视频导出失败");
        if (data.status === "done") {
          setDownload(data.url);
          setDownloadVideo(snapshot);
          const anchor = document.createElement("a");
          anchor.href = data.url;
          anchor.download = "motion-video.mp4";
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          setNotice(
            "视频已生成并开始下载。如果浏览器未保存，请点击「下载视频」。",
          );
          return;
        }
      }
      throw new Error("导出耗时较长，请稍后重试。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "导出失败，请重试。");
    } finally {
      setRendering(false);
    }
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="/" className="brand">
          <span className="brand-mark">
            m<span>•</span>
          </span>
          <span>
            motion<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="workspace-label">
          个人工作空间 <span>⌄</span>
        </div>
        <nav>
          {[
            ["create", "创作空间"],
            ["works", "我的作品"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`nav-item ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              <span>{icons[key as "create" | "works"]}</span>
              {label}
              {key === "works" && <small>{works.length}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="small-spark">✧</span>
          <p>
            每个好作品，
            <br />
            都从一个想法开始。
          </p>
          <span>MAKE YOUR NEXT MOTION</span>
        </div>
        <div className="sidebar-bottom">
          <button onClick={() => setHelp(true)} className="help-button">
            <span>ⓘ</span> 使用指南 <span>↗</span>
          </button>
          <div className="profile">
            <span className="avatar">Y</span>
            <div>
              我的工作空间<small>本地创作 · 素材留在本机</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            工作空间 <span>/</span>{" "}
            <strong>{tab === "create" ? "新建视频" : "我的作品"}</strong>
          </div>
          <div className="local-badge">
            <i /> 本地工作空间 <span>BETA</span>
          </div>
        </header>
        {tab === "create" ? (
          <div className="main-content">
            <div className="page-heading">
              <div className="eyebrow">YOUR IDEA. IN MOTION.</div>
              <h1>
                一句话，<span>让想法动起来。</span>
              </h1>
              <p>写下灵感，选择风格。下一条视频，从这里开始。</p>
              <div className="heading-badge">✧ 不需要剪辑经验</div>
            </div>
            <div className="creator-grid">
              <section className="editor-panel">
                <div className="section-title">
                  <span className="step">01</span>
                  <h2>描述你的想法</h2>
                  <span className="optional">文字 / 图片</span>
                </div>
                <div className="prompt-box">
                  <textarea
                    disabled={rendering}
                    aria-label="描述视频想法"
                    maxLength={500}
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder={
                      "想制作什么样的视频？\n例如：为一款香水制作新品短片，柔和的光线、缓缓旋转的瓶身，营造高级、自然的氛围。"
                    }
                  />
                  <div className="prompt-footer">
                    <span>✧ 越具体，越接近你的想象</span>
                    <span>{idea.length}/500</span>
                  </div>
                </div>
                <input
                  ref={input}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(e) => upload(e.target.files?.[0])}
                />
                <div
                  className={`upload-zone ${dragging ? "dragging" : ""} ${image ? "has-image" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    upload(e.dataTransfer.files[0]);
                  }}
                >
                  {image ? (
                    <>
                      <img src={image} alt="参考图片" />
                      <div>
                        <strong>{filename || "已添加参考图片"}</strong>
                        <small>图片将作为视频中的主体素材</small>
                      </div>
                      <button
                        className="remove-image"
                        aria-label="移除图片"
                        onClick={() => {
                          setImage("");
                          setFilename("");
                          if (input.current) input.current.value = "";
                        }}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <button onClick={() => input.current?.click()}>
                      <span className="upload-icon">
                        ▧<i>+</i>
                      </span>
                      <span>
                        <strong>
                          添加图片<span>（可选）</span>
                        </strong>
                        <small>
                          点击上传或拖拽图片 · JPG / PNG / WebP · 最大 8 MB
                        </small>
                      </span>
                      <span className="upload-arrow">↥</span>
                    </button>
                  )}
                </div>
                <div className="section-title style-title">
                  <span className="step">02</span>
                  <h2>选择视频风格</h2>
                  <span className="optional">让灵感有自己的样子</span>
                </div>
                <div className="style-grid">
                  {styles.map((s) => (
                    <button
                      key={s.id}
                      className={`style-card ${styleId === s.id ? "selected" : ""}`}
                      disabled={rendering}
                      onClick={() => {
                        setStyle(s.id);
                        setNotice("");
                      }}
                      aria-pressed={styleId === s.id}
                    >
                      <div className={`style-art ${s.id}`}>
                        <div className="style-orbit" />
                        <span>{s.icon}</span>
                        {styleId === s.id && <i>✓</i>}
                      </div>
                      <strong>{s.name}</strong>
                      <small>{s.desc}</small>
                    </button>
                  ))}
                </div>
                <button
                  className="generate-button"
                  disabled={rendering}
                  onClick={create}
                >
                  <span>✦</span> {created ? "更新视频预览" : "生成视频预览"}
                  <span>→</span>
                </button>
                <p className="generation-note">
                  使用动态模板编排文字与图片 · 无需 API 密钥
                </p>
              </section>
              <section className="preview-panel">
                <div className="preview-heading">
                  <h2>
                    <span className="status-dot" /> 你的画面，即将发生
                  </h2>
                  <span>{created ? "作品预览" : "灵感示例"}</span>
                </div>
                <div
                  className={`preview-stage ${video.ratio === "9:16" ? "portrait" : ""}`}
                >
                  <Player
                    key={previewRevision}
                    ref={player}
                    component={CreatorVideo}
                    inputProps={video}
                    durationInFrames={video.seconds * 30}
                    fps={30}
                    compositionWidth={dimensions(video.ratio).width}
                    compositionHeight={dimensions(video.ratio).height}
                    style={{
                      width: "100%",
                      maxHeight: 420,
                      aspectRatio: video.ratio.replace(":", "/"),
                    }}
                    controls={false}
                    clickToPlay={false}
                    doubleClickToFullscreen={false}
                    loop
                    autoPlay={false}
                    showVolumeControls={false}
                    initialFrame={35}
                  />
                </div>
                <div className="preview-meta">
                  <span>
                    <i /> {styles.find((s) => s.id === video.styleId)?.name}
                  </span>
                  <button
                    className="play-button"
                    onClick={() => {
                      if (playing) {
                        player.current?.pause();
                      } else {
                        player.current?.play();
                      }
                      setPlaying(!playing);
                    }}
                  >
                    {playing ? "Ⅱ 暂停" : "▶ 播放预览"}
                  </button>
                </div>
                <div className="preview-info">
                  <div className="info-icon">✧</div>
                  <div>
                    <h3>
                      {hasContent
                        ? "灵感已经就位，看看它动起来"
                        : "从一个想法，到一段好画面"}
                    </h3>
                    <p>
                      {created
                        ? "预览实时使用左侧内容与风格，导出保存的就是当前画面。"
                        : "填写左侧内容，生成属于你的第一段动态短片。"}
                    </p>
                  </div>
                </div>
                <div className="export-row">
                  <span>视频准备好后，一键保存</span>
                  {download && downloadVideo === video ? (
                    <a className="export-button ready" href={download} download>
                      ↓ 下载视频
                    </a>
                  ) : (
                    <button
                      className="export-button"
                      disabled={!hasContent || rendering}
                      onClick={exportVideo}
                    >
                      {rendering ? `导出中 ${progress}%` : "↧ 导出视频"}
                    </button>
                  )}
                </div>
                {rendering && (
                  <div
                    className="render-progress"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <i style={{ width: `${progress}%` }} />
                  </div>
                )}
                <div className="workflow">
                  <span>
                    <b>1</b> 描述想法
                  </span>
                  <i>—</i>
                  <span>
                    <b>2</b> 预览调整
                  </span>
                  <i>—</i>
                  <span>
                    <b>3</b> 导出分享
                  </span>
                </div>
              </section>
            </div>
            {(error || notice) && (
              <div
                className={error ? "message error" : "message"}
                role={error ? "alert" : "status"}
              >
                {error || notice}
                <button
                  aria-label="关闭提示"
                  onClick={() => {
                    setError("");
                    setNotice("");
                  }}
                >
                  ×
                </button>
              </div>
            )}
            <section className="inspiration">
              <div className="inspiration-heading">
                <h2>
                  还没有灵感？从这里开始<span>给创意一个起点</span>
                </h2>
                <span>点击使用 ↗</span>
              </div>
              <div className="inspiration-grid">
                {[
                  {
                    label: "产品展示",
                    title: "让好产品，自带聚光灯",
                    text: "为一款香水制作新品短片。用柔和的光线和简洁的画面，展示自然、纯粹的品牌气质。",
                    style: "minimal",
                    glyph: "◉",
                  },
                  {
                    label: "品牌故事",
                    title: "把品牌，讲成一个故事",
                    text: "把日常的灵感，变成不平凡的故事。用温暖的电影色调，展现品牌对每个细节的热爱。",
                    style: "cinema",
                    glyph: "◒",
                  },
                  {
                    label: "科技创意",
                    title: "未来感，从这一帧开始",
                    text: "让玻璃几何体在青色光晕中缓缓旋转。文字轻盈浮现，以通透的质感，开启下一段创意。",
                    style: "glass",
                    glyph: "◇",
                  },
                ].map((item) => (
                  <button
                    className={`inspiration-card ${item.style}`}
                    key={item.label}
                    onClick={() => example(item.text, item.style)}
                  >
                    <div className="mini-art">{item.glyph}</div>
                    <div>
                      <small>{item.label}</small>
                      <strong>{item.title}</strong>
                    </div>
                    <span>↗</span>
                  </button>
                ))}
              </div>
            </section>
            <footer>
              <span>✦ 为你的灵感，留一个发生的空间。</span>
              <span>
                模板动画创作 <b>·</b> 规则分镜 · 非 AI 场景生成
              </span>
            </footer>
          </div>
        ) : (
          <div className="main-content">
            <div className="page-heading">
              <div className="eyebrow">YOUR CREATIVE COLLECTION</div>
              <h1>
                我的作品<span>，灵感存档。</span>
              </h1>
              <p>最近 6 次预览保存在当前浏览器，点击继续编辑。</p>
            </div>
            {works.length ? (
              <div className="works-grid">
                {works.map((w) => (
                  <button
                    className="work-card"
                    disabled={rendering}
                    key={w.id}
                    onClick={() => {
                      setIdea(w.video.idea);
                      setImage(w.video.image);
                      setStyle(w.video.styleId);
                      setPreviewRevision((revision) => revision + 1);
                      setCreated(true);
                      setDownload("");
                      setTab("create");
                      setNotice("已恢复作品，可以继续调整或导出。");
                    }}
                  >
                    <div className="work-art">
                      {w.video.image ? (
                        <img src={w.video.image} alt="作品素材" />
                      ) : (
                        <Crystal
                          accent={
                            styles.find((s) => s.id === w.video.styleId)
                              ?.accent || "#a1efce"
                          }
                        />
                      )}
                    </div>
                    <h3>{w.video.title}</h3>
                    <p>
                      {w.date} · {w.video.seconds}s
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span>✧</span>
                <h2>这里等待你的第一份灵感</h2>
                <p>生成一次视频预览，作品就会出现在这里。</p>
                <button
                  className="export-button ready"
                  onClick={() => setTab("create")}
                >
                  开始创作 →
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="使用指南"
            className="help-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setHelp(false)}
              aria-label="关闭指南"
            >
              ×
            </button>
            <div className="eyebrow">A LITTLE GUIDE</div>
            <h2>你的第一条视频，只需三步。</h2>
            <p>1. 写下主题、希望展示的文字，或上传图片。</p>
            <p>2. 选择喜欢的风格，生成并播放预览。</p>
            <p>3. 满意后点击导出，等待完成，再下载 MP4。</p>
            <div className="help-note">
              当前使用本地 Remotion
              动态模板，文字会作为标题和字幕，图片会进行缩放与悬浮动画。它不会自动生成真实场景、改变图片主体动作或生成配音。导出视频目前不含音轨。
            </div>
            <button className="generate-button" onClick={() => setHelp(false)}>
              开始创作 →
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
