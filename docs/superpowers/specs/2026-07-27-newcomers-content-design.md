# ClientLens Newcomers Content Design

## Goal

Add a public "Новичкам" section to ClientLens for freelancers who are starting with few or no orders. The section should make the product feel more useful before payment, improve trust, and give practical guidance that naturally leads users back to profile analysis.

## Scope

The first version is a static in-app knowledge section. It does not include CMS, admin editing, comments, search, categories, or email collection.

## Navigation

Add a top navigation item named "Новичкам" next to the existing main product tabs. It must be available to both anonymous and authenticated users.

The route/view id is `newcomers`. The page should be saved as a valid app view so refreshes do not throw users back into the wrong section.

## Page Structure

The page contains five beginner-focused guide cards:

- "Почему у новичка нет заказов"
- "Как оформить профиль, если нет отзывов"
- "Что писать в описании, чтобы не выглядеть новичком"
- "5 ошибок в услугах, которые отпугивают клиентов"
- "Как заказчик выбирает исполнителя без отзывов"

Clicking a card opens the selected guide on the same page. The guide content should include:

- a short explanation of the problem;
- concrete fixes;
- one "Плохо / Лучше" example where it fits;
- a short checklist;
- a call to action back to "Новый анализ".

## UX

The section should feel like a practical product resource, not a marketing blog. The copy must be calm, specific, and written in Russian. Avoid promising guaranteed orders.

On mobile, cards should become a single column and the guide content must remain readable without horizontal scrolling.

## Technical Design

Create a small data module for guide content, for example `src/data/newcomer-guides.ts`.

Create a page component, for example `src/components/NewcomersPage.tsx`, that receives an `onAnalyze` callback for returning to the analysis form.

Update:

- app view union and routing in `src/App.tsx`;
- header view type and navigation links in `src/components/AppHeader.tsx`;
- persisted views in `src/storage/view-store.ts`;
- styles in `src/styles.css`;
- tests for navigation and rendering.

## Error Handling

No remote requests are needed for this section. If no guide is selected, the page should select the first guide by default.

## Testing

Add or update tests to verify:

- the "Новичкам" navigation item is rendered;
- clicking it opens the newcomers page;
- a guide can be selected;
- the page has a working button back to "Новый анализ".

