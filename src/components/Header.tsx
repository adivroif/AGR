/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Coffee, MapPin, Clock, Tv, Settings, Database, Sparkles, LogOut, User } from 'lucide-react';

interface HeaderProps {
  activeTab: 'menu' | 'board';
  setActiveTab: (tab: 'menu' | 'board') => void;
  cartCount: number;
  currentUserName?: string;
  onLogout?: () => void;
}

export default function Header({ activeTab, setActiveTab, cartCount, currentUserName, onLogout }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white text-zinc-900 sticky top-0 z-40 border-b border-zinc-200 shadow-sm" dir="rtl">
      {/* Yellow and Blue modern top brand bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-yellow-400 to-blue-700"></div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
         
         {/* Brand Logo & Name */}
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-blue-600 to-yellow-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center border border-white/10 animate-pulse">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-zinc-950 flex items-center gap-2">
              <span className="bg-gradient-to-r from-blue-600 to-yellow-500 bg-clip-text text-transparent font-extrabold tracking-tight">AGR</span>
              <span className="text-zinc-500 font-light tracking-wide text-lg">espresso bar</span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
            </p>
          </div>
        </div>
 
         {/* Branch & Time Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-100 px-3.5 py-1.5 rounded-full text-blue-700 shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-bold font-sans">סניף רבי דוד אלקיים, אשדוד</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 px-3.5 py-1.5 rounded-full text-yellow-800 font-mono shadow-xs">
            <Clock className="w-3.5 h-3.5 text-yellow-600" />
            <span>{currentTime || '00:00:00'}</span>
          </div>
        </div>
 
         {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {currentUserName && (
            <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 p-1 rounded-xl shadow-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-800 font-black">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>שלום, <span className="text-blue-700">{currentUserName}</span></span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="התנתק מהמערכת"
                  className="bg-white hover:bg-red-50 text-red-600 p-2 rounded-lg border border-zinc-200 hover:border-red-200 transition-all cursor-pointer flex items-center justify-center gap-1 font-bold text-[10px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>יציאה</span>
                </button>
              )}
            </div>
          )}

          <nav className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 w-full md:w-auto">
            <button
              id="nav-menu"
              onClick={() => setActiveTab('menu')}
              className={`flex-1 md:flex-initial px-5 py-2.5 rounded-lg text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-yellow-300 shadow-lg shadow-blue-600/25 border-b-2 border-yellow-400'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>תפריט דיגיטלי</span>
            </button>
            
            <button
              id="nav-board"
              onClick={() => setActiveTab('board')}
              className={`flex-1 md:flex-initial px-5 py-2.5 rounded-lg text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'board'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-yellow-300 shadow-lg shadow-blue-500/25 border-b-2 border-yellow-400'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>מסך הזמנות סניף</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border animate-pulse ${
                activeTab === 'board'
                  ? 'bg-white/20 text-yellow-300 border-white/30'
                  : 'bg-blue-100 text-blue-600 border-blue-200'
              }`}>
                LIVE
              </span>
            </button>
          </nav>
        </div>

      </div>
    </header>
  );
}
