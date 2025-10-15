export const metadata = {
  title: 'Syarat & Ketentuan - TokoMonggo',
  description: 'Syarat dan ketentuan penggunaan platform TokoMonggo',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#111827] py-20">
      <div className="max-w-4xl mx-auto px-5">
        <h1 className="text-4xl font-bold text-white mb-8">Syarat & Ketentuan</h1>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <p className="text-gray-300 mb-6">
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-gray-300 leading-relaxed">
            Selamat datang di TokoMonggo. Dengan mengakses dan menggunakan platform kami, Anda menyetujui
            untuk terikat dengan syarat dan ketentuan berikut.
          </p>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">1. Ketentuan Umum</h2>
          <ul className="space-y-3 text-gray-300">
            <li>• Platform TokoMonggo adalah marketplace untuk jual beli barang bekas</li>
            <li>• Pengguna harus berusia minimal 18 tahun atau memiliki izin dari orang tua/wali</li>
            <li>• Setiap pengguna bertanggung jawab atas akun dan aktivitas mereka</li>
            <li>• TokoMonggo berhak menolak atau menghapus akun yang melanggar ketentuan</li>
          </ul>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">2. Kewajiban Penjual</h2>
          <ul className="space-y-3 text-gray-300">
            <li>• Memberikan informasi produk yang jujur dan akurat</li>
            <li>• Mencantumkan foto asli dari produk yang dijual</li>
            <li>• Menetapkan harga yang wajar dan transparan</li>
            <li>• Merespons pertanyaan pembeli dengan cepat</li>
            <li>• Mengirimkan produk sesuai dengan deskripsi</li>
            <li>• Tidak menjual barang ilegal atau berbahaya</li>
          </ul>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">3. Kewajiban Pembeli</h2>
          <ul className="space-y-3 text-gray-300">
            <li>• Membaca deskripsi produk dengan teliti sebelum membeli</li>
            <li>• Melakukan pembayaran sesuai kesepakatan</li>
            <li>• Berkomunikasi dengan sopan kepada penjual</li>
            <li>• Memberikan ulasan yang jujur setelah transaksi</li>
          </ul>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">4. Barang yang Dilarang</h2>
          <p className="text-gray-300 mb-3">TokoMonggo melarang penjualan barang-barang berikut:</p>
          <ul className="space-y-2 text-gray-300">
            <li>• Narkoba dan obat-obatan terlarang</li>
            <li>• Senjata api dan senjata tajam</li>
            <li>• Barang curian atau hasil kejahatan</li>
            <li>• Produk palsu atau tiruan</li>
            <li>• Konten pornografi</li>
            <li>• Hewan langka atau dilindungi</li>
            <li>• Dokumen atau identitas palsu</li>
          </ul>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">5. Transaksi dan Pembayaran</h2>
          <ul className="space-y-3 text-gray-300">
            <li>• Transaksi dilakukan langsung antara penjual dan pembeli</li>
            <li>• TokoMonggo tidak bertanggung jawab atas sengketa transaksi</li>
            <li>• Pembayaran dilakukan melalui metode yang disepakati kedua belah pihak</li>
            <li>• Pengguna bertanggung jawab atas keamanan transaksi mereka</li>
          </ul>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">6. Hak Kekayaan Intelektual</h2>
          <p className="text-gray-300 leading-relaxed">
            Seluruh konten platform TokoMonggo, termasuk logo, desain, dan fitur, dilindungi oleh
            hak cipta dan hak kekayaan intelektual. Dilarang menggunakan tanpa izin tertulis.
          </p>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">7. Pembatasan Tanggung Jawab</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            TokoMonggo tidak bertanggung jawab atas:
          </p>
          <ul className="space-y-2 text-gray-300">
            <li>• Kerugian akibat transaksi antara pengguna</li>
            <li>• Kualitas barang yang diperjualbelikan</li>
            <li>• Kerusakan atau kehilangan barang saat pengiriman</li>
            <li>• Gangguan teknis atau downtime platform</li>
          </ul>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">8. Perubahan Ketentuan</h2>
          <p className="text-gray-300 leading-relaxed">
            TokoMonggo berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Pengguna akan
            diberitahu melalui email atau notifikasi di platform. Penggunaan berkelanjutan setelah
            perubahan berarti Anda menyetujui ketentuan yang diperbarui.
          </p>
        </div>

        <div className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500 rounded-xl">
          <p className="text-emerald-500 text-center">
            Dengan menggunakan platform TokoMonggo, Anda menyetujui seluruh syarat dan ketentuan di atas.
          </p>
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
