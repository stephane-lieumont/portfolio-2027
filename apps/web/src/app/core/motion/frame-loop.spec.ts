import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FrameLoop } from './frame-loop';

describe('FrameLoop', () => {
  let frames: Map<number, FrameRequestCallback>;
  let next: number;
  let visibility: DocumentVisibilityState;

  /** Runs the frame the browser would paint next, at `time`. */
  function paint(time: number): void {
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback(time);
  }

  beforeEach(() => {
    frames = new Map();
    next = 0;
    visibility = 'visible';
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.set(++next, callback);
      return next;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((handle) => frames.delete(handle));
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  afterEach(() => vi.restoreAllMocks());

  it('does not run while nobody listens', () => {
    const loop = TestBed.inject(FrameLoop);
    expect(loop.running).toBe(false);
    expect(frames.size).toBe(0);
  });

  it('runs one loop for every listener, and stops with the last one', () => {
    const loop = TestBed.inject(FrameLoop);
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = loop.add(first);
    const stopSecond = loop.add(second);

    expect(frames.size).toBe(1);
    paint(1000);
    paint(1016);
    expect(first).toHaveBeenLastCalledWith(1016, 16);
    expect(second).toHaveBeenCalledTimes(2);

    stopFirst();
    expect(loop.running).toBe(true);
    stopSecond();
    expect(loop.running).toBe(false);
    expect(frames.size).toBe(0);
  });

  it('caps the step after a stall instead of teleporting everything', () => {
    const loop = TestBed.inject(FrameLoop);
    const callback = vi.fn();
    loop.add(callback);

    paint(1000);
    paint(3000);
    expect(callback).toHaveBeenLastCalledWith(3000, 64);
  });

  it('stops while the tab is hidden and resumes without a jump', () => {
    const loop = TestBed.inject(FrameLoop);
    const callback = vi.fn();
    loop.add(callback);
    paint(1000);

    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(loop.running).toBe(false);

    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(loop.running).toBe(true);
    paint(90_000);
    expect(callback).toHaveBeenLastCalledWith(90_000, 0);
  });
});
