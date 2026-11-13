import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// The game's Rim "station" colourway (src/tokens.css) and its fonts, so every card looks like the game.
export const C = {
  paper: "oklch(19% 0.055 262)",
  paper2: "oklch(23% 0.055 262)",
  paper3: "oklch(15.5% 0.05 262)",
  ink: "oklch(95% 0.012 250)",
  ink2: "oklch(86% 0.016 250)",
  ink3: "oklch(74% 0.028 255)",
  rule: "oklch(32% 0.06 262)",
  signal: "oklch(84% 0.1 200)",
};
export const SANS = '"Geist", ui-sans-serif, system-ui, sans-serif';
export const MONO = '"Geist Mono", ui-monospace, monospace';

loadFont({ family: "Geist", url: staticFile("fonts/geist-latin-wght-normal.woff2"), weight: "100 900" });
loadFont({ family: "Geist Mono", url: staticFile("fonts/geist-mono-latin-wght-normal.woff2"), weight: "100 900" });
