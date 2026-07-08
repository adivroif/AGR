/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, Search, Edit2, Check, X, RefreshCw, Layers, ShieldAlert, ShoppingBag, MapPin, Tag, Users, Coffee, Ticket, FileText } from 'lucide-react';
import { User, Branch, Category, Product, Cart, CartItem, Coupon, Order, OrderItem, BASE_URL } from '../types';

export default function AdminPanel() {
  const [activeTable, setActiveTable] = useState<'users' | 'branches' | 'categories' | 'products' | 'carts' | 'cartItems' | 'coupons' | 'orders' | 'orderItems'>('products');
  
  // Data lists
  const [usersList, setUsersList] = useState<User[]>([]);
  const [branchesList, setBranchesList] = useState<Branch[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [cartsList, setCartsList] = useState<Cart[]>([]);
  const [cartItemsList, setCartItemsList] = useState<CartItem[]>([]);
  const [couponsList, setCouponsList] = useState<Coupon[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [orderItemsList, setOrderItemsList] = useState<OrderItem[]>([]);

  // Loading/Search States
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Create state models
  const [newProduct, setNewProduct] = useState({
    categoryId: 'c1',
    productName: '',
    productDescription: '',
    price: 0,
    calories: 0,
    displayInSite: 1
  });

  const [newBranch, setNewBranch] = useState({
    branchName: '',
    city: '',
    street: '',
    phone: '',
    openingHours: '07:00 - 23:00'
  });

  const [newCoupon, setNewCoupon] = useState({
    couponCode: '',
    discountType: 'Percentage' as 'Percentage' | 'Fixed',
    discountValue: 10,
    minimumOrder: 40
  });

  const [newCategory, setNewCategory] = useState({
    categoryName: '',
    image_url: '',
    displayOrder: 1
  });

  // Fetch functions for all tables
  const fetchData = async () => {
    setLoading(true);
    try {
      const activeUserId = localStorage.getItem('aroma_userId') || '1e0cdf7c-ad97-43d3-8e9c-e1d5d06387bc';
      const activeCartId = localStorage.getItem('aroma_cartId') || '0a66cc97-f428-4bfb-8324-58f0c93ed9aa';

      const [uRes, bRes, cRes, pRes, ctRes, ciRes, cpRes, oRes] = await Promise.all([
        fetch(`${BASE_URL}/api/Users`),
        fetch(`${BASE_URL}/api/Branches`),
        fetch(`${BASE_URL}/api/Categories`),
        fetch(`${BASE_URL}/api/Products`),
        fetch(`${BASE_URL}/api/Carts/user/${activeUserId}`),
        fetch(`${BASE_URL}/api/CartItems/cart/${activeCartId}`),
        fetch(`${BASE_URL}/api/Coupons`),
        fetch(`${BASE_URL}/api/Orders`)
      ]);

      if (uRes.ok) setUsersList(await uRes.json());
      if (bRes.ok) setBranchesList(await bRes.json());
      if (cRes.ok) setCategoriesList(await cRes.json());
      if (pRes.ok) setProductsList(await pRes.json());
      if (cpRes.ok) setCouponsList(await cpRes.json());
      if (oRes.ok) {
        const ords = await oRes.json();
        setOrdersList(ords);
        // Fetch all order items for the first few orders
        const itemsPromises = ords.map(async (o: Order) => {
          const res = await fetch(`${BASE_URL}/api/OrderItems/order/${o.orderId}`);
          return res.ok ? await res.json() : [];
        });
        const resolvedItems = await Promise.all(itemsPromises);
        setOrderItemsList(resolvedItems.flat());
      }
    } catch (err) {
      console.error('Error fetching admin tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTable]);

  // Handle deletions
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        setProductsList(prev => prev.filter(p => p.productId !== productId));
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק סניף זה?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Branches/${branchId}`, { method: 'DELETE' });
      if (res.ok) {
        setBranchesList(prev => prev.filter(b => b.branchId !== branchId));
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('האם למחוק את הקופון?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Coupons/${couponId}`, { method: 'DELETE' });
      if (res.ok) {
        setCouponsList(prev => prev.filter(c => c.couponId !== couponId));
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('האם למחוק קטגוריה זו?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Categories/${categoryId}`, { method: 'DELETE' });
      if (res.ok) {
        setCategoriesList(prev => prev.filter(c => c.categoryId !== categoryId));
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('האם למחוק את המשתמש?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsersList(prev => prev.filter(u => u.userId !== userId));
      }
    } catch (e) { console.error(e); }
  };

  // Status updates for orders
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/Orders/${orderId}/status?status=${encodeURIComponent(nextStatus)}`, {
        method: 'PUT'
      });
      if (res.ok) {
        setOrdersList(prev => prev.map(o => o.orderId === orderId ? { ...o, status: nextStatus } : o));
      }
    } catch (e) { console.error(e); }
  };

  // Creators
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.productName || !newProduct.price) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        const added = await res.json();
        setProductsList(prev => [...prev, added]);
        setNewProduct({
          categoryId: 'c1',
          productName: '',
          productDescription: '',
          price: 0,
          calories: 0,
          displayInSite: 1
        });
      }
    } catch (err) { console.error(err); }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.branchName || !newBranch.city) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBranch)
      });
      if (res.ok) {
        const added = await res.json();
        setBranchesList(prev => [...prev, added]);
        setNewBranch({ branchName: '', city: '', street: '', phone: '', openingHours: '07:00 - 23:00' });
      }
    } catch (err) { console.error(err); }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.couponCode || !newCoupon.discountValue) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon)
      });
      if (res.ok) {
        const added = await res.json();
        setCouponsList(prev => [...prev, added]);
        setNewCoupon({ couponCode: '', discountType: 'Percentage', discountValue: 10, minimumOrder: 40 });
      }
    } catch (err) { console.error(err); }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.categoryName) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });
      if (res.ok) {
        const added = await res.json();
        setCategoriesList(prev => [...prev, added]);
        setNewCategory({ categoryName: '', image_url: '', displayOrder: categoriesList.length + 1 });
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-white" dir="rtl">
      
      {/* Title with DB Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-5 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-red-500 animate-bounce" />
            <span>מערכת ניהול בסיס הנתונים וקריאות ה-API</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            כאן תוכלו לראות, ליצור, לערוך ולמחוק נתונים מהטבלאות השונות באופן ישיר ומהיר דרך ה-API שבניתם.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>רענן נתונים</span>
        </button>
      </div>

      {/* SQL Table Selector Sidebar + Table Content Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* SQL Tables list Selector */}
        <div className="lg:col-span-1 space-y-1.5">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-3 mb-2">
            טבלאות בסיס הנתונים ({10 - 1})
          </p>
          {[
            { id: 'products', name: 'products', icon: Coffee, count: productsList.length, color: 'text-red-500' },
            { id: 'orders', name: 'orders', icon: FileText, count: ordersList.length, color: 'text-amber-500' },
            { id: 'users', name: 'users', icon: Users, count: usersList.length, color: 'text-blue-500' },
            { id: 'branches', name: 'branches', icon: MapPin, count: branchesList.length, color: 'text-green-500' },
            { id: 'categories', name: 'categories', icon: Layers, count: categoriesList.length, color: 'text-purple-500' },
            { id: 'coupons', name: 'coupons', icon: Ticket, count: couponsList.length, color: 'text-yellow-500' }
          ].map((tbl) => {
            const Icon = tbl.icon;
            const isActive = activeTable === tbl.id;
            return (
              <button
                key={tbl.id}
                onClick={() => setActiveTable(tbl.id as any)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-black transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? tbl.color : 'text-zinc-500'}`} />
                  <span className="font-mono tracking-wider">{tbl.name}</span>
                </div>
                <span className="bg-zinc-950/80 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-zinc-400 border border-zinc-800">
                  {tbl.count}
                </span>
              </button>
            );
          })}

          <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-850 mt-4">
            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
              <span>חיבור API תקין</span>
            </h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              הנתונים נשמרים בבסיס הנתונים הזמני בשרת Express ומסתנכרנים עם ממשק ה-Swagger בזמן אמת.
            </p>
          </div>
        </div>

        {/* Selected Table Inspector Content */}
        <div className="lg:col-span-3 space-y-6">

          {/* TABLE: PRODUCTS */}
          {activeTable === 'products' && (
            <div className="space-y-6">
              
              {/* Creator Form */}
              <form onSubmit={handleAddProduct} className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                  <Plus className="w-4 h-4 text-red-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">הוספת מוצר חדש לטבלה (INSERT INTO products)</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">שם המוצר</label>
                    <input
                      type="text"
                      required
                      value={newProduct.productName}
                      onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })}
                      placeholder="למשל: אספרסו חזק במיוחד"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">קטגוריה</label>
                    <select
                      value={newProduct.categoryId}
                      onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                    >
                      {categoriesList.map(cat => (
                        <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">מחיר בש"ח</label>
                    <input
                      type="number"
                      required
                      value={newProduct.price || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      placeholder="מחיר"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">תיאור המוצר</label>
                    <input
                      type="text"
                      value={newProduct.productDescription}
                      onChange={(e) => setNewProduct({ ...newProduct, productDescription: e.target.value })}
                      placeholder="רשמו כאן פירוט של רכיבים או דרגת קלייה"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">קלוריות</label>
                    <input
                      type="number"
                      value={newProduct.calories || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, calories: Number(e.target.value) })}
                      placeholder="למשל: 180"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white font-black py-2 px-5 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    הוסף מוצר (INSERT)
                  </button>
                </div>
              </form>

              {/* Table Data View */}
              <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="p-3">productId (UUID)</th>
                      <th className="p-3">שם מוצר</th>
                      <th className="p-3">קטגוריה</th>
                      <th className="p-3">מחיר בש"ח</th>
                      <th className="p-3">קלוריות</th>
                      <th className="p-3">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsList.map(prod => {
                      const cat = categoriesList.find(c => c.categoryId === prod.categoryId);
                      return (
                        <tr key={prod.productId} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                          <td className="p-3 font-mono text-zinc-500">{prod.productId}</td>
                          <td className="p-3 font-bold text-white">{prod.productName}</td>
                          <td className="p-3 text-zinc-400">
                            <span className="bg-zinc-900 px-2 py-1 rounded text-[10px] border border-zinc-850">
                              {cat ? cat.categoryName : prod.categoryId}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-red-400">₪{prod.price}</td>
                          <td className="p-3 font-mono text-zinc-400">{prod.calories || 0} קק"ל</td>
                          <td className="p-3">
                            <button
                              onClick={() => handleDeleteProduct(prod.productId)}
                              className="text-zinc-500 hover:text-red-500 p-1.5 transition-all"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TABLE: ORDERS */}
          {activeTable === 'orders' && (
            <div className="space-y-6">
              
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <h3 className="text-xs font-bold text-zinc-400 mb-1">עדכון סטטוס הזמנה חי (UPDATE orders SET status)</h3>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  הזמנות בסניף מתקדמות אוטומטית או ידנית. תוכלו לקצר תהליכים או לעדכן עבור מסך ההזמנות של הלקוח.
                </p>
              </div>

              <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold">
                      <th className="p-3">מספר הזמנה</th>
                      <th className="p-3">לקוח / משתמש</th>
                      <th className="p-3">סניף</th>
                      <th className="p-3">סוג הזמנה</th>
                      <th className="p-3">סכום כולל</th>
                      <th className="p-3">סטטוס נוכחי</th>
                      <th className="p-3">עדכון סטטוס API</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersList.map(ord => {
                      const user = usersList.find(u => u.userId === ord.userId);
                      const branch = branchesList.find(b => b.branchId === ord.branchId);
                      return (
                        <tr key={ord.orderId} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                          <td className="p-3 font-mono font-bold text-red-500">#{ord.orderNumber}</td>
                          <td className="p-3">
                            <div className="font-bold">{user ? user.fullName : 'אורח אנונימי'}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{ord.userId}</div>
                          </td>
                          <td className="p-3 text-zinc-400">{branch ? branch.branchName : ord.branchId}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.orderType === 'Pickup' ? 'bg-zinc-800 text-zinc-300' : 'bg-blue-950 text-blue-300 border border-blue-900'
                            }`}>
                              {ord.orderType === 'Pickup' ? 'איסוף עצמי' : 'משלוח'}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-red-400">₪{ord.totalPrice}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                              ord.status === 'Pending' ? 'bg-yellow-950 text-yellow-400 border border-yellow-900' :
                              ord.status === 'Preparing' ? 'bg-orange-950 text-orange-400 border border-orange-900 animate-pulse' :
                              ord.status === 'Ready' ? 'bg-green-950 text-green-400 border border-green-900' :
                              'bg-zinc-900 text-zinc-500'
                            }`}>
                              {ord.status === 'Pending' ? 'ממתין לקבלה' :
                               ord.status === 'Preparing' ? 'בהכנה...' :
                               ord.status === 'Ready' ? 'מוכן לאיסוף!' : 'נאסף'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.orderId, 'Preparing')}
                                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-2 py-1 rounded text-[10px] transition-all"
                              >
                                הכן
                              </button>
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.orderId, 'Ready')}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold px-2 py-1 rounded text-[10px] transition-all"
                              >
                                מוכן!
                              </button>
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.orderId, 'Collected')}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-2 py-1 rounded text-[10px] transition-all"
                              >
                                נאסף
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TABLE: USERS */}
          {activeTable === 'users' && (
            <div className="space-y-6">
              
              <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold">
                      <th className="p-3">userId (UUID)</th>
                      <th className="p-3">שם מלא</th>
                      <th className="p-3">אימייל (EMAIL)</th>
                      <th className="p-3">טלפון</th>
                      <th className="p-3">פעיל / לא פעיל</th>
                      <th className="p-3">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.userId} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                        <td className="p-3 font-mono text-zinc-500">{u.userId}</td>
                        <td className="p-3 font-bold text-white">{u.fullName}</td>
                        <td className="p-3 font-mono text-zinc-300">{u.email}</td>
                        <td className="p-3 text-zinc-400">{u.phone || 'אין'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.isActive ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'
                          }`}>
                            {u.isActive ? 'פעיל' : 'מנוטרל'}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteUser(u.userId)}
                            className="text-zinc-500 hover:text-red-500 p-1 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TABLE: BRANCHES */}
          {activeTable === 'branches' && (
            <div className="space-y-6">
              
              {/* Creator Form */}
              <form onSubmit={handleAddBranch} className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                  <Plus className="w-4 h-4 text-green-500" />
                  <h3 className="text-xs font-bold">הוספת סניף חדש לטבלה (INSERT INTO branches)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">שם הסניף</label>
                    <input
                      type="text"
                      required
                      value={newBranch.branchName}
                      onChange={(e) => setNewBranch({ ...newBranch, branchName: e.target.value })}
                      placeholder="למשל: ארומה רבי דוד אלקיים"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">עיר</label>
                    <input
                      type="text"
                      required
                      value={newBranch.city}
                      onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                      placeholder="למשל: אשדוד"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">רחוב ומספר</label>
                    <input
                      type="text"
                      value={newBranch.street}
                      onChange={(e) => setNewBranch({ ...newBranch, street: e.target.value })}
                      placeholder="רבי דוד אלקיים 10"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">טלפון סניף</label>
                    <input
                      type="text"
                      value={newBranch.phone}
                      onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                      placeholder="08-8504030"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">שעות פתיחה</label>
                    <input
                      type="text"
                      value={newBranch.openingHours}
                      onChange={(e) => setNewBranch({ ...newBranch, openingHours: e.target.value })}
                      placeholder="07:00 - 23:00"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2 px-5 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    הוסף סניף
                  </button>
                </div>
              </form>

              <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold">
                      <th className="p-3">branchId (UUID)</th>
                      <th className="p-3">שם סניף</th>
                      <th className="p-3">עיר</th>
                      <th className="p-3">כתובת</th>
                      <th className="p-3">טלפון</th>
                      <th className="p-3">שעות פתיחה</th>
                      <th className="p-3">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchesList.map(b => (
                      <tr key={b.branchId} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                        <td className="p-3 font-mono text-zinc-500">{b.branchId}</td>
                        <td className="p-3 font-bold text-white">{b.branchName}</td>
                        <td className="p-3 text-zinc-300">{b.city}</td>
                        <td className="p-3 text-zinc-400">{b.street || 'לא צוין'}</td>
                        <td className="p-3 font-mono text-zinc-300">{b.phone || 'אין'}</td>
                        <td className="p-3 text-zinc-400">{b.openingHours}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteBranch(b.branchId)}
                            className="text-zinc-500 hover:text-red-500 p-1 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TABLE: CATEGORIES */}
          {activeTable === 'categories' && (
            <div className="space-y-6">
              
              {/* Creator Form */}
              <form onSubmit={handleAddCategory} className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                  <Plus className="w-4 h-4 text-purple-500" />
                  <h3 className="text-xs font-bold">הוספת קטגוריה חדשה (INSERT INTO categories)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">שם הקטגוריה</label>
                    <input
                      type="text"
                      required
                      value={newCategory.categoryName}
                      onChange={(e) => setNewCategory({ ...newCategory, categoryName: e.target.value })}
                      placeholder="למשל: כריכים בריאותיים"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">סדר תצוגה</label>
                    <input
                      type="number"
                      value={newCategory.displayOrder}
                      onChange={(e) => setNewCategory({ ...newCategory, displayOrder: Number(e.target.value) })}
                      placeholder="1"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white font-black py-2 px-5 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    הוסף קטגוריה
                  </button>
                </div>
              </form>

              <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold">
                      <th className="p-3">categoryId (UUID)</th>
                      <th className="p-3">שם קטגוריה</th>
                      <th className="p-3">סדר תצוגה</th>
                      <th className="p-3">פעיל / לא פעיל</th>
                      <th className="p-3">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriesList.map(c => (
                      <tr key={c.categoryId} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                        <td className="p-3 font-mono text-zinc-500">{c.categoryId}</td>
                        <td className="p-3 font-bold text-white">{c.categoryName}</td>
                        <td className="p-3 font-mono text-zinc-300">{c.displayOrder || 0}</td>
                        <td className="p-3">
                          <span className="bg-green-950 text-green-400 px-2 py-0.5 rounded text-[10px]">פעיל</span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteCategory(c.categoryId)}
                            className="text-zinc-500 hover:text-red-500 p-1 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TABLE: COUPONS */}
          {activeTable === 'coupons' && (
            <div className="space-y-6">
              
              {/* Creator Form */}
              <form onSubmit={handleAddCoupon} className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                  <Plus className="w-4 h-4 text-yellow-500" />
                  <h3 className="text-xs font-bold">הוספת קופון הנחה חדש (INSERT INTO coupons)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">קוד קופון</label>
                    <input
                      type="text"
                      required
                      value={newCoupon.couponCode}
                      onChange={(e) => setNewCoupon({ ...newCoupon, couponCode: e.target.value.toUpperCase() })}
                      placeholder="למשל: SHISHI15"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">סוג הנחה</label>
                    <select
                      value={newCoupon.discountType}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as any })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="Percentage">אחוזים (Percentage)</option>
                      <option value="Fixed">סכום קבוע (Fixed Amount)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">ערך ההנחה</label>
                    <input
                      type="number"
                      required
                      value={newCoupon.discountValue || ''}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                      placeholder="15"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1">מינימום הזמנה</label>
                    <input
                      type="number"
                      value={newCoupon.minimumOrder || ''}
                      onChange={(e) => setNewCoupon({ ...newCoupon, minimumOrder: Number(e.target.value) })}
                      placeholder="40"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white font-black py-2 px-5 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    הוסף קופון הנחה
                  </button>
                </div>
              </form>

              <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold">
                      <th className="p-3">couponId (UUID)</th>
                      <th className="p-3">קוד קופון</th>
                      <th className="p-3">סוג הנחה</th>
                      <th className="p-3">ערך</th>
                      <th className="p-3">מינימום קנייה</th>
                      <th className="p-3">פעיל / לא פעיל</th>
                      <th className="p-3">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couponsList.map(c => (
                      <tr key={c.couponId} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                        <td className="p-3 font-mono text-zinc-500">{c.couponId}</td>
                        <td className="p-3 font-bold text-yellow-400 font-mono text-sm tracking-wider">{c.couponCode}</td>
                        <td className="p-3 text-zinc-300">{c.discountType === 'Percentage' ? 'אחוזים' : 'סכום קבוע'}</td>
                        <td className="p-3 font-bold text-white">
                          {c.discountType === 'Percentage' ? `${c.discountValue}%` : `₪${c.discountValue}`}
                        </td>
                        <td className="p-3 font-mono text-zinc-400">₪{c.minimumOrder || 0}</td>
                        <td className="p-3">
                          <span className="bg-green-950 text-green-400 px-2 py-0.5 rounded text-[10px]">פעיל</span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteCoupon(c.couponId)}
                            className="text-zinc-500 hover:text-red-500 p-1 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
