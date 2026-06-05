import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface StarRatingProps {
  productId: number;
  avgRating: number;
  ratingCount: number;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => {
        const full = rating >= star;
        const half = !full && rating >= star - 0.5;
        return (
          <div key={star} className="relative w-5 h-5">
            {/* Empty star background */}
            <Star className="w-5 h-5 text-muted-foreground/30" fill="none" />
            {/* Full fill */}
            {full && <Star className="w-5 h-5 text-amber-400 absolute inset-0" fill="currentColor" />}
            {/* Half fill using clip */}
            {half && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <Star className="w-5 h-5 text-amber-400" fill="currentColor" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InteractiveStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState<number>(0);
  const display = hovered || value;

  return (
    // Always LTR for star input regardless of page language
    <div className="flex items-center gap-1" dir="ltr" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <div key={star} className="relative w-8 h-8 cursor-pointer flex">
          {/* Left half — half star */}
          <div
            className="absolute left-0 top-0 w-1/2 h-full z-10"
            onMouseEnter={() => setHovered(star - 0.5)}
            onClick={() => onChange(star - 0.5)}
          />
          {/* Right half — full star */}
          <div
            className="absolute right-0 top-0 w-1/2 h-full z-10"
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(star)}
          />
          {/* Render star */}
          <div className="relative w-8 h-8">
            <Star className="w-8 h-8 text-muted-foreground/30" fill="none" />
            {display >= star && (
              <Star className="w-8 h-8 text-amber-400 absolute inset-0" fill="currentColor" />
            )}
            {display >= star - 0.5 && display < star && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <Star className="w-8 h-8 text-amber-400" fill="currentColor" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StarRating({ productId, avgRating, ratingCount }: StarRatingProps) {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const [pendingRating, setPendingRating] = useState<number>(0);

  // Local optimistic state for immediate feedback
  const [localAvg, setLocalAvg] = useState(avgRating);
  const [localCount, setLocalCount] = useState(ratingCount);

  const utils = trpc.useUtils();

  const { data: userRating } = trpc.ratings.getUserRating.useQuery(
    { productId },
    { enabled: isAuthenticated }
  );

  const rateMutation = trpc.ratings.rate.useMutation({
    onSuccess: (data) => {
      toast.success(`Rated ${pendingRating} ⭐`);
      // Update local state immediately
      setLocalAvg(data.avg);
      setLocalCount(data.count);
      // Also invalidate the products query so list updates too
      utils.products.list.invalidate();
      utils.products.getById.invalidate({ id: productId });
      utils.ratings.getUserRating.invalidate({ productId });
      setShowPopup(false);
    },
    onError: () => toast.error("Failed to submit rating."),
  });

  const handleOpen = () => {
    setPendingRating(userRating?.rating ?? 0);
    setShowPopup(true);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <StarDisplay rating={localAvg} />
      <span className="text-sm text-muted-foreground">
        {localAvg > 0 ? localAvg.toFixed(1) : "No ratings"}
        {localCount > 0 && ` (${localCount})`}
      </span>

      {isAuthenticated ? (
        <button
          onClick={handleOpen}
          className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
        >
          {userRating ? "Edit rating" : "Rate this"}
        </button>
      ) : (
        <button
          onClick={() => navigate("/login")}
          className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
        >
          Sign in to rate
        </button>
      )}

      {showPopup && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-card border border-border rounded-lg p-8 w-80 shadow-xl"
            onClick={e => e.stopPropagation()}
            dir="ltr"
          >
            <h3 className="text-lg font-light tracking-wider text-foreground mb-6 text-center">
              RATE THIS PRODUCT
            </h3>
            <div className="flex justify-center mb-4">
              <InteractiveStars value={pendingRating} onChange={setPendingRating} />
            </div>
            <p className="text-center text-sm text-muted-foreground mb-6">
              {pendingRating ? `${pendingRating} / 5 stars` : "Hover and click to rate"}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowPopup(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                onClick={() => {
                  if (!pendingRating) { toast.error("Please select a rating."); return; }
                  rateMutation.mutate({ productId, rating: pendingRating });
                }}
                disabled={!pendingRating || rateMutation.isPending}
              >
                {rateMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}