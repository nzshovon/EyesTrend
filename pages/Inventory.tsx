
import React, { useState, useEffect } from 'react';
import { getStoredProducts, saveProducts, getAppConfig, addAuditLog } from '../services/storage';
import { Product, User, UserRole, AppConfig, AuditActionType } from '../types';
import { PRODUCT_TYPES, CURRENCY } from '../constants';

interface InventoryProps {
  currentUser: User;
}

const Inventory: React.FC<InventoryProps> = ({ currentUser }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<Product>>({
    brand: '', model: '', type: 'Frame', material: '', color: '',
    costPrice: 0, sellingPrice: 0, stockQuantity: 0, minStockLevel: 5,
    description: '', imageUrl: ''
  });

  useEffect(() => {
    const init = async () => {
      const [p, c] = await Promise.all([getStoredProducts(), getAppConfig()]);
      setProducts(p || []);
      setConfig(c);
    };
    init();
  }, []);

  const downloadTemplate = () => {
    const headers = ['Brand', 'Model', 'Type', 'Material', 'Color', 'CostPrice', 'SellingPrice', 'Stock', 'MinStock', 'Description'];
    const sampleData = ['Ray-Ban', 'Aviator Classic', 'Sunglasses', 'Metal', 'Gold', '5000', '7500', '10', '2', 'Original classics'];
    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'eyetrends_inventory_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportInventory = () => {
    const headers = ['Brand', 'Model', 'Type', 'Material', 'Color', 'CostPrice', 'SellingPrice', 'Stock', 'MinStock', 'LastUpdated'];
    const rows = products.map(p => [
      p.brand,
      p.model,
      p.type,
      p.material,
      p.color,
      p.costPrice,
      p.sellingPrice,
      p.stockQuantity,
      p.minStockLevel,
      new Date(p.lastUpdated).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `eyetrends_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newItems: Product[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < 9) continue;

        newItems.push({
          id: Date.now().toString() + i,
          brand: cols[0],
          model: cols[1],
          type: (cols[2] as any) || 'Frame',
          material: cols[3],
          color: cols[4],
          costPrice: Number(cols[5]) || 0,
          sellingPrice: Number(cols[6]) || 0,
          stockQuantity: Number(cols[7]) || 0,
          minStockLevel: Number(cols[8]) || 5,
          description: cols[9] || '',
          lastUpdated: new Date().toISOString()
        });
      }

      const updated = [...newItems, ...products];
      setProducts(updated);
      saveProducts(updated);
      addAuditLog(currentUser, AuditActionType.CREATE, 'PRODUCT', `Bulk imported ${newItems.length} products via CSV.`);
      setIsUploading(false);
      alert(`${newItems.length} products imported successfully!`);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !formData.id;
    const newProduct: Product = {
      id: formData.id || Date.now().toString(),
      brand: formData.brand || '',
      model: formData.model || '',
      type: (formData.type as any) || 'Frame',
      material: formData.material || '',
      color: formData.color || '',
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      stockQuantity: Number(formData.stockQuantity),
      minStockLevel: Number(formData.minStockLevel),
      description: formData.description || '',
      imageUrl: formData.imageUrl,
      lastUpdated: new Date().toISOString()
    };

    const updated = isNew ? [newProduct, ...products] : products.map(p => p.id === formData.id ? newProduct : p);
    setProducts(updated);
    saveProducts(updated);
    
    addAuditLog(
      currentUser, 
      isNew ? AuditActionType.CREATE : AuditActionType.UPDATE, 
      'PRODUCT', 
      `${isNew ? 'Added' : 'Updated'} product: ${newProduct.brand} ${newProduct.model} (Stock: ${newProduct.stockQuantity})`
    );

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => setFormData({ brand: '', model: '', type: 'Frame', material: '', color: '', costPrice: 0, sellingPrice: 0, stockQuantity: 0, minStockLevel: 5, description: '', imageUrl: '' });

  const filteredProducts = products.filter(p => (p.brand + p.model).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" placeholder="Quick find product..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={exportInventory} className="px-4 py-3 bg-white border border-gray-200 text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 flex items-center space-x-2 shadow-sm transition-all">
            <i className="fa-solid fa-file-export"></i>
            <span className="hidden lg:inline">Download Stock</span>
          </button>
          {currentUser.permissions.canAddInventory && (
            <>
              <button onClick={downloadTemplate} className="px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 flex items-center space-x-2 shadow-sm transition-all">
                <i className="fa-solid fa-download"></i>
                <span className="hidden lg:inline">Template</span>
              </button>
              <label className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex items-center space-x-2 shadow-lg cursor-pointer transition-all">
                <i className="fa-solid fa-file-import"></i>
                <span className="hidden lg:inline">Bulk Import</span>
                <input type="file" accept=".csv" onChange={handleBulkUpload} className="hidden" />
              </label>
              <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg flex items-center space-x-2 transition-all">
                <i className="fa-solid fa-plus"></i>
                <span>Add Item</span>
              </button>
            </>
          )}
        </div>
      </div>

      {isUploading && <div className="p-4 bg-indigo-50 text-indigo-700 rounded-xl animate-pulse font-bold border border-indigo-100">Syncing with database...</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {config?.enableProductImages && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Item</th>}
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">In Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  {config?.enableProductImages && (
                    <td className="px-6 py-4">
                      {product.imageUrl ? <img src={product.imageUrl} className="w-12 h-12 object-cover rounded-xl border border-gray-100 shadow-sm" alt={product.brand} /> : <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300"><i className="fa-solid fa-glasses"></i></div>}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-[#0A1931]">{product.brand}</p>
                      <p className="text-sm text-gray-400 font-medium">{product.model}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase">{product.type}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${product.stockQuantity <= product.minStockLevel ? 'text-red-500' : 'text-gray-700'}`}>{product.stockQuantity}</span>
                      {product.stockQuantity <= product.minStockLevel && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{CURRENCY}{product.sellingPrice}</p>
                    <p className="text-[10px] text-gray-400 font-mono">Cost: {CURRENCY}{product.costPrice}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={() => { setFormData(product); setIsModalOpen(true); }} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"><i className="fa-solid fa-pen"></i></button>
                      {currentUser.role === UserRole.ADMIN && <button onClick={() => { if(confirm('Remove item?')) { 
                        const u = products.filter(p => p.id !== product.id); 
                        setProducts(u); 
                        saveProducts(u); 
                        addAuditLog(currentUser, AuditActionType.DELETE, 'PRODUCT', `Removed product: ${product.brand} ${product.model}`);
                      } }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"><i className="fa-solid fa-trash"></i></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0A1931]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-[#0A1931]">{formData.id ? 'Modify Product' : 'New Eye Trends Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-all"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
              {config?.enableProductImages && (
                <div className="flex items-center space-x-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border border-gray-200">
                    {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <i className="fa-solid fa-camera text-gray-200 text-3xl"></i>}
                  </div>
                  <div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="item-img" />
                    <label htmlFor="item-img" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-700 shadow-md transition-all">Change View</label>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Brand</label>
                  <input required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Model</label>
                  <input required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Type</label>
                  <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl transition-all" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                    {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Color</label>
                  <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl transition-all" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Cost Price ({CURRENCY})</label>
                  <input required type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl transition-all" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Sale Price ({CURRENCY})</label>
                  <input required type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-indigo-600 transition-all" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Current Stock</label>
                  <input required type="number" min="0" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Minimum Stock Level</label>
                  <input required type="number" min="0" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" value={formData.minStockLevel} onChange={e => setFormData({...formData, minStockLevel: Number(e.target.value)})} />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-[#0A1931] text-white rounded-2xl font-bold shadow-xl hover:translate-y-[-2px] transition-all">Complete Operation</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
