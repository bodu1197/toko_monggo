-- Add contact information columns to products table
-- This allows each product to have its own contact numbers (privacy-safe approach)

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(15),
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(15);

-- Add comments for documentation
COMMENT ON COLUMN public.products.phone_number IS 'Contact phone number for this product (10-13 digits)';
COMMENT ON COLUMN public.products.whatsapp_number IS 'WhatsApp number for this product (10-13 digits)';
COMMENT ON TABLE public.products IS 'Products table - contact info stored per product for privacy';
