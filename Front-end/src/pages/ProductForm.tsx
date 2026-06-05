import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Upload, X, Plus, Info, Tag, Layers, Image as ImageIcon, CheckCircle, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/contexts/ProductContext";
import api, { endpoints } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, refreshProducts } = useProducts();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [brands, setBrands] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriedSaving, setHasTriedSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [variations, setVariations] = useState<{color: string, image: string}[]>([]);

  const [form, setForm] = useState({
    name: "",
    brand: "",
    slug: "",
    description: "",
    oldPrice: "",
    newPrice: "",
    stockLevel: "",
    category: "",
    material: "",
    gender: "Men",
    websiteTarget: "wear",
  });

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        // Fetch brands filtered by the currently selected websiteTarget
        const data: any = await api.get(`${endpoints.brands}?target=${form.websiteTarget}`);
        setBrands(data);
      } catch (error) {
        console.error("Failed to fetch brands", error);
      }
    };
    fetchBrands();
  }, [form.websiteTarget]);

  useEffect(() => {
    if (id && products.length > 0) {
      const product = products.find((p) => String(p.id || (p as any)._id) === String(id));
      if (product) {
        setForm({
          name: product.name,
          brand: product.brand,
          slug: product.slug,
          description: product.description,
          oldPrice: String(product.old_price || product.oldPrice || 0),
          newPrice: String(product.new_price || product.newPrice || 0),
          stockLevel: String(product.stockLevel || 0),
          category: product.category,
          material: product.material || "",
          gender: product.gender || "Men",
          websiteTarget: product.websiteTarget || "watch",
        });
        setImages(product.images || []);
        setColors(product.colors || []);
        setVariations(product.variations || []);
        setKeywordsInput(product.keywords?.join(", ") || "");
      }
    }
  }, [id, products]);

  const slugify = (text: string) => {
    return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
  };

  const handleNameChange = (name: string) => {
    setForm({ ...form, name, slug: slugify(name) });
  };

  // HIGH-PERFORMANCE IMAGE COMPRESSION
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200; // Optimize for web
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          // Compress to 70% quality
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (images.length + files.length > 10) {
      toast({ title: "Limit Reached", description: "You can only upload up to 10 images.", variant: "destructive" });
      return;
    }

    const optimizedImages = await Promise.all(files.map(file => compressImage(file)));
    setImages((prev) => [...prev, ...optimizedImages]);
    e.target.value = "";
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setImages(newImages);
  };

  const handleAddColor = () => {
    const val = colorInput.trim();
    if (!val || colors.includes(val)) return;
    setColors([...colors, val]);
    // Initialize variation with first image if available
    setVariations([...variations, { color: val, image: images[0] || "" }]);
    setColorInput("");
  };

  const handleRemoveColor = (index: number) => {
    const colorToRemove = colors[index];
    setColors(colors.filter((_, i) => i !== index));
    setVariations(variations.filter(v => v.color !== colorToRemove));
  };

  const handleUpdateVariationImage = (color: string, imageUrl: string) => {
    setVariations(prev => {
      const existing = prev.find(v => v.color === color);
      if (existing) {
        return prev.map(v => v.color === color ? { ...v, image: imageUrl } : v);
      }
      return [...prev, { color, image: imageUrl }];
    });
  };

  const handleSave = async () => {
    setHasTriedSaving(true);
    if (!form.name || !form.brand || !form.category || images.length === 0) {
       toast({ title: "Information Missing", description: "Please fill in Name, Brand, and Category.", variant: "destructive" });
       return;
    }

    setIsSubmitting(true);
    const productData = {
      name: form.name,
      brand: form.brand,
      slug: form.slug,
      description: form.description,
      old_price: Number(form.oldPrice) || 0,
      new_price: Number(form.newPrice) || 0,
      stockLevel: Number(form.stockLevel) || 0,
      category: form.category,
      material: form.material,
      gender: form.gender,
      colors,
      variations,
      keywords: keywordsInput.split(",").map((k) => k.trim()).filter(Boolean),
      images,
      stock_status: Number(form.stockLevel) > 0 ? "in_stock" : "out_of_stock",
      websiteTarget: form.websiteTarget,
    };

    try {
      if (id) {
        await api.patch(`${endpoints.products}/${id}`, productData);
        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        await api.post(endpoints.products, productData);
        toast({ title: "Success", description: "Product published successfully" });
      }
      await refreshProducts();
      navigate("/products");
    } catch (error: any) {
      toast({ title: "Failure", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInvalid = (val: any) => hasTriedSaving && !val;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/products")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all group">
          <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center group-hover:bg-muted"><ChevronLeft className="h-4 w-4" /></div>
          <span className="text-sm font-medium">Product List</span>
        </button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9 px-4 text-xs" onClick={() => navigate("/products")}>Cancel Changes</Button>
          <Button size="sm" className="h-9 px-6 text-xs gap-2 shadow-lg shadow-primary/20" onClick={handleSave} disabled={isSubmitting}>
             {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
             {id ? "Save Updates" : "Publish to Store"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">{id ? "Edit Inventory Item" : "New Inventory Registry"}</h1>
        <p className="text-sm text-muted-foreground">Detailed specifications and visual assets management.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className={`border-border/60 shadow-sm overflow-hidden ${isInvalid(form.name) ? "ring-2 ring-destructive/20 border-destructive" : ""}`}>
            <div className="bg-muted/30 px-6 py-3 border-b border-border/60 flex items-center gap-2">
              <Info className={`h-4 w-4 ${isInvalid(form.name) ? "text-destructive" : "text-primary"}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${isInvalid(form.name) ? "text-destructive" : "text-muted-foreground"}`}>General Information</span>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className={`text-xs font-semibold ${isInvalid(form.name) ? "text-destructive" : ""}`}>Product Title *</Label>
                <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Rolex Submariner Date" className={`h-10 text-sm focus-visible:ring-primary ${isInvalid(form.name) ? "border-destructive focus-visible:ring-destructive" : ""}`} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Write a compelling description..." className="min-h-[150px] text-sm leading-relaxed" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <div className="bg-muted/30 px-6 py-3 border-b border-border/60 flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pricing & Inventory Details</span>
            </div>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-tighter text-muted-foreground">Display Price (RF)</Label>
                  <Input type="number" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} className="h-10 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-tighter text-primary">Final Store Price (RF) *</Label>
                  <Input type="number" value={form.newPrice} onChange={(e) => setForm({ ...form, newPrice: e.target.value })} className="h-10 text-sm ring-1 ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-tighter text-muted-foreground">Stock Quantity</Label>
                  <Input type="number" value={form.stockLevel} onChange={(e) => setForm({ ...form, stockLevel: e.target.value })} className="h-10 text-sm" />
                </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm transition-all duration-300">
            <div className="bg-muted/30 px-6 py-3 border-b border-border/60 flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Variations (Colors)</span>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    value={colorInput} 
                    onChange={(e) => setColorInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
                    placeholder="Enter color variation (e.g. Midnight Black, Rose Gold)" 
                    className="h-10 text-sm pl-4 pr-10" 
                  />
                  <button 
                    type="button"
                    onClick={handleAddColor}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-sm bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Color Presets for Quick Access */}
              <div className="flex flex-wrap gap-2">
                {['Silver', 'Gold', 'Black', 'White', 'Blue', 'Green', 'Rose Gold', 'Leather'].map(preset => (
                   <button 
                     key={preset}
                     type="button"
                     onClick={() => !colors.includes(preset) && setColors([...colors, preset])}
                     disabled={colors.includes(preset)}
                     className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight border transition-all ${colors.includes(preset) ? 'bg-secondary text-muted-foreground border-transparent opacity-50 cursor-not-allowed' : 'bg-background border-border text-foreground hover:border-primary/50'}`}
                   >
                     + {preset}
                   </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                {colors.map((color, i) => {
                  const variation = variations.find(v => v.color === color);
                  return (
                  <div 
                    key={color} 
                    className="flex flex-col gap-3 bg-card p-4 rounded-xl border border-primary/10 shadow-sm group hover:border-primary/30 transition-all animate-in fade-in zoom-in duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="h-3 w-3 rounded-full border border-border shrink-0" style={{ backgroundColor: color.toLowerCase() }} />
                         <span className="text-sm font-medium text-foreground">{color}</span>
                      </div>
                      <button onClick={() => handleRemoveColor(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Image Selector for this variation */}
                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase tracking-tighter text-muted-foreground">Linked Showcase Image</Label>
                       <div className="flex flex-wrap gap-2">
                          {images.map((img, imgIdx) => (
                             <button
                               key={imgIdx}
                               type="button"
                               onClick={() => handleUpdateVariationImage(color, img)}
                               className={`h-10 w-10 rounded-md overflow-hidden border-2 transition-all ${variation?.image === img ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
                             >
                               <img src={img} className="h-full w-full object-cover" />
                             </button>
                          ))}
                          {images.length === 0 && <p className="text-[10px] italic text-muted-foreground">Upload images first to link them</p>}
                       </div>
                    </div>
                  </div>
                )})}
                {colors.length === 0 && (
                  <div className="w-full py-8 text-center border-2 border-dashed border-border/40 rounded-2xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium italic">No color variations defined yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={`border-border/60 shadow-sm ${images.length === 0 && hasTriedSaving ? "ring-2 ring-destructive/20 border-destructive" : ""}`}>
            <div className="bg-muted/30 px-6 py-3 border-b border-border/60 flex items-center gap-2">
              <ImageIcon className={`h-4 w-4 ${images.length === 0 && hasTriedSaving ? "text-destructive" : "text-primary"}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${images.length === 0 && hasTriedSaving ? "text-destructive" : "text-muted-foreground"}`}>Media Assets</span>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl border border-border bg-muted overflow-hidden group">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => moveImage(i, 'left')} 
                        disabled={i === 0}
                        className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all disabled:opacity-30"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => moveImage(i, 'right')} 
                        disabled={i === images.length - 1}
                        className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all disabled:opacity-30"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))} 
                        className="h-8 w-8 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                     {i === 0 && <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-[8px] font-bold uppercase rounded-full shadow-lg">Main Cover</span>}
                  </div>
                ))}
                {images.length < 5 && (
                  <button onClick={() => fileInputRef.current?.click()} className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all ${images.length === 0 && hasTriedSaving ? "border-destructive text-destructive bg-destructive/5" : "border-border"}`}>
                    <Upload className="h-5 w-5" />
                    <span className="text-[10px] mt-2 font-bold uppercase tracking-tight">Add Photo</span>
                  </button>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
            </CardContent>
          </Card>

          <Card className={`border-border/60 shadow-sm ${isInvalid(form.brand) || isInvalid(form.category) ? "ring-2 ring-destructive/20 border-destructive" : ""}`}>
            <div className="bg-muted/30 px-6 py-3 border-b border-border/60 flex items-center gap-2">
              <Layers className={`h-4 w-4 ${isInvalid(form.brand) || isInvalid(form.category) ? "text-destructive" : "text-primary"}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${isInvalid(form.brand) || isInvalid(form.category) ? "text-destructive" : "text-muted-foreground"}`}>Classification</span>
            </div>
            <CardContent className="p-6 space-y-4">
              
              <div className="space-y-2">
                <Label className={`text-xs font-semibold ${isInvalid(form.brand) ? "text-destructive font-bold" : ""}`}>Select Brand *</Label>
                <Select value={form.brand} onValueChange={(v) => setForm({ ...form, brand: v })}>
                  <SelectTrigger className={`h-10 text-sm focus-visible:ring-primary ${isInvalid(form.brand) ? "border-destructive" : ""}`}><SelectValue placeholder="Brand" /></SelectTrigger>
                  <SelectContent>
                    {brands.map((b: any) => <SelectItem key={b.id || b._id} value={b.name}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {brands.length === 0 && <p className="text-[10px] text-warning italic">No brands found for {form.websiteTarget}. Add brands first.</p>}
              </div>
              <div className="space-y-2">
                <Label className={`text-xs font-semibold ${isInvalid(form.category) ? "border-destructive focus-visible:ring-destructive" : ""}`}>Store Category *</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Smartphones" className={`h-10 text-sm ${isInvalid(form.category) ? "border-destructive focus-visible:ring-destructive" : ""}`} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Material / Strap Type</Label>
                <div className="space-y-3">
                  <Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="e.g. Stainless Steel, Leather" className="h-10 text-sm" />
                  
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Model Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger className="h-10 text-sm focus-visible:ring-primary"><SelectValue placeholder="Target Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Men">Men</SelectItem>
                    <SelectItem value="Ladies">Ladies</SelectItem>
                    <SelectItem value="Unisex">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">SEO Keywords</Label>
                <div className="relative">
                   <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input value={keywordsInput} onChange={(e) => setKeywordsInput(e.target.value)} placeholder="phone, tech" className="h-10 pl-9 text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
