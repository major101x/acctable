export type DashboardState =
  | { tag: "no-lock" }
  | { tag: "locked-incomplete"; amtSol: number }
  | { tag: "locked-complete"; amtSol: number }
  | { tag: "submitting"; action: "lock" | "markComplete" | "unlock" };
