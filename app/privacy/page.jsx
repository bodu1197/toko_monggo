export const metadata = {
  title: 'Kebijakan Privasi - TokoMonggo',
  description: 'Kebijakan privasi dan perlindungan data pengguna TokoMonggo',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#111827] py-20">
      <div className="max-w-4xl mx-auto px-5">
        <h1 className="text-4xl font-bold text-white mb-8">Kebijakan Privasi</h1>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <p className="text-gray-300 mb-6">
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-gray-300 leading-relaxed">
            TokoMonggo berkomitmen untuk melindungi privasi dan keamanan data pribadi Anda.
            Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi
            informasi Anda.
          </p>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">1. Informasi yang Kami Kumpulkan</h2>
          <p className="text-gray-300 mb-3">Kami mengumpulkan informasi berikut:</p>
          <ul className="space-y-3 text-gray-300">
            <li>
              <strong className="text-white">Informasi Akun:</strong>
              <span className="block mt-1">Nama, email, nomor telepon, alamat</span>
            </li>
            <li>
              <strong className="text-white">Informasi Transaksi:</strong>
              <span className="block mt-1">Riwayat pembelian, penjualan, dan komunikasi</span>
            </li>
            <li>
              <strong className="text-white">Informasi Teknis:</strong>
              <span className="block mt-1">Alamat IP, browser, perangkat, dan data lokasi</span>
            </li>
            <li>
              <strong className="text-white">Cookies:</strong>
              <span className="block mt-1">Data untuk meningkatkan pengalaman pengguna</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">2. Penggunaan Informasi</h2>
          <p className="text-gray-300 mb-3">Kami menggunakan informasi Anda untuk:</p>
          <ul className="space-y-2 text-gray-300">
            <li>• Memproses dan mengelola transaksi</li>
            <li>• Meningkatkan layanan dan pengalaman pengguna</li>
            <li>• Mengirim notifikasi terkait akun dan transaksi</li>
            <li>• Mencegah penipuan dan aktivitas ilegal</li>
            <li>• Melakukan analisis data untuk pengembangan platform</li>
            <li>• Mengirim promosi dan penawaran (dengan persetujuan Anda)</li>
          </ul>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">3. Berbagi Informasi</h2>
          <p className="text-gray-300 mb-3">
            Kami tidak menjual data pribadi Anda. Informasi hanya dibagikan dengan:
          </p>
          <ul className="space-y-3 text-gray-300">
            <li>
              <strong className="text-white">Pengguna Lain:</strong>
              <span className="block mt-1">Informasi kontak untuk keperluan transaksi</span>
            </li>
            <li>
              <strong className="text-white">Penyedia Layanan:</strong>
              <span className="block mt-1">Partner pembayaran, pengiriman, dan hosting</span>
            </li>
            <li>
              <strong className="text-white">Otoritas Hukum:</strong>
              <span className="block mt-1">Jika diwajibkan oleh hukum atau pengadilan</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">4. Keamanan Data</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            Kami menerapkan langkah-langkah keamanan untuk melindungi data Anda:
          </p>
          <ul className="space-y-2 text-gray-300">
            <li>• Enkripsi SSL/TLS untuk transmisi data</li>
            <li>• Firewall dan sistem keamanan berlapis</li>
            <li>• Akses terbatas ke data pribadi</li>
            <li>• Audit keamanan berkala</li>
            <li>• Pencadangan data secara teratur</li>
          </ul>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">5. Hak Pengguna</h2>
          <p className="text-gray-300 mb-3">Anda memiliki hak untuk:</p>
          <ul className="space-y-2 text-gray-300">
            <li>• Mengakses dan melihat data pribadi Anda</li>
            <li>• Memperbarui atau mengoreksi informasi</li>
            <li>• Menghapus akun dan data (dengan syarat tertentu)</li>
            <li>• Menolak penggunaan data untuk marketing</li>
            <li>• Mengunduh data pribadi Anda</li>
            <li>• Mengajukan keluhan terkait privasi</li>
          </ul>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies dan Teknologi Pelacakan</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            Kami menggunakan cookies untuk:
          </p>
          <ul className="space-y-2 text-gray-300">
            <li>• Menjaga sesi login Anda</li>
            <li>• Mengingat preferensi Anda</li>
            <li>• Menganalisis trafik website</li>
            <li>• Menampilkan iklan yang relevan</li>
          </ul>
          <p className="text-gray-300 mt-4">
            Anda dapat mengelola pengaturan cookies melalui browser Anda.
          </p>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">7. Penyimpanan Data</h2>
          <p className="text-gray-300 leading-relaxed">
            Data pribadi Anda akan disimpan selama akun Anda aktif atau sesuai dengan kewajiban hukum.
            Setelah penghapusan akun, data akan dihapus dalam waktu 90 hari, kecuali jika diwajibkan
            untuk disimpan lebih lama oleh hukum.
          </p>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">8. Privasi Anak-anak</h2>
          <p className="text-gray-300 leading-relaxed">
            TokoMonggo tidak ditujukan untuk anak-anak di bawah 18 tahun. Kami tidak dengan sengaja
            mengumpulkan data dari anak-anak. Jika Anda mengetahui hal ini terjadi, harap hubungi kami.
          </p>
        </div>

        <div className="bg-[#1f2937] rounded-xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">9. Kontak Kami</h2>
          <p className="text-gray-300 mb-3">
            Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi:
          </p>
          <ul className="space-y-2 text-gray-300">
            <li><strong className="text-white">Email:</strong> privacy@tokomonggo.com</li>
            <li><strong className="text-white">Telepon:</strong> 1588-1234</li>
            <li><strong className="text-white">Alamat:</strong> Jl. Sudirman No. 123, Jakarta Selatan</li>
          </ul>
        </div>

        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500 rounded-xl">
          <p className="text-blue-400 text-center">
            Dengan menggunakan TokoMonggo, Anda menyetujui kebijakan privasi ini.
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
