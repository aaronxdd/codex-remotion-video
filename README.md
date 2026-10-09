# Codex × Remotion AI Video

一个面向抖音、视频号和 Reels 的竖屏短视频模板。使用 React + Remotion 把文案、品牌色和动效变成可编程视频，适合作为 Codex 辅助创作的起点。

## 效果

- 1080 × 1920，30 FPS，12 秒
- 四段式节奏：钩子、工作流、代码感展示、行动号召
- 中文字体、品牌色、标题均可参数化
- 无需图片素材，克隆后即可预览和渲染

## 开始使用

```bash
npm install
npm run dev
```

在 Remotion Studio 中打开 `AiCreatorLaunch`。修改 `src/Root.tsx` 的 `defaultProps` 即可替换品牌、标题和强调色。

## 渲染 MP4

```bash
npm run render
```

成片输出到 `out/ai-creator-launch.mp4`。

## 用 Codex 继续创作

可以直接描述下一支视频，例如：

> 把视频改成 15 秒，主题换成新品发布，主色用橙色，第二幕增加三个产品卖点。

## 技术栈

- Remotion 4
- React 19
- TypeScript

## License

MIT
