import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDocument } from "../hooks/useFirestore.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { BrandMark } from "../components/common/BrandMark.jsx";
import { ArrowLeft, Printer, FileDown, ShieldAlert, Loader2 } from "lucide-react";

export default function Invoice() {
  const { orderId } = useParams();
  const { data: order, loading, error } = useDocument(`orders/${orderId}`, null);
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedDeliveredDate, setFormattedDeliveredDate] = useState("");

  useEffect(() => {
    if (order?.createdAt) {
      const date = order.createdAt.seconds
        ? new Date(order.createdAt.seconds * 1000)
        : order.createdAt.toDate
          ? order.createdAt.toDate()
          : new Date(order.createdAt);
      setFormattedDate(date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }));
    }
    if (order?.deliveredAt) {
      const date = order.deliveredAt.seconds
        ? new Date(order.deliveredAt.seconds * 1000)
        : order.deliveredAt.toDate
          ? order.deliveredAt.toDate()
          : new Date(order.deliveredAt);
      setFormattedDeliveredDate(date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }));
    }
  }, [order]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-captain-black flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-captain-gold mb-3" size={32} />
        <p className="text-sm text-white/60">Loading invoice details...</p>
      </div>
    );
  }

  if (error || !order || (order && !order.id)) {
    return (
      <div className="min-h-screen bg-captain-black flex flex-col items-center justify-center text-white p-4">
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-6 max-w-md text-center">
          <ShieldAlert className="mx-auto text-red-400 mb-4 animate-pulse" size={48} />
          <h2 className="text-2xl font-bebas tracking-wide text-white mb-2">Invoice Not Found</h2>
          <p className="text-sm text-white/60 mb-6">
            We couldn't retrieve the invoice for order ID: #{orderId}. Please check the link or contact support.
          </p>
          <Link to="/" className="inline-block rounded-full bg-captain-gold px-6 py-2.5 font-nav text-xs font-extrabold uppercase tracking-wider text-captain-black hover:bg-captain-gold-hover transition">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = order.subtotal || 0;
  const discount = order.discount || 0;
  const gst = order.gst || 0;
  const total = order.total || 0;
  const address = order.fullAddress || order.customerAddress || "N/A";

  return (
    <div className="min-h-screen bg-captain-black text-white py-10 px-4 md:px-8 print:bg-white print:text-black print:p-0 print:min-h-0">
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            color: black !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          .print-table th {
            background-color: #f3f4f6 !important;
            color: black !important;
            border-bottom: 2px solid #ddd !important;
          }
          .print-table td {
            border-bottom: 1px solid #ddd !important;
            color: black !important;
          }
          .print-accent {
            color: black !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-3xl no-print mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-captain-gold transition">
          <ArrowLeft size={16} /> Back to Captain 7
        </Link>
      </div>

      <div className="mx-auto max-w-3xl rounded-xl border border-captain-gold/25 bg-captain-card p-6 md:p-8 shadow-gold print-container">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between border-b border-white/10 pb-6 print:border-black/10">
          <div className="flex items-center gap-3">
            <BrandMark size="md" withText={true} />
          </div>
          <div className="text-left md:text-right space-y-1">
            <h1 className="font-bebas text-3xl md:text-4xl text-captain-gold print-accent">TAX INVOICE</h1>
            <div className="font-mono text-xs text-white/50 print:text-black/50">Order Reference: #{order.id}</div>
            <div className="text-xs text-white/60 print:text-black/60">Date: {formattedDate}</div>
            {order.paymentStatus && (
              <div className="inline-block rounded-full bg-emerald-500/10 border border-emerald-400/25 px-3 py-1 text-[10px] font-semibold text-emerald-400 print:border-black print:text-black uppercase mt-1">
                {order.paymentStatus}
              </div>
            )}
          </div>
        </div>

        {/* Addresses */}
        <div className="grid gap-6 md:grid-cols-2 py-6 border-b border-white/10 print:border-black/10 text-sm">
          <div className="space-y-2">
            <div className="font-nav text-xs font-extrabold uppercase tracking-wider text-captain-gold print-accent">Business Details</div>
            <div className="font-bold text-white print:text-black">Captain 7 Eat & Play</div>
            <div className="text-white/60 print:text-black/60 text-xs leading-relaxed">
              107, Bypass Road, Mahalakshmi Nagar,<br />
              Narasaraopet - 522601<br />
              FSSAI No: 10123022000035
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-nav text-xs font-extrabold uppercase tracking-wider text-captain-gold print-accent">Customer Details</div>
            <div className="font-bold text-white print:text-black">{order.customerName}</div>
            <div className="text-white/60 print:text-black/60 text-xs">Phone: {order.customerPhone}</div>
            <div className="text-white/60 print:text-black/60 text-xs leading-relaxed mt-1">
              Address: {address}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6">
          <div className="font-nav text-xs font-extrabold uppercase tracking-wider text-captain-gold print-accent mb-4">Items Ordered</div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm print-table">
              <thead>
                <tr className="border-b border-white/10 text-white/40 print:border-black/10 print:text-black font-nav text-xs font-extrabold uppercase">
                  <th className="py-3 pr-4">Item Name</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 pl-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-black/5 text-white/80 print:text-black">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] print:hover:bg-transparent">
                    <td className="py-3 pr-4 font-semibold text-white print:text-black">{item.name}</td>
                    <td className="py-3 px-4 text-center">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.price)}</td>
                    <td className="py-3 pl-4 text-right font-mono font-semibold">
                      {formatCurrency(item.lineTotal || item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Summary & Worker details */}
        <div className="grid gap-6 md:grid-cols-2 py-6 border-t border-white/10 print:border-black/10 text-sm">
          <div className="space-y-4 rounded-lg border border-white/5 bg-captain-black/40 p-4 print:border-black/10 print:bg-transparent">
            <div className="font-nav text-xs font-extrabold uppercase tracking-wider text-captain-gold print-accent">Delivery & Fulfillment</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-white/40 print:text-black/40">Status:</span>
              <span className="font-semibold uppercase text-captain-bright print:text-black">{order.status}</span>
              
              <span className="text-white/40 print:text-black/40">Worker Name:</span>
              <span className="font-semibold text-white print:text-black">{order.workerName || "Unassigned"}</span>

              <span className="text-white/40 print:text-black/40">Delivery Time:</span>
              <span className="font-semibold text-white print:text-black">{formattedDeliveredDate || "N/A"}</span>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-captain-gold/15 bg-captain-black/60 p-4 print:border-black/10 print:bg-transparent">
            <div className="flex justify-between text-xs text-white/60 print:text-black/60">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-white/60 print:text-black/60">
              <span>GST (5%):</span>
              <span className="font-mono">{formatCurrency(gst)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-400 print:text-black font-semibold">
                <span>Discount:</span>
                <span className="font-mono">- {formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-white/10 pt-3 text-base font-extrabold text-captain-bright print:border-black/10 print:text-black">
              <span>Total Amount:</span>
              <span className="font-mono text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-white/10 pt-6 text-center text-xs text-white/40 print:border-black/10 print:text-black/50 leading-relaxed">
          <p>Thank you for choosing Captain 7 Eat & Play!</p>
          <p className="mt-1">For any queries, contact us at +91 90004 69552 or visit near Integrated School, Narasaraopet.</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="mx-auto max-w-3xl flex justify-center gap-4 mt-8 no-print">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-full bg-captain-gold hover:bg-captain-gold-hover px-6 py-3 font-nav text-sm font-extrabold uppercase tracking-wider text-captain-black transition"
        >
          <Printer size={16} /> Print Invoice
        </button>
        <button
          type="button"
          onClick={handlePrint} // Trigger print which allows save to PDF
          className="inline-flex items-center gap-2 rounded-full border border-white/20 hover:border-captain-gold px-6 py-3 font-nav text-sm font-extrabold uppercase tracking-wider text-white hover:text-captain-gold transition"
        >
          <FileDown size={16} /> Download PDF
        </button>
      </div>
    </div>
  );
}
