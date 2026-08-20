export interface Product {
  id: string;
  name: string;
  hindiName?: string;
  category: string;
  price: number;
  originalPrice?: number;
  unit: string;
  stock: number;
  imageUrl: string;
  description: string;
  isPopular: boolean;
  isAvailable: boolean;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  pincode: string;
  owners: {
    name: string;
    phone: string;
  }[];
  deliveryFee: number;
  freeDeliveryThreshold: number;
  announcement: string;
  upiId: string; // for order payments QR/UPI link
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  paymentMethod: 'COD' | 'UPI' | 'CARD' | 'NETBANKING';
  paymentStatus?: 'PAID' | 'PENDING_COD' | 'FAILED';
  transactionId?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'Pending' | 'Placed' | 'Accepted' | 'Preparing' | 'Ready' | 'Out for Delivery' | 'Completed' | 'Delivered' | 'Cancelled';
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link?: string;
}
