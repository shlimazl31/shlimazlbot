import Link from 'next/link';
import { useState, useEffect } from 'react';

const ADVANTAGES = [
  { icon: '💳', title: 'Güvenli Ödeme', desc: 'Tüm ödemeleriniz 256-bit SSL ile korunur.' },
  { icon: '⚡', title: 'Hızlı Giriş', desc: 'QR kodunuzu gösterin, anında içeri girin.' },
  { icon: '🎉', title: 'Zengin Etkinlikler', desc: 'Her zevke uygun onlarca etkinlik.' },
  { icon: '📱', title: 'Mobil Uyumlu', desc: 'Tüm cihazlarda kolay kullanım.' },
];

const TESTIMONIALS = [
  { name: 'Ayşe K.', text: 'Çok kolay bilet aldım, QR ile giriş harikaydı!', stars: 5 },
  { name: 'Mehmet T.', text: 'Etkinlikler çok çeşitli ve sistem güvenli.', stars: 4 },
  { name: 'Zeynep B.', text: 'Müşteri hizmetleri çok ilgili, tavsiye ederim.', stars: 5 },
];

const FAQS = [
  { q: 'Biletimi nasıl alırım?', a: 'Etkinlikler sayfasından istediğiniz etkinliği seçip, kolayca bilet alabilirsiniz.' },
  { q: 'QR kodumu kaybettim, ne yapmalıyım?', a: 'Biletlerim sayfasından tekrar QR kodunuzu görüntüleyebilirsiniz.' },
  { q: 'İade veya değişiklik mümkün mü?', a: 'Etkinlikten 24 saat öncesine kadar iade veya değişiklik yapabilirsiniz.' },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events/slider');
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (error) {
        console.error('Etkinlikler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % events.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [events.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % events.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + events.length) % events.length);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-[#181c24] dark:to-[#23272f] pt-28">
      {/* HERO */}
      <section className="w-full py-12 sm:py-20 flex flex-col items-center text-center bg-gradient-to-br from-blue-600 to-purple-700 text-white relative">
        <div className="z-10 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">Şehrin En İyi Etkinlikleri Burada!</h1>
          <p className="text-lg sm:text-2xl mb-8 font-medium max-w-2xl mx-auto drop-shadow">Biletini hemen al, eğlenceyi kaçırma. Güvenli, hızlı ve kolay biletleme deneyimi.</p>
          <Link href="/events" className="inline-block px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold rounded-xl shadow-lg text-lg transition">Etkinlikleri Gör</Link>
        </div>
        <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{backgroundImage:'url(/hero-bg.jpg)'}}></div>
      </section>

      {/* SLIDER */}
      <section className="w-full max-w-4xl mx-auto mt-[-60px] z-20 relative">
        <div className="relative bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-xl overflow-hidden transition-colors duration-300">
          <div className="relative h-64 sm:h-80 md:h-96">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-600 dark:text-dark-text-secondary">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-dark-primary mx-auto mb-4"></div>
                  <p className="text-lg font-trt">Etkinlikler yükleniyor...</p>
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-600 dark:text-dark-text-secondary">
                  <div className="text-6xl mb-4">🎪</div>
                  <h3 className="text-xl font-bold mb-2 font-trt">Henüz Etkinlik Yok</h3>
                  <p className="text-gray-500 dark:text-dark-text-secondary font-trt">Yakında harika etkinlikler eklenecek!</p>
                </div>
              </div>
            ) : (
              events.map((event, index) => (
                <div
                  key={event.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                >
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="text-white text-6xl">🎪</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white p-4 sm:p-6 md:p-8">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 font-trt leading-tight drop-shadow">{event.name}</h2>
                      <p className="text-base sm:text-lg md:text-xl mb-2 font-trt drop-shadow">📅 {new Date(event.date).toLocaleDateString('tr-TR', {year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
                      {event.venue && <p className="text-base sm:text-lg mb-2 font-trt drop-shadow">📍 {event.venue}</p>}
                      {event.description && <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 font-trt max-w-xs sm:max-w-md mx-auto leading-relaxed drop-shadow">{event.description}</p>}
                      <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <span className="text-xl sm:text-2xl font-bold text-yellow-400 font-trt drop-shadow">{event.price}₺</span>
                        <Link href="/events" className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-trt text-sm sm:text-base shadow">Bilet Al</Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {events.length > 1 && (
            <>
              <button onClick={prevSlide} className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 sm:p-3 rounded-full shadow-lg transition-all">
                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={nextSlide} className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 sm:p-3 rounded-full shadow-lg transition-all">
                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
                {events.map((_, index) => (
                  <button key={index} onClick={() => setCurrentSlide(index)} className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Parti Bilet Nedir */}
      <section className="w-full max-w-3xl mx-auto py-12">
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-800 dark:text-white">Parti Bilet Nedir?</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
          Parti Bilet, şehirdeki en güncel ve popüler etkinlikleri kolayca keşfetmenizi ve güvenle bilet almanızı sağlayan modern bir platformdur. QR kodlu biletler, hızlı giriş ve kullanıcı dostu arayüz ile eğlenceye anında katılın!
        </p>
      </section>

      {/* Organizatör Banner */}
      <section className="w-full max-w-3xl mx-auto py-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 flex flex-col sm:flex-row items-center justify-between text-white">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-xl font-bold mb-1">Etkinlik mi düzenlemek istiyorsunuz?</h3>
            <p className="text-sm">Parti Bilet ile etkinliğinizi binlerce kişiye ulaştırın!</p>
          </div>
          <a href="#" className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold rounded-lg shadow transition text-base">Organizatör Başvurusu</a>
        </div>
      </section>

      {/* Duyurular / Blog */}
      <section className="w-full max-w-4xl mx-auto py-12">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-white">Duyurular & Blog</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow p-6 border border-gray-100 dark:border-dark-border flex flex-col">
            <h3 className="font-bold text-lg mb-2 text-blue-700 dark:text-blue-300">QR ile Giriş Nasıl Çalışır?</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Etkinlik girişinde QR kodunuzu okutun, saniyeler içinde içeri girin. Kağıt bilet taşıma derdi yok!</p>
            <span className="text-xs text-gray-400 mt-auto">18 Temmuz 2025</span>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl shadow p-6 border border-gray-100 dark:border-dark-border flex flex-col">
            <h3 className="font-bold text-lg mb-2 text-blue-700 dark:text-blue-300">Bu Hafta Soma'da Neler Var?</h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm mb-4">Haftanın öne çıkan etkinliklerini ve fırsatlarını kaçırmayın. Her hafta güncel içerik burada!</p>
            <span className="text-xs text-gray-400 mt-auto">17 Temmuz 2025</span>
          </div>
        </div>
      </section>

      {/* SSS */}
      <section className="w-full max-w-3xl mx-auto py-12">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-white">Sıkça Sorulan Sorular</h2>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white dark:bg-dark-card rounded-xl shadow p-4 border border-gray-100 dark:border-dark-border">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left flex items-center justify-between font-semibold text-blue-700 dark:text-blue-300 text-lg focus:outline-none">
                <span>{faq.q}</span>
                <span>{openFaq === i ? '-' : '+'}</span>
              </button>
              {openFaq === i && <p className="mt-2 text-gray-700 dark:text-gray-200 text-sm">{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-8 bg-gradient-to-br from-blue-700 to-purple-700 text-white mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between px-4 gap-4">
          <div className="text-lg font-bold">🎫 Parti Bilet</div>
          <div className="flex gap-4 text-xl">
            <a href="#" className="hover:text-yellow-300" title="Instagram"><span>📸</span></a>
            <a href="#" className="hover:text-yellow-300" title="Twitter"><span>🐦</span></a>
            <a href="#" className="hover:text-yellow-300" title="Facebook"><span>📘</span></a>
          </div>
          <div className="text-sm text-white/80">© {new Date().getFullYear()} Parti Bilet. Tüm hakları saklıdır.</div>
        </div>
      </footer>
    </div>
  );
} 