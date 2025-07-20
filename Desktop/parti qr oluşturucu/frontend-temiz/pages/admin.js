import { useState, useEffect } from 'react';
const API_BASE = '';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  // Bilet oluşturma formu
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    eventId: '',
    name: '',
    email: '',
    phone: ''
  });
  
  // QR kod görüntüleme
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newTicketQR, setNewTicketQR] = useState(null);

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan giriş durumunu kontrol et
    const savedLogin = localStorage.getItem('adminLoggedIn');
    const savedUsername = localStorage.getItem('adminUsername');
    
    if (savedLogin === 'true' && savedUsername) {
      setIsLoggedIn(true);
      setUsername(savedUsername);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
      fetchTickets();
      fetchEvents();
      // Her 30 saniyede bir verileri güncelle
      const interval = setInterval(() => {
        fetchStats();
        fetchTickets();
      }, 30000);
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isLoggedIn]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.error) {
        console.error('Backend hatası:', data.error);
        return;
      }
      setStats(data);
    } catch (error) {
      console.error('İstatistikler alınamadı:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/tickets`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setTickets(data);
    } catch (error) {
      console.error('Biletler alınamadı:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/events`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error('Etkinlikler alınamadı:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsLoggedIn(true);
        
        // Beni hatırla seçeneği işaretliyse localStorage'a kaydet
        if (rememberMe) {
          localStorage.setItem('adminLoggedIn', 'true');
          localStorage.setItem('adminUsername', username);
        }
        
        setPassword('');
      } else {
        setLoginError(data.error || 'Giriş başarısız');
      }
    } catch (error) {
      setLoginError('Bağlantı hatası');
    }

    setLoading(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setStats(null);
    setTickets([]);
    setEvents([]);
    setUsername('');
    setPassword('');
    setRememberMe(false);
    
    // localStorage'dan giriş bilgilerini temizle
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUsername');
    
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!confirm('Bu bileti silmek istediğinizden emin misiniz?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/admin/tickets/${ticketId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      if (data.success) {
        fetchTickets(); // Biletleri yenile
        alert('Bilet başarıyla silindi');
      }
    } catch (error) {
      console.error('Bilet silinirken hata:', error);
      alert('Bilet silinirken hata oluştu');
    }
  };

  // Mail validasyonu
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Telefon formatı
  const formatPhone = (value) => {
    let formattedPhone = value;
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length > 0) {
      if (!numbers.startsWith('05')) {
        formattedPhone = '05' + numbers.substring(0, 9);
      } else {
        formattedPhone = numbers.substring(0, 11);
      }
      
      if (formattedPhone.length >= 4) {
        formattedPhone = formattedPhone.substring(0, 4) + ' ' + formattedPhone.substring(4);
      }
      if (formattedPhone.length >= 8) {
        formattedPhone = formattedPhone.substring(0, 8) + ' ' + formattedPhone.substring(8);
      }
      if (formattedPhone.length >= 11) {
        formattedPhone = formattedPhone.substring(0, 11) + ' ' + formattedPhone.substring(11);
      }
    }
    
    return formattedPhone;
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    
    // Validasyon
    if (!createForm.name.trim()) {
      alert('Ad Soyad alanı boş olamaz');
      return;
    }
    
    if (!validateEmail(createForm.email)) {
      alert('Geçerli bir e-posta adresi giriniz');
      return;
    }
    
    if (!createForm.phone.trim() || createForm.phone.replace(/\D/g, '').length < 10) {
      alert('Geçerli bir telefon numarası giriniz');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/admin/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      if (data.success) {
        setNewTicketQR(data.qrCode);
        setCreateForm({ eventId: '', name: '', email: '', phone: '' });
        setShowCreateForm(false);
        fetchTickets(); // Biletleri yenile
        alert('Bilet başarıyla oluşturuldu ve e-posta gönderildi!');
      }
    } catch (error) {
      console.error('Bilet oluşturulurken hata:', error);
      alert('Bilet oluşturulurken hata oluştu');
    }
  };

  const handleShowQR = async (ticket) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/tickets/${ticket.id}/qr`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      if (data.success) {
        setSelectedTicket({ ...ticket, qrCode: data.qrCode });
        setShowQRModal(true);
      }
    } catch (error) {
      console.error('QR kod alınırken hata:', error);
      alert('QR kod alınırken hata oluştu');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-2xl mt-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Girişi</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex items-center mb-4">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Beni hatırla
            </label>
          </div>
          {loginError && (
            <div className="px-4 py-2 rounded text-center bg-red-100 text-red-800 border border-red-300">
              {loginError}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-2xl shadow-2xl mt-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Admin Paneli</h2>
          <p className="text-sm text-gray-600">Hoş geldiniz, {username}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Çıkış Yap
        </button>
      </div>

      {/* Tab Menüsü */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'stats' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          İstatistikler
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'tickets' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Bilet Yönetimi
        </button>
      </div>

      {/* İstatistikler Tab */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Genel İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800">Toplam Bilet</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalTickets}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800">Kullanılan Bilet</h3>
              <p className="text-3xl font-bold text-green-600">{stats.usedTickets}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-800">Kullanılmayan Bilet</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.unusedTickets}</p>
            </div>
          </div>

          {/* Etkinlik Bazlı İstatistikler */}
          <div>
            <h3 className="text-xl font-bold mb-4">Etkinlik Bazlı İstatistikler</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Etkinlik</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Tarih</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Mekan</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Toplam Bilet</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Kullanılan</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Kullanılmayan</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Kullanım Oranı</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.eventStats && stats.eventStats.length > 0 ? (
                    stats.eventStats.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 font-medium">{event.name}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {new Date(event.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{event.venue}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center font-bold">{event.totalTickets}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center text-green-600 font-bold">{event.usedTickets}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center text-yellow-600 font-bold">{event.unusedTickets}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {event.totalTickets > 0 
                            ? `${Math.round((event.usedTickets / event.totalTickets) * 100)}%`
                            : '0%'
                          }
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                        Henüz etkinlik bulunmuyor
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bilet Yönetimi Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* Bilet Oluşturma Butonu */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Bilet Yönetimi</h3>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Yeni Bilet Oluştur
            </button>
          </div>

          {/* Bilet Listesi */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Ad Soyad</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">E-posta</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Telefon</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Etkinlik</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Durum</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Oluşturulma Tarihi</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{ticket.id}</td>
                      <td className="border border-gray-300 px-4 py-2 font-medium">{ticket.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{ticket.email}</td>
                      <td className="border border-gray-300 px-4 py-2">{ticket.phone}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {ticket.event?.name || 'Bilinmeyen Etkinlik'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          ticket.used 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {ticket.used ? 'Kullanıldı' : 'Kullanılmadı'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleShowQR(ticket)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                          >
                            QR Görüntüle
                          </button>
                          <button
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                      Henüz bilet bulunmuyor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bilet Oluşturma Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Yeni Bilet Oluştur</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etkinlik
                </label>
                <select
                  value={createForm.eventId}
                  onChange={(e) => setCreateForm({...createForm, eventId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Etkinlik seçin</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} - {new Date(event.date).toLocaleDateString('tr-TR')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({...createForm, phone: formatPhone(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="05XX XXX XX XX"
                  required
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Bilet Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yeni Oluşturulan Bilet QR Kodu Modal */}
      {newTicketQR && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-center">Yeni Bilet QR Kodu</h3>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <img 
                  src={newTicketQR} 
                  alt="QR Kod" 
                  className="w-48 h-48 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <p className="text-sm text-gray-600">
                QR kod e-posta ile gönderildi ve yukarıda görüntüleniyor.
              </p>
              <button
                onClick={() => setNewTicketQR(null)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mevcut Bilet QR Kodu Modal */}
      {showQRModal && selectedTicket && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-center">Bilet QR Kodu</h3>
            <div className="text-center space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="font-medium">{selectedTicket.name}</p>
                <p className="text-sm text-gray-600">{selectedTicket.email}</p>
                <p className="text-sm text-gray-600">{selectedTicket.phone}</p>
                <p className="text-sm text-gray-600">{selectedTicket.event?.name}</p>
              </div>
              <div className="flex justify-center">
                <img 
                  src={selectedTicket.qrCode}
                  alt="QR Kod" 
                  className="w-48 h-48 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setSelectedTicket(null);
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                >
                  Kapat
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedTicket.qrCode;
                    link.download = `bilet-${selectedTicket.id}-qr.png`;
                    link.click();
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  İndir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manuel Yenileme Butonu */}
      <div className="text-center mt-6">
        <button
          onClick={() => {
            fetchStats();
            fetchTickets();
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Verileri Yenile
        </button>
      </div>
    </div>
  );
} 