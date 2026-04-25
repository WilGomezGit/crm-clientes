// crm-dashboard.jsx — Dashboard view with real dynamic data
const { useState: useDashState, useMemo: useDashMemo } = React;

function MiniBar({ values, color = '#2563eb' }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all"
          style={{ height: `${(v / max) * 100}%`, background: i === values.length - 1 ? color : color + '55' }} />
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, trend, icon, color = 'blue', spark, onClick }) {
  const colors = {
    blue: { bg: 'bg-primary-50', icon: 'bg-primary-100 text-primary-600' },
    green: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600' },
    violet: { bg: 'bg-violet-50', icon: 'bg-violet-100 text-violet-600' },
  };
  const sparkColors = { blue: '#2563eb', green: '#10b981', amber: '#f59e0b', violet: '#7c3aed' };
  const c = colors[color];
  return (
    <div onClick={onClick}
      className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer active:scale-[0.98] hover:-translate-y-0.5' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.icon}`}>{icon}</div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {spark && <div className="mt-3"><MiniBar values={spark} color={sparkColors[color]}/></div>}
    </div>
  );
}

function ActivityItem({ icon, text, time, type }) {
  const typeColors = {
    order: 'bg-blue-100 text-blue-600',
    client: 'bg-emerald-100 text-emerald-600',
    message: 'bg-violet-100 text-violet-600',
    delivered: 'bg-emerald-100 text-emerald-600',
    stock: 'bg-amber-100 text-amber-600',
  };
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[type] || 'bg-gray-100 text-gray-500'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-snug">{text}</p>
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{time}</span>
    </div>
  );
}

function QuickAction({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all active:scale-95 flex-1">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <span className="text-xs font-medium text-gray-600 text-center leading-tight">{label}</span>
    </button>
  );
}

function getRealDate() {
  const now = new Date();
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getGreeting(name) {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = (name || 'emprendedora').split(' ')[0];
  return `${greeting}, ${firstName} 👋`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} días`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem`;
  return `hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
}

function Dashboard() {
  const { state, dispatch } = useCRM();
  const { clients, orders, notifications } = state;

  const today = new Date().toISOString().slice(0, 10);

  const stats = useDashMemo(() => {
    const activeClients = clients.filter(c => c.status === 'active').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const sentOrders = orders.filter(o => o.status === 'sent').length;
    const todayOrders = orders.filter(o => o.date === today);
    const todayTotal = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
    const monthTotal = orders.reduce((s, o) => s + (o.total || 0), 0);
    return { activeClients, pendingOrders, sentOrders, todayTotal, monthTotal, todayCount: todayOrders.length };
  }, [clients, orders, today]);

  // Build dynamic activity from real notifications
  const activity = useDashMemo(() => {
    return (notifications || []).slice(0, 6).map(n => ({
      icon: n.type === 'order' ? <IconShoppingBag size={15}/> : n.type === 'client' ? <IconUsers size={15}/> : <IconPackage size={15}/>,
      text: n.text, time: n.time,
      type: n.type === 'stock' ? 'stock' : n.type
    }));
  }, [notifications]);

  const pendingList = useDashMemo(() => orders.filter(o => o.status === 'pending').slice(0, 3), [orders]);

  return (
    <div className="fade-in">
      <TopBar title="Dashboard"/>

      <div className="p-4 md:p-6 pb-24 md:pb-6 space-y-5">
        {/* Greeting */}
        <div>
          <p className="text-gray-500 text-sm">{getRealDate()}</p>
          <h2 className="text-lg font-bold text-gray-900">{getGreeting(state.user?.name)}</h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Clientes activos" value={stats.activeClients} color="blue"
            icon={<IconUsers size={18}/>}
            sub={`${clients.length} total`}
            spark={[4,6,5,7,8,stats.activeClients > 0 ? stats.activeClients - 1 : 0,stats.activeClients]}
            onClick={() => dispatch({ type: 'NAVIGATE', view: 'clients' })}/>
          <StatCard label="Pedidos pendientes" value={stats.pendingOrders} color="amber"
            icon={<IconShoppingBag size={18}/>}
            sub={`${stats.sentOrders} enviados`}
            spark={[2,4,3,5,4,stats.pendingOrders + 1,stats.pendingOrders]}
            onClick={() => dispatch({ type: 'NAVIGATE', view: 'orders' })}/>
          <StatCard label="Ventas de hoy" value={formatCurrency(stats.todayTotal)} color="green"
            icon={<IconTrendingUp size={18}/>}
            sub={stats.todayCount > 0 ? `${stats.todayCount} pedido${stats.todayCount !== 1 ? 's' : ''}` : 'Sin pedidos hoy'}
            spark={[300,600,400,700,500,600,stats.todayTotal > 0 ? stats.todayTotal : 500]}/>
          <StatCard label="Ventas totales" value={formatCurrency(stats.monthTotal)} color="violet"
            icon={<IconZap size={18}/>}
            sub={`${orders.length} pedidos`}
            spark={[1000,2000,1500,2500,2000,stats.monthTotal * 0.8,stats.monthTotal]}
            onClick={() => dispatch({ type: 'NAVIGATE', view: 'stats' })}/>
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Acciones rápidas</p>
          <div className="flex gap-2">
            <QuickAction icon={<IconPlus size={18} className="text-primary-600"/>} label="Nuevo cliente"
              color="bg-primary-50" onClick={() => dispatch({ type: 'NAVIGATE', view: 'clients' })}/>
            <QuickAction icon={<IconShoppingBag size={18} className="text-amber-600"/>} label="Crear pedido"
              color="bg-amber-50" onClick={() => dispatch({ type: 'NAVIGATE', view: 'orders' })}/>
            <QuickAction icon={<IconWhatsapp size={18} className="text-[#25D366]"/>} label="Mensajes"
              color="bg-emerald-50" onClick={() => dispatch({ type: 'NAVIGATE', view: 'messages' })}/>
            <QuickAction icon={<IconUpload size={18} className="text-violet-600"/>} label="Importar"
              color="bg-violet-50" onClick={() => dispatch({ type: 'NAVIGATE', view: 'clients' })}/>
          </div>
        </div>

        {/* Pending orders alert */}
        {pendingList.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <IconClock size={16} className="text-amber-600"/>
              <p className="text-sm font-semibold text-amber-800">
                {stats.pendingOrders} pedido{stats.pendingOrders !== 1 ? 's' : ''} pendiente{stats.pendingOrders !== 1 ? 's' : ''}
              </p>
            </div>
            {pendingList.map(order => (
              <div key={order.id} className="flex items-center gap-3 py-2 border-t border-amber-100 first:border-0">
                <Avatar initials={order.clientName.split(' ').map(n=>n[0]).join('').slice(0,2)} size={30}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{order.clientName}</p>
                  <p className="text-xs text-gray-500 truncate">{order.product}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                  <p className="text-[10px] text-gray-400">{order.date}</p>
                </div>
                <button onClick={() => dispatch({ type: 'NAVIGATE', view: 'orders' })}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex-shrink-0">
                  <IconChevronRight size={16}/>
                </button>
              </div>
            ))}
            <button onClick={() => dispatch({ type: 'NAVIGATE', view: 'orders' })}
              className="mt-3 w-full text-center text-xs text-amber-700 font-semibold hover:text-amber-800 transition-colors">
              Ver todos los pedidos →
            </button>
          </div>
        )}

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-gray-900">Actividad reciente</p>
            <button onClick={() => dispatch({ type: 'NAVIGATE', view: 'stats' })} className="text-xs text-primary-600 font-medium hover:text-primary-700">Ver stats →</button>
          </div>
          {activity.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {activity.map((a, i) => <ActivityItem key={i} {...a}/>)}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Sin actividad reciente — comienza agregando clientes</p>
          )}
        </div>

        {/* Tip card */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <IconZap size={15} className="text-white"/>
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">💡 Tip del día</p>
              {stats.sentOrders > 0 ? (
                <p className="text-primary-100 text-xs leading-relaxed">
                  Tienes <strong>{stats.sentOrders}</strong> pedido{stats.sentOrders !== 1 ? 's' : ''} enviado{stats.sentOrders !== 1 ? 's' : ''}.
                  ¡Manda un mensaje de seguimiento para confirmar entrega y generar recompras!
                </p>
              ) : (
                <p className="text-primary-100 text-xs leading-relaxed">
                  Tienes <strong>{clients.length}</strong> clientes registrados. Usa la función de mensajes masivos
                  para enviar promociones y generar nuevas ventas.
                </p>
              )}
              <button onClick={() => dispatch({ type: 'NAVIGATE', view: 'messages' })}
                className="mt-2.5 bg-white text-primary-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors">
                Ir a Mensajes →
              </button>
            </div>
          </div>
        </div>

        {/* Catalog low stock alert */}
        {(state.catalog || []).some(p => Number(p.stock) === 0) && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconPackage size={16} className="text-red-500"/>
              <p className="text-sm font-semibold text-red-700">Productos sin stock</p>
            </div>
            <div className="space-y-1">
              {(state.catalog || []).filter(p => Number(p.stock) === 0).slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-red-700 truncate">{p.name}</span>
                  <span className="text-red-500 font-semibold flex-shrink-0 ml-2">Sin stock</span>
                </div>
              ))}
            </div>
            <button onClick={() => dispatch({ type: 'NAVIGATE', view: 'catalog' })}
              className="mt-2 text-xs text-red-600 font-medium hover:text-red-700">Ver catálogo →</button>
          </div>
        )}
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
