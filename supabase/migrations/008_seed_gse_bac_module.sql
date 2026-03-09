-- =============================================================================
-- GSE & BAC Module Seed Data
-- Inserts General Services Equipment & Bids and Awards Committee module
-- =============================================================================

INSERT INTO modules (module_name, route_path, file_path, category, icons, is_active)
VALUES
  ('Purchase Request', '/gse-bac/purchase-request', 'modules/gse&bac/pages/PurchaseRequest', 'GSE & BAC', 'ShoppingCart', true)
ON CONFLICT (route_path) DO UPDATE
  SET module_name = EXCLUDED.module_name,
      file_path   = EXCLUDED.file_path,
      category    = EXCLUDED.category,
      icons       = EXCLUDED.icons,
      is_active   = EXCLUDED.is_active;
