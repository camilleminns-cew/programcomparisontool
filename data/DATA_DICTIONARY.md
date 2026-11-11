# Data dictionary

The website reads two files in this folder. They are the only things your team needs to edit to keep the site current.

- `programs.csv` has one row per program (or proposal).
- `states.csv` has one row per state tile on the map.

Values in **bold code** are the only ones the site accepts. The automatic check (see the README) will flag anything else.

---

## programs.csv

| Column | What goes here | Allowed values |
|---|---|---|
| `id` | A short, permanent ID. Lowercase letters, numbers and hyphens. Never change it once published: comparison links use it. | e.g. `mo-evergy` |
| `publish` | Show this row on the website? Use `no` to keep a row in the file while you research it. | **`yes`**, **`no`** |
| `program_name` | Public program name. Use "Program name to confirm" if unknown. | text |
| `utility` | Utility or administrator name. | text |
| `state` | Two-letter state code. Must exist in `states.csv`. | e.g. `MO` |
| `utility_type` | Ownership type. `other` is for statewide efficiency utilities like Efficiency Vermont. | **`iou`**, **`coop`**, **`muni`**, **`other`** |
| `status` | Current program status. | **`active`**, **`ended`**, **`in_development`** |
| `year_started` | Four-digit year, or blank. | e.g. `2021` |
| `year_ended` | Four-digit year, or blank if still running or unknown. | e.g. `2024` |
| `model` | How the program compares to PAYS®. | **`pays`** (PAYS®-modeled), **`modified`** (on-bill financing, loan or other variation), **`under_review`** |
| `model_confirmed` | Has the team signed off on `model`? While `no`, the site labels the model "provisional." | **`yes`**, **`no`** |
| `docket_or_authority` | Docket number, case number, statute or board approval. Include the agency so readers know where to look (e.g. "MO PSC EO-2019-0132"). | text |
| `check_utility_pays_upfront` | The utility funds the upgrade. No upfront cost to the customer. | **`yes`**, **`no`**, **`partial`**, **`unknown`** |
| `check_charge_tied_to_meter` | Cost recovery is a charge on the meter, not a loan to the person. | same |
| `check_no_credit_check` | No credit check or income-based underwriting. | same |
| `check_savings_exceed_charge` | Estimated savings must exceed the monthly charge. | same |
| `check_transfers_with_meter` | The charge stays with the meter when the occupant changes. | same |
| `check_open_to_renters` | Renters can participate (with owner consent). | same |
| `doc_directive` | The law, order or directive behind the program. | a link starting with `https://`, or **`on_file`**, **`unavailable`**, **`confidential`**, **`does_not_exist`**, **`proposed`**, or blank |
| `doc_regulatory_approval` | Commission or board approval order. | same |
| `doc_tariff` | Approved tariff. | same |
| `doc_terms_conditions` | Program terms and conditions. | same |
| `doc_participant_agreement` | Participant and/or landlord agreement. | same |
| `doc_notice` | Tenant notice or property-sale notice form. | same |
| `doc_evaluation` | Program evaluation (EM&V) report. | same |
| `public_note` | One or two sentences readers will see in the comparison table. Optional. | text |
| `internal_notes` | Research notes for your team. **The site never displays this column**, but anyone can still read it in a public repository. | text |
| `last_reviewed` | Date someone last checked this row. | `YYYY-MM-DD` |
| `reviewed_by` | Initials of the reviewer. | text |

### How documents show on the site

| You enter | Site shows |
|---|---|
| a link (`https://...`) | "View document" (opens the link) |
| `on_file` | On file (we have it, no public link) |
| `unavailable` | Unavailable |
| `confidential` | Confidential |
| `does_not_exist` | Does not exist |
| `proposed` | Proposed only |
| blank | Not on file |

### How the checklist drives the "modified" label

The site does **not** calculate `model` from the checklist. Your team sets `model` on purpose. A sensible rule: if any checklist item is `no`, the program is `modified`. If all six are `yes`, it is `pays`. Anything still `unknown` stays `under_review`. The automatic check will warn (not fail) if `model` is `pays` but a checklist item is `no`.

---

## states.csv

| Column | What goes here | Allowed values |
|---|---|---|
| `code` | Two-letter code. | e.g. `KS` |
| `name` | Full name. | text |
| `status` | Status from the CEW adoption map. | **`approved`**, **`adoption_proceedings`**, **`formal_due_diligence`**, **`informal`**, **`none`** |
| `grid_row` | Row of the tile on the map (1–8). Only change this to redesign the map layout. | number |
| `grid_col` | Column of the tile on the map (1–11). | number |
| `internal_notes` | Team notes. Not shown on the site. | text |

The "Last updated" date under the map is set in `assets/config.js`.
