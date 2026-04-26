// crm-auth.jsx — Firebase Authentication (email/password + Google + Facebook)
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

async function signInWithFacebook() {
  if (!window.fbAuth) throw new Error('Firebase Auth not initialized');
  const provider = new firebase.auth.FacebookAuthProvider();
  return window.fbAuth.signInWithPopup(provider);
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between w-[460px] p-12 relative overflow-hidden flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ background: '#60a5fa' }}/>
        <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full opacity-20" style={{ background: '#1e3a8a' }}/>
      </div>

      <div className="relative z-10 mt-4">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-lg backdrop-blur-sm shadow-sm border border-white/20">
             <IconPackage size={16} className="text-white"/>
          </div>
          <span className="text-white font-bold tracking-wide text-xs uppercase">CRM — Cada Cliente Cuenta</span>
        </div>
        <h1 className="text-white text-[2.5rem] font-extrabold leading-[1.1] mb-6 tracking-tight">
          Gestiona tus ventas de catálogo con inteligencia
        </h1>
        <p className="text-blue-100 text-base leading-relaxed pr-6">
          Clientes, pedidos, mensajes y automatización — todo en un solo lugar.
        </p>
      </div>

      <div className="relative z-10 space-y-5 mb-4">
        {[
          { icon: <IconUsers size={16}/>,      text: 'Gestión completa de clientes y contactos' },
          { icon: <IconShoppingBag size={16}/>, text: 'Seguimiento de pedidos en tiempo real' },
          { icon: <IconWhatsapp size={16}/>,    text: 'Mensajes directos a WhatsApp con un clic' },
          { icon: <IconZap size={16}/>,         text: 'Automatización y cola de mensajes' },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/10 text-white backdrop-blur-md shadow-sm border border-white/10">
              {f.icon}
            </div>
            <p className="text-blue-50 text-[13px] font-medium tracking-wide">{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Divider({ text }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-gray-200"/>
      <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{text}</span>
      <div className="flex-1 h-px bg-gray-200"/>
    </div>
  );
}

function LoginScreen() {
  const [tab, setTab]           = useStateAuth('login'); // 'login', 'register', 'forgot'
  const [name, setName]         = useStateAuth('');
  const [email, setEmail]       = useStateAuth('');
  const [password, setPassword] = useStateAuth('');
  const [showPass, setShowPass] = useStateAuth(false);
  const [loading, setLoading]   = useStateAuth(false);
  const [gLoading, setGLoading] = useStateAuth(false);
  const [fLoading, setFLoading] = useStateAuth(false);
  const [error, setError]       = useStateAuth('');
  const [sentForgot, setSentForgot] = useStateAuth(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    if (tab === 'forgot') {
      if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return; }
      setLoading(true);
      try {
        await window.fbAuth.sendPasswordResetEmail(email.trim());
        setSentForgot(true);
        setLoading(false);
      } catch (err) {
        setError(fbError(err.code));
        setLoading(false);
      }
      return;
    }
    
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

  const handleOAuth = async (providerName) => {
    setError('');
    if (providerName === 'google') setGLoading(true);
    if (providerName === 'facebook') setFLoading(true);
    try {
      if (providerName === 'google') await signInWithGoogle();
      if (providerName === 'facebook') await signInWithFacebook();
    } catch (err) {
      setError(fbError(err.code));
      setGLoading(false);
      setFLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <BrandPanel/>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          
          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-6 relative">
            
            {/* Logo Image */}
            <div className="flex justify-center mb-6">
              <img src="Logo2.png" alt="CRM Logo" className="w-32 h-auto" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>

            {sentForgot && tab === 'forgot' ? (
              <div className="text-center fade-in">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-emerald-50">
                  <IconCheck size={24} className="text-emerald-500"/>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Correo enviado</h2>
                <p className="text-sm text-gray-500 mb-8">Revisa tu bandeja en <b>{email}</b> y sigue las instrucciones.</p>
                <button onClick={() => { setTab('login'); setSentForgot(false); }} className="w-full py-3.5 rounded-xl text-[15px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                  Volver a Iniciar Sesión
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
                    {tab === 'login' ? 'Inicia sesión' : (tab === 'register' ? 'Crea tu cuenta' : 'Recuperar contraseña')}
                  </h2>
                  <p className="text-[13px] text-gray-500">
                    {tab === 'login' ? 'Accede a tu panel de ventas' : (tab === 'register' ? 'Registra tus datos para empezar' : 'Te enviaremos un enlace')}
                  </p>
                </div>

                <form onSubmit={handleAuth} noValidate className="space-y-4">
                  {tab === 'register' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nombre completo</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Ana López"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Correo electrónico</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@catalogo.mx"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                  </div>

                  {tab !== 'forgot' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Contraseña</label>
                      <div className="relative">
                        <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all pr-12" />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <IconEye size={18}/>
                        </button>
                      </div>
                    </div>
                  )}

                  {tab === 'login' && (
                    <div className="flex items-center justify-between pt-2 pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked/>
                        <span className="text-[13px] text-gray-600">Recordarme</span>
                      </label>
                      <button type="button" onClick={() => { setTab('forgot'); setError(''); }} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700">
                        ¿Olvidaste?
                      </button>
                    </div>
                  )}
                  {tab === 'register' && (
                    <div className="flex items-center justify-between pt-2 pb-1">
                      <button type="button" onClick={() => { setTab('login'); setError(''); }} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700">
                        Volver a iniciar sesión
                      </button>
                    </div>
                  )}
                  {tab === 'forgot' && (
                    <div className="flex items-center justify-end pt-2 pb-1">
                      <button type="button" onClick={() => { setTab('login'); setError(''); }} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700">
                        Cancelar
                      </button>
                    </div>
                  )}

                  {error && <p className="text-[13px] px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 text-center">{error}</p>}

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 mt-2 rounded-xl text-[15px] font-bold text-white transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
                    style={{ background: '#2563eb' }}>
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : (tab !== 'forgot' && <IconChevronRight size={18}/>)}
                    {tab === 'login' ? 'Entrar al panel' : (tab === 'register' ? 'Crear cuenta' : 'Enviar enlace')}
                  </button>
                </form>

                {tab !== 'forgot' && (
                  <>
                    <Divider text="o regístrate con"/>
                    <div className="space-y-3">
                      <button type="button" onClick={() => handleOAuth('google')} disabled={gLoading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 48 48">
                          <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                          <path fill="#34A853" d="m6.306 14.691 6.571 4.819C14.655 16.108 19.001 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.045 4 9.18 8.337 6.306 14.691z"/>
                          <path fill="#FBBC05" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.105 0-9.26-3.002-11.266-7.359L6.306 33.48C9.18 39.663 16.045 44 24 44z"/>
                          <path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C42.971 35.525 44 32 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                        </svg>
                        {gLoading ? 'Conectando...' : 'Registrarse con Gmail'}
                      </button>

                      <button type="button" onClick={() => handleOAuth('facebook')} disabled={fLoading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors">
                        <FacebookIcon />
                        {fLoading ? 'Conectando...' : 'Registrarse con Facebook'}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Bottom Link outside card */}
          {tab === 'login' && (
            <p className="text-center text-[13px] text-gray-500 mt-2">
              ¿Primera vez? <button onClick={() => { setTab('register'); setError(''); }} className="font-bold text-blue-600 hover:text-blue-700">Crea tu cuenta gratis</button>
            </p>
          )}

        </div>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
