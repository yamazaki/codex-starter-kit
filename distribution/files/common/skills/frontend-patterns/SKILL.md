---
name: frontend-patterns
description: Review or implement React and Next.js user interfaces when component boundaries, state, accessibility, forms, or rendering performance matter.
---

# Frontend patterns

- Follow the existing design system and component conventions before adding abstractions.
- Keep state as local as practical and distinguish server, URL, form, and ephemeral UI state.
- Preserve keyboard access, labels, focus behavior, semantic markup, and meaningful loading and error states.
- Avoid effects for values that can be derived during render; clean up subscriptions and async work.
- Measure before memoizing or virtualizing, and protect critical user journeys with appropriate tests.
- Validate the actual rendered behavior at relevant viewport sizes when UI behavior changes.
