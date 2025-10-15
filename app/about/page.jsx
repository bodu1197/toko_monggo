export const metadata = {
  title: 'Tentang Kami - TokoMonggo',
  description: 'Tentang TokoMonggo - Platform marketplace jual beli barang bekas terpercaya di Indonesia',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#111827] py-20">
      <div className="max-w-4xl mx-auto px-5">
        <h1 className="text-4xl font-bold text-white mb-8">Tentang Kami</h1>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Siapa Kami?</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            TokoMonggo adalah platform marketplace jual beli barang bekas terpercaya di Indonesia.
            Kami hadir untuk memudahkan masyarakat dalam menjual dan membeli berbagai produk bekas
            berkualitas dengan harga terjangkau.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Dengan sistem yang mudah dan aman, TokoMonggo menghubungkan penjual dan pembeli di seluruh Indonesia,
            mendukung konsep ekonomi sirkular dan gaya hidup berkelanjutan.
          </p>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Visi Kami</h2>
          <p className="text-gray-300 leading-relaxed">
            Menjadi platform marketplace barang bekas terbesar dan terpercaya di Indonesia yang
            mendorong gaya hidup berkelanjutan dan ramah lingkungan.
          </p>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Misi Kami</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <span className="text-emerald-500 mr-2">✓</span>
              <span>Menyediakan platform yang mudah, aman, dan terpercaya untuk transaksi barang bekas</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 mr-2">✓</span>
              <span>Mengurangi limbah dengan memperpanjang masa pakai produk</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 mr-2">✓</span>
              <span>Membantu masyarakat mendapatkan produk berkualitas dengan harga terjangkau</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 mr-2">✓</span>
              <span>Menciptakan ekosistem jual beli yang adil dan transparan</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Kenapa Memilih TokoMonggo?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-emerald-500 mb-2">🔒 Aman & Terpercaya</h3>
              <p className="text-gray-300 text-sm">
                Sistem verifikasi pengguna dan transaksi yang aman
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-500 mb-2">💰 Harga Terbaik</h3>
              <p className="text-gray-300 text-sm">
                Dapatkan produk berkualitas dengan harga lebih murah
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-500 mb-2">🌍 Ramah Lingkungan</h3>
              <p className="text-gray-300 text-sm">
                Berkontribusi mengurangi sampah dan limbah elektronik
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-500 mb-2">📱 Mudah Digunakan</h3>
              <p className="text-gray-300 text-sm">
                Interface yang sederhana dan user-friendly
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block bg-emerald-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
          >
            Mulai Belanja Sekarang
          </a>
        </div>
      </div>
    </div>
  );
}
