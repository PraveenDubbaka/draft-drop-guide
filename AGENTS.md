
- Client connections made in-app are stored as localStorage overrides in `src/lib/clientSource.ts` (`connectClientSource`) and read before seed data — so Edit Engagement detects new connections without a backend.
- Create/Edit Engagement and Clients share SourceConnectionModal and provider metadata so the prototype selection, loading, confirmation and persistence remain consistent without real OAuth.
- The demo seed (`seedDemoEngagementMeta` in `src/store/engagementsStore.ts`) must not overwrite a user-saved `dataSource`/`sourceProvider`/`sourceYears`/`sourceRollForward` on reload — it only applies defaults when the user never saved one, so per-year Data Source selections in Edit Engagement persist.
- Trial Balance per-year data presence lives in `src/lib/tbYearData.ts`: a year shows data only if the engagement is seeded, the year is Source, or a per-year upload marker exists — so new CSV years start empty without a backend.
