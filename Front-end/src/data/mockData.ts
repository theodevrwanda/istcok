export interface Brand {
  id?: string;
  _id?: string;
  name: string;
  country: string;
  image?: string;
  tagline?: string;
  is_showcase?: boolean;
  showcase_type?: "brand" | "explore";
  websiteTarget?: "watch" | "wear";
  createdAt: string;
}

export interface Product {
  id?: string | number;
  _id?: string | number;
  name: string;
  brand: string;
  slug: string;
  description: string;
  oldPrice?: number;
  old_price?: number;
  newPrice?: number;
  new_price?: number;
  stockLevel: number;
  category: string;
  material?: string;
  gender?: string;
  colors?: string[];
  variations?: { color: string; image: string }[];
  keywords: string[];
  images: string[];
  stockStatus?: "In Stock" | "Out of Stock";
  stock_status?: "in_stock" | "out_of_stock";
  on_home_page?: boolean;
  websiteTarget?: "watch" | "wear";
  createdAt: string;
}

export interface Order {
  id: string;
  _id?: string;
  customer: {
    fullName: string;
    phone: string;
  };
  location: {
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
  };
  orderType: {
    method: "Pick up" | "Delivery";
    productName: string;
    quantity: number;
  };
  payment: {
    method: "MTN" | "Airtel" | "Bank";
    senderName: string;
    senderNumber: string;
    totalAmount: number;
    paidAmount: number;
    remainAmount: number;
  };
  status: "Pending" | "Completed" | "Cancelled";
  readBy: string[];
  verified: boolean;
  verifiedBy?: string;
  createdAt: string;
}

export interface Worker {
  id: string | number;
  _id?: string | number;
  name: string;
  email: string;
  phone: string;
  role: "Admin" | "Staff" | "Manager";
  status: "Active" | "Inactive";
  joinedDate: string;
}

export interface StockMovement {
  id: string;
  _id?: string;
  productId: string;
  productName: string;
  type: "in" | "out";
  quantity: number;
  reason: string;
  workerName: string;
  createdAt: string;
}

export interface Blog {
  id?: string | number;
  _id?: string | number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  images?: string[];
  author: string;
  category: string;
  createdAt: string;
}

// Helper to initialize localStorage with default values if not already present
export const initializeLocalStorage = () => {
  if (!localStorage.getItem("istock_brands")) {
    const defaultBrands: Brand[] = [
      { id: "b1", name: "Ray-Ban", country: "Italy", tagline: "Genuine since 1937", is_showcase: true, showcase_type: "brand", websiteTarget: "wear", createdAt: new Date().toISOString() },
      { id: "b2", name: "Oakley", country: "USA", tagline: "Thermonuclear protection", is_showcase: true, showcase_type: "brand", websiteTarget: "wear", createdAt: new Date().toISOString() },
      { id: "b3", name: "Prada Eyewear", country: "Italy", tagline: "High fashion spectacles", is_showcase: true, showcase_type: "brand", websiteTarget: "wear", createdAt: new Date().toISOString() },
      { id: "b4", name: "Tom Ford", country: "USA", tagline: "Exquisite modern optical frames", is_showcase: true, showcase_type: "brand", websiteTarget: "wear", createdAt: new Date().toISOString() },
      { id: "b5", name: "Gucci Eyewear", country: "Italy", tagline: "Bold oversized frames", is_showcase: true, showcase_type: "brand", websiteTarget: "wear", createdAt: new Date().toISOString() },
      { id: "b6", name: "Warby Parker", country: "USA", tagline: "Boutique quality specs", is_showcase: true, showcase_type: "brand", websiteTarget: "wear", createdAt: new Date().toISOString() },
      { id: "b7", name: "Acuvue", country: "USA", tagline: "Hydration and lens comfort", is_showcase: true, showcase_type: "brand", websiteTarget: "wear", createdAt: new Date().toISOString() },
    ];
    localStorage.setItem("istock_brands", JSON.stringify(defaultBrands));
  }

  if (!localStorage.getItem("istock_products")) {
    const defaultProducts: Product[] = [
      {
        id: "p1",
        name: "Prada Cat-Eye Classic",
        brand: "Prada Eyewear",
        slug: "prada-cat-eye-classic",
        description: "A chic cat-eye silhouette crafted from premium Italian acetate. Ideal for daily prescription use. Features a hand-polished frame and flexible hinges.",
        oldPrice: 230000,
        newPrice: 210000,
        old_price: 230000,
        new_price: 210000,
        stockLevel: 10,
        category: "Prescription Glasses",
        material: "Cellulose Acetate",
        gender: "Ladies",
        colors: ["Black", "Tortoise"],
        variations: [
          { color: "Black", image: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?q=80&w=600&auto=format&fit=crop" }
        ],
        keywords: ["prada", "cat-eye", "glasses", "prescription"],
        images: ["https://images.unsplash.com/photo-1591076482161-42ce6da69f67?q=80&w=600&auto=format&fit=crop"],
        stockStatus: "In Stock",
        stock_status: "in_stock",
        on_home_page: true,
        websiteTarget: "wear",
        createdAt: new Date().toISOString(),
      },
      {
        id: "p2",
        name: "Ray-Ban Original Wayfarer Classic",
        brand: "Ray-Ban",
        slug: "ray-ban-wayfarer-classic",
        description: "Ray-Ban Original Wayfarer Classics are the most recognizable style in the history of sunglasses.",
        oldPrice: 195000,
        newPrice: 165000,
        old_price: 195000,
        new_price: 165000,
        stockLevel: 15,
        category: "Prescription Glasses",
        material: "Acetate",
        gender: "Unisex",
        colors: ["Black", "Brown"],
        variations: [
          { color: "Black", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600&auto=format&fit=crop" }
        ],
        keywords: ["rayban", "wayfarer", "sunglasses", "classic"],
        images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600&auto=format&fit=crop"],
        stockStatus: "In Stock",
        stock_status: "in_stock",
        on_home_page: true,
        websiteTarget: "wear",
        createdAt: new Date().toISOString(),
      },
      {
        id: "p3",
        name: "Acuvue Oasys 1-Day",
        brand: "Acuvue",
        slug: "acuvue-oasys-1day",
        description: "Daily contact lenses with HydraLuxe technology to keep eyes fresh and hydrated all day.",
        oldPrice: 90000,
        newPrice: 85000,
        old_price: 90000,
        new_price: 85000,
        stockLevel: 40,
        category: "Contact Lenses",
        material: "Silicone Hydrogel",
        gender: "Unisex",
        colors: ["Clear"],
        variations: [
          { color: "Clear", image: "https://images.unsplash.com/photo-1516281717304-1833d618c7ef?q=80&w=600&auto=format&fit=crop" }
        ],
        keywords: ["contact", "lenses", "acuvue", "hydraluxe"],
        images: ["https://images.unsplash.com/photo-1516281717304-1833d618c7ef?q=80&w=600&auto=format&fit=crop"],
        stockStatus: "In Stock",
        stock_status: "in_stock",
        on_home_page: true,
        websiteTarget: "wear",
        createdAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem("istock_products", JSON.stringify(defaultProducts));
  }

  if (!localStorage.getItem("istock_orders")) {
    const defaultOrders: Order[] = [
      {
        id: "o1",
        customer: { fullName: "Karasira Jean Paul", phone: "+250788123456" },
        location: { district: "Gasabo", sector: "Kacyiru", cell: "Kamutwa", village: "Inyange" },
        orderType: { method: "Delivery", productName: "Prada Cat-Eye Classic", quantity: 1 },
        payment: {
          method: "Bank",
          senderName: "Karasira Jean Paul",
          senderNumber: "I&M BANK",
          totalAmount: 210000,
          paidAmount: 210000,
          remainAmount: 0,
        },
        status: "Completed",
        readBy: ["Admin"],
        verified: true,
        verifiedBy: "Mock Admin",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "o2",
        customer: { fullName: "Uwase Diane", phone: "+250785987654" },
        location: { district: "Kicukiro", sector: "Kanombe" },
        orderType: { method: "Pick up", productName: "Acuvue Oasys 1-Day", quantity: 2 },
        payment: {
          method: "MTN",
          senderName: "Uwase Diane",
          senderNumber: "0785987654",
          totalAmount: 170000,
          paidAmount: 100000,
          remainAmount: 70000,
        },
        status: "Pending",
        readBy: [],
        verified: false,
        createdAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem("istock_orders", JSON.stringify(defaultOrders));
  }

  if (!localStorage.getItem("istock_workers")) {
    const defaultWorkers: Worker[] = [
      { id: "w1", name: "Mock Admin", email: "admin@istock.com", phone: "+250788000000", role: "Admin", status: "Active", joinedDate: "2024-01-15" },
      { id: "w2", name: "Staff Manager", email: "manager@istock.com", phone: "+250788111111", role: "Manager", status: "Active", joinedDate: "2024-02-10" },
      { id: "w3", name: "Support Staff", email: "staff@istock.com", phone: "+250788222222", role: "Staff", status: "Active", joinedDate: "2024-03-01" },
    ];
    localStorage.setItem("istock_workers", JSON.stringify(defaultWorkers));
  }

  if (!localStorage.getItem("istock_movements")) {
    const defaultMovements: StockMovement[] = [
      {
        id: "m1",
        productId: "p1",
        productName: "Prada Cat-Eye Classic",
        type: "in",
        quantity: 10,
        reason: "Initial Stocking",
        workerName: "Mock Admin",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: "m2",
        productId: "p2",
        productName: "Ray-Ban Original Wayfarer Classic",
        type: "in",
        quantity: 15,
        reason: "Initial Stocking",
        workerName: "Mock Admin",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: "m3",
        productId: "p3",
        productName: "Acuvue Oasys 1-Day",
        type: "in",
        quantity: 40,
        reason: "Initial Stocking",
        workerName: "Mock Admin",
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: "m4",
        productId: "p1",
        productName: "Prada Cat-Eye Classic",
        type: "out",
        quantity: 1,
        reason: "Sale (Order #o1)",
        workerName: "Mock Admin",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    ];
    localStorage.setItem("istock_movements", JSON.stringify(defaultMovements));
  }
};

// Export active datasets parsed directly from LocalStorage
export const getBrands = (): Brand[] => {
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem("istock_brands") || "[]");
};

export const getProducts = (): Product[] => {
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem("istock_products") || "[]");
};

export const getOrders = (): Order[] => {
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem("istock_orders") || "[]");
};

export const getWorkers = (): Worker[] => {
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem("istock_workers") || "[]");
};

export const getMovements = (): StockMovement[] => {
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem("istock_movements") || "[]");
};

export const getBlogs = (): Blog[] => {
  return [];
};

export const brands: Brand[] = [];
export const products: Product[] = [];
export const orders: Order[] = [];
export const workers: Worker[] = [];
export const blogs: Blog[] = [];
export const movements: StockMovement[] = [];
