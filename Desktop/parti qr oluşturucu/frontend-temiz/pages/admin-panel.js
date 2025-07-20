import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../contexts/UserContext';
import Head from 'next/head';

export default function AdminPanel() {
  const router = useRouter();
  const { user } = useUser();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    eventId: '',
    name: '',
    email: '',
    phone: ''
  });
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newTicketQR, setNewTicketQR] = useState(null);
  const [users, setUsers] = useState([]);
  
  // Bilet arama ve filtreleme
  const [ticketSearchTerm, setTicketSearchTerm] = useState('');
  const [ticketFilterStatus, setTicketFilterStatus] = useState('all');
  const [ticketFilterEvent, setTicketFilterEvent] = useState('all');
  const [ticketFilterPaymentType, setTicketFilterPaymentType] = useState('all');
  
  // Çoklu seçim
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Etkinlik ekleme formu
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEditEventForm, setShowEditEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    name: '',
    date: '',
    venue: '',
    capacity: '',
    price: '',
    description: '',
    imageUrl: '',
    videoUrl: '',
    isActive: true,
    salesActive: true,
    latitude: '',
    longitude: '',
    address: ''
  });
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Mail validasyonu
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // YouTube ID çıkarma fonksiyonu
  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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

  useEffect(() => {
    // Admin kullanıcı kontrolü - eğer admin olarak giriş yapmışsa otomatik giriş
    if (user && user.isAdmin) {
      setIsLoggedIn(true);
      setRememberMe(true);
      setUsername('semih');
    } else {
      // Eski admin giriş kontrolü (localStorage)
      const savedLogin = localStorage.getItem('adminLogin');
      if (savedLogin) {
        const loginData = JSON.parse(savedLogin);
        setIsLoggedIn(true);
        setRememberMe(true);
        setUsername(loginData.username);
      }
    }
  }, [user]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
      fetchTickets();
      fetchEvents();
      fetchUsers();
    }
  }, [isLoggedIn]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    }
  };

  const fetchTickets = async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.eventId && filters.eventId !== 'all') params.append('eventId', filters.eventId);
      
      const url = `/api/admin/tickets${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('fetchTickets url:', url, 'filters:', filters);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('fetchTickets data:', data);
        if (Array.isArray(data)) {
          setTickets(data);
        } else if (Array.isArray(data.tickets)) {
          setTickets(data.tickets);
        } else {
          setTickets([]);
        }
      } else {
        console.log('fetchTickets response not ok:', response.status);
      }
    } catch (error) {
      console.error('Biletler yüklenirken hata:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events');
      if (response.ok) {
        const data = await response.json();
        console.log('Yüklenen etkinlikler:', data);
        // Konum verilerini kontrol et
        if (Array.isArray(data)) {
          setEvents(data);
        } else if (Array.isArray(data.events)) {
          data.events.forEach(event => {
            console.log(`Etkinlik ${event.id} konum verileri:`, {
              name: event.name,
              latitude: event.latitude,
              longitude: event.longitude,
              address: event.address
            });
          });
          setEvents(data.events);
        } else {
          setEvents([]);
        }
      }
    } catch (error) {
      console.error('Etkinlikler yüklenirken hata:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          setUsers([]);
        }
      } else {
        setUsers([]);
      }
    } catch (error) {
      setUsers([]);
    }
  };

  // Filtreleme değişikliklerinde API'yi çağır
  useEffect(() => {
    if (isLoggedIn) {
      fetchTickets({
        search: ticketSearchTerm,
        status: ticketFilterStatus,
        eventId: ticketFilterEvent
      });
      // Filtreleme değiştiğinde seçimleri temizle
      setSelectedTickets([]);
      setSelectAll(false);
    }
  }, [ticketSearchTerm, ticketFilterStatus, ticketFilterEvent, isLoggedIn]);

  // Filtrelenmiş biletler (artık backend'den geliyor)
  const filteredTickets = tickets;

  // Seçim durumunu takip et
  useEffect(() => {
    const allSelected = filteredTickets.length > 0 && 
      filteredTickets.every(ticket => selectedTickets.includes(ticket.id));
    setSelectAll(allSelected);
  }, [selectedTickets, filteredTickets]);

  // Benzersiz etkinlik listesi (filtreleme için)
  const uniqueEvents = events.filter((event, index, self) => 
    index === self.findIndex(e => e.id === event.id)
  );

  // Çoklu seçim fonksiyonları
  const handleSelectTicket = (ticketId) => {
    setSelectedTickets(prev => {
      if (prev.includes(ticketId)) {
        return prev.filter(id => id !== ticketId);
      } else {
        return [...prev, ticketId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTickets([]);
      setSelectAll(false);
    } else {
      setSelectedTickets(filteredTickets.map(ticket => ticket.id));
      setSelectAll(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.length === 0) {
      alert('Lütfen silinecek biletleri seçin');
      return;
    }

    if (!confirm(`${selectedTickets.length} bilet silinecek. Emin misiniz?`)) {
      return;
    }

    try {
      const deletePromises = selectedTickets.map(ticketId => 
        fetch(`/api/admin/tickets/${ticketId}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      // Biletleri yenile
      fetchTickets({
        search: ticketSearchTerm,
        status: ticketFilterStatus,
        eventId: ticketFilterEvent
      });
      
      // Seçimleri temizle
      setSelectedTickets([]);
      setSelectAll(false);
      
      alert(`${selectedTickets.length} bilet başarıyla silindi`);
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      alert('Biletler silinirken hata oluştu');
    }
  };

  const handleBulkMarkAsUsed = async () => {
    if (selectedTickets.length === 0) {
      alert('Lütfen işaretlenecek biletleri seçin');
      return;
    }

    if (!confirm(`${selectedTickets.length} bilet kullanıldı olarak işaretlenecek. Emin misiniz?`)) {
      return;
    }

    try {
      // Bu endpoint'i backend'de oluşturmamız gerekecek
      const response = await fetch('/api/admin/tickets/bulk-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketIds: selectedTickets,
          used: true
        })
      });

      if (response.ok) {
        // Biletleri yenile
        fetchTickets({
          search: ticketSearchTerm,
          status: ticketFilterStatus,
          eventId: ticketFilterEvent
        });
        
        // Seçimleri temizle
        setSelectedTickets([]);
        setSelectAll(false);
        
        alert(`${selectedTickets.length} bilet kullanıldı olarak işaretlendi`);
      } else {
        alert('Biletler güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Toplu güncelleme hatası:', error);
      alert('Biletler güncellenirken hata oluştu');
    }
  };

  // Admin paneline sadece kullanıcı adı (e-posta) ve şifre ile giriş yapılabilsin
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsLoggedIn(true);
        if (rememberMe) {
          localStorage.setItem('adminLogin', JSON.stringify({ username, password }));
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
    setRememberMe(false);
    setUsername('');
    setPassword('');
    localStorage.removeItem('adminLogin');
    setStats(null);
    setTickets([]);
    setEvents([]);
    // Ana sayfaya yönlendir
    router.push('/');
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!confirm('Bu bileti silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchTickets();
        fetchStats();
        alert('Bilet başarıyla silindi!');
      } else {
        alert('Bilet silinirken hata oluştu!');
      }
    } catch (error) {
      alert('Bilet silinirken hata oluştu!');
    }
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
      const response = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          paymentType: 'entrance',
          status: 'approved',
          force: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNewTicketQR(data.qrCode);
        setShowQRModal(true);
        setCreateForm({ eventId: '', name: '', email: '', phone: '' });
        setShowCreateForm(false);
        fetchTickets();
        fetchStats();
      } else {
        alert('Bilet oluşturulurken hata oluştu!');
      }
    } catch (error) {
      alert('Bilet oluşturulurken hata oluştu!');
    }
  };

  const handleShowQR = async (ticketId) => {
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}/qr`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data.ticket);
        setNewTicketQR(data.qrCode);
        setShowQRModal(true);
      }
    } catch (error) {
      alert('QR kod yüklenirken hata oluştu!');
    }
  };

  const handleToggleAdmin = async (userId, currentIsAdmin) => {
    try {
      // localStorage'daki kullanıcıları güncelle
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = existingUsers.map(user => {
        if (user.id === userId) {
          return { ...user, isAdmin: !currentIsAdmin };
        }
        return user;
      });
      
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      // Kullanıcı listesini yenile
      fetchUsers();
      
      alert(`Kullanıcı ${!currentIsAdmin ? 'admin' : 'normal kullanıcı'} yapıldı!`);
    } catch (error) {
      alert('Kullanıcı yetkisi güncellenirken hata oluştu!');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    // Validasyon
    if (!eventForm.name.trim()) {
      alert('Etkinlik adı boş olamaz');
      return;
    }
    if (!eventForm.date) {
      alert('Etkinlik tarihi seçilmelidir');
      return;
    }
    if (!eventForm.venue.trim()) {
      alert('Etkinlik yeri boş olamaz');
      return;
    }
    if (!eventForm.capacity || eventForm.capacity < 1) {
      alert('Geçerli bir kapasite giriniz');
      return;
    }
    if (!eventForm.price || eventForm.price < 0) {
      alert('Geçerli bir fiyat giriniz');
      return;
    }

    // Debug: Konum verilerini kontrol et
    console.log('Etkinlik oluşturuluyor:', eventForm);
    console.log('Konum verileri:', {
      latitude: eventForm.latitude,
      longitude: eventForm.longitude,
      address: eventForm.address
    });

    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm)
      });

      if (response.ok) {
        const newEvent = await response.json();
        console.log('Oluşturulan etkinlik:', newEvent);
        setEvents([...events, newEvent]);
        setEventForm({
          name: '',
          date: '',
          venue: '',
          capacity: '',
          price: '',
          description: '',
          imageUrl: '',
          videoUrl: '',
          isActive: true,
          latitude: '',
          longitude: '',
          address: ''
        });
        setShowEventForm(false);
        alert('Etkinlik başarıyla oluşturuldu!');
      } else {
        const errorData = await response.json();
        console.error('Etkinlik oluşturma hatası:', errorData);
        alert('Etkinlik oluşturulurken hata oluştu!');
      }
    } catch (error) {
      console.error('Etkinlik oluşturma hatası:', error);
      alert('Etkinlik oluşturulurken hata oluştu!');
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    
    if (!editingEvent) return;
    
    // Validasyon
    if (!eventForm.name.trim()) {
      alert('Etkinlik adı boş olamaz');
      return;
    }
    if (!eventForm.date) {
      alert('Etkinlik tarihi seçilmelidir');
      return;
    }
    if (!eventForm.venue.trim()) {
      alert('Etkinlik yeri boş olamaz');
      return;
    }
    if (!eventForm.capacity || eventForm.capacity < 1) {
      alert('Geçerli bir kapasite giriniz');
      return;
    }
    if (!eventForm.price || eventForm.price < 0) {
      alert('Geçerli bir fiyat giriniz');
      return;
    }

    console.log('Etkinlik güncelleniyor:', eventForm);

    try {
      const response = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm)
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        console.log('Güncellenen etkinlik:', updatedEvent);
        
        // Etkinlik listesini güncelle
        setEvents(events.map(event => 
          event.id === editingEvent.id ? updatedEvent : event
        ));
        
        setShowEditEventForm(false);
        setEditingEvent(null);
        setEventForm({
          name: '',
          date: '',
          venue: '',
          capacity: '',
          price: '',
          description: '',
          imageUrl: '',
          videoUrl: '',
          isActive: true,
          latitude: '',
          longitude: '',
          address: ''
        });
        alert('Etkinlik başarıyla güncellendi!');
      } else {
        const errorData = await response.json();
        console.error('Etkinlik güncelleme hatası:', errorData);
        alert('Etkinlik güncellenirken hata oluştu!');
      }
    } catch (error) {
      console.error('Etkinlik güncelleme hatası:', error);
      alert('Etkinlik güncellenirken hata oluştu!');
    }
  };

  const openEditEventForm = (event) => {
    setEditingEvent(event);
    setEventForm({
      name: event.name,
      date: new Date(event.date).toISOString().slice(0, 16),
      venue: event.venue,
      capacity: event.capacity.toString(),
      price: event.price.toString(),
      description: event.description || '',
      imageUrl: event.imageUrl || '',
      videoUrl: event.videoUrl || '',
      isActive: event.isActive,
      latitude: event.latitude ? event.latitude.toString() : '',
      longitude: event.longitude ? event.longitude.toString() : '',
      address: event.address || ''
    });
    setShowEditEventForm(true);
  };

  const handleLocationSelect = (location) => {
    // Eğer location parametresi varsa (fallback'ten geliyor)
    if (location && typeof location === 'object') {
      setSelectedLocation(location);
      setEventForm({
        ...eventForm,
        latitude: location.lat,
        longitude: location.lng,
        address: location.address
      });
      setShowMapModal(false);
      return;
    }

    // selectedLocation state'inden konum bilgilerini al
    if (!selectedLocation) {
      alert('Lütfen önce haritadan bir konum seçin');
      return;
    }

    const { lat, lng, address } = selectedLocation;
    const finalAddress = eventForm.venue || address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    setEventForm({
      ...eventForm,
      latitude: lat,
      longitude: lng,
      address: finalAddress
    });
    
    // Haritayı temizle
    if (window.currentLeafletMap) {
      window.currentLeafletMap.remove();
      window.currentLeafletMap = null;
    }
    window.currentLeafletMarker = null;
    setSelectedLocation(null);
    setShowMapModal(false);
  };

  const openMapModal = () => {
    setShowMapModal(true);
    
    // Leaflet (OpenStreetMap) kullanarak harita oluştur
    setTimeout(() => {
      initLeafletMap();
    }, 100);
  };

  const initLeafletMap = () => {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Leaflet CSS ve JS yükle
    if (!document.getElementById('leaflet-css')) {
      const leafletCSS = document.createElement('link');
      leafletCSS.id = 'leaflet-css';
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCSS);
    }

    if (!window.L) {
      const leafletScript = document.createElement('script');
      leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletScript.onload = () => {
        createLeafletMap();
      };
      document.head.appendChild(leafletScript);
    } else {
      createLeafletMap();
    }
  };

  const createLeafletMap = () => {
    const mapElement = document.getElementById('map');
    if (!mapElement || !window.L) return;

    // Türkiye'nin merkezi
    const turkeyCenter = [39.9334, 32.8597];
    
    const leafletMap = window.L.map('map').setView(turkeyCenter, 6);

    // OpenStreetMap tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);

    let currentMarker = null;

    // Adres arama fonksiyonu
    const searchAddress = async (query) => {
      if (!query.trim()) return;
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=tr&limit=5`
        );
        const data = await response.json();
        
        if (data.length > 0) {
          // İlk sonucu seç ve haritayı o konuma taşı
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          
          // Haritayı yeni konuma taşı
          leafletMap.setView([lat, lng], 15);
          
          // Önceki marker'ı kaldır
          if (currentMarker) {
            leafletMap.removeLayer(currentMarker);
          }
          
          // Yeni marker ekle
          currentMarker = window.L.marker([lat, lng], {
            draggable: true
          }).addTo(leafletMap);
          
          // Popup ekle
          currentMarker.bindPopup(`
            <div style="padding: 10px;">
              <h3 style="margin: 0 0 5px 0; font-size: 14px;">Aranan Konum</h3>
              <p style="margin: 0; font-size: 12px;">${result.display_name}</p>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
            </div>
          `);
          
          // Global marker referansı
          window.currentLeafletMarker = currentMarker;
          window.currentLeafletMap = leafletMap;
          
          // State'i güncelle
          const locationData = { lat, lng, address: result.display_name };
          setSelectedLocation(locationData);
          
          console.log('Arama sonucu:', result);
          console.log('selectedLocation state güncellendi:', locationData);
        } else {
          alert('Aradığınız konum bulunamadı. Lütfen farklı bir arama terimi deneyin.');
        }
      } catch (error) {
        console.error('Adres arama hatası:', error);
        alert('Adres arama sırasında bir hata oluştu.');
      }
    };

    // Arama kutusu event listener'ı
    const searchInput = document.getElementById('addressSearch');
    if (searchInput) {
      // Enter tuşu ile arama
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          searchAddress(searchInput.value);
        }
      });
      
      // Arama butonu ekle
      const searchButton = document.createElement('button');
      searchButton.innerHTML = '🔍 Ara';
      searchButton.className = 'absolute right-2 top-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors';
      searchButton.onclick = () => searchAddress(searchInput.value);
      
      // Arama kutusunu relative yap ve butonu ekle
      searchInput.parentElement.style.position = 'relative';
      searchInput.parentElement.appendChild(searchButton);
    }

    // Haritaya tıklama olayı
    leafletMap.on('click', (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      // Önceki marker'ı kaldır
      if (currentMarker) {
        leafletMap.removeLayer(currentMarker);
      }

      // Yeni marker ekle
      currentMarker = window.L.marker([lat, lng], {
        draggable: true
      }).addTo(leafletMap);

      // Marker sürükleme olayı
      currentMarker.on('dragend', (e) => {
        const newLat = e.target.getLatLng().lat;
        const newLng = e.target.getLatLng().lng;
        console.log('Marker sürüklendi:', newLat, newLng);
        // Global marker referansını güncelle
        window.currentLeafletMarker = currentMarker;
      });

      // Popup ekle
      currentMarker.bindPopup(`
        <div style="padding: 10px;">
          <h3 style="margin: 0 0 5px 0; font-size: 14px;">Seçilen Konum</h3>
          <p style="margin: 0; font-size: 12px;">${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
        </div>
      `);

      // Global marker referansı
      window.currentLeafletMarker = currentMarker;
      window.currentLeafletMap = leafletMap;
      
      // State'i güncelle (butonun aktif olması için)
      const locationData = { lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` };
      setSelectedLocation(locationData);
      
      console.log('Marker eklendi:', lat, lng);
      console.log('selectedLocation state güncellendi:', locationData);
    });

    console.log('Leaflet haritası oluşturuldu');
  };

  // Satış toggle fonksiyonu
  const handleToggleSales = async (eventId, current) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/sales-active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salesActive: !current })
      });
      if (response.ok) {
        const updated = await response.json();
        setEvents(events => events.map(ev => ev.id === eventId ? { ...ev, salesActive: updated.salesActive } : ev));
      } else {
        alert('Satış durumu güncellenemedi!');
      }
    } catch (e) {
      alert('Satış durumu güncellenemedi!');
    }
  };

  // Kullanıcı yönetimi filtreleri
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userBanFilter, setUserBanFilter] = useState('all');

  // Kullanıcı rolünü değiştir
  const handleChangeRole = async (userId, newRole) => {
    if (!user || user.role !== 'admin') return;
    await fetch(process.env.NEXT_PUBLIC_API_URL + `/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole, requesterEmail: user.email })
    });
    fetchUsers();
  };

  // Kullanıcıyı banla/ban kaldır
  const handleBanToggle = async (userId, banned) => {
    if (!user || user.role !== 'admin') return;
    await fetch(process.env.NEXT_PUBLIC_API_URL + `/users/${userId}/ban`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banned: !banned, requesterEmail: user.email })
    });
    fetchUsers();
  };

  // Kullanıcıyı sil
  const handleDeleteUser = async (userId) => {
    if (!user || user.role !== 'admin') return;
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    await fetch(process.env.NEXT_PUBLIC_API_URL + `/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterEmail: user.email })
    });
    fetchUsers();
  };

  // Filtrelenmiş kullanıcılar
  const filteredUsers = users.filter(u =>
    (userSearch === '' || u.email.toLowerCase().includes(userSearch.toLowerCase())) &&
    (userRoleFilter === 'all' || u.role === userRoleFilter) &&
    (userBanFilter === 'all' || (userBanFilter === 'banned' ? u.banned : !u.banned))
  );

  const handleApproveTicket = async (ticketId) => {
    if (!window.confirm('Bu bileti onaylamak istediğinize emin misiniz?')) return;
    try {
      const response = await fetch(`/api/tickets/${ticketId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        fetchTickets();
        alert('Bilet başarıyla onaylandı ve QR kodu gönderildi!');
      } else {
        alert('Bilet onaylanırken hata oluştu!');
      }
    } catch (error) {
      alert('Bilet onaylanırken hata oluştu!');
    }
  };

  const handleRejectTicket = async (ticketId) => {
    if (!window.confirm('Bu bileti reddetmek istediğinize emin misiniz?')) return;
    try {
      const response = await fetch(`/api/tickets/${ticketId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        fetchTickets();
        alert('Bilet reddedildi ve kullanıcıya bilgi verildi!');
      } else {
        alert('Bilet reddedilirken hata oluştu!');
      }
    } catch (error) {
      alert('Bilet reddedilirken hata oluştu!');
    }
  };

  // Etkinlik silme fonksiyonu
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setEvents(events.filter(ev => ev.id !== eventId));
        alert('Etkinlik başarıyla silindi!');
      } else {
        alert('Etkinlik silinirken hata oluştu!');
      }
    } catch (error) {
      alert('Etkinlik silinirken hata oluştu!');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-dark-card rounded-2xl shadow-2xl mt-4 transition-colors duration-300">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-dark-text">Admin Girişi</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Kullanıcı Adı (E-posta)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-secondary transition-colors duration-300"
              placeholder="admin@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-secondary transition-colors duration-300"
              placeholder="Şifrenizi girin"
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
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-dark-text-secondary">Beni hatırla</label>
          </div>
          {loginError && (
            <div className="px-4 py-2 rounded text-center bg-red-100 text-red-800 border border-red-300">{loginError}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 dark:bg-dark-primary text-white rounded-lg hover:bg-blue-700 dark:hover:bg-dark-primary-hover transition-colors disabled:opacity-50 font-trt text-lg font-bold"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl transition-colors duration-300 pt-28">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-dark-text font-trt">Admin Panel</h2>
          <p className="text-gray-600 dark:text-dark-text-secondary font-trt">Bilet sistemi yönetimi</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Çıkış Yap
        </button>
      </div>

      {/* Tab Menüsü */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-dark-bg p-1 rounded-lg transition-colors duration-300">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'stats'
              ? 'bg-white dark:bg-dark-card text-blue-600 dark:text-dark-primary shadow-sm'
              : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text'
          }`}
        >
          📊 İstatistikler
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'events'
              ? 'bg-white dark:bg-dark-card text-blue-600 dark:text-dark-primary shadow-sm'
              : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text'
          }`}
        >
          🎪 Etkinlik Yönetimi
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'tickets'
              ? 'bg-white dark:bg-dark-card text-blue-600 dark:text-dark-primary shadow-sm'
              : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text'
          }`}
        >
          🎫 Bilet Yönetimi
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-white dark:bg-dark-card text-blue-600 dark:text-dark-primary shadow-sm'
              : 'text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text'
          }`}
        >
          👥 Kullanıcı Yönetimi
        </button>
      </div>

      {/* İstatistikler Tab */}
      {activeTab === 'stats' && (
        <div>
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Toplam Bilet</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalTickets}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">Kullanılan Bilet</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.usedTickets}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-2">Aktif Bilet</h3>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalTickets - stats.usedTickets}</p>
              </div>
            </div>
          )}

          {stats && stats.eventStats && stats.eventStats.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-dark-text">Etkinlik Bazlı İstatistikler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.eventStats.map((eventStat) => (
                  <div key={eventStat.eventId} className="bg-gray-50 dark:bg-dark-bg p-4 rounded-lg border border-gray-200 dark:border-dark-border transition-colors duration-300">
                    <h4 className="font-semibold text-gray-800 dark:text-dark-text mb-2">{eventStat.eventName}</h4>
                    <div className="space-y-1 text-sm text-gray-700 dark:text-dark-text-secondary">
                      <p>Toplam: {eventStat.totalTickets}</p>
                      <p>Kullanılan: {eventStat.usedTickets}</p>
                      <p>Aktif: {eventStat.totalTickets - eventStat.usedTickets}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bilet Yönetimi Tab */}
      {activeTab === 'tickets' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">Bilet Listesi</h3>
            <div className="flex space-x-2">
              {selectedTickets.length > 0 && (
                <>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    title={`${selectedTickets.length} bilet sil`}
                  >
                    🗑️ Seçilenleri Sil ({selectedTickets.length})
                  </button>
                  <button
                    onClick={handleBulkMarkAsUsed}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    title={`${selectedTickets.length} bilet kullanıldı olarak işaretle`}
                  >
                    ✅ Kullanıldı İşaretle ({selectedTickets.length})
                  </button>
                </>
              )}
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                + Yeni Bilet Oluştur
              </button>
            </div>
          </div>

          {/* Arama ve Filtreleme Bölümü */}
          <div className="bg-white dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-dark-border mb-6 transition-colors duration-300">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Arama Kutusu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">🔍 Arama</label>
                <input
                  type="text"
                  value={ticketSearchTerm}
                  onChange={(e) => setTicketSearchTerm(e.target.value)}
                  placeholder="İsim, e-posta, telefon veya etkinlik ara..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-text-secondary transition-colors duration-300"
                />
              </div>

              {/* Durum Filtresi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">📊 Durum</label>
                <select
                  value={ticketFilterStatus}
                  onChange={(e) => setTicketFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text transition-colors duration-300"
                >
                  <option value="all">Tümü</option>
                  <option value="unused">Aktif</option>
                  <option value="used">Kullanıldı</option>
                </select>
              </div>

              {/* Etkinlik Filtresi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">🎫 Etkinlik</label>
                <select
                  value={ticketFilterEvent}
                  onChange={(e) => setTicketFilterEvent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text transition-colors duration-300"
                >
                  <option value="all">Tüm Etkinlikler</option>
                  {uniqueEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ödeme Tipi Filtresi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">💳 Ödeme Tipi</label>
                <select
                  value={ticketFilterPaymentType || 'all'}
                  onChange={(e) => setTicketFilterPaymentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text transition-colors duration-300"
                >
                  <option value="all">Tümü</option>
                  <option value="entrance">Girişte Ödeme</option>
                  <option value="iban">IBAN</option>
                </select>
              </div>

              {/* Sonuç Sayısı */}
              <div className="flex items-end">
                <div className="w-full px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg transition-colors duration-300">
                  <span className="text-sm text-gray-600 dark:text-dark-text-secondary">
                    📋 {filteredTickets.length} bilet bulundu
                  </span>
                </div>
              </div>
            </div>

            {/* Filtreleri Temizle Butonu */}
            {(ticketSearchTerm || ticketFilterStatus !== 'all' || ticketFilterEvent !== 'all' || ticketFilterPaymentType !== 'all') && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setTicketSearchTerm('');
                    setTicketFilterStatus('all');
                    setTicketFilterEvent('all');
                    setTicketFilterPaymentType('all');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  🗑️ Filtreleri Temizle
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-bg">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-8">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 dark:text-dark-primary focus:ring-blue-500 dark:focus:ring-dark-primary border-gray-300 dark:border-dark-border rounded"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-12">ID</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-32">Ad Soyad</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-48">E-posta</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-32">Telefon</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-40">Etkinlik</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-24">Durum</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-32">İşlemler</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Ödeme Tipi</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">Durum</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className={`hover:bg-gray-50 dark:hover:bg-dark-bg ${selectedTickets.includes(ticket.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTickets.includes(ticket.id)}
                          onChange={() => handleSelectTicket(ticket.id)}
                          className="h-4 w-4 text-blue-600 dark:text-dark-primary focus:ring-blue-500 dark:focus:ring-dark-primary border-gray-300 dark:border-dark-border rounded"
                        />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">{ticket.id}</td>
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-dark-text">
                        <div className="max-w-xs truncate" title={ticket.name}>{ticket.name}</div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-dark-text">
                        <div className="max-w-xs truncate" title={ticket.email}>{ticket.email}</div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">{ticket.phone}</td>
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-dark-text">
                        <div className="max-w-xs truncate" title={ticket.event?.name}>{ticket.event?.name}</div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          ticket.used ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        }`}>
                          {ticket.used ? 'Kullanıldı' : 'Aktif'}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleShowQR(ticket.id)}
                            className="text-blue-600 dark:text-dark-primary hover:text-blue-900 dark:hover:text-dark-primary-hover text-xs"
                            title="QR kodu görüntüle"
                          >
                            QR Gör
                          </button>
                          <button
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400 text-xs"
                            title="Bileti sil"
                          >
                            Sil
                          </button>
                          {ticket.paymentType === 'iban' && ticket.status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveTicket(ticket.id)} className="text-green-600 hover:text-green-900 text-xs" title="Onayla">Onayla</button>
                              <button onClick={() => handleRejectTicket(ticket.id)} className="text-red-600 hover:text-red-900 text-xs ml-2" title="Reddet">Reddet</button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ticket.paymentType === 'entrance' ? 'bg-yellow-100 text-yellow-900' : 'bg-blue-100 text-blue-900'}`}>{ticket.paymentType === 'entrance' ? 'Girişte Ödeme' : 'IBAN'}</span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-900' : ticket.status === 'approved' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>{ticket.status === 'pending' ? 'Bekliyor' : ticket.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-3 py-8 text-center">
                      <div className="text-gray-500 dark:text-dark-text-secondary">
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-lg font-medium">Bilet bulunamadı</p>
                        <p className="text-sm">Arama kriterlerinizi değiştirmeyi deneyin</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Etkinlik Yönetimi Tab */}
      {activeTab === 'events' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">Etkinlik Listesi</h3>
            <button
              onClick={() => setShowEventForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Yeni Etkinlik Ekle
            </button>
          </div>

          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-bg">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-12">ID</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-48">Ad</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-24">Tarih</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-32">Yer</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-20">Kapasite</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-20">Fiyat</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-20">Slider</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-32">Satış</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-40">Konum</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-16">Medya</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-24">İşlem</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg">
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">{event.id}</td>
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-dark-text">
                      <div className="max-w-xs truncate" title={event.name}>{event.name}</div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">
                      {new Date(event.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-dark-text">
                      <div className="max-w-xs truncate" title={event.venue}>{event.venue}</div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text text-center">{event.capacity}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text text-center">{event.price}₺</td>
                    <td className="px-3 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        event.isActive ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {event.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${event.salesActive ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                          {event.salesActive ? 'Açık' : 'Kapalı'}
                        </span>
                        <button
                          onClick={() => handleToggleSales(event.id, event.salesActive)}
                          className={`w-8 h-5 rounded-full relative focus:outline-none transition ${event.salesActive ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}
                          title={event.salesActive ? 'Satışı Kapat' : 'Satışı Aç'}
                        >
                          <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${event.salesActive ? 'translate-x-3' : ''}`}></span>
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-dark-text">
                      <div className="max-w-xs">
                        {event.latitude && event.longitude ? (
                          <div className="space-y-1">
                            <div className="text-green-600 dark:text-green-400 text-xs">📍 Konum var</div>
                            {event.address && (
                              <div className="text-xs text-gray-500 dark:text-dark-text-secondary truncate" title={event.address}>{event.address}</div>
                            )}
                            <a
                              href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-dark-primary hover:text-blue-800 dark:hover:text-dark-primary-hover underline"
                            >
                              Haritada Gör
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-dark-text-secondary text-xs">📍 Konum yok</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text text-center">
                      <div className="flex justify-center space-x-1">
                        {event.imageUrl && (
                          <span className="text-blue-600" title="Resim var">📷</span>
                        )}
                        {event.videoUrl && (
                          <span className="text-red-600" title="Video var">🎥</span>
                        )}
                        {!event.imageUrl && !event.videoUrl && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditEventForm(event)}
                        className="text-blue-600 hover:text-blue-900 text-xs"
                        title="Etkinliği düzenle"
                      >
                        ✏️ Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600 hover:text-red-900 text-xs ml-2"
                        title="Etkinliği sil"
                      >
                        🗑️ Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kullanıcı Yönetimi Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 mb-6 space-y-2 sm:space-y-0">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-dark-text-secondary mb-1">E-posta Ara</label>
              <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary text-sm bg-white dark:bg-dark-card text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-dark-text-secondary transition-colors duration-300" placeholder="E-posta ile ara" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-dark-text-secondary mb-1">Rol</label>
              <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary text-sm bg-white dark:bg-dark-card text-gray-900 dark:text-white transition-colors duration-300">
                <option value="all">Tümü</option>
                <option value="admin">Admin</option>
                <option value="staff">Yetkili</option>
                <option value="user">Kullanıcı</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-dark-text-secondary mb-1">Durum</label>
              <select value={userBanFilter} onChange={e => setUserBanFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary text-sm bg-white dark:bg-dark-card text-gray-900 dark:text-white transition-colors duration-300">
                <option value="all">Tümü</option>
                <option value="active">Aktif</option>
                <option value="banned">Banlı</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-bg">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-12">ID</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-48">E-posta</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-24">Rol</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-24">Durum</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-24">Kayıt Tarihi</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider w-32">İşlem</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg">
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">{u.id}</td>
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-dark-text">{u.email}</td>
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-dark-text">
                      {user && user.role === 'admin' ? (
                        <select value={u.role} onChange={e => handleChangeRole(u.id, e.target.value)} className="px-2 py-1 rounded border border-gray-300 text-xs text-gray-900 dark:text-white bg-white dark:bg-dark-card">
                          <option value="user">Kullanıcı</option>
                          <option value="staff">Yetkili</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700">{u.role === 'admin' ? 'Admin' : u.role === 'staff' ? 'Yetkili' : 'Kullanıcı'}</span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm">
                      {user && user.role === 'admin' ? (
                        <button
                          onClick={() => handleBanToggle(u.id, u.banned)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${u.banned ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'}`}
                        >
                          {u.banned ? 'Banı Kaldır' : 'Banla'}
                        </button>
                      ) : (
                        <span className={`inline-block px-2 py-1 rounded text-xs ${u.banned ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'}`}>{u.banned ? 'Banlı' : 'Aktif'}</span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '-'}</td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {user && user.role === 'admin' && (
                        <>
                          <button onClick={() => handleDeleteUser(u.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors">Sil</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Yeni Bilet Oluşturma Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Yeni Bilet Oluştur</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik</label>
                <select
                  value={createForm.eventId}
                  onChange={(e) => setCreateForm({...createForm, eventId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Etkinlik seçin</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ad Soyad"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ornek@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({...createForm, phone: formatPhone(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="05XX XXX XX XX"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Kod Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">QR Kod</h3>
            {selectedTicket && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p><strong>Ad Soyad:</strong> {selectedTicket.name}</p>
                <p><strong>E-posta:</strong> {selectedTicket.email}</p>
                <p><strong>Telefon:</strong> {selectedTicket.phone}</p>
                <p><strong>Etkinlik:</strong> {selectedTicket.event?.name}</p>
              </div>
            )}
            <div className="flex justify-center mb-4">
              <img src={newTicketQR} alt="QR Code" className="w-48 h-48" />
            </div>
            <button
              onClick={() => setShowQRModal(false)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Etkinlik Ekleme Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Yeni Etkinlik Ekle</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik Adı *</label>
                  <input
                    type="text"
                    value={eventForm.name}
                    onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Yaz Partisi 2024"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
                  <input
                    type="datetime-local"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yer *</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={eventForm.venue}
                      onChange={(e) => setEventForm({...eventForm, venue: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Örn: Sahil Park"
                      required
                    />
                    <button
                      type="button"
                      onClick={openMapModal}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📍 Konum Seç
                    </button>
                  </div>
                  {eventForm.address && (
                    <p className="text-xs text-green-600 mt-1">
                      📍 {eventForm.address}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kapasite *</label>
                  <input
                    type="number"
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({...eventForm, capacity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (TL) *</label>
                  <input
                    type="number"
                    value={eventForm.price}
                    onChange={(e) => setEventForm({...eventForm, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="150"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={eventForm.isActive}
                    onChange={(e) => setEventForm({...eventForm, isActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Slider'da göster
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="salesActive"
                    checked={eventForm.salesActive}
                    onChange={(e) => setEventForm({...eventForm, salesActive: e.target.checked})}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="salesActive" className="ml-2 block text-sm text-gray-700">
                    Bilet satışı aktif
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="salesActive"
                    checked={eventForm.salesActive}
                    onChange={(e) => setEventForm({...eventForm, salesActive: e.target.checked})}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="salesActive" className="ml-2 block text-sm text-gray-700">
                    Bilet satışı aktif
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Etkinlik hakkında detaylı açıklama..."
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fotoğraf URL'i</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={eventForm.imageUrl}
                      onChange={(e) => setEventForm({...eventForm, imageUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Fotoğraf linkini yapıştırın:');
                          if (url) {
                            setEventForm({...eventForm, imageUrl: url});
                          }
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                      >
                        📷 Fotoğraf Ekle
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Önerilen boyut: 800x400px</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video URL'i</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={eventForm.videoUrl}
                      onChange={(e) => setEventForm({...eventForm, videoUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://www.youtube.com/watch?v=VIDEO_ID veya https://example.com/video.mp4"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('YouTube linkini yapıştırın:');
                          if (url) {
                            // YouTube URL'ini MP4'e çevir
                            const videoId = extractYouTubeId(url);
                            if (videoId) {
                              const mp4Url = `https://www.youtube.com/embed/${videoId}`;
                              setEventForm({...eventForm, videoUrl: mp4Url});
                              alert('YouTube linki eklendi! Video slider\'da oynatılacak.');
                            } else {
                              alert('Geçersiz YouTube linki!');
                            }
                          }
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        🎥 YouTube'dan Al
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('MP4 video linkini yapıştırın:');
                          if (url) {
                            setEventForm({...eventForm, videoUrl: url});
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        📁 MP4 Link Ekle
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      YouTube linki veya direkt MP4 URL'i kullanabilirsiniz. YouTube linkleri otomatik olarak embed formatına çevrilir.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Etkinlik Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => setShowEventForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Etkinlik Düzenleme Modal */}
      {showEditEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Etkinlik Düzenle: {editingEvent?.name}</h3>
            <form onSubmit={handleEditEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Etkinlik Adı *</label>
                  <input
                    type="text"
                    value={eventForm.name}
                    onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Yaz Partisi 2024"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
                  <input
                    type="datetime-local"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yer *</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={eventForm.venue}
                      onChange={(e) => setEventForm({...eventForm, venue: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Örn: Sahil Park"
                      required
                    />
                    <button
                      type="button"
                      onClick={openMapModal}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📍 Konum Seç
                    </button>
                  </div>
                  {eventForm.address && (
                    <p className="text-xs text-green-600 mt-1">
                      📍 {eventForm.address}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kapasite *</label>
                  <input
                    type="number"
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({...eventForm, capacity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (TL) *</label>
                  <input
                    type="number"
                    value={eventForm.price}
                    onChange={(e) => setEventForm({...eventForm, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="150"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    checked={eventForm.isActive}
                    onChange={(e) => setEventForm({...eventForm, isActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActiveEdit" className="ml-2 block text-sm text-gray-700">
                    Slider'da göster
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Etkinlik hakkında detaylı açıklama..."
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fotoğraf URL'i</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={eventForm.imageUrl}
                      onChange={(e) => setEventForm({...eventForm, imageUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Fotoğraf linkini yapıştırın:');
                          if (url) {
                            setEventForm({...eventForm, imageUrl: url});
                          }
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                      >
                        📷 Fotoğraf Ekle
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Önerilen boyut: 800x400px</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video URL'i</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={eventForm.videoUrl}
                      onChange={(e) => setEventForm({...eventForm, videoUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://www.youtube.com/watch?v=VIDEO_ID veya https://example.com/video.mp4"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('YouTube linkini yapıştırın:');
                          if (url) {
                            // YouTube URL'ini MP4'e çevir
                            const videoId = extractYouTubeId(url);
                            if (videoId) {
                              const mp4Url = `https://www.youtube.com/embed/${videoId}`;
                              setEventForm({...eventForm, videoUrl: mp4Url});
                              alert('YouTube linki eklendi! Video slider\'da oynatılacak.');
                            } else {
                              alert('Geçersiz YouTube linki!');
                            }
                          }
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        🎥 YouTube'dan Al
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('MP4 video linkini yapıştırın:');
                          if (url) {
                            setEventForm({...eventForm, videoUrl: url});
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        📁 MP4 Link Ekle
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      YouTube linki veya direkt MP4 URL'i kullanabilirsiniz. YouTube linkleri otomatik olarak embed formatına çevrilir.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Etkinliği Güncelle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditEventForm(false);
                    setEditingEvent(null);
                    setEventForm({
                      name: '',
                      date: '',
                      venue: '',
                      capacity: '',
                      price: '',
                      description: '',
                      imageUrl: '',
                      videoUrl: '',
                      isActive: true,
                      latitude: '',
                      longitude: '',
                      address: ''
                    });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Maps Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Konum Seç</h3>
              <button
                onClick={() => {
                  setShowMapModal(false);
                  // Haritayı temizle
                  if (window.currentLeafletMap) {
                    window.currentLeafletMap.remove();
                    window.currentLeafletMap = null;
                  }
                  window.currentLeafletMarker = null;
                  setSelectedLocation(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Adres ara... (örn: İstanbul, Türkiye)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="addressSearch"
              />
              <p className="text-xs text-gray-500 mt-1">
                Adres yazın ve Enter'a basın veya 🔍 butonuna tıklayın. Haritaya tıklayarak da konum seçebilirsiniz.
              </p>
            </div>

            <div 
              id="map" 
              className="h-96 rounded-lg mb-4 border border-gray-300"
              style={{ minHeight: '400px' }}
            ></div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedLocation && (
                  <div>
                    <p><strong>Seçilen Konum:</strong> {eventForm.venue || 'Haritadan seçildi'}</p>
                    <p><strong>Koordinatlar:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowMapModal(false);
                    // Haritayı temizle
                    if (window.currentLeafletMap) {
                      window.currentLeafletMap.remove();
                      window.currentLeafletMap = null;
                    }
                    window.currentLeafletMarker = null;
                    setSelectedLocation(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    console.log('Konumu Seç butonuna tıklandı, selectedLocation:', selectedLocation);
                    handleLocationSelect();
                  }}
                  disabled={!selectedLocation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Konumu Seç {selectedLocation ? '(Aktif)' : '(Pasif)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 