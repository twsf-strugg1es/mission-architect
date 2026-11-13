import { staticFile } from "remotion";

export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);

/** Moments in each raw clip, in seconds (written by tools/video/record.mjs as raw/<clip>.marks.json). */
export type Marks = Record<string, Record<string, number>>;

/** One voice line: where its good take sits in the voice file, and its words (the Buzz transcript, names fixed).
 *  `segs` are Buzz's own subtitle segments inside the take, so subtitles follow the real pace of speech. */
export type Seg = { startMs: number; endMs: number; text: string };
export type Line = Seg & { id: string; segs?: Seg[] };
export type Voice = { file: string | null; lines: Line[] };

export async function loadJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(staticFile(file));
    return res.ok ? ((await res.json()) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const CLIPS = ["01-home", "02-destination", "03-builder", "04-window-flight", "05-results", "06-about-numbers"];
export async function loadMarks(): Promise<Marks> {
  const all = await Promise.all(CLIPS.map((c) => loadJson<Record<string, number>>(`raw/${c}.marks.json`, {})));
  return Object.fromEntries(CLIPS.map((c, i) => [c, all[i]]));
}

/** A stand-in voice for draft cuts before the recording exists: the script, timed at 2.5 words a second. */
export function draftVoice(script: Record<string, string>): Voice {
  let t = 0;
  const lines = Object.entries(script).map(([id, text]) => {
    const ms = (text.split(/\s+/).length / 2.5) * 1000;
    const line = { id, startMs: t, endMs: t + ms, text };
    t += ms + 2000;
    return line;
  });
  return { file: null, lines };
}

export const lineSeconds = (line: Line | undefined) => (line ? (line.endMs - line.startMs) / 1000 : 0);

/** Subtitle chunks of a line (short phrases, at most `maxWords`), timed by their share of the line's characters. */
export function chunks(line: Line, maxWords = 9): { text: string; from: number; to: number }[] {
  const parts: string[] = [];
  for (const phrase of line.text.split(/(?<=[,.;:!?—])\s+/)) {
    const words = phrase.split(/\s+/).filter(Boolean);
    for (let i = 0; i < words.length; i += maxWords) {
      const piece = words.slice(i, i + maxWords);
      const last = parts.length - 1;
      // a tiny phrase ("A real", "Mars,") joins the previous chunk instead of flashing alone
      if (piece.length < 3 && last >= 0 && parts[last].split(" ").length + piece.length <= maxWords + 2) parts[last] += ` ${piece.join(" ")}`;
      else parts.push(piece.join(" "));
    }
  }
  const total = parts.reduce((n, p) => n + p.length, 0);
  const seconds = lineSeconds(line);
  let t = 0;
  return parts.map((text) => {
    const from = t;
    t += (text.length / total) * seconds;
    return { text, from, to: t };
  });
}

/** All subtitle chunks of a line, seconds from its start: per Buzz segment when there are segments. */
export const subtitles = (line: Line) =>
  (line.segs ?? [line]).flatMap((s) => {
    const off = (s.startMs - line.startMs) / 1000;
    return chunks({ ...line, ...s }).map((c) => ({ ...c, from: c.from + off, to: c.to + off }));
  });

/** When (seconds into the line) the words starting with `phrase` are spoken, by character position. */
export function within(line: Line | undefined, phrase: string): number {
  if (!line) return 0;
  const i = line.text.toLowerCase().indexOf(phrase.toLowerCase());
  return i < 0 ? 0 : (i / line.text.length) * lineSeconds(line);
}
