import { Composition } from "remotion";
import { DemoReel } from "./DemoReel";
import { TrendReel } from "./TrendReel";
import { CreatorReel, CREATOR_REEL_FRAMES } from "./CreatorReel";
import { AvatarReel, avatarReelFrames } from "./AvatarReel";
import { WorkReel, WORK_REEL_FRAMES } from "./WorkReel";
import { ExplainerReel, EXPLAINER_REEL_FRAMES } from "./ExplainerReel";
import { YaraTutorial, YARA_TUTORIAL_FRAMES } from "./YaraTutorial";

export const Root: React.FC = () => (
  <>
    <Composition id="DemoReel" component={DemoReel} durationInFrames={540} fps={30} width={1080} height={1920} />
    <Composition id="TrendReel" component={TrendReel} durationInFrames={480} fps={30} width={1080} height={1920} />
    <Composition id="CreatorReel" component={CreatorReel} durationInFrames={CREATOR_REEL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="AvatarReel" component={AvatarReel} defaultProps={{ set: "jabir" as const }} durationInFrames={avatarReelFrames("jabir")} fps={30} width={1080} height={1920} />
    <Composition id="YaraReel" component={AvatarReel} defaultProps={{ set: "yara" as const }} durationInFrames={avatarReelFrames("yara")} fps={30} width={1080} height={1920} />
    <Composition id="YaraAiReel" component={AvatarReel} defaultProps={{ set: "yaraAi" as const }} durationInFrames={avatarReelFrames("yaraAi")} fps={30} width={1080} height={1920} />
    <Composition id="YaraDebateReel" component={AvatarReel} defaultProps={{ set: "yaraDebate" as const }} durationInFrames={avatarReelFrames("yaraDebate")} fps={30} width={1080} height={1920} />
    <Composition id="WorkReel" component={WorkReel} durationInFrames={WORK_REEL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="YaraTutorialEp01" component={YaraTutorial} durationInFrames={YARA_TUTORIAL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ExplainerReel" component={ExplainerReel} durationInFrames={EXPLAINER_REEL_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
