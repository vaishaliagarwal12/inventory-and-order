import React, { useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  ArrowLeft,
  AlertCircle,
  ShoppingBag,
  Package,
  Plus,
  Minus,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrderApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CurrencyPrice } from '../components/CurrencyPrice';
import { AuthModal } from '../components/AuthModal';
import { getProductImageUrl } from '../utils/productImages';

export const CartPage = ({ setActiveTab, onOrderPlaced }) => {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal, cartItemCount } = useCart();
  const { isAuthenticated, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handlePlaceOrder = async () => {
    setErrorMsg('');
    if (!isAuthenticated) {
      setErrorMsg('Please sign in to place your order.');
      setShowAuthModal(true);
      return;
    }
    if (cart.length === 0) {
      setErrorMsg('Your shopping cart is empty.');
      return;
    }

    setLoading(true);
    const itemsPayload = cart.map((item) => ({
      product_id: parseInt(item.product_id || item.id, 10),
      quantity: parseInt(item.quantity, 10),
    }));

    try {
      const res = await createOrderApi(itemsPayload);
      const createdOrder = res.data;
      showSuccess(`Order #${createdOrder.id} placed successfully!`);
      clearCart();
      if (onOrderPlaced) {
        onOrderPlaced(createdOrder.id);
      } else {
        setActiveTab('orders');
      }
    } catch (err) {
      const errMsg = err.message || '';
      if (
        errMsg.toLowerCase().includes('token') ||
        errMsg.toLowerCase().includes('unauthorized') ||
        errMsg.toLowerCase().includes('401')
      ) {
        logout();
        setErrorMsg('Your session has expired. Please log in again to place your order.');
        setShowAuthModal(true);
      } else {
        setErrorMsg(errMsg || 'Failed to place order.');
        showError(errMsg || 'Failed to place order.');
      }
    } finally {
      setLoading(false);
    }
  };

  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-navy tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-teal" />
            <span>Shopping Cart</span>
            <span className="text-xs font-normal text-slate-500">({cartItemCount} {cartItemCount === 1 ? 'item' : 'items'})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review your selected products and complete your order.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('products')}
          className="inline-flex items-center gap-1 text-xs font-bold text-teal hover:text-navy transition-colors self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="p-12 border border-slate-200 rounded-2xl text-center space-y-4 bg-white shadow-xs max-w-md mx-auto my-6">
          <div className="w-16 h-16 rounded-xl bg-beige text-navy flex items-center justify-center mx-auto border border-slate-200">
            <ShoppingBag className="w-8 h-8 text-teal" />
          </div>
          <div>
            <h2 className="text-base font-bold text-navy">Your cart is empty</h2>
            <p className="text-xs text-slate-500 mt-1">
              Explore our store catalog to add items to your cart.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('products')}
            className="px-5 py-2.5 bg-navy hover:bg-navy-dark text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center space-x-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Products</span>
          </button>
        </div>
      ) : (
        /* Desktop Two-Column Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 Cols): Cart Items List */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">Product Items</span>
              <button
                onClick={clearCart}
                disabled={loading}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cart</span>
              </button>
            </div>

            {/* Subtle Divider List */}
            <div className="divide-y divide-slate-100">
              {cart.map((item) => {
                const imgUrl = getProductImageUrl(item);
                return (
                  <div key={item.product_id || item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Item Image & Title */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {imgUrl ? (
                          <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-teal" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-navy line-clamp-1">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          Category: {item.category_name || 'General'}
                        </span>
                        <span className="text-xs font-semibold text-navy mt-1 sm:hidden">
                          <CurrencyPrice amount={item.price} />
                        </span>
                      </div>
                    </div>

                    {/* Unit Price, Stepper & Subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="hidden sm:flex flex-col items-end min-w-[70px]">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Unit Price</span>
                        <span className="text-xs font-bold text-navy">
                          <CurrencyPrice amount={item.price} />
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product_id || item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-navy hover:bg-white rounded transition-colors font-bold cursor-pointer text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-navy">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product_id || item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-navy hover:bg-white rounded transition-colors font-bold cursor-pointer text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="flex flex-col items-end min-w-[70px]">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Total</span>
                        <span className="text-sm font-extrabold text-navy">
                          <CurrencyPrice amount={item.price * item.quantity} />
                        </span>
                      </div>

                      {/* Remove Icon */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product_id || item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (4 Cols): Order Summary */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-navy pb-3 border-b border-slate-100">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal ({totalUnits} units)</span>
                <span className="font-bold text-navy">
                  <CurrencyPrice amount={cartTotal} />
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Estimated Tax</span>
                <span className="font-bold text-navy">$0.00</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-navy">Grand Total</span>
                <span className="text-xl font-extrabold text-navy tracking-tight">
                  <CurrencyPrice amount={cartTotal} />
                </span>
              </div>
            </div>

            {/* Honest Order Action */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={loading || cart.length === 0}
              className="w-full py-2.5 px-4 rounded-xl bg-navy text-white font-bold text-xs hover:bg-navy-dark transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>
                {loading ? 'Processing Order...' : 'Place Order Now'}
              </span>
              {!loading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};
