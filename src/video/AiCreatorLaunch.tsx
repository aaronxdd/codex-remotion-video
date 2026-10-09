import React from 'react';
import {loadFont} from '@remotion/google-fonts/NotoSansSC';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const {fontFamily} = loadFont('normal', {weights: ['400', '600', '700', '900'], subsets: ['chinese-simplified']});

export type AiCreatorLaunchProps = {
  brand: string;
  headline: string;
  subline: string;
  accent: string;
};

const palette = {bg: '#080A0F', panel: '#12151D', text: '#F5F7FA', muted: '#9299A8'};

const Grain: React.FC = () => (
  <AbsoluteFill
    style={{
      opacity: 0.12,
      backgroundImage:
        'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 180 180\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'.35\'/%3E%3C/svg%3E")',
    }}
  />
);

const Scene: React.FC<React.PropsWithChildren<{from: number; duration: number}>> = ({from, duration, children}) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const opacity = interpolate(local, [0, 10, duration - 12, duration], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <Sequence from={from} durationInFrames={duration}><AbsoluteFill style={{opacity}}>{children}</AbsoluteFill></Sequence>;
};

const Tag: React.FC<{children: React.ReactNode; accent: string}> = ({children, accent}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, border: `2px solid ${accent}55`, borderRadius: 999, padding: '14px 24px', color: accent, fontSize: 28, fontWeight: 700, letterSpacing: 2}}>
    <span style={{width: 10, height: 10, borderRadius: 10, background: accent, boxShadow: `0 0 22px ${accent}`}} />{children}
  </div>
);

const Opening: React.FC<AiCreatorLaunchProps> = ({brand, headline, subline, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 15, stiffness: 120}});
  const cursor = Math.floor(frame / 10) % 2 === 0;
  return (
    <AbsoluteFill style={{padding: '170px 86px', justifyContent: 'space-between'}}>
      <div style={{transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`, opacity: enter}}><Tag accent={accent}>{brand}</Tag></div>
      <div>
        <div style={{fontSize: 112, lineHeight: 1.06, fontWeight: 900, letterSpacing: -7}}>{headline}</div>
        <div style={{height: 18, width: interpolate(enter, [0, 1], [0, 360]), background: accent, borderRadius: 20, margin: '38px 0 42px'}} />
        <div style={{fontSize: 42, lineHeight: 1.45, color: palette.muted, fontWeight: 600}}>{subline}</div>
      </div>
      <div style={{fontFamily: 'monospace', padding: 32, borderRadius: 28, background: '#0D1016', border: '1px solid #242936', fontSize: 29, color: '#C7CEDB'}}>
        <span style={{color: accent}}>›</span> codex “制作一支品牌短片”<span style={{opacity: cursor ? 1 : 0}}>▋</span>
      </div>
    </AbsoluteFill>
  );
};

const Workflow: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const steps = ['理解创意', '生成 React 场景', 'Remotion 渲染'];
  return (
    <AbsoluteFill style={{padding: '190px 80px'}}>
      <Tag accent={accent}>AI VIDEO WORKFLOW</Tag>
      <div style={{fontSize: 82, lineHeight: 1.12, fontWeight: 900, marginTop: 70}}>从想法到成片<br/>只需三步</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 26, marginTop: 100}}>
        {steps.map((step, index) => {
          const progress = spring({frame: frame - index * 14, fps: 30, config: {damping: 18}});
          return (
            <div key={step} style={{display: 'flex', alignItems: 'center', gap: 28, padding: '34px 38px', borderRadius: 28, background: palette.panel, border: '1px solid #292E39', transform: `translateX(${interpolate(progress, [0, 1], [120, 0])}px)`, opacity: progress}}>
              <div style={{display: 'grid', placeItems: 'center', width: 74, height: 74, borderRadius: 22, background: index === 2 ? accent : '#222733', color: index === 2 ? '#091000' : palette.text, fontSize: 30, fontWeight: 900}}>0{index + 1}</div>
              <div style={{fontSize: 42, fontWeight: 700}}>{step}</div>
              <div style={{marginLeft: 'auto', color: accent, fontSize: 34}}>→</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const CodeScene: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 90], [0.94, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{padding: '180px 70px'}}>
      <div style={{fontSize: 74, fontWeight: 900}}>画面，就是代码。</div>
      <div style={{fontSize: 34, color: palette.muted, marginTop: 24}}>每个文案、颜色与节奏都可被参数化</div>
      <div style={{marginTop: 90, borderRadius: 34, background: '#0C0F15', border: '1px solid #303644', overflow: 'hidden', boxShadow: '0 50px 120px #000', transform: `scale(${scale})`}}>
        <div style={{display: 'flex', gap: 12, padding: 26, background: '#151923'}}>{['#FF6259', '#FFBE2E', '#28C840'].map((c) => <span key={c} style={{width: 18, height: 18, borderRadius: 20, background: c}} />)}</div>
        <pre style={{fontFamily: 'monospace', fontSize: 28, lineHeight: 1.7, padding: '30px 36px 50px', margin: 0, color: '#D7DEEA', whiteSpace: 'pre-wrap'}}>
          <span style={{color: '#C792EA'}}>const</span> video = {'{'}{`\n`}  title: <span style={{color: accent}}>“AI 视频创作”</span>,{`\n`}  format: <span style={{color: '#89DDFF'}}>“9:16”</span>,{`\n`}  duration: <span style={{color: '#F78C6C'}}>12</span>,{`\n`}  style: <span style={{color: accent}}>“bold”</span>{`\n`}{'}'};
        </pre>
      </div>
    </AbsoluteFill>
  );
};

const Finale: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 8) * 0.025;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 80}}>
      <div style={{width: 220, height: 220, borderRadius: 60, display: 'grid', placeItems: 'center', background: accent, color: '#091000', fontWeight: 900, fontSize: 96, transform: `scale(${pulse})`, boxShadow: `0 0 120px ${accent}66`}}>▶</div>
      <div style={{fontSize: 94, lineHeight: 1.08, fontWeight: 900, marginTop: 80}}>现在，轮到你的<br/>创意登场</div>
      <div style={{marginTop: 48, fontSize: 34, color: palette.muted}}>npm run dev · 修改参数 · 一键渲染</div>
      <div style={{marginTop: 100, padding: '22px 34px', borderRadius: 20, background: accent, color: '#091000', fontSize: 34, fontWeight: 900}}>CODEX × REMOTION</div>
    </AbsoluteFill>
  );
};

export const AiCreatorLaunch: React.FC<AiCreatorLaunchProps> = (props) => {
  const frame = useCurrentFrame();
  const glowX = 20 + Math.sin(frame / 55) * 25;
  return (
    <AbsoluteFill style={{fontFamily, color: palette.text, background: palette.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at ${glowX}% 20%, ${props.accent}22, transparent 38%), radial-gradient(circle at 90% 80%, #6655FF22, transparent 34%)`}} />
      <Scene from={0} duration={105}><Opening {...props} /></Scene>
      <Scene from={90} duration={105}><Workflow accent={props.accent} /></Scene>
      <Scene from={180} duration={105}><CodeScene accent={props.accent} /></Scene>
      <Scene from={270} duration={90}><Finale accent={props.accent} /></Scene>
      <Grain />
    </AbsoluteFill>
  );
};
