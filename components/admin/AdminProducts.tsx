import React, { useState, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, X, Save, Search, Truck, Upload, Loader2,
  Box, Layers, RotateCcw, Image as ImageIcon,
} from 'lucide-react';
import { Product, ProductVariation } from '../../types';
import { addProduct, updateProduct, deleteProduct } from '../../services/productService';
import { uploadImage } from '../../services/storageService';
import { BRANDS } from '../../constants';
import { useToast } from '../../context/ToastContext';

interface AdminProductsProps {
  products: Product[];
  onProductUpdate: () => void;
}

const AdminProducts: React.FC<AdminProductsProps> = ({ products, onProductUpdate }) => {
  const { addToast } = useToast();
  const [productSearch, setProductSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [isCustomBrand, setIsCustomBrand] = useState(false);

  const availableBrands = useMemo(() => {
    const unique = new Set([...BRANDS, ...products.map(p => p.brand)]);
    return Array.from(unique).sort();
  }, [products]);

  const filtered = products.filter(
    p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase())
  );

  const openNew = () => {
    setCurrentProduct({
      name: '',
      brand: BRANDS[0],
      price: 0,
      image: 'https://picsum.photos/400/400',
      images: [],
      category: 'Unissex',
      description: '',
      rating: 5,
      reviews: 0,
      isNew: true,
      weight: 0.5,
      dimensions: { width: 10, height: 15, depth: 10 },
      variations: [],
    });
    setIsCustomBrand(false);
    setIsEditing(true);
  };

  const openEdit = (product: Product) => {
    setCurrentProduct({
      ...product,
      images: product.images || [],
      variations: (product.variations || []).map(v => ({
        ...v,
        dimensions: v.dimensions || { width: 0, height: 0, depth: 0 }
      })),
      dimensions: product.dimensions || { width: 0, height: 0, depth: 0 },
      weight: product.weight || 0,
    });
    setIsCustomBrand(false);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    setLoadingProduct(true);
    try {
      await deleteProduct(id);
      await onProductUpdate();
      addToast('Produto excluído com sucesso!', 'success');
    } catch (error: any) {
      const msg =
        error.code === 'permission-denied'
          ? '⚠️ PERMISSÃO NEGADA: Ajuste as Regras no Console do Firebase.'
          : 'Erro ao excluir produto.';
      addToast(msg, 'error');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    try {
      const url = await uploadImage(file, 'products');
      setCurrentProduct(prev => ({ ...prev, image: url }));
      addToast('Imagem principal enviada!', 'success');
    } catch {
      addToast('Erro ao enviar imagem.', 'error');
    } finally {
      setUploadingMain(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadImage(f, 'products')));
      setCurrentProduct(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }));
      addToast(`${urls.length} imagem(ns) adicionada(s)!`, 'success');
    } catch {
      addToast('Erro ao enviar imagens.', 'error');
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const newImages = [...(currentProduct.images || [])];
    newImages.splice(index, 1);
    setCurrentProduct(prev => ({ ...prev, images: newImages }));
  };

  const setAsMainImage = (url: string, index: number) => {
    const newImages = [...(currentProduct.images || [])];
    newImages.splice(index, 1);
    setCurrentProduct(prev => ({ ...prev, image: url, images: newImages }));
  };

  const handleAddVariation = () => {
    const newVar: ProductVariation = {
      id: Math.random().toString(36).substr(2, 9),
      size: '',
      price: 0,
      weight: 0,
      dimensions: { width: 0, height: 0, depth: 0 },
    };
    setCurrentProduct(prev => ({ ...prev, variations: [...(prev.variations || []), newVar] }));
  };

  const handleRemoveVariation = (index: number) => {
    const newVars = [...(currentProduct.variations || [])];
    newVars.splice(index, 1);
    setCurrentProduct(prev => ({ ...prev, variations: newVars }));
  };

  const handleUpdateVariation = (index: number, field: keyof ProductVariation, value: any) => {
    const newVars = [...(currentProduct.variations || [])];
    newVars[index] = { ...newVars[index], [field]: value };
    setCurrentProduct(prev => ({ ...prev, variations: newVars }));
  };

  const handleUpdateVariationDim = (index: number, dim: 'width' | 'height' | 'depth', value: number) => {
    const newVars = [...(currentProduct.variations || [])];
    newVars[index] = {
      ...newVars[index],
      dimensions: { ...(newVars[index].dimensions || { width: 0, height: 0, depth: 0 }), [dim]: value },
    };
    setCurrentProduct(prev => ({ ...prev, variations: newVars }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProduct(true);
    try {
      const safeNum = (val: any, def = 0) => {
        if (val === '' || val == null) return def;
        const n = Number(val);
        return isNaN(n) ? def : n;
      };
      const safeOpt = (val: any) => {
        if (val === '' || val == null) return null;
        const n = Number(val);
        return isNaN(n) ? null : n;
      };

      const payload: any = {
        name: currentProduct.name,
        brand: currentProduct.brand,
        image: currentProduct.image,
        images: currentProduct.images || [],
        category: currentProduct.category,
        description: currentProduct.description,
        isNew: !!currentProduct.isNew,
        price: safeNum(currentProduct.price),
        rating: safeNum(currentProduct.rating, 5),
        reviews: safeNum(currentProduct.reviews),
        weight: safeNum(currentProduct.weight),
        dimensions: {
          width: safeNum(currentProduct.dimensions?.width),
          height: safeNum(currentProduct.dimensions?.height),
          depth: safeNum(currentProduct.dimensions?.depth),
        },
        variations: (currentProduct.variations || []).map(v => {
          const cleaned: any = {
            id: v.id,
            size: v.size || '',
            price: safeNum(v.price),
            weight: safeNum(v.weight),
            dimensions: {
              width: safeNum(v.dimensions?.width),
              height: safeNum(v.dimensions?.height),
              depth: safeNum(v.dimensions?.depth),
            },
          };
          const op = safeOpt(v.oldPrice);
          if (op !== null) cleaned.oldPrice = op;
          const st = safeOpt(v.stock);
          if (st !== null) cleaned.stock = st;
          return cleaned;
        }),
      };

      const rootOp = safeOpt(currentProduct.oldPrice);
      if (rootOp !== null) payload.oldPrice = rootOp;

      if (currentProduct.id) {
        await updateProduct(currentProduct.id, payload);
        addToast('Produto atualizado!', 'success');
      } else {
        await addProduct(payload);
        addToast('Produto criado!', 'success');
      }

      await onProductUpdate();
      setIsEditing(false);
    } catch (error: any) {
      addToast(error.code === 'permission-denied' ? '⚠️ PERMISSÃO NEGADA.' : 'Erro ao salvar produto.', 'error');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleMigrateCorpo = async () => {
    if (!window.confirm('Deseja mover todos os "Body Splash" e "Cremes Corporais" para a categoria "Para o Corpo" automaticamente?')) return;
    setLoadingProduct(true);
    try {
      const keywords = ['body splash', 'creme corporal', 'body cream', 'loção corporal', 'locao corporal', 'hidratante corporal'];
      const toUpdate = products.filter(p => 
        keywords.some(k => p.name.toLowerCase().includes(k)) && p.category !== 'Para o Corpo'
      );

      if (toUpdate.length === 0) {
        addToast('Nenhum produto encontrado para migração.', 'info');
        return;
      }

      let count = 0;
      for (const p of toUpdate) {
        await updateProduct(p.id, { category: 'Para o Corpo' });
        count++;
      }
      
      await onProductUpdate();
      addToast(`${count} produtos migrados para a categoria "Para o Corpo"!`, 'success');
    } catch (error) {
      addToast('Erro na migração de categorias.', 'error');
    } finally {
      setLoadingProduct(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-accent-gold outline-none"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleMigrateCorpo}
            disabled={loadingProduct}
            className="bg-white border border-indigo-200 text-indigo-600 px-4 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
            title="Mover Body Splash e Cremes para categoria 'Para o Corpo'"
          >
            {loadingProduct ? <Loader2 size={18} className="animate-spin" /> : <Layers size={18} />}
            Migrar para o Corpo
          </button>
          <button
            onClick={openNew}
            className="bg-accent-gold text-white px-6 py-2 rounded-lg font-bold hover:bg-[#c49b2d] transition-colors flex items-center gap-2 shadow-sm flex-1 md:flex-initial justify-center"
          >
            <Plus size={20} /> Novo Produto
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          Nenhum produto encontrado.
        </div>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="p-4 w-20">Imagem</th>
                    <th className="p-4">Nome</th>
                    <th className="p-4">Marca</th>
                    <th className="p-4">Preço</th>
                    <th className="p-4 text-center">Variações</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden border border-gray-200">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="p-4 font-bold text-gray-700">{product.name}</td>
                      <td className="p-4 text-gray-600">{product.brand}</td>
                      <td className="p-4 font-mono text-gray-700">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">
                          {product.variations?.length || 0}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={loadingProduct}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-3">
            {filtered.map(product => (
              <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.brand}</p>
                  <p className="text-sm font-bold text-primary mt-0.5">
                    R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">
                    {product.variations?.length || 0} var.
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={loadingProduct}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Edit / Create Modal */}
      {isEditing && (
        <div id="admin-product-modal" className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
            style={{ minHeight: '300px', backgroundColor: 'white', zIndex: 10001 }}
          >
            <form onSubmit={handleSave}>
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
                <h2 className="font-serif text-2xl font-bold text-primary">
                  {currentProduct.id ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button type="button" onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Nome</label>
                      <input
                        required
                        type="text"
                        value={currentProduct.name || ''}
                        onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Marca</label>
                      {isCustomBrand ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Digite a nova marca"
                            value={currentProduct.brand || ''}
                            onChange={e => setCurrentProduct({ ...currentProduct, brand: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none bg-yellow-50"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomBrand(false);
                              setCurrentProduct({ ...currentProduct, brand: availableBrands[0] || '' });
                            }}
                            className="p-2 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"
                            title="Cancelar nova marca"
                          >
                            <RotateCcw size={18} />
                          </button>
                        </div>
                      ) : (
                        <select
                          value={currentProduct.brand || ''}
                          onChange={e => {
                            if (e.target.value === '__NEW__') {
                              setIsCustomBrand(true);
                              setCurrentProduct({ ...currentProduct, brand: '' });
                            } else {
                              setCurrentProduct({ ...currentProduct, brand: e.target.value });
                            }
                          }}
                          className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none"
                        >
                          {availableBrands.map(b => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                          <option value="__NEW__" className="font-bold bg-gray-50">
                            + Criar nova marca...
                          </option>
                        </select>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Preço (Base)</label>
                        <input
                          required
                          type="number"
                          step="0.01"
                          value={currentProduct.price || ''}
                          onChange={e => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                          className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Preço Antigo</label>
                        <input
                          type="number"
                          step="0.01"
                          value={currentProduct.oldPrice || ''}
                          onChange={e => setCurrentProduct({ ...currentProduct, oldPrice: parseFloat(e.target.value) })}
                          className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Main Image */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Imagem Principal</label>
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 space-y-2">
                          <input
                            required
                            type="text"
                            placeholder="URL da imagem"
                            value={currentProduct.image || ''}
                            onChange={e => setCurrentProduct({ ...currentProduct, image: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none"
                          />
                          <label className="inline-flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                            {uploadingMain ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            Fazer Upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleMainImageUpload}
                              disabled={uploadingMain}
                            />
                          </label>
                        </div>
                        <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden shrink-0">
                          {currentProduct.image ? (
                            <img src={currentProduct.image} className="w-full h-full object-cover" alt="Preview" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon size={24} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
                      <select
                        value={currentProduct.category || ''}
                        onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value as any })}
                        className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none"
                      >
                        <option value="Perfumes">Perfumes</option>
                        <option value="Para o Corpo">Para o Corpo</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Unissex">Unissex</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                      <textarea
                        required
                        value={currentProduct.description || ''}
                        onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded focus:border-accent-gold outline-none h-24 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Gallery */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                      <ImageIcon size={18} /> Galeria de Imagens
                    </h3>
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-1">
                      {uploadingGallery ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Adicionar
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleGalleryUpload}
                        disabled={uploadingGallery}
                      />
                    </label>
                  </div>
                  {(currentProduct.images || []).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      Nenhuma imagem na galeria. Adicione imagens extras para mostrar ao cliente.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {(currentProduct.images || []).map((url, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white">
                          <img src={url} alt={`${currentProduct.name} ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setAsMainImage(url, idx)}
                              className="text-[10px] text-white bg-accent-gold px-2 py-0.5 rounded font-bold"
                              title="Definir como principal"
                            >
                              Principal
                            </button>
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(idx)}
                              className="text-white hover:text-red-400 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Logistics */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Truck size={18} /> Logística Padrão (Fallback)
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Peso (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={currentProduct.weight || ''}
                        onChange={e => setCurrentProduct({ ...currentProduct, weight: parseFloat(e.target.value) })}
                        className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                      />
                    </div>
                    {(['width', 'height', 'depth'] as const).map((dim, i) => (
                      <div key={dim}>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                          {['Largura', 'Altura', 'Prof.'][i]} (cm)
                        </label>
                        <input
                          type="number"
                          value={currentProduct.dimensions?.[dim] || ''}
                          onChange={e =>
                            setCurrentProduct({
                              ...currentProduct,
                              dimensions: {
                                ...(currentProduct.dimensions || { width: 0, height: 0, depth: 0 }),
                                [dim]: parseFloat(e.target.value),
                              } as any,
                            })
                          }
                          className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variations */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                      <Layers size={20} /> Variações
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddVariation}
                      className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-lg font-bold transition-colors"
                    >
                      + Adicionar
                    </button>
                  </div>

                  <div className="space-y-4">
                    {currentProduct.variations?.map((v, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariation(idx)}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <input
                            type="text"
                            placeholder="Tamanho (ex: 50ml)"
                            value={v.size}
                            onChange={e => handleUpdateVariation(idx, 'size', e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:border-accent-gold outline-none"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Preço (R$)"
                            value={v.price || ''}
                            onChange={e => handleUpdateVariation(idx, 'price', e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:border-accent-gold outline-none"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Preço Antigo"
                            value={v.oldPrice || ''}
                            onChange={e => handleUpdateVariation(idx, 'oldPrice', e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:border-accent-gold outline-none"
                          />
                          <input
                            type="number"
                            placeholder="Estoque"
                            value={v.stock || ''}
                            onChange={e => handleUpdateVariation(idx, 'stock', e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:border-accent-gold outline-none"
                          />
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-gray-200/50">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                            <Box size={12} /> Logística da Variação
                          </h5>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="relative">
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">KG</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Peso"
                                value={v.weight || ''}
                                onChange={e => handleUpdateVariation(idx, 'weight', e.target.value)}
                                className="w-full p-1.5 text-xs border border-gray-300 rounded focus:border-accent-gold outline-none"
                              />
                            </div>
                            {(['width', 'height', 'depth'] as const).map((dim, di) => (
                              <div key={dim} className="relative">
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                                  {['L', 'A', 'P'][di]}
                                </span>
                                <input
                                  type="number"
                                  placeholder={['Largura', 'Altura', 'Prof'][di]}
                                  value={v.dimensions?.[dim] || ''}
                                  onChange={e => handleUpdateVariationDim(idx, dim, parseFloat(e.target.value))}
                                  className="w-full p-1.5 text-xs border border-gray-300 rounded focus:border-accent-gold outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!currentProduct.variations || currentProduct.variations.length === 0) && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                        Nenhuma variação adicionada
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex justify-end gap-3 z-10">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingProduct}
                  className="px-8 py-2 bg-primary text-white rounded-lg font-bold hover:bg-accent-gold transition-colors flex items-center gap-2"
                >
                  {loadingProduct ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
