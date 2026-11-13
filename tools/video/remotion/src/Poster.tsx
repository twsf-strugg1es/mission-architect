import React from "react";
import { OffthreadVideo, staticFile, type CalculateMetadataFunction } from "remotion";
import { Kicker, Page } from "./parts";
import { TEAM } from "./team";
import { C } from "./theme";
import { loadMarks, sec, type Marks } from "./timeline";

type Props = { marks: Marks };

/** poster.png: the title beside a still of the real results screen (no animation: it is one frame). */
export const Poster: React.FC<Props> = ({ marks }) => {
  const t = marks["05-results"]?.results;
  return (
    <Page>
      {Number.isFinite(t) && (
        <div style={{ position: "absolute", left: 700, top: 225, width: 1120, height: 630, border: `1px solid ${C.rule}`, overflow: "hidden" }}>
          <OffthreadVideo src={staticFile("clips/05-results.mp4")} trimBefore={sec(t + 3.5)} muted style={{ width: "100%", height: "100%" }} />
        </div>
      )}
      <div style={{ position: "absolute", left: 100, top: 300, width: 540 }}>
        <Kicker>NASA Space Apps Challenge 2026</Kicker>
        <div style={{ fontSize: 104, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.03em", marginTop: 20 }}>Mission Architect</div>
        <div style={{ fontSize: 40, color: C.signal, marginTop: 28 }}>Design it. Build it. Fly it.</div>
        <div style={{ fontSize: 32, color: C.ink2, marginTop: 44 }}>Team {TEAM.team}</div>
      </div>
    </Page>
  );
};

export const loadPoster: CalculateMetadataFunction<Props> = async () => ({ props: { marks: await loadMarks() } });
