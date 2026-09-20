UPDATE "Invoice" i
SET
  "deliveryFee" = COALESCE(e."deliveryFee", 0),
  "total" = i."subtotal" - i."discount" + i."tax" + COALESCE(e."deliveryFee", 0),
  "balanceDue" = GREATEST(0, (i."subtotal" - i."discount" + i."tax" + COALESCE(e."deliveryFee", 0)) - i."amountPaid")
FROM "Estimate" e
WHERE i."estimateId" = e.id;
