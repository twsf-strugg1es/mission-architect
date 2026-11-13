import "./theme";
import { Composition, Still } from "remotion";
import { Poster, loadPoster } from "./Poster";
import { FPS } from "./timeline";
import { VideoA, loadA } from "./VideoA";
import { VideoB, loadB } from "./VideoB";

const blank = { marks: {}, voice: { file: null, lines: [] } };

export const RemotionRoot: React.FC = () => (
  <>
    {/* The brief's VideoA_Local240 / VideoB_Global30: Remotion ids allow only letters, digits and hyphens. */}
    <Composition id="VideoA-Local240" component={VideoA} width={1920} height={1080} fps={FPS} durationInFrames={FPS * 225} defaultProps={blank} calculateMetadata={loadA} />
    <Composition id="VideoB-Global30" component={VideoB} width={1920} height={1080} fps={FPS} durationInFrames={FPS * 29} defaultProps={blank} calculateMetadata={loadB} />
    <Still id="Poster" component={Poster} width={1920} height={1080} defaultProps={{ marks: {} }} calculateMetadata={loadPoster} />
  </>
);
