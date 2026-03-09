# Agent Best Practices (Project Architecture)

These rules are the default development guidelines for this repo. Follow them for all new features
and service updates unless explicitly overridden in a task.

## Performance & Data Access
- Parallelize independent data fetches in services (Promise.all); avoid sequential awaits when results
  do not depend on each other.
- Avoid full-collection scans. Always use limits, pagination, or scoped filters for list endpoints.
- Default list views to small pages (e.g., 10–25 items) with cursor-based pagination; only fetch
  detail data when a row/thread is opened.
- Prevent N+1 queries; denormalize or batch-fetch related data where possible.
- Defer or lazy-load heavy secondary data (e.g., analytics, external integrations) when it is not
  required for initial page render.
- Add caching/staleTime on client queries for stable reference data (meta lists, tags, users).

## Continuous Architecture Learning
- After architectural brainstorming, if a decision becomes a reliable thumb rule (e.g., auth patterns,
  UI structure standards, performance guardrails), record it here as a new standard instruction.

## Firestore Index Discipline
- Any query using multiple `where` clauses with `orderBy`, or range filters with `orderBy`, must have
  a composite index added to `firestore.indexes.json`.
- If a missing index error appears, do not add in-memory fallbacks unless explicitly approved; add
  the index instead.
- When adding a new query, verify required index coverage and update `firestore.indexes.json` in the
  same change.
  - At the end of the task, include a reminder to deploy Firestore indexes for the project.

## Service Design
- Keep service methods focused and composable; return only required fields.
- Prefer server-side filtering over client-side filtering when datasets are large.
- Add timeouts/guards for external API calls; never block core UX on third-party latency.

## Review Checklist (Required)
- Check for parallelization opportunities in new/updated services.
- Confirm no full-scan `.get()` calls were added for large collections.
- Confirm required composite indexes are present in `firestore.indexes.json`.

## Testing Task Log (Required)
- After implementing a new feature or completing a development task, add a testing entry to a
  separate file named `Testing task` that lists what needs testing, how to test it, and the use
  cases to cover. Keep this file updated for every change until the human testing agent removes
  completed items.
