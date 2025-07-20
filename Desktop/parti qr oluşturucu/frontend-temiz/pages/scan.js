import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../contexts/UserContext';
import dynamic from 'next/dynamic';

const QrScanner = dynamic(() => import('react-qr-scanner'), { ssr: false });
const API_BASE = '';

export default function Scan() {
  const router = useRouter();
  const { user } = useUser();
  const [scannedToken, setScannedToken] = useState(null);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);
  const timeoutRef = useRef(null);

  const handleScan = async (data) => {
    if (data && data.text && scanning) {
      setScanning(false);
      setScannedToken(data.text);
      setLoading(true);
      setError('');
      setResult(null);
      // Önce GET ile bilet bilgisini al
      try {
        const res = await fetch(`${API_BASE}/api/verify?qrToken=${encodeURIComponent(data.text)}`);
        const info = await res.json();
        setTicketInfo(info);
      } catch (e) {
        setError('Bilet bilgisi alınamadı.');
        setScanning(true);
        setScannedToken(null);
      }
      setLoading(false);
    }
  };

  const handleError = (err) => {
    setError('Kamera erişim hatası: ' + err?.message);
  };

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
              const res = await fetch(`${API_BASE}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: scannedToken }),
      });
      const json = await res.json();
      setResult(json);
      // 6 saniye sonra sonucu temizle ve tekrar okutmaya izin ver
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setResult(null);
        setScanning(true);
        setScannedToken(null);
        setTicketInfo(null);
      }, 6000);
    } catch (e) {
      setError('Doğrulama sırasında bir hata oluştu.');
      setScanning(true);
      setScannedToken(null);
      setTicketInfo(null);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setScannedToken(null);
    setTicketInfo(null);
    setScanning(true);
    setError('');
    setResult(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleNewScan = () => {
    setResult(null);
    setScanning(true);
    setScannedToken(null);
    setTicketInfo(null);
    setError('');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  // Güvenlik kontrolü - sadece admin kullanıcılar erişebilir
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!user.isAdmin) {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Admin değilse veya giriş yapmamışsa sayfa yüklenmesin
  if (!user || !user.isAdmin) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white dark:bg-dark-card rounded-2xl shadow-2xl mt-4 transition-colors duration-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-dark-text">Erişim Engellendi</h2>
          <p className="text-gray-600 dark:text-dark-text-secondary mb-6">Bu sayfaya sadece admin kullanıcılar erişebilir.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 dark:bg-dark-primary text-white rounded-lg hover:bg-blue-700 dark:hover:bg-dark-primary-hover transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-dark-card rounded-2xl shadow-2xl mt-4 transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-center font-trt text-gray-900 dark:text-dark-text">QR Kodunu Tara</h2>
      <div className="flex justify-center mb-4">
        <div className="w-full max-w-xs aspect-square bg-gray-100 dark:bg-dark-bg rounded-lg overflow-hidden transition-colors duration-300">
          {scanning && (
            <QrScanner
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: '100%' }}
              constraints={{ video: { facingMode: { exact: 'environment' } } }}
            />
          )}
        </div>
      </div>
      {loading && <div className="text-center text-gray-500 dark:text-dark-text-secondary">Yükleniyor...</div>}
      {error && <div className="mt-4 px-4 py-2 rounded text-center bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700 transition-colors duration-300">{error}</div>}
      {/* Modal Popup */}
      {scannedToken && ticketInfo && !result && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl p-6 w-full max-w-md transition-colors duration-300">
            <h3 className="text-xl font-bold mb-4 text-center text-gray-900 dark:text-dark-text">Bilet Bilgileri</h3>
            {ticketInfo.paymentType === 'entrance' && (
              <div className="mb-4 text-center px-4 py-2 rounded bg-yellow-100 text-yellow-900 border border-yellow-400 text-lg font-bold">
                GİRİŞTE ÖDEME SEÇİLDİ!
              </div>
            )}
            {ticketInfo.paymentType === 'iban' && (
              <div className="mb-4 text-center px-4 py-2 rounded bg-blue-100 text-blue-900 border border-blue-400 text-lg font-bold">
                IBAN İLE ÖDEME
              </div>
            )}
            <div className="mb-4 text-center text-gray-700 dark:text-dark-text-secondary">
              {ticketInfo.valid ? 'Bilet geçerli. Onaylamak ister misiniz?' : 'Bilet geçersiz.'}
            </div>
            <div className="flex flex-col gap-2 mb-4 text-center text-gray-700 dark:text-dark-text-secondary">
              {ticketInfo.name && <span>Ad: {ticketInfo.name}</span>}
              {ticketInfo.email && <span>E-posta: {ticketInfo.email}</span>}
              {ticketInfo.phone && <span>Telefon: {ticketInfo.phone}</span>}
              {ticketInfo.reason && <span className="text-red-600 dark:text-red-400">{ticketInfo.reason}</span>}
            </div>
            <div className="flex gap-4 justify-center">
              {ticketInfo.valid && !ticketInfo.used && (
                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition" onClick={handleApprove} disabled={loading}>Bileti Onayla</button>
              )}
              <button className="px-4 py-2 bg-gray-300 dark:bg-dark-border text-gray-800 dark:text-dark-text rounded hover:bg-gray-400 dark:hover:bg-dark-bg transition" onClick={handleCancel} disabled={loading}>İptal</button>
            </div>
          </div>
        </div>
      )}
      {result && (
        <div className={`mt-6 px-4 py-2 rounded text-center transition-colors duration-300 ${result.valid ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700'}`}>
          {result.paymentType === 'entrance' && (
            <div className="mb-2 px-4 py-2 rounded bg-yellow-100 text-yellow-900 border border-yellow-400 text-lg font-bold">
              GİRİŞTE ÖDEME SEÇİLDİ!
            </div>
          )}
          {result.paymentType === 'iban' && (
            <div className="mb-2 px-4 py-2 rounded bg-blue-100 text-blue-900 border border-blue-400 text-lg font-bold">
              IBAN İLE ÖDEME
            </div>
          )}
          {result.valid ? (
            <span className="font-bold">Bilet Geçerli ve Onaylandı!</span>
          ) : (
            <span className="font-bold">Bilet Geçersiz!</span>
          )}
          <br />
          {result.name && <span>Ad: {result.name}</span>}<br />
          {result.email && <span>E-posta: {result.email}</span>}<br />
          {result.phone && <span>Telefon: {result.phone}</span>}<br />
          {result.reason && !result.valid && <span>{result.reason}</span>}
          {/* Biletin onay/red/bekliyor durumu */}
          {result.status && (
            <div className="mt-2 text-base font-semibold">
              Durum: {result.status === 'approved' ? 'Onaylandı' : result.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
            </div>
          )}
          <div className="mt-4">
            <button 
              className="px-6 py-2 bg-blue-600 dark:bg-dark-primary text-white rounded-lg hover:bg-blue-700 dark:hover:bg-dark-primary-hover transition-colors font-medium"
              onClick={handleNewScan}
            >
              Yeni Bilet Okut
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 