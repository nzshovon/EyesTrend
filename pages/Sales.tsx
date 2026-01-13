
import React, { useState, useEffect } from 'react';
import { getStoredProducts, getStoredSales, saveSales, saveProducts, addAuditLog } from '../services/storage';
import { Product, Sale, User, AuditActionType } from '../types';
import { CURRENCY } from '../constants';

interface SalesProps {
  currentUser: User;
}

const Sales: React.FC<SalesProps> = ({ currentUser }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [showReceipt, setShowReceipt] = useState<Sale | null>(null);

  // New Sale Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');

  // Filtering State
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [p, s] = await Promise.all([getStoredProducts(), getStoredSales()]);
      setProducts(p || []);
      setSales(s || []);
      setFilteredSales(s || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...sales];

    if (dateFrom) {
      filtered = filtered.filter(s => new Date(s.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(s => new Date(s.date) <= end);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.customerName.toLowerCase().includes(q) || 
        s.productName.toLowerCase().includes(q) ||
        s.customerContact.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    }

    setFilteredSales(filtered);
  }, [dateFrom, dateTo, searchQuery, sales]);

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setFeedback(null);

    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      setFeedback({ type: 'error', msg: 'Please select a valid product.' });
      setIsProcessing(false);
      return;
    }

    if (product.stockQuantity < quantity) {
      setFeedback({ type: 'error', msg: `Insufficient stock! Only ${product.stockQuantity} remaining.` });
      setIsProcessing(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    const newSale: Sale = {
      id: `ET-${Date.now().toString().slice(-6)}`,
      productId: product.id,
      productName: `${product.brand} ${product.model}`,
      productType: product.type,
      quantity,
      totalAmount: product.sellingPrice * quantity,
      customerName,
      customerContact,
      date: new Date().toISOString(),
      salespersonId: currentUser.id,
      salespersonName: currentUser.fullName
    };

    const updatedProducts = products.map(p => 
      p.id === product.id ? { ...p, stockQuantity: p.stockQuantity - quantity } : p
    );
    
    const updatedSales = [newSale, ...sales];

    setSales(updatedSales);
    setProducts(updatedProducts);
    saveSales(updatedSales);
    saveProducts(updatedProducts);
    
    // Log the action
    await addAuditLog(currentUser, AuditActionType.CREATE, 'SALE', `Finalized sale ${newSale.id} for ${newSale.customerName}: ${newSale.productName} (Qty: ${newSale.quantity}, Total: ${CURRENCY}${newSale.totalAmount})`);

    setFeedback({ type: 'success', msg: 'Transaction completed successfully!' });
    setIsProcessing(false);
    setShowReceipt(newSale);
  };

  const resetForm = () => {
    setSelectedProductId('');
    setQuantity(1);
    setCustomerName('');
    setCustomerContact('');
    setFeedback(null);
    setShowReceipt(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Metrics
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalTransactions = filteredSales.length;
  const avgSaleValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* PROFESSIONAL PRINTABLE INVOICE (Hidden from screen, optimized for PDF) */}
      {showReceipt && (
        <div id="printable-invoice" className="hidden">
          <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', border: '1px solid #eee', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '60px' }}>
              <div>
                <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0A1931', margin: '0' }}>EYE TRENDS</h1>
                <p style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '3px', color: '#4f46e5', margin: '5px 0 0 0' }}>SPECTACLE SERVICE PROVIDER</p>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
                  <p>Quality Vision Center</p>
                  <p>Enterprise Terminal: #01</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#999', margin: '0' }}>INVOICE</h2>
                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '5px 0' }}>#{showReceipt.id}</p>
                <p style={{ fontSize: '12px', color: '#666' }}>{new Date(showReceipt.date).toLocaleDateString()} {new Date(showReceipt.date).toLocaleTimeString()}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
                <p style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>Billed To</p>
                <p style={{ fontSize: '16px', fontWeight: '800', color: '#0A1931' }}>{showReceipt.customerName}</p>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>{showReceipt.customerContact}</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
                <p style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>Issued By</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0A1931' }}>{showReceipt.salespersonName}</p>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Authorized Agent</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '60px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #0A1931' }}>
                  <th style={{ textAlign: 'left', padding: '15px 10px', fontSize: '12px', fontWeight: '900', color: '#0A1931' }}>DESCRIPTION</th>
                  <th style={{ textAlign: 'center', padding: '15px 10px', fontSize: '12px', fontWeight: '900', color: '#0A1931' }}>TYPE</th>
                  <th style={{ textAlign: 'center', padding: '15px 10px', fontSize: '12px', fontWeight: '900', color: '#0A1931' }}>QTY</th>
                  <th style={{ textAlign: 'right', padding: '15px 10px', fontSize: '12px', fontWeight: '900', color: '#0A1931' }}>PRICE</th>
                  <th style={{ textAlign: 'right', padding: '15px 10px', fontSize: '12px', fontWeight: '900', color: '#0A1931' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px 10px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '800', margin: '0' }}>{showReceipt.productName}</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Genuine Product - Warranty Included</p>
                  </td>
                  <td style={{ textAlign: 'center', padding: '20px 10px', fontSize: '12px', color: '#64748b' }}>{showReceipt.productType}</td>
                  <td style={{ textAlign: 'center', padding: '20px 10px', fontSize: '14px', fontWeight: 'bold' }}>{showReceipt.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '20px 10px', fontSize: '14px' }}>{CURRENCY}{(showReceipt.totalAmount / showReceipt.quantity).toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '20px 10px', fontSize: '14px', fontWeight: '900', color: '#4f46e5' }}>{CURRENCY}{showReceipt.totalAmount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'end' }}>
              <div style={{ width: '250px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '0 10px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Subtotal</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{CURRENCY}{showReceipt.totalAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', padding: '0 10px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Tax (0%)</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{CURRENCY}0.00</span>
                </div>
                <div style={{ background: '#0A1931', padding: '15px', borderRadius: '8px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>GRAND TOTAL</span>
                  <span style={{ fontSize: '20px', fontWeight: '900' }}>{CURRENCY}{showReceipt.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '80px', borderTop: '1px solid #f1f5f9', paddingTop: '30px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0A1931' }}>Thank you for your business!</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>Please keep this invoice for your records and future services.</p>
              <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '30px' }}>
                <div style={{ width: '100px', borderTop: '1px solid #666', fontSize: '9px', color: '#666', paddingTop: '5px' }}>Authorized Signature</div>
                <div style={{ width: '100px', borderTop: '1px solid #666', fontSize: '9px', color: '#666', paddingTop: '5px' }}>Customer Signature</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="group bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-coins"></i>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">Gross Revenue</span>
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-[#0A1931]">{CURRENCY}{totalRevenue.toLocaleString()}</p>
            <p className="text-xs font-medium text-gray-400 mt-1">Total revenue from {totalTransactions} items</p>
          </div>
        </div>

        <div className="group bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-receipt"></i>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wider">Activity</span>
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-[#0A1931]">{totalTransactions.toLocaleString()}</p>
            <p className="text-xs font-medium text-gray-400 mt-1">Orders processed in selected range</p>
          </div>
        </div>

        <div className="group bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-chart-line"></i>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">AOV</span>
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-[#0A1931]">{CURRENCY}{avgSaleValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-xs font-medium text-gray-400 mt-1">Average transaction value per bill</p>
          </div>
        </div>
      </div>

      {/* Intelligence Controls */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-6 items-center justify-between backdrop-blur-sm bg-white/80 sticky top-0 z-10 no-print">
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto items-center">
          <div className="relative w-full md:w-80">
            <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
            <input 
              type="text" 
              placeholder="Search ID, customer, or item..." 
              className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/5 outline-none text-sm font-medium transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-[1.25rem] w-full md:w-auto">
            <input 
              type="date" 
              className="bg-transparent px-4 py-3 rounded-xl text-xs font-bold text-gray-600 outline-none hover:bg-white transition-all w-full md:w-36"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="text-gray-300"><i className="fa-solid fa-arrow-right-long"></i></span>
            <input 
              type="date" 
              className="bg-transparent px-4 py-3 rounded-xl text-xs font-bold text-gray-600 outline-none hover:bg-white transition-all w-full md:w-36"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="w-full lg:w-auto px-10 py-4 bg-[#0A1931] text-white rounded-[1.25rem] font-bold hover:bg-indigo-900 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-950/10 flex items-center justify-center space-x-3"
        >
          <i className="fa-solid fa-file-invoice-dollar"></i>
          <span>Create New Bill</span>
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Bill #</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Customer Profile</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Item Catalog</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sales Executive</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Amount Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-indigo-50/30 transition-all group cursor-pointer" onClick={() => setShowReceipt(sale)}>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-indigo-600 font-black">{sale.id}</span>
                      <span className="text-[10px] text-gray-400 font-bold mt-1">
                        {new Date(sale.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#0A1931] group-hover:text-indigo-900 transition-colors">{sale.customerName}</span>
                      <span className="text-xs text-gray-400 mt-0.5">{sale.customerContact}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700">{sale.productName}</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-black uppercase tracking-tighter">{sale.productType}</span>
                        <span className="text-[10px] text-indigo-400 font-black">× {sale.quantity}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600">
                        {sale.salespersonName.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">{sale.salespersonName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="text-xl font-black text-[#0A1931]">{CURRENCY}{sale.totalAmount.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center space-y-4 opacity-20">
                      <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center text-4xl">
                        <i className="fa-solid fa-receipt"></i>
                      </div>
                      <div>
                        <p className="text-xl font-black text-[#0A1931]">No Activity Logged</p>
                        <p className="text-sm font-medium text-gray-500">Try adjusting your filters or search terms</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* State-of-the-Art Billing Modal */}
      {(isModalOpen || showReceipt) && (
        <div className="fixed inset-0 bg-[#0A1931]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500 flex flex-col border border-white/20">
            {/* Modal Header */}
            <div className="px-12 py-10 border-b border-gray-50 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                  <i className="fa-solid fa-cash-register text-2xl"></i>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-[#0A1931] tracking-tight">{showReceipt ? 'Invoice Details' : 'Point of Sale'}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Terminal #01</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }} 
                className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all duration-300"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {showReceipt ? (
                /* Receipt View After Success */
                <div className="p-12 space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl shadow-inner">
                      <i className="fa-solid fa-check"></i>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-[#0A1931]">Invoice Generated!</h4>
                      <p className="text-sm text-gray-500 mt-1">Transaction ID: {showReceipt.id}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-[2rem] p-8 space-y-4 border border-gray-100">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                      <span>Customer</span>
                      <span>Amount</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xl font-black text-[#0A1931]">{showReceipt.customerName}</p>
                        <p className="text-xs text-gray-500">{showReceipt.productName} × {showReceipt.quantity}</p>
                      </div>
                      <p className="text-3xl font-black text-indigo-600">{CURRENCY}{showReceipt.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={resetForm} className="py-5 bg-gray-50 text-gray-500 rounded-[1.5rem] font-bold hover:bg-gray-100 transition-all">Close</button>
                    <button onClick={handlePrint} className="py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2">
                      <i className="fa-solid fa-file-pdf"></i>
                      <span>Generate PDF</span>
                    </button>
                  </div>
                  <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Tip: Select "Save as PDF" in the print destination to download.
                  </p>
                </div>
              ) : (
                /* Main Billing Form */
                <form onSubmit={handleCreateSale} className="p-12 space-y-10">
                  {feedback && (
                    <div className={`p-6 rounded-[1.5rem] border flex items-start space-x-4 animate-in slide-in-from-top-4 duration-300 ${
                      feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      <i className={`fa-solid ${feedback.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'} text-xl mt-1`}></i>
                      <div>
                        <p className="font-black text-sm">{feedback.type === 'success' ? 'Success' : 'Attention Required'}</p>
                        <p className="text-xs font-medium opacity-80 mt-1">{feedback.msg}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Item Selection */}
                    <div className="md:col-span-2 group">
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-2 tracking-[0.2em]">Inventory Asset</label>
                      <div className="relative">
                        <select 
                          required 
                          className="w-full px-6 py-5 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/5 outline-none text-sm font-black transition-all appearance-none cursor-pointer"
                          value={selectedProductId} 
                          onChange={e => {
                            setSelectedProductId(e.target.value);
                            setFeedback(null);
                          }}
                        >
                          <option value="">Select an Item from Warehouse...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} disabled={p.stockQuantity <= 0}>
                              {p.brand} {p.model} — {CURRENCY}{p.sellingPrice.toLocaleString()} ({p.stockQuantity} in stock)
                            </option>
                          ))}
                        </select>
                        <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"></i>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-2 tracking-[0.2em]">Quantity</label>
                      <div className="flex items-center bg-gray-50 rounded-[1.5rem] p-2">
                        <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-sm hover:bg-indigo-50 text-indigo-600 transition-all"><i className="fa-solid fa-minus"></i></button>
                        <input 
                          required 
                          type="number" 
                          min="1" 
                          className="flex-1 bg-transparent text-center text-lg font-black text-[#0A1931] outline-none border-none"
                          value={quantity} 
                          onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} 
                        />
                        <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-sm hover:bg-indigo-50 text-indigo-600 transition-all"><i className="fa-solid fa-plus"></i></button>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-2 tracking-[0.2em]">Unit Price</label>
                      <div className="px-6 py-5 bg-indigo-50 text-indigo-600 rounded-[1.5rem] font-black text-lg flex items-center justify-between">
                        <span>{CURRENCY}</span>
                        <span>{selectedProduct?.sellingPrice.toLocaleString() || '0.00'}</span>
                      </div>
                    </div>

                    <div className="md:col-span-2 border-t border-gray-50 pt-8 mt-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-6 ml-2 tracking-[0.2em]">Customer Profile</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <i className="fa-solid fa-user absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                          <input 
                            required 
                            type="text" 
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none text-sm font-bold transition-all"
                            placeholder="Full Name"
                            value={customerName} 
                            onChange={e => setCustomerName(e.target.value)} 
                          />
                        </div>
                        <div className="relative">
                          <i className="fa-solid fa-phone absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
                          <input 
                            required 
                            type="text" 
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none text-sm font-bold transition-all"
                            placeholder="Contact Info"
                            value={customerContact} 
                            onChange={e => setCustomerContact(e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-10 bg-gradient-to-br from-[#0A1931] to-[#1a365d] rounded-[2.5rem] text-white flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.4em] mb-4">Final Ledger Summary</p>
                    <div className="flex flex-col items-center text-center">
                      <p className="text-5xl font-black mb-2 tabular-nums">
                        {CURRENCY}{((selectedProduct?.sellingPrice || 0) * quantity).toLocaleString()}
                      </p>
                      <p className="text-xs font-medium text-indigo-100/60 flex items-center gap-2">
                        {selectedProduct ? `${selectedProduct.brand} ${selectedProduct.model}` : 'Waiting for selection...'}
                        {selectedProduct && <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>}
                        {selectedProduct && `${quantity} unit(s)`}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isProcessing || !selectedProductId}
                      className="w-full py-6 bg-indigo-600 text-white rounded-[1.75rem] font-black text-xl hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 shadow-2xl shadow-indigo-500/20 flex items-center justify-center space-x-4"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span className="animate-pulse">Processing Payment...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-file-invoice-dollar"></i>
                          <span>Authorize Transaction</span>
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-gray-300 mt-6 font-bold uppercase tracking-widest">Secured Transaction • System Logged</p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
