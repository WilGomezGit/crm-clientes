// crm-store.jsx — Global state + Firebase Firestore persistence
const { createContext, useContext, useReducer, useEffect: useStoreEffect, useCallback, useRef } = React;

const CRMContext = createContext(null);

const MOCK_TEMPLATES = [
  { id: 't1', name: 'Confirmación de Pedido', body: 'Hola {nombre} 👋 Tu pedido de *{producto}* por un valor de {monto} ha sido confirmado. ¡Gracias por tu compra!', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400&auto=format&fit=crop' },
];

const BASE_STATE = {
  authLoading: true,
  isLoggedIn: false,
  currentView: 'dashboard',
  user: null,
  clients: [],
  orders: [],
  templates: MOCK_TEMPLATES,
  drafts: [],
  catalog: [],
  notifications: [],
  notification: null,
  selectedClientId: null,
  selectedOrderId: null,
  theme: 'light',
  importedClients: [],
  saving: false,
  settings: { 
    countryCode: '57', 
    msgInterval: 15, 
    confirmBeforeSend: true,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'AUTH_STATE_CHANGED': {
      const d = action.data || {};
      return {
        ...BASE_STATE,
        authLoading: false,
        isLoggedIn: true,
        user: action.user,
        currentView: 'dashboard',
        clients:       d.clients       || [],
        orders:        d.orders        || [],
        templates:     d.templates     || MOCK_TEMPLATES,
        drafts:        d.drafts        || [],
        catalog:       d.catalog       || [],
        notifications: d.notifications || [],
        theme:         d.theme         || 'system',
        settings:      d.settings      || BASE_STATE.settings,
      };
    }
    case 'AUTH_LOADING_DONE':
      return { ...state, authLoading: false };

    case 'LOGOUT':
      if (window.fbAuth) window.fbAuth.signOut().catch(() => {});
      return { ...BASE_STATE, authLoading: false };

    case 'NAVIGATE':
      return { ...state, currentView: action.view, selectedClientId: action.clientId || null, selectedOrderId: action.orderId || null };

    case 'ADD_CLIENT': {
      const c = action.client;
      const avatar = (c.name || 'XX').trim().split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
      const newClient = { ...c, avatar, id: 'c' + Date.now(), orders: 0, totalSpent: 0, createdAt: new Date().toISOString().slice(0,10), status: c.status || 'active' };
      const notif = { id: 'n' + Date.now(), text: `${c.name} fue agregado como cliente`, time: 'ahora', read: false, type: 'client' };
      return { ...state, clients: [newClient, ...state.clients], notifications: [notif, ...state.notifications] };
    }
    case 'UPDATE_CLIENT':
      return { ...state, clients: state.clients.map(c => c.id === action.client.id ? { ...c, ...action.client } : c) };
    case 'DELETE_CLIENT':
      return { ...state, clients: state.clients.filter(c => c.id !== action.id) };

    case 'IMPORT_CLIENTS': {
      const existingPhones = new Set(state.clients.map(c => (c.phone || '').replace(/\D/g, '')).filter(Boolean));
      const newOnes = [];
      (action.clients || []).forEach(c => {
        const cleanPhone = (c.phone || '').replace(/\D/g, '');
        if (!c.name || (cleanPhone && existingPhones.has(cleanPhone))) return;
        if (cleanPhone) existingPhones.add(cleanPhone);
        const avatar = (c.name || 'XX').trim().split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
        newOnes.push({ ...c, avatar, id: 'c' + Date.now() + Math.random().toString(36).slice(2,6), orders: 0, totalSpent: 0, status: 'active', createdAt: new Date().toISOString().slice(0,10) });
      });
      const notif = newOnes.length > 0 ? [{ id: 'n' + Date.now(), text: `${newOnes.length} clientes importados`, time: 'ahora', read: false, type: 'client' }] : [];
      return { ...state, clients: [...newOnes, ...state.clients], importedClients: newOnes, notifications: [...notif, ...state.notifications] };
    }

    case 'ADD_ORDER': {
      const order = { ...action.order, id: 'o' + Date.now(), date: new Date().toISOString().slice(0,10) };
      const clients = state.clients.map(c =>
        c.id === order.clientId ? { ...c, orders: (c.orders || 0) + 1, totalSpent: (c.totalSpent || 0) + (order.total || 0) } : c
      );
      const notif = { id: 'n' + Date.now(), text: `${order.clientName} realizó un pedido de ${formatCurrency(order.total)}`, time: 'ahora', read: false, type: 'order' };
      return { ...state, orders: [order, ...state.orders], clients, notifications: [notif, ...state.notifications] };
    }
    case 'UPDATE_ORDER':
      return { ...state, orders: state.orders.map(o => o.id === action.order.id ? { ...o, ...action.order } : o) };
    case 'DELETE_ORDER':
      return { ...state, orders: state.orders.filter(o => o.id !== action.id) };

    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, { ...action.template, id: 't' + Date.now() }] };
    case 'UPDATE_TEMPLATE':
      return { ...state, templates: state.templates.map(t => t.id === action.template.id ? { ...t, ...action.template } : t) };
    case 'DELETE_TEMPLATE':
      return { ...state, templates: state.templates.filter(t => t.id !== action.id) };

    case 'ADD_DRAFT':
      return { ...state, drafts: [{ ...action.draft, id: 'd' + Date.now() + Math.random().toString(36).slice(2,5), createdAt: new Date().toISOString().slice(0,10) }, ...state.drafts] };
    case 'ADD_DRAFTS': {
      const newDrafts = (action.drafts || []).map((d, i) => ({
        ...d, id: 'd' + (Date.now() + i) + Math.random().toString(36).slice(2,4), createdAt: new Date().toISOString().slice(0,10)
      }));
      return { ...state, drafts: [...newDrafts, ...state.drafts] };
    }
    case 'UPDATE_DRAFT':
      return { ...state, drafts: state.drafts.map(d => d.id === action.draft.id ? { ...d, ...action.draft } : d) };
    case 'DELETE_DRAFT':
      return { ...state, drafts: state.drafts.filter(d => d.id !== action.id) };
    case 'CLEAR_QUEUE':
      return { ...state, drafts: state.drafts.filter(d => d.status !== 'queued') };

    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'ADD_PRODUCT':
      return { ...state, catalog: [{ ...action.product, id: 'p' + Date.now() }, ...state.catalog] };
    case 'UPDATE_PRODUCT':
      return { ...state, catalog: state.catalog.map(p => p.id === action.product.id ? { ...p, ...action.product } : p) };
    case 'DELETE_PRODUCT':
      return { ...state, catalog: state.catalog.filter(p => p.id !== action.id) };

    case 'MARK_NOTIF_READ':
      return { ...state, notifications: state.notifications.map(n => n.id === action.id ? { ...n, read: true } : n) };
    case 'MARK_ALL_NOTIF_READ':
      return { ...state, notifications: state.notifications.map(n => ({ ...n, read: true })) };
    case 'NOTIFY':
      return { ...state, notification: action.notification };
    case 'CLEAR_NOTIFY':
      return { ...state, notification: null };
    case 'SAVING_START':
      return { ...state, saving: true };
    case 'SAVING_DONE':
      return { ...state, saving: false };
    case 'RESET_DATA':
      if (window.fbDb && state.user?.uid) {
        window.fbDb.collection('users').doc(state.user.uid).collection('data').doc('main').delete().catch(() => {});
      }
      return { ...BASE_STATE, authLoading: false, isLoggedIn: true, user: state.user, currentView: 'dashboard' };
    default:
      return state;
  }
}

function CRMProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, BASE_STATE);
  const stateRef = useRef(state);
  
  // Sync ref with state
  useStoreEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Firebase auth state observer — runs once on mount
  useStoreEffect(() => {
    if (!window.fbAuth) {
      dispatch({ type: 'AUTH_LOADING_DONE' });
      return;
    }
    const unsubscribe = window.fbAuth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        try {
          // Registrar el usuario en la base de datos principal
          window.fbDb.collection('users').doc(fbUser.uid).set({
            name: fbUser.displayName || fbUser.email.split('@')[0],
            email: fbUser.email,
            lastLogin: new Date().toISOString()
          }, { merge: true }).catch(err => console.log("No se pudo registrar info de usuario:", err));

          const docRef = window.fbDb.collection('users').doc(fbUser.uid).collection('data').doc('main');
          const doc = await docRef.get();
          dispatch({
            type: 'AUTH_STATE_CHANGED',
            user: {
              name:  fbUser.displayName || fbUser.email.split('@')[0],
              email: fbUser.email,
              uid:   fbUser.uid,
            },
            data: doc.exists ? doc.data() : {},
          });
        } catch (err) {
          dispatch({
            type: 'AUTH_STATE_CHANGED',
            user: { name: fbUser.displayName || fbUser.email.split('@')[0], email: fbUser.email, uid: fbUser.uid },
            data: {},
          });
        }
      } else {
        dispatch({ type: 'AUTH_LOADING_DONE' });
      }
    });
    return unsubscribe;
  }, []);

  const notify = (message, type = 'success') => dispatch({ type: 'NOTIFY', notification: { message, type } });

  // Force Save Function
  const forceSave = useCallback(async () => {
    const s = stateRef.current;
    if (!s.isLoggedIn || !s.user?.uid || !window.fbDb) return;
    
    dispatch({ type: 'SAVING_START' });
    
    const toSave = {
      clients:       s.clients,
      orders:        s.orders,
      templates:     s.templates,
      drafts:        s.drafts,
      catalog:       s.catalog,
      notifications: (s.notifications || []).slice(0, 100),
      theme:         s.theme,
      settings:      s.settings,
    };
    
    try {
      await window.fbDb.collection('users').doc(s.user.uid).collection('data').doc('main').set(toSave);
      dispatch({ type: 'SAVING_DONE' });
      return true;
    } catch (e) {
      console.error("Error saving data:", e);
      dispatch({ type: 'SAVING_DONE' });
      
      // Notify permission issues
      if (e.code === 'permission-denied') {
        notify('Error de permisos en Firebase. Revisa la pestaña "Reglas" en tu consola.', 'error');
      } else {
        notify('Error al guardar en la nube: ' + (e.message || 'Error desconocido'), 'error');
      }
      return false;
    }
  }, []);

  // Debounced Firestore save — 1.5 s after any data change
  useStoreEffect(() => {
    if (!state.isLoggedIn || !state.user?.uid || !window.fbDb) return;
    const timer = setTimeout(() => {
      forceSave();
    }, 1500);
    return () => clearTimeout(timer);
  }, [state.clients, state.orders, state.templates, state.drafts, state.catalog,
      state.notifications, state.theme, state.settings, forceSave]);

  // Auto-dismiss UI toast notifications
  useStoreEffect(() => {
    if (state.notification) {
      const t = setTimeout(() => dispatch({ type: 'CLEAR_NOTIFY' }), 3500);
      return () => clearTimeout(t);
    }
  }, [state.notification]);

  return (
    <CRMContext.Provider value={{ state, dispatch, notify, forceSave }}>
      {children}
    </CRMContext.Provider>
  );
}

function useCRM() { return useContext(CRMContext); }

function getStatusColor(status) {
  const map = {
    pending:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400',   label: 'Pendiente' },
    sent:      { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-400',    label: 'Enviado' },
    delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400', label: 'Entregado' },
    active:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400', label: 'Activo' },
    inactive:  { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-400',     label: 'Inactivo' },
    draft:     { bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-200',    dot: 'bg-gray-400',    label: 'Borrador' },
    queued:    { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  dot: 'bg-purple-400',  label: 'En cola' },
  };
  return map[status] || map.pending;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount || 0);
}

function avatarBg(initials) {
  const colors = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500','bg-pink-500','bg-indigo-500'];
  const s = initials || 'AB';
  const i = (s.charCodeAt(0) + (s.charCodeAt(1) || 0)) % colors.length;
  return colors[i];
}

function exportCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => {
    const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
    return '"' + val.replace(/"/g, '""') + '"';
  }).join(','));
  const csv = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function buildWALink(phone, message, countryCode, image) {
  const clean = (phone || '').replace(/\D/g, '');
  if (!clean) return null;
  const full = clean.startsWith(countryCode || '') ? clean : (countryCode || '') + clean;
  let text = message || '';
  if (image && !image.startsWith('data:')) {
    text += '\n\n' + image;
  }
  return 'https://wa.me/' + full + '?text=' + encodeURIComponent(text);
}

Object.assign(window, { CRMProvider, useCRM, getStatusColor, formatCurrency, avatarBg, exportCSV, buildWALink });
