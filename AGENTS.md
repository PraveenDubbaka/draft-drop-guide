
- Client connections made in-app are stored as localStorage overrides in `src/lib/clientSource.ts` (`connectClientSource`) and read before seed data — so Edit Engagement detects new connections without a backend.
- Create/Edit Engagement and Clients share SourceConnectionModal and provider metadata so the prototype selection, loading, confirmation and persistence remain consistent without real OAuth.
- The demo seed ( in ) must not overwrite a user-saved /// on reload — it only applies defaults when the user never saved one, so per-year Data Source selections in Edit Engagement persist.
