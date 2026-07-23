# Account Settings and Profile Simplification Design

## Goal

Make the account area persistent, familiar and secure while fixing profile-save permissions.

## Navigation

- Save the latest app view in local storage.
- Restore it on page reload only when it is a valid view identifier.
- Default to `new` when no saved value exists.

## Profile

- Keep the circular avatar in the profile header.
- Clicking the avatar opens a hidden JPG/PNG/WebP file input.
- Remove the visible avatar file field and the payment-method placeholder from the profile view.

## Settings

- Move the payment-method placeholder to Settings; no card or banking fields are added.
- Add a password-change flow: current password, new password, confirmation, then an eight-digit email OTP.
- Verify the current password server-side through Supabase Auth before sending the OTP.
- Update the password only after a valid OTP; show generic errors without exposing account data.

## Database Fix

- Add a migration granting `authenticated` the required `select`, `insert`, and `update` access to `public.profiles` and owner-only RLS continues to restrict rows.
- Grant authenticated access to `public.audits` for the existing owner-only policies.

## Validation

- Test view persistence and code normalization.
- Run focused tests, full test suite, lint, and production build.
