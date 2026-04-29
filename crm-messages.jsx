// crm-messages.jsx — Messages module with multi-recipient WhatsApp support
const { useState: useMsgState, useEffect: useMsgEffect, useRef: useMsgRef, useMemo: useMsgMemo, useCallback: useMsgCallback } = React;

// ── Template renderer — limpia variables vacías para no mandar {simbolos} ──
function renderTemplate(body, vars) {
  let result = body.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key];
    return (val !== undefined && val !== null && val !== '') ? String(val) : '';
  });
  // limpiar marcadores de bold de WhatsApp que quedaron vacíos  (**)
  result = result.replace(/\*\s*\*/g, '').replace(/\*\*/g, '');
  // comprimir espacios múltiples que dejaron las variables vacías
  result = result.replace(/ {2,}/g, ' ').trim();
  return result;
}

// ── Template Editor ────────────────────────────────────────────────────────
function TemplateEditor({ template, onSave, onClose, isNew }) {
  const [form, setForm] = useMsgState(template || { name: '', body: '', image: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const textareaRef = useMsgRef(null);
  const variables = ['{nombre}', '{producto}', '{monto}', '{pedido}', '{ciudad}', '{fecha}'];

  const insertVar = (v) => {
    const el = textareaRef.current;
    if (!el) { setForm(f => ({ ...f, body: f.body + v })); return; }
    const start = el.selectionStart; const end = el.selectionEnd;
    const newBody = form.body.slice(0, start) + v + form.body.slice(end);
    setForm(f => ({ ...f, body: newBody }));
    setTimeout(() => { el.focus(); el.setSelectionRange(start + v.length, start + v.length); }, 0);
  };

  const isValid = form.name.trim() && form.body.trim();

  return (
    <div className="p-5 space-y-3.5">
      <Input label="Nombre de la plantilla *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Bienvenida cliente nuevo"/>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Mensaje *</label>
        <textarea ref={textareaRef} value={form.body} onChange={e => set('body', e.target.value)} rows={5}
          placeholder="Hola {nombre}, tu pedido de {producto}..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"/>
        <p className="text-[10px] text-gray-400">Haz clic en una variable para insertarla en el cursor</p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {variables.map(v => (
            <button key={v} onClick={() => insertVar(v)} type="button"
              className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium hover:bg-primary-100 transition-colors border border-primary-100">
              {v}
            </button>
          ))}
        </div>
      </div>
      <Input label="URL de Imagen (Opcional)" value={form.image || ''} onChange={e => set('image', e.target.value)} placeholder="https://ejemplo.com/imagen.jpg"/>
      {form.image && (
        <div className="mt-2 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center p-2">
          <img src={form.image} alt="Vista previa" className="max-h-32 rounded-lg object-contain shadow-sm" onError={e => e.target.src='https://placehold.co/400x200?text=Error+al+cargar+imagen'}/>
        </div>
      )}
      <div className="flex gap-2">
        <Btn variant="secondary" onClick={onClose} className="flex-1">Cancelar</Btn>
        <Btn onClick={() => { if (isValid) { onSave(form); onClose(); } }} className="flex-1" disabled={!isValid}>
          <IconCheck size={15}/>{isNew ? 'Crear plantilla' : 'Guardar cambios'}
        </Btn>
      </div>
    </div>
  );
}

// ── Queue Item ─────────────────────────────────────────────────────────────
function QueueItem({ draft, index, isCurrent, countdown, onRemove, countryCode }) {
  const waPhone = (draft.phone || '').replace(/\D/g, '');
  const waUrl = waPhone ? buildWALink(draft.phone, draft.message, countryCode) : null;
  const s = getStatusColor(draft.status);
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isCurrent ? 'border-purple-300 bg-purple-50 shadow-sm' : 'border-gray-100 bg-white'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCurrent ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
        {isCurrent ? <div className="w-2.5 h-2.5 rounded-full bg-white pulse-dot"/> : index + 1}
      </div>
      <Avatar initials={(draft.clientName || 'CL').split(' ').map(n=>n[0]).join('').slice(0,2)} size={28}/>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{draft.clientName}</p>
        <p className="text-xs text-gray-400 truncate">{draft.phone || 'Sin teléfono'} · {draft.message.slice(0, 40)}...</p>
      </div>
      {isCurrent && countdown !== undefined && (
        <div className="flex-shrink-0 text-center">
          <p className="text-xs font-bold text-purple-700">{countdown}s</p>
          <p className="text-[9px] text-purple-500">próximo</p>
        </div>
      )}
      <div className="flex items-center gap-1 flex-shrink-0">
        {waUrl ? (
          <a href={waUrl} target="_blank" rel="noreferrer"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#25D366] hover:bg-emerald-50 transition-colors" title="Abrir en WhatsApp">
            <IconWhatsapp size={16}/>
          </a>
        ) : (
          <span className="w-7 h-7 flex items-center justify-center text-gray-300" title="Sin teléfono">
            <IconWhatsapp size={16}/>
          </span>
        )}
        <button onClick={() => onRemove(draft.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
          <IconTrash size={14}/>
        </button>
      </div>
    </div>
  );
}

// ── Recipient Selector ─────────────────────────────────────────────────────
function RecipientSelector({ mode, setMode, selectedClients, setSelectedClients, singleClient, setSingleClient, clients, importedClients }) {
  const [search, setSearch] = useMsgState('');
  const filtered = useMsgMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(c => (c.name||'').toLowerCase().includes(q) || (c.phone||'').includes(search));
  }, [clients, search]);

  const modes = [
    { id: 'single', label: 'Un cliente', icon: <IconUser size={14}/> },
    { id: 'multiple', label: 'Varios', icon: <IconUsers size={14}/> },
    { id: 'all', label: 'Todos activos', icon: <IconZap size={14}/> },
    { id: 'imported', label: 'Importados', icon: <IconUpload size={14}/> },
  ];

  const toggleClient = (id) => {
    setSelectedClients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    if (selectedClients.length === filtered.length) setSelectedClients([]);
    else setSelectedClients(filtered.map(c => c.id));
  };

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-xl">
        {modes.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] font-semibold transition-all ${mode === m.id ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {m.icon}
            <span className="leading-tight text-center">{m.label}</span>
          </button>
        ))}
      </div>

      {mode === 'single' && (
        <Select label="Cliente destinatario" value={singleClient} onChange={e => setSingleClient(e.target.value)}>
          <option value="">— Selecciona un cliente —</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
        </Select>
      )}

      {mode === 'multiple' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">Selecciona clientes ({selectedClients.length} seleccionados)</label>
            <button onClick={toggleAll} className="text-xs text-primary-600 font-medium hover:text-primary-700">
              {selectedClients.length === filtered.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          </div>
          <div className="relative">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50 outline-none focus:border-primary-400 transition-colors"/>
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Sin clientes</p>
            ) : filtered.map(c => (
              <label key={c.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                <input type="checkbox" checked={selectedClients.includes(c.id)} onChange={() => toggleClient(c.id)}
                  className="w-3.5 h-3.5 accent-primary-600"/>
                <Avatar initials={c.avatar} size={24}/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-400">{c.phone}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {mode === 'all' && (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconUsers size={18} className="text-primary-600"/>
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-800">{clients.filter(c => c.status === 'active').length} clientes activos</p>
            <p className="text-xs text-primary-600">Se generará un mensaje personalizado para cada uno</p>
          </div>
        </div>
      )}

      {mode === 'imported' && (
        <div className={`border rounded-xl p-3 flex items-center gap-3 ${importedClients.length > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${importedClients.length > 0 ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            <IconUpload size={18} className={importedClients.length > 0 ? 'text-emerald-600' : 'text-gray-400'}/>
          </div>
          <div>
            {importedClients.length > 0 ? (
              <>
                <p className="text-sm font-semibold text-emerald-800">{importedClients.length} clientes del último Excel</p>
                <p className="text-xs text-emerald-600">Importados recientemente</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-600">Sin importación reciente</p>
                <p className="text-xs text-gray-400">Importa un Excel primero en la sección Clientes</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Smart Variable Input ─────────────────────────────────────────────────
// Solo {producto} tiene selector del catálogo (solo nombre).
// {monto} y {pedido} son texto libre por defecto vacíos.
function SmartVarInput({ varKey, value, onChange, previewClient, catalog }) {
  const [mode, setMode] = useMsgState('manual'); // 'manual' | 'catalog'
  const isProducto = varKey === 'producto';

  // Opciones de catálogo: solo el nombre del producto
  const catalogOptions = useMsgMemo(() =>
    (catalog || []).map(p => p.name),
    [catalog]
  );

  // Auto-fill nombre/ciudad desde el cliente seleccionado
  if (!isProducto) {
    return (
      <input value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={varKey === 'nombre' ? (previewClient?.name || 'Auto') : varKey === 'ciudad' ? (previewClient?.city || '') : ''}
        className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white outline-none focus:border-primary-400 transition-colors w-full"/>
    );
  }

  // Solo para {producto} mostramos toggle texto / catálogo
  return (
    <div className="space-y-1">
      <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #bfdbfe', height: 26 }}>
        <button type="button"
          onClick={() => { setMode('manual'); onChange(''); }}
          className="flex-1 text-[10px] font-semibold transition-colors"
          style={{ background: mode === 'manual' ? '#2563eb' : 'transparent', color: mode === 'manual' ? '#fff' : '#3b82f6' }}>
          Libre
        </button>
        <button type="button"
          onClick={() => { setMode('catalog'); onChange(''); }}
          className="flex-1 text-[10px] font-semibold transition-colors"
          style={{ background: mode === 'catalog' ? '#2563eb' : 'transparent', color: mode === 'catalog' ? '#fff' : '#3b82f6' }}>
          Catálogo
        </button>
      </div>

      {mode === 'manual' ? (
        <input value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Ej: Perfume Chanel"
          className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white outline-none focus:border-primary-400 transition-colors w-full"/>
      ) : (
        <select value={value} onChange={e => onChange(e.target.value)}
          className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 bg-white outline-none focus:border-primary-400 transition-colors w-full">
          <option value="">-- Producto --</option>
          {catalogOptions.map((name, i) => (
            <option key={i} value={name}>{name}</option>
          ))}
          {catalogOptions.length === 0 && (
            <option disabled value="">Sin productos en catálogo</option>
          )}
        </select>
      )}
    </div>
  );
}

// ── Messages View ──────────────────────────────────────────────────────────
function MessagesView() {
  const { state, dispatch, notify } = useCRM();
  const [tab, setTab] = useMsgState('compose');

  // Compose state
  const [selectedTemplate, setSelectedTemplate] = useMsgState(state.templates[0]?.id || '');
  const [recipientMode, setRecipientMode] = useMsgState('single');
  const [singleClient, setSingleClient] = useMsgState(state.selectedClientId || '');
  const [selectedClients, setSelectedClients] = useMsgState([]);
  const [vars, setVars] = useMsgState({ nombre: '', producto: '', monto: '', pedido: '', ciudad: '', fecha: '' });
  const [image, setImage] = useMsgState('');
  const [copied, setCopied] = useMsgState(false);
  const [imgCopied, setImgCopied] = useMsgState(false);

  // Templates state
  const [showTemplateForm, setShowTemplateForm] = useMsgState(false);
  const [editTemplate, setEditTemplate] = useMsgState(null);

  // Queue state
  const [queueRunning, setQueueRunning] = useMsgState(false);
  const [queueIndex, setQueueIndex] = useMsgState(-1);
  const [countdown, setCountdown] = useMsgState(30);
  const intervalRef = useMsgRef(null);

  const settings = state.settings || {};
  const msgInterval = settings.msgInterval || 30;
  const countryCode = settings.countryCode || '';

  const template = useMsgMemo(() => state.templates.find(t => t.id === selectedTemplate), [state.templates, selectedTemplate]);

  // Sync image when template changes
  useMsgEffect(() => {
    if (template) setImage(template.image || '');
  }, [template?.id]);

  // Get recipients based on mode
  const recipients = useMsgMemo(() => {
    const allActive = state.clients.filter(c => c.status === 'active');
    switch (recipientMode) {
      case 'single': {
        const c = state.clients.find(c => c.id === singleClient);
        return c ? [c] : [];
      }
      case 'multiple': return state.clients.filter(c => selectedClients.includes(c.id));
      case 'all': return allActive;
      case 'imported': return state.importedClients || [];
      default: return [];
    }
  }, [recipientMode, singleClient, selectedClients, state.clients, state.importedClients]);

  const previewClient = recipients[0];

  // Auto-fill vars from preview client
  useMsgEffect(() => {
    if (previewClient) {
      setVars(v => ({ ...v, nombre: previewClient.name, ciudad: previewClient.city || '' }));
    }
  }, [previewClient?.id]);

  // Preview message
  const preview = useMsgMemo(() => {
    if (!template) return '';
    return renderTemplate(template.body, vars);
  }, [template, vars]);

  const queuedDrafts = useMsgMemo(() => state.drafts.filter(d => d.status === 'queued'), [state.drafts]);

  const handleCopy = () => {
    if (!preview) return;
    navigator.clipboard.writeText(preview).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyImg = () => {
    if (!image) return;
    navigator.clipboard.writeText(image).catch(() => {});
    setImgCopied(true);
    setTimeout(() => setImgCopied(false), 2000);
  };

  const getWALink = () => {
    if (!previewClient?.phone || !preview) return null;
    return buildWALink(previewClient.phone, preview, countryCode);
  };

  const handleSaveDraft = () => {
    if (!template || !previewClient) { notify('Selecciona plantilla y destinatario', 'error'); return; }
    dispatch({ type: 'ADD_DRAFT', draft: {
      templateId: selectedTemplate, clientId: previewClient.id,
      clientName: previewClient.name, phone: previewClient.phone,
      message: preview, image: image, status: 'draft'
    }});
    notify('Borrador guardado ✅');
  };

  const handleAddToQueue = () => {
    if (!template || recipients.length === 0) { notify('Selecciona plantilla y destinatarios', 'error'); return; }
    const drafts = recipients.map(c => {
      const clientVars = { ...vars, nombre: c.name, ciudad: c.city || '' };
      const msg = renderTemplate(template.body, clientVars);
      return { templateId: selectedTemplate, clientId: c.id, clientName: c.name, phone: c.phone || '', message: msg, image: template.image || '', status: 'queued' };
    });
    dispatch({ type: 'ADD_DRAFTS', drafts });
    notify(`📋 ${drafts.length} mensaje${drafts.length !== 1 ? 's' : ''} añadido${drafts.length !== 1 ? 's' : ''} a la cola`);
    setTab('queue');
  };

  // Queue runner
  const startQueue = () => {
    if (queuedDrafts.length === 0) { notify('La cola está vacía', 'warn'); return; }
    setQueueRunning(true);
    setQueueIndex(0);
    setCountdown(msgInterval);
    notify('🚀 Cola iniciada — abre cada WhatsApp cuando aparezca');
  };

  const stopQueue = () => {
    setQueueRunning(false);
    setQueueIndex(-1);
    if (intervalRef.current) clearInterval(intervalRef.current);
    notify('Cola detenida', 'warn');
  };

  // Open current WA link and advance queue
  useMsgEffect(() => {
    if (!queueRunning || queueIndex < 0 || queueIndex >= queuedDrafts.length) return;
    const current = queuedDrafts[queueIndex];

    const waLink = buildWALink(current.phone, current.message, countryCode);
    if (waLink) {
      setTimeout(() => window.open(waLink, '_blank'), 300);
    }

    setCountdown(msgInterval);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          const next = queueIndex + 1;
          if (next >= queuedDrafts.length) {
            setQueueRunning(false);
            setQueueIndex(-1);
            notify('✅ Cola completada — todos los mensajes enviados');
          } else {
            setQueueIndex(next);
          }
          return msgInterval;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [queueRunning, queueIndex]);

  const VARIABLES = ['nombre', 'producto', 'monto', 'pedido', 'ciudad', 'fecha'];
  const waLink = getWALink();

  return (
    <div className="fade-in">
      <TopBar title="Mensajes"/>

      {/* Tabs */}
      <div className="px-4 md:px-6 border-b border-gray-100 bg-white flex gap-0">
        {[
          ['compose', '✏️ Redactar'],
          ['templates', '📋 Plantillas'],
          ['queue', '🕐 Cola' + (queuedDrafts.length > 0 ? ` (${queuedDrafts.length})` : '')]
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === id ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
            {id === 'queue' && queueRunning && <span className="ml-1.5 w-2 h-2 rounded-full bg-purple-500 inline-block pulse-dot"/>}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-6 pb-24 md:pb-6">

        {/* ── COMPOSE TAB ──────────────────────────────── */}
        {tab === 'compose' && (
          <div className="max-w-2xl mx-auto space-y-4 slide-up">

            {/* Template selector */}
            <Select label="Plantilla de mensaje" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
              <option value="">— Selecciona una plantilla —</option>
              {state.templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            {state.templates.length === 0 && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-center gap-2">
                <IconInfo size={14}/>Crea una plantilla primero en la pestaña "Plantillas"
              </div>
            )}

            {/* Recipient selector */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-700">Destinatarios</p>
              <RecipientSelector
                mode={recipientMode} setMode={setRecipientMode}
                selectedClients={selectedClients} setSelectedClients={setSelectedClients}
                singleClient={singleClient} setSingleClient={setSingleClient}
                clients={state.clients.filter(c => c.status === 'active')}
                importedClients={state.importedClients || []}/>
              {recipients.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                  <p className="text-xs text-emerald-700 font-medium">
                    {recipients.length === 1 ? recipients[0].name : `${recipients.length} destinatarios seleccionados`}
                  </p>
                </div>
              )}
            </div>

            {/* Variables — con selector para producto */}
            {template && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-600">Variables del mensaje</p>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {'{'}producto{'}'}: elige del catálogo o escribe
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {VARIABLES.map(k => (
                    <div key={k} className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-primary-600">{'{' + k + '}'}</label>
                      <SmartVarInput
                        varKey={k}
                        value={vars[k]}
                        onChange={val => setVars(v => ({ ...v, [k]: val }))}
                        previewClient={previewClient}
                        catalog={state.catalog || []}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp Preview */}
            {template && (
              <div className="rounded-2xl overflow-hidden border border-gray-200">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#075E54] text-white">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <IconWhatsapp size={13} className="text-white"/>
                  </div>
                  <p className="text-xs font-medium">{previewClient?.name || 'Vista previa'}</p>
                  {previewClient?.phone && <span className="text-[10px] text-white/60 ml-1">{previewClient.phone}</span>}
                  <span className="ml-auto text-[10px] text-white/60">WhatsApp</span>
                </div>
                <div className="p-4 min-h-[120px]" style={{ background: '#ECE5DD' }}>
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    {image && (
                      <div className="bg-white p-1 rounded-xl rounded-tl-sm shadow-sm overflow-hidden self-start">
                        <img src={image} alt="Imagen del mensaje" className="w-full h-auto rounded-lg max-h-48 object-cover" onError={e => e.target.src='https://placehold.co/400x200?text=Error+al+cargar+imagen'}/>
                      </div>
                    )}
                    {preview ? (
                      <div className="bg-white rounded-xl rounded-tl-sm px-3.5 py-2.5 shadow-sm self-start" style={{ border: 'none' }}>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{preview}</p>
                        <p className="text-[10px] text-gray-400 mt-1 text-right">ahora</p>
                      </div>
                    ) : !image && (
                      <div className="flex items-center justify-center h-20 text-gray-400 text-sm w-full">Selecciona plantilla y destinatario para previsualizar</div>
                    )}
                  </div>
                </div>
                {recipients.length > 1 && (
                  <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 text-xs text-blue-600 flex items-center gap-2">
                    <IconInfo size={12}/>Mostrando preview del 1er destinatario. Se personalizará para cada uno.
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            {template && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Btn variant="secondary" onClick={handleCopy} disabled={!preview}>
                  {copied ? <IconCheck size={14}/> : <IconCopy size={14}/>}
                  {copied ? '¡Copiado!' : 'Copiar'}
                </Btn>
                {image && (
                  <Btn variant="secondary" onClick={handleCopyImg} disabled={!image}>
                    {imgCopied ? <IconCheck size={14}/> : <IconLink size={14}/>}
                    {imgCopied ? '¡Copiado!' : 'Copiar Link'}
                  </Btn>
                )}
                <Btn variant="secondary" onClick={handleSaveDraft} disabled={!preview || recipients.length === 0}>
                  <IconDownload size={14}/>Borrador
                </Btn>
                <Btn variant="secondary" onClick={handleAddToQueue} disabled={!preview || recipients.length === 0}>
                  <IconClock size={14}/>
                  {recipients.length > 1 ? `Cola (${recipients.length})` : 'A la cola'}
                </Btn>
                {recipientMode === 'single' && waLink ? (
                  <a href={waLink} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#25D366] text-white hover:bg-[#1ebe5d] transition-all active:scale-95">
                    <IconWhatsapp size={15}/>WhatsApp
                  </a>
                ) : (
                  <Btn variant="whatsapp" onClick={handleAddToQueue} disabled={!preview || recipients.length === 0}>
                    <IconWhatsapp size={15}/>
                    {recipients.length > 1 ? 'Añadir todos' : 'A la cola'}
                  </Btn>
                )}
              </div>
            )}

            {recipientMode === 'single' && previewClient && waLink && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
                <IconInfo size={14} className="flex-shrink-0 mt-0.5"/>
                <span>Al hacer clic en <strong>WhatsApp</strong> se abrirá la app con el mensaje listo para <strong>{previewClient.name}</strong>. No se envía automáticamente.</span>
              </div>
            )}
            {recipients.length > 1 && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs text-purple-700 flex items-start gap-2">
                <IconInfo size={14} className="flex-shrink-0 mt-0.5"/>
                <span><strong>{recipients.length} mensajes</strong> se agregarán a la cola. Desde la pestaña "Cola" podrás enviarlos uno por uno con intervalo configurable.</span>
              </div>
            )}
          </div>
        )}

        {/* ── TEMPLATES TAB ────────────────────────────── */}
        {tab === 'templates' && (
          <div className="max-w-2xl mx-auto space-y-3 slide-up">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">{state.templates.length} plantilla{state.templates.length !== 1 ? 's' : ''}</p>
              <div className="flex gap-2">
                <Btn variant="secondary" size="sm" onClick={() => {
                  const example = {
                    name: 'Ejemplo: Confirmación de Pedido',
                    body: 'Hola {nombre} 👋 Tu pedido de {producto} por un valor de {monto} ha sido confirmado. Lo enviaremos a {ciudad} pronto. ¡Gracias por tu compra!',
                    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400&auto=format&fit=crop'
                  };
                  dispatch({ type: 'ADD_TEMPLATE', template: example });
                  notify('Plantilla de ejemplo creada ✅');
                }}>
                  <IconZap size={14}/>Ejemplo
                </Btn>
                <Btn size="sm" onClick={() => setShowTemplateForm(true)}><IconPlus size={14}/>Nueva plantilla</Btn>
              </div>
            </div>
            {state.templates.map(t => (
              <div key={t.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm mb-1.5">{t.name}</p>
                    <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">{t.body}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[...t.body.matchAll(/\{(\w+)\}/g)].map(m => (
                        <span key={m[1]} className="text-[10px] bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full border border-primary-100 font-medium">
                          {'{' + m[1] + '}'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => { setSelectedTemplate(t.id); setTab('compose'); }}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors" title="Usar">
                      <IconSend size={14}/>
                    </button>
                    <button onClick={() => setEditTemplate(t)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"><IconEdit size={14}/></button>
                    <button onClick={() => { dispatch({ type: 'DELETE_TEMPLATE', id: t.id }); notify('Plantilla eliminada', 'warn'); }}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><IconTrash size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
            {state.templates.length === 0 && (
              <EmptyState icon={<IconMessage size={24}/>} title="Sin plantillas" desc="Crea tu primera plantilla de mensaje reutilizable"
                action={
                  <div className="flex gap-2">
                    <Btn variant="secondary" onClick={() => {
                      const example = {
                        name: 'Ejemplo: Confirmación de Pedido',
                        body: 'Hola {nombre} 👋 Tu pedido de {producto} por un valor de {monto} ha sido confirmado. Lo enviaremos a {ciudad} pronto. ¡Gracias por tu compra!',
                        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400&auto=format&fit=crop'
                      };
                      dispatch({ type: 'ADD_TEMPLATE', template: example });
                      notify('Plantilla de ejemplo creada ✅');
                    }}><IconZap size={14}/>Generar ejemplo</Btn>
                    <Btn onClick={() => setShowTemplateForm(true)}><IconPlus size={15}/>Nueva plantilla</Btn>
                  </div>
                }/>
            )}
          </div>
        )}

        {/* ── QUEUE TAB ────────────────────────────────── */}
        {tab === 'queue' && (
          <div className="max-w-2xl mx-auto space-y-4 slide-up">

            {/* Queue status banner */}
            {queueRunning && (
              <div className="bg-purple-600 rounded-2xl p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-white pulse-dot"/>
                    <p className="font-semibold text-sm">Cola en ejecución</p>
                  </div>
                  <Btn variant="secondary" size="sm" onClick={stopQueue} className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    <IconX size={13}/>Detener
                  </Btn>
                </div>
                <div className="bg-white/20 rounded-xl px-3 py-2 flex items-center justify-between">
                  <p className="text-sm text-white/90">Mensaje <strong>{queueIndex + 1}</strong> de <strong>{queuedDrafts.length}</strong></p>
                  <p className="text-sm font-bold text-white">Siguiente en {countdown}s</p>
                </div>
                <div className="mt-2 bg-white/20 rounded-full h-1.5">
                  <div className="bg-white rounded-full h-1.5 transition-all duration-1000" style={{ width: `${((queueIndex) / queuedDrafts.length) * 100}%` }}/>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <IconSettings size={16} className="text-gray-400"/>Configuración de cola
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Intervalo entre mensajes: <span className="text-primary-600 font-bold">{msgInterval}s</span>
                  </label>
                  <input type="range" min="10" max="300" step="5" value={msgInterval}
                    onChange={e => dispatch({ type: 'UPDATE_SETTINGS', settings: { msgInterval: +e.target.value } })}
                    className="w-full accent-primary-600"/>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>10s (rápido)</span><span>5min (seguro)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!queueRunning ? (
                <Btn onClick={startQueue} className="flex-1" disabled={queuedDrafts.length === 0}>
                  <IconZap size={15}/>Iniciar cola ({queuedDrafts.length} mensajes)
                </Btn>
              ) : (
                <Btn variant="danger" onClick={stopQueue} className="flex-1"><IconX size={15}/>Detener cola</Btn>
              )}
              <Btn variant="secondary" onClick={() => setTab('compose')} title="Agregar más"><IconPlus size={15}/></Btn>
            </div>

            {/* Queued messages */}
            {queuedDrafts.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mensajes en cola ({queuedDrafts.length})</p>
                {queuedDrafts.map((d, i) => (
                  <QueueItem key={d.id} draft={d} index={i}
                    isCurrent={queueRunning && i === queueIndex}
                    countdown={queueRunning && i === queueIndex ? countdown : undefined}
                    countryCode={countryCode}
                    onRemove={id => { dispatch({ type: 'DELETE_DRAFT', id }); notify('Mensaje eliminado de la cola', 'warn'); }}/>
                ))}
              </div>
            ) : (
              <EmptyState icon={<IconClock size={24}/>} title="Cola vacía"
                desc="Añade mensajes desde la pestaña Redactar para programar envíos"
                action={<Btn variant="secondary" onClick={() => setTab('compose')}><IconMessage size={15}/>Ir a Redactar</Btn>}/>
            )}

            {/* Drafts */}
            {state.drafts.filter(d => d.status === 'draft').length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Borradores guardados</p>
                {state.drafts.filter(d => d.status === 'draft').map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-all">
                    <Avatar initials={(d.clientName || 'CL').split(' ').map(n=>n[0]).join('').slice(0,2)} size={28}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{d.clientName}</p>
                      <p className="text-xs text-gray-400 truncate">{d.message.slice(0, 60)}...</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { dispatch({ type: 'UPDATE_DRAFT', draft: { ...d, status: 'queued' } }); notify('Movido a la cola'); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-purple-500 hover:bg-purple-50 transition-colors" title="Añadir a cola">
                        <IconClock size={14}/>
                      </button>
                      {buildWALink(d.phone, d.message, countryCode) && (
                        <a href={buildWALink(d.phone, d.message, countryCode)} target="_blank" rel="noreferrer"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#25D366] hover:bg-emerald-50 transition-colors">
                          <IconWhatsapp size={14}/>
                        </a>
                      )}
                      <button onClick={() => { dispatch({ type: 'DELETE_DRAFT', id: d.id }); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><IconTrash size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex gap-2">
              <IconInfo size={14} className="flex-shrink-0 mt-0.5"/>
              <span>Al iniciar la cola, cada mensaje abre WhatsApp automáticamente. Envía el mensaje y vuelve aquí. El siguiente se abrirá después del intervalo configurado.</span>
            </div>
          </div>
        )}
      </div>

      <Modal open={showTemplateForm} onClose={() => setShowTemplateForm(false)} title="Nueva plantilla">
        <TemplateEditor isNew
          onSave={t => { dispatch({ type: 'ADD_TEMPLATE', template: t }); notify('Plantilla creada ✅'); }}
          onClose={() => setShowTemplateForm(false)}/>
      </Modal>
      <Modal open={!!editTemplate} onClose={() => setEditTemplate(null)} title="Editar plantilla">
        {editTemplate && <TemplateEditor template={editTemplate}
          onSave={t => { dispatch({ type: 'UPDATE_TEMPLATE', template: { ...editTemplate, ...t } }); notify('Plantilla actualizada ✅'); }}
          onClose={() => setEditTemplate(null)}/>}
      </Modal>
    </div>
  );
}

window.MessagesView = MessagesView;
