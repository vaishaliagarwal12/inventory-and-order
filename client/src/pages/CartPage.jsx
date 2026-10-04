import React, { useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Package,
  Plus,
  Minus,
  Truck,
  FileText,
  MapPin,
  CreditCard,
  Lock,
  HelpCircle,
  ShieldCheck,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrderApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CurrencyPrice } from '../components/CurrencyPrice';

export const CartPage = ({ setActiveTab, onOrderPlaced }) => {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal, cartItemCount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('net30');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const handlePlaceOrder = async () => {
    setErrorMsg('');
    if (!isAuthenticated) {
      setErrorMsg('You must be logged in to place an order.');
      return;
    }
    if (cart.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    setLoading(true);
    // Payload strictly includes items array with product_id and quantity
    const itemsPayload = cart.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
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
      setErrorMsg(err.message || 'Failed to place order.');
      showError(err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-mono text-[#00c2ff] uppercase tracking-widest font-semibold">
              Procurement Pipeline
            </span>
            <span className="text-[#86929a] text-xs">/</span>
            <span className="text-xs text-[#bcc8d1]">Order Staging</span>
          </div>
          <h1 className="text-2xl text-[#dfe2ef] font-bold tracking-tight">My Shopping Cart</h1>
          <p className="text-xs md:text-sm text-[#bcc8d1] mt-0.5">
            Review your selected inventory items, adjust allocation quantities, and dispatch fulfillment orders.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181b25] text-[#dfe2ef] border border-[#262a34]">
            <span className="w-2 h-2 rounded-full bg-[#5ae9ac] shadow-[0_0_8px_rgba(90,233,172,0.8)]"></span>
            <span className="text-xs font-medium">Warehouse Sync: Real-Time</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181b25] text-[#bcc8d1] border border-[#262a34] text-xs">
            <span className="text-[#89ceff]">⚡</span>
            <span>Buffer: Nominal</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="p-12 border border-dashed border-[#262a34] rounded-xl text-center space-y-4 bg-[#181b25]">
          <div className="w-16 h-16 rounded-full bg-[#1c1f29] text-[#00c2ff] flex items-center justify-center mx-auto">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div>
            <p className="text-base font-semibold text-[#dfe2ef]">Your procurement cart is empty</p>
            <p className="text-xs text-[#bcc8d1] mt-1">Explore our product catalog and allocate inventory items to your cart.</p>
          </div>
          <button
            onClick={() => setActiveTab('products')}
            className="px-5 py-2.5 bg-[#00c2ff] hover:bg-[#00a2e6] text-[#00344e] text-xs font-bold rounded-xl transition-all shadow-[0_0_18px_rgba(0,194,255,0.3)] inline-flex items-center space-x-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Catalog</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column (Items & Dispatch) */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            <div className="bg-[#181b25] rounded-xl shadow-lg border border-[#262a34] overflow-hidden">
              <div className="p-4 sm:p-5 flex items-center justify-between bg-[#181b25]/70 border-b border-[#262a34]">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-[#00c2ff]" />
                  <h2 className="text-base font-semibold text-[#dfe2ef]">Allocated Items</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#262a34] text-[#89ceff] text-xs font-medium">
                    {cartItemCount} Line Items
                  </span>
                </div>
                <button
                  onClick={clearCart}
                  disabled={loading}
                  className="text-xs text-[#ffb4ab] hover:text-[#ffdad6] hover:underline transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Cart</span>
                </button>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#0a0e17] text-[#86929a] text-[11px] font-mono tracking-widest uppercase border-b border-[#262a34]">
                      <th className="py-3 px-4 font-medium">Item Details</th>
                      <th className="py-3 px-4 font-medium text-right">Unit Price</th>
                      <th className="py-3 px-4 font-medium text-center">Quantity</th>
                      <th className="py-3 px-4 font-medium text-right">Total</th>
                      <th className="py-3 px-4 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262a34]/60">
                    {cart.map((item) => (
                      <tr key={item.product_id} className="hover:bg-[#1c1f29]/60 transition-colors group">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-[#31353f] overflow-hidden flex-shrink-0 flex items-center justify-center relative shadow-sm text-[#00c2ff]">
                              <Package className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold text-[#dfe2ef] group-hover:text-[#00c2ff] transition-colors truncate">
                                {item.name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-mono text-[#86929a]">
                                  CAT: {item.category_name || 'General'}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#5ae9ac]/10 text-[#5ae9ac] text-[10px] font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#5ae9ac]"></span> In Stock
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-sm text-[#dfe2ef]">
                          <CurrencyPrice amount={item.price} />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center bg-[#0a0e17] border border-[#262a34] rounded p-1 shadow-inner">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center text-[#bcc8d1] hover:text-[#dfe2ef] hover:bg-[#262a34] rounded transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center bg-transparent font-mono text-xs font-bold text-[#dfe2ef]">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center text-[#bcc8d1] hover:text-[#dfe2ef] hover:bg-[#262a34] rounded transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-sm font-bold text-[#00c2ff]">
                          <CurrencyPrice amount={item.price * item.quantity} />
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product_id)}
                            className="p-2 rounded text-[#86929a] hover:text-[#ffb4ab] hover:bg-[#93000a]/20 transition-all"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-4 bg-[#181b25]/50 border-t border-[#262a34] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#262a34] hover:bg-[#353943] text-[#dfe2ef] text-xs font-medium transition-all self-start sm:self-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Continue Shopping</span>
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#bcc8d1] uppercase font-mono">
                    Subtotal ({totalUnits} units):
                  </span>
                  <span className="font-mono text-lg font-bold text-[#dfe2ef]">
                    <CurrencyPrice amount={cartTotal} />
                  </span>
                </div>
              </div>
            </div>

            {/* Freight Dispatch Information Banner */}
            <div className="bg-[#181b25] p-5 rounded-xl border border-[#262a34] shadow flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-[#00c2ff]/10 flex items-center justify-center text-[#00c2ff] flex-shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#dfe2ef]">Standard Industrial Freight Dispatch</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#262a34] text-[#89ceff] font-mono">
                    2-3 Business Days
                  </span>
                </div>
                <p className="text-xs text-[#bcc8d1] mt-0.5">
                  Automated routing via Central Logistics Hub. Includes real-time IoT tracking &amp; dock arrival signature logging.
                </p>
              </div>
              <div className="hidden md:flex flex-col items-end text-right shrink-0">
                <span className="text-[10px] font-mono text-[#86929a]">DISPATCH ETA</span>
                <span className="font-mono text-xs font-semibold text-[#5ae9ac]">Next Business Day</span>
              </div>
            </div>
          </div>

          {/* Right Column (Order Summary & Checkout Panel) */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className="bg-[#181b25] p-5 rounded-xl border border-[#262a34] shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#262a34]">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#00c2ff]" />
                  <h3 className="text-base font-semibold text-[#dfe2ef]">Order Summary</h3>
                </div>
                <span className="text-xs text-[#bcc8d1] font-mono">{cartItemCount} Items</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-[#bcc8d1]">
                  <span>Items Subtotal</span>
                  <span className="font-mono text-[#dfe2ef] font-semibold">
                    <CurrencyPrice amount={cartTotal} />
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#bcc8d1]">
                  <span className="flex items-center gap-1">
                    <span>Estimated Freight</span>
                    <Info className="w-3.5 h-3.5 text-[#86929a]" />
                  </span>
                  <span className="font-mono text-[#5ae9ac] font-semibold">Included</span>
                </div>
                <div className="flex justify-between items-center text-[#bcc8d1]">
                  <span>Estimated Tax</span>
                  <span className="font-mono text-[#dfe2ef]">$0.00</span>
                </div>
                <div className="pt-3 mt-1 border-t border-[#262a34] flex justify-between items-baseline">
                  <div className="flex flex-col">
                    <span className="text-xs text-[#dfe2ef] font-bold">Total Amount</span>
                    <span className="text-[10px] font-mono text-[#86929a]">Atomic Transaction</span>
                  </div>
                  <span className="font-mono text-xl text-[#00c2ff] font-bold tracking-tight">
                    <CurrencyPrice amount={cartTotal} />
                  </span>
                </div>
              </div>

              {/* PO / Voucher Code */}
              <div className="p-3 bg-[#1c1f29] rounded-lg space-y-2 border border-[#262a34]">
                <label className="text-[10px] font-mono text-[#86929a] uppercase tracking-wider block">
                  PO or Voucher Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="e.g. PO-88902"
                    className="flex-1 h-8 px-3 bg-[#0a0e17] rounded text-[#dfe2ef] placeholder:text-[#86929a] text-xs focus:outline-none focus:ring-1 focus:ring-[#00c2ff]"
                  />
                  <button
                    type="button"
                    onClick={() => setPromoApplied(true)}
                    className="px-3 py-1 rounded bg-[#262a34] hover:bg-[#353943] text-[#dfe2ef] text-xs font-semibold transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {promoApplied && (
                  <div className="text-[#5ae9ac] text-[11px] flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PO reference recorded</span>
                  </div>
                )}
              </div>

              {/* Destination Dock */}
              <div className="p-3 bg-[#0a0e17] rounded-lg border border-[#262a34] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#86929a] uppercase tracking-wider">
                    Destination Facility
                  </span>
                </div>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-[#89ceff] flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col text-xs">
                    <span className="text-[#dfe2ef] font-medium">{user?.name || 'Customer Facility'}</span>
                    <span className="text-[#bcc8d1] text-[11px]">Primary Registered Shipping Dock</span>
                  </div>
                </div>
              </div>

              {/* Payment Terms Options */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[#86929a] uppercase tracking-wider block">
                  Billing Terms / Payment Method
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <label
                    className={`flex items-center gap-3 px-3 py-2 rounded bg-[#1c1f29] cursor-pointer transition-colors border ${
                      paymentMethod === 'net30' ? 'border-[#00c2ff] bg-[#262a34]' : 'border-transparent hover:bg-[#262a34]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="net30"
                      checked={paymentMethod === 'net30'}
                      onChange={() => setPaymentMethod('net30')}
                      className="accent-[#00c2ff] w-4 h-4"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#dfe2ef] font-semibold">Invoice Billing (Net 30)</span>
                        <span className="text-[10px] font-mono text-[#5ae9ac] bg-[#5ae9ac]/10 px-1.5 py-0.5 rounded font-bold">
                          APPROVED
                        </span>
                      </div>
                      <span className="text-[10px] text-[#86929a]">Corporate Account Line</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 px-3 py-2 rounded bg-[#1c1f29] cursor-pointer transition-colors border ${
                      paymentMethod === 'cc' ? 'border-[#00c2ff] bg-[#262a34]' : 'border-transparent hover:bg-[#262a34]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="cc"
                      checked={paymentMethod === 'cc'}
                      onChange={() => setPaymentMethod('cc')}
                      className="accent-[#00c2ff] w-4 h-4"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#dfe2ef] font-medium">Credit Card (•••• 4242)</span>
                        <CreditCard className="w-3.5 h-3.5 text-[#86929a]" />
                      </div>
                      <span className="text-[10px] text-[#86929a]">Primary Corporate Card</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Checkout Action Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={loading || cart.length === 0}
                className="w-full py-3 px-4 rounded-xl bg-[#00c2ff] text-[#00344e] font-bold text-sm hover:bg-[#00a2e6] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_-3px_rgba(0,194,255,0.4)] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-[#00344e]/30 border-t-[#00344e] rounded-full animate-spin"></span>
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>
                  {loading ? 'Processing Dispatch...' : 'Place Order ('}
                  {!loading && <CurrencyPrice amount={cartTotal} />}
                  {!loading && ')'}
                </span>
              </button>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[#86929a] text-[10px]">
                <div className="flex flex-col items-center gap-1 p-2 rounded bg-[#0a0e17]/50">
                  <ShieldCheck className="w-4 h-4 text-[#00c2ff]" />
                  <span className="leading-tight">256-Bit Encrypted</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded bg-[#0a0e17]/50">
                  <Package className="w-4 h-4 text-[#5ae9ac]" />
                  <span className="leading-tight">ISO 9001</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded bg-[#0a0e17]/50">
                  <CheckCircle2 className="w-4 h-4 text-[#89ceff]" />
                  <span className="leading-tight">Atomic Lock</span>
                </div>
              </div>
            </div>

            {/* Support Box */}
            <div className="p-4 rounded-xl bg-[#181b25] border border-[#262a34] flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-[#86929a] shrink-0" />
              <div className="flex flex-col text-xs">
                <span className="text-[#dfe2ef] font-medium">Need immediate dispatch assistance?</span>
                <span className="text-[#bcc8d1] text-[11px]">
                  Call Fulfillment Control: <span className="text-[#00c2ff] font-mono font-semibold">+1 (800) 555-NXUS</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
