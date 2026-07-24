# Mobile dashboard design

## Goal

Make ClientLens comfortable to use from a 320–390 px phone without horizontal scrolling or controls that are too small to tap.

## Rules

- Keep the existing dark ClientLens visual language and information hierarchy.
- At 760 px and below, navigation opens from a compact header menu.
- Guest users must retain both `Регистрация` and `Вход` actions on mobile.
- Forms, report cards, profile controls, and analysis grids become a single-column flow.
- Buttons remain at least 40 px high and long text may wrap rather than overflow.
- 761–900 px remains a tablet layout with selected two-column grids.

## Verification

Check 320, 375, 390, 768 and 1024 px viewport widths. Run unit tests, lint, and production build.
