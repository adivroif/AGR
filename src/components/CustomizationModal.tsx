/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Product, CartItem, Category, getNormalizedCategoryId } from '../types.ts';

interface CustomizationModalProps {
  product: Product;
  categories?: Category[];
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

interface DynamicOption {
  id: string;
  nameHe: string;
  type: 'select' | 'boolean' | 'multi-select';
  choices?: { id: string; nameHe: string; priceModifier: number }[];
  defaultValue: string | boolean | string[];
}

export default function CustomizationModal({ product, categories, onClose, onAddToCart }: CustomizationModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOptions, setSelectedOptions] = useState<{ [optionId: string]: string | boolean | string[] }>({});
  const [notes, setNotes] = useState<string>('');
  const [itemPrice, setItemPrice] = useState<number>(product.price);

  // Generate options based on categoryId
  const getOptionsForCategory = (catId: string): DynamicOption[] => {
    if (catId === 'c1') {
      // Drinks
      return [
        {
          id: 'milk',
          nameHe: 'סוג חלב',
          type: 'select',
          choices: [
            { id: 'regular', nameHe: 'חלב רגיל 3%', priceModifier: 0 },
            { id: 'soy', nameHe: 'חלב סויה', priceModifier: 0 },
            { id: 'oat', nameHe: 'חלב שיבולת שועל', priceModifier: 2 },
            { id: 'almond', nameHe: 'חלב שקדים', priceModifier: 2 }
          ],
          defaultValue: 'regular'
        },
        {
          id: 'sugar',
          nameHe: 'רמת סוכר',
          type: 'select',
          choices: [
            { id: 'none', nameHe: 'ללא סוכר', priceModifier: 0 },
            { id: 'half', nameHe: 'חצי כפית סוכר', priceModifier: 0 },
            { id: 'one', nameHe: 'כפית סוכר', priceModifier: 0 },
            { id: 'sweetener', nameHe: 'ממתיק (סוכרזית)', priceModifier: 0 }
          ],
          defaultValue: 'none'
        }
      ];
    } else if (catId === 'c2') {
      // Sandwiches
      return [
        {
          id: 'bread',
          nameHe: 'סוג לחם',
          type: 'select',
          choices: [
            { id: 'white', nameHe: 'לחם לבן חם', priceModifier: 0 },
            { id: 'whole_wheat', nameHe: 'לחם דגנים קל', priceModifier: 0 },
            { id: 'gluten_free', nameHe: 'לחם ללא גלוטן (+₪2)', priceModifier: 2 }
          ],
          defaultValue: 'white'
        },
        {
          id: 'toast',
          nameHe: 'רמת קלייה',
          type: 'select',
          choices: [
            { id: 'cold', nameHe: 'כריך קר', priceModifier: 0 },
            { id: 'toasted', nameHe: 'כריך חם קלוי', priceModifier: 0 }
          ],
          defaultValue: 'cold'
        }
      ];
    } else if (catId === 'c3') {
      // Salads
      return [
        {
          id: 'dressing',
          nameHe: 'רוטב לבחירה',
          type: 'select',
          choices: [
            { id: 'vinaigrette', nameHe: 'רוטב ויניגרט', priceModifier: 0 },
            { id: 'olive_lemon', nameHe: 'שמן זית ולימון', priceModifier: 0 },
            { id: 'tahini', nameHe: 'טחינה', priceModifier: 0 }
          ],
          defaultValue: 'vinaigrette'
        },
        {
          id: 'bread_side',
          nameHe: 'לחם בצד',
          type: 'select',
          choices: [
            { id: 'white', nameHe: 'לחם לבן', priceModifier: 0 },
            { id: 'whole_wheat', nameHe: 'לחם דגנים', priceModifier: 0 },
            { id: 'none', nameHe: 'ללא לחם', priceModifier: 0 }
          ],
          defaultValue: 'white'
        }
      ];
    } else if (catId === 'c4') {
      // מאפים
      return [
        {
          id: 'heating',
          nameHe: 'חימום המאפה',
          type: 'select',
          choices: [
            { id: 'heated', nameHe: 'חם מהתנור (מומלץ!)', priceModifier: 0 },
            { id: 'room', nameHe: 'בטמפרטורת החדר', priceModifier: 0 }
          ],
          defaultValue: 'heated'
        }
      ];
    } else if (catId === 'c5') {
      // ארוחת בוקר
      return [
        {
          id: 'egg_type',
          nameHe: 'סוג ביצה',
          type: 'select',
          choices: [
            { id: 'omelet', nameHe: 'חביתה', priceModifier: 0 },
            { id: 'scrambled', nameHe: 'מקושקשת', priceModifier: 0 },
            { id: 'hard_boiled', nameHe: 'ביצה קשה', priceModifier: 0 }
          ],
          defaultValue: 'omelet'
        },
        {
          id: 'breakfast_bread',
          nameHe: 'לחם בצד',
          type: 'select',
          choices: [
            { id: 'white', nameHe: 'לחם לבן חם', priceModifier: 0 },
            { id: 'grains', nameHe: 'לחם דגנים קל', priceModifier: 0 },
            { id: 'none', nameHe: 'ללא לחם', priceModifier: 0 }
          ],
          defaultValue: 'white'
        },
        {
          id: 'side_salad',
          nameHe: 'סוג סלט בצד',
          type: 'select',
          choices: [
            { id: 'israeli', nameHe: 'סלט ישראלי (מלפפון, עגבניה, גמבה)', priceModifier: 0 },
            { id: 'green', nameHe: 'סלט ירוק (עלי חסה, בצל)', priceModifier: 0 }
          ],
          defaultValue: 'israeli'
        },
        {
          id: 'main_spread',
          nameHe: 'ממרח כלול לבחירה',
          type: 'select',
          choices: [
            { id: 'tuna', nameHe: 'ממרח טונה', priceModifier: 0 },
            { id: 'cream_cheese', nameHe: 'גבינת שמנת', priceModifier: 0 },
            { id: 'white_cheese', nameHe: 'גבינה לבנה', priceModifier: 0 }
          ],
          defaultValue: 'tuna'
        },
        {
          id: 'breakfast_extra',
          nameHe: 'תוספות ושדרוגים (בתשלום) - ניתן לבחור מספר תוספות',
          type: 'multi-select',
          choices: [
            { id: 'white_cheese', nameHe: 'גבינה לבנה', priceModifier: 4 },
            { id: 'bulgarian', nameHe: 'גבינה בולגרית', priceModifier: 4 },
            { id: 'halloumi', nameHe: 'גבינת חלומי', priceModifier: 6 },
            { id: 'tuna', nameHe: 'טונה', priceModifier: 5 },
            { id: 'yellow_cheese', nameHe: 'גבינה צהובה', priceModifier: 4 }
          ],
          defaultValue: []
        }
      ];
    } else{
    return [];
    }
  };

  const options = getOptionsForCategory(getNormalizedCategoryId(product.categoryId, categories));

  const baseProductPrice = product.price !== undefined && product.price !== null
    ? Number(product.price)
    : (product.productPrice !== undefined && product.productPrice !== null
      ? Number(product.productPrice)
      : 0);

  // Initialize options with defaults
  useEffect(() => {
    const defaults: { [optionId: string]: string | boolean | string[] } = {};
    options.forEach(opt => {
      defaults[opt.id] = opt.defaultValue;
    });
    setSelectedOptions(defaults);
    setItemPrice(baseProductPrice);
  }, [product, baseProductPrice]);

  // Recalculate single item price when options change
  useEffect(() => {
    let basePrice = baseProductPrice;

    options.forEach(opt => {
      const selectedValue = selectedOptions[opt.id];
      if (opt.type === 'select' && opt.choices) {
        const choice = opt.choices.find(c => c.id === selectedValue);
        if (choice) {
          basePrice += choice.priceModifier;
        }
      } else if (opt.type === 'multi-select' && opt.choices && Array.isArray(selectedValue)) {
        selectedValue.forEach(val => {
          const choice = opt.choices?.find(c => c.id === val);
          if (choice) {
            basePrice += choice.priceModifier;
          }
        });
      }
    });

    setItemPrice(basePrice);
  }, [selectedOptions, product, baseProductPrice]);

  const handleSelectChange = (optionId: string, choiceId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: choiceId
    }));
  };

  const handleMultiSelectToggle = (optionId: string, choiceId: string) => {
    setSelectedOptions(prev => {
      const current = (prev[optionId] as string[]) || [];
      const updated = current.includes(choiceId)
        ? current.filter(id => id !== choiceId)
        : [...current, choiceId];
      return {
        ...prev,
        [optionId]: updated
      };
    });
  };

  const handleSave = () => {
    // Generate summarized notes from options plus custom notes
    const activeOptsStr = options
      .map(opt => {
        const val = selectedOptions[opt.id];
        if (opt.type === 'select' && opt.choices) {
          const ch = opt.choices.find(c => c.id === val);
          return ch ? ch.nameHe : '';
        } else if (opt.type === 'multi-select' && opt.choices && Array.isArray(val)) {
          if (val.length === 0) return '';
          const selectedChoicesNames = val
            .map(v => {
              const ch = opt.choices?.find(c => c.id === v);
              return ch ? ch.nameHe : '';
            })
            .filter(Boolean);
          return `${opt.nameHe.split(' - ')[0]}: ${selectedChoicesNames.join(' + ')}`;
        }
        return '';
      })
      .filter(Boolean)
      .join(', ');

    const finalNotes = [activeOptsStr, notes].filter(Boolean).join(' | ');

    const finalCartItem: CartItem = {
      cartItemId: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      cartId: '', // Overridden by App's active SQL cart ID on addition
      productId: product.productId,
      productName: product.productName,
      quantity,
      unitPrice: itemPrice,
      notes: finalNotes,
      product // embed for rendering
    };
    onAddToCart(finalCartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md" dir="rtl">
      <div className="bg-white border border-zinc-200 text-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-xl animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
          <div>
            <h3 className="text-lg font-black text-zinc-900">{product.productName}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-200 transition-colors text-zinc-500 hover:text-zinc-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Product short description & price */}
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col gap-2">
            {product.productDescription && (
              <p className="text-xs text-zinc-600 leading-relaxed">{product.productDescription}</p>
            )}
            <div className="text-blue-600 font-black text-lg">
              מחיר בסיס: ₪{baseProductPrice}
            </div>
          </div>

          {options.length > 0 && <hr className="border-zinc-200" />}

          {/* Customization Options */}
          <div className="space-y-5">
            {options.map(opt => {
              const currentVal = selectedOptions[opt.id];
              return (
                <div key={opt.id} className="space-y-2">
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider">{opt.nameHe}</h4>
                  
                  {opt.type === 'select' && opt.choices && (
                    <div className="grid grid-cols-2 gap-2">
                      {opt.choices.map(choice => {
                        const isChosen = currentVal === choice.id;
                        return (
                          <button
                            type="button"
                            key={choice.id}
                            onClick={() => handleSelectChange(opt.id, choice.id)}
                            className={`p-2.5 rounded-xl text-xs font-bold text-right border transition-all ${
                              isChosen
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{choice.nameHe}</span>
                              {choice.priceModifier > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                  isChosen
                                    ? 'bg-blue-700 text-white'
                                    : 'bg-zinc-100 text-zinc-500'
                                }`}>
                                  +₪{choice.priceModifier}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {opt.type === 'multi-select' && opt.choices && (
                    <div className="grid grid-cols-2 gap-2">
                      {opt.choices.map(choice => {
                        const isChosen = Array.isArray(currentVal) && currentVal.includes(choice.id);
                        return (
                          <button
                            type="button"
                            key={choice.id}
                            onClick={() => handleMultiSelectToggle(opt.id, choice.id)}
                            className={`p-2.5 rounded-xl text-xs font-bold text-right border transition-all ${
                              isChosen
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                  isChosen ? 'border-white bg-blue-700' : 'border-zinc-300 bg-white'
                                }`}>
                                  {isChosen && <span className="w-1.5 h-1.5 rounded-sm bg-white" />}
                                </span>
                                <span>{choice.nameHe}</span>
                              </span>
                              {choice.priceModifier > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                  isChosen
                                    ? 'bg-blue-700 text-white'
                                    : 'bg-zinc-100 text-zinc-500'
                                }`}>
                                  +₪{choice.priceModifier}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <hr className="border-zinc-200" />

          {/* Notes field */}
          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-500 uppercase tracking-wider block">
              הערות והנחיות מיוחדות להכנה
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-zinc-400 min-h-[70px] resize-none"
            />
          </div>

        </div>

        {/* Footer actions with quantity selector */}
        <div className="p-5 border-t border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Quantity Selector */}
          <div className="flex items-center justify-center gap-3 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 shadow-sm">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-mono font-black text-sm w-6 text-center text-zinc-800">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Price & Add button */}
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 font-bold uppercase font-sans">סה"כ לתשלום</p>
              <p className="text-xl font-black text-blue-600 font-mono">₪{itemPrice * quantity}</p>
            </div>

            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-600 to-blue-800 text-yellow-300 border border-yellow-400/40 hover:from-blue-700 hover:to-blue-900 font-black py-3 px-6 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-900/10 active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>הוספה לסל</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
