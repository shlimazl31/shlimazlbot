import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/auth/request-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setInfo('Giriş linki e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.');
      } else {
        setError(data.error || 'Bir hata oluştu.');
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-dark-card rounded-2xl shadow-2xl mt-4 transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-center font-trt text-gray-900 dark:text-dark-text">Giriş Yap</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">{error}</div>
      )}
      {info && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm">{info}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">E-posta</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-secondary transition-colors duration-300"
            placeholder="ornek@email.com"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 dark:bg-dark-primary text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-dark-primary-hover transition-colors disabled:opacity-50 font-trt"
        >
          {loading ? 'Gönderiliyor...' : 'Giriş Linki Gönder'}
        </button>
      </form>
    </div>
  );
} 