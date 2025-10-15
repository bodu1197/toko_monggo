-- Add device_type column to advertisements table
-- This allows admins to specify whether an ad should be shown on PC, mobile, or both

ALTER TABLE advertisements
ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'both' CHECK (device_type IN ('pc', 'mobile', 'both'));

-- Add comment to explain the column
COMMENT ON COLUMN advertisements.device_type IS 'Device type for advertisement display: pc, mobile, or both';

-- Update existing ads to show on both devices
UPDATE advertisements
SET device_type = 'both'
WHERE device_type IS NULL;
