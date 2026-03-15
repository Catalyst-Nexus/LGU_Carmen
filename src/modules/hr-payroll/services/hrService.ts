/**
 * hrService.ts — barrel re-export
 *
 * All HR service functions and types are defined in focused sub-modules.
 * Everything is re-exported from here so existing consumers need no changes.
 *
 * Sub-modules:
 *   hrReferenceService   — offices, positions, salary schedule, plantilla CRUD
 *   hrPersonnelService   — employee CRUD, service records (CSC Form 241), profile queries
 *   hrLeaveService       — leave subtypes, credits, applications, date deductions
 *   hrTimekeepingService — time slot schedules, DTR records
 *   hrPayrollService     — deduction types, payroll periods, pay slips, remittance
 */

export * from "./hrReferenceService";
export * from "./hrPersonnelService";
export * from "./hrLeaveService";
export * from "./hrTimekeepingService";
export * from "./hrPayrollService";
