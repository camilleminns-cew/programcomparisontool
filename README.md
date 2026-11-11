# Inclusive Utility Investment Program Map

An interactive map and comparison tool for inclusive utility investment (IUI) programs, covering PAYS®-modeled programs and modified on-bill variations. Built for the Clean Energy Works website.

**The short version:** the program information lives in two spreadsheet files in this repository. Your team edits those files. The website reads them every time someone visits. There is no server, database or login system to maintain.

---

## How it works

```
  Policy team                     GitHub (this repository)                 Website visitors
  ───────────                     ────────────────────────                 ────────────────
  edits data/programs.csv  ──►    automatic check runs        ──►         GitHub Pages serves
  (in GitHub or a spreadsheet)    (catches typos, bad values)             the site and reads the
                                                                           latest CSV files
```

| Piece | What it is | Who touches it |
|---|---|---|
| `data/programs.csv` | One row per program. **This is the backend.** | Policy team |
| `data/states.csv` | One row per state: map status and tile position. | Policy team |
| `data/DATA_DICTIONARY.md` | What every column means and which values are allowed. | Read before editing |
| `assets/config.js` | A few site settings (map "last updated" date, default comparison). | Policy team, rarely |
| `index.html`, `assets/styles.css`, `assets/app.js` | The website itself. | Web developer / designer |
| `scripts/validate.py` + `.github/workflows/` | The automatic data check. | Nobody, unless the columns change |

---

## Important: what is public

Everything in the `data/` folder can be downloaded by anyone who visits the live site, **including the `internal_notes` column**. That's true even if the repository is private, because the website needs to read these files.

- Keep `internal_notes` to research reminders you'd be comfortable with a utility or regulator reading (e.g. "confirm end year").
- Keep sensitive notes, Drive links, contacts and strategy in your internal Google Sheet database, not here.
- Use `publish` = `no` to hide a row from the website while you research it. The row is still in the file, so the same rule applies.

---

## One-time setup (about 15 minutes, no coding)

1. **Create the repository.** On GitHub, click **New repository**. Name it something like `iui-program-map`. Choose **Public** (needed for free GitHub Pages; see "What is public" above).
2. **Upload the files.** On the new repository page, click **uploading an existing file**. Drag in everything from this folder, **including the hidden `.github` folder and the `.nojekyll` file**. If your computer hides those, upload them separately: in the repository, click **Add file › Create new file**, type `.github/workflows/validate-data.yml` as the name, and paste the file's contents. Click **Commit changes**.
3. **Turn on the website.** Go to **Settings › Pages**. Under "Build and deployment," set **Source** to **Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
4. **Get the link.** After a minute or two, the Pages settings screen shows your site address, usually `https://<your-org>.github.io/iui-program-map/`.
5. **Confirm the data check is on.** Click the **Actions** tab. If GitHub asks, click to enable workflows.

---

## Editing the data

### Option 1: Small edits, right in GitHub (recommended)

1. Open `data/programs.csv` and click the **pencil icon** (Edit).
2. Change the values. Each line is one program, and commas separate the columns, in the order listed in the first line.
3. Click **Commit changes**. Choose **Create a new branch and start a pull request** if someone else should review it first (recommended for public-facing changes).
4. Within a minute, a check mark or a red X appears next to your change.
   - **Green check:** the data is valid. Once merged into `main`, the site updates within a few minutes.
   - **Red X:** click **Details** to see exactly which row and column to fix.

GitHub also shows CSV files as a searchable table when you're not editing, which is handy for reviewing.

### Option 2: Bigger edits in Excel or Google Sheets

1. Download `data/programs.csv` (click the file, then the download icon).
2. Open it in Excel or Google Sheets and make your edits. Don't rename, reorder or delete the column headers.
3. Save as CSV. In Excel, use **CSV UTF-8 (Comma delimited)**. Plain "CSV" can garble characters like ® and ʻ. In Google Sheets, use **File › Download › Comma-separated values**.
4. In GitHub, open the `data` folder, click **Add file › Upload files**, upload the file with the **exact same name** (`programs.csv`), and commit. It replaces the old one.
5. Check for the green check mark.

Watch out: Excel sometimes turns values like `2010-00089` into dates, or strips leading zeros. Spot-check docket numbers after saving.

### Option B: Run the data from a Google Sheet instead

If your team would rather keep everything in Google Sheets:

1. Make a Google Sheet with **exactly the same columns** as `programs.csv` (import the CSV to start).
2. **File › Share › Publish to web**, choose that tab, choose **Comma-separated values (.csv)**, and publish. Copy the link.
3. In `assets/config.js`, replace `"data/programs.csv"` with that link (keep the quotes).

Trade-offs: edits go live almost immediately with no review step, and **the automatic check does not run**, so a typo can break the page. The published sheet is also public. Option 1 or 2 is safer for a public website.

---

## Confirming a program's model (PAYS® vs. modified)

For each program the team reviews:

1. Fill in the six `check_...` columns with `yes`, `no`, `partial` or `unknown`.
2. Set `model`:
   - `pays`: all six checks are `yes`
   - `modified`: one or more checks is `no` (an on-bill loan, credit screening, charge tied to the person, etc.)
   - `under_review`: still unknown
3. Set `model_confirmed` to `yes`. This removes the "(provisional)" label for that program.
4. Fill in `last_reviewed` (e.g. `2026-11-20`) and `reviewed_by` (initials).
5. Add document links in the `doc_...` columns wherever a public URL exists. Those become "View document" links on the site.

The check warns you if a program marked `pays` has a checklist item set to `no`.

Once every program is confirmed, set `showProvisionalLabel` to `false` in `assets/config.js` if you want to hide the label entirely.

### Known open items in the starting data

These rows have `CONFLICT` in `internal_notes`, because the database spreadsheet and the 2026 adoption map disagreed. Status currently follows the map.

- Kentucky How$mart KY (6 co-ops): database says active; map shows ended.
- Eversource Smart$tart (NH): database says active; map shows ended.
- California Water Upgrades $ave: database says active; map shows ended.
- DTE (MI): database says "2023?"; map shows no program.
- Vermont (3 programs): database "ended" column says "2024?"; map shows active.
- Massachusetts: map shows a second active municipal program not in the database.

The check also lists every ended program that's missing a `year_ended`.

---

## Updating the state map

Edit `data/states.csv`. Change a state's `status` to one of `approved`, `adoption_proceedings`, `formal_due_diligence`, `informal` or `none`. Then update `mapLastUpdated` in `assets/config.js`.

Only change `grid_row` / `grid_col` if you're redesigning the map's tile layout.

---

## For the web developer / designer

- **No build step, no dependencies.** It's plain HTML, CSS and vanilla JavaScript. Brand colors are CSS variables at the top of `assets/styles.css`.
- **Data contract.** The site reads the columns documented in `data/DATA_DICTIONARY.md`. Rows where `publish` isn't `yes` are skipped. If you rebuild the front end in your CMS or framework, keep reading these two CSVs (or their URLs on GitHub Pages / raw.githubusercontent.com) so the policy team's workflow doesn't change.
- **Embedding.** The simplest path into the main CEW site is an `<iframe>` pointing at the GitHub Pages URL. You can also move the files into the main site and keep `programsCsv` pointed at the raw GitHub file.
- **Shareable comparisons.** The URL updates as programs are compared, e.g. `.../#compare=mo-evergy,ks-evergy,ga-georgia-power`. Program `id`s must stay stable for those links to keep working.
- **Accessibility built in.** Real buttons with `aria-pressed`, labelled state tiles, a skip link, 44px touch targets, visible focus rings and a captioned comparison table. Keep these if restyling.
- **Design reference.** A matching Figma-ready mockup exists on the CEW design canvas ("IUI Program Map & Comparison Tool").

### Previewing on your own computer

Opening `index.html` by double-clicking won't load the data (browsers block that). From this folder, run:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. To run the data check locally: `python3 scripts/validate.py`.

---

## File map

```
iui-program-map/
├── index.html                  page structure
├── assets/
│   ├── config.js               site settings (team-editable)
│   ├── app.js                  map, filters, comparison logic
│   └── styles.css              CEW brand styling
├── data/
│   ├── programs.csv            ← the program database
│   ├── states.csv              ← map status by state
│   └── DATA_DICTIONARY.md      column definitions
├── scripts/
│   └── validate.py             data check
├── .github/workflows/
│   └── validate-data.yml       runs the check on every change
└── .nojekyll                   tells GitHub Pages to serve files as-is
```

PAYS® is a registered trademark of the Energy Efficiency Institute, Inc.
