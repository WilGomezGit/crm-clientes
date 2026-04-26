// crm-auth.jsx — Firebase Authentication (email/password + Google)
const { useState: useStateAuth } = React;

const FB_ERRORS = {
  'auth/user-not-found':        'No existe una cuenta con ese correo.',
  'auth/wrong-password':        'Contraseña incorrecta.',
  'auth/invalid-credential':    'Correo o contraseña incorrectos.',
  'auth/email-already-in-use':  'Ya existe una cuenta con ese correo.',
  'auth/weak-password':         'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email':         'Correo electrónico inválido.',
  'auth/too-many-requests':     'Demasiados intentos. Espera unos minutos.',
  'auth/network-request-failed':'Sin conexión. Verifica tu internet.',
  'auth/popup-closed-by-user':  'Ventana cerrada antes de completar.',
  'auth/cancelled-popup-request': 'Otra ventana de inicio ya está abierta.',
  'auth/popup-blocked':         'El navegador bloqueó la ventana. Permite popups.',
};
const fbError = (code) => FB_ERRORS[code] || 'Error al autenticar. Intenta de nuevo.';

async function signInWithGoogle() {
  if (!window.fbAuth) throw new Error('Firebase Auth not initialized');
  const provider = new firebase.auth.GoogleAuthProvider();
  return window.fbAuth.signInWithPopup(provider);
}

function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between w-[420px] p-10 relative overflow-hidden flex-shrink-0 border-r border-[#1e293b]"
      style={{ background: '#0b1120' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #eab308, transparent)' }}/>
        <div className="absolute top-1/2 -right-32 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #eab308, transparent)' }}/>
      </div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#1e293b] border border-[#334155]">
            <IconPackage size={20} className="text-[#eab308]"/>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Catálogo<span className="text-[#eab308]">CRM</span></span>
        </div>
        <h2 className="text-white text-3xl font-bold leading-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
          Gestiona tus ventas<br/>con inteligencia
        </h2>
        <p className="text-[#94a3b8] text-sm leading-relaxed">
          Clientes, pedidos, mensajes y automatización — todo en un solo lugar.
        </p>
      </div>

      <div className="relative space-y-3">
        {[
          { icon: <IconUsers size={15}/>,      text: 'Gestión completa de clientes y contactos' },
          { icon: <IconShoppingBag size={15}/>, text: 'Seguimiento de pedidos en tiempo real' },
          { icon: <IconWhatsapp size={15}/>,    text: 'Mensajes directos a WhatsApp con un clic' },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#1e293b] text-[#eab308]">
              {f.icon}
            </div>
            <p className="text-[#cbd5e1] text-sm">{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-[#334155]"/>
      <span className="text-[11px] font-bold tracking-widest text-[#64748b]">O CON EMAIL</span>
      <div className="flex-1 h-px bg-[#334155]"/>
    </div>
  );
}

function GoogleBtn({ loading, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
      style={{ background: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }}
      onMouseEnter={e => e.currentTarget.style.background = '#334155'}
      onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}>
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
        <path fill="#34A853" d="m6.306 14.691 6.571 4.819C14.655 16.108 19.001 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.045 4 9.18 8.337 6.306 14.691z"/>
        <path fill="#FBBC05" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.105 0-9.26-3.002-11.266-7.359L6.306 33.48C9.18 39.663 16.045 44 24 44z"/>
        <path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C42.971 35.525 44 32 44 24c0-1.341-.138-2.65-.389-3.917z"/>
      </svg>
      {loading ? 'Conectando...' : 'Continuar con Google'}
    </button>
  );
}

function DarkInput({ label, type, value, onChange, placeholder, isPassword, showPass, onTogglePass, error }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">{label}</label>
      <div className="relative">
        <input 
          type={isPassword && !showPass ? 'password' : type} 
          value={value} onChange={onChange} placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder-[#475569] text-[#f1f5f9]"
          style={{ background: '#f1f5f9', color: '#0f172a', border: '1.5px solid transparent' }}
          onFocus={e => { e.target.style.borderColor = '#eab308'; }}
          onBlur={e => { e.target.style.borderColor = 'transparent'; }}
        />
        {isPassword && (
          <button type="button" onClick={onTogglePass} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a] transition-colors">
            <IconEye size={18}/>
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function LoginScreen() {
  const [tab, setTab]           = useStateAuth('login');
  const [name, setName]         = useStateAuth('');
  const [email, setEmail]       = useStateAuth('');
  const [password, setPassword] = useStateAuth('');
  const [showPass, setShowPass] = useStateAuth(false);
  const [loading, setLoading]   = useStateAuth(false);
  const [gLoading, setGLoading] = useStateAuth(false);
  const [error, setError]       = useStateAuth('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    if (tab === 'register' && !name.trim()) { setError('Ingresa tu nombre.'); return; }
    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return; }
    if (!password) { setError('Ingresa tu contraseña.'); return; }
    if (tab === 'register' && password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }

    setLoading(true);
    try {
      if (tab === 'login') {
        await window.fbAuth.signInWithEmailAndPassword(email.trim(), password);
      } else {
        const cred = await window.fbAuth.createUserWithEmailAndPassword(email.trim(), password);
        await cred.user.updateProfile({ displayName: name.trim() });
      }
    } catch (err) {
      setError(fbError(err.code));
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(fbError(err.code));
      setGLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0b1120' }}>
      <BrandPanel/>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12" style={{ background: '#0f172a' }}>
        <div className="w-full max-w-[400px]">
          
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#1e293b] border border-[#334155]">
              <IconPackage size={20} className="text-[#eab308]"/>
            </div>
            <span className="font-bold text-xl text-white tracking-tight">
              Catálogo<span className="text-[#eab308]">CRM</span>
            </span>
          </div>

          <GoogleBtn loading={gLoading} onClick={handleGoogle}/>
          <Divider/>

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <button onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold tracking-wider transition-colors rounded-lg ${tab === 'login' ? 'bg-[#eab308] text-[#0f172a]' : 'text-[#94a3b8] hover:text-white'}`}>
              INICIAR SESIÓN
            </button>
            <button onClick={() => { setTab('register'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold tracking-wider transition-colors rounded-lg ${tab === 'register' ? 'bg-[#eab308] text-[#0f172a]' : 'text-[#94a3b8] hover:text-white'}`}>
              CREAR CUENTA
            </button>
          </div>

          <form onSubmit={handleAuth} noValidate>
            {tab === 'register' && (
              <DarkInput label="Nombre" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Ana López"/>
            )}
            <DarkInput label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com"/>
            <DarkInput label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" isPassword showPass={showPass} onTogglePass={() => setShowPass(!showPass)}/>
            
            {error && <p className="text-xs px-4 py-3 rounded-xl mb-4 bg-red-900/40 text-red-400 border border-red-900/50">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl text-[15px] font-bold transition-all active:scale-95 disabled:opacity-60"
              style={{ background: '#eab308', color: '#0f172a', boxShadow: '0 4px 20px rgba(234, 179, 8, 0.2)' }}>
              {loading ? 'Procesando...' : (tab === 'login' ? 'Entrar al Panel' : 'Registrarse')}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
