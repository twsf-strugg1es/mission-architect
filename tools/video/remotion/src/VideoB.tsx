import React from "react";
import { Series, useCurrentFrame, type CalculateMetadataFunction } from "remotion";
import { EndCard, Page, Shots, TitleCard, VoiceLine } from "./parts";
import { scriptB } from "./script";
import { CREDITS, TEAM } from "./team";
import { draftVoice, loadJson, loadMarks, sec } from "./timeline";
import { DV, marksOf, type Props } from "./VideoA";

/** The brief's cut list (title 3 s, builder 10, event 8, results 5, end card), kept just under 30 s with hard cuts. */
export const VideoB: React.FC<Props> = ({ marks, voice }) => {
  const { m, shot } = marksOf(marks);
  const frame = useCurrentFrame();
  const [B, F, R] = ["03-builder", "04-window-flight", "05-results"];
  const cuts: [number, React.ReactNode][] = [
    [3, <TitleCard team={TEAM.team} members={TEAM.members} />],
    [10, <Shots frames={sec(10)} shots={[...shot(B, m(B, "parts"), m(B, "fuel"), { rate: 3 }), ...shot(B, m(B, "equation", -2), m(B, "equation", 3.4), { zoom: { ...DV, at: 2 } })]} />],
    [8, <Shots frames={sec(8)} shots={shot(F, m(F, "event1", -0.3), m(F, "event1Done"), { zoom: { x: 960, y: 540, at: 0.5 } })} />],
    [5, <Shots frames={sec(5)} shots={shot(R, m(R, "results", -0.2), m(R, "scroll"))} />],
    [3.5, <EndCard team={TEAM.team} members={TEAM.members} credits={CREDITS} />],
  ];
  return (
    <Page>
      <Series>
        {cuts.map(([s, el], i) => (
          <Series.Sequence key={i} durationInFrames={sec(s)}>
            <Page>{el}</Page>
          </Series.Sequence>
        ))}
      </Series>
      <VoiceLine voice={voice.file} line={voice.lines[0]} delay={0.2} left={frame >= sec(3) && frame < sec(13)} />
    </Page>
  );
};

export const loadB: CalculateMetadataFunction<Props> = async () => ({
  props: { marks: await loadMarks(), voice: await loadJson("assets/voice-b.json", draftVoice(scriptB(TEAM))) },
  durationInFrames: sec(29.5),
});
