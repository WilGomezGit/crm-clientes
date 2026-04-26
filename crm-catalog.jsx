// crm-catalog.jsx — Product catalog management
const { useState: useCatState, useMemo: useCatMemo } = React;

const CATEGORIES = ['Perfumes', 'Cremas', 'Maquillaje', 'Cuidado facial', 'Cabello', 'Accesorios'];

function ProductForm({ product, onSave, onClose }) {
  const [form, setCatForm] = useCatState(product || { name: '', category: CATEGORIES[0], price: '', stock: '', sku: '', description: '', featured: false });
  const set = (k, v) => setCatForm(f => ({ ...f, [k]: v }));
  const [errors, setErrors] = useCatState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nombre requerido';
    if (!form.price || form.price <= 0) e.price = 'Precio inválido';
    setErrors(e);
    return !Object.keys(e).length;
  };

  return (
    <div className="p-5 space-y-3.5">
      <Input label="Nombre del producto *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Perfume Chanel 50ml" error={errors.name}/>
      <Select label="Categoría" value={form.category} onChange={e => set('category', e.target.value)}>
        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Precio ($) *" type="number" min="0" value={form.price} onChange={e => set('price', +e.target.value)} error={errors.price}/>
        <Input label="Stock" type="number" min="0" value={form.stock} onChange={e => set('stock', +e.target.value)}/>
      </div>
      <Input label="SKU / Código" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Ej: PER-001"/>
      <Textarea label="Descripción" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Breve descripción del producto..." rows={2}/>
      <label className="flex items-center gap-2.5 cursor-pointer py-1">
        <div onClick={() => set('featured', !form.featured)}
          className={`w-10 h-5.5 rounded-full relative transition-colors flex items-center px-0.5 ${form.featured ? 'bg-primary-600' : 'bg-gray-200'}`}
          style={{ height: 22 }}>
          <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.featured ? 'translate-x-5' : ''}`}/>
        </div>
        <span className="text-sm text-gray-700 font-medium">Producto destacado</span>
      </label>
      <div className="flex gap-2 pt-1">
        <Btn variant="secondary" onClick={onClose} className="flex-1">Cancelar</Btn>
        <Btn onClick={() => { if (validate()) { onSave(form); onClose(); } }} className="flex-1">
          <IconCheck size={15}/>{product ? 'Guardar' : 'Agregar producto'}
        </Btn>
      </div>
    </div>
  );
}

function StockBadge({ stock }) {
  if (stock === '' || stock === null || stock === undefined) return null;
  const n = Number(stock);
  if (n === 0) return <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Sin stock</span>;
  if (n <= 5) return <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Bajo: {n}</span>;
  return <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">{n} en stock</span>;
}

function ProductCard({ product, onEdit, onDelete, onAddToOrder }) {
  const catColors = { Perfumes: '#8b5cf6', Cremas: '#ec4899', Maquillaje: '#f43f5e', 'Cuidado facial': '#06b6d4', Cabello: '#10b981', Accesorios: '#f59e0b' };
  const color = catColors[product.category] || '#6366f1';
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 slide-up dark:bg-slate-800 dark:border-slate-700">
      {/* Image placeholder */}
      <div className="h-32 flex flex-col items-center justify-center relative" style={{ background: color + '15' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1" style={{ background: color + '25' }}>
          <IconPackage size={24} style={{ color }}/>
        </div>
        {product.featured && (
          <div className="absolute top-2 right-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <IconStar size={9}/>Destacado
          </div>
        )}
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: color }}>{product.category}</span>
      </div>
      <div className="p-3.5">
        <p className="font-semibold text-gray-900 text-sm mb-0.5 leading-snug dark:text-slate-100">{product.name}</p>
        {product.sku && <p className="text-[10px] text-gray-400 mb-2 dark:text-slate-500">SKU: {product.sku}</p>}
        {product.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2 dark:text-slate-400">{product.description}</p>}
        <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-bold text-primary-600">{formatCurrency(product.price)}</p>
          <StockBadge stock={product.stock}/>
        </div>
        <div className="flex items-center gap-1">
          <Btn size="sm" onClick={() => onAddToOrder(product)} className="flex-1 text-xs">
            <IconShoppingBag size={12}/>Pedir
          </Btn>
          <button onClick={() => onEdit(product)} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition-colors dark:hover:bg-slate-700"><IconEdit size={14}/></button>
          <button onClick={() => onDelete(product)} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors dark:hover:bg-red-900/30"><IconTrash size={14}/></button>
        </div>
      </div>
    </div>
  );
}

function CatalogView() {
  const { state, dispatch, notify } = useCRM();
  const [search, setSearch] = useCatState('');
  const [catFilter, setCatFilter] = useCatState('all');
  const [showAdd, setShowAdd] = useCatState(false);
  const [editProduct, setEditProduct] = useCatState(null);
  const [deleteProduct, setDeleteProduct] = useCatState(null);

  const filtered = useCatMemo(() => {
    let list = state.catalog || [];
    if (catFilter !== 'all') list = list.filter(p => p.category === catFilter);
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [state.catalog, catFilter, search]);

  const handleAdd = (p) => { dispatch({ type: 'ADD_PRODUCT', product: p }); notify('Producto agregado ✅'); };
  const handleEdit = (p) => { dispatch({ type: 'UPDATE_PRODUCT', product: p }); notify('Producto actualizado ✅'); };
  const handleDelete = (id) => { dispatch({ type: 'DELETE_PRODUCT', id }); notify('Producto eliminado', 'warn'); };
  const handleAddToOrder = (p) => { dispatch({ type: 'NAVIGATE', view: 'orders' }); notify(`Abriendo pedidos para "${p.name}" 🛍️`); };

  const stats = useCatMemo(() => {
    const list = state.catalog || [];
    return {
      total: list.length,
      lowStock: list.filter(p => Number(p.stock) <= 5 && Number(p.stock) > 0).length,
      outOfStock: list.filter(p => Number(p.stock) === 0).length,
      featured: list.filter(p => p.featured).length,
    };
  }, [state.catalog]);

  return (
    <div className="fade-in">
      <TopBar title={`Catálogo (${(state.catalog||[]).length})`} actions={
        <Btn size="sm" onClick={() => setShowAdd(true)}><IconPlus size={14}/>Agregar</Btn>
      }/>

      {/* Mini stats bar */}
      <div className="px-4 md:px-6 py-2.5 bg-white border-b border-gray-100 dark:bg-slate-900 dark:border-slate-800 flex items-center gap-4 overflow-x-auto">
        {[
          { label: 'Productos', val: stats.total, color: 'text-primary-600' },
          { label: 'Stock bajo', val: stats.lowStock, color: 'text-amber-600' },
          { label: 'Sin stock', val: stats.outOfStock, color: 'text-red-500' },
          { label: 'Destacados', val: stats.featured, color: 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-sm font-bold ${s.color}`}>{s.val}</span>
            <span className="text-xs text-gray-400 dark:text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Search + category filter */}
      <div className="px-4 md:px-6 py-3 bg-white border-b border-gray-100 dark:bg-slate-900 dark:border-slate-800 space-y-2.5">
        <div className="relative">
          <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto o SKU..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:placeholder-slate-500"/>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          <button onClick={() => setCatFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${catFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300'}`}>
            Todos
          </button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${catFilter === c ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300'}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6 pb-24 md:pb-6">
        {filtered.length === 0 ? (
          <EmptyState icon={<IconPackage size={24}/>} title="Sin productos" desc={search ? 'Intenta con otro término' : 'Agrega tu primer producto al catálogo'}
            action={<Btn onClick={() => setShowAdd(true)}><IconPlus size={15}/>Agregar producto</Btn>}/>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map(p => <ProductCard key={p.id} product={p} onEdit={setEditProduct} onDelete={setDeleteProduct} onAddToOrder={handleAddToOrder}/>)}
          </div>
        )}
      </div>



      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo producto" size="lg">
        <ProductForm onSave={handleAdd} onClose={() => setShowAdd(false)}/>
      </Modal>
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Editar producto" size="lg">
        {editProduct && <ProductForm product={editProduct} onSave={p => handleEdit({ ...editProduct, ...p })} onClose={() => setEditProduct(null)}/>}
      </Modal>
      <ConfirmDialog open={!!deleteProduct} title="¿Eliminar producto?"
        desc={`Se eliminará "${deleteProduct?.name}" del catálogo.`}
        onConfirm={() => handleDelete(deleteProduct.id)} onClose={() => setDeleteProduct(null)}/>
    </div>
  );
}

window.CatalogView = CatalogView;
