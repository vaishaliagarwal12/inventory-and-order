import React from 'react';
import { Clock, CheckCircle2, Package, Truck, CheckCheck, XCircle, AlertTriangle } from 'lucide-react';

export const OrderStatusBadge = ({ status }) => {
  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
  let icon = <Clock className="w-3.5 h-3.5" />;
  let label = status;

  switch (status) {
    case 'PENDING':
      badgeStyle = 'bg-amber-950/50 text-amber-300 border-amber-800/60';
      icon = <Clock className="w-3.5 h-3.5" />;
      break;
    case 'CONFIRMED':
      badgeStyle = 'bg-blue-950/50 text-blue-300 border-blue-800/60';
      icon = <CheckCircle2 className="w-3.5 h-3.5" />;
      break;
    case 'PROCESSING':
      badgeStyle = 'bg-indigo-950/50 text-indigo-300 border-indigo-800/60';
      icon = <Package className="w-3.5 h-3.5" />;
      break;
    case 'SHIPPED':
      badgeStyle = 'bg-purple-950/50 text-purple-300 border-purple-800/60';
      icon = <Truck className="w-3.5 h-3.5" />;
      break;
    case 'DELIVERED':
      badgeStyle = 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60';
      icon = <CheckCheck className="w-3.5 h-3.5" />;
      break;
    case 'CANCELLED':
      badgeStyle = 'bg-rose-950/50 text-rose-300 border-rose-800/60';
      icon = <XCircle className="w-3.5 h-3.5" />;
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeStyle}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
};

export const StockStatusBadge = ({ status, quantity }) => {
  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
  let label = 'IN STOCK';
  let icon = <CheckCircle2 className="w-3.5 h-3.5" />;

  if (status === 'out_of_stock' || quantity === 0) {
    badgeStyle = 'bg-rose-950/50 text-rose-300 border-rose-800/60';
    label = 'OUT OF STOCK';
    icon = <XCircle className="w-3.5 h-3.5" />;
  } else if (status === 'low_stock' || (quantity > 0 && quantity <= 10)) {
    badgeStyle = 'bg-amber-950/50 text-amber-300 border-amber-800/60';
    label = `LOW STOCK (${quantity})`;
    icon = <AlertTriangle className="w-3.5 h-3.5" />;
  } else {
    badgeStyle = 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60';
    label = `IN STOCK (${quantity})`;
    icon = <CheckCircle2 className="w-3.5 h-3.5" />;
  }

  return (
    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeStyle}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
};
