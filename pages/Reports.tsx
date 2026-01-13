
import React, { useState, useEffect } from 'react';
import { getStoredSales, getStoredUsers } from '../services/storage';
import { Sale, User, UserRole } from '../types';
import { PRODUCT_TYPES, CURRENCY } from '../constants';

const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  
  // Modal for export
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'date', 'customerName', 'productName', 'quantity', 'totalAmount'
  ]);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productType, setProductType] = useState('All');
  const [salesperson, setSalesperson] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      const [s, u] = await Promise.all([getStoredSales(), getStoredUsers()]);
      setSales(s || []);
      setUsers(u || []);
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
    if (productType !== 'All') {
      filtered = filtered.filter(s => s.productType === productType);
    }
    if (salesperson !== 'All') {
      filtered = filtered.filter(s => s.salespersonId === salesperson);
    }

    setFilteredSales(filtered);
  }, [dateFrom, dateTo, productType, salesperson, sales]);

  const exportOptions = [
    { id: 'date', label: 'Transaction Date' },
    { id: 'time', label: 'Transaction Time' },
    { id: 'id', label: 'Bill ID' },
    { id: 'customerName', label: 'Customer Name' },
    { id: 'customerContact', label: 'Customer Contact' },
    { id: 'productName', label: 'Product Name' },
    { id: 'productType', label: 'Product Type' },
    { id: 'quantity', label: 'Quantity' },
    { id: 'totalAmount', label: 'Total Amount' },
    { id: 'salespersonName', label: 'Sales Executive' },
  ];

  const handleToggleField = (id: string) => {
    setSelectedFields(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const exportToCSV = () => {
    const headers = exportOptions
      .filter(opt => selectedFields.includes(opt.id))
      .map(opt => opt.label);

    const rows = filteredSales.map(s => {
      const data: Record<string, any> = {
        date: new Date(s.date).toLocaleDateString(),
        time: new Date(s.date).toLocaleTimeString(),
        id: s.id,
        customerName: s.customerName,
        customerContact: s.customerContact,
        productName: s.productName,
        productType: s.productType,
        quantity: s.quantity,
        totalAmount: s.totalAmount,
        salespersonName: s.salespersonName
      };
      
      return selectedFields.map(field => data[field]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `eyetrends_report_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
          <i className="fa-solid fa-filter mr-2 text-indigo-500"></i>
          Report Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date From</label>
            <input type="date" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date To</label>
            <input type="date" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Type</label>
            <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              value={productType} onChange={e => setProductType(e.target.value)}>
              <option value="All">All Types</option>
              {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Salesperson</label>
            <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              value={salesperson} onChange={e => setSalesperson(e.target.value)}>
              <option value="All">All Staff</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <i className="fa-solid fa-vault text-2xl"></i>
          </div>
          <div>
            <p className="text-indigo-100 text-sm font-medium">Total for Selection</p>
            <p className="text-2xl font-bold">{CURRENCY}{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowExportModal(true)}
          disabled={filteredSales.length === 0}
          className="px-6 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
        >
          <i className="fa-solid fa-file-csv text-green-600"></i>
          <span>Custom Export</span>
        </button>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-xl font-black text-[#0A1931]">Export Configuration</h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="p-8">
              <p className="text-sm text-gray-500 mb-6">Select the data fields you want to include in your CSV report:</p>
              <div className="grid grid-cols-2 gap-3">
                {exportOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleToggleField(opt.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedFields.includes(opt.id)
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedFields.includes(opt.id) && <i className="fa-solid fa-check"></i>}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-8 bg-gray-50 flex gap-4">
              <button 
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={exportToCSV}
                className="flex-1 py-4 bg-[#0A1931] text-white rounded-2xl font-bold hover:bg-indigo-900 transition-all shadow-xl shadow-indigo-950/20"
              >
                Generate CSV
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Item Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(sale.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{sale.customerName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{sale.productName}</p>
                    <p className="text-xs text-indigo-500 uppercase font-bold">{sale.productType}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{sale.quantity}</td>
                  <td className="px-6 py-4 font-bold text-indigo-600">
                    {CURRENCY}{sale.totalAmount}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-semibold">
                    {sale.salespersonName}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                    No results found for current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
