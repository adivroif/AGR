import React, { useState } from 'react';
import { Coffee, User, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { BASE_URL } from '../types.ts';

interface LoginScreenProps {
  onLoginSuccess: (userId: string, userName: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent, targetName?: string) => {
    if (e) e.preventDefault();
    const nameToSubmit = (targetName || username).trim();
    if (!nameToSubmit) {
      setError('אנא הקלד שם משתמש');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Try querying database by exact/case-insensitive full name directly via API
      const res = await fetch(`${BASE_URL}/api/Users/fullName/${encodeURIComponent(nameToSubmit)}`);
      if (res.ok) {
        const usersList = await res.json();
        if (Array.isArray(usersList) && usersList.length > 0) {
          const matchedUser = usersList[0];
          // Invoke callback with matched user details
          onLoginSuccess(matchedUser.userId, matchedUser.fullName);
          setIsLoading(false);
          return;
        }
      }

      // 2. Fallback: If Direct API returned no users, fetch all users and search locally
      const allUsersRes = await fetch(`${BASE_URL}/api/Users`);
      if (allUsersRes.ok) {
        const allUsers = await allUsersRes.json();
        if (Array.isArray(allUsers)) {
          // Normalize names for comparison (remove extra spaces and make lowercase)
          const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, ' ').trim();
          const targetNormalized = normalize(nameToSubmit);
          
          const matchedUser = allUsers.find(
            (u: any) => normalize(u.fullName || '') === targetNormalized
          );

          if (matchedUser) {
            onLoginSuccess(matchedUser.userId, matchedUser.fullName);
            setIsLoading(false);
            return;
          }
        }
      }

      setError('שם המשתמש אינו מופיע במערכת. אנא ודא שהקלדת שם נכון.');
    } catch (err) {
      console.error('Login error:', err);
      setError('לא ניתן להתחבר כעת. בדוק את חיבור האינטרנט שלך.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden relative">
        {/* Branding decoration header banner */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-yellow-400 to-blue-700"></div>
        
        <div className="p-8 space-y-6 text-right">
          
          {/* Logo and Greeting */}
          <div className="text-center space-y-3 pb-2 border-b border-zinc-100">
            <div className="inline-flex bg-gradient-to-tr from-blue-600 to-yellow-500 p-3.5 rounded-2xl shadow-xl shadow-blue-500/20 text-white animate-bounce mx-auto">
              <Coffee className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-zinc-950 tracking-tight">כניסה לאספרסו בר AGR</h2>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-zinc-700 mb-1.5">שם משתמש במערכת (שם מלא)</label>
              <div className="relative">
                <User className="absolute right-3.5 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl py-2.5 pr-10 pl-4 text-xs font-semibold focus:outline-none transition-all placeholder-zinc-400"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-black py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>מתחבר ומסנכרן נתונים...</span>
                </>
              ) : (
                <>
                  <span>התחבר למערכת</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
