-- Enable real-time replication for calls table
-- This allows the dashboard to show popups when new inbound calls arrive

-- Enable replication for calls table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE calls;

-- Note: If the above fails, you may need to enable it via Supabase Dashboard:
-- 1. Go to Database > Replication
-- 2. Find the 'calls' table
-- 3. Toggle it on

