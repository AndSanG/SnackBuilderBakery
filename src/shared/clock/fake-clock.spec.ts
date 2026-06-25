import { FakeClock } from './fake-clock';

describe('FakeClock', () => {
  it('returns its start time', () => {
    const start = new Date('2026-01-01T00:00:00.000Z');

    expect(new FakeClock(start).now()).toEqual(start);
  });

  it('moves time forward by the given minutes', () => {
    const clock = new FakeClock(new Date('2026-01-01T00:00:00.000Z'));

    clock.advance(5);

    expect(clock.now()).toEqual(new Date('2026-01-01T00:05:00.000Z'));
  });
});
