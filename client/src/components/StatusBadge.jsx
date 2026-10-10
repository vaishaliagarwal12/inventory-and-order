import React from 'react';
import { Clock, CheckCircle2, Package, Truck, CheckCheck, XCircle, AlertTriangle } from 'lucide-react';

export const OrderStatusBadge = ({ status }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = <Clock className="w-3.5 h-3.5" />;
  let label = status;

  switch (status) {
    case 'PENDING':
      badgeStyle = 'bg-[#FEF3C7] text-[#B45309] border-amber-200';
      icon = <Clock className="w-3.5 h-3.5 text-[#B45309]" />;
      break;
    case 'CONFIRMED':
      badgeStyle = 'bg-[#EFF6FF] text-[#1D4ED8] border-blue-200';
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-[#1D4ED8]" />;
      break;
    case 'PROCESSING':
      badgeStyle = 'bg-[#F5F3FF] text-[#6D28D9] border-purple-200';
      icon = <Package className="w-3.5 h-3.5 text-[#6D28D9]" />;
      break;
    case 'SHIPPED':
      badgeStyle = 'bg-[#E0F2FE] text-[#0369A1] border-sky-200';
      icon = <Truck className="w-3.5 h-3.5 text-[#0369A1]" />;
      break;
    case 'DELIVERED':
      badgeStyle = 'bg-[#DCFCE7] text-[#15803D] border-green-200';
      icon = <CheckCheck className="w-3.5 h-3.5 text-[#15803D]" />;
      break;
    case 'CANCELLED':
      badgeStyle = 'bg-[#FEE2E2] text-[#B91C1C] border-red-200';
      icon = <XCircle className="w-3.5 h-3.5 text-[#B91C1C]" />;
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
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = 'IN STOCK';
  let icon = <CheckCircle2 className="w-3.5 h-3.5" />;

  if (status === 'out_of_stock' || quantity === 0) {
    badgeStyle = 'bg-[#FEE2E2] text-[#B91C1C] border-red-200';
    label = 'OUT OF STOCK';
    icon = <XCircle className="w-3.5 h-3.5 text-[#B91C1C]" />;
  } else if (status === 'low_stock' || (quantity > 0 && quantity <= 10)) {
    badgeStyle = 'bg-[#FFEDD5] text-[#C2410C] border-orange-200';
    label = `LOW STOCK (${quantity})`;
    icon = <AlertTriangle className="w-3.5 h-3.5 text-[#C2410C]" />;
  } else {
    badgeStyle = 'bg-[#DCFCE7] text-[#15803D] border-green-200';
    label = `IN STOCK (${quantity})`;
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />;
  }

  return (
    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeStyle}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
};

