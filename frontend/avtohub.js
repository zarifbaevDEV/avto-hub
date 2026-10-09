/**
 * AvtoHub Super Platform Interactive Core
 * Comprehensive Web Application Controller
 * Handles:
 * - Dynamic car listings & live synchronization
 * - Car Details Modal (Clicking any car)
 * - "E'lon berish" (Post Ad Modal with dynamic models & backend API)
 * - "Mening e'lonlarim" (User's ads saved and manageable in Profile)
 * - Brand Picker Modal & Model Picker Modal
 * - "Xabarlar" (Messages & Live Chat Modal)
 * - "Profil" (User Profile with Tabs: My Ads, Favorites, Settings)
 * - "Lokatsiya" (Location City Selector Modal)
 * - "Bildirishnomalar" (Notifications Modal)
 * - "Avtoservis" (Service Booking Modal)
 * - "Ehtiyot qismlar" (Auto Parts Shop Modal)
 * - "Kalkulyator" (Auto Loan Calculator)
 * - "To'liq Filtrlar" (Advanced Filter Modal)
 * - AI Search Engine ("GPT-Auto v4")
 * - Real-time Search, Brand Pills, Sorting & View Toggle (List/Grid)
 * - Favorite / Like toggles
 * - Load More cars pagination
 * - Toast notification system
 */

(function () {
  'use strict';

  // Brands and their realistic models
  const BRAND_MODELS = {
    'Chevrolet': ['Cobalt', 'Gentra / Lacetti', 'Malibu 2', 'Tracker', 'Onix', 'Nexia 3', 'Spark', 'Tahoe', 'Traverse', 'Captiva'],
    'BYD': ['Song Plus', 'Chazor', 'Han', 'Tang', 'Song Pro', 'Yuan Plus', 'Seagull', 'Seal'],
    'Kia': ['K5', 'Seltos', 'Sportage', 'Sonet', 'Carnival', 'K8', 'EV6', 'Cerato'],
    'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Creta', 'Palisade', 'Kona'],
    'Toyota': ['Camry', 'Corolla', 'RAV4', 'Land Cruiser 300', 'Prado', 'Highlander', 'Avalon'],
    'Chery': ['Tiggo 7 Pro', 'Tiggo 8 Pro', 'Arrizo 6 Pro', 'Tiggo 2 Pro', 'Tiggo 4 Pro'],
    'BMW': ['3 Series', '5 Series', '7 Series', 'X5', 'X6', 'X7', 'M5'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLE', 'GLS', 'G-Class (Gelik)']
  };

  // Helper to validate and get current user
  function getCurrentUser() {
    try {
      const raw = localStorage.getItem('avtohub_user');
      if (!raw || raw === 'null' || raw === 'undefined') return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.first_name || !parsed.phone) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  // State
  let currentUser = getCurrentUser();
  let authToken = localStorage.getItem('avtohub_token') || null;
  let allCars = [];
  let userFavorites = new Set(JSON.parse(localStorage.getItem('avtohub_user_favorites') || '[]'));
  let myAds = JSON.parse(localStorage.getItem('avtohub_user_my_ads') || '[]');
  let currentCity = currentUser?.city || 'Toshkent';
  let viewMode = 'list'; // 'list' or 'grid'

  let currentFilter = {
    search: '',
    brand: '',
    model: '',
    sortBy: 'newest',
    minPrice: 0,
    maxPrice: 200000,
    minYear: 2000,
    fuel: '',
    transmission: '',
    verifiedOnly: false
  };

  let chatHistory = [
    {
      id: 'chat-1',
      sender: 'ABC Auto (Malibu 2)',
      avatar: 'A',
      lastMessage: 'Assalomu alaykum, mashinani ertaga ko\'rish mumkin.',
      time: '14:25',
      unread: 1,
      messages: [
        { from: 'them', text: 'Assalomu alaykum! E\'lon bo\'yicha qiziqyapsizmi?', time: '14:20' },
        { from: 'me', text: 'Va alaykum assalom. Mashina kraskasi tozami?', time: '14:22' },
        { from: 'them', text: 'Ha, 100% toza, hech qanday xarajati yo\'q. Ertaga ko\'rish mumkin.', time: '14:25' }
      ]
    },
    {
      id: 'chat-2',
      sender: 'BYD Sergeli Official',
      avatar: 'B',
      lastMessage: 'Kafolat bo\'yicha barcha hujjatlar tayyor.',
      time: '11:10',
      unread: 0,
      messages: [
        { from: 'them', text: 'Hurmatli mijoz, rasmiy dilerlik kafolati 6 yil yoki 150 000 km.', time: '11:05' },
        { from: 'them', text: 'Kafolat bo\'yicha barcha hujjatlar tayyor.', time: '11:10' }
      ]
    },
    {
      id: 'chat-3',
      sender: 'AvtoHub Moderatsiya',
      avatar: 'M',
      lastMessage: 'Sizning yangi e\'loningiz muvaffaqiyatli tasdiqlandi.',
      time: 'Kecha',
      unread: 0,
      messages: [
        { from: 'them', text: 'Assalomu alaykum! Sizning e\'loningiz AI va moderator tomonidan tekshirildi va e\'lon qilindi.', time: 'Kecha' }
      ]
    }
  ];

  let currentActiveChat = chatHistory[0];

  const DEFAULT_CARS = [
    {
      id: 'malibu-2024',
      title: 'Chevrolet Malibu 2 Premier 2.0 Turbo',
      brand: 'Chevrolet',
      model: 'Malibu 2',
      year: 2024,
      price: 25500,
      priceUzs: '324 mln so\'m',
      mileage: 18000,
      color: 'Grafit kulrang',
      fuel: 'Benzin',
      transmission: 'Avtomat',
      city: 'Toshkent',
      dealer: 'ABC Auto',
      rating: 4.9,
      image: '/media/vehicles/defaults/malibu.jpg',
      isVip: true,
      isVerified: true,
      views: 342,
      phone: '+998 90 123 45 67',
      description: 'Holati ideal. Kraska 100% toza. Yangi Michelin balonlar taqilgan, to\'liq shumka va keramika qilingan. Hech qanday xarajati yo\'q.'
    },
    {
      id: 'byd-song-2024',
      title: 'BYD Song Plus Champion EV 605km',
      brand: 'BYD',
      model: 'Song Plus',
      year: 2024,
      price: 28200,
      priceUzs: '358 mln so\'m',
      mileage: 9500,
      color: 'Oq marvarid',
      fuel: 'Elektr',
      transmission: 'Avtomat',
      city: 'Toshkent',
      dealer: 'BYD Sergeli Official',
      rating: 5.0,
      image: '/media/vehicles/defaults/song_plus.jpg',
      isVip: true,
      isVerified: true,
      views: 512,
      phone: '+998 97 777 00 11',
      description: 'Yangi mashina, faqat shahar ichida haydalgan. 7kW uy zaryadkasi qo\'shib beriladi. 360 kamera, panorama tom, to\'liq multimedia o\'zbek tilida.'
    },
    {
      id: 'kia-k5-2023',
      title: 'Kia K5 GT-Line 2.5 GDI',
      brand: 'Kia',
      model: 'K5',
      year: 2023,
      price: 29500,
      priceUzs: '375 mln so\'m',
      mileage: 16000,
      color: 'Qora metallik',
      fuel: 'Benzin',
      transmission: 'Avtomat',
      city: 'Toshkent',
      dealer: 'Kia Rohat',
      rating: 4.8,
      image: '/media/vehicles/defaults/kia_k5.jpg',
      isVip: true,
      isVerified: true,
      views: 420,
      phone: '+998 93 500 22 33',
      description: 'GT-Line eng to\'liq komplektatsiya. Qizil charm salon, proyeksion displey, Bose audio, ventilyatsiya va isitish tizimi.'
    },
    {
      id: 'chevrolet-tracker-2023',
      title: 'Chevrolet Tracker Premier Redline',
      brand: 'Chevrolet',
      model: 'Tracker',
      year: 2023,
      price: 18900,
      priceUzs: '240 mln so\'m',
      mileage: 22000,
      color: 'Qora',
      fuel: 'Benzin',
      transmission: 'Avtomat',
      city: 'Samarqand',
      dealer: 'SamAvto Trade',
      rating: 4.7,
      image: '/media/vehicles/defaults/tracker.jpg',
      isVip: false,
      isVerified: true,
      views: 280,
      phone: '+998 91 555 44 33',
      description: 'Premier Redline versiyasi, bitta qo\'l haydalgan. Avtoparkovka, lyuk, simsiz quvvatlagich mavjud. Xarajatsiz.'
    },
    {
      id: 'chevrolet-cobalt-2023',
      title: 'Chevrolet Cobalt 4-pozitsiya Style AT',
      brand: 'Chevrolet',
      model: 'Cobalt',
      year: 2023,
      price: 13200,
      priceUzs: '168 mln so\'m',
      mileage: 34000,
      color: 'Oq',
      fuel: 'Gaz (Metan)',
      transmission: 'Avtomat',
      city: 'Toshkent',
      dealer: 'Xususiy sotuvchi',
      rating: 4.9,
      image: '/media/vehicles/defaults/cobalt.jpg',
      isVip: false,
      isVerified: true,
      views: 610,
      phone: '+998 90 999 88 77',
      description: '4-avlod original italyancha metan gaz qilingan. Magicar 906 pult, yangi yumshoq balonlar, salon polik va chexol kiygizilgan.'
    },
    {
      id: 'toyota-camry-2022',
      title: 'Toyota Camry 75 Hybrid Elegance',
      brand: 'Toyota',
      model: 'Camry',
      year: 2022,
      price: 34000,
      priceUzs: '432 mln so\'m',
      mileage: 42000,
      color: 'Oq marvarid',
      fuel: 'Gibrid',
      transmission: 'Avtomat',
      city: 'Farg\'ona',
      dealer: 'Farg\'ona Avto Lizing',
      rating: 5.0,
      image: '/media/vehicles/defaults/camry.jpg',
      isVip: true,
      isVerified: true,
      views: 390,
      phone: '+998 95 111 22 33',
      description: 'Juda tejamkor, 100 km ga 4.8 litr yoqilg\'i sarflaydi. Toyota rasmiy servisida xizmat ko\'rsatilgan.'
    },
    {
      id: 'hyundai-elantra-2023',
      title: 'Hyundai Elantra 2023',
      brand: 'Hyundai',
      model: 'Elantra',
      year: 2023,
      price: 21500,
      priceUzs: '273 mln so\'m',
      mileage: 28000,
      color: 'Kumushrang',
      fuel: 'Benzin',
      transmission: 'Avtomat',
      city: 'Toshkent',
      dealer: 'Hyundai Premium',
      rating: 4.9,
      image: '/media/vehicles/defaults/elantra.jpg',
      isVip: false,
      isVerified: true,
      views: 310,
      phone: '+998 90 444 33 22',
      description: 'Yangi holatda, to\'liq salon opsiyalari, lyuk, kruiz-kontrol, Apple CarPlay va Android Auto.'
    }
  ];

  // If user has no ads yet, initialize sample my ad
  if (myAds.length === 0) {
    myAds = [
      {
        id: 'my-ad-1',
        title: 'Chevrolet Cobalt 4-pozitsiya Style AT',
        brand: 'Chevrolet',
        model: 'Cobalt',
        year: 2023,
        price: 13200,
        priceUzs: '168 mln so\'m',
        mileage: 34000,
        color: 'Oq',
        fuel: 'Gaz (Metan)',
        transmission: 'Avtomat',
        city: 'Toshkent',
        status: 'ACTIVE',
        statusDisplay: 'Faol / Sotuvda',
        views: 124,
        date: 'Bugun, 15:30',
        image: '/media/vehicles/defaults/cobalt.jpg'
      }
    ];
    localStorage.setItem('avtohub_user_my_ads', JSON.stringify(myAds));
  }

  // Toast Notifications
  function showToast(message, type = 'success') {
    let container = document.getElementById('avtohub-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'avtohub-toast-container';
      container.className = 'fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-11/12 max-w-sm';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const isError = type === 'error';
    const bgClass = isError ? 'bg-error text-white' : 'bg-primary-container text-white';
    const icon = isError ? 'error' : 'check_circle';

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl font-body-md text-body-md transition-all duration-300 transform -translate-y-4 opacity-0 pointer-events-auto ${bgClass} border border-white/10`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-xl flex-shrink-0">${icon}</span>
      <span class="flex-1 font-medium text-sm">${message}</span>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('-translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', '-translate-y-4');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  // Resolve authentic car image by model/brand or uploaded file
  function resolveCarImage(itemOrCar) {
    if (!itemOrCar) return '/media/vehicles/defaults/malibu.jpg';
    // 1. Agar backend'dan yuklangan haqiqiy rasm fayli bo'lsa
    if (itemOrCar.images && itemOrCar.images.length > 0 && itemOrCar.images[0].file) {
      return itemOrCar.images[0].file;
    }
    // 2. Agar avvaldan to'g'ri lokal rasm yo'li bo'lsa
    if (typeof itemOrCar.image === 'string' && itemOrCar.image.trim() !== '' && !itemOrCar.image.includes('aida-public')) {
      return itemOrCar.image;
    }
    // 3. Avtomobil nomi, markasi yoki modeliga moslashtirilgan 100% o'ziniki bo'lgan rasm
    const v = itemOrCar.vehicle_detail || {};
    const text = `${itemOrCar.title || ''} ${v.brand_name || itemOrCar.brand || ''} ${v.model_name || itemOrCar.model || ''}`.toLowerCase();

    if (text.includes('malibu')) return '/media/vehicles/defaults/malibu.jpg';
    if (text.includes('song') || (text.includes('byd') && text.includes('plus'))) return '/media/vehicles/defaults/song_plus.jpg';
    if (text.includes('chazor')) return '/media/vehicles/defaults/chazor.jpg';
    if (text.includes('k5') || text.includes('kia')) return '/media/vehicles/defaults/kia_k5.jpg';
    if (text.includes('tracker')) return '/media/vehicles/defaults/tracker.jpg';
    if (text.includes('onix')) return '/media/vehicles/defaults/onix.jpg';
    if (text.includes('cobalt') || text.includes('lacetti') || text.includes('gentra')) return '/media/vehicles/defaults/cobalt.jpg';
    if (text.includes('camry') || text.includes('toyota')) return '/media/vehicles/defaults/camry.jpg';
    if (text.includes('elantra') || text.includes('hyundai')) return '/media/vehicles/defaults/elantra.jpg';

    return '/media/vehicles/defaults/malibu.jpg';
  }

  // Load cars from API or fallback
  async function loadCars() {
    try {
      const res = await fetch('/api/v1/marketplace/listings/');
      if (res.ok) {
        const json = await res.json();
        const apiCars = json.data || [];
        if (apiCars.length > 0) {
          const mappedApiCars = apiCars.map(item => {
            const v = item.vehicle_detail || {};
            const brandName = v.brand_detail?.name || v.brand_name || (item.title ? item.title.split(' ')[0] : 'Boshqa');
            const modelName = v.model_detail?.name || v.model_name || '';
            const price = parseFloat(item.price || 0);
            return {
              id: item.id,
              title: item.title || `${brandName} ${modelName}`,
              brand: brandName,
              model: modelName,
              year: v.year || 2023,
              price: price,
              priceUzs: `≈ ${(price * 12.7).toFixed(0)} mln so'm`,
              mileage: v.mileage || 20000,
              color: v.color || 'Oq',
              fuel: v.fuel_type_display || v.fuel_type || 'Benzin',
              transmission: v.transmission_display || v.transmission || 'Avtomat',
              city: v.city || 'Toshkent',
              dealer: item.seller_detail?.first_name || 'AvtoHub Sotuvchi',
              rating: 4.9,
              image: (item.images && item.images.length > 0 && item.images[0].file) ? item.images[0].file : resolveCarImage(item),
              isVip: item.is_vip,
              isVerified: true,
              views: item.views || 45,
              phone: item.seller_detail?.phone || '+998 90 123 45 67',
              description: item.description || 'Holati a\'lo darajada.'
            };
          });

          // myAds dagi rasmlarni ham tekshirib to'g'irlash
          if (myAds && myAds.length > 0) {
            myAds = myAds.map(ad => ({
              ...ad,
              image: resolveCarImage(ad)
            }));
            localStorage.setItem('avtohub_user_my_ads', JSON.stringify(myAds));
          }

          const existingTitles = new Set(mappedApiCars.map(c => c.title));
          const extraDefaults = DEFAULT_CARS.filter(c => !existingTitles.has(c.title));
          allCars = [...mappedApiCars, ...extraDefaults];
        } else {
          allCars = [...DEFAULT_CARS];
        }
      } else {
        allCars = [...DEFAULT_CARS];
      }
    } catch (e) {
      allCars = [...DEFAULT_CARS];
    }

    renderCars();
  }

  // Render Cars to the UI
  function renderCars() {
    const isMarketplace = window.location.pathname.includes('marketplace');
    let filtered = allCars.filter(car => {
      const s = currentFilter.search.toLowerCase().trim();
      const matchesSearch = !s ||
        car.title.toLowerCase().includes(s) ||
        car.brand.toLowerCase().includes(s) ||
        car.model.toLowerCase().includes(s) ||
        car.city.toLowerCase().includes(s) ||
        String(car.year).includes(s);

      const matchesBrand = !currentFilter.brand ||
        car.brand.toLowerCase() === currentFilter.brand.toLowerCase();

      const matchesModel = !currentFilter.model ||
        car.model.toLowerCase().includes(currentFilter.model.toLowerCase()) ||
        car.title.toLowerCase().includes(currentFilter.model.toLowerCase());

      const matchesPrice = car.price >= currentFilter.minPrice && car.price <= currentFilter.maxPrice;
      const matchesYear = car.year >= currentFilter.minYear;
      const matchesFuel = !currentFilter.fuel || car.fuel.toLowerCase().includes(currentFilter.fuel.toLowerCase());
      const matchesTrans = !currentFilter.transmission || car.transmission.toLowerCase().includes(currentFilter.transmission.toLowerCase());

      return matchesSearch && matchesBrand && matchesModel && matchesPrice && matchesYear && matchesFuel && matchesTrans;
    });

    if (currentFilter.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentFilter.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (currentFilter.sortBy === 'views') {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    const carContainers = document.querySelectorAll(
      isMarketplace ? '.mt-space-md.space-y-space-md' : 'section.space-y-3.pt-1 > div.space-y-3\\.5'
    );

    if (carContainers.length === 0) return;

    carContainers.forEach(container => {
      if (isMarketplace && viewMode === 'grid') {
        container.className = 'mt-space-md grid grid-cols-2 gap-2.5';
      } else if (isMarketplace) {
        container.className = 'mt-space-md space-y-space-md';
      }

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="col-span-2 p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/40 space-y-3">
            <span class="material-symbols-outlined text-5xl text-outline">search_off</span>
            <h4 class="font-headline-sm text-headline-sm text-on-surface">Hech qanday avtomobil topilmadi</h4>
            <p class="font-body-sm text-body-sm text-outline">Qidiruv so'zini o'zgartirib yoki filtrlarni tozalab ko'ring.</p>
            <button onclick="window.AvtoHub.resetFilters()" class="px-4 py-2 bg-secondary text-white rounded-lg font-label-md text-label-md">
              Barcha e'lonlarni ko'rsatish
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map(car => {
        const isFav = userFavorites.has(String(car.id));
        const isGrid = isMarketplace && viewMode === 'grid';

        const carImg = car.image || resolveCarImage(car);

        if (isGrid) {
          return `
            <article data-car-id="${car.id}" class="car-card cursor-pointer bg-surface-container-lowest rounded-xl border border-outline-variant/50 overflow-hidden shadow-sm hover:border-secondary hover:shadow-md transition-all duration-200 flex flex-col">
              <div class="relative w-full aspect-[4/3] bg-surface-container-high overflow-hidden">
                <img class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" src="${carImg}" alt="${car.title}" loading="lazy" onerror="this.onerror=null; this.src='${DEFAULT_CARS[0].image}';"/>
                <button aria-label="Sevimlilarga qo'shish" onclick="event.stopPropagation(); window.AvtoHub.toggleFavorite('${car.id}', this)" class="fav-btn absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm flex items-center justify-center ${isFav ? 'text-error' : 'text-outline'} hover:text-error transition-colors shadow-sm active:scale-90">
                  <span class="material-symbols-outlined text-base" style="${isFav ? "font-variation-settings: 'FILL' 1;" : ''}">favorite</span>
                </button>
                <div class="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-primary/80 text-white text-[10px] font-medium">
                  ${car.year}
                </div>
              </div>
              <div class="p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                <div>
                  <div class="font-bold text-sm text-secondary">$${car.price.toLocaleString()}</div>
                  <h3 class="font-medium text-xs text-on-surface line-clamp-1">${car.title}</h3>
                </div>
                <div class="text-[11px] text-outline flex items-center justify-between pt-1 border-t border-outline-variant/30">
                  <span>${car.mileage.toLocaleString()} km</span>
                  <span>${car.city}</span>
                </div>
              </div>
            </article>
          `;
        }

        return `
          <article data-car-id="${car.id}" class="car-card cursor-pointer bg-surface-container-lowest rounded-xl border border-outline-variant/50 overflow-hidden shadow-sm hover:border-secondary hover:shadow-md transition-all duration-200">
            <div class="relative w-full aspect-[16/10] bg-surface-container-high overflow-hidden">
              <img class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" src="${carImg}" alt="${car.title}" loading="lazy" onerror="this.onerror=null; this.src='${DEFAULT_CARS[0].image}';"/>
              <div class="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 pointer-events-none">
                ${car.isVip ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold shadow-sm"><span class="material-symbols-outlined text-xs">rocket_launch</span> VIP</span>' : ''}
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-sm text-on-tertiary-container font-label-sm text-label-sm font-semibold border border-tertiary-fixed-dim/60 shadow-sm">
                  <span class="material-symbols-outlined text-xs text-green-600">verified</span> AI Tekshirilgan
                </span>
              </div>
              <button aria-label="Sevimlilarga qo'shish" onclick="event.stopPropagation(); window.AvtoHub.toggleFavorite('${car.id}', this)" class="fav-btn absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm flex items-center justify-center ${isFav ? 'text-error' : 'text-outline'} hover:text-error transition-colors shadow-sm active:scale-90">
                <span class="material-symbols-outlined text-lg" style="${isFav ? "font-variation-settings: 'FILL' 1;" : ''}">favorite</span>
              </button>
              <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-primary/80 backdrop-blur-xs text-white text-xs font-medium">
                ${car.views || 40} ko'rildi
              </div>
            </div>
            <div class="p-3.5 space-y-2.5">
              <div class="flex items-baseline justify-between">
                <div>
                  <span class="font-headline-md text-headline-md font-bold text-on-surface">$${car.price.toLocaleString()}</span>
                  <span class="font-body-sm text-body-sm text-outline ml-1.5">${car.priceUzs}</span>
                </div>
                <span class="font-label-sm text-label-sm text-outline bg-surface-container-low px-1.5 py-0.5 rounded font-semibold">${car.year}</span>
              </div>
              <h3 class="font-headline-sm text-headline-sm text-on-surface line-clamp-1 font-semibold">${car.title}</h3>
              <div class="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm flex-wrap">
                <span class="bg-surface-container-low px-2 py-0.5 rounded font-label-sm text-label-sm">${car.mileage.toLocaleString()} km</span>
                <span class="text-outline">•</span>
                <span class="bg-surface-container-low px-2 py-0.5 rounded font-label-sm text-label-sm">${car.transmission}</span>
                <span class="text-outline">•</span>
                <span class="bg-surface-container-low px-2 py-0.5 rounded font-label-sm text-label-sm">${car.fuel}</span>
              </div>
              <div class="pt-2 border-t border-outline-variant/30 flex items-center justify-between text-outline font-label-md text-label-md">
                <div class="flex items-center gap-1 text-on-surface-variant">
                  <span class="material-symbols-outlined text-sm text-outline">location_on</span>
                  <span>${car.city}</span>
                </div>
                <div class="flex items-center gap-1 font-semibold text-on-surface">
                  <span>${car.dealer}</span>
                  <span class="flex items-center text-amber-500 font-bold text-xs">
                    <span class="material-symbols-outlined text-xs">star</span> ${car.rating}
                  </span>
                </div>
              </div>
            </div>
          </article>
        `;
      }).join('');

      container.querySelectorAll('.car-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-car-id');
          const car = allCars.find(c => String(c.id) === String(id));
          if (car) openCarModal(car);
        });
      });
    });

    const countLabel = document.getElementById('loaded-count-label');
    if (countLabel) {
      countLabel.innerText = `Jami 35,821 tadan ${filtered.length} tasi ko‘rsatildi`;
    }
  }

  // 1. BRAND PICKER MODAL
  function openBrandPickerModal() {
    let modal = document.getElementById('avtohub-brand-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avtohub-brand-modal';
      modal.className = 'fixed inset-0 z-[9990] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm transition-opacity duration-200';
      document.body.appendChild(modal);
    }

    const brands = Object.keys(BRAND_MODELS);

    modal.innerHTML = `
      <div class="bg-surface-container-lowest max-w-sm w-full rounded-2xl shadow-2xl border border-outline-variant/30 p-5 space-y-3 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between pb-2 border-b border-outline-variant/30">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-2xl">directions_car</span>
            <h3 class="font-headline-sm text-base font-bold text-on-surface">Markani tanlang</h3>
          </div>
          <button onclick="window.AvtoHub.closeModal('avtohub-brand-modal')" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <button onclick="window.AvtoHub.selectBrand('')" class="w-full p-2.5 rounded-xl border text-sm font-semibold text-center transition-colors ${!currentFilter.brand ? 'bg-secondary text-white border-secondary' : 'bg-surface-container-low text-on-surface border-outline-variant/40 hover:bg-surface-container'}">
          Barcha markalar
        </button>

        <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pt-1">
          ${brands.map(b => `
            <button onclick="window.AvtoHub.selectBrand('${b}')" class="p-2.5 rounded-xl border text-sm font-medium text-left transition-colors flex items-center justify-between ${currentFilter.brand === b ? 'bg-secondary text-white border-secondary' : 'bg-surface-container-low text-on-surface border-outline-variant/40 hover:bg-surface-container'}">
              <span>${b}</span>
              <span class="text-xs opacity-75">${BRAND_MODELS[b].length}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  function selectBrand(brand) {
    currentFilter.brand = brand;
    currentFilter.model = ''; // Reset model when brand changes
    closeModal('avtohub-brand-modal');

    const brandLabel = document.getElementById('quick-filter-brand-label');
    if (brandLabel) {
      brandLabel.innerText = brand ? brand : 'Marka';
    }
    const modelLabel = document.getElementById('quick-filter-model-label');
    if (modelLabel) {
      modelLabel.innerText = 'Model';
    }

    renderCars();
    showToast(brand ? `Marka tanlandi: ${brand}` : 'Barcha markalar ko\'rsatildi');
  }

  // 2. MODEL PICKER MODAL
  function openModelPickerModal() {
    let modal = document.getElementById('avtohub-model-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avtohub-model-modal';
      modal.className = 'fixed inset-0 z-[9990] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm transition-opacity duration-200';
      document.body.appendChild(modal);
    }

    // Determine models list
    let modelsList = [];
    if (currentFilter.brand && BRAND_MODELS[currentFilter.brand]) {
      modelsList = BRAND_MODELS[currentFilter.brand];
    } else {
      // All popular models
      Object.values(BRAND_MODELS).forEach(list => {
        modelsList.push(...list.slice(0, 3));
      });
    }

    modal.innerHTML = `
      <div class="bg-surface-container-lowest max-w-sm w-full rounded-2xl shadow-2xl border border-outline-variant/30 p-5 space-y-3 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between pb-2 border-b border-outline-variant/30">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-2xl">category</span>
            <div>
              <h3 class="font-headline-sm text-base font-bold text-on-surface">Modelni tanlang</h3>
              <p class="text-[11px] text-outline">${currentFilter.brand ? currentFilter.brand + ' modellari' : 'Ommabop modellar'}</p>
            </div>
          </div>
          <button onclick="window.AvtoHub.closeModal('avtohub-model-modal')" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <button onclick="window.AvtoHub.selectModel('')" class="w-full p-2.5 rounded-xl border text-sm font-semibold text-center transition-colors ${!currentFilter.model ? 'bg-secondary text-white border-secondary' : 'bg-surface-container-low text-on-surface border-outline-variant/40 hover:bg-surface-container'}">
          Barcha modellar
        </button>

        <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pt-1">
          ${modelsList.map(m => `
            <button onclick="window.AvtoHub.selectModel('${m}')" class="p-2.5 rounded-xl border text-sm font-medium text-left transition-colors ${currentFilter.model === m ? 'bg-secondary text-white border-secondary' : 'bg-surface-container-low text-on-surface border-outline-variant/40 hover:bg-surface-container'}">
              ${m}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  function selectModel(model) {
    currentFilter.model = model;
    closeModal('avtohub-model-modal');

    const modelLabel = document.getElementById('quick-filter-model-label');
    if (modelLabel) {
      modelLabel.innerText = model ? model : 'Model';
    }

    renderCars();
    showToast(model ? `Model tanlandi: ${model}` : 'Barcha modellar ko\'rsatildi');
  }

  // 3. CAR DETAILS MODAL
  function openCarModal(car) {
    let modal = document.getElementById('avtohub-car-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avtohub-car-modal';
      modal.className = 'fixed inset-0 z-[9990] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm transition-opacity duration-200';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-surface-container-lowest max-w-lg w-full max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col relative animate-in fade-in zoom-in-95 duration-150">
        <!-- Close Button -->
        <button onclick="window.AvtoHub.closeModal('avtohub-car-modal')" class="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur text-on-surface hover:bg-surface-container flex items-center justify-center shadow-md">
          <span class="material-symbols-outlined text-xl">close</span>
        </button>

        <!-- Big Image Header -->
        <div class="relative w-full aspect-[16/10] bg-surface-container overflow-hidden">
          <img src="${car.image || resolveCarImage(car)}" alt="${car.title}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='${DEFAULT_CARS[0].image}';"/>
          <div class="absolute bottom-3 left-3 flex gap-2">
            <span class="px-2.5 py-1 rounded-md bg-secondary text-white font-label-sm text-xs font-semibold shadow">
              Tasdiqlangan VIN
            </span>
            <span class="px-2.5 py-1 rounded-md bg-green-600 text-white font-label-sm text-xs font-semibold shadow">
              Holati A'lo
            </span>
          </div>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="font-headline-md text-xl font-bold text-on-surface">${car.title}</h2>
              <div class="flex items-center gap-1.5 text-outline text-sm mt-1">
                <span class="material-symbols-outlined text-base">location_on</span>
                <span>${car.city}</span>
                <span>•</span>
                <span>${car.year}-yil</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-black text-secondary">$${car.price.toLocaleString()}</div>
              <div class="text-xs text-outline">${car.priceUzs}</div>
            </div>
          </div>

          <!-- Specs Grid -->
          <div class="grid grid-cols-2 gap-2 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary text-lg">speed</span>
              <div>
                <div class="text-[11px] text-outline">Yurgan masofasi</div>
                <div class="text-xs font-semibold text-on-surface">${car.mileage.toLocaleString()} km</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary text-lg">local_gas_station</span>
              <div>
                <div class="text-[11px] text-outline">Yoqilg'i</div>
                <div class="text-xs font-semibold text-on-surface">${car.fuel}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary text-lg">settings_suggest</span>
              <div>
                <div class="text-[11px] text-outline">Uzatmalar qutisi</div>
                <div class="text-xs font-semibold text-on-surface">${car.transmission}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary text-lg">palette</span>
              <div>
                <div class="text-[11px] text-outline">Rangi</div>
                <div class="text-xs font-semibold text-on-surface">${car.color}</div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <h4 class="text-xs font-bold uppercase tracking-wider text-outline">Sotuvchi tavsifi</h4>
            <p class="text-sm text-on-surface-variant leading-relaxed bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30">
              ${car.description}
            </p>
          </div>

          <!-- Seller Info -->
          <div class="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                ${car.dealer.charAt(0)}
              </div>
              <div>
                <div class="text-sm font-semibold text-on-surface">${car.dealer}</div>
                <div class="text-xs text-outline flex items-center gap-1">
                  <span class="material-symbols-outlined text-amber-500 text-xs">star</span>
                  ${car.rating} reyting (24+ sharh)
                </div>
              </div>
            </div>
            <span class="px-2 py-1 bg-green-100 text-green-800 text-[11px] font-semibold rounded">Ishonchli</span>
          </div>

          <!-- Actions -->
          <div class="grid grid-cols-3 gap-2 pt-2">
            <a href="tel:${car.phone}" onclick="window.AvtoHub.handleCall('${car.phone}')" class="flex flex-col items-center justify-center py-2.5 px-2 bg-secondary hover:bg-secondary-container text-white font-semibold rounded-xl text-center active:scale-95 transition-all shadow-md">
              <span class="material-symbols-outlined text-lg mb-0.5">call</span>
              <span class="text-xs">Qo'ng'iroq</span>
            </a>
            <button onclick="window.AvtoHub.openDirectChat('${car.dealer}', '${car.title}')" class="flex flex-col items-center justify-center py-2.5 px-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold rounded-xl text-center active:scale-95 transition-all border border-outline-variant/40">
              <span class="material-symbols-outlined text-lg mb-0.5">chat</span>
              <span class="text-xs">Xabar yozish</span>
            </button>
            <button onclick="window.AvtoHub.openCalculatorModal(${car.price})" class="flex flex-col items-center justify-center py-2.5 px-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold rounded-xl text-center active:scale-95 transition-all border border-outline-variant/40">
              <span class="material-symbols-outlined text-lg mb-0.5">calculate</span>
              <span class="text-xs">Kredit</span>
            </button>
          </div>
        </div>
      </div>
    `;

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  // 4. "E'LON BERISH" (POST AD) MODAL WITH DYNAMIC MODELS
  function openPostAdModal() {
    if (!currentUser) {
      showToast("E'lon berish uchun avval ro'yxatdan o'ting yoki tizimga kiring!", 'info');
      openAuthModal('register', true);
      return;
    }

    let modal = document.getElementById('avtohub-post-ad-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avtohub-post-ad-modal';
      modal.className = 'fixed inset-0 z-[9990] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm transition-opacity duration-200';
      document.body.appendChild(modal);
    }

    const defaultBrand = 'Chevrolet';
    const initialModels = BRAND_MODELS[defaultBrand] || ['Cobalt'];

    modal.innerHTML = `
      <div class="bg-surface-container-lowest max-w-lg w-full max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col relative animate-in fade-in zoom-in-95 duration-150">
        <!-- Header -->
        <div class="p-4 border-b border-outline-variant/30 flex items-center justify-between sticky top-0 bg-surface-container-lowest z-10">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-secondary text-white flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">add_circle</span>
            </div>
            <div>
              <h3 class="font-headline-sm text-base font-bold text-on-surface">Yangi e'lon berish</h3>
              <p class="text-xs text-outline">Avtomobilingizni 1 daqiqada sotuvga qo'ying</p>
            </div>
          </div>
          <button onclick="window.AvtoHub.closeModal('avtohub-post-ad-modal')" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <!-- Form -->
        <form id="post-ad-form" onsubmit="window.AvtoHub.submitAd(event)" class="p-5 space-y-4">
          <!-- Marka & Model (Dynamic) -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">Marka *</label>
              <select name="brand" id="post-ad-brand-select" onchange="window.AvtoHub.handleBrandChangeInForm(this.value)" required class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary">
                ${Object.keys(BRAND_MODELS).map(b => `<option value="${b}">${b}</option>`).join('')}
                <option value="Boshqa">Boshqa marka</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">Model *</label>
              <div id="post-ad-model-container">
                <select name="model" id="post-ad-model-select" required class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary">
                  ${initialModels.map(m => `<option value="${m}">${m}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>

          <!-- Yili & Narxi -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">Ishlab chiqarilgan yili *</label>
              <input type="number" name="year" required min="1990" max="2027" value="2023" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">Narxi ($ USD) *</label>
              <input type="number" name="price" required min="100" max="500000" placeholder="Masalan: 13500" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
            </div>
          </div>

          <!-- Masofa & Rangi -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">Yurgan masofasi (km) *</label>
              <input type="number" name="mileage" required min="0" placeholder="Masalan: 25000" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">Rangi *</label>
              <input type="text" name="color" required value="Oq" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
            </div>
          </div>

          <!-- Yoqilg'i & Uzatma -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">Yoqilg'i turi</label>
              <select name="fuel_type" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary">
                <option value="PETROL">Benzin</option>
                <option value="GAS_METHANE">Metan gaz</option>
                <option value="ELECTRIC">Elektr</option>
                <option value="HYBRID">Gibrid</option>
                <option value="DIESEL">Dizel</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">Uzatmalar qutisi</label>
              <select name="transmission" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary">
                <option value="AUTOMATIC">Avtomat</option>
                <option value="MANUAL">Mexanika</option>
              </select>
            </div>
          </div>

          <!-- Shahar & Telefon -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">Shahar / Viloyat *</label>
              <input type="text" name="city" required value="${currentUser?.city || currentCity}" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1">Telefon raqamingiz *</label>
              <input type="tel" name="phone" required placeholder="+998 90 123 45 67" value="${currentUser?.phone || '+998 '}" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
            </div>
          </div>

          <!-- Tavsif -->
          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1">Tavsif / Qo'shimcha ma'lumot</label>
            <textarea name="description" rows="2" placeholder="Kraskasi toza, hech qanday xarajati yo'q, yangi balonlar taqilgan..." class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"></textarea>
          </div>

          <!-- Rasm yuklash (Majburiy) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-on-surface">Avtomobil rasmi <span class="text-error font-bold">*</span></label>
              <span class="text-[10px] text-error font-semibold uppercase tracking-wider bg-error/10 px-2 py-0.5 rounded">Majburiy</span>
            </div>
            <input type="file" name="image" id="post-ad-image-input" accept="image/*" required onchange="window.AvtoHub.handleImagePreview(event)" class="w-full text-xs text-outline file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-white hover:file:bg-secondary-container cursor-pointer bg-surface-container-low border border-outline-variant/60 rounded-xl p-1"/>
            <div id="post-ad-image-preview" class="mt-2.5 hidden relative rounded-xl overflow-hidden border border-outline-variant/60 max-h-48 bg-surface-container">
              <img id="post-ad-preview-img" src="" alt="Yuklangan rasm" class="w-full h-40 object-cover"/>
              <button type="button" onclick="window.AvtoHub.clearImagePreview()" class="absolute top-2 right-2 p-1.5 rounded-full bg-surface-container-lowest/90 text-on-surface hover:bg-error hover:text-white transition-colors shadow">
                <span class="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <p id="post-ad-image-hint" class="text-[11px] text-error font-medium mt-1.5 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">error</span>
              Mashina rasmini qo'ying! Rasm yuklanmasa e'lon qabul qilinmaydi.
            </p>
          </div>

          <!-- Submit Button -->
          <button type="submit" id="submit-ad-btn" class="w-full py-3 bg-secondary hover:bg-secondary-container text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-xl">publish</span>
            <span>E'lonni chop etish</span>
          </button>
        </form>
      </div>
    `;

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  let postAdImageBase64 = null;

  function handleImagePreview(e) {
    const file = e.target.files && e.target.files[0];
    const preview = document.getElementById('post-ad-image-preview');
    const img = document.getElementById('post-ad-preview-img');
    const hint = document.getElementById('post-ad-image-hint');
    const input = document.getElementById('post-ad-image-input');
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        postAdImageBase64 = evt.target.result;
        if (img) img.src = postAdImageBase64;
        if (preview) preview.classList.remove('hidden');
        if (hint) {
          hint.className = 'text-[11px] text-green-600 font-medium mt-1 flex items-center gap-1';
          hint.innerHTML = '<span class="material-symbols-outlined text-xs">check_circle</span> Mashina rasmi tanlandi';
        }
        if (input) input.classList.remove('border-error', 'ring-2', 'ring-error');
      };
      reader.readAsDataURL(file);
    } else {
      postAdImageBase64 = null;
      if (preview) preview.classList.add('hidden');
      if (hint) {
        hint.className = 'text-[11px] text-error font-medium mt-1 flex items-center gap-1';
        hint.innerHTML = '<span class="material-symbols-outlined text-xs">error</span> Mashina rasmini qo\'ying! Rasm yuklanmasa e\'lon qabul qilinmaydi.';
      }
    }
  }

  function clearImagePreview() {
    const input = document.getElementById('post-ad-image-input');
    const preview = document.getElementById('post-ad-image-preview');
    const img = document.getElementById('post-ad-preview-img');
    const hint = document.getElementById('post-ad-image-hint');
    postAdImageBase64 = null;
    if (input) input.value = '';
    if (img) img.src = '';
    if (preview) preview.classList.add('hidden');
    if (hint) {
      hint.className = 'text-[11px] text-error font-medium mt-1 flex items-center gap-1';
      hint.innerHTML = '<span class="material-symbols-outlined text-xs">error</span> Mashina rasmini qo\'ying! Rasm yuklanmasa e\'lon qabul qilinmaydi.';
    }
  }

  function handleBrandChangeInForm(brand) {
    const container = document.getElementById('post-ad-model-container');
    if (!container) return;

    if (BRAND_MODELS[brand]) {
      const models = BRAND_MODELS[brand];
      container.innerHTML = `
        <select name="model" required class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary">
          ${models.map(m => `<option value="${m}">${m}</option>`).join('')}
        </select>
      `;
    } else {
      container.innerHTML = `
        <input type="text" name="model" required placeholder="Model nomini yozing" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
      `;
    }
  }

  // Submit Ad to Backend API & Save to My Ads
  async function submitAd(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('submit-ad-btn');
    const imageInput = document.getElementById('post-ad-image-input');
    const imageFile = imageInput?.files && imageInput.files[0];

    // Tekshirish: agar rasm yuklanmagan bo'lsa qat'iy talab qilish
    if (!imageFile && !postAdImageBase64) {
      showToast("Iltimos, mashina rasmini qo'ying!", 'error');
      if (imageInput) {
        imageInput.focus();
        imageInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        imageInput.classList.add('border-error', 'ring-2', 'ring-error');
        setTimeout(() => imageInput.classList.remove('border-error', 'ring-2', 'ring-error'), 4000);
      }
      return;
    }

    const formData = new FormData(form);

    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Yuklanmoqda...';

    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/v1/marketplace/listings/quick-create/', {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast("Tabriklaymiz! E'loningiz muvaffaqiyatli chop etildi!", 'success');
        closeModal('avtohub-post-ad-modal');

        const brand = formData.get('brand');
        const model = formData.get('model');
        const price = parseFloat(formData.get('price'));
        const year = formData.get('year');

        // Agar backend'dan rasm qaytgan bo'lsa uni olamiz, yoki user yuklagan preview rasm, yoki modelga mos fotosurat
        let adImage = null;
        if (json.data?.images && json.data.images.length > 0 && json.data.images[0].file) {
          adImage = json.data.images[0].file;
        } else if (postAdImageBase64) {
          adImage = postAdImageBase64;
        } else {
          adImage = resolveCarImage({ title: `${brand} ${model} ${year}`, brand, model });
        }

        const newCar = {
          id: json.data?.id || 'new-' + Date.now(),
          title: `${brand} ${model} ${year}`,
          brand: brand,
          model: model,
          year: parseInt(year),
          price: price,
          priceUzs: `≈ ${(price * 12.7).toFixed(0)} mln so'm`,
          mileage: parseInt(formData.get('mileage')) || 0,
          color: formData.get('color') || 'Oq',
          fuel: formData.get('fuel_type') || 'Benzin',
          transmission: formData.get('transmission') || 'Avtomat',
          city: formData.get('city') || currentCity,
          dealer: 'Siz (Foydalanuvchi)',
          rating: 5.0,
          image: adImage,
          isVip: false,
          isVerified: true,
          views: 1,
          phone: formData.get('phone'),
          description: formData.get('description') || 'Yangi e\'lon',
          status: 'ACTIVE',
          statusDisplay: 'Faol / Sotuvda',
          date: 'Bugun, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        postAdImageBase64 = null;

        // Save to My Ads
        myAds.unshift(newCar);
        localStorage.setItem('avtohub_user_my_ads', JSON.stringify(myAds));

        allCars.unshift(newCar);
        renderCars();

        const feed = document.querySelector('section.space-y-3.pt-1') || document.querySelector('.mt-space-md');
        if (feed) feed.scrollIntoView({ behavior: 'smooth' });
      } else {
        showToast(json.message || "Xatolik yuz berdi. Iltimos qaytadan urining.", 'error');
      }
    } catch (err) {
      showToast("Server bilan bog'lanishda xatolik yuz berdi.", 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined text-xl">publish</span> <span>E\'lonni chop etish</span>';
    }
  }

  // 5. "PROFIL" (PROFILE MODAL) WITH "MENING E'LONLARIM" & FAVORITES TABS
  function openProfileModal(activeTab = 'my_ads') {
    currentUser = getCurrentUser();
    if (!currentUser) {
      showToast("Profil ma'lumotlarini ko'rish uchun avval ro'yxatdan o'ting!", 'info');
      openAuthModal('register', true);
      return;
    }

    let modal = document.getElementById('avtohub-profile-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avtohub-profile-modal';
      modal.className = 'fixed inset-0 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm transition-opacity duration-200';
      modal.style.cssText = 'position: fixed; inset: 0; z-index: 99990; display: flex; align-items: center; justify-content: center; background-color: rgba(0,0,0,0.7);';
      document.body.appendChild(modal);
    } else {
      modal.style.display = 'flex';
    }

    renderProfileContent(activeTab);

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        modal.remove();
      }
    };
  }

  function renderProfileContent(activeTab = 'my_ads') {
    const modal = document.getElementById('avtohub-profile-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="bg-surface-container-lowest max-w-md w-full max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col relative animate-in fade-in zoom-in-95">
        <!-- Header -->
        <div class="p-4 border-b border-outline-variant/30 flex items-center justify-between sticky top-0 bg-surface-container-lowest z-10">
          <h3 class="font-headline-sm text-base font-bold text-on-surface">Mening Profilim</h3>
          <button onclick="window.AvtoHub.closeModal('avtohub-profile-modal')" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div class="p-5 space-y-4">
          <!-- User Info Card -->
          ${currentUser ? `
            <div class="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center gap-3">
              <div class="w-14 h-14 rounded-full bg-secondary text-white font-bold text-xl flex items-center justify-center shadow-md flex-shrink-0">
                ${(currentUser.first_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <h4 class="font-bold text-base text-on-surface truncate">${currentUser.first_name} ${currentUser.last_name || ''}</h4>
                  <span class="material-symbols-outlined text-secondary text-sm" title="Tasdiqlangan">verified</span>
                </div>
                <p class="text-xs text-outline font-medium">${currentUser.phone}</p>
                <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold">
                    🎂 ${currentUser.age ? currentUser.age + ' yosh' : 'Yoshi: ko\'rsatilmagan'}
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-highest text-on-surface text-[11px] font-semibold">
                    📍 ${currentUser.city || 'Toshkent'}
                  </span>
                  ${currentUser.gender ? `
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-outline-variant/20 text-on-surface-variant">
                      ${currentUser.gender === 'M' ? 'Erkak' : currentUser.gender === 'F' ? 'Ayol' : 'Boshqa'}
                    </span>
                  ` : ''}
                </div>
              </div>
            </div>
          ` : `
            <div class="p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-primary-container/20 border border-secondary/30 flex flex-col gap-3 text-center items-center">
              <div class="w-12 h-12 rounded-full bg-secondary/15 text-secondary font-bold text-2xl flex items-center justify-center">
                <span class="material-symbols-outlined text-2xl">person_outline</span>
              </div>
              <div>
                <h4 class="font-bold text-base text-on-surface">Mehmon foydalanuvchi</h4>
                <p class="text-xs text-outline mt-0.5">AvtoHub imkoniyatlaridan to'liq foydalanish va e'lonlar berish uchun ro'yxatdan o'ting.</p>
              </div>
              <div class="flex items-center gap-2 w-full pt-1">
                <button onclick="window.AvtoHub.closeModal('avtohub-profile-modal'); window.AvtoHub.openAuthModal('register');" class="flex-1 py-2 bg-secondary text-white rounded-xl text-xs font-bold shadow hover:bg-secondary-container">
                  Ro'yxatdan o'tish
                </button>
                <button onclick="window.AvtoHub.closeModal('avtohub-profile-modal'); window.AvtoHub.openAuthModal('login');" class="flex-1 py-2 bg-surface-container-lowest border border-outline-variant text-on-surface rounded-xl text-xs font-semibold hover:bg-surface-container">
                  Kirish
                </button>
              </div>
            </div>
          `}

          <!-- Navigation Tabs -->
          <div class="flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
            <button onclick="window.AvtoHub.renderProfileContent('my_ads')" class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'my_ads' ? 'bg-surface-container-lowest text-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}">
              <span class="material-symbols-outlined text-base">directions_car</span>
              <span>E'lonlarim (${myAds.length})</span>
            </button>
            <button onclick="window.AvtoHub.renderProfileContent('favorites')" class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'favorites' ? 'bg-surface-container-lowest text-error shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}">
              <span class="material-symbols-outlined text-base">favorite</span>
              <span>Sevimlilar (${userFavorites.size})</span>
            </button>
            <button onclick="window.AvtoHub.renderProfileContent('settings')" class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'settings' ? 'bg-surface-container-lowest text-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}">
              <span class="material-symbols-outlined text-base">settings</span>
              <span>Sozlamalar</span>
            </button>
          </div>

          <!-- Tab 1: Mening E'lonlarim -->
          ${activeTab === 'my_ads' ? `
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase tracking-wider text-outline">Joylagan e'lonlaringiz</h4>
                <button onclick="window.AvtoHub.closeModal('avtohub-profile-modal'); window.AvtoHub.openPostAdModal()" class="text-xs font-semibold text-secondary hover:underline flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">add_circle</span>
                  <span>Yangi e'lon</span>
                </button>
              </div>

              ${myAds.length === 0 ? `
                <div class="p-6 text-center bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-2">
                  <span class="material-symbols-outlined text-4xl text-outline">no_crash</span>
                  <p class="text-xs font-medium text-on-surface">Siz hali birorta ham e'lon joylamadingiz.</p>
                  <button onclick="window.AvtoHub.closeModal('avtohub-profile-modal'); window.AvtoHub.openPostAdModal()" class="px-3 py-1.5 bg-secondary text-white rounded-lg text-xs font-semibold shadow">
                    E'lon joylash
                  </button>
                </div>
              ` : `
                <div class="space-y-2.5">
                  ${myAds.map(ad => `
                    <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex gap-3 relative">
                      <img src="${ad.image || resolveCarImage(ad)}" alt="${ad.title}" class="w-20 h-16 object-cover rounded-lg flex-shrink-0 bg-surface-container" onerror="this.onerror=null; this.src='${DEFAULT_CARS[0].image}';"/>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between">
                          <h5 class="text-xs font-bold text-on-surface truncate">${ad.title}</h5>
                          <span class="text-xs font-bold text-secondary ml-1">$${(ad.price || 0).toLocaleString()}</span>
                        </div>
                        <div class="flex items-center gap-2 mt-1 text-[11px]">
                          <span class="px-1.5 py-0.5 rounded ${ad.status === 'SOLD' ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-800'} font-semibold">
                            ${ad.status === 'SOLD' ? 'Sotilgan' : 'Faol'}
                          </span>
                          <span class="text-outline">${ad.views || 10} ko'rish</span>
                        </div>
                        <div class="flex items-center gap-2 mt-2 pt-1 border-t border-outline-variant/20">
                          ${ad.status !== 'SOLD' ? `
                            <button onclick="window.AvtoHub.markAdAsSold('${ad.id}')" class="text-[11px] font-semibold text-secondary hover:underline">
                              ✓ Sotildi deb belgilash
                            </button>
                          ` : ''}
                          <button onclick="window.AvtoHub.deleteMyAd('${ad.id}')" class="text-[11px] font-semibold text-error hover:underline ml-auto">
                            O'chirish
                          </button>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          ` : ''}

          <!-- Tab 2: Sevimlilar -->
          ${activeTab === 'favorites' ? `
            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-outline">Saqlangan avtomobillar</h4>
              ${userFavorites.size === 0 ? `
                <div class="p-6 text-center bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-2">
                  <span class="material-symbols-outlined text-4xl text-outline">favorite_border</span>
                  <p class="text-xs font-medium text-on-surface">Sevimlilar ro'yxati hozircha bo'sh.</p>
                  <p class="text-[11px] text-outline">Avtomobillardagi yurakcha belgisini bosing.</p>
                </div>
              ` : `
                <div class="space-y-2">
                  ${allCars.filter(c => userFavorites.has(String(c.id))).map(fav => `
                    <div onclick="window.AvtoHub.openCarModal(window.AvtoHub.getCarById('${fav.id}'))" class="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between cursor-pointer hover:bg-surface-container">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <img src="${fav.image || resolveCarImage(fav)}" class="w-12 h-12 object-cover rounded-lg flex-shrink-0" onerror="this.onerror=null; this.src='${DEFAULT_CARS[0].image}';"/>
                        <div class="min-w-0">
                          <h5 class="text-xs font-bold text-on-surface truncate">${fav.title}</h5>
                          <span class="text-xs font-bold text-secondary">$${fav.price.toLocaleString()}</span>
                        </div>
                      </div>
                      <button onclick="event.stopPropagation(); window.AvtoHub.toggleFavorite('${fav.id}', this)" class="p-1.5 text-error hover:scale-110">
                        <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">favorite</span>
                      </button>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          ` : ''}

          <!-- Tab 3: Sozlamalar & Admin -->
          ${activeTab === 'settings' ? `
            <div class="space-y-2 text-sm">
              <a href="/admin/" class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors text-left border border-outline-variant/30">
                <div class="flex items-center gap-2.5">
                  <span class="material-symbols-outlined text-amber-500 text-xl">admin_panel_settings</span>
                  <span class="font-medium text-on-surface">Django Admin Panel</span>
                </div>
                <span class="material-symbols-outlined text-sm text-outline">open_in_new</span>
              </a>

              <a href="/api/docs/" class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors text-left border border-outline-variant/30">
                <div class="flex items-center gap-2.5">
                  <span class="material-symbols-outlined text-blue-500 text-xl">api</span>
                  <span class="font-medium text-on-surface">Swagger API Hujjatlari</span>
                </div>
                <span class="material-symbols-outlined text-sm text-outline">open_in_new</span>
              </a>

              <button onclick="window.AvtoHub.toggleDarkMode()" class="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors text-left border border-outline-variant/30">
                <div class="flex items-center gap-2.5">
                  <span class="material-symbols-outlined text-purple-500 text-xl">dark_mode</span>
                  <span class="font-medium text-on-surface">Kunduzgi / Tungi rejim</span>
                </div>
                <span class="text-xs text-outline">Almashtirish</span>
              </button>

              ${currentUser ? `
                <button onclick="window.AvtoHub.handleLogout()" class="w-full py-2.5 text-error font-semibold rounded-xl bg-error/10 hover:bg-error/20 transition-colors text-sm flex items-center justify-center gap-1.5 mt-2">
                  <span class="material-symbols-outlined text-lg">logout</span>
                  <span>Tizimdan chiqish</span>
                </button>
              ` : `
                <button onclick="window.AvtoHub.closeModal('avtohub-profile-modal'); window.AvtoHub.openAuthModal('register');" class="w-full py-2.5 text-secondary font-semibold rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-colors text-sm flex items-center justify-center gap-1.5 mt-2">
                  <span class="material-symbols-outlined text-lg">login</span>
                  <span>Ro'yxatdan o'tish / Tizimga kirish</span>
                </button>
              `}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // 5.5 "AUTENTIFIKATSIYA" (REGISTRATION & LOGIN MODAL)
  function openAuthModal(initialTab = 'register', isRequired = false) {
    let modal = document.getElementById('avtohub-auth-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avtohub-auth-modal';
      modal.className = 'fixed inset-0 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md transition-opacity duration-200';
      modal.style.cssText = 'position: fixed; inset: 0; z-index: 99999; display: flex; align-items: center; justify-content: center; background-color: rgba(0,0,0,0.75);';
      document.body.appendChild(modal);
    } else {
      modal.style.display = 'flex';
    }

    renderAuthModalContent(initialTab, isRequired);

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        modal.remove();
      }
    };
  }

  function renderAuthModalContent(activeTab = 'register', isRequired = false) {
    const modal = document.getElementById('avtohub-auth-modal');
    if (!modal) return;

    const CITIES = [
      'Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Farg\'ona', 
      'Namangan', 'Qashqadaryo', 'Surxondaryo', 'Xorazm', 'Navoiy', 
      'Jizzax', 'Sirdaryo', 'Qoraqalpog\'iston'
    ];

    modal.innerHTML = `
      <div class="bg-surface-container-lowest max-w-md w-full max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col relative animate-in fade-in zoom-in-95 duration-150">
        <!-- Header -->
        <div class="p-4 border-b border-outline-variant/30 flex items-center justify-between sticky top-0 bg-surface-container-lowest z-10">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-secondary text-white flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-xl">${activeTab === 'register' ? 'how_to_reg' : 'login'}</span>
            </div>
            <div>
              <h3 class="font-headline-sm text-base font-bold text-on-surface">
                ${activeTab === 'register' ? 'Ro\'yxatdan o\'tish' : 'Tizimga kirish'}
              </h3>
              <p class="text-[11px] text-outline">
                ${isRequired ? 'Bu amalni bajarish uchun avval ro\'yxatdan o\'ting' : 'AvtoHub — O\'zbekiston avtomobil platformasi'}
              </p>
            </div>
          </div>
          <button onclick="window.AvtoHub.closeModal('avtohub-auth-modal')" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div class="p-5">
          <!-- Switch Tabs -->
          <div class="flex p-1 bg-surface-container-low rounded-xl border border-outline-variant/30 mb-4">
            <button type="button" onclick="window.AvtoHub.renderAuthModalContent('register', ${isRequired})" class="flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'register' ? 'bg-secondary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}">
              Ro'yxatdan o'tish
            </button>
            <button type="button" onclick="window.AvtoHub.renderAuthModalContent('login', ${isRequired})" class="flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'login' ? 'bg-secondary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}">
              Tizimga kirish
            </button>
          </div>

          <!-- Error Box -->
          <div id="auth-error-box" class="hidden mb-3.5 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-medium"></div>

          ${activeTab === 'register' ? `
            <!-- Register Form -->
            <form id="auth-register-form" onsubmit="window.AvtoHub.submitRegister(event)" class="space-y-3">
              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-xs font-semibold text-on-surface mb-1">Ismingiz *</label>
                  <input type="text" name="first_name" required placeholder="Masalan: Sardor" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-on-surface mb-1">Familiyangiz</label>
                  <input type="text" name="last_name" placeholder="Masalan: Aliyev" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-xs font-semibold text-on-surface mb-1">Yoshingiz *</label>
                  <input type="number" name="age" required min="16" max="120" placeholder="Masalan: 25" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-on-surface mb-1">Jinsingiz</label>
                  <select name="gender" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary">
                    <option value="M">Erkak</option>
                    <option value="F">Ayol</option>
                    <option value="O">Boshqa</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-on-surface mb-1">Shahar / Viloyat *</label>
                <select name="city" required class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary">
                  ${CITIES.map(c => `<option value="${c}" ${c === currentCity ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-on-surface mb-1">Telefon raqamingiz *</label>
                <input type="tel" name="phone" required placeholder="+998 90 123 45 67" value="+998" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-xs font-semibold text-on-surface mb-1">Parol *</label>
                  <input type="password" name="password" required minlength="6" placeholder="Kamida 6 ta belgi" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-on-surface mb-1">Parol qayta *</label>
                  <input type="password" name="password_confirm" required minlength="6" placeholder="Parolni tasdiqlang" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
                </div>
              </div>

              <button type="submit" id="auth-submit-btn" class="w-full mt-2 py-3 bg-secondary hover:bg-secondary-container text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-lg">check_circle</span>
                <span>Ro'yxatdan o'tish</span>
              </button>

              <div class="text-center pt-2">
                <p class="text-xs text-outline">
                  Hisobingiz bormi?
                  <button type="button" onclick="window.AvtoHub.renderAuthModalContent('login', ${isRequired})" class="text-secondary font-bold hover:underline ml-1">
                    Tizimga kirish
                  </button>
                </p>
              </div>
            </form>
          ` : `
            <!-- Login Form -->
            <form id="auth-login-form" onsubmit="window.AvtoHub.submitLogin(event)" class="space-y-3.5">
              <div>
                <label class="block text-xs font-semibold text-on-surface mb-1">Telefon raqamingiz *</label>
                <input type="tel" name="phone" required placeholder="+998 90 123 45 67" value="+998" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
              </div>

              <div>
                <label class="block text-xs font-semibold text-on-surface mb-1">Parolingiz *</label>
                <input type="password" name="password" required placeholder="Parolni kiriting" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-secondary focus:ring-1 focus:ring-secondary"/>
              </div>

              <button type="submit" id="auth-submit-btn" class="w-full mt-2 py-3 bg-secondary hover:bg-secondary-container text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-lg">login</span>
                <span>Tizimga kirish</span>
              </button>

              <div class="text-center pt-2">
                <p class="text-xs text-outline">
                  Profilingiz yo'qmi?
                  <button type="button" onclick="window.AvtoHub.renderAuthModalContent('register', ${isRequired})" class="text-secondary font-bold hover:underline ml-1">
                    Ro'yxatdan o'tish
                  </button>
                </p>
              </div>
            </form>
          `}
        </div>
      </div>
    `;
  }

  async function submitRegister(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('auth-submit-btn');
    const errorBox = document.getElementById('auth-error-box');
    if (errorBox) errorBox.classList.add('hidden');

    let phone = form.phone.value.trim().replace(/[\\s()-]/g, '');
    if (!phone.startsWith('+')) {
      if (phone.startsWith('998')) phone = '+' + phone;
      else phone = '+998' + phone;
    }

    const password = form.password.value;
    const password_confirm = form.password_confirm.value;
    const first_name = form.first_name.value.trim();
    const last_name = form.last_name.value.trim();
    const age = parseInt(form.age.value, 10);
    const city = form.city.value;
    const gender = form.gender.value;

    if (password !== password_confirm) {
      if (errorBox) {
        errorBox.textContent = "Parollar bir-biriga mos kelmadi!";
        errorBox.classList.remove('hidden');
      }
      return;
    }

    if (isNaN(age) || age < 16 || age > 120) {
      if (errorBox) {
        errorBox.textContent = "Yoshingiz 16 dan 120 gacha bo'lishi kerak.";
        errorBox.classList.remove('hidden');
      }
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Ro\'yxatdan o\'tilmoqda...';

    try {
      const res = await fetch('/api/v1/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          password,
          password_confirm,
          first_name,
          last_name,
          age,
          city,
          gender
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        currentUser = json.data.user;
        authToken = json.data.tokens.access;
        localStorage.setItem('avtohub_user', JSON.stringify(currentUser));
        localStorage.setItem('avtohub_token', authToken);
        updateAuthUI();
        closeModal('avtohub-auth-modal');
        showToast(`Xush kelibsiz, ${currentUser.first_name}! Ro'yxatdan muvaffaqiyatli o'tdingiz 🎉`, 'success');
        setTimeout(() => {
          openProfileModal('my_ads');
        }, 500);
      } else {
        let msg = json.message || "Ro'yxatdan o'tishda xatolik yuz berdi.";
        if (json.errors) {
          const errList = [];
          for (const key of Object.keys(json.errors)) {
            const val = json.errors[key];
            errList.push(Array.isArray(val) ? val.join(' ') : val);
          }
          if (errList.length > 0) msg = errList.join('; ');
        }
        if (errorBox) {
          errorBox.textContent = msg;
          errorBox.classList.remove('hidden');
        } else {
          showToast(msg, 'error');
        }
      }
    } catch (err) {
      console.error(err);
      if (errorBox) {
        errorBox.textContent = "Server bilan bog'lanishda xatolik yuz berdi.";
        errorBox.classList.remove('hidden');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-lg">check_circle</span> Ro\'yxatdan o\'tish';
      }
    }
  }

  async function submitLogin(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('auth-submit-btn');
    const errorBox = document.getElementById('auth-error-box');
    if (errorBox) errorBox.classList.add('hidden');

    let phone = form.phone.value.trim().replace(/[\\s()-]/g, '');
    if (!phone.startsWith('+')) {
      if (phone.startsWith('998')) phone = '+' + phone;
      else phone = '+998' + phone;
    }
    const password = form.password.value;

    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Kirilmoqda...';

    try {
      const res = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        currentUser = json.data.user;
        authToken = json.data.tokens.access;
        localStorage.setItem('avtohub_user', JSON.stringify(currentUser));
        localStorage.setItem('avtohub_token', authToken);
        updateAuthUI();
        closeModal('avtohub-auth-modal');
        showToast(`Xush kelibsiz, ${currentUser.first_name || currentUser.phone}! 👋`, 'success');
        setTimeout(() => {
          openProfileModal('my_ads');
        }, 500);
      } else {
        let msg = json.message || "Telefon yoki parol noto'g'ri.";
        if (json.errors) {
          const errList = [];
          for (const key of Object.keys(json.errors)) {
            const val = json.errors[key];
            errList.push(Array.isArray(val) ? val.join(' ') : val);
          }
          if (errList.length > 0) msg = errList.join('; ');
        }
        if (errorBox) {
          errorBox.textContent = msg;
          errorBox.classList.remove('hidden');
        } else {
          showToast(msg, 'error');
        }
      }
    } catch (err) {
      console.error(err);
      if (errorBox) {
        errorBox.textContent = "Server bilan bog'lanishda xatolik yuz berdi.";
        errorBox.classList.remove('hidden');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-lg">login</span> Tizimga kirish';
      }
    }
  }

  function handleLogout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('avtohub_user');
    localStorage.removeItem('avtohub_token');
    updateAuthUI();
    closeModal('avtohub-profile-modal');
    showToast("Tizimdan muvaffaqiyatli chiqildi.", 'info');
    setTimeout(() => {
      checkInitialAuthPrompt();
    }, 400);
  }

  function updateAuthUI() {
    currentUser = getCurrentUser();

    // 1. Guest Registration Banner right at top of content
    let guestBanner = document.getElementById('avtohub-guest-banner');
    const mainEl = document.querySelector('main');
    if (!currentUser) {
      if (!guestBanner && mainEl) {
        guestBanner = document.createElement('div');
        guestBanner.id = 'avtohub-guest-banner';
        guestBanner.className = 'w-full mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg flex items-center justify-between border border-blue-400/30 animate-in fade-in';
        guestBanner.innerHTML = `
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-xl">account_circle</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold leading-tight">Ro'yxatdan o'ting!</p>
              <p class="text-[11px] opacity-90 truncate">Ism, yosh va telefoningizni kiritib profilingizni yarating</p>
            </div>
          </div>
          <button onclick="window.AvtoHub.openAuthModal('register')" class="px-3 py-1.5 bg-white text-blue-700 font-bold text-xs rounded-xl shadow hover:bg-blue-50 active:scale-95 transition-all flex-shrink-0 ml-2">
            Ro'yxatdan o'tish
          </button>
        `;
        mainEl.insertBefore(guestBanner, mainEl.firstChild);
      }
    } else {
      if (guestBanner) guestBanner.remove();
    }

    // 2. Header auth pill
    const headers = document.querySelectorAll('header');
    headers.forEach(header => {
      let authBtn = header.querySelector('.header-auth-pill');
      if (!authBtn) {
        const trailing = header.querySelector('.flex.items-center:last-child');
        if (trailing) {
          authBtn = document.createElement('button');
          authBtn.className = 'header-auth-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all mr-1';
          trailing.insertBefore(authBtn, trailing.firstChild);
        }
      }
      if (authBtn) {
        if (currentUser) {
          authBtn.className = 'header-auth-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 mr-1 cursor-pointer';
          authBtn.innerHTML = `
            <span class="w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">${(currentUser.first_name || 'U').charAt(0).toUpperCase()}</span>
            <span class="max-w-[75px] truncate">${currentUser.first_name}</span>
          `;
          authBtn.onclick = (e) => {
            e.preventDefault();
            openProfileModal();
          };
        } else {
          authBtn.className = 'header-auth-pill flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-white hover:bg-primary/90 shadow-sm mr-1 cursor-pointer';
          authBtn.innerHTML = `
            <span class="material-symbols-outlined text-sm">login</span>
            <span>Kirish / Ro'yxatdan o'tish</span>
          `;
          authBtn.onclick = (e) => {
            e.preventDefault();
            openAuthModal('register');
          };
        }
      }
    });

    const profileModal = document.getElementById('avtohub-profile-modal');
    if (profileModal) {
      renderProfileContent();
    }
  }

  function checkInitialAuthPrompt() {
    currentUser = getCurrentUser();
    if (!currentUser) {
      setTimeout(() => {
        if (!document.getElementById('avtohub-auth-modal')) {
          openAuthModal('register', false);
        }
      }, 300);
    }
  }

  function deleteMyAd(id) {
    if (confirm("Rostdan ham bu e'lonni o'chirmoqchimisiz?")) {
      myAds = myAds.filter(a => String(a.id) !== String(id));
      localStorage.setItem('avtohub_user_my_ads', JSON.stringify(myAds));
      allCars = allCars.filter(c => String(c.id) !== String(id));
      renderProfileContent('my_ads');
      renderCars();
      showToast("E'lon o'chirildi.");
    }
  }

  function markAdAsSold(id) {
    const found = myAds.find(a => String(a.id) === String(id));
    if (found) {
      found.status = 'SOLD';
      found.statusDisplay = 'Sotilgan';
      localStorage.setItem('avtohub_user_my_ads', JSON.stringify(myAds));
      renderProfileContent('my_ads');
      showToast("E'lon 'Sotilgan' deb belgilandi! ✅");
    }
  }

  function getCarById(id) {
    return allCars.find(c => String(c.id) === String(id)) || DEFAULT_CARS[0];
  }

  // 6. "XABARLAR" (MESSAGES) MODAL
  function openMessagesModal() {
    let modal = document.getElementById('avtohub-messages-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avtohub-messages-modal';
      modal.className = 'fixed inset-0 z-[9990] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm transition-opacity duration-200';
      document.body.appendChild(modal);
    }

    renderMessagesContent();

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  function renderMessagesContent() {
    const modal = document.getElementById('avtohub-messages-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="bg-surface-container-lowest max-w-lg w-full h-[85vh] rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <!-- Header -->
        <div class="p-3.5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-2xl">chat</span>
            <div>
              <h3 class="font-headline-sm text-base font-bold text-on-surface">Xabarlar & Muloqot</h3>
              <p class="text-[11px] text-outline">Sotuvchilar va xaridorlar bilan xavfsiz chat</p>
            </div>
          </div>
          <button onclick="window.AvtoHub.closeModal('avtohub-messages-modal')" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div class="flex-1 flex overflow-hidden">
          <!-- Chat List Sidebar -->
          <div class="w-5/12 border-r border-outline-variant/30 flex flex-col bg-surface-container-low overflow-y-auto">
            <div class="p-2 border-b border-outline-variant/20">
              <input type="text" placeholder="Qidirish..." class="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-2.5 py-1 text-xs"/>
            </div>
            <div class="divide-y divide-outline-variant/20 flex-1">
              ${chatHistory.map(chat => `
                <div onclick="window.AvtoHub.selectChat('${chat.id}')" class="p-2.5 cursor-pointer hover:bg-surface-container transition-colors ${currentActiveChat.id === chat.id ? 'bg-surface-container border-l-4 border-secondary' : ''}">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-secondary text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      ${chat.avatar}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-on-surface truncate">${chat.sender}</span>
                        <span class="text-[10px] text-outline">${chat.time}</span>
                      </div>
                      <p class="text-[11px] text-outline truncate">${chat.lastMessage}</p>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Active Conversation -->
          <div class="flex-1 flex flex-col bg-surface-container-lowest">
            <div class="p-2.5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-secondary text-white font-bold text-xs flex items-center justify-center">
                  ${currentActiveChat.avatar}
                </div>
                <div>
                  <h4 class="text-xs font-bold text-on-surface">${currentActiveChat.sender}</h4>
                  <span class="text-[10px] text-green-600 flex items-center gap-1 font-medium">● Onlayn</span>
                </div>
              </div>
              <button onclick="window.AvtoHub.showToast('Qo\\'ng\\'iroq amalga oshirilmoqda...')" class="p-1 rounded-lg text-secondary hover:bg-surface-container">
                <span class="material-symbols-outlined text-lg">call</span>
              </button>
            </div>

            <!-- Messages Stream -->
            <div id="chat-messages-container" class="flex-1 p-3 overflow-y-auto space-y-2.5">
              ${currentActiveChat.messages.map(msg => `
                <div class="flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}">
                  <div class="max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-sm ${msg.from === 'me' ? 'bg-secondary text-white rounded-br-none' : 'bg-surface-container text-on-surface rounded-bl-none'}">
                    <p>${msg.text}</p>
                    <span class="text-[9px] block text-right mt-0.5 opacity-70">${msg.time}</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Input Bar -->
            <form onsubmit="window.AvtoHub.sendChatMessage(event)" class="p-2 border-t border-outline-variant/20 flex items-center gap-2 bg-surface-container-low">
              <input type="text" id="chat-input-text" placeholder="Xabaringizni yozing..." required class="flex-1 bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-secondary"/>
              <button type="submit" class="w-8 h-8 rounded-xl bg-secondary text-white flex items-center justify-center hover:bg-secondary-container">
                <span class="material-symbols-outlined text-base">send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    const stream = document.getElementById('chat-messages-container');
    if (stream) stream.scrollTop = stream.scrollHeight;
  }

  function selectChat(id) {
    const found = chatHistory.find(c => c.id === id);
    if (found) {
      currentActiveChat = found;
      renderMessagesContent();
    }
  }

  function openDirectChat(sellerName, carTitle) {
    let found = chatHistory.find(c => c.sender === sellerName);
    if (!found) {
      found = {
        id: 'chat-' + Date.now(),
        sender: sellerName,
        avatar: sellerName.charAt(0),
        lastMessage: `${carTitle} bo'yicha suhbat boshlandi.`,
        time: 'Hozir',
        unread: 0,
        messages: [
          { from: 'me', text: `Assalomu alaykum! Men "${carTitle}" e'loningiz bo'yicha bog'lanmoqdaman.`, time: 'Hozir' }
        ]
      };
      chatHistory.unshift(found);
    }
    currentActiveChat = found;
    closeModal('avtohub-car-modal');
    openMessagesModal();
  }

  function sendChatMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input-text');
    const text = input.value.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentActiveChat.messages.push({ from: 'me', text: text, time: time });
    currentActiveChat.lastMessage = text;
    currentActiveChat.time = time;
    input.value = '';

    renderMessagesContent();

    setTimeout(() => {
      const replies = [
        'Rahmat, tez orada sizga to\'liq javob beramiz!',
        'Ha, mashina hali sotuvda. Kelib ko\'rishingiz mumkin.',
        'Narxida ozgina kelishish joyi bor.',
        'Hujjatlari 100% tayyor, notarius orqali rasmiylashtiriladi.'
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      currentActiveChat.messages.push({
        from: 'them',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      currentActiveChat.lastMessage = reply;
      renderMessagesContent();
    }, 1200);
  }

  // 7. LOAD MORE CARS
  function loadMoreCars(btn) {
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Yuklanmoqda...';

    setTimeout(() => {
      const extraCars = [
        {
          id: 'byd-chazor-2023',
          title: 'BYD Chazor 05 DM-i Champion',
          brand: 'BYD',
          model: 'Chazor',
          year: 2023,
          price: 19800,
          priceUzs: '251 mln so\'m',
          mileage: 14000,
          color: 'Kulrang',
          fuel: 'Gibrid (DM-i)',
          transmission: 'Avtomat',
          city: 'Toshkent',
          dealer: 'Megavat Auto',
          rating: 4.8,
          image: DEFAULT_CARS[1].image,
          isVip: false,
          isVerified: true,
          views: 180,
          phone: '+998 90 333 44 55',
          description: '120km elektr rejimda, umumiy 1200km yuradi. Juda tejamkor.'
        },
        {
          id: 'chevrolet-onix-2023',
          title: 'Chevrolet Onix Premier 2 Turbo',
          brand: 'Chevrolet',
          model: 'Onix',
          year: 2023,
          price: 16500,
          priceUzs: '209 mln so\'m',
          mileage: 19000,
          color: 'Qora',
          fuel: 'Benzin',
          transmission: 'Avtomat',
          city: 'Buxoro',
          dealer: 'Buxoro Avto',
          rating: 4.7,
          image: DEFAULT_CARS[3].image,
          isVip: false,
          isVerified: true,
          views: 240,
          phone: '+998 93 444 55 66',
          description: 'Premier eng to\'liq versiya. Lyuk, orqa kamera, kruiz kontrol.'
        }
      ];

      allCars.push(...extraCars);
      renderCars();
      btn.disabled = false;
      btn.innerHTML = originalText;
      showToast("Yana yangi e'lonlar yuklandi! 🚗");
    }, 800);
  }

  // 8. VIEW MODE TOGGLE (List vs Grid)
  function setViewMode(mode, btn) {
    viewMode = mode;
    const listBtn = document.getElementById('view-mode-list-btn');
    const gridBtn = document.getElementById('view-mode-grid-btn');

    if (listBtn && gridBtn) {
      if (mode === 'grid') {
        gridBtn.classList.add('bg-surface-container-lowest', 'text-secondary', 'shadow-xs');
        gridBtn.classList.remove('text-on-surface-variant');
        listBtn.classList.remove('bg-surface-container-lowest', 'text-secondary', 'shadow-xs');
        listBtn.classList.add('text-on-surface-variant');
      } else {
        listBtn.classList.add('bg-surface-container-lowest', 'text-secondary', 'shadow-xs');
        listBtn.classList.remove('text-on-surface-variant');
        gridBtn.classList.remove('bg-surface-container-lowest', 'text-secondary', 'shadow-xs');
        gridBtn.classList.add('text-on-surface-variant');
      }
    }

    renderCars();
    showToast(mode === 'grid' ? "Jadval ko'rinishiga o'tildi" : "Karta ko'rinishiga o'tildi");
  }

  // 9. TOGGLE SORTING
  function toggleSort(btn) {
    const label = document.getElementById('marketplace-sort-label');
    if (currentFilter.sortBy === 'newest') {
      currentFilter.sortBy = 'price_asc';
      if (label) label.innerText = 'Arzondan qimmatga';
      showToast('Narxi: Arzondan qimmatga');
    } else if (currentFilter.sortBy === 'price_asc') {
      currentFilter.sortBy = 'price_desc';
      if (label) label.innerText = 'Qimmatdan arzonga';
      showToast('Narxi: Qimmatdan arzonga');
    } else if (currentFilter.sortBy === 'price_desc') {
      currentFilter.sortBy = 'views';
      if (label) label.innerText = 'Ko\'p ko\'rilganlar';
      showToast('Eng ommabop e\'lonlar');
    } else {
      currentFilter.sortBy = 'newest';
      if (label) label.innerText = 'Yangi e\'lonlar';
      showToast('Eng yangi e\'lonlar');
    }
    renderCars();
  }

  // 10. ADVANCED FILTERS MODAL
  function openFilterModal() {
    let modal = document.getElementById('avtohub-filter-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avtohub-filter-modal';
      modal.className = 'fixed inset-0 z-[9990] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm transition-opacity duration-200';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-surface-container-lowest max-w-sm w-full rounded-2xl shadow-2xl border border-outline-variant/30 p-5 space-y-4 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between pb-2 border-b border-outline-variant/30">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-2xl">tune</span>
            <h3 class="font-headline-sm text-base font-bold text-on-surface">Kengaytirilgan Filtrlar</h3>
          </div>
          <button onclick="window.AvtoHub.closeModal('avtohub-filter-modal')" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold mb-1 text-on-surface">Marka</label>
            <select id="adv-filter-brand" class="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl p-2 font-medium">
              <option value="">Barcha markalar</option>
              ${Object.keys(BRAND_MODELS).map(b => `<option value="${b}" ${currentFilter.brand === b ? 'selected' : ''}>${b}</option>`).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-semibold mb-1 text-on-surface">Min narx ($)</label>
              <input type="number" id="adv-filter-min-price" value="${currentFilter.minPrice}" class="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl p-2"/>
            </div>
            <div>
              <label class="block font-semibold mb-1 text-on-surface">Max narx ($)</label>
              <input type="number" id="adv-filter-max-price" value="${currentFilter.maxPrice}" class="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl p-2"/>
            </div>
          </div>

          <div>
            <label class="block font-semibold mb-1 text-on-surface">Yoqilg'i turi</label>
            <select id="adv-filter-fuel" class="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl p-2 font-medium">
              <option value="">Barchasi</option>
              <option value="Benzin">Benzin</option>
              <option value="Gaz">Gaz</option>
              <option value="Elektr">Elektr</option>
              <option value="Gibrid">Gibrid</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold mb-1 text-on-surface">Uzatmalar qutisi</label>
            <select id="adv-filter-trans" class="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl p-2 font-medium">
              <option value="">Barchasi</option>
              <option value="Avtomat">Avtomat</option>
              <option value="Mexanika">Mexanika</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-2">
          <button onclick="window.AvtoHub.resetFilters(); window.AvtoHub.closeModal('avtohub-filter-modal')" class="py-2.5 bg-surface-container text-on-surface font-semibold rounded-xl text-xs">
            Tozalash
          </button>
          <button onclick="window.AvtoHub.applyAdvancedFilters()" class="py-2.5 bg-secondary text-white font-semibold rounded-xl text-xs shadow">
            Filtrni qo'llash
          </button>
        </div>
      </div>
    `;

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  function applyAdvancedFilters() {
    currentFilter.brand = document.getElementById('adv-filter-brand').value;
    currentFilter.minPrice = parseFloat(document.getElementById('adv-filter-min-price').value) || 0;
    currentFilter.maxPrice = parseFloat(document.getElementById('adv-filter-max-price').value) || 999999;
    currentFilter.fuel = document.getElementById('adv-filter-fuel').value;
    currentFilter.transmission = document.getElementById('adv-filter-trans').value;

    closeModal('avtohub-filter-modal');
    renderCars();
    showToast("Filtrlar muvaffaqiyatli qo'llandi!");
  }

  // 11. LOCATION MODAL
  function openLocationModal() {
    let modal = document.getElementById('avtohub-location-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avtohub-location-modal';
      modal.className = 'fixed inset-0 z-[9990] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm transition-opacity duration-200';
      document.body.appendChild(modal);
    }

    const cities = [
      'Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Farg\'ona',
      'Namangan', 'Qashqadaryo', 'Surxondaryo', 'Xorazm', 'Navoiy', 'Jizzax', 'Sirdaryo'
    ];

    modal.innerHTML = `
      <div class="bg-surface-container-lowest max-w-sm w-full rounded-2xl shadow-2xl border border-outline-variant/30 p-5 space-y-3 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between pb-2 border-b border-outline-variant/30">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-2xl">location_on</span>
            <h3 class="font-headline-sm text-base font-bold text-on-surface">Shaharni tanlang</h3>
          </div>
          <button onclick="window.AvtoHub.closeModal('avtohub-location-modal')" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pt-1">
          ${cities.map(city => `
            <button onclick="window.AvtoHub.selectCity('${city}')" class="p-2.5 rounded-xl border text-sm font-medium text-left transition-colors ${currentCity === city ? 'bg-secondary text-white border-secondary' : 'bg-surface-container-low text-on-surface border-outline-variant/40 hover:bg-surface-container'}">
              ${city}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  function selectCity(city) {
    currentCity = city;
    closeModal('avtohub-location-modal');

    document.querySelectorAll('[data-icon="location_on"] + span, header button span:last-child').forEach(el => {
      if (el && el.innerText.length < 15) {
        el.innerText = city;
      }
    });

    const cityLabel = document.getElementById('quick-filter-city-label');
    if (cityLabel) cityLabel.innerText = city;

    showToast(`Hudud tanlandi: ${city}`);
  }

  // 12. NOTIFICATIONS MODAL
  function openNotificationsModal() {
    let modal = document.getElementById('avtohub-notif-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avtohub-notif-modal';
      modal.className = 'fixed inset-0 z-[9990] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm transition-opacity duration-200';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-surface-container-lowest max-w-sm w-full rounded-2xl shadow-2xl border border-outline-variant/30 p-5 space-y-3 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between pb-2 border-b border-outline-variant/30">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-2xl">notifications</span>
            <h3 class="font-headline-sm text-base font-bold text-on-surface">Bildirishnomalar</h3>
          </div>
          <button onclick="window.AvtoHub.closeModal('avtohub-notif-modal')" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div class="space-y-2 max-h-72 overflow-y-auto">
          <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-2.5">
            <span class="material-symbols-outlined text-secondary text-xl mt-0.5">verified</span>
            <div>
              <div class="text-xs font-bold text-on-surface">AI Tekshiruv yakunlandi</div>
              <p class="text-[11px] text-outline mt-0.5">Siz saqlagan avtomobil rasmlari va VIN raqami 100% haqiqiy deb topildi.</p>
              <span class="text-[9px] text-outline mt-1 block">15 daqiqa oldin</span>
            </div>
          </div>

          <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-2.5">
            <span class="material-symbols-outlined text-green-600 text-xl mt-0.5">price_change</span>
            <div>
              <div class="text-xs font-bold text-on-surface">Narx tushishi!</div>
              <p class="text-[11px] text-outline mt-0.5">Chevrolet Malibu 2 Premier narxi $500 ga arzonlashtirildi.</p>
              <span class="text-[9px] text-outline mt-1 block">Bugun, 10:30</span>
            </div>
          </div>

          <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-2.5">
            <span class="material-symbols-outlined text-blue-500 text-xl mt-0.5">handshake</span>
            <div>
              <div class="text-xs font-bold text-on-surface">Yangi taklif</div>
              <p class="text-[11px] text-outline mt-0.5">BYD Sergeli dileri sizga qulay avtokredit taklifini yubordi.</p>
              <span class="text-[9px] text-outline mt-1 block">Kecha</span>
            </div>
          </div>
        </div>

        <button onclick="window.AvtoHub.closeModal('avtohub-notif-modal'); window.AvtoHub.showToast('Barcha bildirishnomalar o\'qildi deb belgilandi')" class="w-full py-2 bg-surface-container text-on-surface font-semibold text-xs rounded-xl">
          Barchasini o'qilgan deb belgilash
        </button>
      </div>
    `;

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  // 13. SERVICE MODAL
  function openServiceModal() {
    let modal = document.getElementById('avtohub-service-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avtohub-service-modal';
      modal.className = 'fixed inset-0 z-[9990] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm transition-opacity duration-200';
      document.body.appendChild(modal);
    }

    const services = [
      { name: 'Moy va filtr almashtirish', time: '40 daqiqa', price: '80 000 so\'m', icon: 'oil_barrel' },
      { name: 'Kompyuter diagnostikasi', time: '30 daqiqa', price: '120 000 so\'m', icon: 'laptop_car' },
      { name: 'Tormoz kolodkalarini yangilash', time: '1 soat', price: '90 000 so\'m', icon: 'car_repair' },
      { name: 'Razval-sxojdeniye (3D)', time: '45 daqiqa', price: '150 000 so\'m', icon: 'tire_repair' },
      { name: 'Konditsioner freon to\'ldirish', time: '30 daqiqa', price: '180 000 so\'m', icon: 'ac_unit' }
    ];

    modal.innerHTML = `
      <div class="bg-surface-container-lowest max-w-md w-full rounded-2xl shadow-2xl border border-outline-variant/30 p-5 space-y-3 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between pb-2 border-b border-outline-variant/30">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-2xl">build</span>
            <div>
              <h3 class="font-headline-sm text-base font-bold text-on-surface">Avtoservis & Usta Band Qilish</h3>
              <p class="text-[11px] text-outline">Kafolatlangan servis xizmatlari</p>
            </div>
          </div>
          <button onclick="window.AvtoHub.closeModal('avtohub-service-modal')" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div class="space-y-2 max-h-72 overflow-y-auto">
          ${services.map(s => `
            <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-secondary text-2xl">${s.icon}</span>
                <div>
                  <h4 class="text-xs font-bold text-on-surface">${s.name}</h4>
                  <div class="text-[11px] text-outline">${s.time} • <span class="font-semibold text-secondary">${s.price}</span></div>
                </div>
              </div>
              <button onclick="window.AvtoHub.bookService('${s.name}')" class="px-3 py-1.5 bg-secondary text-white rounded-lg text-xs font-semibold shadow hover:bg-secondary-container active:scale-95">
                Yozilish
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  function bookService(serviceName) {
    closeModal('avtohub-service-modal');
    showToast(`"${serviceName}" uchun vaqt band qilindi! Usta siz bilan bog'lanadi.`);
  }

  // 14. PARTS MODAL
  function openPartsModal() {
    let modal = document.getElementById('avtohub-parts-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avtohub-parts-modal';
      modal.className = 'fixed inset-0 z-[9990] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm transition-opacity duration-200';
      document.body.appendChild(modal);
    }

    const parts = [
      { name: 'Motul 5W-30 Dvigatel moyi (4L)', price: '480 000 so\'m', car: 'Cobalt / Gentra / Malibu' },
      { name: 'Original Tormoz kolodkasi (Old)', price: '210 000 so\'m', car: 'Chevrolet Cobalt' },
      { name: 'Varta Silver 60Ah Akkumulyator', price: '850 000 so\'m', car: 'Barcha modellarga' },
      { name: 'Havo va salon filtri to\'plami', price: '95 000 so\'m', car: 'BYD Song Plus' },
      { name: 'Brembo Sport Tormoz diski', price: '640 000 so\'m', car: 'Kia K5 / Hyundai' }
    ];

    modal.innerHTML = `
      <div class="bg-surface-container-lowest max-w-md w-full rounded-2xl shadow-2xl border border-outline-variant/30 p-5 space-y-3 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between pb-2 border-b border-outline-variant/30">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-2xl">settings</span>
            <div>
              <h3 class="font-headline-sm text-base font-bold text-on-surface">Ehtiyot Qismlar Do'koni</h3>
              <p class="text-[11px] text-outline">Original va sifatli avto ehtiyot qismlar</p>
            </div>
          </div>
          <button onclick="window.AvtoHub.closeModal('avtohub-parts-modal')" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div class="space-y-2 max-h-72 overflow-y-auto">
          ${parts.map(p => `
            <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between">
              <div>
                <h4 class="text-xs font-bold text-on-surface">${p.name}</h4>
                <div class="text-[11px] text-outline">${p.car}</div>
                <div class="text-xs font-bold text-secondary mt-0.5">${p.price}</div>
              </div>
              <button onclick="window.AvtoHub.orderPart('${p.name}')" class="px-3 py-1.5 bg-secondary text-white rounded-lg text-xs font-semibold shadow hover:bg-secondary-container active:scale-95 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">shopping_cart</span>
                <span>Buyurtma</span>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  function orderPart(partName) {
    closeModal('avtohub-parts-modal');
    showToast(`"${partName}" savatga qo'shildi! Yetkazib berish 2 soat ichida.`);
  }

  // 15. CALCULATOR MODAL
  function openCalculatorModal(carPrice = 20000) {
    let modal = document.getElementById('avtohub-calc-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'avtohub-calc-modal';
      modal.className = 'fixed inset-0 z-[9990] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm transition-opacity duration-200';
      document.body.appendChild(modal);
    }

    const initialPay = Math.round(carPrice * 0.25);
    const loanAmount = carPrice - initialPay;
    const monthlyPay = Math.round((loanAmount * 1.24) / 36);

    modal.innerHTML = `
      <div class="bg-surface-container-lowest max-w-md w-full rounded-2xl shadow-2xl border border-outline-variant/30 p-5 space-y-4 relative animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between pb-3 border-b border-outline-variant/30">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-2xl">calculate</span>
            <h3 class="font-headline-sm text-base font-bold text-on-surface">Avtokredit kalkulyatori</h3>
          </div>
          <button onclick="window.AvtoHub.closeModal('avtohub-calc-modal')" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-outline mb-1">Avtomobil narxi ($)</label>
            <input type="number" id="calc-price" value="${carPrice}" oninput="window.AvtoHub.recalc()" class="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3 py-2 font-bold text-lg text-secondary"/>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="p-3 bg-surface-container-low rounded-xl">
              <div class="text-outline">Boshlang'ich to'lov (25%)</div>
              <div id="calc-initial" class="font-bold text-base text-on-surface mt-1">$${initialPay.toLocaleString()}</div>
            </div>
            <div class="p-3 bg-surface-container-low rounded-xl">
              <div class="text-outline">Muddati / Foiz</div>
              <div class="font-bold text-base text-on-surface mt-1">36 oy / 24%</div>
            </div>
          </div>

          <div class="p-4 bg-secondary-fixed/30 border border-secondary rounded-xl text-center">
            <div class="text-xs text-secondary font-medium">Oylik to'lov taxminan:</div>
            <div id="calc-monthly" class="text-2xl font-black text-secondary mt-1">$${monthlyPay.toLocaleString()} / oy</div>
            <div class="text-[11px] text-outline mt-1">Bank komissiyalari hisobga olinmagan</div>
          </div>
        </div>

        <button onclick="window.AvtoHub.closeModal('avtohub-calc-modal'); window.AvtoHub.showToast('Kredit arizangiz bankka yo\\'llandi! Mutaxassis bog\\'lanadi.')" class="w-full py-3 bg-secondary text-white font-bold rounded-xl shadow active:scale-95 transition-all">
          Kreditga ariza topshirish
        </button>
      </div>
    `;

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }

  function recalc() {
    const p = parseFloat(document.getElementById('calc-price').value) || 0;
    const initial = Math.round(p * 0.25);
    const loan = p - initial;
    const monthly = Math.round((loan * 1.24) / 36);

    document.getElementById('calc-initial').innerText = `$${initial.toLocaleString()}`;
    document.getElementById('calc-monthly').innerText = `$${monthly.toLocaleString()} / oy`;
  }

  // 16. AI SEARCH
  function runAISearch(promptText) {
    const text = (promptText || '').toLowerCase();
    showToast("GPT-Auto v4 sun'iy intellekti tahlil qilmoqda... ⚡");

    setTimeout(() => {
      if (text.includes('suv') || text.includes('krossover')) {
        currentFilter.brand = '';
        currentFilter.model = '';
        currentFilter.search = 'Tracker';
      } else if (text.includes('elektro') || text.includes('arzon') || text.includes('tejamkor')) {
        currentFilter.brand = 'BYD';
        currentFilter.model = '';
        currentFilter.search = '';
      } else if (text.includes('gibrid')) {
        currentFilter.brand = '';
        currentFilter.model = '';
        currentFilter.search = 'Hybrid';
      } else {
        currentFilter.search = promptText;
      }
      renderCars();
      showToast("AI sizga mos keladigan eng maqbul avtomobillarni topdi! 🎯");
    }, 600);
  }

  // Favorite toggle
  function toggleFavorite(id, btn) {
    const strId = String(id);
    const icon = btn.querySelector('.material-symbols-outlined');
    if (userFavorites.has(strId)) {
      userFavorites.delete(strId);
      btn.classList.remove('text-error');
      btn.classList.add('text-outline');
      if (icon) icon.style.fontVariationSettings = "'FILL' 0";
      showToast("E'lon saqlanganlardan olib tashlandi");
    } else {
      userFavorites.add(strId);
      btn.classList.add('text-error');
      btn.classList.remove('text-outline');
      if (icon) icon.style.fontVariationSettings = "'FILL' 1";
      showToast("E'lon sevimlilarga saqlandi! ❤️");
    }
    localStorage.setItem('avtohub_user_favorites', JSON.stringify(Array.from(userFavorites)));
  }

  function handleCall(phone) {
    showToast(`Bog'lanish raqami: ${phone}`);
  }

  function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    showToast(isDark ? "Tungi rejim yoqildi 🌙" : "Kunduzgi rejim yoqildi ☀️");
  }

  function resetFilters() {
    currentFilter = {
      search: '',
      brand: '',
      model: '',
      sortBy: 'newest',
      minPrice: 0,
      maxPrice: 200000,
      minYear: 2000,
      fuel: '',
      transmission: '',
      verifiedOnly: false
    };

    const brandLabel = document.getElementById('quick-filter-brand-label');
    if (brandLabel) brandLabel.innerText = 'Marka';
    const modelLabel = document.getElementById('quick-filter-model-label');
    if (modelLabel) modelLabel.innerText = 'Model';
    const cityLabel = document.getElementById('quick-filter-city-label');
    if (cityLabel) cityLabel.innerText = 'Viloyat';

    document.querySelectorAll('input[type="text"]').forEach(i => i.value = '');
    document.querySelectorAll('.border-secondary').forEach(p => p.classList.remove('border-secondary', 'bg-secondary-fixed/20'));

    renderCars();
    showToast("Barcha filtrlar tozalandi");
  }

  // Setup DOM Event Listeners
  function initListeners() {
    // 1. Bottom Nav
    document.querySelectorAll('nav a, nav button').forEach(el => {
      const text = el.innerText || el.getAttribute('title') || '';
      if (text.includes("E'lon berish") || text.includes("E’lon berish")) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          openPostAdModal();
        });
      } else if (text.includes("Xabarlar")) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          openMessagesModal();
        });
      } else if (text.includes("Profil")) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          openProfileModal();
        });
      }
    });

    // 2. Header Buttons
    document.querySelectorAll('header button').forEach(btn => {
      const html = btn.innerHTML || '';
      if (html.includes('location_on')) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openLocationModal();
        });
      } else if (html.includes('notifications')) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openNotificationsModal();
        });
      }
    });

    // 3. Search Inputs
    const searchInputs = document.querySelectorAll(
      'input[placeholder*="Mashina"], input[placeholder*="Qidir"], input[placeholder*="izlash"], input[placeholder*="Marka, model"]'
    );
    searchInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        currentFilter.search = e.target.value;
        renderCars();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          currentFilter.search = e.target.value;
          renderCars();
        }
      });
    });

    // 4. Brand Pills
    const brandElements = document.querySelectorAll('[class*="Brand Pill"], .flex-shrink-0.flex.items-center.gap-2.px-3');
    brandElements.forEach(pill => {
      pill.addEventListener('click', () => {
        const brandName = pill.innerText.replace(/[\n\r]+/g, ' ').trim().split(' ')[0];
        if (currentFilter.brand === brandName) {
          selectBrand('');
          pill.classList.remove('border-secondary', 'bg-secondary-fixed/20');
        } else {
          selectBrand(brandName);
          brandElements.forEach(p => p.classList.remove('border-secondary', 'bg-secondary-fixed/20'));
          pill.classList.add('border-secondary', 'bg-secondary-fixed/20');
        }
      });
    });

    // 5. AI Search buttons
    document.querySelectorAll('button:has([data-icon="auto_awesome"]), button').forEach(btn => {
      if (btn.innerText && btn.innerText.includes('AI orqali qidirish')) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const aiInput = document.querySelector('section.w-full input[value*="20,000"]');
          const val = aiInput ? aiInput.value : 'krossover';
          runAISearch(val);
        });
      }
    });

    // AI tags
    document.querySelectorAll('.overflow-x-auto button').forEach(btn => {
      const text = btn.innerText || '';
      if (text.includes('SUV') || text.includes('elektrokar')) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          runAISearch(text);
        });
      }
    });

    // Marketplace Filter Chips
    document.querySelectorAll('.mt-space-sm.-mx-margin button').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.innerText.trim();
        if (text.includes('Barcha markalar')) {
          selectBrand('');
        } else if (text.includes('Chevrolet')) {
          selectBrand('Chevrolet');
        } else if (text.includes('BYD')) {
          selectBrand('BYD');
        } else if (text.includes('10k')) {
          currentFilter.minPrice = 10000;
          currentFilter.maxPrice = 30000;
          renderCars();
          showToast('$10,000 - $30,000 narx oralig\'i qo\'llandi');
        } else if (text.includes('2021')) {
          currentFilter.minYear = 2021;
          renderCars();
          showToast('2021-yildan yangi avtomobillar');
        } else if (text.includes('tekshirilganlar')) {
          showToast('Faqat AI tomonidan tekshirilganlar');
        }
      });
    });
  }

  // Global window API
  window.AvtoHub = {
    loadCars,
    renderCars,
    openBrandPickerModal,
    selectBrand,
    openModelPickerModal,
    selectModel,
    openCarModal,
    openPostAdModal,
    handleImagePreview,
    clearImagePreview,
    handleBrandChangeInForm,
    openMessagesModal,
    openProfileModal,
    renderProfileContent,
    deleteMyAd,
    markAdAsSold,
    getCarById,
    openLocationModal,
    openNotificationsModal,
    openServiceModal,
    openPartsModal,
    openCalculatorModal,
    openFilterModal,
    openDirectChat,
    selectChat,
    sendChatMessage,
    selectCity,
    bookService,
    orderPart,
    closeModal,
    submitAd,
    recalc,
    loadMoreCars,
    setViewMode,
    toggleSort,
    applyAdvancedFilters,
    runAISearch,
    toggleFavorite,
    handleCall,
    handleLogout,
    openAuthModal,
    renderAuthModalContent,
    submitRegister,
    submitLogin,
    updateAuthUI,
    toggleDarkMode,
    showToast,
    resetFilters
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initListeners();
      loadCars();
      updateAuthUI();
      checkInitialAuthPrompt();
    });
  } else {
    initListeners();
    loadCars();
    updateAuthUI();
    checkInitialAuthPrompt();
  }
})();
