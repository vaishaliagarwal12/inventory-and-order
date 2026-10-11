import React, { useState } from 'react';
import {
  ShoppingCart,
  Edit2,
  Trash2,
  Package,
  Plus,
  Minus,
  CheckCircle2
} from 'lucide-react';
import { CurrencyPrice } from './CurrencyPrice';
import { getProductImageUrl } from '../utils/productImages';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const ProductCard = ({
  product,
  stockQty = 0,
  onAddToCart,
  onSelectProduct,
  onEdit,
  onDelete,
  isAdmin = false
}) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const { showSuccess, showError } = useToast();
  const [imgError, setImgError] = useState(false);

  // Cart item matching
  const cartItem = cart?.find((item) => (item.product_id || item.id) === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;

  const isOutOfStock = stockQty <= 0 || product.is_active === false;
  const isLowStock = !isOutOfStock && stockQty <= 10;
  const imageUrl = getProductImageUrl(product);
  const showPhoto = imageUrl && !imgError;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) {
      showError(`'${product.name}' is out of stock`);
      return;
    }
    if (onAddToCart) {
      onAddToCart(product, 1);
    } else {
      addToCart(product, 1);
      showSuccess(`Added '${product.name}' to cart`);
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (inCartQty >= stockQty) {
      showError(`Only ${stockQty} units available in stock`);
      return;
    }
    updateQuantity(product.id, inCartQty + 1);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    updateQuantity(product.id, inCartQty - 1);
  };

  const handleCardClick = (e) => {
    if (e) e.stopPropagation();
    if (onSelectProduct) {
      onSelectProduct(product.id);
    } else {
      window.history.pushState(null, '', `/products/${product.id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs relative">
      {/* Product Image Frame */}
      <div
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick(e);
          }
        }}
        aria-label={`View details for ${product.name}`}
        className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-50 to-slate-100/60 overflow-hidden flex items-center justify-center p-2 cursor-pointer select-none"
      >
        {showPhoto ? (
          <img
            src={imageUrl}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300 rounded-xl">
            <Package className="w-10 h-10 stroke-[1.5]" />
            <span className="text-[11px] font-medium text-slate-400 mt-1">Image unavailable</span>
          </div>
        )}

        {/* Out of Stock Subtle Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-slate-900/90 border border-white/20 shadow-xs">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Information Body */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          {/* Category Row */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-teal tracking-wider uppercase truncate max-w-full">
              {product.category_name || `Category #${product.category_id}`}
            </span>
          </div>

          {/* Product Title */}
          <h3
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(e);
              }
            }}
            className="text-xs sm:text-sm font-bold text-navy hover:text-emerald-700 transition-colors line-clamp-2 leading-snug cursor-pointer select-none"
          >
            {product.name}
          </h3>

          {/* Product Description */}
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
            {product.description || 'Standard store catalog product.'}
          </p>
        </div>

        {/* Stock Status Badge */}
        <div>
          {isOutOfStock ? (
            <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Out of stock
            </span>
          ) : isLowStock ? (
            <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Only {stockQty} left in stock
            </span>
          ) : (
            <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              In Stock ({stockQty} units)
            </span>
          )}
        </div>

        {/* Pricing and Action Row */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Price Block */}
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-black text-navy tracking-tight">
              <CurrencyPrice amount={product.price} />
            </span>
          </div>

          {/* Action Button: Blinkit-style interactive ADD / Quantity controls */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(product);
                }}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-teal rounded-lg transition-colors border border-slate-200 cursor-pointer"
                title="Edit Product"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete && onDelete(product.id);
                }}
                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                title="Delete Product"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : inCartQty > 0 ? (
            /* Blinkit-Style In-Cart Quantity Pill [- Qty +] */
            <div className="inline-flex items-center bg-emerald-600 text-white rounded-xl shadow-xs font-bold text-xs h-8 px-1">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-6 h-6 flex items-center justify-center hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="w-6 text-center text-xs font-black">{inCartQty}</span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={inCartQty >= stockQty}
                className="w-6 h-6 flex items-center justify-center hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            /* Blinkit-Style Clean "+ ADD" Button */
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAdd}
              className={`h-8 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 hover:border-emerald-600'
              }`}
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>{isOutOfStock ? 'Sold Out' : 'ADD'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
