import { fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AppearanceSelect } from "./appearance-select";
import { THEME_STORAGE_KEY } from "@/lib/theme/appearance";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.theme;
});

it("persists explicit appearance and follows OS changes only in system mode", () => {
  let listener: () => void = () => {};
  const media = {
    matches: false,
    addEventListener: vi.fn((_event, callback) => {
      listener = callback;
    }),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", () => media);
  const { unmount } = render(<AppearanceSelect />);
  expect(document.documentElement.dataset.theme).toBe("light");
  fireEvent.change(screen.getByLabelText("Appearance"), {
    target: { value: "dark" },
  });
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  expect(document.documentElement.dataset.theme).toBe("dark");
  act(() => listener());
  expect(document.documentElement.dataset.theme).toBe("dark");
  fireEvent.change(screen.getByLabelText("Appearance"), {
    target: { value: "system" },
  });
  expect(document.documentElement.dataset.theme).toBe("light");
  act(() => {
    media.matches = true;
    listener();
  });
  expect(document.documentElement.dataset.theme).toBe("dark");
  act(() =>
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: THEME_STORAGE_KEY,
        newValue: "light",
      }),
    ),
  );
  expect(screen.getByLabelText("Appearance")).toHaveValue("light");
  unmount();
  expect(media.removeEventListener).toHaveBeenCalled();
});

it("keeps theme switching available when storage is blocked", () => {
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const getter = vi
    .spyOn(Storage.prototype, "getItem")
    .mockImplementation(() => {
      throw new Error("blocked");
    });
  const setter = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("blocked");
    });
  render(<AppearanceSelect />);
  fireEvent.change(screen.getByLabelText("Appearance"), {
    target: { value: "light" },
  });
  expect(document.documentElement.dataset.theme).toBe("light");
  getter.mockRestore();
  setter.mockRestore();
});
