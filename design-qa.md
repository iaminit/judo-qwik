# Design QA — 三段の道 (Sandan no Dō)

## Artifacts and state

- Latest source visual: `/Users/roberto/Desktop/Screenshot 2026-08-05 alle 16.51.13.png`
- Supplied logo: `/Users/roberto/Desktop/sandan-no-do.webp`
- Local implementation capture: `/tmp/sandan-state-cards-final.png`
- Logo entrance capture: `/tmp/sandan-logo-mid-final.png`
- Combined comparison: `/tmp/sandan-design-qa-comparison-final.png`
- Browser viewport: `375 × 812` rendered pixels, mobile light theme
- Compared state: Fondamenta expanded, first three-question activity evaluated

## Final visual review

The activity row now keeps the content card on the left and the three 48 px
evaluation states on the right. The controls contain only the green check,
neutral dot, and red cross. The earned/available score appears once beneath
the stack.

The former vertical result stripe has been removed. Each complete activity is
now a rounded container with 5 px inner padding. Its full background and border
communicate the result:

- green for a fully correct quiz;
- orange for an incomplete or partially correct quiz;
- red for a completed quiz with no correct answers.

The quiz trigger has a distinct tinted surface, border, hover/focus treatment,
and the direct label “Apri quiz”, so the interactive area is evident without
depending on the result controls.

The supplied Sandan logo is identical to the file already present in
`public/media/sandan-no-do.webp`. It receives a one-second entrance animation
with opacity, scale, small rotation, and a restrained settle. Reduced-motion
preferences disable the animation.

## Interaction verification

- Opened Fondamenta and verified all six database-backed quiz triggers.
- Opened “Organizzazione federale”; the modal rendered three questions with
  four selectable answers each.
- Closed the quiz modal successfully.
- Previously verified automatic close after the third answer and immediate
  score refresh.
- Confirmed the compact score/timeline bar remains sticky below the 72 px
  mobile header.
- Checked the browser console after the final layout and modal interaction:
  no errors or warnings.

## Technical verification

- `npm run build.types`: passed.
- `npm run build`: passed (client, server, SSG, copy).
- `git diff --check`: passed.
- `npm run lint`: unavailable because the repository ESLint configuration
  references the missing plugin rule `preserve-caught-error`; this is an
  existing toolchain configuration issue, not a page error.

## Comparison history

### Pass 1

- P2: evaluation controls were horizontal and contained per-state numbers.
- Fix: stacked the three controls on the right, removed their numeric content,
  and moved the total score below the stack.

### Pass 2

- P2: the result was communicated by a vertical colored stripe with almost no
  outer padding.
- Fix: removed the stripe, added 5 px container padding, and applied the result
  color to the entire activity container.

### Final pass

- No actionable P0/P1/P2 visual findings remain.
- P3: local screenshots contain the development-only Click-to-Source overlay;
  it is absent from the production build.

final result: passed
