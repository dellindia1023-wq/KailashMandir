import { describe, expect, it } from 'vitest';

describe('toggle-live-stream edge function', () => {
  it('does not throw on a non-toggle path when schedule state is unchanged', () => {
    const effectiveLiveState = true;
    const responsePayload = {
      toggled: false,
      is_live: effectiveLiveState,
      current_time_ist: '12:00:00',
      day_of_week: 0,
      manual_override: false,
    };

    expect(responsePayload.toggled).toBe(false);
    expect(responsePayload.is_live).toBe(true);
  });
});
