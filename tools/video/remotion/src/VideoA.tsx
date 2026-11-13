import React from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { CalculateMetadataFunction } from "remotion";
import { EndCard, footageSeconds, Page, PhonesCard, ProblemCard, Shots, TitleCard, VoiceLine, type Shot } from "./parts";
import { scriptA } from "./script";
import { CREDITS, TEAM } from "./team";
import { draftVoice, lineSeconds, loadJson, loadMarks, sec, type Line, type Marks, type Voice } from "./timeline";

export type Props = { marks: Marks; voice: Voice };
type Section = { id: string; at: number; min?: number; shots?: Shot[]; left?: boolean; card?: (line: Line | undefined, at: number) => React.ReactNode };

/** Zoom origin (px) for the builder's side panel: its lower half holds the delta-v bar, the fuel readout and the
 *  rocket equation (measured on the recorded frame). The subtitles move left while it is on screen. */
export const DV = { x: 1300, y: 1000 };
const XFADE = 10; // frames of crossfade between sections
const TAIL = 0.9; // seconds of picture after a line ends
const CRUISE = 2; // the quiet flight between events (recorded at 1x) is shown faster, with a label saying so

/** A shot list helper over the recorded marks; a clip without marks yet gives no shot. */
export const marksOf = (M: Marks) => {
  const m = (clip: string, mark: string, plus = 0) => (M[clip]?.[mark] ?? NaN) + plus;
  const shot = (clip: string, from: number, to: number, extra: Partial<Shot> = {}): Shot[] => (Number.isFinite(from + to) ? [{ clip, from, to, ...extra }] : []);
  return { m, shot };
};
const after = (s: number) => (Number.isFinite(s) ? Math.max(0.3, s) : 0.5);

/** Video A in order: each section's voice line starts `at` seconds in, over its footage or card. */
function plan(M: Marks): Section[] {
  const { m, shot } = marksOf(M);
  const [H, D, B, F, R, N] = ["01-home", "02-destination", "03-builder", "04-window-flight", "05-results", "06-about-numbers"];
  return [
    { id: "title", at: 1.2, min: 7, card: () => <TitleCard team={TEAM.team} members={TEAM.members} /> },
    { id: "problem", at: 0.6, card: (line, at) => <ProblemCard line={line} at={at} /> },
    { id: "solution", at: 0.8, shots: shot(H, 0, m(H, "end")) },
    {
      id: "build",
      at: 0.5,
      shots: [
        ...shot(D, m(D, "destination", -0.5), m(D, "moon", 1.5), { label: "Pick a destination" }),
        ...shot(B, m(B, "vehicle", -0.5), m(B, "builder", -0.3), { label: "Choose rocket and engine" }),
        ...shot(B, m(B, "builder", -0.3), m(B, "fuel"), { label: "Build the spacecraft" }),
      ],
    },
    {
      id: "equation",
      at: after(m(B, "equation") - m(B, "fuel") - 1.2),
      left: true,
      shots: shot(B, m(B, "fuel"), m(B, "equation", 3.4), { zoom: { ...DV, at: m(B, "equation") - m(B, "fuel") } }),
    },
    { id: "blocked", at: after(m(B, "broken") - m(B, "equation", 3.4) - 0.3), shots: shot(B, m(B, "equation", 3.4), m(B, "end"), { label: "No power: launch blocked" }) },
    {
      id: "flight",
      at: after(m(F, "launch") - m(F, "window", -0.5)),
      shots: [
        ...shot(F, m(F, "window", -0.5), m(F, "launch", 1), { label: "Choose a launch window" }),
        ...shot(F, m(F, "launch", 1), m(F, "event1", 0.2), { rate: CRUISE, label: `Flight, shown at ${CRUISE}× speed` }),
        ...shot(F, m(F, "event1", 0.2), m(F, "event1Done"), { zoom: { x: 960, y: 540, at: 0.3 } }),
        ...shot(F, m(F, "event1Done"), m(F, "event2Done"), { label: "Skip to next event" }),
        ...shot(F, m(F, "event2Done"), m(F, "complete"), { rate: CRUISE, label: `Shown at ${CRUISE}× speed` }),
        ...shot(F, m(F, "complete"), m(F, "end")),
      ],
    },
    { id: "results", at: 0.6, shots: shot(R, m(R, "results", -0.5), m(R, "end"), { label: "Results and debrief" }) },
    { id: "anywhere", at: 0.5, min: 7, card: () => <PhonesCard /> },
    { id: "nasa", at: after(m(N, "about") - m(N, "about", -0.8)), shots: shot(N, m(N, "about", -0.8), m(N, "sources", 2.4), { label: "About the numbers: our NASA sources" }) },
    { id: "close", at: 0.8, min: 9, card: () => <EndCard team={TEAM.team} members={TEAM.members} credits={CREDITS} /> },
  ];
}

/** Each section with its voice line and length: the longer of the line (plus a short tail) and the footage. */
const layout = ({ marks, voice }: Props) =>
  plan(marks).map((s) => {
    const line = voice.lines.find((l) => l.id === s.id);
    return { ...s, line, frames: sec(Math.max(s.at + lineSeconds(line) + TAIL, footageSeconds(s.shots ?? []), s.min ?? 0)) };
  });

export const VideoA: React.FC<Props> = (props) => (
  <Page>
    <TransitionSeries>
      {layout(props).flatMap((s, i) => {
        const seq = (
          <TransitionSeries.Sequence key={s.id} durationInFrames={s.frames}>
            <Page>
              {s.card ? s.card(s.line, s.at) : <Shots shots={s.shots ?? []} frames={s.frames} />}
              <VoiceLine voice={props.voice.file} line={s.line} delay={s.at} left={s.left} />
            </Page>
          </TransitionSeries.Sequence>
        );
        return i ? [<TransitionSeries.Transition key={`x-${s.id}`} presentation={fade()} timing={linearTiming({ durationInFrames: XFADE })} />, seq] : [seq];
      })}
    </TransitionSeries>
  </Page>
);

export const loadA: CalculateMetadataFunction<Props> = async () => {
  const props = { marks: await loadMarks(), voice: await loadJson<Voice>("assets/voice-a.json", draftVoice(scriptA(TEAM))) };
  const parts = layout(props);
  return { props, durationInFrames: parts.reduce((n, s) => n + s.frames, 0) - XFADE * (parts.length - 1) };
};
