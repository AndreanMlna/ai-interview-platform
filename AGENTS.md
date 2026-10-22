# Project Rules & Engineering Guidelines: RAKAMIN AI-INTERVIEW-PLATFORM

> **Core Philosophy: Monozukuri & Product Engineering Excellence**  
> Sistem ini dikembangkan untuk **Studi Kasus Rakamin: Fullstack Product Engineer (Backend Track)** pada repositori `github.com/rakamindev/ai-interview-platform`.  
> Pendekatan yang diwajibkan bukan sekadar insinyur konvensional yang menunggu spesifikasi, melainkan **Product Engineer berstandar Staff/Principal** yang berpikir dari *first principles*, memiliki *deep care* terhadap dampak nyata produk, menjunjung tinggi tradisi keahlian **Monozukuri (Craftsmanship beyond minimum baseline)**, mematuhi standar keandalan **Google SRE & Clean Architecture**, serta patuh pada regulasi hukum **UU No. 27/2022 tentang Perlindungan Data Pribadi (UU PDP)**.

---

## 1. Konteks Domain & Ekosistem Teknologi (System Landscape)

1. **Tech Stack & Arsitektur Sistem**:
   - **Backend (`api/`)**: Ruby on Rails, PostgreSQL, Sidekiq (asynchronous job processing), RSpec (testing harness), dan integrasi LLM (Google Gemini AI API).
   - **Frontend (`web/`)**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Lucide Icons.
   - **Baseline Reality**: Repositori awal tidak memiliki test specs di RSpec, web app belum memiliki test runner, dan belum ada CI. Menginisiasi test harness dan membuktikan kebenaran sistem adalah tanggung jawab insinyur (*ownership*).

2. **5 Pilar Domain Immersion**:
   - **The Product**: Platform evaluasi wawancara berbasis AI end-to-end.
   - **The Industry**: Ekosistem rekrutmen dan asesmen talenta di Indonesia (mengatasi bias seleksi, inefisiensi manual, dan skala penilaian).
   - **What It Is For**: Menghasilkan penilaian wawancara yang objektif, transparan, akurat, dan dapat dipertanggungjawabkan bagi kandidat maupun perekrut.
   - **The Users**: Assessor, recruiter, dan hiring manager yang membutuhkan data ringkas, akurat, dan dapat ditindaklanjuti secara cepat.
   - **The People Affected Who Never Chose It**: Kandidat pelamar kerja. Kandidat tidak memilih sistem ini dan tidak bisa *opt out*. Keputusan AI yang salah mengubah nasib hidup seseorang. Oleh karena itu, *fairness*, sanitasi data, dan kehati-hatian evaluasi adalah prioritas mutlak.

---

## 2. Alur Eksekusi Wajib (Step-by-Step Framework)

Seluruh proses pengembangan wajib mengikuti tahapan resmi dari Rakamin:

- **Step 1: Setup & Local Exploration**:
  - Clone `github.com/rakamindev/ai-interview-platform`, jalankan kedua servis (`api/` dan `web/`).
  - Buat *feature branch* dari `main` (jangan pernah commit langsung ke `main`). Buat commit kecil, terstruktur, dan informatif (*semantic commits*).
  - Bangun fondasi *testing harness* pada servis yang disentuh.
- **Step 2: Deep Context & Domain Immersion**:
  - Pahami dan uji sistem end-to-end sebelum menghakimi kode. Identifikasi di mana titik *leverage* terbesar produk berada.
- **Step 3: Defining Problem & Gap to Ideal Condition**:
  - Telusuri alur nyata, inspeksi skema DB dan payload API untuk mengidentifikasi celah antara implementasi rusak/kurang dan kondisi ideal.
  - Kategorikan temuan berdasarkan severitas (**P0, P1, P2, P3**) lengkap dengan *one-line impact statement*.
  - Pisahkan dengan tegas antara **Missing Specification** (belum pernah didefinisikan) vs **Defective Implementation** (didefinisikan tapi rusak/buggy).
  - Berikan **Constraint Signal**: Dokumentasikan risiko penghambat, ambiguitas, atau utang arsitektural yang perlu dieskalasikan ke Technical Lead.
- **Step 4: Revamp Strategy, Acceptance Criteria & Trade-offs**:
  - Tentukan **Self-Defined Acceptance Criteria** yang mencakup seluruh *edge cases* (unassessed skills, missing ratings, model call failure, payload data types, long text rendering).
  - Evaluasi opsi solusi secara komparatif (**Option A vs Option B**) dengan 4 kriteria:
    1. *Product Impact vs Cost*
    2. *Long-term Maintainability*
    3. *Failure Modes* (ketika model lambat, timeout, data ekstrem)
    4. *Contextual Fit* terhadap batasan waktu dan arsitektur repositori.
- **Step 5: Monozukuri Implementation & Pull Request**:
  - Implementasi *fullstack slice* (backend API, skema DB, tampilan antarmuka, dan pengujian otomatis).
  - Terapkan standar Monozukuri (lihat Bagian 3).
- **Step 6: Final Submission & Live Defense Preparation**:
  - Susun laporan komprehensif dalam format **Single PDF Document** yang mencerminkan perjalanan Step 1 s.d. Step 5.
  - Sertakan tautan Open Pull Request di GitHub, visual screenshots lengkap, dan tautan Video Walkthrough (3-5 menit via Loom / YouTube Unlisted / GDrive).
  - Bersiap untuk sesi *Live Technical Defense* (45-60 menit) bersama CTO dan Technical Lead.

---

## 3. Standar Rekayasa & Kualitas Monozukuri (Engineering Rigor)

1. **Proven Correctness & Test Harness**:
   - Setiap logika bisnis, kalkulasi nilai, dan transisi status wajib diproteksi oleh automated tests (RSpec untuk backend, Vitest/React Testing Library untuk web).
   - Wajib menyaksikan tes gagal (*red*) sebelum membuatnya lulus (*green*) untuk memastikan asersi benar-benar valid.

2. **Seeded Fault Test (Bukti Validitas Tes)**:
   - Wajib melakukan dan mendokumentasikan *seeded fault test*: sengaja merusak logika pada *scratch branch* untuk membuktikan tes otomatis berhasil menangkap kegagalan tersebut, lalu revert kembali dengan riwayat git terlihat jelas.

3. **Designed Failure Paths & Asynchronous Resilience**:
   - Panggilan ke model AI (Gemini) tidak boleh memblokir request synchronous secara rapuh. Gunakan background worker (Sidekiq) jika diperlukan.
   - Tangani secara eksplisit: timeout LLM, *rate limits* (HTTP 429), partial writes, malformed JSON response, dan duplikasi job (*idempotency keys*).

4. **Data Protection & Kepatuhan Hukum (UU PDP No. 27/2022)**:
   - Migrasi database harus *zero-downtime*, dapat dibatalkan (*reversible*), dan aman terhadap baris data yang sudah ada (*safe against existing rows*).
   - Semua endpoint wajib terotorisasi dan input tervalidasi ketat (*strong parameters*).
   - **DILARANG KERAS** membocorkan PII (nama lengkap kandidat, email, nomor kontak, isi resume privat) ke dalam log sistem, prompt LLM tanpa masking, commit git, atau repositori publik.

5. **Polished UI/UX Interface (Web Craftsmanship)**:
   - Antarmuka web harus mencerminkan selera visual premium (*high aesthetic taste*), tipografi bersih, layout responsif, dan mikro-interaksi yang intuitif.
   - Wajib menangani **6 Kondisi Interaksi (Interaction States)** secara sempurna:
     1. *Loading state* (skeleton / spinner halus)
     2. *Empty state* (panduan jelas saat data kosong)
     3. *Error state* (pesan pemulihan yang informatif dan manusiawi)
     4. *Partial state* (tampilan data yang baru selesai sebagian)
     5. *Long text state* (wrapping/truncation yang elegan untuk feedback wawancara panjang)
     6. *Responsive views* (tampilan mobile dan desktop).

6. **AI Verification Moment**:
   - Dokumentasikan secara eksplisit minimal 1 momen nyata saat bantuan AI (code generator) memberikan kode/asumsi yang salah atau berisiko, serta bagaimana insinyur mendeteksi, menguji, dan memperbaikinya.

---

## 4. Pelanggaran Fatal yang Mengakibatkan Diskualifikasi (Non-Negotiable Disqualifiers)

Tindakan-tindakan berikut menyebabkan penolakan langsung (*immediate decline*):
1. **Melemahkan atau menghapus asersi tes** hanya agar pengujian lulus.
2. **Melakukan commit rahasia (*secrets*), API key Gemini/database credentials, atau data pribadi nyata**.
3. **Mengirimkan kode yang tidak dapat dijelaskan atau dipertanggungjawabkan** saat sesi *technical interview / defense*.
4. **Mengirimkan perubahan yang hanya diuji pada *happy path*** tanpa memperhitungkan *edge cases* dan kegagalan.
5. **Menjiplak atau mereproduksi pekerjaan kandidat lain** tanpa atribusi yang sah.
6. **Kualitas desain UI/UX yang buruk, asal-asalan, atau diabaikan**.

---

## 5. Automatic Skill Discovery & AI Assistant Operating Rules

- **Proactive Contextual Checking**: Sebelum mengeksekusi analisis, perancangan, atau penulisan kode, asisten AI wajib memindai katalog skill yang relevan (seperti `api-builder`, `clean-code`, `frontend-expert`, `ui-ux-pro-max`, `gemini-api-dev`).
- **Verifikasi Faktual & Anti-Halusinasi**: Verifikasi struktur kode repositori, berkas konfigurasi, versi pustaka Rails & React sebelum memberikan rekomendasi teknis.
- **Bahasa & Artikulasi**: Gunakan bahasa Indonesia profesional, terstruktur, berbasis bukti empiris (*deductive reasoning*), dan selalu sertakan argumen *trade-off* teknis yang objektif.
