import { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../contexts/UserContext';
import Link from 'next/link';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useUser();

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

  const handleInputChange = (field, value) => {
    if (field === 'phone') {
      setFormData({ ...formData, [field]: formatPhone(value) });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validasyon
    if (!formData.name.trim()) {
      setError('Ad Soyad alanı boş olamaz');
      setLoading(false);
      return;
    }
    if (!validateEmail(formData.email)) {
      setError('Geçerli bir e-posta adresi giriniz');
      setLoading(false);
      return;
    }
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) {
      setError('Geçerli bir telefon numarası giriniz');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }

    try {
      // Backend'de kayıt API'si olmadığı için şimdilik localStorage'a kaydediyoruz
      // Gerçek uygulamada bu kısım backend API'si ile değiştirilmeli
      
      // Mevcut kullanıcıları kontrol et
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const userExists = existingUsers.find(user => user.email === formData.email);
      
      if (userExists) {
        setError('Bu e-posta adresi zaten kayıtlı!');
        setLoading(false);
        return;
      }

      // Yeni kullanıcı oluştur
      const newUser = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password, // Gerçek uygulamada şifre hash'lenmeli
        isAdmin: false,
        createdAt: new Date().toISOString()
      };

      // Kullanıcıyı kaydet
      existingUsers.push(newUser);
      localStorage.setItem('users', JSON.stringify(existingUsers));

      // Otomatik giriş yap
      login({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: false
      });

      router.push('/my-tickets');
    } catch (error) {
      setError('Kayıt olurken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-2xl mt-4">
      <h2 className="text-2xl font-bold mb-6 text-center font-trt">Kayıt Ol</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ad Soyad"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ornek@email.com"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="05XX XXX XX XX"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="En az 6 karakter"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Şifre Tekrar</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Şifrenizi tekrar girin"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Zaten hesabınız var mı?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            Giriş Yap
          </Link>
        </p>
      </div>
      
      <div className="mt-4 text-center">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
} 