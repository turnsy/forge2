/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMeasuredHeight } from "@/lib/hooks/use-measured-height";

describe("useMeasuredHeight", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tracks element height from ResizeObserver updates", () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    let resizeCallback: ResizeObserverCallback = () => undefined;

    class ResizeObserverMock {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }

      observe = observe;
      disconnect = disconnect;
    }

    vi.stubGlobal("ResizeObserver", ResizeObserverMock);

    const node = document.createElement("div");
    vi.spyOn(node, "getBoundingClientRect").mockReturnValue({
      height: 120,
      width: 0,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 120,
      toJSON: () => ({}),
    });

    const { result } = renderHook(() => {
      const measured = useMeasuredHeight<HTMLDivElement>();
      measured.ref.current = node;
      return measured;
    });

    resizeCallback([], {} as ResizeObserver);
    expect(result.current.height).toBe(120);
    expect(observe).toHaveBeenCalledWith(node);
  });
});
