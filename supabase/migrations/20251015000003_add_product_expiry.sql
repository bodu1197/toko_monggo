-- Add expires_at field to products table for 30-day expiration
ALTER TABLE products
ADD COLUMN expires_at TIMESTAMPTZ;

-- Update existing products to set expires_at to 30 days from created_at
UPDATE products
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL;

-- Create function to automatically set expires_at on new products
CREATE OR REPLACE FUNCTION set_product_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expires_at to 30 days from created_at
  NEW.expires_at := NEW.created_at + INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set expires_at on INSERT
DROP TRIGGER IF EXISTS trigger_set_product_expiry ON products;
CREATE TRIGGER trigger_set_product_expiry
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_expiry();

-- Create function to renew product (extend expires_at by 30 days)
CREATE OR REPLACE FUNCTION renew_product(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET expires_at = GREATEST(NOW(), expires_at) + INTERVAL '30 days',
      updated_at = NOW()
  WHERE id = product_id
    AND user_id = auth.uid();  -- Only owner can renew
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION renew_product(UUID) TO authenticated;

-- Create index on expires_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_products_expires_at ON products(expires_at);

-- Comment on the new column
COMMENT ON COLUMN products.expires_at IS 'Product listing expiration date (30 days from creation, can be renewed)';
