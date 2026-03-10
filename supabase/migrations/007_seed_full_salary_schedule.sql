-- =============================================================================
-- Full DBM Salary Schedule — RA 11466 SSL V, Tranche 4 (Jan 1, 2023)
-- SG 1–33, Step 1–8 = 264 rate rows + corresponding salary_rate rows.
--
-- Safe to re-run: uses ON CONFLICT DO UPDATE so amounts stay current.
-- The old sample rows in 003_seed_hr_sample_data.sql are untouched
-- (different UUIDs); new positions should reference these new rows.
-- =============================================================================

-- ─── RATE TABLE: unique constraint needed for upsert ─────────────────────────
-- Create a unique index on (sg_number, step) so we can use ON CONFLICT.
-- NULLs (JO rows) won't conflict because NULLs are distinct in unique indexes.
CREATE UNIQUE INDEX IF NOT EXISTS uq_rate_sg_step
  ON hr.rate (sg_number, step)
  WHERE sg_number IS NOT NULL AND step IS NOT NULL;

-- ─── INSERT ALL SG 1–33 × STEP 1–8 ──────────────────────────────────────────
-- Amounts: RA 11466 Salary Schedule, Tranche 4 effective January 1, 2023.
-- Source: DBM National Budget Circular (NBC) for SSL V implementation.

INSERT INTO hr.rate (description, amount, sg_number, step) VALUES
  -- SG 1
  ('SG-1  Step 1',  13000.00, 1, 1), ('SG-1  Step 2',  13109.00, 1, 2),
  ('SG-1  Step 3',  13219.00, 1, 3), ('SG-1  Step 4',  13329.00, 1, 4),
  ('SG-1  Step 5',  13440.00, 1, 5), ('SG-1  Step 6',  13552.00, 1, 6),
  ('SG-1  Step 7',  13664.00, 1, 7), ('SG-1  Step 8',  13777.00, 1, 8),
  -- SG 2
  ('SG-2  Step 1',  13819.00, 2, 1), ('SG-2  Step 2',  13937.00, 2, 2),
  ('SG-2  Step 3',  14056.00, 2, 3), ('SG-2  Step 4',  14176.00, 2, 4),
  ('SG-2  Step 5',  14297.00, 2, 5), ('SG-2  Step 6',  14419.00, 2, 6),
  ('SG-2  Step 7',  14542.00, 2, 7), ('SG-2  Step 8',  14666.00, 2, 8),
  -- SG 3
  ('SG-3  Step 1',  14678.00, 3, 1), ('SG-3  Step 2',  14808.00, 3, 2),
  ('SG-3  Step 3',  14940.00, 3, 3), ('SG-3  Step 4',  15073.00, 3, 4),
  ('SG-3  Step 5',  15207.00, 3, 5), ('SG-3  Step 6',  15342.00, 3, 6),
  ('SG-3  Step 7',  15479.00, 3, 7), ('SG-3  Step 8',  15617.00, 3, 8),
  -- SG 4
  ('SG-4  Step 1',  15586.00, 4, 1), ('SG-4  Step 2',  15730.00, 4, 2),
  ('SG-4  Step 3',  15876.00, 4, 3), ('SG-4  Step 4',  16023.00, 4, 4),
  ('SG-4  Step 5',  16172.00, 4, 5), ('SG-4  Step 6',  16322.00, 4, 6),
  ('SG-4  Step 7',  16474.00, 4, 7), ('SG-4  Step 8',  16627.00, 4, 8),
  -- SG 5
  ('SG-5  Step 1',  16543.00, 5, 1), ('SG-5  Step 2',  16704.00, 5, 2),
  ('SG-5  Step 3',  16867.00, 5, 3), ('SG-5  Step 4',  17031.00, 5, 4),
  ('SG-5  Step 5',  17197.00, 5, 5), ('SG-5  Step 6',  17365.00, 5, 6),
  ('SG-5  Step 7',  17534.00, 5, 7), ('SG-5  Step 8',  17705.00, 5, 8),
  -- SG 6
  ('SG-6  Step 1',  17553.00, 6, 1), ('SG-6  Step 2',  17732.00, 6, 2),
  ('SG-6  Step 3',  17913.00, 6, 3), ('SG-6  Step 4',  18096.00, 6, 4),
  ('SG-6  Step 5',  18281.00, 6, 5), ('SG-6  Step 6',  18468.00, 6, 6),
  ('SG-6  Step 7',  18657.00, 6, 7), ('SG-6  Step 8',  18848.00, 6, 8),
  -- SG 7
  ('SG-7  Step 1',  18620.00, 7, 1), ('SG-7  Step 2',  18820.00, 7, 2),
  ('SG-7  Step 3',  19022.00, 7, 3), ('SG-7  Step 4',  19226.00, 7, 4),
  ('SG-7  Step 5',  19433.00, 7, 5), ('SG-7  Step 6',  19642.00, 7, 6),
  ('SG-7  Step 7',  19854.00, 7, 7), ('SG-7  Step 8',  20068.00, 7, 8),
  -- SG 8
  ('SG-8  Step 1',  19744.00, 8, 1), ('SG-8  Step 2',  19971.00, 8, 2),
  ('SG-8  Step 3',  20200.00, 8, 3), ('SG-8  Step 4',  20432.00, 8, 4),
  ('SG-8  Step 5',  20666.00, 8, 5), ('SG-8  Step 6',  20903.00, 8, 6),
  ('SG-8  Step 7',  21143.00, 8, 7), ('SG-8  Step 8',  21385.00, 8, 8),
  -- SG 9
  ('SG-9  Step 1',  21129.00, 9, 1), ('SG-9  Step 2',  21388.00, 9, 2),
  ('SG-9  Step 3',  21650.00, 9, 3), ('SG-9  Step 4',  21915.00, 9, 4),
  ('SG-9  Step 5',  22184.00, 9, 5), ('SG-9  Step 6',  22456.00, 9, 6),
  ('SG-9  Step 7',  22731.00, 9, 7), ('SG-9  Step 8',  23010.00, 9, 8),
  -- SG 10
  ('SG-10 Step 1',  23176.00, 10, 1), ('SG-10 Step 2',  23467.00, 10, 2),
  ('SG-10 Step 3',  23762.00, 10, 3), ('SG-10 Step 4',  24061.00, 10, 4),
  ('SG-10 Step 5',  24364.00, 10, 5), ('SG-10 Step 6',  24671.00, 10, 6),
  ('SG-10 Step 7',  24982.00, 10, 7), ('SG-10 Step 8',  25297.00, 10, 8),
  -- SG 11
  ('SG-11 Step 1',  27000.00, 11, 1), ('SG-11 Step 2',  27325.00, 11, 2),
  ('SG-11 Step 3',  27654.00, 11, 3), ('SG-11 Step 4',  27987.00, 11, 4),
  ('SG-11 Step 5',  28324.00, 11, 5), ('SG-11 Step 6',  28666.00, 11, 6),
  ('SG-11 Step 7',  29012.00, 11, 7), ('SG-11 Step 8',  29362.00, 11, 8),
  -- SG 12
  ('SG-12 Step 1',  29165.00, 12, 1), ('SG-12 Step 2',  29522.00, 12, 2),
  ('SG-12 Step 3',  29884.00, 12, 3), ('SG-12 Step 4',  30250.00, 12, 4),
  ('SG-12 Step 5',  30620.00, 12, 5), ('SG-12 Step 6',  30995.00, 12, 6),
  ('SG-12 Step 7',  31375.00, 12, 7), ('SG-12 Step 8',  31759.00, 12, 8),
  -- SG 13
  ('SG-13 Step 1',  31320.00, 13, 1), ('SG-13 Step 2',  31709.00, 13, 2),
  ('SG-13 Step 3',  32103.00, 13, 3), ('SG-13 Step 4',  32502.00, 13, 4),
  ('SG-13 Step 5',  32907.00, 13, 5), ('SG-13 Step 6',  33317.00, 13, 6),
  ('SG-13 Step 7',  33732.00, 13, 7), ('SG-13 Step 8',  34152.00, 13, 8),
  -- SG 14
  ('SG-14 Step 1',  33843.00, 14, 1), ('SG-14 Step 2',  34277.00, 14, 2),
  ('SG-14 Step 3',  34717.00, 14, 3), ('SG-14 Step 4',  35163.00, 14, 4),
  ('SG-14 Step 5',  35615.00, 14, 5), ('SG-14 Step 6',  36073.00, 14, 6),
  ('SG-14 Step 7',  36537.00, 14, 7), ('SG-14 Step 8',  37007.00, 14, 8),
  -- SG 15
  ('SG-15 Step 1',  36619.00, 15, 1), ('SG-15 Step 2',  37111.00, 15, 2),
  ('SG-15 Step 3',  37610.00, 15, 3), ('SG-15 Step 4',  38116.00, 15, 4),
  ('SG-15 Step 5',  38629.00, 15, 5), ('SG-15 Step 6',  39149.00, 15, 6),
  ('SG-15 Step 7',  39677.00, 15, 7), ('SG-15 Step 8',  40213.00, 15, 8),
  -- SG 16
  ('SG-16 Step 1',  39672.00, 16, 1), ('SG-16 Step 2',  40222.00, 16, 2),
  ('SG-16 Step 3',  40780.00, 16, 3), ('SG-16 Step 4',  41347.00, 16, 4),
  ('SG-16 Step 5',  41921.00, 16, 5), ('SG-16 Step 6',  42503.00, 16, 6),
  ('SG-16 Step 7',  43093.00, 16, 7), ('SG-16 Step 8',  43692.00, 16, 8),
  -- SG 17
  ('SG-17 Step 1',  43030.00, 17, 1), ('SG-17 Step 2',  43646.00, 17, 2),
  ('SG-17 Step 3',  44271.00, 17, 3), ('SG-17 Step 4',  44905.00, 17, 4),
  ('SG-17 Step 5',  45548.00, 17, 5), ('SG-17 Step 6',  46200.00, 17, 6),
  ('SG-17 Step 7',  46862.00, 17, 7), ('SG-17 Step 8',  47533.00, 17, 8),
  -- SG 18
  ('SG-18 Step 1',  46725.00, 18, 1), ('SG-18 Step 2',  47417.00, 18, 2),
  ('SG-18 Step 3',  48120.00, 18, 3), ('SG-18 Step 4',  48833.00, 18, 4),
  ('SG-18 Step 5',  49557.00, 18, 5), ('SG-18 Step 6',  50291.00, 18, 6),
  ('SG-18 Step 7',  51037.00, 18, 7), ('SG-18 Step 8',  51793.00, 18, 8),
  -- SG 19
  ('SG-19 Step 1',  51357.00, 19, 1), ('SG-19 Step 2',  52124.00, 19, 2),
  ('SG-19 Step 3',  52903.00, 19, 3), ('SG-19 Step 4',  53694.00, 19, 4),
  ('SG-19 Step 5',  54498.00, 19, 5), ('SG-19 Step 6',  55315.00, 19, 6),
  ('SG-19 Step 7',  56144.00, 19, 7), ('SG-19 Step 8',  56986.00, 19, 8),
  -- SG 20
  ('SG-20 Step 1',  57347.00, 20, 1), ('SG-20 Step 2',  58229.00, 20, 2),
  ('SG-20 Step 3',  59125.00, 20, 3), ('SG-20 Step 4',  60036.00, 20, 4),
  ('SG-20 Step 5',  60961.00, 20, 5), ('SG-20 Step 6',  61901.00, 20, 6),
  ('SG-20 Step 7',  62856.00, 20, 7), ('SG-20 Step 8',  63827.00, 20, 8),
  -- SG 21
  ('SG-21 Step 1',  63997.00, 21, 1), ('SG-21 Step 2',  65014.00, 21, 2),
  ('SG-21 Step 3',  66048.00, 21, 3), ('SG-21 Step 4',  67099.00, 21, 4),
  ('SG-21 Step 5',  68167.00, 21, 5), ('SG-21 Step 6',  69254.00, 21, 6),
  ('SG-21 Step 7',  70359.00, 21, 7), ('SG-21 Step 8',  71483.00, 21, 8),
  -- SG 22
  ('SG-22 Step 1',  71511.00, 22, 1), ('SG-22 Step 2',  72695.00, 22, 2),
  ('SG-22 Step 3',  73899.00, 22, 3), ('SG-22 Step 4',  75123.00, 22, 4),
  ('SG-22 Step 5',  76367.00, 22, 5), ('SG-22 Step 6',  77633.00, 22, 6),
  ('SG-22 Step 7',  78920.00, 22, 7), ('SG-22 Step 8',  80230.00, 22, 8),
  -- SG 23
  ('SG-23 Step 1',  80003.00, 23, 1), ('SG-23 Step 2',  81370.00, 23, 2),
  ('SG-23 Step 3',  82760.00, 23, 3), ('SG-23 Step 4',  84174.00, 23, 4),
  ('SG-23 Step 5',  85613.00, 23, 5), ('SG-23 Step 6',  87078.00, 23, 6),
  ('SG-23 Step 7',  88568.00, 23, 7), ('SG-23 Step 8',  90086.00, 23, 8),
  -- SG 24
  ('SG-24 Step 1',  90078.00, 24, 1), ('SG-24 Step 2',  91711.00, 24, 2),
  ('SG-24 Step 3',  93373.00, 24, 3), ('SG-24 Step 4',  95064.00, 24, 4),
  ('SG-24 Step 5',  96785.00, 24, 5), ('SG-24 Step 6',  98537.00, 24, 6),
  ('SG-24 Step 7', 100321.00, 24, 7), ('SG-24 Step 8', 102139.00, 24, 8),
  -- SG 25
  ('SG-25 Step 1', 102690.00, 25, 1), ('SG-25 Step 2', 104588.00, 25, 2),
  ('SG-25 Step 3', 106522.00, 25, 3), ('SG-25 Step 4', 108492.00, 25, 4),
  ('SG-25 Step 5', 110499.00, 25, 5), ('SG-25 Step 6', 112544.00, 25, 6),
  ('SG-25 Step 7', 114629.00, 25, 7), ('SG-25 Step 8', 116755.00, 25, 8),
  -- SG 26
  ('SG-26 Step 1', 116040.00, 26, 1), ('SG-26 Step 2', 118258.00, 26, 2),
  ('SG-26 Step 3', 120519.00, 26, 3), ('SG-26 Step 4', 122823.00, 26, 4),
  ('SG-26 Step 5', 125172.00, 26, 5), ('SG-26 Step 6', 127566.00, 26, 6),
  ('SG-26 Step 7', 130007.00, 26, 7), ('SG-26 Step 8', 132497.00, 26, 8),
  -- SG 27
  ('SG-27 Step 1', 131124.00, 27, 1), ('SG-27 Step 2', 133736.00, 27, 2),
  ('SG-27 Step 3', 136399.00, 27, 3), ('SG-27 Step 4', 139115.00, 27, 4),
  ('SG-27 Step 5', 141885.00, 27, 5), ('SG-27 Step 6', 144710.00, 27, 6),
  ('SG-27 Step 7', 147591.00, 27, 7), ('SG-27 Step 8', 150531.00, 27, 8),
  -- SG 28
  ('SG-28 Step 1', 148171.00, 28, 1), ('SG-28 Step 2', 151197.00, 28, 2),
  ('SG-28 Step 3', 154283.00, 28, 3), ('SG-28 Step 4', 157432.00, 28, 4),
  ('SG-28 Step 5', 160645.00, 28, 5), ('SG-28 Step 6', 163925.00, 28, 6),
  ('SG-28 Step 7', 167273.00, 28, 7), ('SG-28 Step 8', 170691.00, 28, 8),
  -- SG 29
  ('SG-29 Step 1', 167432.00, 29, 1), ('SG-29 Step 2', 170920.00, 29, 2),
  ('SG-29 Step 3', 174479.00, 29, 3), ('SG-29 Step 4', 178112.00, 29, 4),
  ('SG-29 Step 5', 181820.00, 29, 5), ('SG-29 Step 6', 185605.00, 29, 6),
  ('SG-29 Step 7', 189469.00, 29, 7), ('SG-29 Step 8', 193414.00, 29, 8),
  -- SG 30
  ('SG-30 Step 1', 189199.00, 30, 1), ('SG-30 Step 2', 193189.00, 30, 2),
  ('SG-30 Step 3', 197258.00, 30, 3), ('SG-30 Step 4', 201410.00, 30, 4),
  ('SG-30 Step 5', 205646.00, 30, 5), ('SG-30 Step 6', 209970.00, 30, 6),
  ('SG-30 Step 7', 214383.00, 30, 7), ('SG-30 Step 8', 218889.00, 30, 8),
  -- SG 31
  ('SG-31 Step 1', 278434.00, 31, 1), ('SG-31 Step 2', 284414.00, 31, 2),
  ('SG-31 Step 3', 290517.00, 31, 3), ('SG-31 Step 4', 296747.00, 31, 4),
  ('SG-31 Step 5', 303108.00, 31, 5), ('SG-31 Step 6', 309602.00, 31, 6),
  ('SG-31 Step 7', 316234.00, 31, 7), ('SG-31 Step 8', 323008.00, 31, 8),
  -- SG 32
  ('SG-32 Step 1', 331954.00, 32, 1), ('SG-32 Step 2', 339199.00, 32, 2),
  ('SG-32 Step 3', 346601.00, 32, 3), ('SG-32 Step 4', 354166.00, 32, 4),
  ('SG-32 Step 5', 361898.00, 32, 5), ('SG-32 Step 6', 369803.00, 32, 6),
  ('SG-32 Step 7', 377887.00, 32, 7), ('SG-32 Step 8', 386155.00, 32, 8),
  -- SG 33
  ('SG-33 Step 1', 411382.00, 33, 1), ('SG-33 Step 2', 420447.00, 33, 2),
  ('SG-33 Step 3', 429716.00, 33, 3), ('SG-33 Step 4', 439199.00, 33, 4),
  ('SG-33 Step 5', 448900.00, 33, 5), ('SG-33 Step 6', 458826.00, 33, 6),
  ('SG-33 Step 7', 468983.00, 33, 7), ('SG-33 Step 8', 479379.00, 33, 8)
ON CONFLICT (sg_number, step)
  WHERE sg_number IS NOT NULL AND step IS NOT NULL
  DO UPDATE SET
    description = EXCLUDED.description,
    amount      = EXCLUDED.amount;

-- ─── AUTO-GENERATE SALARY_RATE ROWS FOR EVERY RATE ──────────────────────────
-- Creates one salary_rate row (monthly, is_perday = false) per rate row
-- that has a sg_number. Skips any that already have a salary_rate pointing to them.

-- First, add a unique constraint on salary_rate.rate_id so we can upsert.
CREATE UNIQUE INDEX IF NOT EXISTS uq_salary_rate_rate_id
  ON hr.salary_rate (rate_id);

INSERT INTO hr.salary_rate (description, rate_id, is_perday)
SELECT
  r.description || ' Monthly',
  r.id,
  false
FROM hr.rate r
WHERE r.sg_number IS NOT NULL
  AND r.step IS NOT NULL
ON CONFLICT (rate_id) DO UPDATE SET
  description = EXCLUDED.description;
