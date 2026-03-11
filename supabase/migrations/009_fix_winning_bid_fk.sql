-- Fix: winning_b_id stores a supplier s_id, not a bidture b_id.
-- Drop the old FK that references bidture(b_id) and add one referencing supplier(s_id).

ALTER TABLE bac.abstract DROP CONSTRAINT IF EXISTS fk_abstract_winning_b_id;

ALTER TABLE bac.abstract
  ADD CONSTRAINT fk_abstract_winning_b_id
  FOREIGN KEY (winning_b_id) REFERENCES bac.supplier(s_id);
