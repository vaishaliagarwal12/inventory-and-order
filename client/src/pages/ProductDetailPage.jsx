import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Package,
  Share2,
  Check
} from 'lucide-react';
import { getProductByIdApi, getInventoryByProductIdApi } from '../services/api';
import { CurrencyPrice } from '../components/CurrencyPrice';
import { getProductImageUrl, getCategoryFallbackImageUrl } from '../utils/productImages';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const ProductDetailPage = ({
  productId,
  onBack,
  setActiveTab,
  onSelectCategory
}) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const { showSuccess, showError } = useToast();

  const [product, setProduct] = useState(null);
  const [stockQty, setStockQty] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const primaryUrl = product ? getProductImageUrl(product) : '';
  const fallbackUrl = product ? getCategoryFallbackImageUrl(product?.category_name) : '';
  const [imgSrc, setImgSrc] = useState(primaryUrl);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    if (product) {
      setImgSrc(getProductImageUrl(product));
      setHasFailed(false);
    }
  }, [product?.id, product?.name]);

  const handleImgError = () => {
    if (imgSrc !== fallbackUrl && fallbackUrl) {
      setImgSrc(fallbackUrl);
    } else {
      setHasFailed(true);
    }
  };

  useEffect(() => {
    if (!productId) {
      setError('No product ID provided');
      setLoading(false);
      return;
    }
    fetchProductDetails(productId);
  }, [productId]);

  const fetchProductDetails = async (id) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch product and inventory in parallel from real backend APIs
      const [prodRes, invRes] = await Promise.all([
        getProductByIdApi(id),
        getInventoryByProductIdApi(id).catch(() => ({ data: { quantity: 0 } })),
      ]);

      const prodData = prodRes?.data || prodRes;
      if (!prodData || !prodData.id) {
        throw new Error('Product not found or unavailable in catalog');
      }

      setProduct(prodData);
      setStockQty(invRes?.data?.quantity ?? 0);
    } catch (err) {
      console.error('Failed to load product details:', err);
      setError(err.message || 'Unable to retrieve product details');
    } finally {
      setLoading(false);
    }
  };

  // Find if product already in cart
  const cartItem = cart?.find((item) => (item.product_id || item.id) === Number(productId));
  const inCartQty = cartItem ? cartItem.quantity : 0;

  const isOutOfStock = stockQty <= 0 || product?.is_active === false;
  const isLowStock = !isOutOfStock && stockQty <= 10;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      showError(`'${product.name}' is out of stock`);
      return;
    }

    if (quantity > stockQty) {
      showError(`Only ${stockQty} units available in stock`);
      return;
    }

    addToCart(product, quantity);
    showSuccess(`Added ${quantity} × '${product.name}' to cart!`);
  };

  const handleShare = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showSuccess('Product link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto w-full py-6 px-3 sm:px-4 space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-24 h-5 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-xs">
          <div className="aspect-[4/3] sm:aspect-square bg-slate-100 rounded-2xl animate-pulse"></div>
          <div className="space-y-4">
            <div className="w-32 h-6 bg-slate-200 rounded-lg animate-pulse"></div>
            <div className="w-3/4 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
            <div className="w-40 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
            <div className="w-full h-24 bg-slate-100 rounded-xl animate-pulse"></div>
            <div className="w-48 h-12 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // --- ERROR OR NOT FOUND STATE ---
  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-500">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-navy">Product Unavailable</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error || 'The requested product could not be located in the catalog or is currently inactive.'}
        </p>
        <div className="pt-2">
          <button
            onClick={onBack || (() => setActiveTab && setActiveTab('products'))}
            className="px-5 py-2.5 bg-navy hover:bg-navy-dark text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Catalog</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full py-4 sm:py-6 px-2 sm:px-4 space-y-6">
      {/* Top Breadcrumb & Back Button */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack || (() => setActiveTab && setActiveTab('products'))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-navy hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-700 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Shop</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-semibold truncate">
          <button
            onClick={() => setActiveTab && setActiveTab('dashboard')}
            className="hover:text-navy cursor-pointer transition-colors"
          >
            Home
          </button>
          <span>/</span>
          <button
            onClick={() => setActiveTab && setActiveTab('products')}
            className="hover:text-navy cursor-pointer transition-colors"
          >
            Products
          </button>
          <span>/</span>
          <span className="text-navy font-bold truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      {/* Main Product Showcase Box */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left Column: Product Photography Display */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/80 p-4 flex items-center justify-center overflow-hidden shadow-inner group">
            {!hasFailed && imgSrc ? (
              <img
                src={imgSrc}
                alt={product.name}
                onError={handleImgError}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300">
                <Package className="w-16 h-16 stroke-[1.2]" />
                <span className="text-xs font-semibold text-slate-400 mt-2">Photograph unavailable</span>
              </div>
            )}

            {/* Out of Stock Overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center">
                <span className="px-4 py-2 rounded-xl text-sm font-black text-white bg-slate-900/90 border border-white/20 shadow-md">
                  Currently Out of Stock
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Information, Pricing & Order Action */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category Badge & Share Button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (onSelectCategory) {
                    onSelectCategory(product.category_id);
                  } else if (setActiveTab) {
                    setActiveTab('products');
                  }
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                {product.category_name || `Category #${product.category_id}`}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Copy share link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Product Title */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-navy tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Pricing Section */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
                  <CurrencyPrice amount={product.price} />
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Standard catalog price based on real-time currency conversion.
              </p>
            </div>

            {/* Stock Availability */}
            <div className="pt-1">
              {isOutOfStock ? (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Currently Out of Stock. New inventory arrives shortly.</span>
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Hurry! Only {stockQty} units remaining in warehouse stock.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>In Stock — {stockQty} units ready for immediate packing.</span>
                </div>
              )}
            </div>

            {/* Product Description */}
            <div className="space-y-1.5 pt-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Product Overview
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {product.description || 'Authentic store catalog product crafted with high quality standards.'}
              </p>
            </div>
          </div>

          {/* Quantity Selector & Add to Cart Action */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            {!isOutOfStock && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600">Select Quantity:</span>
                <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 h-10 px-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-navy hover:bg-white rounded-lg transition-colors font-black cursor-pointer disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-black text-navy">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(stockQty, quantity + 1))}
                    disabled={quantity >= stockQty}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-navy hover:bg-white rounded-lg transition-colors font-black cursor-pointer disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">
                  Max: {stockQty} units
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:border disabled:border-slate-200 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isOutOfStock ? 'Unavailable' : `Add ${quantity} to Cart`}</span>
              </button>

              {inCartQty > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab('cart')}
                  className="h-12 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <span>View Cart ({inCartQty})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
