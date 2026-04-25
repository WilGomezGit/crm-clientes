// crm-shell.jsx — Layout, Sidebar, BottomNav, TopBar, Notification, Modal
const { useState: useShellState, useEffect: useShellEffect, useRef: useShellRef } = React;

function Notification() {
  const { state } = useCRM();
  const n = state.notification;
  if (!n) return null;
  const isError = n.type === 'error';
  const isWarn = n.type === 'warn';
  return (
    <div className={`fixed top-4 left-1/2 z-[9999] -translate-x-1/2 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium scale-in pointer-events-none
      ${isError ? 'bg-red-600 text-white' : isWarn ? 'bg-amber-500 text-white' : 'bg-gray-900 text-white'}`}>
      {isError ? <IconX size={16}/> : <IconCheck size={16}/>}
      {n.message}
    </div>
  );
}

function Modal({ open, onClose, title, children, size = 'md' }) {
  useShellEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  const maxWidths = { sm: '28rem', md: '32rem', lg: '40rem', xl: '42rem' };
  const portal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        zIndex: 99999,
        backgroundColor: 'rgba(0,0,0,0.46)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: maxWidths[size] || '32rem',
          maxHeight: '90vh',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2eaf8',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #e8effc',
          flexShrink: 0, background: '#ffffff',
        }}>
          <h3 style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px', margin: 0, lineHeight: 1.3 }}>{title}</h3>
          <button
            onClick={onClose}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            style={{
              width: 32, height: 32, minWidth: 32, borderRadius: '50%', border: 'none',
              background: 'transparent', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#94a3b8',
            }}>
            <IconX size={17}/>
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(portal, document.body);
}

function StatusBadge({ status }) {
  const s = getStatusColor(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>
      {s.label}
    </span>
  );
}

function Avatar({ initials, size = 36 }) {
  const bg = avatarBg(initials || 'AB');
  return (
    <div className={`${bg} text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0 text-xs`}
      style={{ width: size, height: size, fontSize: size * 0.32 }}>
      {initials}
    </div>
  );
}

function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <input className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors outline-none
        ${error ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 bg-white focus:border-primary-500 hover:border-gray-300'}
        focus:ring-2 ${error ? 'focus:ring-red-100' : 'focus:ring-primary-100'} ${className}`} {...props} />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <textarea className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors outline-none resize-none
        ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white focus:border-primary-500'}
        focus:ring-2 focus:ring-primary-100 ${className}`} {...props} />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

function Select({ label, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <select className={`w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm transition-colors outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}

function Btn({ children, variant = 'primary', size = 'md', className = '', loading = false, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed no-select';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3 text-sm' };
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-200',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300',
    ghost: 'text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    whatsapp: 'bg-[#25D366] text-white hover:bg-[#1ebe5d] shadow-sm',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> : children}
    </button>
  );
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Inicio', Icon: IconDashboard },
  { id: 'clients', label: 'Clientes', Icon: IconUsers },
  { id: 'orders', label: 'Pedidos', Icon: IconShoppingBag },
  { id: 'catalog', label: 'Catálogo', Icon: IconPackage },
  { id: 'messages', label: 'Mensajes', Icon: IconMessage },
  { id: 'stats', label: 'Stats', Icon: IconTrendingUp },
  { id: 'settings', label: 'Ajustes', Icon: IconSettings },
];

function Sidebar({ collapsed, setCollapsed }) {
  const { state, dispatch, forceSave } = useCRM();
  const view = state.currentView;
  const pendingOrders = state.orders.filter(o => o.status === 'pending').length;

  return (
    <aside className={`hidden md:flex flex-col h-screen bg-white border-r border-gray-100 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-[68px]' : 'w-56'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <IconPackage size={16} className="text-white"/>
        </div>
        {!collapsed && <span className="font-bold text-gray-900 text-base leading-tight">Catálogo<span className="text-primary-600">CRM</span></span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = view === id;
          const hasBadge = id === 'orders' && pendingOrders > 0;
          return (
            <button key={id} onClick={() => dispatch({ type: 'NAVIGATE', view: id })}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${collapsed ? 'justify-center' : ''}
                ${active ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
              title={collapsed ? label : ''}>
              <div className="relative flex-shrink-0">
                <Icon size={19}/>
                {hasBadge && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary-600 rounded-full text-white text-[8px] flex items-center justify-center font-bold">{pendingOrders}</span>}
              </div>
              {!collapsed && <span>{label}</span>}
              {!collapsed && hasBadge && <span className="ml-auto bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">{pendingOrders}</span>}
            </button>
          );
        })}
      </nav>

      {/* User + collapse */}
      <div className="p-2 border-t border-gray-100 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-default">
            <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{state.user?.name?.slice(0,2).toUpperCase() || 'AD'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{state.user?.name || 'Administrador'}</p>
              <p className="text-[10px] text-gray-400 truncate">{state.user?.email || 'admin@catalogo.mx'}</p>
            </div>
          </div>
        )}
        <button onClick={async () => {
            await forceSave();
            dispatch({ type: 'LOGOUT' });
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title="Cerrar sesión">
          <IconLogOut size={16}/>
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
        <button onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:bg-gray-50 transition-colors ${collapsed ? 'justify-center' : ''}`}>
          {collapsed ? <IconChevronRight size={15}/> : <><IconChevronLeft size={15}/><span>Colapsar</span></>}
        </button>
      </div>
    </aside>
  );
}

function BottomNav() {
  const { state, dispatch } = useCRM();
  const view = state.currentView;
  const [showMore, setShowMore] = useShellState(false);
  const pendingOrders = state.orders.filter(o => o.status === 'pending').length;
  const primaryItems = NAV_ITEMS.slice(0, 4);
  const moreItems = NAV_ITEMS.slice(4);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-bottom">
      <div className="flex">
        {primaryItems.map(({ id, label, Icon }) => {
          const active = view === id;
          const hasBadge = id === 'orders' && pendingOrders > 0;
          return (
            <button key={id} onClick={() => dispatch({ type: 'NAVIGATE', view: id })}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${active ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className="relative">
                <Icon size={22}/>
                {hasBadge && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold">{pendingOrders}</span>}
              </div>
              <span className={`text-[10px] font-medium`}>{label}</span>
            </button>
          );
        })}
        {/* More button */}
        <div className="flex-1 relative">
          <button onClick={() => setShowMore(!showMore)}
            className={`w-full flex flex-col items-center gap-1 py-2.5 transition-colors ${moreItems.some(i => i.id === view) ? 'text-primary-600' : 'text-gray-400'}`}>
            <IconMenu size={22}/>
            <span className="text-[10px] font-medium">Más</span>
          </button>
          {showMore && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}/>
              <div className="absolute bottom-16 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-1.5 min-w-[160px] scale-in">
                {moreItems.map(({ id, label, Icon }) => (
                  <button key={id} onClick={() => { dispatch({ type: 'NAVIGATE', view: id }); setShowMore(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${view === id ? 'text-primary-600' : 'text-gray-600'}`}>
                    <Icon size={18}/>{label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function NotificationPanel() {
  const { state, dispatch } = useCRM();
  const { notifications = [] } = state;
  const typeColors = { order: 'bg-blue-100 text-blue-600', client: 'bg-emerald-100 text-emerald-600', stock: 'bg-amber-100 text-amber-600' };
  const typeIcons = { order: <IconShoppingBag size={13}/>, client: <IconUsers size={13}/>, stock: <IconPackage size={13}/> };
  return (
    <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-[999] scale-in overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="font-semibold text-gray-900 text-sm">Notificaciones</p>
        {notifications.some(n => !n.read) && (
          <button onClick={() => dispatch({ type: 'MARK_ALL_NOTIF_READ' })} className="text-xs text-primary-600 font-medium hover:text-primary-700">Marcar todas leídas</button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin notificaciones</p>
        ) : notifications.map(n => (
          <div key={n.id} onClick={() => dispatch({ type: 'MARK_NOTIF_READ', id: n.id })}
            className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${typeColors[n.type] || 'bg-gray-100 text-gray-500'}`}>
              {typeIcons[n.type] || <IconBell size={13}/>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs leading-snug ${!n.read ? 'font-medium text-gray-800' : 'text-gray-600'}`}>{n.text}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
            </div>
            {!n.read && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5"/>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TopBar({ title, actions, onBack }) {
  const { state, dispatch } = useCRM();
  const [showNotifs, setShowNotifs] = useShellState(false);
  const unread = (state.notifications || []).filter(n => !n.read).length;
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 flex items-center gap-3 no-print"
      style={{ background: 'rgba(248,250,255,0.98)' }}>
      {onBack && (
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 -ml-1">
          <IconChevronLeft size={20}/>
        </button>
      )}
      <h1 className="font-semibold text-gray-900 text-base flex-1 flex items-center gap-2">
        {title}
        {state.saving && (
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full animate-pulse">
            <IconCloud size={12}/> Guardando...
          </span>
        )}
      </h1>
      <div className="flex items-center gap-2">
        {actions}
        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
            <IconBell size={19}/>
            {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full pulse-dot"/>}
          </button>
          {showNotifs && (
            <>
              <div className="fixed inset-0 z-[998]" onClick={() => setShowNotifs(false)}/>
              <NotificationPanel/>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function FAB({ onClick, icon, label }) {
  return (
    <button onClick={onClick}
      className="md:hidden fixed bottom-20 right-4 z-40 flex items-center gap-2 bg-primary-600 text-white px-4 py-3 rounded-2xl shadow-lg shadow-primary-200 hover:bg-primary-700 active:scale-95 transition-all font-medium text-sm">
      {icon}
      {label}
    </button>
  );
}

function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
        {icon}
      </div>
      <p className="font-semibold text-gray-700 mb-1">{title}</p>
      <p className="text-sm text-gray-400 mb-5 max-w-xs">{desc}</p>
      {action}
    </div>
  );
}

function ConfirmDialog({ open, title, desc, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="p-5">
        <p className="text-sm text-gray-600 mb-5">{desc}</p>
        <div className="flex gap-2 justify-end">
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => { onConfirm(); onClose(); }}>Eliminar</Btn>
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, {
  Notification, Modal, StatusBadge, Avatar, Input, Textarea, Select, Btn,
  Sidebar, BottomNav, TopBar, FAB, EmptyState, ConfirmDialog, NAV_ITEMS,
});
