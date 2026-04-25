// crm-orders.jsx — Orders management with catalog integration
const { useState: useOrdersState, useMemo: useOrdersMemo } = React;

function OrderForm({ order, clients, catalog, onSave, onClose }) {
  const [form, setForm] = useOrdersState(
    order || { clientId: '', clientName: '', product: '', qty: 1, price: '', total: 0, status: 'pending', notes: '' }
  );
  const [errors, setErrors] = useOrdersState({});

  const set = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    if (k === 'qty' || k === 'price') {
      const qty = parseFloat(k === 'qty' ? v : next.qty) || 0;
      const price = parseFloat(k === 'price' ? v : next.price) || 0;
      next.total = qty * price;
    }
    if (k === 'clientId') {
      const c = clients.find(c => c.id === v);
      if (c) next.clientName = c.name;
    }
    if (k === 'product') {
      const p = catalog.find(p => p.name === v);
      if (p) { next.price = p.price; next.total = (parseFloat(next.qty) || 1) * p.price; }
    }
    return next;
  });

  const validate = () => {
    const e = {};
    if (!form.clientId) e.clientId = 'Selecciona un cliente';
    if (!form.product.trim()) e.product = 'Agrega un producto';
    if (!form.price || parseFloat(form.price) <= 0) e.price = 'Precio inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => { if (!validate()) return; onSave(form); onClose(); };

  // Combine catalog products with order product (if existing)
  const productOptions = useOrdersMemo(() => {
    const names = new Set(catalog.map(p => p.name));
    const extra = form.product && !names.has(form.product) ? [form.product] : [];
    return [...extra, ...catalog.map(p => p.name)];
  }, [catalog, form.product]);

  return (
    <div className="p-5 space-y-3.5">
      <Select label="Cliente *" value={form.clientId} onChange={e => set('clientId', e.target.value)}>
        <option value="">— Selecciona un cliente —</option>
        {clients.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      {errors.clientId && <p className="text-xs text-red-500 -mt-2">{errors.clientId}</p>}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Producto *</label>
        <input list="products-datalist" value={form.product} onChange={e => set('product', e.target.value)}
          placeholder="Nombre del producto o selecciona del catálogo"
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors"/>
        <datalist id="products-datalist">
          {productOptions.map(p => <option key={p} value={p}/>)}
        </datalist>
        {errors.product && <p className="text-xs text-red-500">{errors.product}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Cantidad" type="number" min="1" value={form.qty} onChange={e => set('qty', e.target.value)}/>
        <Input label="Precio unitario ($)" type="number" min="0" step="0.01" value={form.price}
          onChange={e => set('price', e.target.value)} error={errors.price}/>
      </div>

      {form.total > 0 && (
        <div className="flex items-center justify-between bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-primary-700">Total del pedido</span>
          <span className="text-xl font-bold text-primary-700">{formatCurrency(form.total)}</span>
        </div>
      )}

      <Select label="Estado" value={form.status} onChange={e => set('status', e.target.value)}>
        <option value="pending">Pendiente</option>
        <option value="sent">Enviado</option>
        <option value="delivered">Entregado</option>
      </Select>

      <Textarea label="Notas" value={form.notes} onChange={e => set('notes', e.target.value)}
        placeholder="Instrucciones especiales, forma de pago..." rows={2}/>

      <div className="flex gap-2 pt-1">
        <Btn variant="secondary" onClick={onClose} className="flex-1">Cancelar</Btn>
        <Btn onClick={handleSave} className="flex-1">
          <IconCheck size={15}/>{order ? 'Guardar cambios' : 'Crear pedido'}
        </Btn>
      </div>
    </div>
  );
}

function OrderCard({ order, onEdit, onDelete, onStatusChange, onMessage }) {
  const [showMenu, setShowMenu] = useOrdersState(false);
  const s = getStatusColor(order.status);
  const statusOptions = [
    { value: 'pending', label: 'Pendiente', icon: <IconClock size={13}/> },
    { value: 'sent', label: 'Enviado', icon: <IconSend size={13}/> },
    { value: 'delivered', label: 'Entregado', icon: <IconCheck size={13}/> },
  ];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <Avatar initials={order.clientName.split(' ').map(n=>n[0]).join('').slice(0,2)} size={36}/>
          <div>
            <p className="text-sm font-semibold text-gray-900">{order.clientName}</p>
            <p className="text-xs text-gray-400">{order.date}</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors ${s.bg} ${s.text} ${s.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>
            {s.label}
            <IconChevronDown size={11}/>
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}/>
              <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[140px] scale-in">
                {statusOptions.map(opt => (
                  <button key={opt.value} onClick={() => { onStatusChange(order.id, opt.value); setShowMenu(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${order.status === opt.value ? 'text-primary-600 font-semibold' : 'text-gray-600'}`}>
                    {opt.icon}{opt.label}
                    {order.status === opt.value && <IconCheck size={11} className="ml-auto"/>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3">
        <p className="text-xs text-gray-500 mb-0.5">Producto</p>
        <p className="text-sm font-medium text-gray-800">{order.product}</p>
        <p className="text-xs text-gray-400">Qty: {order.qty} × {formatCurrency(order.price)}</p>
      </div>

      {order.notes && (
        <p className="text-xs text-gray-500 italic mb-3 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
          📝 {order.notes}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <span className="text-lg font-bold text-gray-900">{formatCurrency(order.total)}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => onMessage(order)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#25D366] hover:bg-emerald-50 transition-colors" title="WhatsApp">
            <IconWhatsapp size={15}/>
          </button>
          <button onClick={() => onEdit(order)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><IconEdit size={15}/></button>
          <button onClick={() => onDelete(order)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><IconTrash size={15}/></button>
        </div>
      </div>
    </div>
  );
}

function OrdersView() {
  const { state, dispatch, notify } = useCRM();
  const [tab, setTab] = useOrdersState('all');
  const [search, setSearch] = useOrdersState('');
  const [showAdd, setShowAdd] = useOrdersState(false);
  const [editOrder, setEditOrder] = useOrdersState(null);
  const [deleteOrder, setDeleteOrder] = useOrdersState(null);

  const tabs = [
    { id: 'all', label: 'Todos', count: state.orders.length },
    { id: 'pending', label: 'Pendientes', count: state.orders.filter(o=>o.status==='pending').length },
    { id: 'sent', label: 'Enviados', count: state.orders.filter(o=>o.status==='sent').length },
    { id: 'delivered', label: 'Entregados', count: state.orders.filter(o=>o.status==='delivered').length },
  ];

  const filtered = useOrdersMemo(() => {
    let list = state.orders;
    if (tab !== 'all') list = list.filter(o => o.status === tab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.clientName || '').toLowerCase().includes(q) ||
        (o.product || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [state.orders, tab, search]);

  const totalFiltered = useOrdersMemo(() => filtered.reduce((s, o) => s + (o.total || 0), 0), [filtered]);

  const handleAdd = (order) => { dispatch({ type: 'ADD_ORDER', order }); notify('Pedido creado ✅'); };
  const handleEdit = (order) => { dispatch({ type: 'UPDATE_ORDER', order }); notify('Pedido actualizado ✅'); };
  const handleDelete = (id) => { dispatch({ type: 'DELETE_ORDER', id }); notify('Pedido eliminado', 'warn'); };
  const handleStatusChange = (id, status) => {
    const order = state.orders.find(o => o.id === id);
    if (order) {
      dispatch({ type: 'UPDATE_ORDER', order: { ...order, status } });
      notify(`Estado: "${getStatusColor(status).label}" ✅`);
    }
  };
  const handleMessage = (order) => dispatch({ type: 'NAVIGATE', view: 'messages', clientId: order.clientId });

  const handleExport = () => {
    const data = filtered.map(o => ({
      Cliente: o.clientName, Producto: o.product, Cantidad: o.qty,
      Precio: o.price, Total: o.total, Estado: getStatusColor(o.status).label,
      Fecha: o.date, Notas: o.notes
    }));
    exportCSV(data, 'pedidos_crm.csv');
    notify('📁 Exportando pedidos...');
  };

  return (
    <div className="fade-in">
      <TopBar title="Pedidos" actions={
        <div className="flex items-center gap-2">
          <Btn variant="secondary" size="sm" onClick={handleExport} title="Exportar"><IconDownload size={14}/></Btn>
          <Btn size="sm" onClick={() => setShowAdd(true)}><IconPlus size={14}/>Nuevo</Btn>
        </div>
      }/>

      <div className="px-4 md:px-6 py-3 bg-white border-b border-gray-100">
        <div className="relative mb-3">
          <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pedidos por cliente o producto..."
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"/>
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><IconX size={15}/></button>}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors
                ${tab === t.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === t.id ? 'bg-white/20 text-white' : 'bg-white text-gray-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="px-4 md:px-6 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">{filtered.length} pedido{filtered.length !== 1 ? 's' : ''}</p>
          <p className="text-xs font-semibold text-gray-900">Total: {formatCurrency(totalFiltered)}</p>
        </div>
      )}

      <div className="p-4 md:p-6 pb-24 md:pb-6">
        {filtered.length === 0 ? (
          <EmptyState icon={<IconShoppingBag size={24}/>} title="Sin pedidos"
            desc={search ? 'Intenta con otro término' : 'Crea tu primer pedido'}
            action={<Btn onClick={() => setShowAdd(true)}><IconPlus size={15}/>Crear pedido</Btn>}/>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(o => (
              <OrderCard key={o.id} order={o}
                onEdit={setEditOrder} onDelete={setDeleteOrder}
                onStatusChange={handleStatusChange} onMessage={handleMessage}/>
            ))}
          </div>
        )}
      </div>

      <FAB onClick={() => setShowAdd(true)} icon={<IconPlus size={18}/>} label="Pedido"/>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo pedido" size="lg">
        <OrderForm clients={state.clients} catalog={state.catalog || []} onSave={handleAdd} onClose={() => setShowAdd(false)}/>
      </Modal>
      <Modal open={!!editOrder} onClose={() => setEditOrder(null)} title="Editar pedido" size="lg">
        {editOrder && <OrderForm order={editOrder} clients={state.clients} catalog={state.catalog || []} onSave={handleEdit} onClose={() => setEditOrder(null)}/>}
      </Modal>
      <ConfirmDialog open={!!deleteOrder} title="¿Eliminar pedido?"
        desc="Se eliminará el pedido permanentemente. Esta acción no se puede deshacer."
        onConfirm={() => handleDelete(deleteOrder.id)} onClose={() => setDeleteOrder(null)}/>
    </div>
  );
}

window.OrdersView = OrdersView;
