# Profile Identity Header Design

## Goal

Show the signed-in user’s actual avatar beside the Account action, avoid showing an unrelated email initial while profile data is loading, and make competitor input labels clear to a first-time user.

## User-facing behavior

- Competitor fields are labelled `Имя конкурента`, `Ссылка на профиль`, `Название услуги или предложение`, and `Цена, отзывы или кейсы`.
- “Название услуги или предложение” means the main service and promise shown by a competitor; “Цена, отзывы или кейсы” accepts a price, social proof, portfolio evidence, or measurable result.
- The header fetches the signed-in user’s `nickname` and `avatar_path` from `profiles` once per session.
- Before profile data resolves, the Account button uses a neutral loading circle, never an initial derived from the email.
- After loading, it renders the public avatar URL when present; otherwise it renders the nickname initial.
- Saving a nickname, uploading an avatar, or deleting an avatar in Account immediately refreshes the header without page reload.
- The currently stored nickname belongs only to that user’s profile. Every nickname remains protected by the existing unique database constraint.

## Architecture

Create a small profile-presentation helper responsible for converting a `profiles` row into `{ nickname, avatarUrl }`. `App` owns that state because the header and account panel need the same data. `AccountPanel` receives an optional `onProfileChanged` callback and calls it only after a successful profile/avatar mutation.

## Error handling

If the profile row or Storage URL cannot be read, the header leaves the neutral circle in place rather than deriving an initial from email. The account panel still retains its existing editable nickname and avatar fallback.

## Testing

- Unit-test profile presentation mapping for an avatar, nickname fallback, and unavailable data.
- Extend header tests to verify neutral loading state and real avatar rendering.
- Keep existing account form test green and add a callback assertion for successful account mutations if the Supabase dependency can be injected cleanly.
