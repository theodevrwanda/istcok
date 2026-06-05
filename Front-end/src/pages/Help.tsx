import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, FileText, ShoppingBag, Calendar, Users, Star, RefreshCw, Send, Check, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface HelpTopic {
  id: string;
  title: string;
  category: "pages" | "features";
  icon: any;
  description: string;
  steps: string[];
}

const Help = () => {
  const { toast } = useToast();
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [feedbackHelpful, setFeedbackHelpful] = useState<boolean | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const topics: HelpTopic[] = [
    {
      id: "dashboard-guide",
      title: "Dashboard Home Overview",
      category: "pages",
      icon: FileText,
      description: "Understand key performance indicators (KPIs) and check recent activities.",
      steps: [
        "Go to the Dashboard page by clicking 'Dashboard' in the sidebar.",
        "Review primary stat cards: Products count, Total Orders, Stock Out Items, and Stock Movements count.",
        "Check recent orders in the activity feed at the bottom of the page.",
        "Use the quick-action shortcuts to jump to specific registries."
      ]
    },
    {
      id: "products-guide",
      title: "Managing Stock & Products",
      category: "pages",
      icon: ShoppingBag,
      description: "How to add new products, configure pricing, edit specifications, and manage stock levels.",
      steps: [
        "Navigate to the 'Products' tab using the sidebar.",
        "To add a new product: Click 'Add Product' at the top-right, fill in name, brand, category, description, price, stock quantity, and submit.",
        "To edit an existing product: Find the product in the table, click the Pencil icon in the Actions column.",
        "To mark an item out of stock: Click the yellow Alert/Triangle icon to set stock to zero immediately.",
        "To delete a product: Click the red Trash icon to remove it from the catalog permanently."
      ]
    },
    {
      id: "featured-slots-guide",
      title: "Featured Home Page Stars",
      category: "features",
      icon: Star,
      description: "Manage which products are highlighted on the client-side homepage sliders.",
      steps: [
        "Go to the 'Products' page list.",
        "Look for the 'HOME' column featuring star icons.",
        "Click the Star icon next to a product to pin it to the client homepage. A solid star indicates it is active.",
        "Click the star again to remove it from home page slides.",
        "Note: The system permits a maximum of 8 homepage slots to keep page load times fast for customers."
      ]
    },
    {
      id: "movements-guide",
      title: "Stock Movements Log",
      category: "pages",
      icon: ClipboardList,
      description: "How to record stock adjustments, track inventory additions/removals, and view historical changes.",
      steps: [
        "Go to the 'Stock Movements' page using the sidebar.",
        "To record a stock change, click the 'Adjust Stock' button in the top right.",
        "Select the product you wish to adjust and choose the adjustment type: 'Stock In (+)' or 'Stock Out (-)'.",
        "Input the quantity and select the reason (e.g. Restock, Sale, Damage, Correction).",
        "Click 'Record Adjustment' to apply the change. The product's stock levels will update automatically."
      ]
    },
    {
      id: "orders-guide",
      title: "Processing Customer Orders",
      category: "pages",
      icon: ShoppingBag,
      description: "Tracking client orders, shipping progress, and invoices.",
      steps: [
        "Navigate to the 'Orders' page in the sidebar.",
        "Filter orders by status (Processing, Shipped, Delivered) using the filter controls.",
        "Click the Eye icon on any order to review prescription values, quantities, and customer shipping addresses.",
        "Click the edit Pencil icon to change shipment stages or update payments.",
        "Use the notification Bell icon in the header to view unread orders instantly."
      ]
    },
    {
      id: "workers-guide",
      title: "Managing Workers Directory",
      category: "pages",
      icon: Users,
      description: "Add team members and configure access permissions.",
      steps: [
        "Go to the 'Workers' page (available to Admins only).",
        "To add a new worker: Click 'Add Worker', input their details, select a role (Admin, Manager, Staff), and submit.",
        "To alter permissions: Locate the worker in the table, click their Role dropdown, and choose a new level.",
        "To lock out/deactivate a worker: Toggle their Status dropdown between ACTIVE and DISABLED.",
        "To revoke all access permanently: Click the Trash icon and verify the prompt."
      ]
    },
    {
      id: "sandbox-sync-guide",
      title: "Local Storage & Data Resetting",
      category: "features",
      icon: RefreshCw,
      description: "How changes are saved in this sandbox version and how to revert to clean default seed data.",
      steps: [
        "All updates are securely stored locally inside your browser's 'localStorage'.",
        "This allows you to add, edit, or delete items offline without an external backend database.",
        "To reload default mock items, you can clear browser cookies/site data or run a reset action from the profile settings."
      ]
    }
  ];

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackHelpful === null) {
      toast({
        title: "Feedback Questionnaire",
        description: "Please select if this guide was helpful (Yes or No) before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      toast({
        title: "Feedback Received",
        description: "Thank you! Your feedback has been logged successfully.",
      });
      setFeedbackHelpful(null);
      setFeedbackMessage("");
      setIsSubmitting(false);
    }, 600);
  };

  const toggleTopic = (id: string) => {
    setExpandedTopic(expandedTopic === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <HelpCircle className="h-6 w-6 text-foreground" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Help Center & Documentation</h1>
          <p className="text-xs text-muted-foreground">Find step-by-step guides on how to manage the iStock dashboard.</p>
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Help Guides & Actions</h2>
        
        <div className="space-y-2">
          {topics.map((t) => {
            const Icon = t.icon;
            const isOpen = expandedTopic === t.id;
            return (
              <div 
                key={t.id}
                className="border border-border/50 bg-card rounded-xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleTopic(t.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted/60 border border-border flex items-center justify-center shrink-0 mt-0.5 text-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{t.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.description}</p>
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-border/20 bg-muted/5 animate-in fade-in duration-200">
                    <div className="space-y-2.5 pl-11">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Step-by-Step Instructions:</span>
                      {t.steps.map((step, index) => (
                        <div key={index} className="flex gap-2.5 text-xs text-foreground leading-relaxed">
                          <span className="font-bold text-muted-foreground/60 w-4 shrink-0">{index + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback questionnaire section at bottom */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground">Was this documentation page helpful?</h3>
            <p className="text-[11px] text-muted-foreground">We value your input to continuously improve the administrator experience.</p>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={feedbackHelpful === true ? "default" : "outline"}
                className={`flex-1 font-bold text-xs uppercase tracking-wider h-9 transition-all ${
                  feedbackHelpful === true 
                    ? "bg-foreground text-background" 
                    : "hover:bg-muted"
                }`}
                onClick={() => setFeedbackHelpful(true)}
              >
                Yes, helpful
              </Button>
              <Button
                type="button"
                variant={feedbackHelpful === false ? "default" : "outline"}
                className={`flex-1 font-bold text-xs uppercase tracking-wider h-9 transition-all ${
                  feedbackHelpful === false 
                    ? "bg-foreground text-background" 
                    : "hover:bg-muted"
                }`}
                onClick={() => setFeedbackHelpful(false)}
              >
                No, needs work
              </Button>
            </div>

            <div className="space-y-1.5">
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Optional: How can we improve this help center guide? Send a message directly to administration..."
                rows={3}
                className="w-full text-xs p-3 rounded-lg border border-border bg-background focus:outline-none focus:border-foreground transition-colors resize-none placeholder:text-muted-foreground/50"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full font-bold text-xs uppercase tracking-widest h-9 gap-1.5"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  <span>Send Help Desk Message</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;
