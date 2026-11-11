/*
  Site settings. Edit the values on the right of each colon.
  Keep the quotes and commas exactly as they are.
*/
window.IUI_CONFIG = {
  // Where the data lives. Leave these alone unless you move the files
  // or switch to a published Google Sheet (see README, "Option B").
  programsCsv: "data/programs.csv",
  statesCsv: "data/states.csv",

  // Date shown under the map. Update when the adoption map changes.
  mapLastUpdated: "9/25/26",

  // true = show "(provisional)" next to any model your team hasn't confirmed.
  // false = hide that label (for example, once everything is confirmed).
  showProvisionalLabel: true,

  // Programs pre-loaded in the comparison table when someone first visits.
  // Use program IDs from programs.csv, up to 3. Use [] for an empty table.
  defaultCompare: ["mo-evergy", "ks-evergy", "ga-georgia-power"]
};
