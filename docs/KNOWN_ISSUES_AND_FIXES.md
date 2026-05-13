# Ghxsty Music - Known Issues and Fix Patterns

## 1) Large list lag / high memory during scroll
- Pattern:
  - Too many per-row computations and frequent state updates.
- Fix direction:
  - Memoize lookup maps (`id -> track`), reduce O(n²) scans.
  - Batch/debounce persistence writes.
  - Use incremental rendering/virtualization for very large lists.

## 2) Pinned tracks disappearing after restart
- Pattern:
  - Cleanup effect ran before track hydration completed.
- Fix direction:
  - Gate cleanup logic with `isHydrated` and non-empty data.

## 3) Dependency appears missing until app restart
- Pattern:
  - Process env/PATH snapshot stale after external install.
- Fix direction:
  - Show explicit “Restart app” CTA after manual dependency install.
  - Re-check dependencies on each app launch.

## 4) AV false positive risk
- Pattern:
  - Runtime binary download/execute flows and unsigned installers.
- Fix direction:
  - Manual dependency model (no runtime installer).
  - Prefer code signing.
  - Submit false positive samples to Defender portal when needed.

## 5) Update UX confusion
- Pattern:
  - No clear two-step update action.
- Fix direction:
  - Distinct actions: `Check` -> `Download` -> `Restart & install`.
