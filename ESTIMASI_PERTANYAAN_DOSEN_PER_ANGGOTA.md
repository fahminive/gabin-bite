# ❓ ESTIMASI PERTANYAAN DOSEN PER KONTRIBUSI MAHASISWA
## Sistem: SiKeJu Bookkeeping — Presentasi Pemrograman Web

> Dokumen ini berisi pertanyaan yang **realistis ditanya dosen** berdasarkan kode aktual
> tiap mahasiswa. Pertanyaan disusun dari yang paling dasar hingga yang paling menggali.
> Setiap pertanyaan disertai jawaban yang benar berdasarkan kode di project ini.

---

## 🔴 ANGGOTA 1 — FAH
### Modul: Transaksi Penjualan & Pembelian (Tingkat Sulit)
**File Utama:** `PenjualanController.php`, `PembelianController.php`

---

### ▸ Kelompok A: Pertanyaan Pembuka (Pasti Ditanya)

**Q1. "Coba jelaskan secara singkat, fungsi `store()` di PenjualanController ini melakukan apa saja?"**

> **Jawaban ideal:**
> "Fungsi `store()` menangani penyimpanan transaksi penjualan baru. Ada tiga tahap utama:
> Pertama, memvalidasi semua input dari frontend. Kedua, mengecek apakah stok produk mencukupi
> untuk semua item yang dipesan. Ketiga, membungkus semua operasi database dalam
> `DB::transaction()` — di dalamnya sistem menyimpan header penjualan, kemudian me-loop
> setiap item untuk insert ke `detail_penjualans` sekaligus mengurangi stok produk.
> Terakhir, sistem mengecek jenis pembayaran: kalau Tunai, langsung catat ke tabel `kas`
> sebagai uang masuk; kalau Kredit, buat record piutang di tabel `piutangs`."

---

**Q2. "Kenapa kamu pakai `DB::transaction()`? Apa yang terjadi kalau tidak pakai?"**

> **Jawaban:**
> "Karena dalam satu proses penjualan ada banyak operasi database: insert header, insert
> beberapa detail, update stok, lalu insert kas atau piutang. Kalau salah satu di tengah
> jalan gagal — misalnya server tiba-tiba down — tanpa `DB::transaction()` data akan
> setengah-setengah: faktur sudah ada tapi itemnya tidak lengkap, atau stok sudah terkurangi
> tapi transaksi tidak valid. Dengan `DB::transaction()`, kalau ada satu operasi yang gagal,
> semua operasi sebelumnya otomatis di-rollback, database kembali bersih."

---

**Q3. "Tunjukkan di kode mana yang disebut 'sinkronisasi keranjang belanja'?"**

> **Jawaban:** (tunjuk kode baris 85–97)
> "Di sini, Pak/Bu. Frontend React mengirim data berupa array `items` yang berisi semua
> produk yang dibeli. Di backend, array itu di-loop menggunakan `foreach`. Setiap iterasi:
> satu baris di-insert ke `detail_penjualans` dengan `$penjualan->detailPenjualans()->create([...])`,
> dan stok produk dikurangi dengan `$produk->decrement('stok', $item['qty'])`.
> Jadi kalau ada 5 produk di keranjang, loop berjalan 5 kali."

---

**Q4. "Apa bedanya `decrement()` dan `$produk->stok -= qty; $produk->save()`?"**

> **Jawaban:**
> "`decrement()` lebih aman karena operasinya terjadi langsung di level database dalam
> satu SQL query: `UPDATE produks SET stok = stok - qty WHERE id = ?`. Cara manual
> dengan minus dan save memerlukan dua langkah: baca nilai stok dulu ke PHP, baru kurangi
> dan kirim balik. Kalau dua kasir memproses penjualan produk yang sama di waktu bersamaan,
> cara manual bisa salah karena keduanya membaca nilai stok yang sama sebelum ada yang
> meng-update. `decrement()` tidak punya masalah ini karena pengurangan terjadi di database."

---

**Q5. "Di kode penjualan, ada `if ($validated['jenis_pembayaran'] === 'Tunai')`. Kenapa pakai `===` bukan `==`?"**

> **Jawaban:**
> "`===` adalah strict comparison — membandingkan nilai DAN tipe data. `==` hanya
> membandingkan nilai dengan type coercion. Di PHP, `0 == 'Tunai'` bisa bernilai `true`
> karena PHP mengkonversi string ke integer saat perbandingan longgar. Dengan `===`,
> `0 === 'Tunai'` pasti `false`. Untuk kondisi yang kritis seperti ini, lebih aman
> pakai `===`."

---

**Q6. "Bedakan logika pembelian dengan penjualan. Apa yang berbeda?"**

> **Jawaban:**
> "Ada tiga perbedaan utama. Pertama, stok: penjualan mengurangi stok `produks` (barang keluar),
> pembelian menambah stok `bahan_bakus` (barang masuk). Kedua, kas: penjualan tunai mencatat
> `masuk` di tabel kas, pembelian tunai mencatat `keluar`. Ketiga, kredit: penjualan kredit
> masuk ke tabel `piutangs` (uang akan masuk dari pelanggan), pembelian kredit masuk ke
> tabel `hutangs` (uang akan keluar ke pemasok). Ada satu tambahan: di pembelian ada validasi
> saldo kas sebelum transaksi tunai — sistem mengecek apakah kas perusahaan cukup."

---

### ▸ Kelompok B: Pertanyaan Menggali (Mungkin Ditanya)

**Q7. "Bagaimana sistem men-generate nomor faktur otomatis?"**

> **Jawaban:** (tunjuk baris 69–74 PenjualanController)
> "Sistem ambil penjualan dengan ID terbesar menggunakan `orderBy('id', 'desc')->first()`.
> Lalu ambil angka terakhir dari kode faktur menggunakan `str_pad()` untuk format 5 digit
> dengan padding nol. Contoh: ID berikutnya = 7, maka nomor faktur = `INV-00007`."

---

**Q8. "Di PembelianController, ada pengecekan `Kas::sum('masuk') - Kas::sum('keluar')`. Ini menghitung apa?"**

> **Jawaban:**
> "Itu menghitung saldo kas real-time. Sistem tidak menyimpan saldo sebagai satu angka,
> melainkan menjumlahkan semua pemasukan yang pernah dicatat di tabel `kash` dikurangi
> semua pengeluaran. Ini pendekatan akuntansi yang lebih akurat — setiap pergerakan uang
> dicatat sebagai baris tersendiri, saldo bisa dihitung kapanpun dari riwayat."

---

**Q9. "Kenapa validasi stok dilakukan di LUAR `DB::transaction()`, bukan di dalamnya?"**

> **Jawaban:**
> "Efisiensi dan desain. Membuka `DB::transaction()` itu mahal secara resource — ia
> mengunci bagian database. Kalau kita buka transaction hanya untuk menemukan stok tidak
> cukup dan langsung rollback, itu pemborosan. Lebih baik validasi dulu di luar, kalau
> ada masalah langsung `return back()` tanpa membuka transaction sama sekali."

---

**Q10. "Apa fungsi `$errors[]` dengan format array di validasi stok, bukan langsung return?"**

> **Jawaban:**
> "Supaya semua error stok dari semua item terkumpul dulu sebelum dikembalikan ke user.
> Kalau langsung return di item pertama yang bermasalah, user tidak tahu item ke-3 dan ke-4
> juga stoknya kurang. Harus submit ulang dua kali untuk tahu semua errornya.
> Dengan array, semua error stok dikumpulkan dulu, baru satu kali `return back()` dengan
> semua pesan error sekaligus."

---

---

## 🟡 ANGGOTA 2 — (Laporan Keuangan)
### Modul: LaporanController — Cash Flow, Laba Rugi, Neraca, Pajak
**File Utama:** `LaporanController.php`

---

### ▸ Kelompok A: Pertanyaan Pembuka

**Q1. "Ada berapa jenis laporan di sistem ini dan apa saja?"**

> **Jawaban:**
> "Ada empat jenis laporan: (1) **Laporan Arus Kas** (Cash Flow) — menampilkan aliran
> uang masuk dan keluar beserta saldo. (2) **Laporan Laba Rugi** (Income Statement) —
> menghitung pendapatan dikurangi HPP dan beban operasional untuk mengetahui laba bersih.
> (3) **Neraca/Laporan Posisi Keuangan** (Balance Sheet) — menampilkan aset, kewajiban,
> dan ekuitas. (4) **Laporan Pajak PPh Final** — kalkulasi kewajiban pajak 0,5% dari omzet
> per bulan."

---

**Q2. "Jelaskan bagaimana saldo kas dihitung di laporan arus kas!"**

> **Jawaban:** (tunjuk baris 56–57 LaporanController)
> "Saldo awal kas dihitung dengan query: semua `masuk` sebelum tanggal awal periode dikurangi
> semua `keluar` sebelum tanggal awal periode. Kemudian saldo akhir = saldo awal + total
> inflow periode - total outflow periode. Tidak ada kolom 'saldo' yang tersimpan — selalu
> dihitung real-time dari akumulasi seluruh riwayat kas."

---

**Q3. "Apa itu `selectRaw('sumber, SUM(masuk) as total')` dan `groupBy('sumber')` di kode ini?"**

> **Jawaban:** (tunjuk baris 62–63)
> "`selectRaw()` adalah cara menulis ekspresi SQL mentah di dalam Eloquent. `SUM(masuk)`
> adalah fungsi agregat SQL yang menjumlahkan semua nilai kolom `masuk`.
> `groupBy('sumber')` mengelompokkan hasil berdasarkan kolom `sumber` — jadi hasilnya
> satu baris per sumber (penjualan, pembelian, piutang, dll), masing-masing berisi total
> uang masuk dari sumber tersebut."

---

**Q4. "Bagaimana HPP (Harga Pokok Penjualan) dihitung di laporan laba rugi?"**

> **Jawaban:** (tunjuk baris 132–136)
> "HPP dihitung dengan query yang melibatkan tiga tabel sekaligus menggunakan JOIN:
> `detail_penjualans` di-join dengan `penjualans` (untuk filter tanggal) dan `produks`
> (untuk mengambil nilai `hpp` per produk). Kemudian `SUM(qty × hpp)` — jumlah yang
> terjual dikali harga pokok masing-masing produk, dijumlahkan seluruhnya."

---

**Q5. "Kenapa ada dua fungsi untuk setiap laporan, misalnya `incomeStatement()` dan `incomeStatementPdf()`?"**

> **Jawaban:**
> "Karena ada dua output yang berbeda untuk data yang sama. `incomeStatement()` merender
> halaman React via Inertia untuk ditampilkan di browser. `incomeStatementPdf()` menggunakan
> library `barryvdh/laravel-dompdf` untuk menghasilkan file PDF yang bisa diunduh.
> Kalkulasi datanya sama — keduanya memanggil private method `getIncomeStatementData()` —
> hanya output-nya yang berbeda."

---

### ▸ Kelompok B: Pertanyaan Menggali

**Q6. "Apa itu `private function getIncomeStatementData()`? Kenapa `private`?"**

> **Jawaban:**
> "`private` artinya fungsi ini hanya bisa dipanggil dari dalam class `LaporanController`
> sendiri, tidak bisa dari luar. Ini prinsip enkapsulasi — menyembunyikan detail implementasi.
> Fungsi ini berisi logika kalkulasi data laporan, dan karena dua method publik
> (`incomeStatement` dan `incomeStatementPdf`) memerlukan data yang sama, logikanya
> di-extract ke satu fungsi private untuk menghindari duplikasi kode (DRY — Don't Repeat Yourself)."

---

**Q7. "Di neraca, ada `abs($totalAset - $totalKewajibanDanEkuitas) < 0.01`. Ini untuk apa?"**

> **Jawaban:** (tunjuk baris 301)
> "Ini adalah pengecekan apakah neraca *balance* (seimbang). Dalam akuntansi, rumusnya:
> `Aset = Kewajiban + Ekuitas`. Kalau sistem benar, nilainya harus sama.
> Kita tidak pakai `===` karena ada kemungkinan kesalahan presisi floating point
> (misalnya `0.0000000001` perbedaan karena perhitungan desimal). Kalau selisihnya
> kurang dari 0.01 rupiah, dianggap seimbang. Hasilnya dikirim ke frontend sebagai
> `isBalanced` untuk menampilkan indikator visual."

---

**Q8. "Bagaimana sistem menghitung piutang yang masih outstanding di neraca?"**

> **Jawaban:** (tunjuk baris 209–211)
> "Sistem mengambil total nominal semua piutang yang pernah dibuat hingga tanggal neraca,
> lalu dikurangi total pembayaran piutang yang sudah masuk hingga tanggal yang sama.
> Hasilnya adalah nilai piutang yang masih belum lunas. Ini lebih akurat daripada
> hanya mengambil piutang dengan status `belum_lunas` karena bisa memperhitungkan
> pembayaran parsial (cicilan)."

---

**Q9. "Apa itu `Carbon::now()->startOfMonth()->toDateString()`?"**

> **Jawaban:**
> "`Carbon` adalah library PHP untuk manipulasi tanggal — di-include otomatis oleh Laravel.
> `Carbon::now()` = waktu sekarang. `->startOfMonth()` = set ke hari pertama bulan ini,
> jam 00:00:00. `->toDateString()` = konversi ke format string `'YYYY-MM-DD'`.
> Ini dipakai sebagai nilai default filter tanggal awal laporan — kalau user tidak pilih
> tanggal, sistem otomatis tampilkan data bulan berjalan."

---

**Q10. "Laporan pajak menggunakan tarif 0,5%. Itu dari mana?"**

> **Jawaban:** (tunjuk baris 164 dan 386)
> "0,5% adalah tarif PPh Final untuk UMKM sesuai PP Nomor 55 Tahun 2022.
> Di kode: `$bebanPajak = $pendapatan * 0.005`. Jadi pajak = 0,5% dari total omzet/pendapatan
> penjualan, bukan dari laba. Ini sesuai regulasi perpajakan untuk usaha mikro kecil menengah
> dengan omzet di bawah 4,8 miliar per tahun."

---

---

## 🟢 ANGGOTA 3 — (Master Data)
### Modul: ProdukController + Master Data Lainnya
**File Utama:** `ProdukController.php`, `BahanBakuController.php`, `PelangganController.php`, dll.

---

### ▸ Kelompok A: Pertanyaan Pembuka

**Q1. "Apa yang dimaksud 'Master Data' di sistem ini?"**

> **Jawaban:**
> "Master Data adalah data referensi yang dipakai oleh modul transaksi. Di sistem ini ada:
> Produk (barang yang dijual), Bahan Baku (bahan yang dibeli), Pelanggan, Pemasok,
> Metode Pembayaran, dan Peralatan. Data ini tidak berubah setiap transaksi — dia dipakai
> berulang kali sebagai referensi. Tanpa master data, transaksi tidak bisa dilakukan
> karena tidak ada produk atau pelanggan yang bisa dipilih."

---

**Q2. "Di `ProdukController@store()`, kenapa ada `DB::transaction()` padahal hanya simpan produk?"**

> **Jawaban:** (tunjuk baris 44–61 ProdukController)
> "Karena menyimpan produk baru tidak hanya insert ke tabel `produks` saja — ada juga
> insert resep bahan baku ke tabel `reseps`. Resep mendefinisikan bahan baku apa saja
> dan berapa qty yang dibutuhkan untuk membuat satu unit produk ini.
> Kalau produk berhasil dibuat tapi resep gagal (atau sebaliknya), data akan tidak
> konsisten. Dengan transaction, keduanya sukses atau keduanya gagal."

---

**Q3. "Apa itu `Form Request` seperti `StoreProdukRequest`? Kenapa tidak validasi langsung di controller seperti penjualan?"**

> **Jawaban:** (tunjuk baris 5–6, 40)
> "`StoreProdukRequest` adalah class validasi terpisah di `app/Http/Requests/`. Validasi
> dipisahkan dari controller untuk menjaga controller tetap bersih (Single Responsibility
> Principle). Keuntungannya: logika validasi bisa dipakai ulang, lebih mudah di-test
> secara terpisah, dan controller tidak perlu tahu aturan validasinya.
> Di PenjualanController, validasi langsung di controller karena lebih sederhana dan
> tidak perlu dipakai ulang."

---

**Q4. "Di `update()`, ada `unset($data['stok'])`. Kenapa stok tidak boleh diubah dari form edit produk?"**

> **Jawaban:** (tunjuk baris 75)
> "Stok produk hanya boleh berubah melalui transaksi resmi: bertambah dari modul Produksi
> atau Koreksi Stok, berkurang dari modul Penjualan. Kalau admin bisa bebas edit stok
> dari form master data produk, data stok tidak akan mencerminkan kondisi riil.
> `unset($data['stok'])` memastikan field stok dari form edit diabaikan — tidak bisa
> diubah secara langsung."

---

**Q5. "Jelaskan fungsi `generateKode()` di ProdukController!"**

> **Jawaban:** (tunjuk baris 29–38)
> "Fungsi ini membuat kode produk secara otomatis. Cara kerjanya: ambil produk dengan
> ID terbesar, lalu gunakan regex `preg_match('/-(\d+)$/', ...)` untuk mengambil angka
> di akhir kode terakhir. Angka itu ditambah 1, lalu diformat dengan `str_pad()` menjadi
> 4 digit. Contoh: kode terakhir `PRD-0005`, angka yang diambil `5`, berikutnya `6`,
> hasilnya `PRD-0006`. Kode ini ditampilkan sebagai default di form — user bisa mengubahnya."

---

### ▸ Kelompok B: Pertanyaan Menggali

**Q6. "Apa itu Eager Loading dan kenapa dipakai di index()?"**

> **Jawaban:**
> "Eager Loading adalah teknik mengambil data relasi sekaligus dalam satu query, bukan
> satu per satu. Misalnya kalau ada 50 produk dan kita perlu nama bahan baku di setiap
> resepnya, tanpa eager loading: 1 query untuk 50 produk + 50 query untuk resep = 51 query.
> Dengan `->with('reseps')`, hanya 2 query total. Ini menghindari masalah N+1 Query
> yang membuat halaman lambat."

---

**Q7. "Apa itu `Route Model Binding` yang dipakai di `edit(Produk $product)` dan `destroy(Produk $product)`?"**

> **Jawaban:**
> "Route Model Binding adalah fitur Laravel yang secara otomatis mengambil record dari
> database berdasarkan parameter di URL. Di route `/products/{product}/edit`, Laravel
> melihat `{product}` dan tipe parameter `Produk $product` di fungsi, lalu otomatis
> melakukan `Produk::findOrFail($id)`. Kalau ID tidak ditemukan, otomatis return 404.
> Kita tidak perlu menulis kode pencarian sendiri."

---

**Q8. "Di `update()`, ada `$product->reseps()->delete()` lalu insert ulang. Kenapa tidak pakai `sync()`?"**

> **Jawaban:** (tunjuk baris 87–93)
> "Komentar di kode menyebut 'Sync recipe: delete old and create new'. Pendekatan ini
> disebut 'Delete and Recreate' — hapus semua resep lama lalu insert resep baru dari form.
> Keuntungannya: simpel dan selalu konsisten. Alternatif `sync()` tersedia di relasi
> many-to-many (belongsToMany), tapi resep di sini menggunakan hasMany yang lebih sederhana
> sehingga delete-and-recreate adalah pilihan yang wajar."

---

---

## 🔵 ANGGOTA 4 — (Users & Auth)
### Modul: UserController, EnsureUserHasRole Middleware, Role System
**File Utama:** `UserController.php`, `EnsureUserHasRole.php`, migration role

---

### ▸ Kelompok A: Pertanyaan Pembuka

**Q1. "Sistem ini punya berapa role dan apa bedanya?"**

> **Jawaban:**
> "Ada tiga role: `admin`, `finance`, dan `owner`. Di route `web.php`:
> - `admin` dan `finance`: bisa mengakses semua modul transaksi dan master data (baca + tulis).
> - `owner`: hanya bisa baca (lihat laporan, lihat daftar transaksi) — tidak bisa tambah/hapus data.
> - Hanya `admin` yang bisa mengelola pengguna (modul Users).
> Ini mengikuti prinsip Least Privilege: user hanya mendapat akses yang mereka butuhkan."

---

**Q2. "Jelaskan cara kerja middleware `EnsureUserHasRole`!"**

> **Jawaban:** (tunjuk semua baris EnsureUserHasRole.php)
> "Middleware adalah kode yang dijalankan sebelum request sampai ke controller. Fungsi
> `handle()` menerima request, closure `$next` (untuk lanjutkan ke controller), dan
> `...$roles` (daftar role yang diizinkan — bisa lebih dari satu, pakai spread operator).
> Di dalam: cek apakah user sudah login DAN apakah role-nya ada di array `$roles` yang
> diizinkan. Kalau tidak memenuhi syarat, `abort(403)` — kembalikan error 403 Forbidden.
> Kalau lolos, `$next($request)` — teruskan ke controller."

---

**Q3. "Apa itu `Hash::make($validated['password'])` di store()?"**

> **Jawaban:** (tunjuk baris 47)
> "`Hash::make()` adalah fungsi Laravel untuk mengubah password plain text menjadi
> hash yang aman menggunakan algoritma bcrypt. Password tidak pernah disimpan dalam
> bentuk aslinya di database. Kalau database bocor, hacker tidak bisa membaca password.
> Verifikasi dilakukan dengan `Hash::check(inputPassword, hashDiDatabase)` — membandingkan
> hash, bukan password langsung."

---

**Q4. "Di `update()`, kenapa ada `Rule::unique('users')->ignore($user->id)`?"**

> **Jawaban:** (tunjuk baris 79)
> "Validasi `unique` memastikan email tidak boleh sama dengan user lain. Tapi saat update,
> email yang ada saat ini adalah milik user itu sendiri — kalau tidak ada `->ignore($user->id)`,
> sistem akan menganggap email user itu sendiri sudah 'dipakai orang lain' dan menolak
> update meskipun emailnya tidak berubah. `->ignore($user->id)` = kecualikan baris
> dengan ID ini dari pengecekan uniqueness."

---

**Q5. "Di `destroy()`, ada pengecekan `auth()->id() === $user->id`. Untuk apa?"**

> **Jawaban:** (tunjuk baris 104–106)
> "Ini adalah safety guard: mencegah admin menghapus akun milik dirinya sendiri.
> `auth()->id()` = ID user yang sedang login. `$user->id` = ID user yang akan dihapus.
> Kalau sama, tolak dengan pesan error dan redirect kembali. Tanpa proteksi ini,
> admin bisa tidak sengaja (atau sengaja) menghapus akunnya sendiri dan tidak bisa
> login lagi."

---

### ▸ Kelompok B: Pertanyaan Menggali

**Q6. "Bagaimana cara mendaftarkan middleware `EnsureUserHasRole` ke sistem Laravel?"**

> **Jawaban:**
> "Di `bootstrap/app.php`, middleware ini didaftarkan dengan alias `'role'`.
> Setelah itu, di `routes/web.php` bisa dipakai dengan `Route::middleware(['role:admin,finance'])`.
> Parameter setelah titik dua (`admin,finance`) dikirim sebagai `...$roles` ke method
> `handle()` middleware."

---

**Q7. "Kenapa `password` di validasi `update()` pakai `nullable` tapi di `store()` pakai `required`?"**

> **Jawaban:** (tunjuk baris 40 vs 80)
> "Saat membuat user baru (`store`), password wajib ada — tidak mungkin buat akun tanpa password.
> Saat update, admin mungkin hanya ingin mengubah nama atau role tanpa mengubah password.
> Dengan `nullable`, kalau field password dikosongkan di form edit, sistem tidak akan
> mengubah password. Baris `if (!empty($validated['password'])) { $data['password'] = ... }`
> memastikan password hanya di-update kalau memang diisi."

---

**Q8. "Apa itu `'confirmed'` dalam validasi password di store()?"**

> **Jawaban:** (tunjuk baris 40)
> "`confirmed` adalah validation rule Laravel yang mengecek apakah ada field
> `password_confirmation` di request yang nilainya sama dengan `password`.
> Ini untuk fitur 'ketik password dua kali' di form registrasi/tambah user.
> Kalau tidak sama, validasi gagal dengan pesan 'The password field confirmation does not match.'"

---

**Q9. "Kenapa `show()` di UserController langsung `abort(404)`?"**

> **Jawaban:** (tunjuk baris 57–60)
> "Halaman detail user (`GET /users/{id}`) tidak diimplementasikan di sistem ini.
> Tapi karena menggunakan `Route::resource('users', ...)` yang otomatis membuat 7 route,
> termasuk `show`, route ini tetap ada tapi sengaja dikosongkan dengan `abort(404)`.
> Alternatifnya bisa pakai `->except(['show'])` di route resource untuk tidak membuat
> route itu sama sekali."

---

---

## 🎯 PERTANYAAN LINTAS ANGGOTA (bisa ditanya ke siapa saja)

**Q: "Jelaskan alur data dari user klik tombol simpan di browser sampai data tersimpan di database!"**
> FAH harus bisa jelaskan: React `submit()` → Inertia POST → `web.php` routing → `store()` controller → Model → DB

**Q: "Apa itu Inertia.js dan perannya di sistem ini?"**
> Siapapun harus tahu: jembatan antara Laravel backend dan React frontend. Mengirim data PHP sebagai props React.

**Q: "Bagaimana sistem ini membedakan user yang boleh edit dan yang hanya boleh lihat?"**
> Anggota Users harus jelaskan middleware, anggota lain bisa tambahkan dari perspektif routing.

**Q: "Apa keuntungan menggunakan Laravel Eloquent ORM dibanding query SQL langsung?"**
> Semua anggota harus bisa menjawab: lebih mudah dibaca, relasi tersedia sebagai method, type safe, mencegah SQL injection.

**Q: "Di project ini, bagian mana yang paling kompleks menurut kalian?"**
> Jawaban ideal: modul laporan keuangan (karena melibatkan kalkulasi akuntansi multi-tabel) dan modul penjualan (karena transaksi atomik yang melibatkan banyak tabel).

---

*Dokumen ini dibuat berdasarkan kode aktual:*
*`PenjualanController.php` | `PembelianController.php` | `LaporanController.php` |*
*`ProdukController.php` | `UserController.php` | `EnsureUserHasRole.php`*
