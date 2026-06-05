import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, CheckCircle, User, MapPin, CreditCard, Info, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrders } from "@/contexts/OrderContext";
import { useProducts } from "@/contexts/ProductContext";
import { Order } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const OrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { orders, addOrder, updateOrder } = useOrders();
  const { products } = useProducts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    method: "Pick up" as "Pick up" | "Delivery",
    productName: "",
    quantity: "1",
    address: "",
    paymentMethod: "MTN" as "MTN" | "Airtel" | "Bank",
    senderName: "",
    senderNumber: "",
    totalAmount: "",
    paidAmount: "",
    status: "Pending" as "Pending" | "Completed" | "Cancelled",
  });

  useEffect(() => {
    if (id && orders.length > 0) {
      const order = orders.find((o) => String(o.id) === String(id));
      if (order) {
        setForm({
          fullName: order.customer.fullName,
          phone: order.customer.phone,
          method: order.orderType.method,
          productName: order.orderType.productName,
          quantity: String(order.orderType.quantity),
          address: order.location?.address || "",
          paymentMethod: order.payment.method,
          senderName: order.payment.senderName,
          senderNumber: order.payment.senderNumber,
          totalAmount: String(order.payment.totalAmount),
          paidAmount: String(order.payment.paidAmount),
          status: order.status,
        });
      }
    }
  }, [id, orders]);

  const handleSave = async () => {
    if (!form.fullName || !form.phone || !form.productName) return;

    // Validate Phone Numbers (Exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(form.phone)) {
      toast({ title: "Invalid Phone", description: "Customer phone must be exactly 10 digits.", variant: "destructive" });
      return;
    }
    if (form.senderNumber && !phoneRegex.test(form.senderNumber)) {
      toast({ title: "Invalid Sender Number", description: "Payment sender number must be exactly 10 digits.", variant: "destructive" });
      return;
    }

    const total = Number(form.totalAmount) || 0;
    const paid = Number(form.paidAmount) || 0;

    const orderData: any = {
      customer: {
        fullName: form.fullName,
        phone: form.phone,
      },
      location: {
        address: form.address,
      },
      orderType: {
        method: form.method,
        productName: form.productName,
        quantity: Number(form.quantity) || 1,
      },
      payment: {
        method: form.paymentMethod,
        senderName: form.senderName,
        senderNumber: form.senderNumber,
        totalAmount: total,
        paidAmount: paid,
        remainAmount: Math.max(0, total - paid),
      },
      status: form.status,
    };

    setIsSubmitting(true);
    try {
      if (id) {
        await updateOrder(id, orderData);
      } else {
        await addOrder(orderData);
      }
      navigate("/orders");
    } catch (error) {
      console.error("Save error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainAmount = Math.max(0, (Number(form.totalAmount) || 0) - (Number(form.paidAmount) || 0));

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center group-hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Back to Orders</span>
        </button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9 px-4 text-xs" onClick={() => navigate("/orders")} disabled={isSubmitting}>Cancel</Button>
          <Button size="sm" className="h-9 px-6 text-xs gap-2" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
            {id ? "Update Order" : "Place Order"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">{id ? `Edit Order ${id}` : "Create New Order"}</h1>
        <p className="text-sm text-muted-foreground">Register customer details and payment information for the {id ? "existing" : "new"} transaction.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                <User className="h-4 w-4 text-primary" /> Customer Information
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Full Name *</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full Name" className="h-10 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Phone Number *</Label>
                  <Input 
                    value={form.phone} 
                    maxLength={10}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} 
                    placeholder="078xxxxxxx" 
                    className="h-10 text-sm" 
                  />
                  <p className="text-[9px] text-muted-foreground">Example: 0788123456 (10 digits)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Info */}
          {form.method === "Pick up" && (
            <Card className="border-border shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <MapPin className="h-4 w-4 text-primary" /> Logistics Information
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Delivery / Pickup Address</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="District, Sector, Cell..." className="h-10 text-sm" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Info */}
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                <Package className="h-4 w-4 text-primary" /> Order Type & Product
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Method</Label>
                  <Select value={form.method} onValueChange={(val: "Pick up" | "Delivery") => setForm({ ...form, method: val })}>
                    <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select Method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pick up">Pick up</SelectItem>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {form.method === "Delivery" ? "Note: Location details are not required for home delivery." : "Enter the store location for pickup."}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Product Name *</Label>
                  <Select 
                    value={form.productName} 
                    onValueChange={(val) => {
                      const selectedProd = products.find(p => p.name === val);
                      if (selectedProd) {
                        const price = selectedProd.price || 0;
                        setForm({ 
                          ...form, 
                          productName: val, 
                          totalAmount: String(price * (Number(form.quantity) || 1)) 
                        });
                      } else {
                        setForm({ ...form, productName: val });
                      }
                    }}
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Quantity</Label>
                  <Input 
                    type="number" 
                    value={form.quantity} 
                    onChange={(e) => {
                      const qty = e.target.value;
                      const selectedProd = products.find(p => p.name === form.productName);
                      if (selectedProd) {
                        const price = selectedProd.price || 0;
                        setForm({ 
                          ...form, 
                          quantity: qty, 
                          totalAmount: String(price * (Number(qty) || 1)) 
                        });
                      } else {
                        setForm({ ...form, quantity: qty });
                      }
                    }} 
                    className="h-10 text-sm" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment and Status */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                <CreditCard className="h-4 w-4 text-primary" /> Financial Summary
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Total Amount (RF)</Label>
                    <Input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} className="h-10 text-sm font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Paid Amount (RF)</Label>
                    <Input type="number" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} className="h-10 text-sm font-bold text-success" />
                  </div>
                </div>
                <div className={`p-4 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-300 ${
                  remainAmount > 0 
                  ? "bg-destructive/5 border-destructive/20 text-destructive" 
                  : "bg-success/5 border-success/20 text-success"
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Remaining Balance</span>
                  <span className="text-2xl font-black tracking-tighter">
                    RF {remainAmount.toLocaleString()}
                  </span>
                  {remainAmount === 0 && (
                    <div className="mt-2 text-[9px] font-bold bg-success text-success-foreground px-2 py-0.5 rounded-full uppercase">Fully Paid</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Payment Method</Label>
                  <Select value={form.paymentMethod} onValueChange={(val: any) => setForm({ ...form, paymentMethod: val })}>
                    <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select Gateway" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                      <SelectItem value="Airtel">Airtel Money</SelectItem>
                      <SelectItem value="Bank">Bank Transfer / Swift</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase text-[10px]">Sender Name</Label>
                    <Input value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase text-[10px]">Sender Number</Label>
                    <Input 
                      value={form.senderNumber} 
                      maxLength={10}
                      onChange={(e) => setForm({ ...form, senderNumber: e.target.value.replace(/\D/g, "") })} 
                      className="h-9 text-xs" 
                      placeholder="07xxxxxxxx"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm border-l-4 border-l-primary">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                <Info className="h-4 w-4 text-primary" /> Lifecycle Status
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Order Workflow Stage</Label>
                <Select value={form.status} onValueChange={(val: any) => setForm({ ...form, status: val })}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground pt-1 mt-1 border-t border-border/30">Setting this will trigger notification alerts for the logistics team.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
