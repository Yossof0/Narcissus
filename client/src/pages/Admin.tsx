import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { isAdmin } from "@shared/privileges";
import { DiscountSection } from "@/components/DiscountSection";
import { useDeleteConfirm } from "@/components/DeleteConfirmDialog";
import {
  Plus, Pencil, Trash2, Loader2, X, Package,
  ShoppingBag, LogOut, Upload, ImageIcon, ChevronDown, GripVertical, ClipboardList
} from "lucide-react";

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export type CustomizationOption = {
  id: string;
  title: string;
  type: "dropdown" | "counter";
  choices?: string[]; // for dropdown
  min?: number;       // for counter
  max?: number;       // for counter
  defaultValue?: number; // for counter
};

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  customizations: CustomizationOption[];
}

const EMPTY_FORM: ProductForm = {
  name: "", description: "", price: "", category: "", imageUrl: "", customizations: []
};

function CustomizationBuilder({
                                customizations,
                                onChange,
                              }: {
  customizations: CustomizationOption[];
  onChange: (c: CustomizationOption[]) => void;
}) {
  const addOption = () => {
    onChange([
      ...customizations,
      { id: Date.now().toString(), title: "", type: "dropdown", choices: [""] },
    ]);
  };

  const update = (id: string, patch: Partial<CustomizationOption>) => {
    onChange(customizations.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const remove = (id: string) => onChange(customizations.filter(c => c.id !== id));

  const addChoice = (id: string) => {
    const c = customizations.find(c => c.id === id);
    if (!c) return;
    update(id, { choices: [...(c.choices || []), ""] });
  };

  const updateChoice = (id: string, idx: number, val: string) => {
    const c = customizations.find(c => c.id === id);
    if (!c || !c.choices) return;
    const choices = [...c.choices];
    choices[idx] = val;
    update(id, { choices });
  };

  const removeChoice = (id: string, idx: number) => {
    const c = customizations.find(c => c.id === id);
    if (!c || !c.choices) return;
    update(id, { choices: c.choices.filter((_, i) => i !== idx) });
  };

  return (
    <div className="md:col-span-2 space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-light text-foreground">CUSTOMIZATION OPTIONS</label>
        <Button type="button" variant="outline" size="sm" onClick={addOption} className="text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Option
        </Button>
      </div>

      {customizations.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No customization options. Click "Add Option" to let customers personalize this product.</p>
      )}

      {customizations.map((c) => (
        <div key={c.id} className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
          <div className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              value={c.title}
              onChange={e => update(c.id, { title: e.target.value })}
              placeholder="Option title (e.g. Color, Size, Engraving)"
              className="flex-1"
            />
            {/* Type selector */}
            <div className="relative">
              <select
                value={c.type}
                onChange={e => update(c.id, {
                  type: e.target.value as "dropdown" | "counter",
                  choices: e.target.value === "dropdown" ? (c.choices?.length ? c.choices : [""]) : undefined,
                  min: e.target.value === "counter" ? 1 : undefined,
                  max: e.target.value === "counter" ? 10 : undefined,
                  defaultValue: e.target.value === "counter" ? 1 : undefined,
                })}
                className="appearance-none pl-3 pr-8 py-2 border border-border rounded bg-background text-sm text-foreground focus:outline-none"
              >
                <option value="dropdown">Dropdown</option>
                <option value="counter">Counter</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
            <button type="button" onClick={() => remove(c.id)} className="p-1 hover:text-destructive transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dropdown choices */}
          {c.type === "dropdown" && (
            <div className="ml-7 space-y-2">
              <p className="text-xs text-muted-foreground">Choices:</p>
              {(c.choices || []).map((choice, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={choice}
                    onChange={e => updateChoice(c.id, idx, e.target.value)}
                    placeholder={`Choice ${idx + 1}`}
                    className="flex-1 h-8 text-sm"
                  />
                  <button type="button" onClick={() => removeChoice(c.id, idx)} className="p-1 hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={() => addChoice(c.id)} className="text-xs h-7">
                <Plus className="w-3 h-3 mr-1" /> Add Choice
              </Button>
            </div>
          )}

          {/* Counter settings */}
          {c.type === "counter" && (
            <div className="ml-7 flex gap-4 items-center flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Min:</label>
                <Input
                  type="number"
                  value={c.min ?? 1}
                  onChange={e => update(c.id, { min: parseInt(e.target.value) })}
                  className="w-16 h-8 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Max:</label>
                <Input
                  type="number"
                  value={c.max ?? 10}
                  onChange={e => update(c.id, { max: parseInt(e.target.value) })}
                  className="w-16 h-8 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Default:</label>
                <Input
                  type="number"
                  value={c.defaultValue ?? 1}
                  onChange={e => update(c.id, { defaultValue: parseInt(e.target.value) })}
                  className="w-16 h-8 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Admin() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { data: products = [], refetch } = trpc.products.list.useQuery();
  const { data: allOrders = [], refetch: refetchOrders } = trpc.orders.all.useQuery();
  const createProduct = trpc.products.create.useMutation();
  const updateProduct = trpc.products.update.useMutation();
  const deleteProduct = trpc.products.delete.useMutation();
  const updateStatus = trpc.orders.updateStatus.useMutation();
  const { confirm: confirmDelete, dialog: deleteDialog } = useDeleteConfirm();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin(user?.email)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Package className="w-12 h-12 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Access denied. Admin only.</p>
        <Button variant="outline" onClick={() => navigate("/")}>Back to Store</Button>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setForm(f => ({ ...f, imageUrl: url }));
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
      setImagePreview("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    let customizations: CustomizationOption[] = [];
    try { customizations = JSON.parse(product.customizations || "[]"); } catch {}
    setForm({
      name: product.name,
      description: product.description || "",
      price: (product.price / 100).toFixed(2),
      category: product.category,
      imageUrl: product.imageUrl || "",
      customizations,
    });
    setImagePreview(product.imageUrl || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) { toast.error("Name, price and category are required."); return; }
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum <= 0) { toast.error("Enter a valid price."); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: priceNum,
        category: form.category,
        imageUrl: form.imageUrl || undefined,
        customizations: form.customizations.length > 0 ? JSON.stringify(form.customizations) : undefined,
      };
      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, ...payload });
        toast.success("Product updated!");
      } else {
        await createProduct.mutateAsync(payload);
        toast.success("Product created!");
      }
      await refetch();
      handleCancel();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    confirmDelete(name, async () => {
      try {
        await deleteProduct.mutateAsync({ id });
        toast.success("Product deleted.");
        await refetch();
      } catch { toast.error("Failed to delete."); }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {deleteDialog}
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5" />
            <span className="text-lg font-light tracking-wider">NARCISSUS ADMIN</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ShoppingBag className="w-4 h-4 mr-2" />Store
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-destructive hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Tabs */}
        <div className="flex border-b border-border mb-8 gap-8">
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 text-sm font-light tracking-wide transition-colors border-b-2 -mb-px ${activeTab === "products" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Package className="w-4 h-4 inline mr-2" />PRODUCTS ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 text-sm font-light tracking-wide transition-colors border-b-2 -mb-px ${activeTab === "orders" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <ClipboardList className="w-4 h-4 inline mr-2" />ORDERS ({allOrders.length})
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            {allOrders.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No orders yet.</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-light tracking-wide text-muted-foreground">#</th>
                    <th className="text-left px-6 py-4 text-sm font-light tracking-wide text-muted-foreground hidden md:table-cell">CUSTOMER</th>
                    <th className="text-left px-6 py-4 text-sm font-light tracking-wide text-muted-foreground">TOTAL</th>
                    <th className="text-left px-6 py-4 text-sm font-light tracking-wide text-muted-foreground">STATUS</th>
                    <th className="text-left px-6 py-4 text-sm font-light tracking-wide text-muted-foreground hidden md:table-cell">DATE</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                  {allOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 text-sm font-light text-foreground">#{order.id}</td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm font-light text-foreground">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                        <p className="text-xs text-muted-foreground mt-1 italic">{order.customerAddress}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-light">EGP {(order.totalPrice / 100).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <select
                            value={order.status}
                            onChange={async (e) => {
                              try {
                                await updateStatus.mutateAsync({ id: order.id, status: e.target.value as any });
                                toast.success(`Order #${order.id} updated to ${e.target.value}`);
                                refetchOrders();
                              } catch { toast.error("Failed to update status"); }
                            }}
                            className={`appearance-none pl-3 pr-7 py-1.5 rounded-full text-xs font-light border-0 cursor-pointer focus:outline-none ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground hidden md:table-cell">
                        {new Date(order.createdAt).toLocaleDateString("en-EG")}
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <>
            {/* Major Discount */}
            <div className="mb-6">
              <DiscountSection />
            </div>

            {showForm && (
              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-light tracking-wider">{editingId ? `EDIT PRODUCT #${editingId}` : "ADD PRODUCT"}</h2>
                  <button onClick={handleCancel} className="p-2 hover:bg-muted rounded transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-light mb-2">Product Name *</label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Handmade Candle" required />
                  </div>
                  <div>
                    <label className="block text-sm font-light mb-2">Category *</label>
                    <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Candles, Jewelry" required />
                  </div>
                  <div>
                    <label className="block text-sm font-light mb-2">Price (EGP) *</label>
                    <Input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. 150.00" required />
                  </div>
                  <div>
                    <label className="block text-sm font-light mb-2">Product Image</label>
                    <div className="flex gap-3 items-start">
                      <div className="w-20 h-20 rounded border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="flex items-center gap-2 px-3 py-2 border border-border rounded cursor-pointer hover:bg-muted transition-colors text-sm font-light w-full">
                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {isUploading ? "Uploading..." : "Upload Image"}
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                        </label>
                        <Input
                          value={form.imageUrl}
                          onChange={e => { setForm(f => ({ ...f, imageUrl: e.target.value })); setImagePreview(e.target.value); }}
                          placeholder="Or paste image URL"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-light mb-2">Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe this product..."
                      rows={3}
                      className="w-full px-4 py-2 border border-border rounded bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                  </div>

                  {/* Customization Builder */}
                  <CustomizationBuilder
                    customizations={form.customizations}
                    onChange={c => setForm(f => ({ ...f, customizations: c }))}
                  />

                  {/* Product Discount — only when editing */}
                  {editingId && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-light mb-2">PRODUCT DISCOUNT</label>
                      <DiscountSection
                        productId={editingId}
                        productDiscount={products.find((p: any) => p.id === editingId) as any}
                        onUpdated={() => {
                          // Silently refresh products list without closing the form
                          refetch();
                        }}
                      />
                    </div>
                  )}

                  <div className="md:col-span-2 flex gap-3">
                    <Button type="submit" disabled={isSubmitting || isUploading} className="bg-foreground text-background hover:bg-foreground/90">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Save Changes" : "Add Product"}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                  </div>
                </form>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-light tracking-wider">PRODUCTS ({products.length})</h1>
              {!showForm && (
                <Button onClick={() => setShowForm(true)} className="bg-foreground text-background hover:bg-foreground/90">
                  <Plus className="w-4 h-4 mr-2" />Add Product
                </Button>
              )}
            </div>

            {products.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No products yet. Add your first one!</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-light tracking-wide text-muted-foreground">ID</th>
                    <th className="text-left px-6 py-4 text-sm font-light tracking-wide text-muted-foreground">PRODUCT</th>
                    <th className="text-left px-6 py-4 text-sm font-light tracking-wide text-muted-foreground hidden md:table-cell">CATEGORY</th>
                    <th className="text-left px-6 py-4 text-sm font-light tracking-wide text-muted-foreground">PRICE</th>
                    <th className="text-left px-6 py-4 text-sm font-light tracking-wide text-muted-foreground hidden md:table-cell">OPTIONS</th>
                    <th className="text-right px-6 py-4 text-sm font-light tracking-wide text-muted-foreground">ACTIONS</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                  {products.map((product: any) => {
                    let customCount = 0;
                    try { customCount = JSON.parse(product.customizations || "[]").length; } catch {}
                    return (
                      <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-muted-foreground">#{product.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded overflow-hidden bg-muted shrink-0">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground" /></div>
                              )}
                            </div>
                            <div>
                              <p className="font-light text-foreground">{product.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{product.description || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{product.category}</td>
                        <td className="px-6 py-4 text-sm font-light">EGP {(product.price / 100).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">
                          {customCount > 0 ? `${customCount} option${customCount > 1 ? "s" : ""}` : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEdit(product)} className="p-2 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(product.id, product.name)} className="p-2 hover:bg-destructive/10 rounded transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}