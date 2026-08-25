/* The bits of the day-tab set that are not the component itself.

   Separate from app/shell/DayTabs.tsx only because a file that exports both a
   component and a helper loses fast refresh. */

export type TabbedDay = { label: string; date?: string };

/** The props a panel needs so the tab set above it describes it correctly. */
export function panelProps(idPrefix: string, active: number, count: number) {
  if (count < 2) return {};
  return {
    role: "tabpanel",
    id: `${idPrefix}-panel-${active}`,
    "aria-labelledby": `${idPrefix}-tab-${active}`,
  } as const;
}
