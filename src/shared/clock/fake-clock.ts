import { Clock } from './clock';

// Test clock: starts at a fixed instant and only moves when advanced, so
// time-dependent behavior is verified instantly and deterministically.
export class FakeClock implements Clock {
  private current: Date;

  constructor(start: Date = new Date('2026-01-01T00:00:00.000Z')) {
    this.current = start;
  }

  now(): Date {
    return this.current;
  }

  advance(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}
