-- =============================================================================
-- LGU-IMS Module Seed Data
-- Inserts HR & Payroll + System Admin module entries into the `modules` table
-- These entries enable dynamic sidebar navigation & route loading
-- =============================================================================

-- Ensure route_path is unique so ON CONFLICT works
CREATE UNIQUE INDEX IF NOT EXISTS modules_route_path_key ON public.modules (route_path);

-- ==========================
-- HR & PAYROLL MODULE
-- ==========================

INSERT INTO modules (module_name, route_path, file_path, category, icons, is_active)
VALUES
  ('HR Dashboard',          '/hr-payroll',             'modules/hr-payroll/pages/HRDashboard',        'HR & PAYROLL', 'Users',           true),
  ('Employee Masterlist',   '/hr-payroll/employees',   'modules/hr-payroll/pages/EmployeeMasterlist', 'HR & PAYROLL', 'UserCheck',       true),
  ('Plantilla Positions',   '/hr-payroll/plantilla',   'modules/hr-payroll/pages/PlantillaPositions', 'HR & PAYROLL', 'Briefcase',       true),
  ('Leave Management',      '/hr-payroll/leave',       'modules/hr-payroll/pages/LeaveManagement',    'HR & PAYROLL', 'CalendarOff',     true),
  ('Attendance & DTR',      '/hr-payroll/attendance',  'modules/hr-payroll/pages/AttendanceDTR',      'HR & PAYROLL', 'Clock',           true),
  ('Payroll Computation',   '/hr-payroll/payroll',     'modules/hr-payroll/pages/PayrollComputation', 'HR & PAYROLL', 'Calculator',      true),
  ('Payroll Register',      '/hr-payroll/register',    'modules/hr-payroll/pages/PayrollRegister',    'HR & PAYROLL', 'FileSpreadsheet', true),
  ('LDDAP Generator',       '/hr-payroll/lddap',       'modules/hr-payroll/pages/LDDAPGenerator',     'HR & PAYROLL', 'FileOutput',      true),
  ('Remittance Reports',    '/hr-payroll/remittance',  'modules/hr-payroll/pages/RemittanceReports',  'HR & PAYROLL', 'Send',            true),
  ('Time Clock',            '/hr-payroll/time-clock',  'modules/hr-payroll/pages/TimeClock',          'HR & PAYROLL', 'Camera',          true),
  ('Salary Schedule',       '/hr-payroll/salary-schedule', 'modules/hr-payroll/pages/SalarySchedule', 'HR & PAYROLL', 'DollarSign',      true)
ON CONFLICT (route_path) DO UPDATE
  SET module_name = EXCLUDED.module_name,
      file_path   = EXCLUDED.file_path,
      category    = EXCLUDED.category,
      icons       = EXCLUDED.icons,
      is_active   = EXCLUDED.is_active;

-- ==========================
-- ACCOUNTING MODULE
-- ==========================

INSERT INTO modules (module_name, route_path, file_path, category, icons, is_active)
VALUES
  ('Estimate Income',               '/accounting/estimate-income',              'modules/Accounting/pages/EstimateIncome',              'ACCOUNTING', 'BadgeDollarSign', true),
  ('General Accounting Plan',       '/accounting/general-accounting-plan',      'modules/Accounting/pages/GeneralAccountingPlan',       'ACCOUNTING', 'BookOpen',        true),
  ('Classification Appropriation',  '/accounting/classification-appropriation', 'modules/Accounting/pages/ClassificationAppropriation', 'ACCOUNTING', 'FolderTree',      true),
  ('Treasury',                      '/accounting/treasury',                     'modules/Accounting/pages/Treasury',                    'TREASURY',   'Coins',           true)
ON CONFLICT (route_path) DO UPDATE
  SET module_name = EXCLUDED.module_name,
      file_path   = EXCLUDED.file_path,
      category    = EXCLUDED.category,
      icons       = EXCLUDED.icons,
      is_active   = EXCLUDED.is_active;

-- ==========================
-- SYSTEM ADMIN MODULE
-- ==========================

INSERT INTO modules (module_name, route_path, file_path, category, icons, is_active)
VALUES
  ('User Activation',       '/admin/activation',   'modules/system-admin/pages/UserActivation',       'SYSTEM ADMIN', 'UserCheck',  true),
  ('Role Management',       '/admin/roles',        'modules/system-admin/pages/RoleManagement',       'SYSTEM ADMIN', 'Shield',     true),
  ('User Management',       '/admin/users',        'modules/system-admin/pages/UserManagement',       'SYSTEM ADMIN', 'Users',      true),
  ('Module Management',     '/admin/modules',      'modules/system-admin/pages/ModuleManagement',     'SYSTEM ADMIN', 'LayoutGrid', true),
  ('Facilities Management', '/admin/facilities',   'modules/system-admin/pages/FacilitiesManagement', 'SYSTEM ADMIN', 'Building',   true)
ON CONFLICT (route_path) DO UPDATE
  SET module_name = EXCLUDED.module_name,
      file_path   = EXCLUDED.file_path,
      category    = EXCLUDED.category,
      icons       = EXCLUDED.icons,
      is_active   = EXCLUDED.is_active;
