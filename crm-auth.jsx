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

// ── Google Sign-in helper ──────────────────────────────────────────────────
async function signInWithGoogle() {
  if (!window.fbAuth) throw new Error('Firebase Auth not initialized');
  const provider = new firebase.auth.GoogleAuthProvider();
  // No necesitamos scopes manuales para el login básico, Firebase los maneja
  return window.fbAuth.signInWithPopup(provider);
}

// ── Brand Panel (desktop left column) ─────────────────────────────────────
function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between w-[420px] p-10 relative overflow-hidden flex-shrink-0"
      style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      {/* Geometric decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}/>
        <div className="absolute top-1/2 -right-32 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}/>
        <div className="absolute -bottom-20 left-1/3 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}/>
        {/* Grid lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}/>
      </div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <IconPackage size={20} className="text-white"/>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Catálogo<span style={{ color: '#818cf8' }}>CRM</span></span>
        </div>
        <h2 className="text-white text-3xl font-bold leading-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
          Gestiona tus ventas<br/>con inteligencia
        </h2>
        <p style={{ color: '#94a3b8' }} className="text-sm leading-relaxed">
          Clientes, pedidos, mensajes y automatización — todo en un solo lugar.
        </p>
      </div>

      <div className="relative space-y-3">
        {[
          { icon: <IconUsers size={15}/>,      text: 'Gestión completa de clientes y contactos' },
          { icon: <IconShoppingBag size={15}/>, text: 'Seguimiento de pedidos en tiempo real' },
          { icon: <IconWhatsapp size={15}/>,    text: 'Mensajes directos a WhatsApp con un clic' },
          { icon: <IconZap size={15}/>,         text: 'Cola de mensajes masivos automatizada' },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
              {f.icon}
            </div>
            <p style={{ color: '#cbd5e1' }} className="text-sm">{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Divider "o continúa con" ───────────────────────────────────────────────
function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px" style={{ background: '#e2e8f0' }}/>
      <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>o continúa con</span>
      <div className="flex-1 h-px" style={{ background: '#e2e8f0' }}/>
    </div>
  );
}

// ── Google Button ──────────────────────────────────────────────────────────
function GoogleBtn({ loading, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
      style={{ background: '#fff', border: '1.5px solid #e2e8f0', color: '#374151', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
      onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
      {/* Google SVG logo */}
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
        <path fill="#34A853" d="m6.306 14.691 6.571 4.819C14.655 16.108 19.001 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.045 4 9.18 8.337 6.306 14.691z"/>
        <path fill="#FBBC05" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.105 0-9.26-3.002-11.266-7.359L6.306 33.48C9.18 39.663 16.045 44 24 44z"/>
        <path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C42.971 35.525 44 32 44 24c0-1.341-.138-2.65-.389-3.917z"/>
      </svg>
      {loading ? 'Conectando...' : 'Ingresar o registrarse con Gmail'}
    </button>
  );
}

// ── Login Form ─────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }) {
  const [email, setEmail]       = useStateAuth('');
  const [password, setPassword] = useStateAuth('');
  const [showPass, setShowPass] = useStateAuth(false);
  const [loading, setLoading]   = useStateAuth(false);
  const [gLoading, setGLoading] = useStateAuth(false);
  const [error, setError]       = useStateAuth('');

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return; }
    if (!password)     { setError('Ingresa tu contraseña.');         return; }
    setLoading(true);
    try {
      await window.fbAuth.signInWithEmailAndPassword(email.trim(), password);
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
    <div className="bg-white rounded-2xl p-7 fade-in" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>Inicia sesión</h1>
        <p className="text-sm" style={{ color: '#64748b' }}>Accede a tu panel de ventas</p>
      </div>

      {/* Google button */}
      <GoogleBtn loading={gLoading} onClick={handleGoogle}/>
      <Divider/>

      <form onSubmit={handle} className="space-y-4" noValidate>
        <Input label="Correo electrónico" type="email" value={email}
          onChange={e => setEmail(e.target.value)} placeholder="tu@negocio.mx" required/>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: '#475569' }}>Contraseña</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none pr-10"
              style={{ border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a',
                       transition: 'border-color 0.2s, box-shadow 0.2s' }}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}/>
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }}>
              <IconEye size={16}/>
            </button>
          </div>
        </div>
        {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>{error}</p>}
        <div className="flex justify-end">
          <button type="button" onClick={() => onSwitch('forgot')}
            className="text-xs font-medium" style={{ color: '#6366f1' }}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <IconChevronRight size={16}/>}
          {loading ? 'Iniciando sesión...' : 'Entrar al panel'}
        </button>
      </form>

      <p className="text-center text-xs mt-5" style={{ color: '#64748b' }}>
        ¿Primera vez?{' '}
        <button onClick={() => onSwitch('register')} className="font-semibold hover:underline" style={{ color: '#6366f1' }}>
          Crea tu cuenta gratis
        </button>
      </p>
    </div>
  );
}

// ── Register Form ──────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }) {
  const [name, setName]         = useStateAuth('');
  const [email, setEmail]       = useStateAuth('');
  const [password, setPassword] = useStateAuth('');
  const [showPass, setShowPass] = useStateAuth(false);
  const [loading, setLoading]   = useStateAuth(false);
  const [gLoading, setGLoading] = useStateAuth(false);
  const [error, setError]       = useStateAuth('');

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim())            { setError('Ingresa tu nombre.');                              return; }
    if (!email.trim())           { setError('Ingresa tu correo electrónico.');                  return; }
    if (password.length < 6)     { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setLoading(true);
    try {
      const cred = await window.fbAuth.createUserWithEmailAndPassword(email.trim(), password);
      await cred.user.updateProfile({ displayName: name.trim() });
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
    <div className="bg-white rounded-2xl p-7 fade-in" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
      {/* Back button */}
      <button onClick={() => onSwitch('login')}
        className="flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors"
        style={{ color: '#64748b' }}
        onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
        onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
        <IconChevronLeft size={16}/> Volver al inicio de sesión
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>Crea tu cuenta</h1>
        <p className="text-sm" style={{ color: '#64748b' }}>Empieza a gestionar tus ventas gratis</p>
      </div>

      {/* Google button */}
      <GoogleBtn loading={gLoading} onClick={handleGoogle}/>
      <Divider/>

      <form onSubmit={handle} className="space-y-4" noValidate>
        <Input label="Tu nombre" type="text" value={name}
          onChange={e => setName(e.target.value)} placeholder="Ana López" required/>
        <Input label="Correo electrónico" type="email" value={email}
          onChange={e => setEmail(e.target.value)} placeholder="tu@negocio.mx" required/>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: '#475569' }}>
            Contraseña <span style={{ color: '#94a3b8' }}>(mín. 6 caracteres)</span>
          </label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none pr-10"
              style={{ border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}/>
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }}>
              <IconEye size={16}/>
            </button>
          </div>
        </div>
        {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <IconCheck size={16}/>}
          {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
        </button>
      </form>

      <p className="text-center text-xs mt-5" style={{ color: '#64748b' }}>
        ¿Ya tienes cuenta?{' '}
        <button onClick={() => onSwitch('login')} className="font-semibold hover:underline" style={{ color: '#6366f1' }}>
          Inicia sesión
        </button>
      </p>
    </div>
  );
}

// ── Forgot Password Form ───────────────────────────────────────────────────
function ForgotForm({ onSwitch }) {
  const [email, setEmail]     = useStateAuth('');
  const [loading, setLoading] = useStateAuth(false);
  const [error, setError]     = useStateAuth('');
  const [sent, setSent]       = useStateAuth(false);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return; }
    setLoading(true);
    try {
      await window.fbAuth.sendPasswordResetEmail(email.trim());
      setSent(true);
      setLoading(false);
    } catch (err) {
      setError(fbError(err.code));
      setLoading(false);
    }
  };

  if (sent) return (
    <div className="bg-white rounded-2xl p-7 text-center fade-in"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'rgba(16,185,129,0.1)' }}>
        <IconCheck size={24} style={{ color: '#10b981' }}/>
      </div>
      <h2 className="text-lg font-bold mb-2" style={{ color: '#0f172a' }}>Correo enviado</h2>
      <p className="text-sm mb-6" style={{ color: '#64748b' }}>
        Revisa tu bandeja en <strong style={{ color: '#0f172a' }}>{email}</strong> y sigue las instrucciones.
      </p>
      <button onClick={() => onSwitch('login')}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
        Volver al inicio de sesión
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-7 fade-in"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
      <button onClick={() => onSwitch('login')}
        className="flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors"
        style={{ color: '#64748b' }}
        onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
        onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
        <IconChevronLeft size={16}/> Volver al inicio de sesión
      </button>
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>Restablecer contraseña</h1>
        <p className="text-sm" style={{ color: '#64748b' }}>Te enviamos un enlace a tu correo</p>
      </div>
      <form onSubmit={handle} className="space-y-4" noValidate>
        <Input label="Correo electrónico" type="email" value={email}
          onChange={e => setEmail(e.target.value)} placeholder="tu@negocio.mx" required/>
        {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : null}
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>
    </div>
  );
}

// ── Login Screen (main container) ──────────────────────────────────────────
function LoginScreen() {
  const [mode, setMode] = useStateAuth('login');

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      <BrandPanel/>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12"
        style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <IconPackage size={18} className="text-white"/>
            </div>
            <span className="font-bold text-lg" style={{ color: '#0f172a', letterSpacing: '-0.02em' }}>
              Catálogo<span style={{ color: '#6366f1' }}>CRM</span>
            </span>
          </div>

          {mode === 'login'    && <LoginForm    onSwitch={setMode}/>}
          {mode === 'register' && <RegisterForm onSwitch={setMode}/>}
          {mode === 'forgot'   && <ForgotForm   onSwitch={setMode}/>}
        </div>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
