/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Trash2, Tag, Gift, MapPin, Truck, Check, Sparkles, User, AlertCircle, FileText, Calendar, Clock } from 'lucide-react';
import { CartItem, Product, Order, Branch, Coupon, User as DbUser, BASE_URL, formatTimeToBeReady } from '../types.ts';

interface CartProps {
  cart: CartItem[];
  products: Product[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  currentUserName: string;
  currentUserId: string;
}

export default function Cart({ cart, products, onUpdateQuantity, onRemoveItem, onClearCart, currentUserName, currentUserId }: CartProps) {
  // State for fields
  const [customerName, setCustomerName] = useState<string>(currentUserName || 'אורח ארומה');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('bb76b426-af84-463c-8db1-b633ffc2387b');
  const [orderType, setOrderType] = useState<'Pickup' | 'Delivery'>('Pickup');
  const [couponCode, setCouponCode] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isFutureOrder, setIsFutureOrder] = useState<boolean>(false);
  const [futureDate, setFutureDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [futureTime, setFutureTime] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  
  // Loaded lists
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string>('');
  const [couponSuccess, setCouponSuccess] = useState<boolean>(false);
  
  // Submit & success states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<any | null>(null);

  // Sync customerName when currentUserName prop changes
  useEffect(() => {
    if (currentUserName) {
      setCustomerName(currentUserName);
    }
  }, [currentUserName]);

  // Fetch branches and select Ashdod branch
  useEffect(() => {
    fetch(`${BASE_URL}/api/Branches`)
      .then(res => res.json())
      .then(data => {
        setBranches(data);
        const ashdodBranch = data.find((b: any) => b.city?.includes('אשדוד') || b.branchName?.includes('אשדוד'));
        if (ashdodBranch) {
          setSelectedBranchId(ashdodBranch.branchId);
        } else if (data.length > 0) {
          setSelectedBranchId(data[0].branchId);
        }
      })
      .catch(err => console.error('Error fetching branches:', err));
  }, []);

  // Calculate pricing
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const deliveryPrice = orderType === 'Delivery' ? 15 : 0;
  
  let discount = 0;
  if (activeCoupon) {
    const minOrder = activeCoupon.minimumOrder || 0;
    if (subtotal >= minOrder) {
      if (activeCoupon.discountType === 'Percentage') {
        discount = (subtotal * activeCoupon.discountValue) / 100;
      } else {
        discount = activeCoupon.discountValue;
      }
    }
  }

  const totalPrice = Math.max(0, subtotal + deliveryPrice - discount);

  // Apply Coupon Code
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponSuccess(false);

    try {
      const res = await fetch(`${BASE_URL}/api/Coupons/code/${couponCode.toUpperCase()}`);
      if (res.ok) {
        const coupon: Coupon = await res.json();
        
        // Match logic: Check if this coupon belongs to the logged-in user
        const normalizedUser = customerName.toLowerCase().replace(/\s+/g, '');
        const firstName = customerName.split(' ')[0].toLowerCase();
        const code = coupon.couponCode.toLowerCase();

        const belongsToUser = code.includes(normalizedUser) || code.includes(firstName) || normalizedUser.includes(code) || firstName.includes(code);

        if (!belongsToUser) {
          setCouponError('קוד קופון זה אינו משוייך למשתמש שלך');
          return;
        }

        if (subtotal < (coupon.minimumOrder || 0)) {
          setCouponError(`מינימום הזמנה לקופון זה הוא ₪${coupon.minimumOrder || 0}`);
        } else {
          setActiveCoupon(coupon);
          setCouponSuccess(true);
        }
      } else {
        setCouponError('קופון לא קיים או שפג תוקפו');
      }
    } catch (e) {
      setCouponError('שגיאה בבדיקת הקופון');
    }
  };

  // Place order
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      alert('נא להזין שם לקוח!');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Get or create user
      let userId = 'u1'; // Default
      const userCheck = await fetch(`${BASE_URL}/api/Users/fullName/${encodeURIComponent(customerName)}`);
      if (userCheck.ok) {
        const matchingUsers: DbUser[] = await userCheck.json();
        if (matchingUsers.length > 0) {
          userId = matchingUsers[0].userId;
        } else {
          // Create new user automatically on backend
          const createRes = await fetch(`${BASE_URL}/api/Users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName: customerName, email: `${Date.now()}@arg-guest.com` })
          });
          if (createRes.ok) {
            const newUser: DbUser = await createRes.json();
            userId = newUser.userId;
          }
        }
      }

      // 2. Submit the order to backend
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
          return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const generatedOrderId = generateUUID();
      const generatedOrderNumber = Math.floor(100000000 + Math.random() * 900000000); // 9-digit random order number

      const timeToBeReadyVal = isFutureOrder && futureDate && futureTime
        ? `${futureDate}T${futureTime}:00`
        : null;

      const res = await fetch(`${BASE_URL}/api/Orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: generatedOrderId,
          userId,
          branchId: selectedBranchId,
          orderNumber: generatedOrderNumber,
          status: 'Pending',
          orderType,
          subtotal: Number(subtotal),
          deliveryPrice: Number(deliveryPrice),
          discount: Number(discount),
          totalPrice: Number(totalPrice),
          couponId: activeCoupon?.couponId || null,
          estimatedReadyTime: null,
          orderDescription: orderNotes,
          timeToBeReady: timeToBeReadyVal,
          TimeToBeReady: timeToBeReadyVal,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });

      if (res.ok) {
        const placedOrder = await res.json();
        const orderId = placedOrder?.orderId || generatedOrderId;

        // 3. Submit each cart item individually as an OrderItem associated with the created order ID
        const itemPromises = cart.map(item => {
          return fetch(`${BASE_URL}/api/OrderItems`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              productId: item.productId,
              productName: item.productName || item.product?.productName || 'מוצר ארומה',
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              notes: item.notes || ''
            })
          });
        });

        // Wait for all order items to be successfully created on Azure DB
        await Promise.all(itemPromises);

        setLastPlacedOrder(placedOrder);
        onClearCart();
        setActiveCoupon(null);
        setCouponCode('');
        setCouponSuccess(false);
        setOrderNotes('');
        setIsFutureOrder(false);
      }
    } catch (err) {
      console.error('Error on checkout:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (lastPlacedOrder) {
    const selectedBranch = branches.find(b => b.branchId === lastPlacedOrder.branchId);
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-center space-y-6 text-zinc-900 shadow-sm" dir="rtl">
        <div className="flex justify-center">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-full text-blue-600 animate-bounce">
            <Check className="w-10 h-10" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-black text-zinc-950">ההזמנה נקלטה!</h3>
        </div>

        <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 space-y-3.5 text-right">
          <div className="flex justify-between items-center text-xs border-b border-zinc-200 pb-2">
            <span className="text-zinc-500">מספר הזמנה (orderNumber):</span>
            <span className="text-sm font-mono font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
              #{lastPlacedOrder.orderNumber}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs border-b border-zinc-200 pb-2">
            <span className="text-zinc-500">סניף מיועד:</span>
            <span className="font-bold text-zinc-700">{'AGR אשדוד'}</span>
          </div>
          <div className="flex justify-between items-center text-xs border-b border-zinc-200 pb-2">
            <span className="text-zinc-500">שם הלקוח בטבלה:</span>
            <span className="font-bold text-zinc-800">{customerName}</span>
          </div>
          {lastPlacedOrder.orderDescription && (
            <div className="flex flex-col text-xs border-b border-zinc-200 pb-2 gap-1">
              <span className="text-zinc-500 text-right">הערות להזמנה:</span>
              <span className="font-bold text-zinc-800 text-right bg-zinc-100 p-2 rounded-lg border border-zinc-200">{lastPlacedOrder.orderDescription}</span>
            </div>
          )}
          {(lastPlacedOrder.timeToBeReady || lastPlacedOrder.TimeToBeReady) && (
            <div className="flex flex-col text-xs border-b border-zinc-200 pb-2 gap-1">
              <span className="text-zinc-500 text-right">מועד מוכנות מבוקש (הזמנה עתידית):</span>
              <span className="font-bold text-emerald-700 text-right bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                {formatTimeToBeReady(lastPlacedOrder.timeToBeReady || lastPlacedOrder.TimeToBeReady)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">סכום סופי לתשלום:</span>
            <span className="font-mono font-black text-blue-600 text-sm">₪{lastPlacedOrder.totalPrice}</span>
          </div>
        </div>

        <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 p-3.5 rounded-xl text-[11px] leading-relaxed">
          עקבו אחר סטטוס ההזמנה שלכם במסך ה-LIVE! השרת Express מקדם את סטטוס ההכנה (Pending → Preparing → Ready) אוטומטית.
        </div>

        <button
          onClick={() => setLastPlacedOrder(null)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-yellow-300 font-black py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md hover:from-blue-700 hover:to-blue-900"
        >
          בצע הזמנה נוספת
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl flex flex-col h-full text-zinc-800 shadow-sm" dir="rtl">
      
      {/* Title */}
      <div className="p-5 border-b border-zinc-150 flex justify-between items-center bg-gradient-to-r from-blue-700 to-blue-800 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="bg-yellow-400 p-1.5 rounded-lg text-blue-950 shadow-xs flex items-center justify-center"><ShoppingBag className="w-4 h-4" /></span>
          <h3 className="text-sm font-black text-white font-sans">סל ההזמנות שלי</h3>
        </div>
        <span className="text-[10px] bg-yellow-400 text-blue-950 px-2.5 py-1 rounded-full font-black shadow-xs">
          {cart.reduce((sum, i) => sum + i.quantity, 0)} מוצרים
        </span>
      </div>

      {/* Cart Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[380px] lg:max-h-[none]">
        {cart.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 mx-auto text-zinc-300" />
            <p className="text-xs font-bold text-zinc-500">הסל שלך כרגע ריק</p>
            <p className="text-[10px] text-zinc-400">בחרו מוצרים מהתפריט והתאימו אותם לקפה שלכם.</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.cartItemId} className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h4 className="text-xs font-black text-zinc-900">{item.productName || item.product?.productName || 'מוצר ארומה'}</h4>
                  {item.notes && (
                    <p className="text-[10px] text-zinc-400 mt-1 italic">
                      {item.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveItem(item.cartItemId)}
                  className="text-zinc-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-zinc-150">
                <span className="text-xs font-bold text-blue-600">₪{item.unitPrice * item.quantity}</span>
                
                {/* Quantity Editor */}
                <div className="flex items-center gap-2.5 bg-white px-2.5 py-1 rounded-lg border border-zinc-200 shadow-sm">
                  <button
                    onClick={() => onUpdateQuantity(item.cartItemId, Math.max(1, item.quantity - 1))}
                    className="text-zinc-400 hover:text-zinc-900 font-bold text-xs cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-[11px] font-mono font-bold text-zinc-800 w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                    className="text-zinc-400 hover:text-zinc-900 font-bold text-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Checkout Config & Pricing Form */}
      {cart.length > 0 && (
        <div className="p-5 border-t border-zinc-200 bg-zinc-50 rounded-b-2xl space-y-4">
          
          {/* Form settings */}
          <form onSubmit={handleCheckout} className="space-y-3.5">
            
            {/* User field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-blue-600" />
                <span>שם הלקוח להזמנה</span>
              </label>
              <input
                type="text"
                disabled
                value={customerName}
                className="w-full bg-zinc-100 border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-500 font-black cursor-not-allowed"
              />
            </div>

            {/* Order Type Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('Pickup')}
                className={`p-2.5 rounded-xl text-xs font-black border transition-all duration-300 cursor-pointer ${
                  orderType === 'Pickup'
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-blue-950 shadow-lg shadow-yellow-500/20 border-transparent scale-105'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                🚴 איסוף עצמי (₪0)
              </button>
              <button
                type="button"
                onClick={() => setOrderType('Delivery')}
                className={`p-2.5 rounded-xl text-xs font-black border transition-all duration-300 cursor-pointer ${
                  orderType === 'Delivery'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 border-transparent scale-105'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                🚚 משלוח (+₪15)
              </button>
            </div>

            {/* Future Order Toggle and Picker */}
            <div className="space-y-2 border border-zinc-200 bg-white p-3.5 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black text-zinc-800">הזמנה עתידית</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFutureOrder(!isFutureOrder)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isFutureOrder ? 'bg-emerald-500' : 'bg-zinc-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isFutureOrder ? '-translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isFutureOrder && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>תאריך</span>
                    </label>
                    <input
                      type="date"
                      value={futureDate}
                      onChange={(e) => setFutureDate(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-bold text-zinc-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>שעה</span>
                    </label>
                    <input
                      type="time"
                      value={futureTime}
                      onChange={(e) => setFutureTime(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-bold text-zinc-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Order Notes (orderDescription) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3 h-3 text-blue-600" />
                <span>הערות להזמנה</span>
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="למשל: לארוז בנפרד, לשים רטבים בצד, ללא בצל..."
                rows={2}
                className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 resize-none font-bold"
              />
            </div>

            {/* Coupon field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-yellow-500" />
                <span>קוד קופון הנחה</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="למשל: ARG10"
                  className="flex-1 bg-white border border-zinc-200 rounded-lg p-2 text-xs font-mono uppercase text-zinc-900 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold px-3 rounded-lg text-xs border border-zinc-300 cursor-pointer"
                >
                  החל
                </button>
              </div>
              {couponError && <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5"><AlertCircle className="w-3 h-3" /> {couponError}</p>}
              {couponSuccess && activeCoupon && (
                <div className="p-2 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg text-[10px] font-bold flex items-center gap-1.5 mt-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                  <span>קופון {activeCoupon.couponCode} הוחל בהצלחה! הנחה של {activeCoupon.discountType === 'Percentage' ? `${activeCoupon.discountValue}%` : `₪${activeCoupon.discountValue}`}</span>
                </div>
              )}
            </div>

            <hr className="border-zinc-200 my-3" />

            {/* Price lines */}
            <div className="space-y-1.5 text-xs text-zinc-500 font-bold">
              <div className="flex justify-between">
                <span>סיכום ביניים (subtotal):</span>
                <span>₪{subtotal}</span>
              </div>
              {orderType === 'Delivery' && (
                <div className="flex justify-between">
                  <span>דמי משלוח (deliveryPrice):</span>
                  <span>₪15</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-yellow-600 bg-yellow-50/50 p-1 rounded">
                  <span>הנחה (discount):</span>
                  <span>-₪{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-900 text-sm font-black pt-2 border-t border-zinc-200 items-center">
                <span>סה"כ לתשלום (totalPrice):</span>
                <span className="text-xl font-black text-blue-600 font-mono">₪{totalPrice}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 border border-yellow-400 hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 text-yellow-300 font-black py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>שלח הזמנה</span>
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
