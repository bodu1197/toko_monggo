export const metadata = {
  title: 'Pusat Bantuan - TokoMonggo',
  description: 'Pusat bantuan dan FAQ TokoMonggo - Temukan jawaban atas pertanyaan Anda',
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#111827] py-20">
      <div className="max-w-4xl mx-auto px-5">
        <h1 className="text-4xl font-bold text-white mb-8">Pusat Bantuan</h1>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <p className="text-gray-300 leading-relaxed">
            Selamat datang di Pusat Bantuan TokoMonggo! Temukan jawaban atas pertanyaan yang sering diajukan
            atau hubungi tim kami untuk bantuan lebih lanjut.
          </p>
        </div>

        <h2 className="text-3xl font-bold text-white mb-6">FAQ (Pertanyaan yang Sering Diajukan)</h2>

        <div className="space-y-4 mb-12">
          <details className="bg-[#1f2937] rounded-xl p-6 cursor-pointer">
            <summary className="text-lg font-semibold text-white">
              Bagaimana cara mendaftar di TokoMonggo?
            </summary>
            <p className="text-gray-300 mt-4 leading-relaxed">
              Klik tombol "Daftar" di pojok kanan atas, lalu isi formulir dengan nama, email, dan password.
              Setelah mendaftar, verifikasi email Anda untuk mengaktifkan akun.
            </p>
          </details>

          <details className="bg-[#1f2937] rounded-xl p-6 cursor-pointer">
            <summary className="text-lg font-semibold text-white">
              Bagaimana cara menjual barang?
            </summary>
            <p className="text-gray-300 mt-4 leading-relaxed">
              1. Login ke akun Anda<br/>
              2. Klik tombol "Jual" di menu utama<br/>
              3. Upload foto produk (minimal 1, maksimal 10 foto)<br/>
              4. Isi detail produk: judul, deskripsi, harga, kategori, kondisi<br/>
              5. Pilih lokasi Anda<br/>
              6. Klik "Posting Iklan"
            </p>
          </details>

          <details className="bg-[#1f2937] rounded-xl p-6 cursor-pointer">
            <summary className="text-lg font-semibold text-white">
              Bagaimana cara membeli barang?
            </summary>
            <p className="text-gray-300 mt-4 leading-relaxed">
              1. Cari produk yang Anda inginkan menggunakan fitur pencarian atau filter<br/>
              2. Klik produk untuk melihat detail lengkap<br/>
              3. Hubungi penjual melalui tombol "Chat Penjual" atau "WhatsApp"<br/>
              4. Negosiasi harga dan metode pembayaran dengan penjual<br/>
              5. Lakukan pembayaran sesuai kesepakatan<br/>
              6. Tunggu penjual mengirim barang
            </p>
          </details>

          <details className="bg-[#1f2937] rounded-xl p-6 cursor-pointer">
            <summary className="text-lg font-semibold text-white">
              Apakah aman bertransaksi di TokoMonggo?
            </summary>
            <p className="text-gray-300 mt-4 leading-relaxed">
              TokoMonggo menyediakan platform yang aman, namun transaksi dilakukan langsung antara pembeli dan penjual.
              Kami menyarankan:<br/>
              • Cek rating dan ulasan penjual<br/>
              • Tanyakan foto asli produk<br/>
              • Gunakan metode pembayaran yang aman (COD, rekening terpercaya)<br/>
              • Bertemu di tempat umum untuk transaksi offline
            </p>
          </details>

          <details className="bg-[#1f2937] rounded-xl p-6 cursor-pointer">
            <summary className="text-lg font-semibold text-white">
              Berapa biaya menggunakan TokoMonggo?
            </summary>
            <p className="text-gray-300 mt-4 leading-relaxed">
              TokoMonggo GRATIS untuk digunakan! Tidak ada biaya pendaftaran, posting iklan, atau transaksi.
              Kami hanya mengenakan biaya untuk fitur premium tertentu di masa depan.
            </p>
          </details>

          <details className="bg-[#1f2937] rounded-xl p-6 cursor-pointer">
            <summary className="text-lg font-semibold text-white">
              Bagaimana cara mengedit atau menghapus iklan saya?
            </summary>
            <p className="text-gray-300 mt-4 leading-relaxed">
              1. Login ke akun Anda<br/>
              2. Buka menu "Profil" atau "Iklan Saya"<br/>
              3. Pilih iklan yang ingin diedit/dihapus<br/>
              4. Klik tombol "Edit" untuk mengubah, atau "Hapus" untuk menghapus iklan
            </p>
          </details>

          <details className="bg-[#1f2937] rounded-xl p-6 cursor-pointer">
            <summary className="text-lg font-semibold text-white">
              Bagaimana jika saya lupa password?
            </summary>
            <p className="text-gray-300 mt-4 leading-relaxed">
              Klik "Lupa Password" di halaman login, masukkan email Anda, dan kami akan mengirimkan
              link untuk reset password ke email Anda.
            </p>
          </details>

          <details className="bg-[#1f2937] rounded-xl p-6 cursor-pointer">
            <summary className="text-lg font-semibold text-white">
              Apa yang harus saya lakukan jika menemukan iklan palsu atau penipuan?
            </summary>
            <p className="text-gray-300 mt-4 leading-relaxed">
              Klik tombol "Laporkan" pada iklan tersebut, atau hubungi tim support kami melalui email
              support@tokomonggo.com dengan menyertakan screenshot dan detail iklan.
            </p>
          </details>

          <details className="bg-[#1f2937] rounded-xl p-6 cursor-pointer">
            <summary className="text-lg font-semibold text-white">
              Berapa lama iklan saya akan ditampilkan?
            </summary>
            <p className="text-gray-300 mt-4 leading-relaxed">
              Iklan akan ditampilkan selama 30 hari secara otomatis. Setelah itu, Anda dapat
              memperpanjang iklan dengan klik "Perpanjang" di halaman profil Anda.
            </p>
          </details>

          <details className="bg-[#1f2937] rounded-xl p-6 cursor-pointer">
            <summary className="text-lg font-semibold text-white">
              Bagaimana cara menggunakan fitur "Sekitar Saya"?
            </summary>
            <p className="text-gray-300 mt-4 leading-relaxed">
              Fitur "Sekitar Saya" menggunakan lokasi Anda untuk menampilkan produk terdekat (radius 50km).
              Pastikan Anda mengizinkan akses lokasi di browser Anda untuk menggunakan fitur ini.
            </p>
          </details>
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
  );
}
