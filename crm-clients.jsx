// crm-clients.jsx — Clients management with real Excel/CSV import
const { useState: useClientsState, useMemo: useClientsMemo, useRef: useClientsRef, useCallback: useClientsCallback } = React;

function ClientForm({ client, onSave, onClose }) {
  const [form, setForm] = useClientsState(client || { name: '', phone: '', city: '', address: '', notes: '', status: 'active' });
  const [errors, setErrors] = useClientsState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (!form.phone.trim()) e.phone = 'El teléfono es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const avatar = form.name.trim().split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
    onSave({ ...form, avatar });
    onClose();
  };

  return (
    <div className="p-5 space-y-3.5">
      <Input label="Nombre completo *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: María García" error={errors.name}/>
      <Input label="Teléfono / WhatsApp *" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="3233234455" type="tel" error={errors.phone}/>
      <Input label="Ciudad" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Popayan"/>
      <Input label="Dirección" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Calle y número"/>
      <Select label="Estado del cliente" value={form.status} onChange={e => set('status', e.target.value)}>
        <option value="active">Activo</option>
        <option value="inactive">Inactivo</option>
      </Select>
      <Textarea label="Notas" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Preferencias, forma de pago..." rows={3}/>
      <div className="flex gap-2 pt-1">
        <Btn variant="secondary" onClick={onClose} className="flex-1">Cancelar</Btn>
        <Btn onClick={handleSave} className="flex-1"><IconCheck size={15}/>{client ? 'Guardar cambios' : 'Agregar cliente'}</Btn>
      </div>
    </div>
  );
}

function ImportModal({ open, onClose }) {
  const { state, dispatch, notify, forceSave } = useCRM();
  const [step, setStep] = useClientsState(0); // 0=upload, 1=preview+mapping, 2=done
  const [fileName, setFileName] = useClientsState('');
  const [preview, setPreview] = useClientsState([]);
  const [columns, setColumns] = useClientsState([]);
  const [mapping, setMapping] = useClientsState({ name: '', phone: '', city: '', address: '', notes: '' });
  const [loading, setLoading] = useClientsState(false);
  const [parseError, setParseError] = useClientsState('');
  const fileRef = useClientsRef(null);

  const resetState = () => {
    setStep(0); setFileName(''); setPreview([]); setColumns([]);
    setMapping({ name: '', phone: '', city: '', address: '', notes: '' });
    setLoading(false); setParseError('');
  };

  const autoDetectMapping = (cols) => {
    const detect = (keywords) => cols.find(c => keywords.some(k => c.toLowerCase().includes(k.toLowerCase()))) || '';
    return {
      name: detect(['nombre', 'name', 'cliente', 'client', 'contacto']),
      phone: detect(['teléfono', 'telefono', 'tel', 'phone', 'celular', 'móvil', 'movil', 'whatsapp', 'cel', 'número', 'numero']),
      city: detect(['ciudad', 'city', 'municipio', 'localidad', 'pueblo']),
      address: detect(['dirección', 'direccion', 'address', 'calle', 'domicilio']),
      notes: detect(['nota', 'notes', 'comentario', 'observación', 'obs']),
    };
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setParseError('');
    setLoading(true);

    const onData = (data) => {
      if (!data || data.length === 0) {
        setParseError('El archivo está vacío o no tiene datos válidos.');
        setLoading(false);
        return;
      }
      const validRows = data.filter(row => Object.values(row).some(v => v !== null && v !== undefined && String(v).trim()));
      const cols = Object.keys(validRows[0] || {});
      if (cols.length === 0) {
        setParseError('No se encontraron columnas válidas en el archivo.');
        setLoading(false);
        return;
      }
      setColumns(cols);
      setMapping(autoDetectMapping(cols));
      setPreview(validRows.slice(0, 100));
      setStep(1);
      setLoading(false);
    };

    const ext = f.name.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      if (window.Papa) {
        Papa.parse(f, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => onData(results.data),
          error: (err) => { setParseError('Error leyendo CSV: ' + err.message); setLoading(false); }
        });
      } else {
        // Manual CSV fallback
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const text = ev.target.result;
            const lines = text.split(/\r?\n/).filter(l => l.trim());
            if (lines.length < 2) { setParseError('CSV sin filas de datos.'); setLoading(false); return; }
            const parseLine = (line) => {
              const result = []; let cur = ''; let inQ = false;
              for (let i = 0; i < line.length; i++) {
                if (line[i] === '"') { inQ = !inQ; }
                else if (line[i] === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
                else { cur += line[i]; }
              }
              result.push(cur.trim());
              return result;
            };
            const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
            const data = lines.slice(1).map(line => {
              const vals = parseLine(line).map(v => v.replace(/^"|"$/g, ''));
              return headers.reduce((obj, h, i) => ({ ...obj, [h]: vals[i] || '' }), {});
            });
            onData(data);
          } catch (err) { setParseError('Error leyendo CSV: ' + err.message); setLoading(false); }
        };
        reader.readAsText(f, 'utf-8');
      }
    } else if (['xlsx','xls'].includes(ext)) {
      if (window.XLSX) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const wb = XLSX.read(ev.target.result, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
            onData(data);
          } catch (err) { setParseError('Error leyendo Excel: ' + err.message); setLoading(false); }
        };
        reader.readAsArrayBuffer(f);
      } else {
        setParseError('Librería Excel no disponible. Usa un archivo CSV.');
        setLoading(false);
      }
    } else {
      setParseError('Formato no soportado. Usa .xlsx, .xls o .csv');
      setLoading(false);
    }
    // Reset file input for re-selection
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) { handleFile({ target: { files: [f] } }); }
  };

  const handleImport = () => {
    if (!mapping.name) { notify('Debes mapear al menos la columna Nombre', 'error'); return; }
    const existingPhones = new Set(state.clients.map(c => (c.phone || '').replace(/\D/g, '')).filter(Boolean));
    const toImport = [];
    let skipped = 0;
    preview.forEach(row => {
      const name = String(mapping.name ? (row[mapping.name] || '') : '').trim();
      const phone = String(mapping.phone ? (row[mapping.phone] || '') : '').trim();
      if (!name) return;
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone && existingPhones.has(cleanPhone)) { skipped++; return; }
      if (cleanPhone) existingPhones.add(cleanPhone);
      toImport.push({
        name,
        phone,
        city: String(mapping.city ? (row[mapping.city] || '') : '').trim(),
        address: String(mapping.address ? (row[mapping.address] || '') : '').trim(),
        notes: String(mapping.notes ? (row[mapping.notes] || '') : '').trim(),
      });
    });
    dispatch({ type: 'IMPORT_CLIENTS', clients: toImport });
    forceSave(); // Immediate save after import
    notify(`✅ ${toImport.length} clientes importados${skipped > 0 ? ` · ${skipped} duplicados omitidos` : ''}`);
    onClose();
    resetState();
  };

  const FIELD_LABELS = { name: 'Nombre', phone: 'Teléfono', city: 'Ciudad', address: 'Dirección', notes: 'Notas' };

  return (
    <Modal open={open} onClose={() => { onClose(); resetState(); }} title="Importar desde Excel / CSV" size="xl">
      <div className="p-5">
        {step === 0 && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer group">
              <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" onChange={handleFile} className="hidden"/>
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"/>
                  <p className="text-sm text-gray-500">Leyendo archivo...</p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-200 transition-colors">
                    <IconUpload size={24} className="text-primary-600"/>
                  </div>
                  <p className="font-semibold text-gray-700 mb-1">Arrastra tu archivo aquí</p>
                  <p className="text-sm text-gray-400 mb-3">o haz clic para seleccionar</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">.xlsx · .xls · .csv</span>
                </>
              )}
            </div>
            {parseError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
                <IconX size={15} className="flex-shrink-0 mt-0.5 text-red-500"/>{parseError}
              </div>
            )}
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 flex gap-2">
              <IconInfo size={15} className="flex-shrink-0 mt-0.5"/>
              <div>
                <p>Tu archivo puede tener cualquier columna. En el siguiente paso podrás mapearlas.</p>
                <p className="mt-1 text-blue-600 font-medium">Se detectan automáticamente: Nombre, Teléfono, Ciudad, Dirección, Notas</p>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
              <IconCheck size={16} className="flex-shrink-0"/>
              <span><strong>{fileName}</strong> — <strong>{preview.length}</strong> filas detectadas</span>
            </div>

            {/* Column mapping */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Mapeo de columnas</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(FIELD_LABELS).map(([field, label]) => (
                  <div key={field} className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                      {label}{field === 'name' ? ' *' : ''}
                    </label>
                    <select value={mapping[field]} onChange={e => setMapping(m => ({ ...m, [field]: e.target.value }))}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white outline-none focus:border-primary-400 transition-colors">
                      <option value="">— No usar —</option>
                      {columns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Vista previa ({Math.min(preview.length, 10)} de {preview.length} filas)</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-52">
                  <table className="w-full text-xs min-w-max">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {columns.map(k => (
                          <th key={k} className={`px-3 py-2 text-left font-semibold whitespace-nowrap ${Object.values(mapping).includes(k) ? 'text-primary-600 bg-primary-50' : 'text-gray-400'}`}>
                            {k}{Object.entries(mapping).find(([,v]) => v === k) ? ` (${FIELD_LABELS[Object.entries(mapping).find(([,v]) => v === k)[0]]})` : ''}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {preview.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {columns.map(k => <td key={k} className="px-3 py-2 text-gray-700 max-w-[160px] truncate">{String(row[k] ?? '')}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Btn variant="secondary" onClick={() => setStep(0)} className="flex-1">
                <IconChevronLeft size={15}/>Atrás
              </Btn>
              <Btn onClick={handleImport} className="flex-1" disabled={!mapping.name}>
                <IconDownload size={15}/>Importar {preview.length} clientes
              </Btn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ClientCard({ client, onEdit, onDelete, onMessage }) {
  const s = getStatusColor(client.status);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all hover:-translate-y-0.5 slide-up">
      <div className="flex items-start gap-3">
        <Avatar initials={client.avatar} size={42}/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-gray-900 text-sm truncate">{client.name}</p>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${s.bg} ${s.text}`}>
              <span className={`w-1 h-1 rounded-full ${s.dot}`}/>{s.label}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5"><IconPhone size={11}/>{client.phone || 'Sin teléfono'}</div>
          {client.city && <div className="flex items-center gap-1 text-xs text-gray-400"><IconMapPin size={11}/>{client.city}</div>}
          {client.notes && <p className="text-xs text-gray-400 mt-1 italic truncate">"{client.notes}"</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
        <div className="flex-1 text-center">
          <p className="text-sm font-bold text-gray-900">{client.orders || 0}</p>
          <p className="text-[10px] text-gray-400">pedidos</p>
        </div>
        <div className="w-px h-6 bg-gray-100"/>
        <div className="flex-1 text-center">
          <p className="text-sm font-bold text-gray-900">{formatCurrency(client.totalSpent)}</p>
          <p className="text-[10px] text-gray-400">total</p>
        </div>
        <div className="w-px h-6 bg-gray-100"/>
        <div className="flex items-center gap-1">
          <button onClick={() => onMessage(client)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#25D366] hover:bg-emerald-50 transition-colors" title="WhatsApp">
            <IconWhatsapp size={16}/>
          </button>
          <button onClick={() => onEdit(client)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors" title="Editar">
            <IconEdit size={15}/>
          </button>
          <button onClick={() => onDelete(client)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Eliminar">
            <IconTrash size={15}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientRow({ client, onEdit, onDelete, onMessage }) {
  const s = getStatusColor(client.status);
  return (
    <tr className="hover:bg-gray-50 transition-colors border-b border-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar initials={client.avatar} size={32}/>
          <div>
            <p className="text-sm font-medium text-gray-900">{client.name}</p>
            <p className="text-xs text-gray-400">{client.city || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{client.phone || '—'}</td>
      <td className="px-4 py-3"><StatusBadge status={client.status}/></td>
      <td className="px-4 py-3 text-sm text-gray-700 font-medium">{client.orders || 0}</td>
      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(client.totalSpent)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={() => onMessage(client)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#25D366] hover:bg-emerald-50 transition-colors"><IconWhatsapp size={15}/></button>
          <button onClick={() => onEdit(client)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><IconEdit size={15}/></button>
          <button onClick={() => onDelete(client)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><IconTrash size={15}/></button>
        </div>
      </td>
    </tr>
  );
}

function ClientsView() {
  const { state, dispatch, notify } = useCRM();
  const [search, setSearch] = useClientsState('');
  const [filter, setFilter] = useClientsState('all');
  const [viewMode, setViewMode] = useClientsState('cards');
  const [showAdd, setShowAdd] = useClientsState(false);
  const [editClient, setEditClient] = useClientsState(null);
  const [deleteClient, setDeleteClient] = useClientsState(null);
  const [showImport, setShowImport] = useClientsState(false);

  const filtered = useClientsMemo(() => {
    let list = state.clients;
    if (filter !== 'all') list = list.filter(c => c.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(search) ||
        (c.city || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [state.clients, search, filter]);

  const handleAdd = (client) => { dispatch({ type: 'ADD_CLIENT', client }); notify('Cliente agregado ✅'); };
  const handleEdit = (client) => { dispatch({ type: 'UPDATE_CLIENT', client }); notify('Cliente actualizado ✅'); };
  const handleDelete = (id) => { dispatch({ type: 'DELETE_CLIENT', id }); notify('Cliente eliminado', 'warn'); };
  const handleMessage = (client) => dispatch({ type: 'NAVIGATE', view: 'messages', clientId: client.id });

  const handleExport = () => {
    const data = state.clients.map(c => ({
      Nombre: c.name, Teléfono: c.phone, Ciudad: c.city, Dirección: c.address,
      Estado: c.status === 'active' ? 'Activo' : 'Inactivo', Pedidos: c.orders, Total: c.totalSpent, Notas: c.notes, Registro: c.createdAt
    }));
    exportCSV(data, 'clientes_crm.csv');
    notify('📁 Exportando clientes...');
  };

  return (
    <div className="fade-in">
      <TopBar title={`Clientes (${state.clients.length})`} actions={
        <div className="flex items-center gap-2">
          <Btn variant="secondary" size="sm" onClick={handleExport} title="Exportar CSV"><IconDownload size={14}/><span className="hidden sm:inline">CSV</span></Btn>
          <Btn variant="secondary" size="sm" onClick={() => setShowImport(true)}><IconUpload size={14}/><span className="hidden sm:inline">Excel</span></Btn>
          <Btn size="sm" onClick={() => setShowAdd(true)}><IconPlus size={14}/>Agregar</Btn>
        </div>
      }/>

      {/* Search + filters */}
      <div className="px-4 md:px-6 py-3 space-y-3 border-b border-gray-100 bg-white">
        <div className="relative">
          <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, teléfono o ciudad..."
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 outline-none focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"/>
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><IconX size={15}/></button>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {[['all','Todos'],['active','Activos'],['inactive','Inactivos']].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === v ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{l}</button>
            ))}
          </div>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('cards')} className={`px-2 py-1.5 ${viewMode === 'cards' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}><IconGrid size={15}/></button>
            <button onClick={() => setViewMode('list')} className={`px-2 py-1.5 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}><IconList size={15}/></button>
          </div>
        </div>
      </div>

      {search && (
        <div className="px-4 md:px-6 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "<strong>{search}</strong>"
        </div>
      )}

      <div className="p-4 md:p-6 pb-24 md:pb-6">
        {filtered.length === 0 ? (
          <EmptyState icon={<IconUsers size={24}/>} title="Sin clientes"
            desc={search ? 'Intenta con otro término de búsqueda' : 'Agrega tu primer cliente o importa desde Excel'}
            action={<Btn onClick={() => setShowAdd(true)}><IconPlus size={15}/>Agregar cliente</Btn>}/>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(c => <ClientCard key={c.id} client={c} onEdit={setEditClient} onDelete={setDeleteClient} onMessage={handleMessage}/>)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Cliente','Teléfono','Estado','Pedidos','Total','Acciones'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
                </thead>
                <tbody>{filtered.map(c => <ClientRow key={c.id} client={c} onEdit={setEditClient} onDelete={setDeleteClient} onMessage={handleMessage}/>)}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <FAB onClick={() => setShowAdd(true)} icon={<IconPlus size={18}/>} label="Agregar"/>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nuevo cliente">
        <ClientForm onSave={handleAdd} onClose={() => setShowAdd(false)}/>
      </Modal>
      <Modal open={!!editClient} onClose={() => setEditClient(null)} title="Editar cliente">
        {editClient && <ClientForm client={editClient} onSave={handleEdit} onClose={() => setEditClient(null)}/>}
      </Modal>
      <ConfirmDialog open={!!deleteClient} title="¿Eliminar cliente?"
        desc={`Se eliminará a ${deleteClient?.name} y todos sus datos. Esta acción no se puede deshacer.`}
        onConfirm={() => handleDelete(deleteClient.id)} onClose={() => setDeleteClient(null)}/>
      <ImportModal open={showImport} onClose={() => setShowImport(false)}/>
    </div>
  );
}

window.ClientsView = ClientsView;
