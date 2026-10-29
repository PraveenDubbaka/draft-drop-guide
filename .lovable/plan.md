# Data Source message inventory (read-only — no code changes)

All messages below live in `src/pages/CreateEngagement.tsx` (page component `CreateEngagement`, used for both Create and Edit) unless noted. They sit inside the **Engagement Period** section card (the Data Source fields are now on the year rows there). None of these banners has a close (X) button; each one goes away only when its condition stops being true. The exceptions are the toast, which closes itself, and the connection window, which the user closes.

Short names used below:
- **Edit** = editing an existing engagement. **Saved** = the value when the edit page opened.
- **Client connected** = the client has an active accounting connection (client-level setting).
- **Partial Year** = Period Type is Partial Year (Data Source locked to CSV).
- **FYO** = Period Type is First Year of Operations (Prior Years show "No data").
- **Roll forward** = the saved engagement is a source roll forward (Prior Year rows locked).

## A. Status row (top of Engagement Period)

| # | Text | Style | Dismissible | Shows when |
|---|------|-------|-------------|------------|
| A1 | "Not Connected" pill + "Connect Source" link | Grey pill | No | Client not connected (Create and Edit) |
| A2 | Provider logo badge + "Connected" pill | Green pill | No | Client connected |

## B. Under each year row

| # | Text | Style | Dismissible | Shows when |
|---|------|-------|-------------|------------|
| B1 | "Auto-derived from Current Year dates" | Grey helper text | No | Full year, Prior Year 1 / Prior Year 2 rows |
| B2 | "No data for this period" | Grey helper text | No | FYO, Prior Year rows (FYO currently shows only Current Year) |
| B3 | "[Software] is disconnected for this year. Select a new data source from the Data Source dropdown." | Amber warning, triangle icon | No | Edit, that year was saved as Source and is unchanged, but its provider no longer matches the client's connection. Hidden if B9 or B8 shows, and on roll forward locked, FYO "No data" and Partial Year rows |
| B4 | Data Source dropdown text: "[Software] · Disconnected" | Grey dropdown text, not a banner | No | Same rule as B3 |
| B5 | Dropdown option: "Accounting software · Not connected" | Dropdown option | No | Client not connected and the year has no saved provider |
| B6 | Locked dropdown: "[Software] · Prior year" / CSV | Disabled dropdown | No | Roll forward, Prior Year rows |
| B7 | "Remove existing data" checkbox | Inline checkbox | User ticks it | Edit, year saved as Source and now set to CSV. Not on roll forward locked, FYO "No data" or Partial Year rows |

## C. Messages below the year rows

| # | Text | Style | Dismissible | Shows when |
|---|------|-------|-------------|------------|
| C1 | "Source connection not available for stub periods" | Grey info note, info icon | No | Partial Year. This replaces all of C2–C9 |
| C2 | "No source connection found for this client. Please go to the Clients page, click Connect under Integrations, and connect your accounting software. Then return here to continue." + "Connect Source" and "Go to Clients →" links | Red error, X-circle icon | No | Client not connected and (Source chosen, or a year row has an error), and not the C6 case. Applies to Create and Edit, including FYO |
| C3a | "All years are set to CSV. The source connection will remain active but won't be used for this engagement." | Amber warning | No | Client connected, every year is CSV, not a Source→CSV switch, and C8 not showing. Create and Edit |
| C3b | "Years set to Source will pull data from the connected source. Years set to CSV will use manually imported data." | Amber warning | No | Same as C3a, but with a mix of Source and CSV years |
| C4a | "Switching to CSV means this engagement will no longer pull data from [Software]. The source connection will stay active but won't be used." | Amber warning | No | Edit, saved as Source, client connected, user switched to CSV. Not roll forward |
| C4b | "Switching Current Year to CSV means it will no longer pull data from [Software]. Prior years stay locked to their original source." | Amber warning | No | Same as C4a, on a roll forward engagement |
| C5 | "Switching back to Source will replace your current CSV trial balance data. Years available from [Software] will be refreshed." | Amber warning | No | Edit, reconnect case: saved as CSV after an earlier disconnect, client connected again, Source chosen, active connection selected |
| C6 | "Your client has no active source connection. Connect a source, or set the affected years to CSV / Excel / PDF." + "Connect Source" link | Amber warning | No | Edit, saved as Source and still Source, client now not connected |
| C7 | "Your client's source connection has changed. Click Switch Connection to update this engagement to the new source." + "Switch Connection" button (outline) | Amber warning | No (the button moves the years to the new provider) | Edit, not roll forward, saved provider differs from the client's current provider, and at least one year is still on the old provider |
| C8 | "Switching to Source will replace your existing CSV trial balance data. Years selected for source will be refreshed." | Amber warning | No | Edit, client connected, at least one year changed from CSV to Source |

## D. Red blocker (its own card between Engagement Period and Assigned team)

| # | Text | Style | Dismissible | Shows when |
|---|------|-------|-------------|------------|
| D1 | Heading "Please read carefully — THIS ACTION CANNOT BE UNDONE"; list items "Adjusting entries will be deleted", "Manually added accounts will be deleted", "Issues, comments and requests will be deleted", "Documents will only move after data is imported"; "To remove the impact, choose a different option above."; field "Please type DELETE below to confirm your understanding *" | Red destructive box, red left bar, an icon on each line | No. It blocks Update Engagement until "DELETE" is typed | Edit, and any year's data source changed from its saved value, or Switch Connection was used to move to a different provider |

## E. Toasts (pop-ups at the top)

| # | Text | Style | Dismissible | Shows when |
|---|------|-------|-------------|------------|
| E1 | "Period type updated. Please review your engagement dates." | Blue info toast | Closes itself after 3s | Edit only, Period Type changed |
| E2 | "Engagement updated successfully." / "Engagement created successfully." / "Engagement created — IE checklist and predecessor letter added." | Green success toast | Closes itself | After saving |

## F. Client-level connection window (`src/components/SourceConnectionModal.tsx`, `SourceConnectionModal`; used on Clients, Create and Edit)

| # | Text | Style | Dismissible | Shows when |
|---|------|-------|-------------|------------|
| F1 | "Connecting to [Software]…" | Spinner | No (it moves on by itself) | After a provider button is clicked |
| F2 | "**Action Required:** For any CSV engagements created for this client, go to Edit Engagement and update the Data Source to start pulling data." | Amber warning (connection-warning colour) | Closes with the window | Connected screen |
| F3 | "**Action Required:** For any source connected engagements for this client, go to Edit Engagement and update the Data Source to continue managing your data." | Amber warning | Closes with the window | Right after "Disconnect from [Software]" is clicked (back on the provider list) |

## Notes
- **Roll forward:** C4b, B6 and D1 apply. C7 never shows. The old "Prior year rows are locked…" message was removed.
- **First Year of Operations:** Current Year can be Source or CSV, so C2, C3 and C8 can show. Prior Years show B2.
- **Partial Year:** only C1 shows. The year dropdowns are locked to CSV, and the earlier "Your client is connected to [Platform]…" Partial Year message is no longer in the code.
- **Also on the page but not about Data Source:** "Opening balance testing will be added to this engagement." (amber, appears when the first-year option is on).
