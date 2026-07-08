/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Coffee, Sparkles, Egg, Salad, Cookie, Plus, Shield } from 'lucide-react';
import { Product, Category, getNormalizedCategoryId } from '../types.ts';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  categories?: Category[];
  onSelect: (product: Product) => void;
}

// Map key to matching Lucide Icons for fallback styling
const getCategoryIcon = (normId: string) => {
  switch (normId) {
    case 'c1': return <Coffee className="w-4 h-4" />;
    case 'c2': return <Egg className="w-4 h-4" />;
    case 'c3': return <Salad className="w-4 h-4" />;
    case 'c4': return <Cookie className="w-4 h-4" />;
    default: return <Coffee className="w-4 h-4" />;
  }
};

export default function ProductCard({ product, categories, onSelect }: ProductCardProps) {
  // Get category specific styling
  const getCategoryStyles = (categoryId?: string) => {
    switch (categoryId) {
      case 'c1': // Drinks
        return {
          hoverBorder: 'hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 focus:border-blue-500',
          hoverShadow: 'hover:shadow-blue-500/25',
          topLine: 'bg-gradient-to-r from-blue-600 to-blue-700',
          priceBg: 'bg-blue-50 text-blue-700 border-blue-200',
          badgeBg: 'bg-blue-100/90 text-blue-900 border-blue-200',
          btnHover: 'hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:border-blue-500 hover:text-white hover:shadow-md hover:shadow-blue-500/15',
          btnText: 'text-blue-700',
          btnIconColor: 'text-blue-600',
          accentText: 'group-hover:text-blue-600'
        };
      case 'c2': // Sandwiches
        return {
          hoverBorder: 'hover:border-yellow-400 hover:ring-2 hover:ring-yellow-400/20 focus:border-yellow-400',
          hoverShadow: 'hover:shadow-yellow-500/25',
          topLine: 'bg-gradient-to-r from-yellow-400 to-amber-500',
          priceBg: 'bg-yellow-50 text-yellow-800 border-yellow-250',
          badgeBg: 'bg-yellow-100/90 text-yellow-900 border-yellow-200',
          btnHover: 'hover:bg-gradient-to-r hover:from-yellow-400 hover:to-amber-500 hover:border-yellow-400 hover:text-blue-950 hover:shadow-md hover:shadow-yellow-500/15',
          btnText: 'text-yellow-800',
          btnIconColor: 'text-yellow-700',
          accentText: 'group-hover:text-amber-600'
        };
      case 'c3': // Salads
        return {
          hoverBorder: 'hover:border-blue-400 hover:ring-2 hover:ring-blue-400/20 focus:border-blue-400',
          hoverShadow: 'hover:shadow-blue-500/25',
          topLine: 'bg-gradient-to-r from-blue-500 via-yellow-400 to-blue-600',
          priceBg: 'bg-blue-50 text-blue-800 border-yellow-200',
          badgeBg: 'bg-yellow-100/90 text-blue-900 border-blue-200',
          btnHover: 'hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 hover:border-blue-500 hover:text-white hover:shadow-md hover:shadow-blue-500/15',
          btnText: 'text-blue-800',
          btnIconColor: 'text-blue-600',
          accentText: 'group-hover:text-blue-600'
        };
      case 'c4': // Pastries
        return {
          hoverBorder: 'hover:border-amber-400 hover:ring-2 hover:ring-amber-400/20 focus:border-amber-400',
          hoverShadow: 'hover:shadow-amber-500/25',
          topLine: 'bg-gradient-to-r from-amber-400 to-yellow-500',
          priceBg: 'bg-amber-50 text-amber-800 border-amber-200',
          badgeBg: 'bg-amber-100/90 text-amber-900 border-amber-200',
          btnHover: 'hover:bg-gradient-to-r hover:from-amber-400 hover:to-yellow-500 hover:border-amber-400 hover:text-blue-950 hover:shadow-md hover:shadow-amber-500/15',
          btnText: 'text-amber-800',
          btnIconColor: 'text-amber-700',
          accentText: 'group-hover:text-amber-600'
        };
      default:
        return {
          hoverBorder: 'hover:border-blue-400 hover:ring-2 hover:ring-blue-400/20 focus:border-blue-400',
          hoverShadow: 'hover:shadow-blue-500/25',
          topLine: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          priceBg: 'bg-blue-50 text-blue-700 border-blue-150',
          badgeBg: 'bg-blue-100/90 text-blue-900 border-blue-200',
          btnHover: 'hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:border-blue-500 hover:text-white hover:shadow-md hover:shadow-blue-500/15',
          btnText: 'text-blue-700',
          btnIconColor: 'text-blue-600',
          accentText: 'group-hover:text-blue-600'
        };
    }
  };

  const normId = getNormalizedCategoryId(product.categoryId, categories);
  const s = getCategoryStyles(normId);
  
  const categoryObject = categories?.find(c => c.categoryId === product.categoryId);
  const displayCategoryName = categoryObject?.categoryName || 
    (normId === 'c1' ? 'משקאות' : normId === 'c2' ? 'כריכים' : normId === 'c3' ? 'סלטים' : 'מאפים');

  return (
    <div 
      className={`bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs ${s.hoverBorder} ${s.hoverShadow} hover:shadow-md transition-all duration-300 flex flex-col group h-full hover:-translate-y-1`}
      dir="rtl"
    >
      {/* Decorative Top Accent Bar */}
      <div className={`h-1.5 w-full ${s.topLine}`} />
      
      {/* Details Box */}
      <div className="p-5 flex flex-col flex-grow justify-between gap-4">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h4 className={`text-base font-black text-zinc-900 ${s.accentText} transition-colors line-clamp-1`}>
              {product.productName}
            </h4>
            <span className={`font-black text-base whitespace-nowrap border px-2.5 py-0.5 rounded-xl shadow-xs ${s.priceBg}`}>
              ₪{product.price !== undefined && product.price !== null ? product.price : product.productPrice}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`border text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs ${s.badgeBg}`}>
              {getCategoryIcon(normId)}
              <span>{displayCategoryName}</span>
            </span>
            {product.calories && (
              <span className="text-[10px] text-zinc-500 font-mono bg-zinc-50 border border-zinc-150 px-2 py-0.5 rounded-full">
                {product.calories} קלוריות
              </span>
            )}
          </div>
          
          {product.productDescription ? (
            <p className="text-xs text-zinc-500 mt-3 line-clamp-2 leading-relaxed min-h-[2.5rem]">
              {product.productDescription}
            </p>
          ) : (
            <div className="min-h-[2.5rem]" />
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => onSelect(product)}
          className={`w-full bg-zinc-50/80 border border-zinc-200 text-zinc-700 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs ${s.btnHover}`}
        >
          <Plus className="w-4 h-4 text-zinc-600 group-hover:text-white" />
          <span>הוספה לסל והתאמה</span>
        </button>

      </div>

    </div>
  );
}
