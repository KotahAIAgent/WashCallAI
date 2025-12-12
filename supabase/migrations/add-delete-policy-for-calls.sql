-- Add DELETE policy for calls table
-- Allow users to delete calls from their organizations
-- This policy is idempotent - it can be run multiple times safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'calls' 
    AND policyname = 'Users can delete calls for their organizations'
  ) THEN
    CREATE POLICY "Users can delete calls for their organizations"
      ON calls FOR DELETE
      USING (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE profile_id = auth.uid()
        )
      );
  END IF;
END $$;

