/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  isActive?: boolean;
  created_at?: string;
}

export interface Branch {
  branchId: string;
  branchName: string;
  city: string;
  street: string;
  phone: string;
  openingHours: string;
  isActive: boolean;
}

export interface Category {
  categoryId: string;
  categoryName: string;
  image_url?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface Product {
  productId: string;
  categoryId: string;
  productName: string;
  productDescription: string;
  price: number;
  productPrice?: number;
  productDisplayTitle?: string;
  calories?: number;
  productActive: boolean;
  displayInSite?: number;
  created_at?: string;
}

export interface Cart {
  cartId: string;
  userId: string;
  branchId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  cartItemId: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  productName?: string;
  
  // Virtual property for easier client-side display
  product?: Product;
}

export interface Coupon {
  couponId: string;
  couponCode: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: number;
  minimumOrder: number;
  startDate?: string;
  endDate?: string;
  maxUsage?: number;
  isActive: boolean;
}

export interface Order {
  orderId: string;
  userId: string;
  branchId: string;
  orderNumber: number;
  status: string; // 'Pending' | 'Preparing' | 'Ready' | 'Collected'
  orderType: string; // 'Pickup' | 'Delivery'
  subtotal: number;
  deliveryPrice: number;
  discount: number;
  totalPrice: number;
  couponId?: string;
  estimatedReadyTime?: string;
  orderDescription?: string;
  timeToBeReady?: string;
  TimeToBeReady?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  orderItemId: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

export interface Category {
  categoryId: string;
  categoryName: string;
  image_url?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export function getNormalizedCategoryId(categoryId: string, categories?: Category[]): 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'other' {
  if (categoryId === 'c1' || categoryId === 'c2' || categoryId === 'c3' || categoryId === 'c4' || categoryId === 'c5') {
    return categoryId;
  }
  if (!categories || categories.length === 0) {
    return 'other';
  }
  const cat = categories.find(c => c.categoryId === categoryId);
  if (!cat) return 'other';
  
  const name = cat.categoryName || '';
  if (name.includes('בוקר') || name.includes('Breakfast')) {
    return 'c5';
  }
  if (name.includes('משקאות') || name.includes('קפה') || name.includes('שתייה') || name.includes('Drink') || name.includes('Coffee')) {
    return 'c1';
  }
  if (name.includes('כריך') || name.includes('כריכים') || name.includes('Sandwich')) {
    return 'c2';
  }
  if (name.includes('סלט') || name.includes('סלטים') || name.includes('Salad')) {
    return 'c3';
  }
  if (name.includes('מאפה') || name.includes('מאפים') || name.includes('מתוק') || name.includes('Pastry') || name.includes('Sweet')) {
    return 'c4';
  }
  
  return 'other';
}

export const BASE_URL = 'https://aromaapplication-gqgscbffcmgeffdk.westeurope-01.azurewebsites.net';
