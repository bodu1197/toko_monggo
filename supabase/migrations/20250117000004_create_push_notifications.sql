-- Create push subscriptions table for storing user push notification subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  subscription_data jsonb NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
ON push_subscriptions(user_id);

-- Create index for endpoint lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint
ON push_subscriptions(endpoint);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification types
  new_message boolean DEFAULT true,
  new_comment boolean DEFAULT true,
  price_drop boolean DEFAULT true,
  new_follower boolean DEFAULT true,
  product_sold boolean DEFAULT true,
  product_expired boolean DEFAULT true,

  -- Delivery methods
  push_enabled boolean DEFAULT false,
  email_enabled boolean DEFAULT true,

  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Create notification logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending, sent, failed
  sent_at timestamptz,
  error text,
  created_at timestamptz DEFAULT NOW()
);

-- Create indexes for notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id
ON notification_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_status
ON notification_logs(status);

CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at
ON notification_logs(created_at DESC);

-- RLS Policies for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions" ON push_subscriptions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for notification_logs (read-only for users)
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification logs" ON notification_logs
FOR SELECT USING (auth.uid() = user_id);

-- Function to clean up old notification logs (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_notification_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON push_subscriptions TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;
GRANT SELECT ON notification_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_notification_logs() TO service_role;