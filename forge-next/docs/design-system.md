# Forge design system

Forge is a quiet workspace: warm mineral surfaces in light mode, green-tinted graphite in dark mode, restrained accents, and precise typography. Give the work room to breathe.

## Local workshop

```sh
cd forge-next
pnpm install --frozen-lockfile
pnpm storybook
```

Open http://localhost:6006 and start at **Design System / Overview**. The toolbar switches every story between Light, Dark, and System. UI stories expose component variants, disabled states, and interactions. Use responsive viewports in your browser to review small screens.

```sh
pnpm build-storybook       # static workshop in storybook-static/
pnpm test                 # unit and interaction tests
pnpm test:storybook       # browser story tests (requires Playwright Chromium)
```

## Foundations

- `app/globals.css` owns both palettes, semantic colors, glass materials, radii, animation, and reduced-motion/transparency behavior.
- `lib/theme/tokens.ts` owns shared typography and radius class names.
- `lib/theme/surfaces.ts` composes controls, cards, lists, tabs, dialogs, menus, feedback, and chat surfaces.
- `components/ui/` is the reusable component library. Both coach and athlete experiences consume it.

Use `surface-foreground` for readable ink, `surface-muted` for secondary copy, and `surface-divider` for separation. Use success, warning, and danger tokens for status; always accompany color with a label or icon. Coach and athlete accents should be subtle, not large background washes. Never hardcode white ink or a dark canvas.

## Material & hierarchy

Glass combines a translucent fill, thin refractive border, inset highlight, and backdrop blur/saturation. Use it for controls, floating chrome, cards, menus, and dialogs. Content-heavy tables and nested sections use quieter surfaces. Avoid stacking many blurred layers. The canvas and sidebar use separate materials to establish depth without decoration.

The scale uses a four-point rhythm: 4, 8, 12, 16, 24, 32, 48. Page titles use medium weight and tight tracking. Body copy stays regular. Controls have a 14px radius; cards have a 20px radius. Primary actions use solid mineral ink in light mode and pale sage in dark mode. Secondary actions remain transparent.

## Appearance & accessibility

The app defaults to the OS appearance. The sidebar and sign-in screen offer System / Light / Dark. Explicit preferences persist under `forge.appearance.v1`, synchronize across tabs, and are applied before first paint. System mode responds to OS changes. All theme tokens live on the document root so portaled dialogs inherit the same palette. The `.dark` utility variant follows the resolved document theme.

Keep native semantics and accessible labels. Keyboard focus uses a visible semantic ring in both modes. Motion respects reduced-motion; glass has an opaque fallback when backdrop filters are unavailable or reduced transparency is requested. Inputs and native selects use the active color scheme. Test both themes whenever adding UI.
