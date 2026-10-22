# OMTS-155 — M6.1b registration method selector

## Outcome

The registration form now has an accessible, touch-friendly Email/Phone selector. It reports an explicit `RegistrationMethod`, preserves selection as controlled state and locks both choices while the parent flow is pending.

## Accessibility review finding

The first test expected a queryable `radiogroup` on a plain `View`. RNTL correctly did not expose that parent as an accessibility element. Marking the parent `accessible` would risk merging/hiding the focusable radio children on native platforms. The ineffective group role was removed; the visible “Đăng ký bằng” label remains and both choices expose native `radio` role plus checked/disabled state.

Expo lint also rejected `ReadonlyArray<T>` under the repository's array-style rule. The declaration was changed to `readonly T[]` without altering runtime behavior.

## Verification evidence

Three tests cover selected state, explicit phone selection and pending lock. Targeted Jest, strict TypeScript, Expo lint and whitespace checks passed.

## Still open

Device screen-reader order and large-text wrapping must be checked when the selector is integrated into SCR-01.
