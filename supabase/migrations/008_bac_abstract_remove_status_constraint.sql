-- Remove the status constraint so abstracts are saved directly as AWARDED
-- No more DRAFT / EVALUATED flow

ALTER TABLE bac.abstract DROP CONSTRAINT IF EXISTS abstract_status_check;

-- Update any existing DRAFT or EVALUATED abstracts to AWARDED
UPDATE bac.abstract SET status = 'AWARDED' WHERE status IN ('DRAFT', 'EVALUATED');
