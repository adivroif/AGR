/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Tv, CheckCircle, Flame, Gift, RefreshCw, Sparkles, UserCheck, Eye, EyeOff } from 'lucide-react';
import { Order, formatTimeToBeReady } from '../types.ts';

interface OrderBoardProps {
  userOrders: any[];
  onCollectOrder: (orderId: string) => void;
  currentUserId: string;
}

interface BoardOrder {
  orderNumber: string;
  customerName: string;
  source: 'user' | 'sim';
  id: string;
  userId?: string;
  orderDescription?: string;
  timeToBeReady?: string;
}

export default function OrderBoard({ userOrders, onCollectOrder, currentUserId }: OrderBoardProps) {
  const [preparingOrders, setPreparingOrders] = useState<BoardOrder[]>([]);
  const [readyOrders, setReadyOrders] = useState<BoardOrder[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // States to hold expanded order states, fetched order items cache, and loader states
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [orderItemsCache, setOrderItemsCache] = useState<Record<string, any[]>>({});
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  const fetchBoardData = async () => {
    setIsRefreshing(true);
    try {
      const BASE_URL = 'https://aromaapplication-gqgscbffcmgeffdk.westeurope-01.azurewebsites.net';
      const [ordersRes, usersRes] = await Promise.all([
        fetch(`${BASE_URL}/api/Orders`),
        fetch(`${BASE_URL}/api/Users`)
      ]);
      
      if (ordersRes.ok && usersRes.ok) {
        const liveOrders: Order[] = await ordersRes.json();
        const liveUsers: any[] = await usersRes.json();
        
        const prep = liveOrders
          .filter(o => o.status === 'Pending' || o.status === 'Preparing')
          .map(o => {
            const u = liveUsers.find(user => user.userId === o.userId);
            return {
              orderNumber: o.orderNumber.toString(),
              customerName: u ? u.fullName : 'אורח ארומה',
              source: 'user' as const,
              id: o.orderId,
              userId: o.userId,
              orderDescription: o.orderDescription,
              timeToBeReady: o.timeToBeReady || o.TimeToBeReady
            };
          });

        const rd = liveOrders
          .filter(o => o.status === 'Ready')
          .map(o => {
            const u = liveUsers.find(user => user.userId === o.userId);
            return {
              orderNumber: o.orderNumber.toString(),
              customerName: u ? u.fullName : 'אורח ארומה',
              source: 'user' as const,
              id: o.orderId,
              userId: o.userId,
              orderDescription: o.orderDescription,
              timeToBeReady: o.timeToBeReady || o.TimeToBeReady
            };
          });
          
        setPreparingOrders(prep);
        setReadyOrders(rd);
      }
    } catch (err) {
      console.error('Error fetching board data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleOrderDetails = async (orderId: string) => {
    if (expandedOrders[orderId]) {
      setExpandedOrders(prev => ({ ...prev, [orderId]: false }));
      return;
    }

    setExpandedOrders(prev => ({ ...prev, [orderId]: true }));

    if (!orderItemsCache[orderId]) {
      setLoadingItems(prev => ({ ...prev, [orderId]: true }));
      try {
        const BASE_URL = 'https://aromaapplication-gqgscbffcmgeffdk.westeurope-01.azurewebsites.net';
        const res = await fetch(`${BASE_URL}/api/OrderItems/order/${orderId}`);
        if (res.ok) {
          const items = await res.json();
          setOrderItemsCache(prev => ({ ...prev, [orderId]: items }));
        }
      } catch (err) {
        console.error('Error fetching order items:', err);
      } finally {
        setLoadingItems(prev => ({ ...prev, [orderId]: false }));
      }
    }
  };

  const handleMoveToReady = async (orderId: string) => {
    try {
      const BASE_URL = 'https://aromaapplication-gqgscbffcmgeffdk.westeurope-01.azurewebsites.net';
      const response = await fetch(`${BASE_URL}/api/Orders/${orderId}/status?status=Ready`, {
        method: 'PUT'
      });
      if (response.ok) {
        fetchBoardData();
      }
    } catch (err) {
      console.error('Error moving order to ready:', err);
    }
  };

  // Poll for status board updates every 4 seconds to make it highly reactive
  useEffect(() => {
    fetchBoardData();
    const interval = setInterval(fetchBoardData, 4000);
    return () => clearInterval(interval);
  }, [userOrders]);

  const handleManualRefresh = () => {
    fetchBoardData();
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Intro Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600/10 via-yellow-400/5 to-blue-700/10 p-6 rounded-3xl border border-blue-200/40 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div className="space-y-2 text-right">
          <div className="flex items-center gap-2 text-blue-600 font-black text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
            <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-100">סנכרון חי מול סניף רבי דוד אלקיים, אשדוד</span>
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-zinc-950 to-zinc-800 bg-clip-text text-transparent font-sans">לוח הזמנות דיגיטלי - LIVE</h2>
          <p className="text-xs text-zinc-600 max-w-xl leading-relaxed">
            הקפה בדרך! כאשר שמכם ומספר ההזמנה שלכם יופיעו בעמודה הכחולה של <span className="text-blue-600 font-extrabold underline decoration-yellow-400">מוכן לאיסוף</span>, אתם מוזמנים לגשת לדלפק או ללחוץ על "איסוף הזמנה" למטה.
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 bg-white/90 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 px-5 py-2.5 rounded-2xl text-xs font-black text-zinc-800 transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>רענן לוח</span>
        </button>
      </div>

      {/* Main Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Preparing (בהכנה) Column */}
        <div className="bg-white border-2 border-yellow-400 rounded-3xl overflow-hidden flex flex-col min-h-[450px] shadow-sm">
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-yellow-400 text-white p-4.5 flex justify-between items-center shadow-xs">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 p-1.5 rounded-lg text-yellow-300">
                <Flame className="w-4 h-4 animate-pulse text-yellow-300 fill-yellow-300" />
              </span>
              <h3 className="text-lg font-black">בהכנה במטבח</h3>
            </div>
            <span className="bg-blue-900/40 border border-yellow-300/50 text-yellow-300 text-xs px-3 py-1 rounded-full font-mono font-black">
              {preparingOrders.length} הזמנות
            </span>
          </div>

          <div className="p-4.5 flex-1 space-y-3 overflow-y-auto max-h-[500px]">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-20 text-zinc-400">
                <p className="text-sm font-semibold">הדלפק רגוע כרגע...</p>
                <p className="text-xs mt-1 text-zinc-500">אין הזמנות בשלבי הכנה במטבח.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {preparingOrders.map((order, idx) => (
                  <div 
                    key={order.id + idx} 
                    className="bg-yellow-50/30 p-3.5 rounded-2xl border-r-4 border-r-blue-600 border border-yellow-150 flex flex-col gap-3 hover:bg-yellow-50/70 transition-all duration-300 shadow-2xs hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                          <span>מכינים כעת...</span>
                        </p>
                        <h4 className="text-base font-black text-zinc-800">{order.customerName}</h4>
                      </div>
                      <span className="text-lg font-mono font-black text-blue-700 bg-white px-3 py-1 rounded-xl border border-yellow-200 shadow-xs">
                        {order.orderNumber}
                      </span>
                    </div>

                    {order.orderDescription && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-xs text-amber-900 font-bold text-right">
                        <span className="font-black text-amber-700 block text-[10px] mb-0.5">💬 הערה להזמנה:</span>
                        {order.orderDescription}
                      </div>
                    )}

                    {order.timeToBeReady && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-xs text-emerald-950 font-bold text-right flex flex-col gap-0.5">
                        <span className="font-black text-emerald-700 text-[10px]">⏰ מועד מוכנות מבוקש (הזמנה עתידית):</span>
                        <span>
                          {formatTimeToBeReady(order.timeToBeReady)}
                        </span>
                      </div>
                    )}

                    {/* Collapsible Order Items Container */}
                    {expandedOrders[order.id] && (
                      <div className="bg-white/90 rounded-xl p-3 border border-zinc-150 text-right space-y-1.5 text-xs animate-fadeIn">
                        <p className="font-bold text-zinc-700 border-b border-zinc-100 pb-1 flex items-center justify-between">
                          <span>תכולת ההזמנה:</span>
                          <span className="text-[10px] text-zinc-400">מזהה: {order.id.slice(0, 8)}</span>
                        </p>
                        {loadingItems[order.id] ? (
                          <div className="flex items-center gap-2 text-zinc-500 py-2 justify-center">
                            <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                            <span>טוען פריטים...</span>
                          </div>
                        ) : !orderItemsCache[order.id] || orderItemsCache[order.id].length === 0 ? (
                          <p className="text-zinc-500 py-1 text-center">אין פריטים להצגה.</p>
                        ) : (
                          <ul className="space-y-1.5 max-h-[150px] overflow-y-auto">
                            {orderItemsCache[order.id].map((item: any, i: number) => (
                              <li key={item.orderItemId || i} className="flex justify-between items-start py-1 border-b border-dashed border-zinc-100 last:border-0 last:pb-0">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-zinc-800">{item.productName || 'מוצר ארומה'}</span>
                                  {item.notes && <span className="text-[10px] text-zinc-500 bg-yellow-50 px-1 py-0.5 rounded border border-yellow-100 mt-0.5">הערות: {item.notes}</span>}
                                </div>
                                <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded text-[11px] h-fit">x{item.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Interactive Action Buttons */}
                    <div className="flex gap-2 mt-1 border-t border-yellow-100/50 pt-2">
                      <button
                        onClick={() => toggleOrderDetails(order.id)}
                        className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-1.5 px-3 rounded-xl text-[11px] transition-all cursor-pointer text-center"
                      >
                        {expandedOrders[order.id] ? 'סגור פירוט' : 'הצג פריטים'}
                      </button>
                      {order.userId === currentUserId ? (
                        <button
                          onClick={() => handleMoveToReady(order.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-1.5 px-3 rounded-xl text-[11px] transition-all cursor-pointer text-center flex items-center justify-center gap-1 shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>העבר למוכן</span>
                        </button>
                      ) : (
                        <div className="flex-1 bg-zinc-50 border border-zinc-150 text-zinc-400 font-bold py-1.5 px-3 rounded-xl text-[10px] text-center flex items-center justify-center select-none" title="ניתן לעדכן סטטוס רק עבור הזמנה שאתם יצרתם">
                          <span>לקוח אחר</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ready (מוכן לאיסוף) Column */}
        <div className="bg-white border-2 border-blue-400 rounded-3xl overflow-hidden flex flex-col min-h-[450px] shadow-sm">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4.5 flex justify-between items-center shadow-xs">
            <div className="flex items-center gap-2">
              <span className="bg-white/25 p-1.5 rounded-lg text-white">
                <CheckCircle className="w-4 h-4 animate-bounce" />
              </span>
              <h3 className="text-lg font-black font-sans">מוכן לאיסוף בדלפק!</h3>
            </div>
            <span className="bg-white/25 border border-white/30 text-white text-xs px-3 py-1 rounded-full font-mono font-black">
              {readyOrders.length} מוכנים
            </span>
          </div>

          <div className="p-4.5 flex-1 space-y-3 overflow-y-auto max-h-[500px]">
            {readyOrders.length === 0 ? (
              <div className="text-center py-20 text-zinc-400">
                <p className="text-sm font-semibold">ממתינים להכנת המנות...</p>
                <p className="text-xs mt-1 text-zinc-500">כאשר הזמנות יהיו מוכנות הן יקפצו לכאן בצבע כחול!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {readyOrders.map((order, idx) => (
                  <div 
                    key={order.id + idx} 
                    className="bg-blue-50/70 p-3.5 rounded-2xl border-r-4 border-r-blue-600 border border-blue-200 flex flex-col gap-3 hover:bg-blue-100/50 transition-all duration-300 ring-2 ring-blue-400/10 shadow-xs hover:shadow-md animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                          <span>לגשת לדלפק!</span>
                        </p>
                        <h4 className="text-base font-black text-zinc-900">{order.customerName}</h4>
                      </div>
                      <span className="text-lg font-mono font-black text-blue-700 bg-white px-3 py-1 rounded-xl border border-blue-200 shadow-sm">
                        {order.orderNumber}
                      </span>
                    </div>

                    {order.orderDescription && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-xs text-amber-900 font-bold text-right">
                        <span className="font-black text-amber-700 block text-[10px] mb-0.5">💬 הערה להזמנה:</span>
                        {order.orderDescription}
                      </div>
                    )}

                    {order.timeToBeReady && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-xs text-emerald-950 font-bold text-right flex flex-col gap-0.5">
                        <span className="font-black text-emerald-700 text-[10px]">⏰ מועד מוכנות מבוקש (הזמנה עתידית):</span>
                        <span>
                          {formatTimeToBeReady(order.timeToBeReady)}
                        </span>
                      </div>
                    )}

                    {/* Collapsible Order Items Container */}
                    {expandedOrders[order.id] && (
                      <div className="bg-white/90 rounded-xl p-3 border border-zinc-150 text-right space-y-1.5 text-xs">
                        <p className="font-bold text-zinc-700 border-b border-zinc-100 pb-1 flex items-center justify-between">
                          <span>תכולת ההזמנה:</span>
                          <span className="text-[10px] text-zinc-400">מזהה: {order.id.slice(0, 8)}</span>
                        </p>
                        {loadingItems[order.id] ? (
                          <div className="flex items-center gap-2 text-zinc-500 py-2 justify-center">
                            <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                            <span>טוען פריטים...</span>
                          </div>
                        ) : !orderItemsCache[order.id] || orderItemsCache[order.id].length === 0 ? (
                          <p className="text-zinc-500 py-1 text-center">אין פריטים להצגה.</p>
                        ) : (
                          <ul className="space-y-1.5 max-h-[150px] overflow-y-auto">
                            {orderItemsCache[order.id].map((item: any, i: number) => (
                              <li key={item.orderItemId || i} className="flex justify-between items-start py-1 border-b border-dashed border-zinc-100 last:border-0 last:pb-0">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-zinc-800">{item.productName || 'מוצר ארומה'}</span>
                                  {item.notes && <span className="text-[10px] text-zinc-500 bg-yellow-50 px-1 py-0.5 rounded border border-yellow-100 mt-0.5">הערות: {item.notes}</span>}
                                </div>
                                <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded text-[11px] h-fit">x{item.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Interactive Action Buttons */}
                    <div className="flex gap-2 mt-1 border-t border-blue-100/50 pt-2">
                      <button
                        onClick={() => toggleOrderDetails(order.id)}
                        className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-1.5 px-3 rounded-xl text-[11px] transition-all cursor-pointer text-center"
                      >
                        {expandedOrders[order.id] ? 'סגור פירוט' : 'הצג פריטים'}
                      </button>
                      {order.userId === currentUserId ? (
                        <button
                          onClick={() => onCollectOrder(order.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-1.5 px-3 rounded-xl text-[11px] transition-all cursor-pointer text-center flex items-center justify-center gap-1 shadow-sm"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>אספתי</span>
                        </button>
                      ) : (
                        <div className="flex-1 bg-zinc-50 border border-zinc-150 text-zinc-400 font-bold py-1.5 px-3 rounded-xl text-[10px] text-center flex items-center justify-center select-none" title="ניתן לאסוף רק הזמנה שאתם יצרתם">
                          <span>לקוח אחר</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* User's Specific Order Management list */}
      {userOrders.filter(o => o.userId === currentUserId).length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-150 pb-3">
            <span className="bg-blue-500/10 p-1.5 rounded-lg text-blue-600">
              <Gift className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black text-zinc-900 font-sans">ההזמנות שלי בסניף</h3>
          </div>

          <div className="space-y-3">
            {userOrders.filter(o => o.userId === currentUserId).map(order => (
              <div 
                key={order.id} 
                className="bg-gradient-to-r from-zinc-50 to-white hover:from-zinc-100/50 p-4 rounded-2xl border border-zinc-200 flex flex-col gap-4 transition-all duration-200 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono font-black text-blue-700 bg-blue-50 border border-blue-150 px-2.5 py-0.5 rounded-lg">
                        #{order.orderNumber}
                      </span>
                      <span className="font-bold text-zinc-900">{order.customerName}</span>
                      <span className="text-zinc-300 text-xs">•</span>
                      <span className="text-xs text-zinc-600 font-medium">סה״כ לתשלום: <span className="font-mono font-black text-zinc-900">₪{order.totalAmount}</span></span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-xs text-zinc-500 font-medium">מצב נוכחי:</span>
                      {order.status === 'pending' && (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                          התקבלה במערכת
                        </span>
                      )}
                      {order.status === 'preparing' && (
                        <span className="text-xs text-blue-700 bg-yellow-50 border border-yellow-300 px-2.5 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                          <span>בהכנה במטבח</span>
                        </span>
                      )}
                      {order.status === 'ready' && (
                        <span className="text-xs text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-extrabold animate-bounce flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                          <span>מוכן לאיסוף בדלפק!</span>
                        </span>
                      )}
                      {order.status === 'collected' && (
                        <span className="text-xs text-zinc-500 bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded-full font-medium">
                          נאסף בהצלחה
                        </span>
                      )}
                    </div>
                    {order.orderDescription && (
                      <p className="mt-2 text-xs font-bold text-zinc-700 bg-zinc-100 p-2 rounded-xl border border-zinc-200 max-w-md text-right">
                        <span className="text-blue-600 block text-[10px] mb-0.5 font-black">הערות להזמנה:</span>
                        {order.orderDescription}
                      </p>
                    )}
                    {order.timeToBeReady && (
                      <div className="mt-2 text-xs font-bold text-emerald-900 bg-emerald-50 p-2 rounded-xl border border-emerald-200 max-w-md text-right flex flex-col gap-0.5">
                        <span className="text-emerald-700 block text-[10px] font-black">⏰ מועד מוכנות מבוקש (הזמנה עתידית):</span>
                        <span>
                          {formatTimeToBeReady(order.timeToBeReady)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row items-center gap-2 self-stretch sm:self-auto shrink-0 justify-end">
                    <button
                      onClick={() => toggleOrderDetails(order.id)}
                      className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      {expandedOrders[order.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{expandedOrders[order.id] ? 'סגור פירוט' : 'פרטי הזמנה'}</span>
                    </button>

                    {order.status === 'ready' && (
                      <button
                        onClick={() => onCollectOrder(order.id)}
                        className="bg-gradient-to-r from-blue-600 to-blue-800 text-yellow-300 border border-yellow-400/50 hover:from-blue-700 hover:to-blue-900 font-black py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md shadow-blue-500/20"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>אספתי</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Order Items Container */}
                {expandedOrders[order.id] && (
                  <div className="bg-white rounded-xl p-4 border border-zinc-150 text-right space-y-1.5 text-xs animate-fadeIn w-full">
                    <p className="font-bold text-zinc-700 border-b border-zinc-100 pb-1.5 flex items-center justify-between">
                      <span>תכולת ההזמנה שלי:</span>
                      <span className="text-[10px] text-zinc-400">מזהה: {order.id.slice(0, 8)}</span>
                    </p>
                    {loadingItems[order.id] ? (
                      <div className="flex items-center gap-2 text-zinc-500 py-2 justify-center">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>טוען פריטים...</span>
                      </div>
                    ) : !orderItemsCache[order.id] || orderItemsCache[order.id].length === 0 ? (
                      <p className="text-zinc-500 py-1 text-center font-bold">אין פריטים להצגה.</p>
                    ) : (
                      <ul className="space-y-1.5 max-h-[250px] overflow-y-auto">
                        {orderItemsCache[order.id].map((item: any, i: number) => (
                          <li key={item.orderItemId || i} className="flex justify-between items-start py-2 border-b border-dashed border-zinc-100 last:border-0 last:pb-0">
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-800">{item.productName || 'מוצר ארומה'}</span>
                              {item.notes && <span className="text-[10px] text-zinc-500 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100 mt-0.5">הערות: {item.notes}</span>}
                            </div>
                            <span className="font-mono font-black text-zinc-950 bg-zinc-100 px-2.5 py-0.5 rounded text-xs h-fit">x{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
