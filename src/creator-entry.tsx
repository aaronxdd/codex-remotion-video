import React from "react";
import { Composition, registerRoot } from "remotion";
import { CreatorVideo, dimensions, initialVideo } from "./video/CreatorVideo";
const Root = () => (
  <Composition
    id="CreatorVideo"
    component={CreatorVideo}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={360}
    defaultProps={initialVideo}
    calculateMetadata={({ props }) => ({
      ...dimensions(props.ratio),
      durationInFrames: props.seconds * 30,
    })}
  />
);
registerRoot(Root);
