-- Add DELETE policy for calls table
-- Allow users to delete calls from their organizations
CREATE POLICY "Users can delete calls for their organizations"
  ON calls FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

