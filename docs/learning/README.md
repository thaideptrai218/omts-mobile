# OMTS Mobile learning and defense notes

This directory records concepts learned while building the real OMTS Mobile repository. Each lesson connects the problem being solved to code, runtime behavior, and verification evidence.

## Required lesson structure

1. Problem and context.
2. Concept explained from first principles.
3. Where it appears in OMTS code.
4. Data/control flow.
5. Error cases and diagnosis when applicable.
6. Verification evidence.
7. Likely defense questions with concise answers.

Do not record a Jira item as complete until its done criteria and quality checks are satisfied.

## Lessons

| Lesson | Topic | Status |
| --- | --- | --- |
| [01](01-official-mobile-foundation.md) | Official repository, Expo foundation, routing, environment, and current gaps | In progress |
| [10](10-requested-frontend-structure.md) | Frontend structure requested by the user, Zalo entry, import updates and verification | Verified locally |
| [11](11-model-separation.md) | Feature models, shared types, API DTO separation and runtime comparison | Verified locally |
| [12](12-purchase-staffing.md) | Employee shift approval and capacity before Owner accepts cage orders | Tested; dev API process update blocked |
| [13](13-pr-integration.md) | Develop integration, legacy error codes and backend schema conflict | Mobile verified; backend PR remains draft |
| [16](16-zone-boundary-from-license-map.md) | Zone boundary read from the licensed sea-area map: VN-2000 to WGS84, table OCR, rafts outside the boundary | Verified with synthetic tables; not yet on a real phone photo |
| [17](17-mobile-layout-review.md) | Layout review of the whole app at phone width: numbers broken mid-digit, squeezed sheet lists, stuck cards, footers, dark mode | Verified in headless Chrome at 360 and 320 px |
| [18](18-error-boundary-and-status-bar.md) | Error boundary per screen instead of a blank app, and the real Android status bar height via configAppView | Verified in headless Chrome; status bar not yet on a phone |
