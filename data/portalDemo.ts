export type InquiryStatus = "pending" | "quoted" | "closed";
export type LeadStatus = "new" | "responded" | "won" | "lost";

export interface DemoInquiry {
  id: string;
  productName: string;
  supplierName: string;
  quantity: string;
  status: InquiryStatus;
  date: string;
  message: string;
}

export interface DemoLead {
  id: string;
  buyerName: string;
  company: string;
  requirement: string;
  quantity: string;
  status: LeadStatus;
  time: string;
  location: string;
}

export interface DemoSupplier {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  verified: boolean;
  productCount: number;
}

export const demoBanners = [
  {
    id: "1",
    title: "Source Verified Suppliers",
    subtitle: "Connect with trusted B2B partners across India",
    cta: "Explore Categories",
    href: "/buyer/categories",
    gradient: "from-[#003C8F] via-[#1565C0] to-[#5E92F3]",
  },
  {
    id: "2",
    title: "Post Your Requirement",
    subtitle: "Get quotes from multiple sellers in 24 hours",
    cta: "Post RFQ",
    href: "/buyer/post-requirement",
    gradient: "from-[#E65100] via-[#FF6D00] to-[#FF9E40]",
  },
];

export const demoSuppliers: DemoSupplier[] = [
  { id: "1", name: "Acme Textiles Pvt Ltd", category: "Textiles", location: "Surat, Gujarat", rating: 4.8, verified: true, productCount: 124 },
  { id: "2", name: "GreenAgro Industries", category: "Agriculture", location: "Nashik, Maharashtra", rating: 4.6, verified: true, productCount: 86 },
  { id: "3", name: "TechParts Solutions", category: "Electronics", location: "Bengaluru, Karnataka", rating: 4.7, verified: true, productCount: 210 },
  { id: "4", name: "SteelCraft Manufacturing", category: "Metals", location: "Jamshedpur, Jharkhand", rating: 4.5, verified: false, productCount: 58 },
];

export const demoInquiries: DemoInquiry[] = [
  { id: "1", productName: "Cotton Yarn 40s", supplierName: "Acme Textiles", quantity: "500 kg", status: "pending", date: "Today", message: "Need bulk supply for Q3 production." },
  { id: "2", productName: "Industrial LED Panels", supplierName: "TechParts Solutions", quantity: "200 units", status: "quoted", date: "Yesterday", message: "Looking for CE certified panels." },
  { id: "3", productName: "Packaging Boxes", supplierName: "PackPro India", quantity: "1000 pcs", status: "closed", date: "3 days ago", message: "Custom printed corrugated boxes." },
];

export const demoLeads: DemoLead[] = [
  { id: "1", buyerName: "Rohan Sharma", company: "Sharma Traders", requirement: "Need 500 units of Packaging Boxes", quantity: "500 units", status: "new", time: "2 mins ago", location: "Delhi" },
  { id: "2", buyerName: "Priya Patel", company: "Patel Exports", requirement: "Looking for Cotton Yarn suppliers", quantity: "2 tons", status: "responded", time: "1 hour ago", location: "Ahmedabad" },
  { id: "3", buyerName: "Amit Kumar", company: "Kumar Industries", requirement: "Bulk order for Industrial LEDs", quantity: "300 units", status: "new", time: "3 hours ago", location: "Pune" },
  { id: "4", buyerName: "Sneha Reddy", company: "Reddy Agro", requirement: "Organic fertilizer supply", quantity: "50 bags", status: "won", time: "1 day ago", location: "Hyderabad" },
  { id: "5", buyerName: "Vikram Singh", company: "Singh Metals", requirement: "Steel rods grade FE500", quantity: "10 tons", status: "lost", time: "2 days ago", location: "Jaipur" },
];

export const chartHeights = [40, 60, 30, 80, 50, 90, 70];
export const chartDays = ["M", "T", "W", "T", "F", "S", "S"];
