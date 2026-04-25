// crm-app.jsx — Main app root, router, settings, theme manager
const { useState: useAppState, useEffect: useAppEffect } = React;

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
        <IconPackage size={28} className="text-white"/>
      </div>
      <div className="text-center">
        <p className="text-gray-700 font-semibold">CatalogoCRM</p>
        <p className="text-xs text-gray-400 mt-1 animate-pulse">Verificando sesión...</p>
      </div>
    </div>
  );
}

function FirebaseSetupScreen() {
  const steps = [
    { n: 1, title: 'Crear proyecto Firebase', desc: 'Ve a console.firebase.google.com → "Agregar proyecto" → sigue los pasos.' },
    { n: 2, title: 'Activar autenticación', desc: 'En tu proyecto: Authentication → Sign-in method → Email/Contraseña → Activar.' },
    { n: 3, title: 'Crear base de datos', desc: 'Firestore Database → Crear base de datos → Modo producción → elige región.' },
    { n: 4, title: 'Copiar configuración', desc: 'Configuración del proyecto ⚙️ → Tus apps → Agregar app web → copia el objeto firebaseConfig.' },
    { n: 5, title: 'Pegar en firebase-config.jsx', desc: 'Abre el archivo firebase-config.jsx y reemplaza FIREBASE_CONFIG con tu config real.' },
  ];
  const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/data/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}`;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <IconSettings size={28} className="text-amber-600"/>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configura Firebase</h1>
          <p className="text-gray-500 text-sm">La app necesita Firebase para guardar tus datos en la nube.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 mb-4">
          {steps.map(s => (
            <div key={s.n} className="flex gap-3">
              <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">{s.n}</div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-700 mb-2">Reglas de Firestore (Firestore → Reglas → Publicar):</p>
          <pre className="text-[11px] bg-gray-900 text-emerald-400 rounded-xl p-4 overflow-x-auto leading-relaxed">{rules}</pre>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Después de guardar firebase-config.jsx, recarga la página.
        </p>
      </div>
    </div>
  );
}

function ThemeManager() {
  const { state } = useCRM();
  useAppEffect(() => {
    const apply = (dark) => {
      if (dark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };
    if (state.theme === 'dark') { apply(true); return; }
    if (state.theme === 'light') { apply(false); return; }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    apply(mq.matches);
    const handler = (e) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [state.theme]);
  return null;
}

function SettingsView() {
  const { state, dispatch, notify, forceSave } = useCRM();
  const settings = state.settings || {};
  const [profile, setProfile] = useAppState({
    name: state.user?.name || '',
    email: state.user?.email || '',
    business: 'Mi Catálogo',
    phone: '',
  });
  const [localSettings, setLocalSettings] = useAppState({
    countryCode: settings.countryCode || '52',
    msgInterval: settings.msgInterval || 30,
    confirmBeforeSend: settings.confirmBeforeSend !== false,
  });
  const [saved, setSaved] = useAppState(false);
  const [showReset, setShowReset] = useAppState(false);

  const handleSave = () => {
    dispatch({ type: 'UPDATE_SETTINGS', settings: localSettings });
    setSaved(true);
    notify('Configuración guardada ✅');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_DATA' });
    notify('Datos restablecidos. Recarga la página.', 'warn');
    setShowReset(false);
  };

  const handleExportClients = () => {
    const data = state.clients.map(c => ({
      Nombre: c.name, Teléfono: c.phone, Ciudad: c.city, Dirección: c.address,
      Estado: c.status === 'active' ? 'Activo' : 'Inactivo',
      Pedidos: c.orders || 0, 'Total gastado': c.totalSpent || 0,
      Notas: c.notes, 'Fecha registro': c.createdAt
    }));
    exportCSV(data, 'clientes_crm.csv');
    notify('📁 Exportando clientes...');
  };

  const handleExportOrders = () => {
    const data = state.orders.map(o => ({
      ID: o.id, Cliente: o.clientName, Producto: o.product,
      Cantidad: o.qty, Precio: o.price, Total: o.total,
      Estado: getStatusColor(o.status).label, Fecha: o.date, Notas: o.notes
    }));
    exportCSV(data, 'pedidos_crm.csv');
    notify('📁 Exportando pedidos...');
  };

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );

  const THEMES = [
    { id: 'light', label: 'Claro', icon: '☀️', desc: 'Siempre claro' },
    { id: 'dark', label: 'Oscuro', icon: '🌙', desc: 'Siempre oscuro' },
    { id: 'system', label: 'Sistema', icon: '💻', desc: 'Auto' },
  ];

  return (
    <div className="fade-in">
      <TopBar title="Configuración"/>
      <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-2xl mx-auto space-y-4">

        <Section title="👤 Perfil del negocio">
          <div className="flex items-center gap-4 pb-2">
            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">{(profile.name||'AN').slice(0,2).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{profile.name || 'Administrador'}</p>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
          </div>
          <Input label="Nombre" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Tu nombre"/>
          <Input label="Nombre del negocio" value={profile.business} onChange={e => setProfile(p => ({ ...p, business: e.target.value }))} placeholder="Mi Catálogo"/>
        </Section>

        <Section title="🎨 Apariencia">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-3">Tema de la aplicación</p>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => dispatch({ type: 'SET_THEME', theme: t.id })}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition-all ${state.theme === t.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                  <span className="text-2xl">{t.icon}</span>
                  <div className="text-center">
                    <p className={`text-xs font-semibold ${state.theme === t.id ? 'text-primary-700' : 'text-gray-700'}`}>{t.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
                  </div>
                  {state.theme === t.id && (
                    <div className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                      <IconCheck size={10} className="text-white"/>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="📤 WhatsApp y mensajes">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Código de país (sin +)</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">+</span>
              <input value={localSettings.countryCode} onChange={e => setLocalSettings(s => ({ ...s, countryCode: e.target.value.replace(/\D/g,'') }))}
                placeholder="52" maxLength="4"
                className="w-24 px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"/>
              <p className="text-xs text-gray-400">Ej: 57 Colombia · 52 México · 54 Argentina</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">
              Intervalo entre mensajes en cola: <span className="text-primary-600 font-bold">{localSettings.msgInterval}s</span>
            </label>
            <input type="range" min="10" max="300" step="5" value={localSettings.msgInterval}
              onChange={e => setLocalSettings(s => ({ ...s, msgInterval: +e.target.value }))}
              className="w-full accent-primary-600"/>
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>10s (rápido)</span><span>5min (seguro)</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-gray-700">Modo seguro (nueva pestaña)</p>
              <p className="text-xs text-gray-400">Abrir WhatsApp en nueva pestaña</p>
            </div>
            <button onClick={() => setLocalSettings(s => ({ ...s, confirmBeforeSend: !s.confirmBeforeSend }))}
              className={`w-11 h-6 rounded-full relative flex items-center px-0.5 transition-colors ${localSettings.confirmBeforeSend ? 'bg-primary-600' : 'bg-gray-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${localSettings.confirmBeforeSend ? 'translate-x-5' : ''}`}/>
            </button>
          </div>
        </Section>

        <Section title="📊 Datos y exportación">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[
              { label: 'Clientes', value: state.clients.length, color: 'text-primary-600' },
              { label: 'Pedidos', value: state.orders.length, color: 'text-amber-600' },
              { label: 'Productos', value: (state.catalog||[]).length, color: 'text-violet-600' },
              { label: 'Plantillas', value: state.templates.length, color: 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl py-3">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" className="flex-1" onClick={handleExportClients}>
              <IconDownload size={14}/>Clientes CSV
            </Btn>
            <Btn variant="secondary" className="flex-1" onClick={handleExportOrders}>
              <IconDownload size={14}/>Pedidos CSV
            </Btn>
            <Btn variant="secondary" className="flex-1" onClick={() => {
              forceSave().then(success => {
                if(success) notify('Sincronización manual exitosa ☁️');
              });
            }}>
              <IconRefresh size={14}/> Sincronizar nube
            </Btn>
            <Btn variant="secondary" className="flex-1" onClick={() => window.print()}>
              <IconDownload size={14}/>Imprimir
            </Btn>
          </div>
        </Section>

        <Section title="⚠️ Zona peligrosa">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Restablecer todos los datos</p>
              <p className="text-xs text-gray-400">Borra clientes, pedidos y mensajes. No se puede deshacer.</p>
            </div>
            <Btn variant="danger" size="sm" onClick={() => setShowReset(true)}>Restablecer</Btn>
          </div>
        </Section>

        <div className="flex gap-3">
          <Btn onClick={handleSave} className="flex-1" size="lg">
            {saved ? <IconCheck size={16}/> : <IconSettings size={16}/>}
            {saved ? '¡Guardado!' : 'Guardar cambios'}
          </Btn>
          <Btn variant="danger" size="lg" onClick={() => dispatch({ type: 'LOGOUT' })}>
            <IconLogOut size={16}/>
          </Btn>
        </div>

        <p className="text-center text-xs text-gray-400 pb-2">CatalogoCRM v2.0 · Datos guardados localmente en tu dispositivo</p>
      </div>

      <ConfirmDialog open={showReset} title="¿Restablecer todos los datos?"
        desc="Se eliminarán todos tus clientes, pedidos, mensajes y configuración. Esta acción es irreversible."
        onConfirm={handleReset} onClose={() => setShowReset(false)}/>
    </div>
  );
}

function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useAppState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed}/>
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
      <BottomNav/>
      <Notification/>
    </div>
  );
}

function AppRouter() {
  const { state } = useCRM();
  if (!window.fbReady)      return <FirebaseSetupScreen/>;
  if (state.authLoading)    return <LoadingScreen/>;
  if (!state.isLoggedIn)    return <><LoginScreen/><Notification/></>;
  const views = {
    dashboard: <Dashboard/>,
    clients:   <ClientsView/>,
    orders:    <OrdersView/>,
    messages:  <MessagesView/>,
    stats:     <StatsView/>,
    catalog:   <CatalogView/>,
    settings:  <SettingsView/>,
  };
  return <AppLayout>{views[state.currentView] || <Dashboard/>}</AppLayout>;
}

function App() {
  return (
    <CRMProvider>
      <ThemeManager/>
      <AppRouter/>
    </CRMProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
