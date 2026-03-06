-- =============================================================================
-- LGU-IMS Module Seed Data
-- Inserts HR & Payroll + System Admin module entries into the `modules` table
-- These entries enable dynamic sidebar navigation & route loading
-- =============================================================================

-- ==========================
-- HR & PAYROLL MODULE
-- ==========================

INSERT INTO modules (module_name, route_path, file_path, category, icons, is_active)
VALUES
  ('HR Dashboard',          '/dashboard/hr-payroll',                  'modules/hr-payroll/pages/HRDashboard',          'HR & PAYROLL', 'Users',         true),
  ('Employee Masterlist',   '/dashboard/hr-payroll/employees',        'modules/hr-payroll/pages/EmployeeMasterlist',   'HR & PAYROLL', 'UserCheck',     true),
  ('Plantilla Positions',   '/dashboard/hr-payroll/plantilla',        'modules/hr-payroll/pages/PlantillaPositions',   'HR & PAYROLL', 'Briefcase',     true),
  ('Leave Management',      '/dashboard/hr-payroll/leave',            'modules/hr-payroll/pages/LeaveManagement',      'HR & PAYROLL', 'CalendarOff',   true),
  ('Attendance & DTR',      '/dashboard/hr-payroll/attendance',       'modules/hr-payroll/pages/AttendanceDTR',        'HR & PAYROLL', 'Clock',         true),
  ('Payroll Computation',   '/dashboard/hr-payroll/payroll',          'modules/hr-payroll/pages/PayrollComputation',   'HR & PAYROLL', 'Calculator',    true),
  ('Payroll Register',      '/dashboard/hr-payroll/register',         'modules/hr-payroll/pages/PayrollRegister',      'HR & PAYROLL', 'FileSpreadsheet', true),
  ('LDDAP Generator',       '/dashboard/hr-payroll/lddap',           'modules/hr-payroll/pages/LDDAPGenerator',       'HR & PAYROLL', 'FileOutput',    true),
  ('Remittance Reports',    '/dashboard/hr-payroll/remittance',       'modules/hr-payroll/pages/RemittanceReports',    'HR & PAYROLL', 'Send',          true);

-- ==========================
-- SYSTEM ADMIN MODULE
-- ==========================

INSERT INTO modules (module_name, route_path, file_path, category, icons, is_active)
VALUES
  ('User Activation',       '/dashboard/admin/activation',            'modules/system-admin/pages/UserActivation',         'SYSTEM ADMIN', 'UserCheck',     true),
  ('Role Management',       '/dashboard/admin/roles',                 'modules/system-admin/pages/RoleManagement',         'SYSTEM ADMIN', 'Shield',        true),
  ('User Management',       '/dashboard/admin/users',                 'modules/system-admin/pages/UserManagement',         'SYSTEM ADMIN', 'Users',         true),
  ('Module Management',     '/dashboard/admin/modules',               'modules/system-admin/pages/ModuleManagement',       'SYSTEM ADMIN', 'LayoutGrid',    true),
  ('Facilities Management', '/dashboard/admin/facilities',            'modules/system-admin/pages/FacilitiesManagement',   'SYSTEM ADMIN', 'Building',      true);
