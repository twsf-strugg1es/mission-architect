// The voiceover, word for word from the brief (Step 3). Video A is split only at sentence ends, so each
// line can be re-read on its own and placed over its own footage. No imports: node can read this file too.
export type TeamInfo = { team: string; members: string[] };

const names = (m: string[]) => (m.length < 2 ? m.join("") : `${m.slice(0, -1).join(", ")} and ${m[m.length - 1]}`);

export const scriptA = ({ team, members }: TeamInfo): Record<string, string> => ({
  title: `We are team ${team}: ${names(members)}. Our project is Mission Architect, built for the Space Mission Design Game challenge.`,
  problem:
    "Real space missions take years and huge teams to design, so students never get to feel how mission design actually works — how one choice about fuel, power or money decides whether a mission lives or dies.",
  solution: "Mission Architect turns that into a game anyone can play in a browser.",
  build: "You pick a destination — the Moon, Mars, or asteroid Bennu — choose a real rocket and engine, and build your spacecraft part by part.",
  equation: "A real rocket equation checks your delta-v live.",
  blocked: "Too heavy, no power, not enough fuel — the game will not let you launch, and it tells you why in plain language.",
  flight: "In flight, real dangers strike: solar flares, dust storms, equipment failures. Whether you survive depends on what you built.",
  results: "Every mission ends with a grade and a debrief that explains your own decisions.",
  anywhere: "It runs in any browser, on a phone or a computer, by mouse or keyboard.",
  nasa: "Our game runs on real NASA data: the NASA Open Science Data Repository, including radiation data; NASA Planetary Fact Sheets for distance, gravity and delta-v; the NASA JPL Small-Body Database for asteroid Bennu; and NASA DONKI space-weather data behind our solar flare events.",
  close: "Mission Architect — design it, build it, fly it. Play it live — the link is on our project page.",
});

export const scriptB = ({ team }: TeamInfo): Record<string, string> => ({
  all: `We are team ${team}. Mission Architect: a browser game where you design a real space mission — pick the Moon, Mars or Bennu, build your spacecraft under a real rocket equation, survive real events, and get graded on your decisions. Built on NASA data: OSDR, Planetary Fact Sheets, JPL Small-Body Database and DONKI. Play it live — link on our project page.`,
});
