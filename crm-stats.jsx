// crm-stats.jsx — Statistics & Analytics with real dynamic data
const { useState: useStatsState, useMemo: useStatsMemo } = React;

function BarChart({ data, color = '#2563eb', height = 80 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="relative w-full flex items-end justify-center" style={{ height: height - 18 }}>
            <div className="w-full rounded-t-md transition-all duration-500 relative"
              style={{ height: `${(d.value / max) * 100}%`, background: i === data.length - 1 ? color : color + '66', minHeight: d.value > 0 ? 4 : 0 }}>
              {d.value > 0 && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {d.value > 999 ? '$' + (d.value/1000).toFixed(1) + 'k' : d.value}
                </div>
              )}
            </div>
          </div>
          <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, size = 100 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" strokeWidth="14"/>
        <circle cx="50" cy="50" r="22" fill="white"/>
      </svg>
    );
  }
  let cumulative = 0;
  const r = 38; const cx = 50; const cy = 50;

  const paths = segments.map(seg => {
    const pct = seg.value / total;
    const start = cumulative;
    cumulative += pct;
    const startAngle = start * 360 - 90;
    const endAngle = cumulative * 360 - 90;
    const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
    const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
    const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
    const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
    const largeArc = pct > 0.5 ? 1 : 0;
    const d = pct === 0 ? '' : pct >= 0.9999
      ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
      : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${cx} ${cy} Z`;
    return { ...seg, d, pct };
  });

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {paths.map((p, i) => p.d && <path key={i} d={p.d} fill={p.color} className="transition-all"/>)}
      <circle cx={cx} cy={cy} r={22} fill="white"/>
    </svg>
  );
}

function StatRow({ label, value, pct, color }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }}/>
      <span className="text-sm text-gray-700 flex-1 truncate">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
      <div className="w-20 bg-gray-100 rounded-full h-1.5 flex-shrink-0">
        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }}/>
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

function KPICard({ label, value, sub, trend, icon, bg, iconColor }) {
  return (
    <div className={`${bg} rounded-2xl p-4 border border-white/60`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-white/60 ${iconColor}`}>{icon}</div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold ${trend >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function getWeekDays() {
  const days = ['D','L','M','X','J','V','S'];
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return { label: days[d.getDay()], date: d.toISOString().slice(0,10) };
  });
}

function getMonths() {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const today = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    return { label: months[d.getMonth()], year: d.getFullYear(), month: d.getMonth() };
  });
}

function StatsView() {
  const { state, dispatch } = useCRM();
  const [period, setPeriod] = useStatsState('semana');
  const { clients, orders } = state;

  const stats = useStatsMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const delivered = orders.filter(o => o.status === 'delivered');
    const pending = orders.filter(o => o.status === 'pending');
    const sent = orders.filter(o => o.status === 'sent');
    const avgOrder = orders.length ? Math.round(totalRevenue / orders.length) : 0;
    const topClient = [...clients].sort((a, b) => (b.totalSpent||0) - (a.totalSpent||0))[0];
    const withOrders = clients.filter(c => (c.orders || 0) > 0).length;
    const conversionRate = clients.length ? Math.round((withOrders / clients.length) * 100) : 0;
    return { totalRevenue, delivered, pending, sent, avgOrder, topClient, conversionRate };
  }, [clients, orders]);

  const weekData = useStatsMemo(() => {
    const days = getWeekDays();
    return days.map(d => ({
      label: d.label,
      value: orders.filter(o => o.date === d.date).reduce((s, o) => s + (o.total || 0), 0)
    }));
  }, [orders]);

  const monthData = useStatsMemo(() => {
    const months = getMonths();
    return months.map(m => ({
      label: m.label,
      value: orders.filter(o => {
        const d = new Date(o.date);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      }).reduce((s, o) => s + (o.total || 0), 0)
    }));
  }, [orders]);

  const chartData = period === 'semana' ? weekData : monthData;
  const chartTotal = chartData.reduce((s, d) => s + d.value, 0);

  const statusSegments = [
    { label: 'Entregados', value: stats.delivered.length, color: '#10b981' },
    { label: 'Enviados', value: stats.sent.length, color: '#3b82f6' },
    { label: 'Pendientes', value: stats.pending.length, color: '#f59e0b' },
  ];
  const totalOrders = orders.length;

  const topClients = useStatsMemo(() =>
    [...clients].sort((a, b) => (b.totalSpent||0) - (a.totalSpent||0)).slice(0, 5),
    [clients]
  );
  const maxSpent = topClients[0]?.totalSpent || 1;

  // Top products from orders
  const topProducts = useStatsMemo(() => {
    const map = {};
    orders.forEach(o => {
      if (!o.product) return;
      if (!map[o.product]) map[o.product] = { name: o.product, sales: 0, revenue: 0 };
      map[o.product].sales += (o.qty || 1);
      map[o.product].revenue += (o.total || 0);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);
  const maxSales = topProducts[0]?.sales || 1;

  return (
    <div className="fade-in">
      <TopBar title="Estadísticas" actions={
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-xl overflow-hidden text-xs font-medium">
            {[['semana','Semana'],['mes','Meses']].map(([v,l]) => (
              <button key={v} onClick={() => setPeriod(v)}
                className={`px-3 py-1.5 transition-colors ${period===v ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{l}</button>
            ))}
          </div>
          <Btn variant="secondary" size="sm" onClick={() => window.print()}>
            <IconDownload size={14}/>PDF
          </Btn>
        </div>
      }/>

      <div className="p-4 md:p-6 pb-24 md:pb-6 space-y-4">

        <div className="grid grid-cols-2 gap-3">
          <KPICard label="Ingresos totales" value={formatCurrency(stats.totalRevenue)}
            icon={<IconTrendingUp size={16}/>} bg="bg-blue-50" iconColor="text-blue-600"
            sub={`${totalOrders} pedido${totalOrders !== 1 ? 's' : ''}`}/>
          <KPICard label="Ticket promedio" value={formatCurrency(stats.avgOrder)}
            icon={<IconShoppingBag size={16}/>} bg="bg-emerald-50" iconColor="text-emerald-600"
            sub={`por pedido`}/>
          <KPICard label="Clientes activos" value={clients.filter(c=>c.status==='active').length}
            icon={<IconUsers size={16}/>} bg="bg-violet-50" iconColor="text-violet-600"
            sub={`${stats.conversionRate}% compraron`}/>
          <KPICard label="Pedidos entregados" value={stats.delivered.length}
            icon={<IconCheck size={16}/>} bg="bg-amber-50" iconColor="text-amber-600"
            sub={`de ${totalOrders} totales`}/>
        </div>

        {/* Revenue chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Ventas — {period === 'semana' ? 'últimos 7 días' : 'últimos 6 meses'}
              </p>
              <p className="text-xs text-gray-400">Basado en pedidos registrados</p>
            </div>
            <p className="text-lg font-bold text-primary-600">{formatCurrency(chartTotal)}</p>
          </div>
          {chartTotal > 0 ? (
            <BarChart data={chartData} color="#2563eb" height={100}/>
          ) : (
            <div className="flex items-center justify-center h-16 text-sm text-gray-400">
              Sin ventas en este período
            </div>
          )}
        </div>

        {/* Orders donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-900 mb-4">Estado de pedidos</p>
          {totalOrders > 0 ? (
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <DonutChart segments={statusSegments} size={90}/>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-bold text-gray-900">{totalOrders}</p>
                  <p className="text-[10px] text-gray-400">total</p>
                </div>
              </div>
              <div className="flex-1 space-y-1">
                {statusSegments.map(seg => (
                  <StatRow key={seg.label} label={seg.label} value={seg.value}
                    pct={totalOrders ? Math.round((seg.value / totalOrders) * 100) : 0}
                    color={seg.color}/>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Sin pedidos registrados</p>
          )}
        </div>

        {/* Top clients */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Top clientes</p>
            <button onClick={() => dispatch({ type: 'NAVIGATE', view: 'clients' })}
              className="text-xs text-primary-600 font-medium hover:text-primary-700">Ver todos →</button>
          </div>
          {topClients.length > 0 ? (
            <div className="space-y-3">
              {topClients.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300 w-5">#{i+1}</span>
                  <Avatar initials={c.avatar} size={30}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                      <div className="h-1 rounded-full bg-primary-500 transition-all duration-700"
                        style={{ width: `${((c.totalSpent || 0) / maxSpent) * 100}%` }}/>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(c.totalSpent)}</p>
                    <p className="text-[10px] text-gray-400">{c.orders || 0} pedidos</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Sin clientes con compras</p>
          )}
        </div>

        {/* Top products */}
        {topProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">Productos más vendidos</p>
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300 w-5">#{i+1}</span>
                  <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconPackage size={13} className="text-primary-500"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                      <div className="h-1 rounded-full bg-emerald-500 transition-all duration-700"
                        style={{ width: `${(p.sales / maxSales) * 100}%` }}/>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-gray-900">{formatCurrency(p.revenue)}</p>
                    <p className="text-[10px] text-gray-400">{p.sales} uds.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insight */}
        <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <IconZap size={15} className="text-white"/>
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">📈 Resumen del negocio</p>
              <p className="text-violet-100 text-xs leading-relaxed">
                {stats.topClient ? (
                  <><strong>{stats.topClient.name}</strong> es tu mejor cliente con {formatCurrency(stats.topClient.totalSpent || 0)}. </>
                ) : null}
                Tasa de conversión: <strong>{stats.conversionRate}%</strong>
                {stats.pending.length > 0 && ` · ${stats.pending.length} pedido${stats.pending.length !== 1 ? 's' : ''} pendiente${stats.pending.length !== 1 ? 's' : ''}`}.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

window.StatsView = StatsView;
