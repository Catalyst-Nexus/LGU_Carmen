-- =============================================================================
-- Register Procurement Dashboard and Delivery Receipt Modules
-- =============================================================================

-- Insert Procurement Dashboard module
INSERT INTO modules (module_name, route_path, file_path, category, icons, is_active)
VALUES
  ('Procurement Dashboard', '/gse-bac/procurement-dashboard', 'modules/gse&bac/pages/ProcurementDashboard', 'GSE & BAC', 'LayoutDashboard', true)
ON CONFLICT (route_path) DO UPDATE
  SET module_name = EXCLUDED.module_name,
      file_path   = EXCLUDED.file_path,
      category    = EXCLUDED.category,
      icons       = EXCLUDED.icons,
      is_active   = EXCLUDED.is_active;

-- Insert Delivery Receipt module
INSERT INTO modules (module_name, route_path, file_path, category, icons, is_active)
VALUES
  ('Delivery Receipt', '/gse-bac/delivery-receipt', 'modules/gse&bac/pages/DeliveryReceipt', 'GSE & BAC', 'Truck', true)
ON CONFLICT (route_path) DO UPDATE
  SET module_name = EXCLUDED.module_name,
      file_path   = EXCLUDED.file_path,
      category    = EXCLUDED.category,
      icons       = EXCLUDED.icons,
      is_active   = EXCLUDED.is_active;

-- Insert PR Entry module (if not exists)
INSERT INTO modules (module_name, route_path, file_path, category, icons, is_active)
VALUES
  ('PR Entry', '/gse-bac/pr-entry', 'modules/gse&bac/pages/PurchaseRequestEntry', 'GSE & BAC', 'FilePlus', true)
ON CONFLICT (route_path) DO UPDATE
  SET module_name = EXCLUDED.module_name,
      file_path   = EXCLUDED.file_path,
      category    = EXCLUDED.category,
      icons       = EXCLUDED.icons,
      is_active   = EXCLUDED.is_active;

-- Insert PR Approval module (if not exists)
INSERT INTO modules (module_name, route_path, file_path, category, icons, is_active)
VALUES
  ('PR Approval', '/gse-bac/pr-approval', 'modules/gse&bac/pages/PurchaseRequestApproval', 'GSE & BAC', 'FileCheck', true)
ON CONFLICT (route_path) DO UPDATE
  SET module_name = EXCLUDED.module_name,
      file_path   = EXCLUDED.file_path,
      category    = EXCLUDED.category,
      icons       = EXCLUDED.icons,
      is_active   = EXCLUDED.is_active;

-- Insert Abstract of Bids module (if not exists)
INSERT INTO modules (module_name, route_path, file_path, category, icons, is_active)
VALUES
  ('Abstract of Bids', '/gse-bac/abstract-of-bids', 'modules/gse&bac/pages/AbstractOfBids', 'GSE & BAC', 'ClipboardList', true)
ON CONFLICT (route_path) DO UPDATE
  SET module_name = EXCLUDED.module_name,
      file_path   = EXCLUDED.file_path,
      category    = EXCLUDED.category,
      icons       = EXCLUDED.icons,
      is_active   = EXCLUDED.is_active;

-- Insert Purchase Order module (if not exists)
INSERT INTO modules (module_name, route_path, file_path, category, icons, is_active)
VALUES
  ('Purchase Order', '/gse-bac/purchase-order', 'modules/gse&bac/pages/PurchaseOrder', 'GSE & BAC', 'ShoppingCart', true)
ON CONFLICT (route_path) DO UPDATE
  SET module_name = EXCLUDED.module_name,
      file_path   = EXCLUDED.file_path,
      category    = EXCLUDED.category,
      icons       = EXCLUDED.icons,
      is_active   = EXCLUDED.is_active;

-- =============================================================================
-- Grant access to default admin role (if using role-based access)
-- =============================================================================

-- If you have a role_modules table, you may need to grant access like this:
-- INSERT INTO role_modules (role_id, module_id)
-- SELECT r.role_id, m.module_id
-- FROM roles r, modules m
-- WHERE r.role_name = 'Administrator'
--   AND m.route_path IN (
--     '/gse-bac/procurement-dashboard',
--     '/gse-bac/delivery-receipt',
--     '/gse-bac/pr-entry',
--     '/gse-bac/pr-approval',
--     '/gse-bac/abstract-of-bids',
--     '/gse-bac/purchase-order'
--   )
-- ON CONFLICT DO NOTHING;
