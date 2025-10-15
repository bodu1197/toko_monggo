-- Create advertisements table for managing ad codes (Google Ads, custom scripts, etc.)
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  position VARCHAR(50) NOT NULL, -- 'header', 'sidebar', 'footer', 'between_products', 'product_detail'
  ad_code TEXT NOT NULL, -- The actual ad script/code
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on position and is_active for efficient queries
CREATE INDEX IF NOT EXISTS idx_advertisements_position_active ON advertisements(position, is_active);

-- Comment on the table
COMMENT ON TABLE advertisements IS 'Stores advertisement codes and scripts for different page positions';

-- Comment on columns
COMMENT ON COLUMN advertisements.position IS 'Position where ad will be displayed: header, sidebar, footer, between_products, product_detail';
COMMENT ON COLUMN advertisements.ad_code IS 'HTML/JavaScript code for the advertisement (Google Ads script or custom code)';
COMMENT ON COLUMN advertisements.is_active IS 'Whether this advertisement is currently active';

-- RLS policies
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view advertisements
CREATE POLICY "Anyone can view active advertisements"
  ON advertisements FOR SELECT
  USING (is_active = true);

-- Only admins can manage advertisements (insert, update, delete)
CREATE POLICY "Only admins can insert advertisements"
  ON advertisements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update advertisements"
  ON advertisements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete advertisements"
  ON advertisements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_advertisement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_advertisement_timestamp ON advertisements;
CREATE TRIGGER trigger_update_advertisement_timestamp
  BEFORE UPDATE ON advertisements
  FOR EACH ROW
  EXECUTE FUNCTION update_advertisement_updated_at();
