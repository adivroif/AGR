/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import ProductCard from './components/ProductCard.tsx';
import CustomizationModal from './components/CustomizationModal.tsx';
import Cart from './components/Cart.tsx';
import OrderBoard from './components/OrderBoard.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import { Product, CartItem, Order, Category, Coupon, BASE_URL } from './types.ts';
import { Coffee, Search, Utensils, Grid, RefreshCw, Sparkles, Home, MapPin, Clock, Phone, Ticket, ShoppingCart, Check, Copy, Tag, Percent, Plus } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'menu' | 'board'>('menu');
  const [menuView, setMenuView] = useState<'home' | 'products' | 'coupons' | 'cart'>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Customization modal state
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  // SQL-backed real user and cart session state
  const [currentUserId, setCurrentUserId] = useState<string>(localStorage.getItem('aroma_userId') || '');
  const [currentCartId, setCurrentCartId] = useState<string>(localStorage.getItem('aroma_cartId') || '');
  const [currentUserName, setCurrentUserName] = useState<string>(localStorage.getItem('aroma_userName') || '');

  // Copied coupon feedback state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // DB Coupons state
  const [dbCoupons, setDbCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState<boolean>(false);

  const loadUserCoupons = async (userNameToUse?: string) => {
    const activeUserName = userNameToUse || currentUserName || localStorage.getItem('aroma_userName') || '';
    if (!activeUserName) {
      setDbCoupons([]);
      return;
    }
    setCouponsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/Coupons`);
      if (res.ok) {
        const allCoupons: Coupon[] = await res.json();
        
        // Match coupons for active user:
        const normalizedUser = activeUserName.toLowerCase().replace(/\s+/g, '');
        const firstName = activeUserName.split(' ')[0].toLowerCase();

        let matched = allCoupons.filter(c => {
          if (!c.isActive) return false;
          const code = c.couponCode.toLowerCase();
          return code.includes(normalizedUser) || code.includes(firstName) || normalizedUser.includes(code) || firstName.includes(code);
        });

        // If no matching coupons exist, seed them!
        if (matched.length === 0) {
          const seedCoupons = [
            {
              couponCode: `AGR10_${firstName.toUpperCase()}`,
              discountType: 'Percentage',
              discountValue: 10,
              minimumOrder: 30,
              isActive: true,
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              maxUsage: 100
            },
            {
              couponCode: `COFFEE5_${firstName.toUpperCase()}`,
              discountType: 'Fixed',
              discountValue: 5,
              minimumOrder: 20,
              isActive: true,
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              maxUsage: 100
            }
          ];

          const createdCoupons: Coupon[] = [];
          for (const couponData of seedCoupons) {
            try {
              const postRes = await fetch(`${BASE_URL}/api/Coupons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(couponData)
              });
              if (postRes.ok) {
                const created = await postRes.json();
                if (created) createdCoupons.push(created);
              }
            } catch (postErr) {
              console.error('Error seeding coupon:', postErr);
            }
          }

          if (createdCoupons.length > 0) {
            matched = createdCoupons;
          }
        }

        setDbCoupons(matched);
      }
    } catch (err) {
      console.error('Error loading coupons:', err);
    } finally {
      setCouponsLoading(false);
    }
  };

  // Load products catalog and categories from our API
  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${BASE_URL}/api/Products`),
        fetch(`${BASE_URL}/api/Categories`)
      ]);
      
      if (prodRes.ok) {
        let prodData = await prodRes.json();
        // Normalize products
        prodData = prodData.map((p: any) => ({
          ...p,
          price: p.price !== undefined ? Number(p.price) : (p.productPrice !== undefined ? Number(p.productPrice) : 0),
          productPrice: p.productPrice !== undefined ? Number(p.productPrice) : (p.price !== undefined ? Number(p.price) : 0),
          productDescription: p.productDescription !== undefined ? p.productDescription : (p.productDisplayTitle || '')
        }));
        setProducts(prodData);
        setFilteredProducts(prodData);
      }
      if (catRes.ok) {
        let catData = await catRes.json();
        // Normalize categories
        catData = catData.map((c: any) => ({
          ...c,
          image_url: c.image_url !== undefined ? c.image_url : (c.imageUrl !== undefined ? c.imageUrl : ''),
          imageUrl: c.imageUrl !== undefined ? c.imageUrl : (c.image_url !== undefined ? c.image_url : '')
        }));
        setCategories(catData);
      }
    } catch (err) {
      console.error('Error fetching catalog data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCart = async (cartIdToUse?: string) => {
    const activeCartId = cartIdToUse || currentCartId;
    if (!activeCartId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/CartItems/cart/${activeCartId}`);
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      console.error('Error loading cart:', err);
    }
  };

  const initializeUserAndCart = async (usernameToUse?: string) => {
    try {
      let userName = usernameToUse || localStorage.getItem('aroma_userName') || '';
      let userId = '';
      let cartId = '';

      if (!userName) {
        // No user is logged in, reset states
        setCurrentUserId('');
        setCurrentUserName('');
        setCurrentCartId('');
        setCart([]);
        return;
      }

      // Fetch user info by name to ensure they exist and get their ID
      const userRes = await fetch(`${BASE_URL}/api/Users/fullName/${encodeURIComponent(userName)}`);
      if (userRes.ok) {
        const usersList = await userRes.json();
        if (Array.isArray(usersList) && usersList.length > 0) {
          const matchedUser = usersList[0];
          userId = matchedUser.userId;
          setCurrentUserId(userId);
          setCurrentUserName(matchedUser.fullName);
          localStorage.setItem('aroma_userId', userId);
          localStorage.setItem('aroma_userName', matchedUser.fullName);
        } else {
          // Fallback: search locally in all users (just in case)
          const allUsersRes = await fetch(`${BASE_URL}/api/Users`);
          if (allUsersRes.ok) {
            const allUsers = await allUsersRes.json();
            if (Array.isArray(allUsers)) {
              const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, ' ').trim();
              const targetNormalized = normalize(userName);
              const matchedUser = allUsers.find(
                (u: any) => normalize(u.fullName || '') === targetNormalized
              );
              if (matchedUser) {
                userId = matchedUser.userId;
                setCurrentUserId(userId);
                setCurrentUserName(matchedUser.fullName);
                localStorage.setItem('aroma_userId', userId);
                localStorage.setItem('aroma_userName', matchedUser.fullName);
              }
            }
          }
        }
      }

      if (!userId) {
        // If user not found in DB, clear localStorage
        localStorage.removeItem('aroma_userId');
        localStorage.removeItem('aroma_userName');
        localStorage.removeItem('aroma_cartId');
        setCurrentUserId('');
        setCurrentUserName('');
        setCurrentCartId('');
        setCart([]);
        return;
      }

      // 2. Now get or create the cart associated with this user on Azure DB
      const cartRes = await fetch(`${BASE_URL}/api/Carts/user/${userId}`);
      if (cartRes.ok) {
        const userCart = await cartRes.json();
        if (userCart && userCart.cartId) {
          cartId = userCart.cartId;
        }
      }

      if (!cartId) {
        // Fetch first branch ID to associate with the cart
        let branchId = 'b1';
        const branchRes = await fetch(`${BASE_URL}/api/Branches`);
        if (branchRes.ok) {
          const branchesList = await branchRes.json();
          if (Array.isArray(branchesList) && branchesList.length > 0) {
            branchId = branchesList[0].branchId;
          }
        }

        // Create a new cart on Azure DB
        const createCartRes = await fetch(`${BASE_URL}/api/Carts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            branchId
          })
        });
        if (createCartRes.ok) {
          const newCart = await createCartRes.json();
          cartId = newCart.cartId;
        }
      }

      if (cartId) {
        localStorage.setItem('aroma_cartId', cartId);
        setCurrentCartId(cartId);
        // Load the items for this cart
        await loadCart(cartId);
      }
    } catch (err) {
      console.error('Error initializing user and cart:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aroma_userId');
    localStorage.removeItem('aroma_userName');
    localStorage.removeItem('aroma_cartId');
    setCurrentUserId('');
    setCurrentUserName('');
    setCurrentCartId('');
    setCart([]);
  };

  useEffect(() => {
    loadCatalog();
    initializeUserAndCart();
  }, [activeTab]);

  useEffect(() => {
    if (currentUserName) {
      loadUserCoupons();
    }
  }, [currentUserName, menuView]);

  // Sync / Filter products list based on category and query
  useEffect(() => {
    let result = products;
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.categoryId === selectedCategory);
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        p => 
          (p.productName && p.productName.toLowerCase().includes(query)) || 
          (p.productDescription && p.productDescription.toLowerCase().includes(query))
      );
    }
    setFilteredProducts(result);
  }, [selectedCategory, searchQuery, products]);

  // Fetch recent user orders from SQL tables to show in Live status board
  const fetchUserOrders = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/Orders`);
      if (res.ok) {
        const data = await res.json();
        // Sort newest first
        const sorted = data.sort((a: any, b: any) => b.orderNumber - a.orderNumber);
        setUserOrders(sorted);
      }
    } catch (e) {
      console.error('Error loading orders:', e);
    }
  };

  useEffect(() => {
    fetchUserOrders();
    // Poll for status updates
    const timer = setInterval(fetchUserOrders, 5000);
    return () => clearInterval(timer);
  }, []);

  // Cart operations (synchronized with backend DB)
  const handleAddToCart = async (newItem: CartItem) => {
    if (!currentCartId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/CartItems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId: currentCartId,
          productId: newItem.productId,
          productName: newItem.productName,
          quantity: newItem.quantity,
          unitPrice: newItem.unitPrice,
          notes: newItem.notes
        })
      });
      if (res.ok) {
        await loadCart(currentCartId);
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (!currentCartId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/CartItems/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
      if (res.ok) {
        await loadCart(currentCartId);
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!currentCartId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/CartItems/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadCart(currentCartId);
      }
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  const handleClearCart = async () => {
    if (!currentCartId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Carts/${currentCartId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCart([]);
        localStorage.removeItem('aroma_cartId');
        setCurrentCartId('');
        await initializeUserAndCart();
        fetchUserOrders(); // immediately update list on checkout completed
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  // Mark order as collected
  const handleCollectOrder = async (orderId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/Orders/${orderId}/status?status=Collected`, {
        method: 'PUT'
      });
      if (response.ok) {
        // Update local user order status
        fetchUserOrders();
      }
    } catch (err) {
      console.error('Error collecting order:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-zinc-50 to-yellow-50/20 text-zinc-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Universal Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)} 
        currentUserName={currentUserName}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* --- MENU VIEW --- */}
        {activeTab === 'menu' && (
          !currentUserName ? (
            <LoginScreen onLoginSuccess={async (userId, userName) => {
              await initializeUserAndCart(userName);
              loadUserCoupons(userName);
            }} />
          ) : (
            <div className="space-y-6 pb-20" dir="rtl">
              
              {/* Copied Coupon Alert Banner */}
              {copiedCode && (
                <div className="fixed top-4 left-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-yellow-500 text-white font-black text-xs py-3 px-5 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-yellow-300" />
                    <span>קוד קופון <strong className="font-mono text-sm underline">{copiedCode}</strong> הועתק בהצלחה! הדבק אותו בסל הקניות.</span>
                  </div>
                  <button onClick={() => setCopiedCode(null)} className="text-white/80 hover:text-white font-bold">✕</button>
                </div>
              )}

              {/* Yellow and Blue premium promo banner */}
              <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-yellow-500 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden animate-in fade-in duration-500">
                {/* Decorative graphic blur circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16 blur-xl pointer-events-none"></div>
                
                <div className="space-y-2 text-right relative z-10">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-yellow-300 border border-white/10">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>חווית קפה פרימיום בצהוב וכחול באשדוד</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-none text-white">הקפה המובחר ביותר בסביבה! ☕️</h2>
                  <p className="text-xs text-white/95 max-w-2xl leading-relaxed">
                    קפה איכותי וטרי שנקלה באהבה, מאפים חמים ישר מהתנור, כריכים וסלטים בריאים ורעננים שמורכבים אצלנו ברגע ההזמנה.
                  </p>
                </div>
                <div className="flex gap-3 relative z-10 shrink-0">
                  <button 
                    onClick={() => setMenuView('coupons')}
                    className="bg-yellow-400 hover:bg-yellow-350 text-blue-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow-lg transform rotate-3 hover:rotate-0 transition-all duration-300 cursor-pointer active:scale-95"
                  >
                    🎁 צפה בקופונים!
                  </button>
                </div>
              </div>

              {/* Subview Renders */}
              
              {/* --- VIEW 1: HOME PAGE (BRANCH DETAILS) --- */}
              {menuView === 'home' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Welcome greeting */}
                    <div className="bg-white border border-zinc-200 shadow-sm p-6 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                          <Home className="w-6 h-6" />
                        </span>
                        <div>
                          <h3 className="text-lg font-black text-zinc-950">ברוכים הבאים ל-AGR Espresso Bar</h3>
                          <p className="text-xs text-zinc-500">סניף רבי דוד אלקיים הדגל☕</p>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        בסניף הדגל של אספרסו בר AGR אנו מביאים אליכם את פולי הקפה האיכותיים ביותר, בקלייה מקומית קפדנית, יחד עם מאפים חמים הנאפים במקום לאורך כל היום, כריכים רעננים, סלטים בריאים, קינוחים מעולים וחווית שירות ייחודית בצהוב וכחול.
                      </p>
                    </div>

                    {/* Quick Access Action Buttons (The requested 2 Buttons for New Order / Add Products) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => setMenuView('products')}
                        className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-3xl shadow-md border border-blue-500/10 text-right space-y-3 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
                      >
                        <div className="bg-white/20 w-10 h-10 rounded-2xl flex items-center justify-center text-yellow-300 group-hover:scale-110 transition-transform">
                          <Coffee className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm">הזמנה חדשה מהירה</h4>
                          <p className="text-[11px] text-white/80 mt-1">לחצו כאן כדי להתחיל לבנות את הזמנת הקפה והמאפה המושלמת שלכם</p>
                        </div>
                        <div className="inline-flex items-center gap-1 text-[11px] font-black text-yellow-300 bg-white/15 px-3 py-1 rounded-full">
                          <span>התחל הזמנה</span>
                          <span>←</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setMenuView('products')}
                        className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 text-blue-950 p-6 rounded-3xl shadow-md border border-yellow-300/10 text-right space-y-3 cursor-pointer hover:shadow-lg hover:shadow-yellow-500/10 transition-all group"
                      >
                        <div className="bg-blue-950/10 w-10 h-10 rounded-2xl flex items-center justify-center text-blue-950 group-hover:scale-110 transition-transform">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm">הוספת מוצרים לסל</h4>
                          <p className="text-[11px] text-blue-950/80 mt-1">גלו את התפריט הדיגיטלי המלא והוסיפו כריכים וסלטים טריים</p>
                        </div>
                        <div className="inline-flex items-center gap-1 text-[11px] font-black text-blue-950 bg-blue-950/10 px-3 py-1 rounded-full">
                          <span>לצפייה בתפריט</span>
                          <span>←</span>
                        </div>
                      </button>
                    </div>

                    {/* Branch detailed specifications */}
                    <div className="bg-white border border-zinc-200 shadow-sm rounded-3xl p-6 space-y-5">
                      <h4 className="text-sm font-black text-zinc-950 border-b border-zinc-100 pb-2">פרטי הסניף ויצירת קשר</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-bold text-xs text-zinc-800">שעות פעילות</h5>
                            <ul className="text-[11px] text-zinc-500 mt-1 space-y-0.5 leading-relaxed">
                              <li>חמישי: 17:00 - 08:00</li>
                            </ul>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-bold text-xs text-zinc-800">כתובתנו</h5>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                             רבי דוד אלקיים 5, אשדוד, חנייה ללקוחות הבניין בלבד.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-bold text-xs text-zinc-800">טלפון לבירורים</h5>
                            <p className="text-[11px] text-zinc-500 mt-1">
                              054-5250413
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="text-base text-blue-600 shrink-0 mt-0.5">🎖️</span>
                          <div>
                            <h5 className="font-bold text-xs text-zinc-800">כשרות הסניף</h5>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                              כשר למהדרין, חלב ישראל, בהשגחת רבנות אשדוד.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Cool interactive Map mockup card */}
                      <div className="bg-gradient-to-tr from-blue-50 to-yellow-50 rounded-2xl border border-zinc-200/60 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-bold text-zinc-800">ניווט מהיר עם Waze</p>
                          <p className="text-[10px] text-zinc-500">לחצו לקבלת מסלול נסיעה ישיר לאספרסו בר AGR אשדוד</p>
                        </div>
                        <a 
                          href="https://waze.com/ul?q=רבי דוד אלקיים אשדוד" 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1 shrink-0"
                        >
                          <span>🚗 סע ב-Waze</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Desktop view sidebar Cart */}
                  <div className="hidden lg:block lg:col-span-1">
                    <Cart 
                      cart={cart}
                      products={products}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemoveItem={handleRemoveItem}
                      onClearCart={handleClearCart}
                      currentUserName={currentUserName}
                      currentUserId={currentUserId}
                    />
                  </div>
                </div>
              )}

              {/* --- VIEW 2: PRODUCTS MENU --- */}
              {menuView === 'products' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                  <div className="lg:col-span-2 space-y-5">
                    {/* Category selector & Search bar row */}
                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
                      
                      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                        <h3 className="text-base font-black text-zinc-950 flex items-center gap-2">
                          <span className="bg-gradient-to-tr from-blue-600 to-yellow-400 p-1.5 rounded-lg text-white flex items-center justify-center">
                            <Coffee className="w-4 h-4" />
                          </span>
                          <span className="bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">תפריט אספרסו בר דיגיטלי</span>
                        </h3>
                        
                        {/* Search Bar */}
                        <div className="relative">
                          <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-zinc-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="חפש קפה, כריך, סלט או מאפה..."
                            className="bg-zinc-50 border border-zinc-200 rounded-xl py-2 pl-4 pr-10 text-xs text-zinc-900 focus:outline-none focus:border-blue-500 placeholder-zinc-400 w-full sm:w-64 transition-all"
                          />
                        </div>
                      </div>

                      {/* Categories filtering buttons with vibrant custom gradients */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-100">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            selectedCategory === 'all'
                              ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md shadow-blue-500/30 scale-105'
                              : 'bg-zinc-100/80 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 border border-zinc-200'
                          }`}
                        >
                          הכל ({products.length})
                        </button>
                        
                        {categories.map((cat) => {
                          // Pick a custom category color based on yellow and blue
                          let activeStyle = 'bg-blue-600 text-white';
                          if (cat.categoryId === 'c1') {
                            activeStyle = 'bg-gradient-to-r from-blue-600 to-blue-700 text-yellow-300 shadow-md shadow-blue-500/30 scale-105';
                          } else if (cat.categoryId === 'c2') {
                            activeStyle = 'bg-gradient-to-r from-yellow-400 to-amber-500 text-blue-950 shadow-md shadow-yellow-500/30 scale-105';
                          } else if (cat.categoryId === 'c3') {
                            activeStyle = 'bg-gradient-to-r from-blue-500 via-yellow-400 to-blue-600 text-white shadow-md shadow-blue-500/30 scale-105';
                          } else if (cat.categoryId === 'c4') {
                            activeStyle = 'bg-gradient-to-r from-amber-400 to-yellow-500 text-blue-950 shadow-md shadow-amber-500/30 scale-105';
                          }

                          return (
                            <button
                              key={cat.categoryId}
                              onClick={() => setSelectedCategory(cat.categoryId)}
                              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                selectedCategory === cat.categoryId
                                  ? activeStyle
                                  : 'bg-zinc-100/80 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 border border-zinc-200'
                              }`}
                            >
                              {cat.categoryName}
                            </button>
                          );
                        })}
                      </div>

                    </div>

                    {/* Products list grid */}
                    {loading ? (
                      <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-16 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                        <p className="text-xs">טוען את תפריט ה-DB...</p>
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-16 text-center text-zinc-500 space-y-2">
                        <Utensils className="w-10 h-10 mx-auto opacity-20 mb-2 text-blue-600" />
                        <p className="text-sm font-bold text-zinc-800">לא נמצאו מוצרים תואמים</p>
                        <p className="text-[11px] text-zinc-400">נסו לחפש מילה אחרת או לשנות את קטגוריית הסינון.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredProducts.map(product => (
                          <ProductCard 
                            key={product.productId} 
                            product={product} 
                            categories={categories}
                            onSelect={(p) => setCustomizingProduct(p)} 
                          />
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Desktop view sidebar Cart */}
                  <div className="hidden lg:block lg:col-span-1">
                    <Cart 
                      cart={cart}
                      products={products}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemoveItem={handleRemoveItem}
                      onClearCart={handleClearCart}
                      currentUserName={currentUserName}
                      currentUserId={currentUserId}
                    />
                  </div>
                </div>
              )}

              {/* --- VIEW 3: COUPONS LIST --- */}
              {menuView === 'coupons' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm space-y-4">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-black text-zinc-950">קופונים ומבצעים בלעדיים 🎁</h3>
                      </div>
                      <p className="text-xs text-zinc-500">
                        העתיקו את קוד הקופון האישי שלכם והשתמשו בו במסך ההזמנה לקבלת הנחות והטבות מיוחדות!
                      </p>
                    </div>

                    {couponsLoading ? (
                      <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                        <p className="text-xs font-bold">טוען ומסנכרן קופונים אישיים מה-DB...</p>
                      </div>
                    ) : dbCoupons.length === 0 ? (
                      <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-12 text-center text-zinc-500">
                        <p className="text-sm font-bold text-zinc-800">אין קופונים זמינים כעת</p>
                        <p className="text-[11px] text-zinc-400 mt-1">לא נמצאו קופונים המשוייכים אליך בבסיס הנתונים.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {dbCoupons.map((coupon) => (
                          <div 
                            key={coupon.couponId} 
                            className="bg-white border border-dashed border-zinc-200 hover:border-blue-500 p-5 rounded-3xl relative overflow-hidden transition-all text-right flex flex-col justify-between h-48 shadow-sm"
                          >
                            <div className="absolute top-0 left-0 w-12 h-12 bg-blue-150 rounded-br-3xl flex items-center justify-center text-blue-600 font-bold text-xs">
                              {coupon.discountType === 'Percentage' ? `${coupon.discountValue}%` : `₪${coupon.discountValue}`}
                            </div>
                            <div className="space-y-1.5 mt-2">
                              <span className="text-[10px] bg-blue-50 text-blue-600 font-black px-2.5 py-0.5 rounded-full border border-blue-100">
                                {coupon.discountType === 'Percentage' ? 'קופון אחוזים' : 'קופון הנחה בשקלים'}
                              </span>
                              <h4 className="font-black text-sm text-zinc-900">
                                הנחה של {coupon.discountType === 'Percentage' ? `${coupon.discountValue}%` : `₪${coupon.discountValue}`} בסניף
                              </h4>
                              <p className="text-[11px] text-zinc-400">
                                מינימום הזמנה של ₪{coupon.minimumOrder || 0}. בתוקף לקניות בסניף AGR אשדוד.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 mt-2">
                              <button
                                onClick={() => handleCopyCode(coupon.couponCode)}
                                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>העתק קוד</span>
                              </button>
                              <span className="font-mono text-xs font-black text-zinc-700 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200 select-all">
                                {coupon.couponCode}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Desktop view sidebar Cart */}
                  <div className="hidden lg:block lg:col-span-1">
                    <Cart 
                      cart={cart}
                      products={products}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemoveItem={handleRemoveItem}
                      onClearCart={handleClearCart}
                      currentUserName={currentUserName}
                      currentUserId={currentUserId}
                    />
                  </div>
                </div>
              )}

              {/* --- VIEW 4: MY ORDER (CART VIEW) --- */}
              {menuView === 'cart' && (
                <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
                  <div className="bg-white border border-zinc-200 p-5 rounded-3xl shadow-sm mb-4 flex items-center gap-2 text-right">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-black text-sm text-zinc-950">סל הקניות שלי</h3>
                      <p className="text-[10px] text-zinc-400">כאן תוכלו לערוך את הכמויות, להזין קופון ולשגר את ההזמנה</p>
                    </div>
                  </div>
                  <Cart 
                    cart={cart}
                    products={products}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onClearCart={handleClearCart}
                    currentUserName={currentUserName}
                    currentUserId={currentUserId}
                  />
                </div>
              )}

            </div>
        )
      )}

        {/* --- LIVE STATUS BOARD VIEW --- */}
        {activeTab === 'board' && (
          <OrderBoard 
            userOrders={userOrders.map(o => ({
              id: o.orderId,
              orderNumber: o.orderNumber.toString(),
              customerName: o.customerName || 'לקוח ארומה',
              totalAmount: o.totalPrice,
              status: o.status.toLowerCase()
            }))} 
            onCollectOrder={handleCollectOrder} 
          />
        )}

      </main>

      {/* Customize Dialog Modal (Globally overlaying when customizingProduct is set) */}
      {customizingProduct && (
        <CustomizationModal 
          product={customizingProduct} 
          categories={categories}
          onClose={() => setCustomizingProduct(null)} 
          onAddToCart={handleAddToCart} 
        />
      )}

      {/* Footer credits */}
      <footer className={`bg-white border-t border-zinc-200 py-6 text-center text-[10px] text-zinc-500 ${currentUserName && activeTab === 'menu' ? 'pb-24' : 'pb-6'}`}>
        <div className="max-w-7xl mx-auto px-4 space-y-1 font-mono uppercase tracking-widest">
          <p>© 2026 AGR ESPRESSO BAR ISRAEL</p>
        </div>
      </footer>

      {/* Sticky Bottom Navigation Bar for Mobile & Desktop quick-switching */}
      {currentUserName && activeTab === 'menu' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-zinc-200/80 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] py-2.5 px-4" dir="rtl">
          <div className="max-w-md mx-auto flex items-center justify-around">
            {/* Button 1: Home */}
            <button
              id="nav-btn-home"
              onClick={() => setMenuView('home')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                menuView === 'home'
                  ? 'text-blue-600 scale-105 font-black'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Home className={`w-5.5 h-5.5 transition-transform ${menuView === 'home' ? 'scale-110 text-blue-600' : ''}`} />
              <span className="text-[10px] leading-none">הבית</span>
            </button>

            {/* Button 2: New Order / Menu Catalog */}
            <button
              id="nav-btn-products"
              onClick={() => setMenuView('products')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                menuView === 'products'
                  ? 'text-blue-600 scale-105 font-black'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Coffee className={`w-5.5 h-5.5 transition-transform ${menuView === 'products' ? 'scale-110 text-blue-600' : ''}`} />
              <span className="text-[10px] leading-none">הזמנה חדשה</span>
            </button>

            {/* Button 3: Coupons */}
            <button
              id="nav-btn-coupons"
              onClick={() => setMenuView('coupons')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                menuView === 'coupons'
                  ? 'text-blue-600 scale-105 font-black'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Ticket className={`w-5.5 h-5.5 transition-transform ${menuView === 'coupons' ? 'scale-110 text-blue-600' : ''}`} />
              <span className="text-[10px] leading-none">קופונים</span>
            </button>

            {/* Button 4: My Order (Cart) */}
            <button
              id="nav-btn-cart"
              onClick={() => setMenuView('cart')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all relative cursor-pointer ${
                menuView === 'cart'
                  ? 'text-blue-600 scale-105 font-black'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <div className="relative">
                <ShoppingCart className={`w-5.5 h-5.5 transition-transform ${menuView === 'cart' ? 'scale-110 text-blue-600' : ''}`} />
                {cart.items && cart.items.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-yellow-400 text-blue-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                    {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-none">הסל שלי</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
