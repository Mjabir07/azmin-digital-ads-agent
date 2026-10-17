import { Composition } from "remotion";
import { DemoReel } from "./DemoReel";
import { TrendReel } from "./TrendReel";

export const Root: React.FC = () => (
  <>
    <Composition id="DemoReel" component={DemoReel} durationInFrames={540} fps={30} width={1080} height={1920} />
    <Composition id="TrendReel" component={TrendReel} durationInFrames={480} fps={30} width={1080} height={1920} />
  </>
);
