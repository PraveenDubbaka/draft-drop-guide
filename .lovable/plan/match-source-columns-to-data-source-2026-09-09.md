# Match Source columns to Data Source

## Changes
- Treat each engagement’s saved **Data Source** selection as the single source of truth.
- Show **CSV** when the selection is CSV or no saved selection exists, matching the form’s CSV default.
- Show the connected accounting-source icon only when the selection is explicitly Source.
- Apply the same resolver to both the Dashboard engagements table and the Engagements page.
- Verify an engagement can switch between CSV and Source and both tables reflect the saved choice.

## Technical details
- Tighten the shared engagement-source resolver so it does not infer Source from the client connection when engagement metadata is absent.
- Keep client connection lookup only for choosing which icon to render after an explicit Source selection.
