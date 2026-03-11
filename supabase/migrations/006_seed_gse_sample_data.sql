-- Seed sample data for GSE & BAC module

-- Insert sample units
INSERT INTO gse.unit (u_code, description) VALUES
  ('PC', 'Piece'),
  ('SET', 'Set'),
  ('UNIT', 'Unit'),
  ('BOX', 'Box'),
  ('PACK', 'Pack'),
  ('REAM', 'Ream'),
  ('BUNDLE', 'Bundle')
ON CONFLICT (u_code) DO NOTHING;

-- Insert sample specifications
INSERT INTO gse.specs (s_code, description) VALUES
  ('BRAND', 'Brand'),
  ('MODEL', 'Model'),
  ('COLOR', 'Color'),
  ('SIZE', 'Size'),
  ('DIMENSION', 'Dimensions & Weight'),
  ('DISPLAY', 'Display Size'),
  ('RAM', 'RAM'),
  ('STORAGE', 'Storage/ROM'),
  ('CAMERA', 'Camera'),
  ('BATTERY', 'Battery'),
  ('OS', 'Operating System'),
  ('CONNECTIVITY', 'Connectivity'),
  ('WLAN', 'WLAN Frequency'),
  ('BLUETOOTH', 'Bluetooth'),
  ('USB', 'USB'),
  ('KEYBOARD', 'Keyboard'),
  ('MOUSE', 'Mouse')
ON CONFLICT (s_code) DO NOTHING;

-- Insert sample items
INSERT INTO gse.items (i_code, description, default_u_id) VALUES
  (
    'IT-001',
    'Tablet',
    (SELECT u_id FROM gse.unit WHERE u_code = 'UNIT' LIMIT 1)
  ),
  (
    'IT-002',
    'Laptop',
    (SELECT u_id FROM gse.unit WHERE u_code = 'UNIT' LIMIT 1)
  ),
  (
    'IT-003',
    'Desktop Computer',
    (SELECT u_id FROM gse.unit WHERE u_code = 'SET' LIMIT 1)
  ),
  (
    'OFF-001',
    'Bond Paper A4',
    (SELECT u_id FROM gse.unit WHERE u_code = 'REAM' LIMIT 1)
  ),
  (
    'OFF-002',
    'Ballpen',
    (SELECT u_id FROM gse.unit WHERE u_code = 'BOX' LIMIT 1)
  ),
  (
    'OFF-003',
    'Folder',
    (SELECT u_id FROM gse.unit WHERE u_code = 'PACK' LIMIT 1)
  )
ON CONFLICT (i_code) DO NOTHING;

-- Insert sample item specifications for Tablet (MATEPAD 11.5 2025)
WITH tablet AS (
  SELECT i_id FROM gse.items WHERE i_code = 'IT-001' LIMIT 1
)
INSERT INTO gse.item_spec (i_id, s_id, spec_value)
SELECT 
  tablet.i_id,
  s.s_id,
  v.spec_value
FROM tablet
CROSS JOIN LATERAL (
  VALUES
    ((SELECT s_id FROM gse.specs WHERE s_code = 'BRAND'), 'Huawei'),
    ((SELECT s_id FROM gse.specs WHERE s_code = 'MODEL'), 'MATEPAD 11.5 2025'),
    ((SELECT s_id FROM gse.specs WHERE s_code = 'DIMENSION'), 'Width: 261.0 mm, Height: 174.5 mm, Depth: 6.2 mm, Weight: 499 g'),
    ((SELECT s_id FROM gse.specs WHERE s_code = 'DISPLAY'), '11.5 inches, IPS LCD, up to 144 Hz refresh rate'),
    ((SELECT s_id FROM gse.specs WHERE s_code = 'OS'), 'HarmonyOS 4.3'),
    ((SELECT s_id FROM gse.specs WHERE s_code = 'STORAGE'), 'ROM: 256 GB, 512 GB'),
    ((SELECT s_id FROM gse.specs WHERE s_code = 'RAM'), '8 GB'),
    ((SELECT s_id FROM gse.specs WHERE s_code = 'CAMERA'), 'Front Camera: 8 MP (f/2.0 aperture, FF), Rear Camera: 13 MP (f/1.8 aperture, AF)'),
    ((SELECT s_id FROM gse.specs WHERE s_code = 'BATTERY'), 'Typical Capacity: 8800 mAh'),
    ((SELECT s_id FROM gse.specs WHERE s_code = 'CONNECTIVITY'), 'WLAN: Wi-Fi 6 802.11ax, 2.4 GHz and 5 GHz'),
    ((SELECT s_id FROM gse.specs WHERE s_code = 'BLUETOOTH'), 'Bluetooth 5.1, BLE, SBC, AAC, LDAC'),
    ((SELECT s_id FROM gse.specs WHERE s_code = 'USB'), 'Network File Transfer supported, In The Box: Tablet (built-in battery) x 1 USB-C Head Cable x 1')
) v(s_id, spec_value)
JOIN gse.specs s ON s.s_id = v.s_id
ON CONFLICT (i_id, s_id) DO NOTHING;

-- Note: You'll need to create responsibility_center and responsibility_center_section tables
-- or use existing facility/office tables from your system
-- For now, this creates sample items, units, and specs that can be used in purchase requests
