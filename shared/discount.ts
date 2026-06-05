export interface DiscountInfo {
  type: "percent" | "cash";
  value: number;
  endDate?: Date | null;
}

export function calculateDiscountedPrice(priceInCents: number, discount: DiscountInfo): number {
  if (discount.type === "percent") {
    return Math.round(priceInCents * (1 - discount.value / 100));
  } else {
    return Math.max(0, priceInCents - discount.value * 100);
  }
}

export function getEffectiveDiscount(
  productDiscount: { discountType?: string | null; discountValue?: number | null; discountEndDate?: Date | null } | null,
  majorDiscount: { type: string; value: number; endDate?: Date | null } | null
): DiscountInfo | null {
  const now = new Date();

  // Product discount takes priority
  if (productDiscount?.discountType && productDiscount?.discountValue) {
    if (!productDiscount.discountEndDate || productDiscount.discountEndDate > now) {
      return {
        type: productDiscount.discountType as "percent" | "cash",
        value: productDiscount.discountValue,
        endDate: productDiscount.discountEndDate,
      };
    }
  }

  // Fall back to major discount
  if (majorDiscount?.type && majorDiscount?.value) {
    if (!majorDiscount.endDate || majorDiscount.endDate > now) {
      return {
        type: majorDiscount.type as "percent" | "cash",
        value: majorDiscount.value,
        endDate: majorDiscount.endDate,
      };
    }
  }

  return null;
}

export function formatDiscount(discount: DiscountInfo): string {
  if (discount.type === "percent") return `${discount.value}% OFF`;
  return `EGP ${discount.value} OFF`;
}