export const CLOCK = Symbol('Clock');

// Ambient time, hidden behind a port so it can be controlled in tests.
export interface Clock {
  now(): Date;
}
