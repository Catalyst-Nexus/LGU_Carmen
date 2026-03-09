-- =============================================================================
-- MIGRATION 006 — Facial Recognition Time Clock
-- Adds face_enrollment table + face_enrollments storage bucket
-- =============================================================================

-- =============================================================================
-- TABLE: hr.face_enrollment
-- Stores one face descriptor (128-D Float32Array from face-api.js) per person.
-- The descriptor is a JSON array of 128 numbers used for face matching.
-- =============================================================================
CREATE TABLE IF NOT EXISTS hr.face_enrollment (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  per_id              UUID          NOT NULL REFERENCES hr.personnel(id) ON DELETE CASCADE,
  -- 128-D face descriptor from face-api.js stored as JSON array
  descriptor          JSONB         NOT NULL,
  -- Path in face_enrollments bucket (e.g. "per_uuid/enrollment.jpg")
  enrollment_photo_path TEXT        NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  -- One enrollment per person
  UNIQUE (per_id)
);

ALTER TABLE hr.face_enrollment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_face_enrollment_r" ON hr.face_enrollment FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_face_enrollment_w" ON hr.face_enrollment FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- STORAGE BUCKET: face_enrollments
-- Stores enrollment reference photos for facial recognition
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('face_enrollments', 'face_enrollments', false, 5242880,
   ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
  SET file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- face_enrollments policies
DROP POLICY IF EXISTS "face_enrollments_select" ON storage.objects;
DROP POLICY IF EXISTS "face_enrollments_insert" ON storage.objects;
DROP POLICY IF EXISTS "face_enrollments_update" ON storage.objects;
DROP POLICY IF EXISTS "face_enrollments_delete" ON storage.objects;

CREATE POLICY "face_enrollments_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'face_enrollments');
CREATE POLICY "face_enrollments_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'face_enrollments');
CREATE POLICY "face_enrollments_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'face_enrollments');
CREATE POLICY "face_enrollments_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'face_enrollments');
