import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function IyzicoCallback() {
  const [statusMsg, setStatusMsg] = useState('Ödeme sonucu doğrulanıyor, lütfen bekleyin...');
  const [success, setSuccess] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const error = params.get('error');
    if (status === 'success') {
      setStatusMsg('Bilet(ler)iniz başarıyla oluşturuldu ve e-posta adresinize gönderildi!');
      setSuccess(true);
    } else if (status === 'fail') {
      setStatusMsg(error ? `Ödeme başarısız: ${decodeURIComponent(error)}` : 'Ödeme başarısız.');
      setSuccess(false);
    } else {
      setStatusMsg('Ödeme sonucu doğrulanıyor, lütfen bekleyin...');
      setSuccess(null);
    }
  }, [router.isReady]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mt-12 max-w-md w-full text-center">
        <h1 className={`text-2xl font-bold mb-4 ${success === true ? 'text-green-600' : success === false ? 'text-red-600' : 'text-gray-700 dark:text-gray-200'}`}>iyzico Ödeme Sonucu</h1>
        <p className="mb-6 text-lg">{statusMsg}</p>
        {success && (
          <a href="/my-tickets" className="inline-block px-6 py-3 bg-blue-700 text-white rounded-lg font-bold text-lg hover:bg-blue-800 transition">Biletlerimi Gör</a>
        )}
      </div>
    </div>
  );
} 