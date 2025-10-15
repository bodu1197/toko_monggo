-- TokoMonggo Push Notifications Database Setup
-- Run this SQL in your Supabase SQL Editor (Dashboard -> SQL Editor)

-- 1. Create push_subscriptions table for storing push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  subscription_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Create indexes for better performance
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- 5. Add comment to table
COMMENT ON TABLE push_subscriptions IS 'Stores push notification subscriptions for users';

-- 6. Create notification_logs table for tracking sent notifications (optional)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('individual', 'broadcast')),
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  total_recipients INTEGER,
  successful_sends INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable RLS for notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 8. Policy: Only authenticated users can view notification logs (for admin purposes)
CREATE POLICY "Authenticated users can view notification logs" ON notification_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- 9. Create index for notification_logs
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- 10. Grant permissions (if needed)
GRANT ALL ON push_subscriptions TO authenticated;
GRANT ALL ON notification_logs TO authenticated;

-- Verification queries (run these after setup to confirm everything is working)
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('push_subscriptions', 'notification_logs');
-- SELECT * FROM pg_policies WHERE tablename IN ('push_subscriptions', 'notification_logs');