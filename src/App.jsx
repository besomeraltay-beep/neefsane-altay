import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import AdminLoginPage from './components/AdminLoginPage';
import Toast from './components/Toast';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { 
  getProducts, 
  saveProduct, 
  deleteProduct, 
  getOrders, 
  updateOrder, 
  deleteOrder, 
  createOrder,
  getCoupons, 
  saveCoupon, 
  deleteCoupon, 
  getStoreSettings, 
  saveStoreSettings 
} from './services/db';

const ADMIN_SECURE_TOKEN = '5c10a2af96cf45ee5e994a408c48a744a73d3290f4b4258adb4386849cee52df';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('neefsane_admin_session_token') === ADMIN_SECURE_TOKEN;
  });

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('neefsane_catalog_v5');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('neefsane_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem('neefsane_coupons_v1');
      return saved ? JSON.parse(saved) : [
        { id: 'c1', code: 'HOSGELDIN10', type: 'percent', value: 0.10, label: '%10 İlk Sipariş İndirimi', minSpend: 0, isActive: true },
        { id: 'c2', code: 'EFSANE10', type: 'percent', value: 0.10, label: '%10 Özel İndirim', minSpend: 300, isActive: true },
        { id: 'c3', code: 'NEEF20', type: 'percent', value: 0.20, label: '%20 Lansman İndirimi', minSpend: 600, isActive: true }
      ];
    } catch {
      return [];
    }
  });

  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('neefsane_settings_v1');
      return saved ? JSON.parse(saved) : { freeShippingThreshold: 500, phone: '0850 300 00 00', whatsapp: '905000000000' };
    } catch {
      return { freeShippingThreshold: 500, phone: '0850 300 00 00', whatsapp: '905000000000' };
    }
  });

  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Sync with DB service on mount
  useEffect(() => {
    getProducts().then(data => { if (data && data.length) setProducts(data); });
    getOrders().then(data => { if (data) setOrders(data); });
    getCoupons().then(data => { if (data && data.length) setCoupons(data); });
    getStoreSettings().then(data => { if (data) setStoreSettings(data); });
  }, []);

  const handleSaveProduct = (savedProduct, isEdit) => {
    saveProduct(savedProduct, isEdit);
    if (isEdit) {
      setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
      showToast(`"${savedProduct.name}" başarıyla güncellendi.`);
    } else {
      setProducts([savedProduct, ...products]);
      showToast(`"${savedProduct.name}" kataloğa eklendi.`);
    }
  };

  const handleDeleteProduct = (productId) => {
    deleteProduct(productId);
    setProducts(products.filter(p => p.id !== productId));
    showToast('Ürün vitrinden silindi.', 'info');
  };

  const handleResetCatalog = () => {
    if (window.confirm('Katalog orijinal haline döndürülecektir. Devam edilsin mi?')) {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('neefsane_catalog_v5', JSON.stringify(INITIAL_PRODUCTS));
      showToast('Katalog varsayılan haline döndürüldü.');
    }
  };

  const handleUpdateOrder = (orderNumber, updatedFields) => {
    updateOrder(orderNumber, updatedFields);
    const updated = orders.map(ord => ord.orderNumber === orderNumber ? { ...ord, ...updatedFields } : ord);
    setOrders(updated);
    showToast(`Sipariş #${orderNumber} güncellendi.`);
  };

  const handleDeleteOrder = (orderNumber) => {
    deleteOrder(orderNumber);
    const updated = orders.filter(ord => ord.orderNumber !== orderNumber);
    setOrders(updated);
    showToast(`Sipariş #${orderNumber} silindi.`, 'info');
  };

  const handleCreateTestOrder = () => {
    const testNum = `NEEF-${Math.floor(100000 + Math.random() * 900000)}`;
    const sampleProduct = products[0] || INITIAL_PRODUCTS[0];
    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: testNum,
      date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      status: 'Hazırlanıyor',
      courier: 'MNG Kargo',
      trackingNumber: `MNG-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      trackingUrl: 'https://mngkargo.com.tr',
      paymentMethod: 'Kredi / Banka Kartı',
      subtotal: sampleProduct.discountPrice || sampleProduct.price,
      shippingFee: 0,
      total: sampleProduct.discountPrice || sampleProduct.price,
      customer: {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        phone: '0532 555 44 33',
        email: 'ahmet.yilmaz@example.com',
        city: 'İstanbul',
        district: 'Kadıköy',
        address: 'Caferağa Mah. Moda Cad. No: 42 D: 5'
      },
      items: [
        {
          id: sampleProduct.id,
          name: sampleProduct.name,
          image: sampleProduct.image,
          price: sampleProduct.discountPrice || sampleProduct.price,
          quantity: 1,
          selectedModel: sampleProduct.models?.[0] || '16 cm Standart',
          selectedColor: sampleProduct.colors?.[0]?.name || 'Lava Turuncusu'
        }
      ],
      timeline: [
        { status: 'Sipariş Alındı', time: 'Bugün ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), description: 'Siparişiniz başarıyla alındı ve onaylandı.', completed: true },
        { status: 'Hazırlanıyor', time: 'Bugün ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), description: 'Ürününüz 3D atölyemizde özenle hazırlanıyor.', completed: true },
        { status: 'Kargoya Verildi', time: 'Bekleniyor', description: 'Kargo kuryesine teslim edildiğinde takip numarası paylaşılacaktır.', completed: false },
        { status: 'Teslim Edildi', time: 'Bekleniyor', description: 'Paketiniz adresinize teslim edilecek.', completed: false }
      ]
    };
    createOrder(newOrder);
    setOrders([newOrder, ...orders]);
    showToast(`Test Siparişi #${testNum} oluşturuldu!`);
  };

  const handleSaveCoupon = (couponData, isEdit) => {
    saveCoupon(couponData, isEdit);
    if (isEdit) {
      setCoupons(coupons.map(c => c.id === couponData.id ? couponData : c));
      showToast(`"${couponData.code}" kuponu güncellendi.`);
    } else {
      setCoupons([couponData, ...coupons]);
      showToast(`"${couponData.code}" kuponu oluşturuldu.`);
    }
  };

  const handleDeleteCoupon = (couponId) => {
    deleteCoupon(couponId);
    setCoupons(coupons.filter(c => c.id !== couponId));
    showToast('Kupon silindi.', 'info');
  };

  const handleToggleCoupon = (couponId) => {
    const target = coupons.find(c => c.id === couponId);
    if (target) {
      const updated = { ...target, isActive: !target.isActive };
      saveCoupon(updated, true);
      setCoupons(coupons.map(c => c.id === couponId ? updated : c));
      showToast('Kupon durumu güncellendi.');
    }
  };

  const handleBackToStore = () => {
    // In production, redirects to https://neefsane.com, in local to http://localhost:5173
    const storeUrl = window.location.hostname.includes('localhost')
      ? 'http://localhost:5173'
      : 'https://neefsane.com';
    window.location.href = storeUrl;
  };

  if (!isAuthenticated) {
    return (
      <AdminLoginPage
        onSuccess={() => {
          sessionStorage.setItem('neefsane_admin_session_token', ADMIN_SECURE_TOKEN);
          sessionStorage.setItem('neefsane_admin_auth', 'true');
          setIsAuthenticated(true);
          showToast('Yönetici paneline giriş yapıldı.');
        }}
        onBackToStore={handleBackToStore}
      />
    );
  }

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
      <AdminDashboard
        products={products}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onCloseAdmin={handleBackToStore}
        onResetToDefaultCatalog={handleResetCatalog}
        orders={orders}
        onUpdateOrder={handleUpdateOrder}
        onDeleteOrder={handleDeleteOrder}
        onCreateTestOrder={handleCreateTestOrder}
        coupons={coupons}
        onSaveCoupon={handleSaveCoupon}
        onDeleteCoupon={handleDeleteCoupon}
        onToggleCoupon={handleToggleCoupon}
        storeSettings={storeSettings}
        onUpdateStoreSettings={(s) => {
          saveStoreSettings(s);
          setStoreSettings(s);
          showToast('Mağaza ayarları başarıyla kaydedildi.');
        }}
      />
    </>
  );
}
