import '../styles/globals.css';
import Navbar from '../components/Navbar';
import { UserProvider } from '../contexts/UserContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useRouter } from 'next/router';

function ThemeMetaUpdater() {
  const { theme } = useTheme();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', theme === 'dark' ? '#18181b' : '#ffffff');
    }
  }, [theme]);
  return null;
}

function ScrollToTopButton() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 200);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-3 sm:p-4 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-blue-400
        ${show ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-6 pointer-events-none'}`}
      title="Yukarı Çık"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
    </button>
  );
}

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isHome = router.pathname === '/';
  return (
    <>
      <Head>
        <meta name="theme-color" content="#18181b" />
      </Head>
      <ThemeProvider>
        <ThemeMetaUpdater />
        <UserProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg font-trt transition-colors duration-300">
            <Navbar />
            {!isHome && <div className="h-20 sm:h-24"></div>}
            <Component {...pageProps} />
            <ScrollToTopButton />
          </div>
        </UserProvider>
      </ThemeProvider>
    </>
  );
} 