import React from 'react';
import {Composition} from 'remotion';
import {AiCreatorLaunch, type AiCreatorLaunchProps} from './video/AiCreatorLaunch';

const defaultProps: AiCreatorLaunchProps = {
  brand: 'CODEX × REMOTION',
  headline: '一句话，做出一支视频',
  subline: '让 AI 写脚本、做动效、批量渲染',
  accent: '#B8FF5A',
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AiCreatorLaunch"
      component={AiCreatorLaunch}
      durationInFrames={360}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};
