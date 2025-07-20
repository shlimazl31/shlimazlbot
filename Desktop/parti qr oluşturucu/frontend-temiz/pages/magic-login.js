import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function MagicLogin() {
  const router = useRouter();
  const [status, setStatus] = useState('Giriş işleminiz yapılıyor, lütfen bekleyin...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');
    if (!token || !email) {
      setStatus('Geçersiz bağlantı.');
      return;
    }
    fetch(process.env.NEXT_PUBLIC_API_URL + '/auth/verify-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.token) {
          // Ban kontrolü
          if (data.user && data.user.banned) {
            setStatus('Hesabınız banlanmıştır. Giriş yapamazsınız.');
            return;
          }
          localStorage.setItem('jwt', data.token);
          setStatus('Giriş başarılı! Hesabınıza yönlendiriliyorsunuz...');
          setTimeout(() => {
            window.location.href = '/my-tickets?justLoggedIn=1';
          }, 1200);
        } else {
          setStatus(data.error || 'Giriş başarısız.');
        }
      })
      .catch(() => setStatus('Sunucuya bağlanılamadı.'));
  }, [router]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-dark-card rounded-2xl shadow-2xl mt-4 text-center">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-dark-text">Giriş Yapılıyor</h2>
      <p className="text-gray-700 dark:text-dark-text-secondary text-base">{status}</p>
    </div>
  );
} 