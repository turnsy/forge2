import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

const originalFetch = globalThis.fetch;

function mockCoachExerciseFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Response | Promise<Response> {
  const url = typeof input === "string" ? input : input.toString();

  if (url.includes("/api/coach/exercises/search")) {
    return Promise.resolve(
      new Response(JSON.stringify({ exercises: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }

  if (url.includes("/api/coach/exercises/confirm")) {
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const name = typeof body.name === "string" ? body.name : "Confirmed Exercise";
    const exerciseId =
      typeof body.exerciseId === "string" ? body.exerciseId : "mock-exercise-id";

    return Promise.resolve(
      new Response(JSON.stringify({ exercise: { id: exerciseId, name } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }

  if (typeof originalFetch === "function") {
    return originalFetch(input, init);
  }

  return Promise.reject(new Error(`Unhandled fetch in tests: ${url}`));
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(mockCoachExerciseFetch));
});

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});