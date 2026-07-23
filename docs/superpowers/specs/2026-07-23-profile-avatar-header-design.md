# Profile Avatar Header Design

## Goal

Show a familiar account avatar in the top-right corner of the ClientLens profile card.

## Design

- The profile header uses a two-column layout: account title/email on the left and avatar on the right.
- Avatar is a 72px circular image when the user has uploaded an image.
- Before upload, a gradient circle shows the first uppercase character of the nickname; if no nickname exists, it shows `C`.
- On narrow screens, the layout remains in one row and the avatar is reduced rather than overlapping form fields.

## Data Flow

- Existing `avatar` state supplies the public image URL.
- Existing `nickname` state supplies the fallback character.
- No new storage, profile fields, or permissions are introduced.

## Validation

- The profile view renders with and without an uploaded avatar.
- Existing avatar upload restrictions remain unchanged.
