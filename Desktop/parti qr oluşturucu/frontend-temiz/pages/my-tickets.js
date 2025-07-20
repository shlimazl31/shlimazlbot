import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Girişten hemen sonra reload için
    if (router.query && router.query.justLoggedIn) {
      window.location.replace('/my-tickets');
      return;
    }
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      router.push('/login');
      return;
    }
    fetchTickets(jwt);
  }, [router]);

  const fetchTickets = async (jwt) => {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/tickets/my', {
        headers: { 'Authorization': 'Bearer ' + jwt }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      } else {
        setTickets([]);
        if (res.status === 401) router.push('/login');
      }
    } catch (error) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowQR = async (ticket) => {
    setSelectedTicket(ticket);
    setShowQRModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-dark-card rounded-2xl shadow-2xl mt-4 transition-colors duration-300">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-dark-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">Biletler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl mt-4 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-dark-text font-trt">Biletlerim</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-dark-text-secondary font-trt">Satın aldığınız tüm biletler</p>
        </div>
        <Link
          href="/events"
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 dark:bg-dark-primary text-white rounded-lg hover:bg-blue-700 dark:hover:bg-dark-primary-hover transition-colors text-sm sm:text-base text-center"
        >
          Yeni Bilet Al
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-2">Henüz biletiniz yok</h3>
          <p className="text-gray-600 dark:text-dark-text-secondary mb-6">Etkinlikler sayfasından bilet satın alabilirsiniz</p>
          <Link
            href="/events"
            className="inline-block px-6 py-3 bg-blue-600 dark:bg-dark-primary text-white rounded-lg hover:bg-blue-700 dark:hover:bg-dark-primary-hover transition-colors"
          >
            Etkinlikleri Gör
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-gray-50 dark:bg-dark-bg rounded-xl p-6 border border-gray-200 dark:border-dark-border transition-colors duration-300 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-dark-text mb-1 truncate">{ticket.event?.name || 'Etkinlik Adı Yok'}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary">{formatDate(ticket.event?.date || ticket.createdAt)}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary truncate">{ticket.event?.venue || 'Mekan Bilgisi Yok'}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                  ticket.status === 'approved' ? 'bg-green-100 text-green-800' : ticket.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-900'
                }`}>
                  {ticket.status === 'approved' ? 'Onaylandı' : ticket.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-xs sm:text-sm text-gray-700 dark:text-dark-text-secondary"><span className="font-medium">Ad Soyad:</span> <span className="truncate block">{ticket.name}</span></p>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-dark-text-secondary"><span className="font-medium">E-posta:</span> <span className="truncate block">{ticket.email}</span></p>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-dark-text-secondary"><span className="font-medium">Telefon:</span> {ticket.phone}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                {ticket.status === 'approved' && (
                  <button
                    onClick={() => handleShowQR(ticket)}
                    className="w-full sm:flex-1 px-3 py-2 bg-blue-600 dark:bg-dark-primary text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 dark:hover:bg-dark-primary-hover transition-colors min-h-[44px]"
                  >
                    QR Görüntüle
                  </button>
                )}
                {/* İndir butonu sadece approved ve kullanılmamış biletler için gösterilsin */}
                {ticket.status === 'approved' && !ticket.used && (
                  <button
                    className="w-full sm:w-auto px-3 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors min-h-[44px]"
                  >
                    İndir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Kod Modal */}
      {showQRModal && selectedTicket && selectedTicket.status === 'approved' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card p-6 rounded-xl max-w-md w-full mx-4 transition-colors duration-300">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-dark-text">QR Kod - {selectedTicket.eventName}</h3>
            
            <div className="mb-4 p-3 bg-gray-50 dark:bg-dark-bg rounded-lg transition-colors duration-300">
              <p className="text-sm text-gray-700 dark:text-dark-text-secondary"><strong>Etkinlik:</strong> {selectedTicket.event?.name || 'Etkinlik Adı Yok'}</p>
              <p className="text-sm text-gray-700 dark:text-dark-text-secondary"><strong>Tarih:</strong> {formatDate(selectedTicket.event?.date || selectedTicket.createdAt)}</p>
              <p className="text-sm text-gray-700 dark:text-dark-text-secondary"><strong>Mekan:</strong> {selectedTicket.event?.venue || 'Mekan Bilgisi Yok'}</p>
              <p className="text-sm text-gray-700 dark:text-dark-text-secondary"><strong>Ad Soyad:</strong> {selectedTicket.name}</p>
            </div>
            
            <div className="flex justify-center mb-4">
              <img src={selectedTicket.qrCode || selectedTicket.qrDataUrl} alt="QR Code" className="w-48 h-48" />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 bg-gray-300 dark:bg-dark-border text-gray-700 dark:text-dark-text py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-dark-bg transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  // QR kodunu indirme işlemi
                  const link = document.createElement('a');
                  link.href = selectedTicket.qrCode;
                  link.download = `bilet-${selectedTicket.eventName}.png`;
                  link.click();
                }}
                className="flex-1 bg-blue-600 dark:bg-dark-primary text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-dark-primary-hover transition-colors"
              >
                İndir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 