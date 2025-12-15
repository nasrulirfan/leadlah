-- Align subscription tables with the global updated_at trigger logic.
-- The existing update_updated_at_column() function expects an "updated_at"
-- column, but the subscriptions tables use "updatedAt". This migration adds
-- a dedicated trigger function for those camelCase columns and re-wires
-- the triggers to use it, avoiding runtime errors during updates.

CREATE OR REPLACE FUNCTION update_updatedat_camel_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_subscription_invoices_updated_at ON subscription_invoices;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updatedat_camel_column();

CREATE TRIGGER update_subscription_invoices_updated_at
  BEFORE UPDATE ON subscription_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updatedat_camel_column();

