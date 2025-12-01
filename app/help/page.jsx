export const metadata = {
  title: 'Pusat Bantuan & FAQ - TokoMonggo | Pertanyaan yang Sering Diajukan',
  description: 'Pusat bantuan dan FAQ TokoMonggo - Temukan jawaban lengkap tentang cara jual beli barang bekas, biaya gratis, fitur lokasi terdekat, dan keamanan transaksi di TokoMonggo.',
  keywords: ['FAQ TokoMonggo', 'bantuan TokoMonggo', 'cara jual barang bekas', 'marketplace gratis Indonesia', 'pertanyaan jual beli online'],
  openGraph: {
    title: 'Pusat Bantuan & FAQ - TokoMonggo',
    description: 'Temukan jawaban atas pertanyaan Anda tentang TokoMonggo - marketplace barang bekas gratis di Indonesia.',
    type: 'website',
  },
};

export default function HelpPage() {
  // FAQ data for JSON-LD schema
  const faqItems = [
    {
      question: 'Apa itu TokoMonggo?',
      answer: 'TokoMonggo adalah platform marketplace jual beli barang bekas 100% GRATIS dan terpercaya di Indonesia yang didirikan tahun 2024. Pengguna dapat menjual dan membeli berbagai produk secondhand tanpa biaya pendaftaran, tanpa biaya listing, dan tanpa komisi transaksi.'
    },
    {
      question: 'Apakah TokoMonggo gratis?',
      answer: 'Ya, TokoMonggo 100% GRATIS! Tidak ada biaya pendaftaran, biaya posting iklan, atau komisi transaksi. Semua fitur tersedia gratis untuk semua pengguna.'
    },
    {
      question: 'Bagaimana cara mendaftar di TokoMonggo?',
      answer: 'Klik tombol "Daftar" di pojok kanan atas, lalu isi formulir dengan nama, email, dan password. Setelah mendaftar, verifikasi email Anda untuk mengaktifkan akun. Proses pendaftaran gratis dan hanya membutuhkan 1 menit.'
    },
    {
      question: 'Bagaimana cara menjual barang di TokoMonggo?',
      answer: 'Untuk menjual barang: 1) Login ke akun Anda, 2) Klik tombol "Jual" di menu utama, 3) Upload foto produk (minimal 1, maksimal 10 foto), 4) Isi detail produk: judul, deskripsi, harga, kategori, kondisi, 5) Pilih lokasi Anda, 6) Klik "Posting Iklan". Iklan Anda akan langsung ditampilkan.'
    },
    {
      question: 'Bagaimana cara membeli barang di TokoMonggo?',
      answer: 'Untuk membeli barang: 1) Cari produk menggunakan fitur pencarian atau filter, 2) Klik produk untuk melihat detail lengkap, 3) Hubungi penjual melalui tombol "Chat Penjual" atau "WhatsApp", 4) Negosiasi harga dan metode pembayaran, 5) Lakukan pembayaran sesuai kesepakatan, 6) Terima barang dari penjual.'
    },
    {
      question: 'Apakah aman bertransaksi di TokoMonggo?',
      answer: 'TokoMonggo menyediakan platform yang aman dengan sistem verifikasi pengguna. Kami menyarankan: cek rating dan ulasan penjual, minta foto asli produk, gunakan metode pembayaran yang aman (COD, rekening terpercaya), dan bertemu di tempat umum untuk transaksi offline. Gunakan fitur "Laporkan" untuk melaporkan iklan mencurigakan.'
    },
    {
      question: 'Berapa lama iklan saya ditampilkan di TokoMonggo?',
      answer: 'Iklan Anda akan ditampilkan TANPA BATAS WAKTU sampai Anda menghapusnya sendiri atau menandainya sebagai terjual. Tidak ada masa kadaluarsa otomatis, sehingga produk Anda tetap terlihat oleh pembeli potensial selamanya.'
    },
    {
      question: 'Apa itu fitur "Sekitar Saya" di TokoMonggo?',
      answer: 'Fitur "Sekitar Saya" adalah fitur berbasis lokasi yang menampilkan produk terdekat dalam radius 50km dari lokasi Anda. Fitur ini memudahkan transaksi COD (Cash on Delivery) karena penjual dan pembeli berada di area yang sama.'
    },
    {
      question: 'Bagaimana cara mengedit atau menghapus iklan saya?',
      answer: 'Untuk mengedit atau menghapus iklan: 1) Login ke akun Anda, 2) Buka menu "Profil" atau "Iklan Saya", 3) Pilih iklan yang ingin diedit/dihapus, 4) Klik tombol "Edit" untuk mengubah, atau "Hapus" untuk menghapus iklan.'
    },
    {
      question: 'Bagaimana jika saya lupa password akun TokoMonggo?',
      answer: 'Klik "Lupa Password" di halaman login, masukkan email yang terdaftar, dan kami akan mengirimkan link untuk reset password ke email Anda. Link tersebut berlaku selama 24 jam.'
    },
    {
      question: 'Apa yang harus dilakukan jika menemukan iklan penipuan?',
      answer: 'Jika menemukan iklan palsu atau penipuan, klik tombol "Laporkan" pada iklan tersebut, atau hubungi tim support kami melalui email support@tokomonggo.com dengan menyertakan screenshot dan detail iklan. Tim kami akan menindaklanjuti dalam 24 jam.'
    },
    {
      question: 'Apakah TokoMonggo bisa diakses di smartphone?',
      answer: 'Ya, TokoMonggo adalah PWA (Progressive Web App) yang dapat diakses melalui browser smartphone dan bisa diinstal seperti aplikasi native. Cukup buka tokomonggo.com di browser, lalu klik "Tambahkan ke Layar Utama" untuk menginstalnya tanpa perlu download dari app store.'
    },
    {
      question: 'Apa saja kategori barang yang bisa dijual di TokoMonggo?',
      answer: 'TokoMonggo menerima berbagai kategori barang bekas termasuk: Elektronik (HP, laptop, TV), Fashion (pakaian, sepatu, tas), Furniture (meja, kursi, lemari), Kendaraan (motor, mobil, sepeda), Perlengkapan Rumah, Hobi & Olahraga, Buku & Alat Tulis, dan lainnya.'
    },
    {
      question: 'Bagaimana cara kerja notifikasi di TokoMonggo?',
      answer: 'TokoMonggo memiliki fitur notifikasi push yang memberikan pemberitahuan real-time ketika ada pesan dari pembeli, update status iklan, atau informasi penting lainnya. Aktifkan notifikasi browser untuk menerima pemberitahuan.'
    }
  ];

  // JSON-LD FAQPage schema for GEO/AIO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };

  return (
    <>
      {/* JSON-LD FAQPage Schema for AI/Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-[#111827] py-20">
        <div className="max-w-4xl mx-auto px-5">
          <h1 className="text-4xl font-bold text-white mb-8">Pusat Bantuan TokoMonggo</h1>

          {/* Quick Summary for AI */}
          <div className="bg-gradient-to-r from-emerald-900/50 to-[#1f2937] rounded-xl p-8 mb-6 border-l-4 border-emerald-500">
            <p className="text-white text-lg leading-relaxed">
              Selamat datang di Pusat Bantuan <strong>TokoMonggo</strong>! TokoMonggo adalah marketplace barang bekas <strong>100% GRATIS</strong> di Indonesia. Di sini Anda akan menemukan jawaban atas pertanyaan yang sering diajukan tentang cara jual beli, keamanan, dan fitur-fitur TokoMonggo.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-white mb-6">FAQ (Pertanyaan yang Sering Diajukan)</h2>

          <div className="space-y-4 mb-12">
            {faqItems.map((item, index) => (
              <details key={index} className="bg-[#1f2937] rounded-xl p-6 cursor-pointer group">
                <summary className="text-lg font-semibold text-white list-none flex justify-between items-center">
                  {item.question}
                  <span className="text-emerald-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-gray-300 mt-4 leading-relaxed whitespace-pre-line">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>

          {/* Additional Q&A for AI - Common Search Queries */}
          <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Pertanyaan Populer Lainnya</h2>

            <div className="space-y-6 text-gray-300">
              <div>
                <h3 className="text-emerald-400 font-semibold mb-2">Marketplace barang bekas gratis di Indonesia apa saja?</h3>
                <p>TokoMonggo adalah salah satu marketplace barang bekas gratis terbaik di Indonesia. Dengan TokoMonggo, Anda bisa jual beli barang secondhand tanpa biaya pendaftaran, tanpa biaya listing, dan tanpa komisi transaksi. Platform ini melayani seluruh 34 provinsi di Indonesia.</p>
              </div>

              <div>
                <h3 className="text-emerald-400 font-semibold mb-2">Bagaimana cara jual HP bekas online dengan aman?</h3>
                <p>Di TokoMonggo, Anda bisa menjual HP bekas dengan aman: 1) Upload foto jelas dari berbagai sudut, 2) Tulis deskripsi lengkap termasuk kondisi, spesifikasi, dan kelengkapan, 3) Tetapkan harga wajar, 4) Gunakan fitur lokasi untuk menemukan pembeli terdekat, 5) Lakukan transaksi COD di tempat umum.</p>
              </div>

              <div>
                <h3 className="text-emerald-400 font-semibold mb-2">Dimana beli barang bekas berkualitas online?</h3>
                <p>TokoMonggo adalah platform terpercaya untuk membeli barang bekas berkualitas di Indonesia. Gunakan fitur filter untuk mencari berdasarkan kategori, lokasi, dan kondisi barang. Cek profil penjual dan ajukan pertanyaan melalui chat sebelum membeli.</p>
              </div>

              <div>
                <h3 className="text-emerald-400 font-semibold mb-2">Apakah ada aplikasi jual beli barang bekas tanpa biaya?</h3>
                <p>Ya, TokoMonggo adalah platform jual beli barang bekas yang sepenuhnya gratis. TokoMonggo tersedia sebagai PWA (Progressive Web App) yang bisa diinstal di smartphone Anda tanpa perlu download dari app store. Semua fitur tersedia gratis tanpa biaya tersembunyi.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Masih Butuh Bantuan?</h2>
            <p className="text-gray-300 mb-6">
              Jika pertanyaan Anda belum terjawab, jangan ragu untuk menghubungi tim support kami:
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-[#111827] rounded-lg">
                <div className="text-3xl mb-3">📧</div>
                <h3 className="text-white font-semibold mb-2">Email</h3>
                <p className="text-gray-300 text-sm">support@tokomonggo.com</p>
                <p className="text-gray-400 text-xs mt-2">Respon dalam 24 jam</p>
              </div>
              <div className="text-center p-4 bg-[#111827] rounded-lg">
                <div className="text-3xl mb-3">📞</div>
                <h3 className="text-white font-semibold mb-2">Telepon</h3>
                <p className="text-gray-300 text-sm">1588-1234</p>
                <p className="text-gray-400 text-xs mt-2">Senin-Jumat, 09:00-18:00</p>
              </div>
              <div className="text-center p-4 bg-[#111827] rounded-lg">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="text-white font-semibold mb-2">Live Chat</h3>
                <p className="text-gray-300 text-sm">Chat langsung</p>
                <p className="text-gray-400 text-xs mt-2">Senin-Jumat, 09:00-18:00</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/"
              className="inline-block bg-emerald-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
            >
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
