// src/utils/dbMapper.js
export const mapDbToUi = (dbRecord) => ({
  id: dbRecord.id,
  name: dbRecord.name || dbRecord.company_name, // Fallback for your existing V1 data
  cin: dbRecord.cin,
  group: dbRecord.parent_group, // UI 'group' matches DB 'parent_group'
  status: dbRecord.status,
  // These calculated fields prevent database bloat
  pendingTasks: dbRecord.pending_tasks_count || 0,
  nextHearing: dbRecord.next_hearing_date || "—"
});