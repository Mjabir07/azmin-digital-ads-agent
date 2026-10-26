import { Composition, Still } from "remotion";
import { DemoReel } from "./DemoReel";
import { TrendReel } from "./TrendReel";
import { CreatorReel, CREATOR_REEL_FRAMES } from "./CreatorReel";
import { AvatarReel, avatarReelFrames } from "./AvatarReel";
import { WorkReel, WORK_REEL_FRAMES } from "./WorkReel";
import { ExplainerReel, EXPLAINER_REEL_FRAMES } from "./ExplainerReel";
import { YaraTutorial, YARA_TUTORIAL_FRAMES } from "./YaraTutorial";
import { YaraTutorialV2, YARA_V2_FRAMES } from "./YaraTutorialV2";
import { YaraTutorialV3, YARA_V3_FRAMES } from "./YaraTutorialV3";
import { YaraEpisode, episodeFrames, type EpisodeProps } from "./YaraEpisode";
import { YaraThumb, type ThumbProps } from "./YaraThumb";

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
    <Composition id="YaraTutorialEp01V2" component={YaraTutorialV2} durationInFrames={YARA_V2_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="YaraTutorialEp01V3" component={YaraTutorialV3} defaultProps={{}} durationInFrames={YARA_V3_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="YaraEp01" component={YaraEpisode} defaultProps={{} as EpisodeProps} durationInFrames={episodeFrames({})} fps={30} width={1080} height={1920}
      calculateMetadata={({ props }) => ({ durationInFrames: episodeFrames(props) })} />
    <Still id="YaraThumb" component={YaraThumb} width={1080} height={1920}
      defaultProps={{ ep: 1, kicker: "CLAUDE SKILLS", title: "Teach Claude new skills in seconds", accent: "new skills", image: "yara.jpg" } as ThumbProps} />
    <Composition id="ExplainerReel" component={ExplainerReel} durationInFrames={EXPLAINER_REEL_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
