export interface CategoryItem {
  code: string;
  name: string;
  hindiName: string;
  icon: string;
  description: string;
  bgGradient: string;
}

export const CATEGORIES_DATA: CategoryItem[] = [
  {
    code: "all",
    name: "All Items",
    hindiName: "सभी सामान",
    icon: "⚡",
    description: "Browse full store catalog",
    bgGradient: "from-amber-500/20 to-orange-500/10",
  },
  {
    code: "Electronics",
    name: "Electronics",
    hindiName: "इलेक्ट्रॉनिक्स",
    icon: "💻",
    description: "Gadgets, cables, accessories",
    bgGradient: "from-blue-500/20 to-cyan-500/10",
  },
  {
    code: "Clothing",
    name: "Clothing",
    hindiName: "कपड़े व फैशन",
    icon: "👕",
    description: "Fashion, wear & fabrics",
    bgGradient: "from-purple-500/20 to-pink-500/10",
  },
  {
    code: "Fruits & Vegetables",
    name: "Fruits & Vegetables",
    hindiName: "फल और सब्जियां",
    icon: "🍎",
    description: "Fresh daily farm produce",
    bgGradient: "from-emerald-500/20 to-green-500/10",
  },
  {
    code: "Dairy & Breakfast",
    name: "Dairy & Breakfast",
    hindiName: "डेयरी और नाश्ता",
    icon: "🥛",
    description: "Milk, curd, butter & bread",
    bgGradient: "from-sky-500/20 to-indigo-500/10",
  },
  {
    code: "Snacks & Munchies",
    name: "Snacks & Munchies",
    hindiName: "स्नैक्स और नमकीन",
    icon: "🍿",
    description: "Chips, namkeen & bites",
    bgGradient: "from-yellow-500/20 to-amber-500/10",
  },
  {
    code: "Cold Drinks & Juices",
    name: "Cold Drinks & Juices",
    hindiName: "कोल्ड ड्रिंक्स व जूस",
    icon: "🥤",
    description: "Soft drinks, soda & juices",
    bgGradient: "from-red-500/20 to-orange-500/10",
  },
  {
    code: "Bakery & Biscuits",
    name: "Bakery & Biscuits",
    hindiName: "बेकरी और बिस्कुट",
    icon: "🍞",
    description: "Cookies, rusks & breads",
    bgGradient: "from-amber-600/20 to-yellow-600/10",
  },
  {
    code: "Atta, Rice & Dal",
    name: "Atta, Rice & Dal",
    hindiName: "आटा, चावल व दाल",
    icon: "🌾",
    description: "Grains, flours & pulses",
    bgGradient: "from-lime-500/20 to-emerald-500/10",
  },
  {
    code: "Masala, Oil & More",
    name: "Masala, Oil & More",
    hindiName: "मसाला, तेल व घी",
    icon: "🧂",
    description: "Spices, cooking oils & ghee",
    bgGradient: "from-rose-500/20 to-red-500/10",
  },
  {
    code: "Personal Care",
    name: "Personal Care",
    hindiName: "पर्सनल केयर",
    icon: "🧴",
    description: "Soaps, shampoos & hygiene",
    bgGradient: "from-teal-500/20 to-cyan-500/10",
  },
  {
    code: "Cleaning Essentials",
    name: "Cleaning Essentials",
    hindiName: "सफाई का सामान",
    icon: "🧼",
    description: "Detergents & home hygiene",
    bgGradient: "from-cyan-500/20 to-blue-500/10",
  },
  {
    code: "Home & Needs",
    name: "Home & Needs",
    hindiName: "घरेलू आवश्यकताएं",
    icon: "🏠",
    description: "Kitchenware & daily essentials",
    bgGradient: "from-violet-500/20 to-purple-500/10",
  },
];
