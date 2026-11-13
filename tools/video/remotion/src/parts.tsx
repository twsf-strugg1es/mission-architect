import React from "react";
import { AbsoluteFill, Audio, Easing, Freeze, Img, interpolate, OffthreadVideo, Sequence, Series, staticFile, useCurrentFrame } from "remotion";
import { C, SANS } from "./theme";
import { FPS, lineSeconds, sec, subtitles, within, type Line } from "./timeline";

export const Page: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: C.paper, color: C.ink, fontFamily: SANS }}>{children}</AbsoluteFill>
);

/** Fades and lifts its children in, `delay` seconds after the section starts (opacity and transform only). */
export const Rise: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const f = useCurrentFrame() - sec(delay);
  const k = interpolate(f, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return <div style={{ ...style, opacity: k, transform: `translateY(${(1 - k) * 18}px)` }}>{children}</div>;
};

/** A slice of a raw recording (`from`-`to` seconds, played at `rate`), with an optional slow 1.0 -> 1.15 zoom toward x, y. */
export type Shot = { clip: string; from: number; to: number; rate?: number; label?: string; zoom?: { x: number; y: number; at: number } };
export const shotSeconds = (s: Shot) => (s.to - s.from) / (s.rate ?? 1);

const ShotView: React.FC<{ shot: Shot }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const own = sec(shotSeconds(shot));
  const z = shot.zoom;
  const scale = z ? interpolate(frame, [sec(z.at), sec(z.at + 1.4)], [1, 1.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }) : 1;
  // clips/ = 30 fps copies of raw/ with a keyframe every half second (fast frame access; raw/ stays as recorded)
  const video = <OffthreadVideo src={staticFile(`clips/${shot.clip}.mp4`)} trimBefore={sec(shot.from)} trimAfter={sec(shot.to)} playbackRate={shot.rate ?? 1} muted />;
  return (
    <>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: z ? `${z.x}px ${z.y}px` : "center" }}>
        {frame < own ? video : <Freeze frame={own - 1}>{video}</Freeze>}
      </AbsoluteFill>
      {shot.label && <Label text={shot.label} />}
    </>
  );
};

/** Shots back to back with plain cuts; the last one holds its final frame if the section runs longer. */
export const Shots: React.FC<{ shots: Shot[]; frames: number }> = ({ shots, frames }) => {
  const own = shots.map((s) => sec(shotSeconds(s)));
  const lead = own.slice(0, -1).reduce((a, b) => a + b, 0);
  return (
    <Series>
      {shots.map((s, i) => (
        <Series.Sequence key={i} durationInFrames={i === shots.length - 1 ? Math.max(1, frames - lead) : own[i]}>
          <ShotView shot={s} />
        </Series.Sequence>
      ))}
    </Series>
  );
};

export const footageSeconds = (shots: Shot[]) => shots.reduce((n, s) => n + shotSeconds(s), 0);

/** A small name for what is on screen, in the game's empty left margin under its header bar. */
export const Label: React.FC<{ text: string }> = ({ text }) => (
  <Rise delay={0.3} style={{ position: "absolute", left: 40, top: 76, maxWidth: 345, padding: "8px 14px", background: C.paper3, border: `1px solid ${C.rule}`, fontSize: 24, lineHeight: 1.3, fontWeight: 500 }}>
    {text}
  </Rise>
);

/** A voiceover line placed `delay` seconds into its section, with its burned-in subtitles (bottom third;
 *  `left` keeps them off the right-hand panel, for the rocket-equation shot). */
export const VoiceLine: React.FC<{ voice: string | null; line: Line | undefined; delay: number; left?: boolean }> = ({ voice, line, delay, left }) => {
  const frame = useCurrentFrame();
  if (!line) return null;
  const t = frame / FPS - delay;
  const sub = subtitles(line).find((c) => t >= c.from && t < c.to);
  const len = sec(lineSeconds(line));
  return (
    <>
      {voice && (
        <Sequence from={sec(delay)} durationInFrames={len}>
          <Audio
            src={staticFile(voice)}
            trimBefore={sec(line.startMs / 1000)}
            trimAfter={sec(line.endMs / 1000)}
            volume={(f) => interpolate(f, [0, 3, len - 3, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          />
        </Sequence>
      )}
      {sub && (
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: left ? "flex-start" : "center", paddingBottom: 64, paddingLeft: left ? 60 : 0 }}>
          <div
            style={{
              maxWidth: left ? 1000 : 1560,
              padding: "14px 30px",
              background: "oklch(15.5% 0.05 262 / 0.94)",
              border: `1px solid ${C.rule}`,
              color: C.ink,
              fontFamily: SANS,
              fontSize: 48,
              lineHeight: 1.3,
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            {sub.text}
          </div>
        </AbsoluteFill>
      )}
    </>
  );
};

export const Kicker: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ fontSize: 30, color: C.ink3 }}>{children}</div>;

/** Team name and every member, in the game's own type. */
export const Team: React.FC<{ team: string; members: string[]; delay?: number; size?: number }> = ({ team, members, delay = 0, size = 42 }) => (
  <div style={{ display: "flex", gap: 96, borderTop: `1px solid ${C.rule}`, paddingTop: 36 }}>
    <Rise delay={delay}>
      <Kicker>Team</Kicker>
      <div style={{ fontSize: size + 12, fontWeight: 500, marginTop: 8 }}>{team}</div>
    </Rise>
    <div>
      <Rise delay={delay + 0.2}>
        <Kicker>Members</Kicker>
      </Rise>
      <div style={{ display: "grid", gridTemplateColumns: members.length > 3 ? "repeat(2, auto)" : "auto", columnGap: 64, rowGap: 6, marginTop: 8 }}>
        {members.map((m, i) => (
          <Rise key={m} delay={delay + 0.35 + i * 0.25}>
            <div style={{ fontSize: size, lineHeight: 1.3 }}>{m}</div>
          </Rise>
        ))}
      </div>
    </div>
  </div>
);

export const TitleCard: React.FC<{ team: string; members: string[] }> = ({ team, members }) => (
  <Page>
    <div style={{ position: "absolute", left: 160, right: 160, top: 130 }}>
      <Rise>
        <Kicker>NASA Space Apps Challenge 2026: Space Mission Design Game</Kicker>
      </Rise>
      <Rise delay={0.15}>
        <div style={{ fontSize: 150, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1, marginTop: 24 }}>Mission Architect</div>
      </Rise>
      <Rise delay={0.3}>
        <div style={{ fontSize: 50, color: C.signal, marginTop: 24, marginBottom: 64 }}>Design it. Build it. Fly it.</div>
      </Rise>
      <Team team={team} members={members} delay={0.6} />
    </div>
  </Page>
);

/** The problem: the challenge's name, and fuel, power and money appearing as the voice says each word. */
export const ProblemCard: React.FC<{ line: Line | undefined; at: number }> = ({ line, at }) => (
  <Page>
    <div style={{ position: "absolute", left: 160, right: 160, top: 150 }}>
      <Rise>
        <Kicker>The problem</Kicker>
      </Rise>
      <Rise delay={0.15}>
        <div style={{ fontSize: 96, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.05, marginTop: 20, maxWidth: 1400 }}>
          Real space missions take years and huge teams to design.
        </div>
      </Rise>
      <div style={{ display: "flex", gap: 32, marginTop: 72 }}>
        {["Fuel", "Power", "Money"].map((w) => (
          <Rise key={w} delay={at + within(line, w)}>
            <div style={{ border: `1px solid ${C.rule}`, background: C.paper2, padding: "26px 56px", fontSize: 64, fontWeight: 500 }}>{w}</div>
          </Rise>
        ))}
      </div>
      <Rise delay={0.6}>
        <div style={{ marginTop: 72, fontSize: 32, color: C.ink3 }}>Challenge: Space Mission Design Game, NASA Space Apps 2026</div>
      </Rise>
    </div>
  </Page>
);

/** The same game on a phone: three real phone-width screenshots of the build (tools/build). */
export const PhonesCard: React.FC = () => (
  <Page>
    <div style={{ position: "absolute", inset: 0, paddingBottom: 150, display: "flex", justifyContent: "center", alignItems: "center", gap: 64 }}>
      {["m-02-home-phone", "m-03-builder-phone", "m-04-flight-phone"].map((f, i) => (
        <Rise key={f} delay={0.2 + i * 0.3}>
          <Img src={staticFile(`build/${f}.png`)} style={{ height: 780, border: `1px solid ${C.rule}`, display: "block" }} />
        </Rise>
      ))}
    </div>
  </Page>
);

export const EndCard: React.FC<{ team: string; members: string[]; credits: string[] }> = ({ team, members, credits }) => (
  <Page>
    <div style={{ position: "absolute", left: 160, right: 160, top: 100 }}>
      <Rise>
        <div style={{ fontSize: 110, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1 }}>Mission Architect</div>
      </Rise>
      <Rise delay={0.15}>
        <div style={{ fontSize: 46, color: C.signal, marginTop: 20 }}>Design it. Build it. Fly it.</div>
      </Rise>
      <Rise delay={0.3}>
        <div style={{ fontSize: 40, marginTop: 28, marginBottom: 48 }}>Play it live — link on our project page.</div>
      </Rise>
      <Team team={team} members={members} delay={0.5} size={36} />
      <Rise delay={1.2}>
        <div style={{ borderTop: `1px solid ${C.rule}`, marginTop: 40, paddingTop: 24, fontSize: 24, lineHeight: 1.5, color: C.ink3 }}>
          {credits.map((c) => (
            <div key={c}>{c}</div>
          ))}
        </div>
      </Rise>
    </div>
  </Page>
);
