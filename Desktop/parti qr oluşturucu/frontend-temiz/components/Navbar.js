import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useUser();
  const { theme, toggleTheme, isDark } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginMsg, setLoginMsg] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  // Giriş modalı state'leri
  const [loginCooldown, setLoginCooldown] = useState(0);
  const cooldownKey = 'magicLinkCooldown';
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const recaptchaRef = useRef();

  // Geri sayım timer'ı
  useEffect(() => {
    let timer;
    if (loginCooldown > 0) {
      timer = setInterval(() => {
        setLoginCooldown(prev => {
          if (prev <= 1) {
            localStorage.removeItem(cooldownKey);
            clearInterval(timer);
            return 0;
          }
          localStorage.setItem(cooldownKey, (prev - 1).toString());
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [loginCooldown]);

  // Modal açıldığında kalan süreyi kontrol et
  useEffect(() => {
    if (showLoginModal) {
      const cooldown = parseInt(localStorage.getItem(cooldownKey) || '0', 10);
      if (cooldown > 0) setLoginCooldown(cooldown);
    }
  }, [showLoginModal]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMsg('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/request-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, captchaToken })
      });
      const data = await res.json();
      if (res.ok) {
        setLoginMsg('Giriş linki e-posta adresinize gönderildi!');
        setLoginCooldown(60);
        localStorage.setItem(cooldownKey, '60');
        setShowCaptcha(false);
        setCaptchaToken('');
        if (recaptchaRef.current) recaptchaRef.current.reset();
      } else {
        setLoginMsg(data.error || 'Bir hata oluştu!');
        if (data.captchaRequired) {
          setShowCaptcha(true);
        }
      }
    } catch {
      setLoginMsg('Bir hata oluştu!');
    }
    setLoginLoading(false);
  };

  const isActive = (path) => {
    return router.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-40 bg-white/70 dark:bg-dark-card/70 backdrop-blur supports-backdrop-blur:bg-white/60 border-b border-gray-200 dark:border-dark-border shadow-lg transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 dark:bg-dark-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🎫</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-dark-text font-trt">Bilet Sistemi</h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                  : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg'
              }`}
            >
              Ana Sayfa
            </Link>
            
            <Link 
              href="/events" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/events') 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                  : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg'
              }`}
            >
              Etkinlikler
            </Link>
            
            {user && (
              <Link 
                href="/my-tickets" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/my-tickets') 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg'
                }`}
              >
                Biletlerim
              </Link>
            )}
            
            {/* Admin menüsü - sadece admin kullanıcıları için */}
            {user && user.isAdmin && (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/scan" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/scan') 
                      ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' 
                      : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg'
                  }`}
                >
                  QR Tara
                </Link>
                <Link 
                  href="/admin-panel" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/admin-panel') 
                      ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' 
                      : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg'
                  }`}
                >
                  Admin Panel
                </Link>
              </div>
            )}

            {/* Tema Değiştirme Butonu */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-dark-bg hover:bg-gray-200 dark:hover:bg-dark-border transition-colors duration-200"
              title={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
            >
              {isDark ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700 dark:text-dark-text-secondary">Merhaba, {user.name}</span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 bg-blue-600 dark:bg-dark-primary text-white rounded-md hover:bg-blue-700 dark:hover:bg-dark-primary-hover transition-colors font-trt text-sm font-medium"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Giriş Yap butonu */}
                {!user && (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-3 py-1.5 bg-blue-600 dark:bg-dark-primary text-white rounded-md hover:bg-blue-700 dark:hover:bg-dark-primary-hover transition-colors font-trt text-sm font-medium"
                  >
                    Giriş Yap
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Giriş Modalı */}
          {showLoginModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-black bg-opacity-50">
              <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl p-6 w-full max-w-sm relative animate-fadeIn">
                <button
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
                  onClick={() => { setShowLoginModal(false); setLoginMsg(''); setLoginEmail(''); setShowCaptcha(false); setCaptchaToken(''); }}
                  aria-label="Kapat"
                >×</button>
                <h3 className="text-xl font-bold mb-4 text-center text-gray-900 dark:text-white">Giriş Yap</h3>
                <form onSubmit={handleLogin} className="space-y-4">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-card text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                    placeholder="E-posta adresiniz"
                    required
                  />
                  {showCaptcha && (
                    <div className="my-3 flex justify-center">
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                        onChange={token => setCaptchaToken(token)}
                        theme={theme === 'dark' ? 'dark' : 'light'}
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-700 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 transition text-base font-semibold shadow"
                    disabled={loginLoading || loginCooldown > 0}
                  >
                    {loginLoading ? 'Gönderiliyor...' : loginCooldown > 0 ? `Tekrar göndermek için ${loginCooldown} sn` : 'Giriş Linki Gönder'}
                  </button>
                  {loginMsg && <div className="mt-2 text-center text-sm text-blue-700 dark:text-blue-300">{loginMsg}</div>}
                </form>
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Menüyü aç</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border transition-colors duration-300">
            <Link 
              href="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Ana Sayfa
            </Link>
            
            <Link 
              href="/events" 
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/events') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Etkinlikler
            </Link>
            
            {user && (
              <Link 
                href="/my-tickets" 
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/my-tickets') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Biletlerim
              </Link>
            )}
            
            {/* Admin menüsü - mobil */}
            {user && user.isAdmin && (
              <>
                <Link 
                  href="/scan" 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/scan') 
                      ? 'bg-red-100 text-red-700' 
                      : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  QR Tara
                </Link>
                <Link 
                  href="/admin-panel" 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/admin-panel') 
                      ? 'bg-red-100 text-red-700' 
                      : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              </>
            )}

            {/* Tema Değiştirme Butonu - Mobil */}
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-dark-border">
              <button
                onClick={toggleTheme}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg rounded-md transition-colors"
              >
                {isDark ? (
                  <>
                    <svg className="w-5 h-5 mr-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                    Açık Temaya Geç
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                    Koyu Temaya Geç
                  </>
                )}
              </button>
            </div>

            {/* Mobile User Menu */}
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-dark-border">
              {user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm text-gray-700 dark:text-dark-text-secondary">
                    Merhaba, {user.name}
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg rounded-md transition-colors"
                  >
                    Çıkış
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Giriş Yap
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 