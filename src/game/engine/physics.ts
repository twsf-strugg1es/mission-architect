/** Standard gravity, m/s². */
export const G0 = 9.80665

/**
 * The rocket equation: Δv = Isp × g0 × ln(m0 / mf), returned in km/s.
 * m0 = total mass with propellant, mf = m0 − propellant (both tonnes).
 */
export function computeDeltaV(engine: { ispSeconds: number }, totalMassTonnes: number, propellantTonnes: number): number {
  const mf = totalMassTonnes - propellantTonnes
  if (propellantTonnes <= 0 || mf <= 0) return 0
  return (engine.ispSeconds * G0 * Math.log(totalMassTonnes / mf)) / 1000
}

/** The same equation solved for propellant: tonnes needed to give `dryMassTonnes` a Δv of `deltaVKms`. */
export function propellantFor(ispSeconds: number, dryMassTonnes: number, deltaVKms: number): number {
  return dryMassTonnes * (Math.exp((deltaVKms * 1000) / (ispSeconds * G0)) - 1)
}
