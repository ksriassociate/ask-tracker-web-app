export const ROLES = {
  principal_admin: "Principal Admin",
  partner: "Partner",
  manager: "Practice Manager",
  associate: "Associate",
  accounts: "Accounts",
  read_only: "Read only",
};

const permissions = {
  principal_admin: ["*"],
  partner: ["dashboard.view", "companies.view", "companies.edit", "pipeline.view", "pipeline.update", "router.view", "router.route", "litigation.view", "litigation.draft", "nclt.view", "tax.view", "tax.edit", "billing.view", "billing.edit", "reminders.view", "documents.view"],
  manager: ["dashboard.view", "companies.view", "companies.edit", "pipeline.view", "pipeline.update", "router.view", "router.route", "litigation.view", "litigation.draft", "nclt.view", "tax.view", "tax.edit", "reminders.view", "documents.view"],
  associate: ["dashboard.view", "companies.view", "pipeline.view", "pipeline.update", "litigation.view", "litigation.draft", "nclt.view", "tax.view", "reminders.view", "documents.view"],
  accounts: ["dashboard.view", "companies.view", "billing.view", "billing.edit", "reminders.view", "documents.view"],
  read_only: ["dashboard.view", "companies.view", "pipeline.view", "litigation.view", "nclt.view", "tax.view", "billing.view", "reminders.view", "documents.view"],
};

export function can(role, permission) { return permissions[role]?.includes("*") || permissions[role]?.includes(permission); }
export function canViewPage(role, page) { return can(role, `${page}.view`); }
