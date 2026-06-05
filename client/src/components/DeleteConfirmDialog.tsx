import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const SKIP_KEY = "narcissus-skip-delete-confirm";

export function useDeleteConfirm() {
  const [pending, setPending] = useState<{ name: string; onConfirm: () => void } | null>(null);

  const confirm = (name: string, onConfirm: () => void) => {
    const skip = localStorage.getItem(SKIP_KEY) === "true";
    if (skip) { onConfirm(); return; }
    setPending({ name, onConfirm });
  };

  const dialog = pending ? (
    <DeleteConfirmDialog
      productName={pending.name}
      onConfirm={() => { pending.onConfirm(); setPending(null); }}
      onCancel={() => setPending(null)}
    />
  ) : null;

  return { confirm, dialog };
}

function DeleteConfirmDialog({ productName, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleDelete = () => {
    if (dontAskAgain) localStorage.setItem(SKIP_KEY, "true");
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="bg-card border border-border rounded-lg p-8 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-light text-foreground">Delete Product</h3>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to delete <strong className="text-foreground">"{productName}"</strong>?
        </p>

        <label className="flex items-center gap-2 mb-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontAskAgain}
            onChange={e => setDontAskAgain(e.target.checked)}
            className="w-4 h-4 rounded border-border"
          />
          <span className="text-sm text-muted-foreground">Don't ask me again</span>
        </label>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}