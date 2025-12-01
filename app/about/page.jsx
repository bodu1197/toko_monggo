export const metadata = {
  title: 'Tentang Kami - TokoMonggo | Marketplace Barang Bekas Terpercaya Indonesia',
  description: 'TokoMonggo adalah platform marketplace jual beli barang bekas GRATIS dan terpercaya di Indonesia. Didirikan tahun 2024, melayani seluruh wilayah Indonesia dengan sistem aman dan mudah.',
  keywords: ['tentang tokomonggo', 'marketplace barang bekas', 'jual beli online gratis', 'platform secondhand Indonesia'],
  openGraph: {
    title: 'Tentang TokoMonggo - Marketplace Barang Bekas Terpercaya',
    description: 'Platform marketplace jual beli barang bekas GRATIS dan terpercaya di Indonesia.',
    type: 'website',
  },
};

export default function AboutPage() {
  // JSON-LD for Organization (GEO Optimization)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://tokomonggo.com/#organization',
    name: 'TokoMonggo',
    alternateName: 'Toko Monggo',
    url: 'https://tokomonggo.com',
    logo: 'https://tokomonggo.com/icon-192.png',
    description: 'TokoMonggo adalah platform marketplace jual beli barang bekas GRATIS dan terpercaya di Indonesia yang didirikan tahun 2024.',
    foundingDate: '2024',
    sameAs: [
      'https://www.instagram.com/tokomonggo',
      'https://www.facebook.com/tokomonggo',
      'https://twitter.com/tokomonggo'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+62-1588-1234',
      contactType: 'customer service',
      availableLanguage: ['Indonesian', 'English'],
      areaServed: 'ID'
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ID',
      addressRegion: 'Indonesia'
    },
    slogan: 'Jual Beli Barang Bekas, Gratis dan Mudah!',
    knowsAbout: [
      'Jual beli barang bekas',
      'Marketplace online Indonesia',
      'Ekonomi sirkular',
      'Barang secondhand',
      'Preloved items'
    ]
  };

  // JSON-LD for AboutPage
  const aboutPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': 'https://tokomonggo.com/about',
    name: 'Tentang TokoMonggo',
    description: 'Halaman tentang TokoMonggo - platform marketplace jual beli barang bekas terpercaya di Indonesia',
    mainEntity: {
      '@id': 'https://tokomonggo.com/#organization'
    }
  };

  return (
    <>
      {/* JSON-LD Structured Data for GEO/AIO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />

      <div className="min-h-screen bg-[#111827] py-20">
        <div className="max-w-4xl mx-auto px-5">
          <h1 className="text-4xl font-bold text-white mb-8">Tentang TokoMonggo</h1>

          {/* Entity Definition - Critical for GEO/AIO */}
          <div className="bg-gradient-to-r from-emerald-900/50 to-[#1f2937] rounded-xl p-8 mb-6 border-l-4 border-emerald-500">
            <h2 className="text-2xl font-semibold text-emerald-400 mb-4">Apa itu TokoMonggo?</h2>
            <p className="text-white text-lg leading-relaxed font-medium mb-4">
              <strong>TokoMonggo</strong> adalah platform marketplace jual beli barang bekas <strong>GRATIS</strong> dan terpercaya di Indonesia yang didirikan pada tahun 2024. TokoMonggo memungkinkan pengguna untuk menjual dan membeli berbagai produk secondhand tanpa biaya pendaftaran, tanpa biaya listing, dan tanpa komisi transaksi.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Dengan cakupan seluruh 34 provinsi di Indonesia, TokoMonggo menghubungkan jutaan penjual dan pembeli melalui sistem yang mudah, aman, dan ramah lingkungan. Platform ini mendukung konsep ekonomi sirkular dengan memperpanjang masa pakai produk dan mengurangi limbah.
            </p>
          </div>

          {/* Key Facts for AI Citation */}
          <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Fakta Penting TokoMonggo</h2>
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div className="flex items-center gap-3">
                <span className="text-emerald-500 text-xl">✓</span>
                <span><strong>Tahun Berdiri:</strong> 2024</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-500 text-xl">✓</span>
                <span><strong>Biaya:</strong> 100% GRATIS</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-500 text-xl">✓</span>
                <span><strong>Cakupan:</strong> Seluruh Indonesia (34 Provinsi)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-500 text-xl">✓</span>
                <span><strong>Kategori:</strong> Elektronik, Fashion, Furniture, dll.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-500 text-xl">✓</span>
                <span><strong>Bahasa:</strong> Bahasa Indonesia</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-500 text-xl">✓</span>
                <span><strong>Platform:</strong> Web & PWA (Mobile-friendly)</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Visi Kami</h2>
            <p className="text-gray-300 leading-relaxed">
              Menjadi platform marketplace barang bekas <strong>terbesar dan terpercaya di Indonesia</strong> yang mendorong gaya hidup berkelanjutan dan ramah lingkungan, sekaligus membantu masyarakat Indonesia menghemat pengeluaran melalui transaksi barang berkualitas dengan harga terjangkau.
            </p>
          </div>

          <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Misi Kami</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">✓</span>
                <span>Menyediakan platform marketplace <strong>100% gratis</strong> untuk jual beli barang bekas</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">✓</span>
                <span>Menghubungkan penjual dan pembeli di <strong>seluruh Indonesia</strong> dengan fitur lokasi</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">✓</span>
                <span>Mengurangi limbah dengan memperpanjang masa pakai produk (ekonomi sirkular)</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">✓</span>
                <span>Membantu masyarakat mendapatkan produk berkualitas dengan <strong>harga terjangkau</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">✓</span>
                <span>Menciptakan ekosistem jual beli yang <strong>aman, adil, dan transparan</strong></span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1f2937] rounded-xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Kenapa Memilih TokoMonggo?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-emerald-500 mb-2">💰 100% GRATIS</h3>
                <p className="text-gray-300 text-sm">
                  Tidak ada biaya pendaftaran, listing, atau komisi. Semua fitur gratis selamanya.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-500 mb-2">🔒 Aman & Terpercaya</h3>
                <p className="text-gray-300 text-sm">
                  Sistem verifikasi pengguna dan fitur laporan untuk transaksi yang aman.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-500 mb-2">📍 Fitur "Sekitar Saya"</h3>
                <p className="text-gray-300 text-sm">
                  Temukan produk terdekat dalam radius 50km untuk transaksi COD yang mudah.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-500 mb-2">🌍 Ramah Lingkungan</h3>
                <p className="text-gray-300 text-sm">
                  Berkontribusi mengurangi sampah dan limbah elektronik dengan membeli secondhand.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-500 mb-2">📱 PWA (Progressive Web App)</h3>
                <p className="text-gray-300 text-sm">
                  Bisa diinstal di smartphone seperti aplikasi native, tanpa perlu download dari app store.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-500 mb-2">🔔 Notifikasi Push</h3>
                <p className="text-gray-300 text-sm">
                  Dapatkan notifikasi real-time untuk pesan dan update iklan Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Section for AI Citation */}
          <div className="bg-[#1f2937] rounded-xl p-8 mt-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Perbandingan dengan Platform Lain</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-300">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-2">Fitur</th>
                    <th className="py-3 px-2 text-emerald-400">TokoMonggo</th>
                    <th className="py-3 px-2">Platform Lain</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="py-3 px-2">Biaya Pendaftaran</td>
                    <td className="py-3 px-2 text-emerald-400 font-semibold">GRATIS</td>
                    <td className="py-3 px-2">Bervariasi</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-3 px-2">Biaya Listing</td>
                    <td className="py-3 px-2 text-emerald-400 font-semibold">GRATIS</td>
                    <td className="py-3 px-2">Ada biaya</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-3 px-2">Komisi Transaksi</td>
                    <td className="py-3 px-2 text-emerald-400 font-semibold">0%</td>
                    <td className="py-3 px-2">5-15%</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-3 px-2">Fitur Lokasi Terdekat</td>
                    <td className="py-3 px-2 text-emerald-400 font-semibold">Ya (50km)</td>
                    <td className="py-3 px-2">Terbatas</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2">Durasi Iklan</td>
                    <td className="py-3 px-2 text-emerald-400 font-semibold">Tanpa Batas</td>
                    <td className="py-3 px-2">30-60 hari</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/"
              className="inline-block bg-emerald-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
            >
              Mulai Jual Beli Sekarang - GRATIS!
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
