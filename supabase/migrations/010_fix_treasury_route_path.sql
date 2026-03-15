-- =============================================================================
-- Fix Treasury Dashboard route path to support nested routes
-- Adds /* wildcard to enable child routes in Treasury component
-- =============================================================================

-- Update the Treasury Dashboard route to include /* for nested routing
UPDATE public.modules
SET route_path = '/accounting/treasury/*'
WHERE route_path = '/accounting/treasury'
  AND file_path = 'modules/Treasury/pages/Treasury';

-- Also handle the case if it's under /treasury/treasury (in case of manual edits)
UPDATE public.modules
SET route_path = '/treasury/treasury/*'
WHERE route_path = '/treasury/treasury'
  AND file_path = 'modules/Treasury/pages/Treasury';
