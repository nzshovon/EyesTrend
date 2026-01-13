import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getStoredProducts, getStoredSales, getAppConfig } from '../services/storage';
import { getBusinessInsights } from '../services/gemini';
import { Product, Sale, AppConfig } from '../types';
import { CURRENCY } from '../constants';

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [p, s, c] = await Promise.all([
        getStoredProducts(),
        getStoredSales(),
        getAppConfig()
      ]);
      setProducts(p || []);
      setSales(s || []);
      setConfig(c);

      if (c.enableGeminiInsights) {
        setLoadingInsights(true);
        const res = await getBusinessInsights(p || [], s || []);
        setInsights(res || "No insights available yet.");
        setLoadingInsights(false);
      }
    };
    
    fetchData();
  }, []);

  const totalValue = products.reduce((acc, p) => acc + (p.sellingPrice * p.stockQuantity), 0);
  const lowStock = products.filter(p => p.stockQuantity <= p.minStockLevel).length;
  const monthlyRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  
  const chartData = products.slice(0, 5).map(p => ({
    name: p.brand,
    stock: p.stockQuantity
  }));

  const COLORS = ['#4f46e5', '#818cf8', '#6366f1', '#a5b4fc', '#c7d2fe'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-money-bill-trend-up text-indigo-600 text-xl"></i>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500">Inventory Value</p>
          <p className="text-2xl font-bold text-gray-900">{CURRENCY}{totalValue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-receipt text-blue-600 text-xl"></i>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900">{CURRENCY}{monthlyRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-triangle-exclamation text-red-600 text-xl"></i>
            </div>
            {lowStock > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">Low Stock</span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-500">Restock Items</p>
          <p className="text-2xl font-bold text-gray-900">{lowStock}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-cart-shopping text-emerald-600 text-xl"></i>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500">Orders</p>
          <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${config?.enableGeminiInsights ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
        <div className={`${config?.enableGeminiInsights ? 'lg:col-span-2' : ''} bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-w-0`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Inventory Distribution</h3>
          </div>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="stock" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 italic">No inventory recorded.</div>
            )}
          </div>
        </div>

        {config?.enableGeminiInsights && (
          <div className="bg-[#0A1931] text-white p-6 rounded-2xl shadow-xl flex flex-col border border-indigo-500/30">
            <div className="flex items-center space-x-2 mb-6">
              <i className="fa-solid fa-sparkles text-yellow-400 animate-pulse"></i>
              <h3 className="text-lg font-bold">AI Business Insights</h3>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {loadingInsights ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                  <p className="text-indigo-300 text-xs animate-pulse italic">Thinking...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm">
                  <p className="text-indigo-100 whitespace-pre-wrap leading-relaxed">{insights}</p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
              <p className="text-[10px] text-gray-500 font-mono">POWERED BY GEMINI 3 FLASH</p>
              <i className="fa-solid fa-brain text-indigo-400"></i>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;