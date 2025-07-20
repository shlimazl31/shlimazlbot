import { useEffect, useState, useRef } from 'react';

const API_BASE = '';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [forms, setForms] = useState([{ name: '', email: '', phone: '05' }]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState('entrance');
  const [showIbanModal, setShowIbanModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  // Kredi kartı formu için state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardMonth, setCardMonth] = useState('');
  const [cardYear, setCardYear] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const iyzicoFormRef = useRef(null);
  const [iyzicoToken, setIyzicoToken] = useState(null);
  const [iyzicoHtml, setIyzicoHtml] = useState(null);
  const [modalMessage, setModalMessage] = useState('');
  const [modalMessageType, setModalMessageType] = useState('');
  const [globalMessage, setGlobalMessage] = useState('');
  const [globalMessageType, setGlobalMessageType] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/events`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEvents(data);
        } else {
          setEvents([]);
          setMessage('Etkinlikler yüklenemedi.');
          setMessageType('error');
        }
      })
      .catch(() => {
        setEvents([]);
        setMessage('Etkinlikler yüklenemedi.');
        setMessageType('error');
      });
  }, []);

  useEffect(() => {
    if (iyzicoHtml) {
      const matches = iyzicoHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/);
      if (matches && matches[1]) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.text = matches[1];
        document.body.appendChild(script);
        return () => {
          document.body.removeChild(script);
        };
      }
    }
  }, [iyzicoHtml]);

  const handleBuy = async (e) => {
    e.preventDefault();
    setModalMessage('');
    setModalMessageType('');
    if (!validateForm()) return;
    if (paymentType === 'iban') {
      setShowIbanModal(true);
      return;
    }
    if (paymentType === 'iyzico') {
      // iyzico için checkout sayfasına yönlendir
      const checkoutData = {
        price: ticketCount * selectedEvent.price,
        buyer: {
          id: 'BY789',
          name: forms[0].name.split(' ')[0],
          surname: forms[0].name.split(' ').slice(1).join(' ') || '-',
          gsmNumber: forms[0].phone.replace(/\D/g, ''),
          email: forms[0].email,
          identityNumber: '11111111111',
          registrationAddress: 'Adres',
          ip: '85.34.78.112',
          city: 'İstanbul',
          country: 'Turkey',
          shippingAddress: {
            contactName: forms[0].name,
            city: 'İstanbul',
            country: 'Turkey',
            address: 'Adres'
          },
          billingAddress: {
            contactName: forms[0].name,
            city: 'İstanbul',
            country: 'Turkey',
            address: 'Adres'
          }
        },
        basketItems: [
          {
            id: selectedEvent.id,
            name: selectedEvent.name,
            category1: 'Etkinlik',
            itemType: 'PHYSICAL',
            price: selectedEvent.price
          }
        ]
      };
      localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
      window.location.href = '/checkout';
      return;
    }
    setLoading(true);
    setModalMessage('');
    setModalMessageType('');
    await submitTicket();
  };

  const submitTicket = async () => {
    setLoading(true);
    setModalMessage('');
    setModalMessageType('');
    let body = {
      eventId: selectedEvent?.id,
      tickets: forms.map(f => ({ ...f, phone: f.phone.replace(/\D/g, ''), paymentType })),
      paymentType
    };
    if (paymentType === 'iyzico') {
      body.paymentData = {
        card: {
          cardHolderName: cardName,
          cardNumber: cardNumber,
          expireMonth: cardMonth,
          expireYear: cardYear,
          cvc: cardCvc,
          registerCard: '0'
        },
        buyer: {
          id: 'BY789',
          name: forms[0].name.split(' ')[0],
          surname: forms[0].name.split(' ').slice(1).join(' ') || '-',
          gsmNumber: forms[0].phone.replace(/\D/g, ''),
          email: forms[0].email,
          identityNumber: '11111111111',
          registrationAddress: 'Adres',
          ip: '85.34.78.112',
          city: 'İstanbul',
          country: 'Turkey'
        },
        shippingAddress: {
          contactName: forms[0].name,
          city: 'İstanbul',
          country: 'Turkey',
          address: 'Adres'
        },
        billingAddress: {
          contactName: forms[0].name,
          city: 'İstanbul',
          country: 'Turkey',
          address: 'Adres'
        },
        basketItems: [
          {
            id: selectedEvent.id,
            name: selectedEvent.name,
            category1: 'Etkinlik',
            itemType: 'PHYSICAL',
            price: selectedEvent.price
          }
        ]
      };
    }
    const res = await fetch(`${API_BASE}/api/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      let msg = '';
      if (paymentType === 'iban') {
        msg = 'Bilet(ler) isteğiniz alındı! IBAN ile ödeme yaptıktan sonra admin onayından sonra QR kodunuz e-posta ile gönderilecektir.';
      } else {
        msg = 'Bilet(ler) isteğiniz alındı! Seçtiğiniz ödeme tipine göre e-posta gönderildi.';
      }
      setGlobalMessage(msg);
      setGlobalMessageType('success');
      setForms([{ name: '', email: '', phone: '' }]);
      setTicketCount(1);
      setSelectedEvent(null);
      setShowBuyModal(false);
    } else {
      setModalMessage(data.error || data.details || 'Bir hata oluştu!');
      setModalMessageType('error');
    }
    setLoading(false);
    setShowIbanModal(false);
  };

  const handleTicketCountChange = (e) => {
    const count = Math.max(1, parseInt(e.target.value) || 1);
    setTicketCount(count);
    setForms((prev) => {
      const arr = [...prev];
      while (arr.length < count) arr.push({ name: '', email: '', phone: '05' });
      while (arr.length > count) arr.pop();
      return arr;
    });
  };

  function formatPhone(value) {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 7) return numbers.slice(0, 4) + ' ' + numbers.slice(4);
    if (numbers.length <= 9) return numbers.slice(0, 4) + ' ' + numbers.slice(4, 7) + ' ' + numbers.slice(7);
    return numbers.slice(0, 4) + ' ' + numbers.slice(4, 7) + ' ' + numbers.slice(7, 9) + ' ' + numbers.slice(9, 11);
  }

  const handleFormChange = (idx, field, value) => {
    setForms((prev) => {
      const arr = [...prev];
      if (field === 'phone') {
        // Kullanıcı '05'i silse bile başta '05' kalacak
        let val = value.replace(/\D/g, '');
        if (!val.startsWith('05')) {
          val = '05' + val.replace(/^0*/, '');
        }
        arr[idx][field] = formatPhone(val);
      } else {
        arr[idx][field] = value;
      }
      return arr;
    });
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    for (const form of forms) {
      if (!form.name.trim()) {
        setMessage('Ad Soyad alanı boş olamaz');
        setMessageType('error');
        return false;
      }
      if (!validateEmail(form.email)) {
        setMessage('Geçerli bir e-posta adresi giriniz');
        setMessageType('error');
        return false;
      }
      const cleanedPhone = form.phone.replace(/\D/g, '');
      if (!/^05\d{9}$/.test(cleanedPhone)) {
        // setMessage('Geçerli bir telefon numarası giriniz (05XXXXXXXXX)');
        // setMessageType('error');
        return false;
      }
    }
    return true;
  };

  // Modal kapama fonksiyonu
  const closeBuyModal = () => {
    setShowBuyModal(false);
    setSelectedEvent(null);
    setForms([{ name: '', email: '', phone: '' }]);
    setTicketCount(1);
    setPaymentType('entrance');
    setLoading(false);
  };

  // Kredi kartı ile ödeme seçilirse iyzico widget'ı başlat:
  const handleIyzicoCheckout = async () => {
    setLoading(true);
    setModalMessage('');
    setModalMessageType('');
    // Sepet ve kullanıcı bilgilerini hazırla
    const price = ticketCount * selectedEvent.price;
    const buyer = {
      id: 'BY789',
      name: forms[0].name.split(' ')[0],
      surname: forms[0].name.split(' ').slice(1).join(' ') || '-',
      gsmNumber: forms[0].phone.replace(/\D/g, ''),
      email: forms[0].email,
      identityNumber: '11111111111',
      registrationAddress: 'Adres',
      ip: '85.34.78.112',
      city: 'İstanbul',
      country: 'Turkey',
      shippingAddress: {
        contactName: forms[0].name,
        city: 'İstanbul',
        country: 'Turkey',
        address: 'Adres'
      },
      billingAddress: {
        contactName: forms[0].name,
        city: 'İstanbul',
        country: 'Turkey',
        address: 'Adres'
      }
    };
    const basketItems = [
      {
        id: selectedEvent.id,
        name: selectedEvent.name,
        category1: 'Etkinlik',
        itemType: 'PHYSICAL',
        price: selectedEvent.price
      }
    ];
    const res = await fetch('/api/payment/iyzico-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price, buyer, basketItems })
    });
    const data = await res.json();
    if (data.token && data.checkoutFormContent) {
      setIyzicoToken(data.token);
      setIyzicoHtml(data.checkoutFormContent);
      setTimeout(() => {
        if (iyzicoFormRef.current) {
          iyzicoFormRef.current.innerHTML = data.checkoutFormContent;
        }
      }, 100);
    } else {
      setModalMessage(data.error || 'iyzico ödeme başlatılamadı');
      setModalMessageType('error');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl transition-colors duration-300 pt-28">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-dark-text mb-8 text-center font-trt">Etkinlikler</h2>
      {globalMessage && (
        <div className={`mb-6 px-4 py-3 rounded text-center font-semibold shadow transition-all duration-300 ${globalMessageType === 'success' ? 'bg-green-100 text-green-800 border border-green-300 animate-bounce' : 'bg-red-100 text-red-800 border border-red-300 animate-shake'}`}>{globalMessage}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map(ev => {
          const etkinlikGecmis = new Date(ev.date) < new Date();
          return (
            <div key={ev.id} className="bg-white dark:bg-dark-bg rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border flex flex-col h-full transition-transform hover:scale-105 hover:shadow-2xl duration-300">
              {ev.imageUrl ? (
                <img src={ev.imageUrl} alt={ev.name} className="rounded-t-2xl w-full h-48 object-cover" />
              ) : (
                <div className="rounded-t-2xl w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-6xl text-white">🎪</div>
              )}
              <div className="flex-1 flex flex-col p-5">
                <h3 className="font-bold text-lg sm:text-xl mb-2 text-gray-900 dark:text-dark-text truncate" title={ev.name}>{ev.name}</h3>
                <div className="text-gray-500 dark:text-dark-text-secondary text-xs sm:text-sm font-trt mb-2">
                  <p>📅 {new Date(ev.date).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                  {(ev.latitude && ev.longitude && (ev.venue || ev.address)) ? (
                    <a
                      href={`https://www.google.com/maps?q=${ev.latitude},${ev.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center gap-1 mt-1"
                      title="Haritada aç"
                    >
                      <span>📍</span>
                      <span>{ev.venue || ev.address}</span>
                    </a>
                  ) : ev.venue ? (
                    <span>�� {ev.venue}</span>
                  ) : null}
                </div>
                {ev.description && (
                  <p className="text-gray-600 italic text-xs sm:text-sm mb-2 line-clamp-3">💬 {ev.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-blue-700 dark:text-blue-300 text-lg sm:text-xl">{ev.price}₺</span>
                  {etkinlikGecmis ? (
                    <span className="px-3 py-1 bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg font-trt text-xs sm:text-sm">⏰ Etkinlik Zamanı Geçti</span>
                  ) : ev.salesActive ? (
                    (ev.soldCount !== undefined && ev.soldCount >= ev.capacity) ? (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-lg font-trt text-xs sm:text-sm">⚠️ Bilet Tükendi</span>
                    ) : (
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition font-trt text-sm font-semibold shadow"
                        onClick={() => {
                          setSelectedEvent(ev);
                          setShowBuyModal(true);
                        }}
                      >
                        Bilet Al
                      </button>
                    )
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg font-trt text-xs sm:text-sm">🚫 Bilet Satışı Kapalı</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bilet Al Modalı */}
      {showBuyModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-[#23272f] rounded-2xl shadow-2xl p-6 w-full max-w-lg relative animate-fadeIn max-h-[90vh] flex flex-col">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
              onClick={closeBuyModal}
              aria-label="Kapat"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-4 text-center text-gray-900 dark:text-white">Bilet Al - {selectedEvent.name}</h3>
            {modalMessage && (
              <div className={`mb-4 px-4 py-3 rounded text-center font-semibold shadow transition-all duration-300 ${modalMessageType === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>{modalMessage}</div>
            )}
            <form onSubmit={handleBuy} className="space-y-4 flex-1 flex flex-col overflow-y-auto max-h-[65vh] pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Kaç bilet almak istiyorsunuz?</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={ticketCount}
                  onChange={handleTicketCountChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#23272f] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <span className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-200">Ödeme Tipi:</span>
                <label className="inline-flex items-center cursor-pointer text-gray-700 dark:text-gray-200">
                  <input type="radio" name="paymentType" value="entrance" checked={paymentType === 'entrance'} onChange={() => setPaymentType('entrance')} className="form-radio text-blue-600" />
                  <span className="ml-2">Girişte Nakit</span>
                </label>
                <label className="inline-flex items-center cursor-pointer text-gray-700 dark:text-gray-200">
                  <input type="radio" name="paymentType" value="iban" checked={paymentType === 'iban'} onChange={() => setPaymentType('iban')} className="form-radio text-blue-600" />
                  <span className="ml-2">IBAN'a Havale/EFT</span>
                </label>
                <label className="inline-flex items-center cursor-pointer text-gray-700 dark:text-gray-200">
                  <input
                    type="radio"
                    name="paymentType"
                    value="iyzico"
                    checked={paymentType === 'iyzico'}
                    onChange={() => setPaymentType('iyzico')}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2">Kredi Kartı (iyzico)</span>
                </label>
              </div>
              {forms.map((form, idx) => (
                <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded mb-2 bg-gray-50 dark:bg-[#1a1d23] transition-colors duration-300">
                  <div className="font-semibold mb-2 text-sm text-gray-900 dark:text-gray-200">Bilet {idx + 1}</div>
                  <input
                    className="block mb-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded w-full focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm bg-white dark:bg-[#23272f] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                    placeholder="Ad Soyad (zorunlu)"
                    value={form.name}
                    onChange={e => handleFormChange(idx, 'name', e.target.value)}
                    required
                  />
                  <input
                    className={`block mb-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded w-full focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm bg-white dark:bg-[#23272f] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${form.email && !validateEmail(form.email) ? 'border-red-500' : ''}`}
                    placeholder="Giriş bileti için e-posta adresi (örn: ornek@gmail.com)"
                    value={form.email}
                    onChange={e => handleFormChange(idx, 'email', e.target.value)}
                    required
                  />
                  {form.email && !validateEmail(form.email) && (
                    <p className="text-red-500 text-xs mb-2">Geçerli bir e-posta adresi giriniz</p>
                  )}
                  <input
                    className={`block px-3 py-2 border border-gray-300 dark:border-gray-600 rounded w-full focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm bg-white dark:bg-[#23272f] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${form.phone && !/^05\d{9}$/.test(form.phone.replace(/\D/g, '')) ? 'border-red-500' : ''}`}
                    placeholder="Telefon (05XX XXX XX XX)"
                    value={form.phone || ''}
                    onChange={e => handleFormChange(idx, 'phone', e.target.value)}
                    maxLength={14}
                    required
                  />
                  {form.phone && !/^05\d{9}$/.test(form.phone.replace(/\D/g, '')) && (
                    <p className="text-red-500 text-xs mt-1">Geçerli bir telefon numarası giriniz (05XXXXXXXXX)</p>
                  )}
                </div>
              ))}
              {paymentType === 'iyzico' && (
                <div className="space-y-2 mt-2">
                  {/* Üstte büyük logo */}
                  <div className="flex justify-center mb-2">
                    <img src="/logo_band_colored.svg" alt="iyzico band logo" className="h-16 w-auto" style={{ maxWidth: 340 }} />
                  </div>
                  <button
                    type="button"
                    onClick={handleIyzicoCheckout}
                    className="w-full py-3 bg-blue-700 text-white rounded-lg font-bold text-lg hover:bg-blue-800 transition flex items-center justify-center mb-2 gap-3"
                  >
                    <img src="/iyzico_wtihebg_blue.svg" alt="iyzico" className="h-8 w-auto" style={{ maxHeight: 28 }} />
                    <span className="inline-block align-middle" style={{ lineHeight: '28px', fontSize: '1.15rem' }}> ile Güvenli Ödeme Yap</span>
                  </button>
                </div>
              )}
              {paymentType !== 'iyzico' && (
                <button className="w-full px-4 py-2 bg-blue-700 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-700 transition text-base font-semibold shadow mt-2" type="submit" disabled={loading}>{loading ? 'Bilet Alınıyor...' : 'Bilet Al'}</button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* IBAN Modalı */}
      {showIbanModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl p-6 w-full max-w-md text-gray-900 dark:text-dark-text">
            <h3 className="text-xl font-bold mb-4 text-center">IBAN ile Havale/EFT</h3>
            <div className="mb-4 text-sm">
              <div className="mb-2"><b>IBAN:</b> TR12 3456 7890 1234 5678 9012 34</div>
              <div className="mb-2"><b>Hesap Sahibi:</b> Demo Organizasyon</div>
              <div className="mb-2"><b>Açıklama:</b> {forms[0].name} + {selectedEvent?.name || ''}</div>
              <div className="mt-4 text-xs text-gray-600 dark:text-dark-text-secondary">Lütfen ödemenizi yaptıktan sonra aşağıdaki butona tıklayın. Bilet(ler)inizin QR kodu e-posta ile gönderilecektir.</div>
            </div>
            <div className="flex gap-4 justify-center mt-6">
              <button onClick={() => setShowIbanModal(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition">İptal</button>
              <button onClick={submitTicket} className="px-4 py-2 bg-blue-700 dark:bg-dark-primary text-white rounded hover:bg-blue-800 dark:hover:bg-dark-primary-hover transition">Havale/EFT Yaptım, Bileti Al</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 