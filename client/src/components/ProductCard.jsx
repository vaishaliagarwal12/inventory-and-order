import React, { useState } from 'react';
import { ShoppingCart, Edit2, Trash2, Package } from 'lucide-react';
import { StockStatusBadge } from './StatusBadge';
import { CurrencyPrice } from './CurrencyPrice';
import { getProductImageUrl } from '../utils/productImages';

export const ProductCard = ({
  product,
  stockQty = 0,
  onAddToCart,
  onEdit,
  onDelete,
  isAdmin = false
}) => {
  const [imgError, setImgError] = useState(false);
  const [currentQty, setCurrentQty] = useState(1);

  const isOutOfStock = stockQty <= 0 || (product.is_active === false);
  const imageUrl = getProductImageUrl(product);
  const showPhoto = imageUrl && !imgError;

  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-teal hover:-translate-y-1.5 hover:shadow-md transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none shadow-xs relative overflow-hidden space-y-3">
      <div className="flex flex-col gap-2.5">
        {/* Visual Product Display Container */}
        <div className="relative h-44 rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center border border-slate-200/70">
          {showPhoto ? (
            <img
              src={imageUrl}
              alt={product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200 ease-out motion-reduce:transform-none"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-teal shadow-xs group-hover:scale-105 transition-transform duration-200 motion-reduce:transform-none">
              <Package className="w-6 h-6 text-teal" />
            </div>
          )}

          {/* Category Tag Top Left */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/95 text-navy border border-slate-200 shadow-xs">
              {product.category_name || `Category #${product.category_id}`}
            </span>
          </div>

          {/* Stock Status Badge Top Right */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <StockStatusBadge quantity={stockQty} />
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-1">
          <h3 className="text-xs sm:text-sm font-bold text-navy group-hover:text-teal transition-colors duration-200 leading-snug line-clamp-1">
            {product.name}
          </h3>
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
            {product.description || 'Quality multi-category product available for direct order.'}
          </p>
        </div>
      </div>

      {/* Card Footer: Price & Actions */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
        <div className="flex items-baseline justify-between">
          <span className="text-base font-extrabold text-navy">
            <CurrencyPrice amount={product.price} />
          </span>

          {isAdmin && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              product.is_active
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {product.is_active ? 'Active' : 'Inactive'}
            </span>
          )}
        </div>

        {/* Action Controls */}
        {isAdmin ? (
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={() => onEdit && onEdit(product)}
              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-teal focus-visible:outline-none text-navy border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-teal" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => onDelete && onDelete(product.id)}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center cursor-pointer"
              title="Delete Product"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-0.5">
            {!isOutOfStock && (
              <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 h-8 px-1">
                <button
                  type="button"
                  onClick={() => setCurrentQty(Math.max(1, currentQty - 1))}
                  className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-navy hover:bg-white focus-visible:ring-1 focus-visible:ring-teal transition-colors font-bold cursor-pointer text-xs"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-bold text-navy">{currentQty}</span>
                <button
                  type="button"
                  onClick={() => setCurrentQty(Math.min(stockQty, currentQty + 1))}
                  className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-navy hover:bg-white focus-visible:ring-1 focus-visible:ring-teal transition-colors font-bold cursor-pointer text-xs"
                >
                  +
                </button>
              </div>
            )}

            <button
              disabled={isOutOfStock}
              onClick={() => onAddToCart && onAddToCart(product, currentQty)}
              className="flex-1 h-8 rounded-lg bg-navy hover:bg-[#1f2b3a] group-hover:bg-[#243344] focus-visible:ring-2 focus-visible:ring-teal focus-visible:outline-none text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
