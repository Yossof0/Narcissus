import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tag, X, ChevronDown } from "lucide-react";
import { formatDiscount } from "@shared/discount";

interface DiscountSectionProps {
  productId?: number;      // if provided, this is a per-product discount
  productDiscount?: { discountType?: string | null; discountValue?: number | null; discountEndDate?: any };
  onUpdated?: () => void;
}

export function DiscountSection({ productId, productDiscount, onUpdated }: DiscountSectionProps) {
  const isMajor = !productId;
  const { data: majorDiscount, refetch: refetchMajor } = trpc.discounts.getMajor.useQuery();
  const setMajor = trpc.discounts.setMajor.useMutation();
  const removeMajor = trpc.discounts.removeMajor.useMutation();
  const setProduct = trpc.discounts.setProductDiscount.useMutation();

  const [type, setType] = useState<"percent" | "cash">("percent");
  const [value, setValue] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showForm, setShowForm] = useState(false);

  const currentDiscount = isMajor ? majorDiscount : (productDiscount?.discountType ? {
    type: productDiscount.discountType,
    value: productDiscount.discountValue,
    endDate: productDiscount.discountEndDate,
  } : null);

  const percentOff = !isMajor && currentDiscount?.type === "cash" && currentDiscount.value
    ? ((currentDiscount.value * 100 / (productDiscount as any)?.price) * 100).toFixed(0)
    : null;

  const cashOff = !isMajor && currentDiscount?.type === "percent" && currentDiscount.value
    ? null // would need price context
    : null;

  const utils = trpc.useUtils();

  const handleApply = async () => {
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) { toast.error("Enter a valid discount value."); return; }
    try {
      if (isMajor) {
        await setMajor.mutateAsync({ type, value: v, endDate: endDate || undefined });
        refetchMajor();
        toast.success("Major discount applied to all products!");
      } else {
        await setProduct.mutateAsync({ id: productId!, type, value: v, endDate: endDate || undefined });
        // Invalidate silently — don't call onUpdated to avoid closing parent form
        utils.products.list.invalidate();
        toast.success("Product discount applied!");
      }
      setShowForm(false);
      setValue("");
      setEndDate("");
    } catch { toast.error("Failed to apply discount."); }
  };

  const handleRemove = async () => {
    try {
      if (isMajor) {
        await removeMajor.mutateAsync();
        refetchMajor();
        toast.success("Major discount removed.");
      } else {
        await setProduct.mutateAsync({ id: productId!, type: null, value: null });
        utils.products.list.invalidate();
        toast.success("Product discount removed.");
      }
    } catch { toast.error("Failed to remove discount."); }
  };

  return (
    <div className={`border rounded-lg p-4 ${isMajor ? "border-red-200 bg-red-50/30" : "border-border bg-muted/10"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag className={`w-4 h-4 ${isMajor ? "text-red-500" : "text-muted-foreground"}`} />
          <span className={`text-sm font-light tracking-wide ${isMajor ? "text-red-700" : "text-foreground"}`}>
            {isMajor ? "MAJOR DISCOUNT (all products)" : "PRODUCT DISCOUNT"}
          </span>
        </div>
        <div className="flex gap-2">
          {currentDiscount && (
            <button type="button" onClick={handleRemove} className="text-xs text-destructive hover:underline flex items-center gap-1">
              <X className="w-3 h-3" /> Remove
            </button>
          )}
          <button type="button" onClick={() => setShowForm(!showForm)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            {currentDiscount ? "Edit" : "Add Discount"}
            <ChevronDown className={`w-3 h-3 transition-transform ${showForm ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Current discount display */}
      {currentDiscount && (
        <div className="mb-3 flex items-center gap-2">
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-light">
            {formatDiscount({ type: currentDiscount.type as any, value: currentDiscount.value ?? 0 })}
          </span>
          {currentDiscount.type === "percent" && (
            <span className="text-xs text-muted-foreground">
              {currentDiscount.value}% off
            </span>
          )}
          {currentDiscount.type === "cash" && (
            <span className="text-xs text-muted-foreground">
              EGP {currentDiscount.value} off
            </span>
          )}
          {currentDiscount.endDate && (
            <span className="text-xs text-muted-foreground">
              · Ends {new Date(currentDiscount.endDate).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex gap-3">
            <div className="relative">
              <select value={type} onChange={e => setType(e.target.value as any)}
                      className="appearance-none pl-3 pr-8 py-2 border border-border rounded bg-background text-sm focus:outline-none">
                <option value="percent">% Off</option>
                <option value="cash">EGP Off</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-muted-foreground" />
            </div>
            <Input type="number" value={value} onChange={e => setValue(e.target.value)}
                   placeholder={type === "percent" ? "e.g. 20" : "e.g. 50"} className="w-24" min="0" step="0.01" />
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                   className="flex-1" placeholder="End date (optional)" />
          </div>
          {type === "percent" && value && (
            <p className="text-xs text-muted-foreground">{value}% off will be applied</p>
          )}
          {type === "cash" && value && (
            <p className="text-xs text-muted-foreground">EGP {value} will be deducted</p>
          )}
          <Button type="button" size="sm" onClick={handleApply} className="bg-foreground text-background hover:bg-foreground/90 h-8 text-xs">
            Apply Discount
          </Button>
        </div>
      )}
    </div>
  );
}