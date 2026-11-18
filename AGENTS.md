<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Tasks and goals are read/written from the browser with the generated client and protected by per-user RLS (`user_id = auth.uid()`); why: simple per-user data with no server logic needed.
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate, redirects to `/auth`); why: the session is stored in the browser.
- Due dates are plain `date` values compared as local `YYYY-MM-DD` strings via `src/lib/dates.ts`; why: avoids time-zone drift around "today/tomorrow/overdue".
- One-day edits of repeating tasks live in `task_overrides` (task_id + date → title/description) and are applied only in day views via `src/lib/overrides.ts`; why: the series row stays the source for every other day.
- The archive of past days is derived from tasks + task_completions + task_overrides in `src/lib/archive.ts` (no separate table); why: past data already lives there, so nothing has to be copied or moved.
- Unfinished one-off tasks past their date appear only in the archive, never in the 2-day plan or the task list; why: the user decided overdue tasks should leave the plan instead of piling up as "просрочено".
- The central task list ("Все"/"В работе") is derived day by day from today to one month ahead in `src/lib/upcoming.ts`, with repeating tasks expanded per day; why: mirrors the archive's per-day model so done-marks and one-day edits work the same way.
