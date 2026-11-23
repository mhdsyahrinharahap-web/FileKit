(() => {
  'use strict';

  /* ================= KONFIGURASI CDN ================= */
  const CDN = {
    pdfLib: 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    pdfjs: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
    pdfWorker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
    jszip: 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
    jspdf: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  };

  const loadedScripts = new Map();

  function loadScript(url) {
    if (loadedScripts.has(url)) return loadedScripts.get(url);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loadedScripts.delete(url);
        reject(new Error('Gagal memuat library dari CDN. Periksa koneksi internet kamu.'));
      };
      document.head.appendChild(s);
    });
    loadedScripts.set(url, p);
    return p;
  }

  async function getPdfLib() {
    if (!window.PDFLib) await loadScript(CDN.pdfLib);
    return window.PDFLib;
  }

  async function getPdfJs() {
    if (!window.pdfjsLib) await loadScript(CDN.pdfjs);
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN.pdfWorker;
    return window.pdfjsLib;
  }

  async function getJsZip() {
    if (!window.JSZip) await loadScript(CDN.jszip);
    return window.JSZip;
  }

  async function getJsPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) await loadScript(CDN.jspdf);
    return window.jspdf.jsPDF;
  }

  /* ================= ELEMEN DOM ================= */
  const appTabs = Array.from(document.querySelectorAll('.app-tab'));
  const toolHeading = document.getElementById('toolHeading');
  const toolSubheading = document.getElementById('toolSubheading');
  const dropzone = document.getElementById('dropzone');
  const dropzoneHint = document.getElementById('dropzoneHint');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');

  const optionsCompress = document.getElementById('optionsCompress');
  const optionsMerge = document.getElementById('optionsMerge');
  const optionsSplit = document.getElementById('optionsSplit');
  const optionsConvert = document.getElementById('optionsConvert');
  const optionsWatermark = document.getElementById('optionsWatermark');
  const optionsMetadata = document.getElementById('optionsMetadata');
  const optionsPassword = document.getElementById('optionsPassword');

  const compressQuality = document.getElementById('compressQuality');
  const compressQualityVal = document.getElementById('compressQualityVal');
  const splitMode = document.getElementById('splitMode');
  const splitPagesGroup = document.getElementById('splitPagesGroup');
  const splitPagesInput = document.getElementById('splitPagesInput');
  const splitPageInfo = document.getElementById('splitPageInfo');
  const convertTarget = document.getElementById('convertTarget');

  const watermarkText = document.getElementById('watermarkText');
  const watermarkLayout = document.getElementById('watermarkLayout');
  const watermarkColor = document.getElementById('watermarkColor');
  const watermarkOpacity = document.getElementById('watermarkOpacity');
  const watermarkOpacityVal = document.getElementById('watermarkOpacityVal');

  const passwordMode = document.getElementById('passwordMode');
  const pdfPasswordLabel = document.getElementById('pdfPasswordLabel');
  const pdfPasswordInput = document.getElementById('pdfPasswordInput');
  const togglePdfPasswordBtn = document.getElementById('togglePdfPasswordBtn');
  const encryptOptionsGroup = document.getElementById('encryptOptionsGroup');
  const allowPrintCheck = document.getElementById('allowPrintCheck');
  const pdfPasswordNote = document.getElementById('pdfPasswordNote');

  const progressArea = document.getElementById('progressArea');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const errorBox = document.getElementById('errorBox');
  const clearBtn = document.getElementById('clearBtn');
  const actionBtn = document.getElementById('actionBtn');
  const resultBox = document.getElementById('resultBox');
  const resultTitle = document.getElementById('resultTitle');
  const resultMeta = document.getElementById('resultMeta');
  const downloadBtn = document.getElementById('downloadBtn');

  if (!dropzone || !fileInput || !actionBtn || !fileList) {
    return;
  }

  /* ================= STATE ================= */
  const TAB_META = {
    compress: {
      heading: 'Kompres Gambar & PDF',
      sub: 'Kecilkan ukuran file JPG, PNG, WebP, atau PDF langsung di perangkatmu.',
      hint: 'Pilih 1 file JPG, PNG, WebP, atau PDF',
      accept: '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf',
      allowedKinds: ['image', 'pdf'],
      multiple: false,
      minFiles: 1,
      cta: 'Kompres Sekarang',
    },
    merge: {
      heading: 'Gabung PDF & Gambar',
      sub: 'Satukan beberapa file PDF (atau kumpulan gambar) menjadi satu dokumen PDF utuh.',
      hint: 'Pilih 2 atau lebih file PDF, atau kumpulan gambar JPG/PNG/WebP',
      accept: '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp',
      allowedKinds: ['image', 'pdf'],
      multiple: true,
      minFiles: 2,
      cta: 'Gabungkan',
    },
    split: {
      heading: 'Pisah & Hapus Halaman PDF',
      sub: 'Ambil rentang halaman tertentu, hapus halaman yang tidak perlu, atau pecah tiap halaman ke ZIP.',
      hint: 'Pilih 1 file dokumen PDF',
      accept: '.pdf,application/pdf',
      allowedKinds: ['pdf'],
      multiple: false,
      minFiles: 1,
      cta: 'Proses PDF',
    },
    convert: {
      heading: 'Konversi Format File',
      sub: 'Ubah Gambar ke PDF, PDF ke Gambar (ZIP), atau tukar format JPG, PNG, dan WebP.',
      hint: 'Pilih 1 atau lebih gambar (JPG/PNG/WebP), atau 1 file PDF',
      accept: '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf',
      allowedKinds: ['image', 'pdf'],
      multiple: true,
      minFiles: 1,
      cta: 'Konversi',
    },
    watermark: {
      heading: 'Pasang Watermark Pengaman',
      sub: 'Tambahkan teks tanda air transparan pada foto KTP, dokumen scan, gambar, atau PDF langsung di browser.',
      hint: 'Pilih 1 atau lebih file JPG, PNG, WebP, atau PDF',
      accept: '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf',
      allowedKinds: ['image', 'pdf'],
      multiple: true,
      minFiles: 1,
      cta: 'Pasang Watermark',
    },
    metadata: {
      heading: 'Hapus Metadata & EXIF',
      sub: 'Bersihkan koordinat GPS, info perangkat kamera pada foto, dan metadata pembuat pada dokumen PDF.',
      hint: 'Pilih 1 atau lebih file JPG, PNG, WebP, atau PDF',
      accept: '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf',
      allowedKinds: ['image', 'pdf'],
      multiple: true,
      minFiles: 1,
      cta: 'Bersihkan Metadata',
    },
    password: {
      heading: 'Kunci & Buka Password PDF',
      sub: 'Lindungi dokumen PDF dengan kata sandi atau hapus password dari PDF milikmu langsung di browser.',
      hint: 'Pilih 1 file dokumen PDF',
      accept: '.pdf,application/pdf',
      allowedKinds: ['pdf'],
      multiple: false,
      minFiles: 1,
      cta: 'Kunci PDF',
    },
  };

  let currentTab = 'compress';
  let files = [];
  let activeBlobUrl = null;
  let isBusy = false;
  let dragIndex = null;

  /* ================= UTILITAS ================= */
  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return (bytes / Math.pow(1024, i)).toFixed(i >= 2 ? 2 : 0) + ' ' + units[i];
  }

  function stripExt(name) {
    return name.replace(/\.[^.]+$/, '') || 'file';
  }

  function detectFileKind(file) {
    const type = (file.type || '').toLowerCase();
    const ext = (file.name.split('.').pop() || '').toLowerCase();

    if (type === 'application/pdf' || ext === 'pdf') {
      return { kind: 'pdf', mime: 'application/pdf', label: 'PDF' };
    }
    if (type === 'image/jpeg' || ext === 'jpg' || ext === 'jpeg') {
      return { kind: 'image', mime: 'image/jpeg', label: 'JPG' };
    }
    if (type === 'image/png' || ext === 'png') {
      return { kind: 'image', mime: 'image/png', label: 'PNG' };
    }
    if (type === 'image/webp' || ext === 'webp') {
      return { kind: 'image', mime: 'image/webp', label: 'WEBP' };
    }
    return null;
  }

  function revokeBlob() {
    if (activeBlobUrl) {
      URL.revokeObjectURL(activeBlobUrl);
      activeBlobUrl = null;
    }
  }

  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.remove('is-hidden');
  }

  function clearFeedback() {
    if (errorBox) {
      errorBox.classList.add('is-hidden');
      errorBox.textContent = '';
    }
    if (resultBox) {
      resultBox.classList.add('is-hidden');
    }
    revokeBlob();
  }

  function setProgress(pct, label) {
    if (!progressArea || !progressBar || !progressText) return;
    progressArea.classList.remove('is-hidden');
    progressBar.style.width = Math.max(0, Math.min(100, pct)) + '%';
    progressText.textContent = label;
  }

  function hideProgress() {
    if (!progressArea || !progressBar) return;
    progressArea.classList.add('is-hidden');
    progressBar.style.width = '0%';
  }

  function updateActionState() {
    const meta = TAB_META[currentTab];
    actionBtn.disabled = isBusy || files.length < meta.minFiles;
    if (clearBtn) {
      clearBtn.classList.toggle('is-hidden', files.length === 0 || isBusy);
    }
  }

  function updateSplitModeUI() {
    if (!splitMode || !splitPagesGroup) return;
    const isBurst = splitMode.value === 'burst';
    splitPagesGroup.classList.toggle('is-hidden', isBurst);
  }

  function updatePasswordModeUI() {
    if (!passwordMode) return;
    const isEncrypt = passwordMode.value === 'encrypt';
    if (pdfPasswordLabel) {
      pdfPasswordLabel.textContent = isEncrypt ? 'Password Baru untuk PDF' : 'Password PDF Saat Ini';
    }
    if (pdfPasswordInput) {
      pdfPasswordInput.placeholder = isEncrypt
        ? 'Masukkan kata sandi baru (minimal 4 karakter)'
        : 'Masukkan password untuk membuka PDF';
      pdfPasswordInput.autocomplete = isEncrypt ? 'new-password' : 'current-password';
    }
    if (encryptOptionsGroup) {
      encryptOptionsGroup.classList.toggle('is-hidden', !isEncrypt);
    }
    if (pdfPasswordNote) {
      pdfPasswordNote.textContent = isEncrypt
        ? 'Simpan kata sandi ini baik-baik karena proses berjalan 100% di browser tanpa fitur reset password server.'
        : 'Masukkan kata sandi dokumen PDF milikmu untuk menyimpan salinan baru yang sudah bebas password.';
    }
    if (currentTab === 'password') {
      actionBtn.textContent = isEncrypt ? 'Kunci PDF' : 'Buka Password PDF';
    }
  }

  async function inspectSplitPdf(file) {
    if (!splitPageInfo) return;
    splitPageInfo.textContent = 'Membaca jumlah halaman PDF...';
    try {
      const PDFLib = await getPdfLib();
      const bytes = await file.arrayBuffer();
      const doc = await PDFLib.PDFDocument.load(bytes);
      const total = doc.getPageCount();
      splitPageInfo.textContent = 'Total halaman terdeteksi: ' + total + ' halaman.';
    } catch (err) {
      splitPageInfo.textContent = 'Gagal membaca struktur PDF. Pastikan file tidak rusak atau dikunci password.';
      showError('File PDF tidak dapat dibaca atau masih terproteksi password.');
    }
  }

  /* ================= RENDER DAFTAR FILE ================= */
  function renderFiles() {
    fileList.textContent = '';
    if (files.length === 0) {
      fileList.classList.add('is-hidden');
      if (currentTab === 'split' && splitPageInfo) {
        splitPageInfo.textContent = 'Pilih file PDF terlebih dahulu untuk melihat total halaman.';
      }
      updateActionState();
      return;
    }

    fileList.classList.remove('is-hidden');
    const canReorder = TAB_META[currentTab].multiple && files.length > 1;

    files.forEach((file, idx) => {
      const info = detectFileKind(file);
      const li = document.createElement('li');
      li.className = 'file-item';

      if (canReorder) {
        li.draggable = true;
        li.addEventListener('dragstart', () => {
          dragIndex = idx;
          li.classList.add('is-dragging');
        });
        li.addEventListener('dragend', () => {
          dragIndex = null;
          li.classList.remove('is-dragging');
        });
        li.addEventListener('dragover', (e) => e.preventDefault());
        li.addEventListener('drop', (e) => {
          e.preventDefault();
          if (dragIndex === null || dragIndex === idx) return;
          const moved = files.splice(dragIndex, 1)[0];
          files.splice(idx, 0, moved);
          renderFiles();
        });
      }

      const left = document.createElement('div');
      left.className = 'file-left';

      const badge = document.createElement('span');
      badge.className = 'file-badge';
      badge.textContent = info ? info.label : 'FILE';

      const meta = document.createElement('div');
      meta.className = 'file-meta';

      const nameEl = document.createElement('span');
      nameEl.className = 'file-name';
      nameEl.textContent = canReorder ? (idx + 1) + '. ' + file.name : file.name;

      const sizeEl = document.createElement('span');
      sizeEl.className = 'file-size';
      sizeEl.textContent = formatBytes(file.size);

      meta.appendChild(nameEl);
      meta.appendChild(sizeEl);
      left.appendChild(badge);
      left.appendChild(meta);

      const controls = document.createElement('div');
      controls.className = 'file-controls';

      if (canReorder) {
        const upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.className = 'mini-btn';
        upBtn.textContent = 'Naik';
        upBtn.disabled = idx === 0;
        upBtn.addEventListener('click', () => {
          [files[idx - 1], files[idx]] = [files[idx], files[idx - 1]];
          renderFiles();
        });

        const downBtn = document.createElement('button');
        downBtn.type = 'button';
        downBtn.className = 'mini-btn';
        downBtn.textContent = 'Turun';
        downBtn.disabled = idx === files.length - 1;
        downBtn.addEventListener('click', () => {
          [files[idx + 1], files[idx]] = [files[idx], files[idx + 1]];
          renderFiles();
        });

        controls.appendChild(upBtn);
        controls.appendChild(downBtn);
      }

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'mini-btn';
      delBtn.textContent = 'Hapus';
      delBtn.addEventListener('click', () => {
        files.splice(idx, 1);
        clearFeedback();
        renderFiles();
      });

      controls.appendChild(delBtn);
      li.appendChild(left);
      li.appendChild(controls);
      fileList.appendChild(li);
    });

    updateActionState();
  }

  function addFiles(incoming) {
    clearFeedback();
    const meta = TAB_META[currentTab];
    const list = Array.from(incoming || []);

    for (const f of list) {
      const info = detectFileKind(f);
      if (!info || !meta.allowedKinds.includes(info.kind)) {
        const allowedLabel = meta.allowedKinds.length === 1 && meta.allowedKinds[0] === 'pdf'
          ? 'PDF'
          : 'JPG, PNG, WebP, atau PDF';
        showError('Format "' + f.name + '" tidak didukung di tab ini. Gunakan ' + allowedLabel + '.');
        continue;
      }
      if (!meta.multiple) {
        files = [f];
        break;
      }
      files.push(f);
    }

    fileInput.value = '';
    renderFiles();

    if (currentTab === 'split' && files.length === 1) {
      inspectSplitPdf(files[0]);
    }
  }

  /* ================= HELPER PEMROSESAN GAMBAR & PDF ================= */
  function loadImageElement(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Gagal membaca gambar "' + file.name + '".'));
      };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, mime, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Gagal membuat file gambar keluaran.'))),
        mime,
        quality
      );
    });
  }

  async function processImageCanvas(file, targetMime, quality01) {
    const img = await loadImageElement(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');

    if (targetMime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    const blob = await canvasToBlob(canvas, targetMime, targetMime === 'image/png' ? undefined : quality01);
    canvas.width = 0;
    canvas.height = 0;
    return blob;
  }

  function parsePageRanges(rawInput, totalPages) {
    const cleaned = (rawInput || '').trim();
    if (!cleaned) {
      throw new Error('Masukkan nomor atau rentang halaman terlebih dahulu (contoh: 1-3, 5).');
    }

    const parts = cleaned.split(',');
    const zeroBasedIndices = [];

    for (const part of parts) {
      const token = part.trim();
      if (!token) continue;

      if (token.includes('-')) {
        const bounds = token.split('-');
        if (bounds.length !== 2) {
          throw new Error('Format rentang "' + token + '" tidak valid. Gunakan format seperti 1-3.');
        }
        const start = Number(bounds[0].trim());
        const end = Number(bounds[1].trim());
        if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1) {
          throw new Error('Nomor halaman pada "' + token + '" harus berupa angka bulat positif.');
        }
        if (start > end) {
          throw new Error('Rentang "' + token + '" terbalik. Halaman awal harus lebih kecil dari halaman akhir.');
        }
        if (end > totalPages) {
          throw new Error('Nomor halaman ' + end + ' melebihi total halaman PDF (' + totalPages + ' halaman).');
        }
        for (let p = start; p <= end; p++) {
          zeroBasedIndices.push(p - 1);
        }
      } else {
        const pageNum = Number(token);
        if (!Number.isInteger(pageNum) || pageNum < 1) {
          throw new Error('Nomor halaman "' + token + '" tidak valid.');
        }
        if (pageNum > totalPages) {
          throw new Error('Nomor halaman ' + pageNum + ' melebihi total halaman PDF (' + totalPages + ' halaman).');
        }
        zeroBasedIndices.push(pageNum - 1);
      }
    }

    if (zeroBasedIndices.length === 0) {
      throw new Error('Tidak ada nomor halaman valid yang ditemukan.');
    }

    return zeroBasedIndices;
  }

  function sanitizeWinAnsi(text) {
    return text.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '').trim();
  }

  /* ================= FITUR 1: KOMPRES ================= */
  async function handleCompress() {
    const file = files[0];
    const info = detectFileKind(file);
    const qualityPct = compressQuality ? Number(compressQuality.value) : 75;
    const quality01 = qualityPct / 100;

    if (info && info.kind === 'image') {
      setProgress(35, 'Mengompres gambar di browser...');
      const outMime = info.mime === 'image/png' && qualityPct < 95 ? 'image/jpeg' : info.mime;
      const ext = outMime === 'image/jpeg' ? 'jpg' : outMime === 'image/webp' ? 'webp' : 'png';
      const blob = await processImageCanvas(file, outMime, quality01);
      setProgress(100, 'Selesai');
      return {
        blob,
        filename: stripExt(file.name) + '_kompres.' + ext,
        originalSize: file.size,
        finalSize: blob.size,
      };
    }

    setProgress(10, 'Memuat mesin PDF...');
    const [pdfjsLib, PDFLib] = await Promise.all([getPdfJs(), getPdfLib()]);
    const buffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const totalPages = pdfDoc.numPages;

    const newPdf = await PDFLib.PDFDocument.create();
    const scale = qualityPct >= 80 ? 1.5 : qualityPct >= 50 ? 1.2 : 0.95;

    try {
      for (let i = 1; i <= totalPages; i++) {
        setProgress(15 + Math.round((i / totalPages) * 75), 'Mengompres halaman ' + i + ' dari ' + totalPages + '...');
        const page = await pdfDoc.getPage(i);
        const baseVp = page.getViewport({ scale: 1.0 });
        const vp = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(vp.width));
        canvas.height = Math.max(1, Math.floor(vp.height));
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', quality01);
        const jpegBytes = await jpegBlob.arrayBuffer();

        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();

        const embedded = await newPdf.embedJpg(jpegBytes);
        const newPage = newPdf.addPage([baseVp.width, baseVp.height]);
        newPage.drawImage(embedded, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
      }
    } finally {
      await pdfDoc.destroy();
    }

    setProgress(95, 'Menyimpan PDF hasil kompresi...');
    const pdfBytes = await newPdf.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    return {
      blob,
      filename: stripExt(file.name) + '_kompres.pdf',
      originalSize: file.size,
      finalSize: blob.size,
    };
  }

  /* ================= FITUR 2: GABUNG PDF ================= */
  async function handleMerge() {
    setProgress(10, 'Memuat library penggabung PDF...');
    const PDFLib = await getPdfLib();
    const mergedPdf = await PDFLib.PDFDocument.create();
    let totalOrig = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const info = detectFileKind(f);
      totalOrig += f.size;
      setProgress(15 + Math.round(((i + 1) / files.length) * 75), 'Menggabungkan ' + f.name + '...');

      if (info && info.kind === 'pdf') {
        const bytes = await f.arrayBuffer();
        const srcDoc = await PDFLib.PDFDocument.load(bytes);
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach((p) => mergedPdf.addPage(p));
      } else if (info && info.kind === 'image') {
        let imgBlob = f;
        let isPng = info.mime === 'image/png';
        if (info.mime === 'image/webp') {
          imgBlob = await processImageCanvas(f, 'image/png', 0.92);
          isPng = true;
        }
        const imgBytes = await imgBlob.arrayBuffer();
        const embedded = isPng ? await mergedPdf.embedPng(imgBytes) : await mergedPdf.embedJpg(imgBytes);
        const page = mergedPdf.addPage([embedded.width, embedded.height]);
        page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
      }
    }

    setProgress(95, 'Menyusun dokumen akhir...');
    const outBytes = await mergedPdf.save({ useObjectStreams: true });
    const blob = new Blob([outBytes], { type: 'application/pdf' });

    return {
      blob,
      filename: 'gabungan_filekit.pdf',
      originalSize: totalOrig,
      finalSize: blob.size,
    };
  }

  /* ================= FITUR 3: PISAH PDF ================= */
  async function handleSplit() {
    const file = files[0];
    const mode = splitMode ? splitMode.value : 'range';

    setProgress(15, 'Memuat dokumen PDF...');
    const PDFLib = await getPdfLib();
    const bytes = await file.arrayBuffer();
    const srcDoc = await PDFLib.PDFDocument.load(bytes);
    const totalPages = srcDoc.getPageCount();

    if (mode === 'burst') {
      if (totalPages === 1) {
        setProgress(80, 'Menyimpan halaman tunggal...');
        const singleDoc = await PDFLib.PDFDocument.create();
        const [copied] = await singleDoc.copyPages(srcDoc, [0]);
        singleDoc.addPage(copied);
        const outBytes = await singleDoc.save({ useObjectStreams: true });
        const blob = new Blob([outBytes], { type: 'application/pdf' });
        return {
          blob,
          filename: stripExt(file.name) + '_hal_01.pdf',
          originalSize: file.size,
          finalSize: blob.size,
          detailNote: '1 halaman diekstrak',
        };
      }

      const JSZip = await getJsZip();
      const zip = new JSZip();

      for (let i = 0; i < totalPages; i++) {
        setProgress(20 + Math.round(((i + 1) / totalPages) * 70), 'Memisahkan halaman ' + (i + 1) + ' dari ' + totalPages + '...');
        const pageDoc = await PDFLib.PDFDocument.create();
        const [copied] = await pageDoc.copyPages(srcDoc, [i]);
        pageDoc.addPage(copied);
        const pageBytes = await pageDoc.save({ useObjectStreams: true });
        zip.file(stripExt(file.name) + '_hal_' + String(i + 1).padStart(2, '0') + '.pdf', pageBytes);
      }

      setProgress(95, 'Membungkus semua halaman ke ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      return {
        blob: zipBlob,
        filename: stripExt(file.name) + '_pisah_' + totalPages + '_hal.zip',
        originalSize: file.size,
        finalSize: zipBlob.size,
        detailNote: totalPages + ' halaman dipecah menjadi file terpisah',
      };
    }

    const requestedIndices = parsePageRanges(splitPagesInput ? splitPagesInput.value : '', totalPages);
    let targetIndices = [];

    if (mode === 'range') {
      targetIndices = requestedIndices;
    } else {
      const removeSet = new Set(requestedIndices);
      for (let i = 0; i < totalPages; i++) {
        if (!removeSet.has(i)) {
          targetIndices.push(i);
        }
      }
      if (targetIndices.length === 0) {
        throw new Error('Tidak bisa menghapus semua halaman PDF. Sisakan minimal 1 halaman.');
      }
    }

    setProgress(60, 'Menyusun ' + targetIndices.length + ' halaman terpilih...');
    const outDoc = await PDFLib.PDFDocument.create();
    const copiedPages = await outDoc.copyPages(srcDoc, targetIndices);
    copiedPages.forEach((p) => outDoc.addPage(p));

    setProgress(90, 'Menyimpan PDF hasil pemisahan...');
    const outBytes = await outDoc.save({ useObjectStreams: true });
    const blob = new Blob([outBytes], { type: 'application/pdf' });
    const suffix = mode === 'remove' ? 'halaman_dihapus' : 'halaman_pilihan';

    return {
      blob,
      filename: stripExt(file.name) + '_' + suffix + '.pdf',
      originalSize: file.size,
      finalSize: blob.size,
      detailNote: targetIndices.length + ' dari ' + totalPages + ' halaman disimpan',
    };
  }

  /* ================= FITUR 4: KONVERSI ================= */
  async function handleConvert() {
    const target = convertTarget ? convertTarget.value : 'pdf';
    const first = files[0];
    const firstInfo = detectFileKind(first);

    if (target === 'pdf') {
      const invalid = files.find((f) => {
        const d = detectFileKind(f);
        return !d || d.kind !== 'image';
      });
      if (invalid) {
        throw new Error('Konversi ke PDF hanya menerima file gambar (JPG, PNG, WebP).');
      }
      return handleMerge();
    }

    if (firstInfo && firstInfo.kind === 'pdf') {
      if (target === 'webp') {
        throw new Error('Konversi PDF ke gambar mendukung format tujuan JPG atau PNG.');
      }
      setProgress(10, 'Memuat mesin PDF...');
      const pdfjsLib = await getPdfJs();
      const buffer = await first.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      const totalPages = pdfDoc.numPages;
      const mime = target === 'png' ? 'image/png' : 'image/jpeg';

      try {
        if (totalPages === 1) {
          setProgress(50, 'Mengonversi halaman 1...');
          const page = await pdfDoc.getPage(1);
          const vp = page.getViewport({ scale: 1.6 });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(vp.width);
          canvas.height = Math.floor(vp.height);
          const ctx = canvas.getContext('2d', { alpha: false });
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          const blob = await canvasToBlob(canvas, mime, 0.9);
          canvas.width = 0;
          canvas.height = 0;
          page.cleanup();
          return {
            blob,
            filename: stripExt(first.name) + '_hal1.' + target,
            originalSize: first.size,
            finalSize: blob.size,
          };
        }

        const JSZip = await getJsZip();
        const zip = new JSZip();
        for (let i = 1; i <= totalPages; i++) {
          setProgress(15 + Math.round((i / totalPages) * 75), 'Merender halaman ' + i + ' dari ' + totalPages + '...');
          const page = await pdfDoc.getPage(i);
          const vp = page.getViewport({ scale: 1.6 });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(vp.width);
          canvas.height = Math.floor(vp.height);
          const ctx = canvas.getContext('2d', { alpha: false });
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          const imgBlob = await canvasToBlob(canvas, mime, 0.9);
          canvas.width = 0;
          canvas.height = 0;
          page.cleanup();
          zip.file(stripExt(first.name) + '_hal_' + String(i).padStart(2, '0') + '.' + target, imgBlob);
        }

        setProgress(95, 'Membungkus gambar ke ZIP...');
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        return {
          blob: zipBlob,
          filename: stripExt(first.name) + '_gambar.zip',
          originalSize: first.size,
          finalSize: zipBlob.size,
        };
      } finally {
        await pdfDoc.destroy();
      }
    }

    const mimeMap = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    const outMime = mimeMap[target] || 'image/jpeg';

    if (files.length === 1) {
      setProgress(50, 'Mengonversi ke ' + target.toUpperCase() + '...');
      const blob = await processImageCanvas(first, outMime, 0.9);
      return {
        blob,
        filename: stripExt(first.name) + '.' + target,
        originalSize: first.size,
        finalSize: blob.size,
      };
    }

    const JSZip = await getJsZip();
    const zip = new JSZip();
    let totalOrig = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const d = detectFileKind(f);
      if (!d || d.kind !== 'image') continue;
      totalOrig += f.size;
      setProgress(15 + Math.round(((i + 1) / files.length) * 75), 'Mengonversi ' + f.name + '...');
      const blob = await processImageCanvas(f, outMime, 0.9);
      zip.file(stripExt(f.name) + '.' + target, blob);
    }

    setProgress(95, 'Membungkus hasil ke ZIP...');
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    return {
      blob: zipBlob,
      filename: 'konversi_' + target + '.zip',
      originalSize: totalOrig,
      finalSize: zipBlob.size,
    };
  }

  /* ================= FITUR 5: WATERMARK PENGAMAN ================= */
  async function applyImageWatermark(file, info, text, layout, colorHex, opacity01) {
    const img = await loadImageElement(file);
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    if (info.mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0);

    ctx.save();
    ctx.globalAlpha = opacity01;
    ctx.fillStyle = colorHex;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const angleRad = -Math.PI / 6;

    if (layout === 'diagonal') {
      let fontSize = Math.max(18, Math.round(Math.min(w, h) * 0.065));
      ctx.font = '700 ' + fontSize + 'px Inter, Arial, sans-serif';
      const measured = ctx.measureText(text).width;
      const maxSpan = Math.hypot(w, h) * 0.72;
      if (measured > maxSpan && measured > 0) {
        fontSize = Math.max(14, Math.floor(fontSize * (maxSpan / measured)));
        ctx.font = '700 ' + fontSize + 'px Inter, Arial, sans-serif';
      }
      ctx.translate(w / 2, h / 2);
      ctx.rotate(angleRad);
      ctx.fillText(text, 0, 0);
    } else {
      const fontSize = Math.max(14, Math.round(Math.min(w, h) * 0.032));
      ctx.font = '700 ' + fontSize + 'px Inter, Arial, sans-serif';
      const textWidth = ctx.measureText(text).width;
      const stepX = Math.max(textWidth + fontSize * 2.5, w / 2.2);
      const stepY = Math.max(fontSize * 4.5, h / 3.5);

      for (let y = -h * 0.2; y <= h * 1.2; y += stepY) {
        for (let x = -w * 0.2; x <= w * 1.2; x += stepX) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angleRad);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
      }
    }

    ctx.restore();

    const ext = info.mime === 'image/png' ? 'png' : info.mime === 'image/webp' ? 'webp' : 'jpg';
    const blob = await canvasToBlob(canvas, info.mime, info.mime === 'image/png' ? undefined : 0.92);
    canvas.width = 0;
    canvas.height = 0;

    return {
      blob,
      filename: stripExt(file.name) + '_watermark.' + ext,
    };
  }

  async function applyPdfWatermark(file, text, layout, rgbTuple, opacity01) {
    const PDFLib = await getPdfLib();
    const safeText = sanitizeWinAnsi(text);
    if (!safeText) {
      throw new Error('Teks watermark pada PDF harus menggunakan huruf atau angka standar.');
    }

    const bytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(bytes);
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const color = PDFLib.rgb(rgbTuple[0], rgbTuple[1], rgbTuple[2]);
    const pages = pdfDoc.getPages();
    const deg = 30;
    const rad = (deg * Math.PI) / 180;

    pages.forEach((page) => {
      const { width, height } = page.getSize();

      if (layout === 'diagonal') {
        let fontSize = Math.max(16, Math.round(Math.min(width, height) * 0.06));
        let textWidth = font.widthOfTextAtSize(safeText, fontSize);
        const maxSpan = Math.hypot(width, height) * 0.72;
        if (textWidth > maxSpan && textWidth > 0) {
          fontSize = Math.max(12, Math.floor(fontSize * (maxSpan / textWidth)));
          textWidth = font.widthOfTextAtSize(safeText, fontSize);
        }
        const cx = width / 2;
        const cy = height / 2;
        const x = cx - (textWidth / 2) * Math.cos(rad) + (fontSize / 3) * Math.sin(rad);
        const y = cy - (textWidth / 2) * Math.sin(rad) - (fontSize / 3) * Math.cos(rad);

        page.drawText(safeText, {
          x,
          y,
          size: fontSize,
          font,
          color,
          opacity: opacity01,
          rotate: PDFLib.degrees(deg),
        });
      } else {
        const fontSize = Math.max(11, Math.round(Math.min(width, height) * 0.028));
        const textWidth = font.widthOfTextAtSize(safeText, fontSize);
        const stepX = Math.max(textWidth + fontSize * 2.5, width / 2.2);
        const stepY = Math.max(fontSize * 4.5, height / 3.5);

        for (let cy = height * 0.08; cy <= height * 0.96; cy += stepY) {
          for (let cx = width * 0.05; cx <= width * 0.95; cx += stepX) {
            const x = cx - (textWidth / 2) * Math.cos(rad);
            const y = cy - (textWidth / 2) * Math.sin(rad);
            page.drawText(safeText, {
              x,
              y,
              size: fontSize,
              font,
              color,
              opacity: opacity01,
              rotate: PDFLib.degrees(deg),
            });
          }
        }
      }
    });

    const outBytes = await pdfDoc.save({ useObjectStreams: true });
    return {
      blob: new Blob([outBytes], { type: 'application/pdf' }),
      filename: stripExt(file.name) + '_watermark.pdf',
    };
  }

  async function handleWatermark() {
    const rawText = watermarkText ? watermarkText.value.trim() : '';
    if (!rawText) {
      throw new Error('Masukkan teks watermark terlebih dahulu.');
    }

    const layout = watermarkLayout ? watermarkLayout.value : 'tiled';
    const colorKey = watermarkColor ? watermarkColor.value : 'dark';
    const opacityPct = watermarkOpacity ? Number(watermarkOpacity.value) : 30;
    const opacity01 = Math.max(0.05, Math.min(0.9, opacityPct / 100));

    const colorMap = {
      dark: { hex: '#0f172a', rgb: [0.06, 0.09, 0.16] },
      red: { hex: '#dc2626', rgb: [0.86, 0.15, 0.15] },
      white: { hex: '#ffffff', rgb: [1, 1, 1] },
    };
    const chosenColor = colorMap[colorKey] || colorMap.dark;

    if (files.length === 1) {
      const f = files[0];
      const info = detectFileKind(f);
      setProgress(45, 'Memasang watermark pada ' + f.name + '...');
      const out = info.kind === 'pdf'
        ? await applyPdfWatermark(f, rawText, layout, chosenColor.rgb, opacity01)
        : await applyImageWatermark(f, info, rawText, layout, chosenColor.hex, opacity01);

      return {
        blob: out.blob,
        filename: out.filename,
        originalSize: f.size,
        finalSize: out.blob.size,
        detailNote: 'Watermark berhasil diterapkan di browser',
      };
    }

    const JSZip = await getJsZip();
    const zip = new JSZip();
    let totalOrig = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const info = detectFileKind(f);
      totalOrig += f.size;
      setProgress(
        15 + Math.round(((i + 1) / files.length) * 75),
        'Memasang watermark (' + (i + 1) + '/' + files.length + '): ' + f.name + '...'
      );

      const out = info.kind === 'pdf'
        ? await applyPdfWatermark(f, rawText, layout, chosenColor.rgb, opacity01)
        : await applyImageWatermark(f, info, rawText, layout, chosenColor.hex, opacity01);

      zip.file(out.filename, out.blob);
    }

    setProgress(95, 'Membungkus hasil ke ZIP...');
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    return {
      blob: zipBlob,
      filename: 'watermark_filekit.zip',
      originalSize: totalOrig,
      finalSize: zipBlob.size,
      detailNote: files.length + ' file diberi watermark',
    };
  }

  /* ================= FITUR 6: HAPUS METADATA & EXIF ================= */
  async function stripSingleFileMetadata(file, info) {
    if (info.kind === 'image') {
      const ext = info.mime === 'image/png' ? 'png' : info.mime === 'image/webp' ? 'webp' : 'jpg';
      const blob = await processImageCanvas(file, info.mime, 0.94);
      return {
        blob,
        filename: stripExt(file.name) + '_bersih.' + ext,
        summary: 'Header EXIF, lokasi GPS, dan info perangkat dibersihkan',
      };
    }

    const PDFLib = await getPdfLib();
    const bytes = await file.arrayBuffer();
    const srcDoc = await PDFLib.PDFDocument.load(bytes);

    const foundFields = [];
    if (srcDoc.getTitle()) foundFields.push('Title');
    if (srcDoc.getAuthor()) foundFields.push('Author');
    if (srcDoc.getSubject()) foundFields.push('Subject');
    if (srcDoc.getCreator()) foundFields.push('Creator');
    if (srcDoc.getProducer()) foundFields.push('Producer');

    const cleanDoc = await PDFLib.PDFDocument.create();
    const copiedPages = await cleanDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((p) => cleanDoc.addPage(p));

    cleanDoc.setTitle('');
    cleanDoc.setAuthor('');
    cleanDoc.setSubject('');
    cleanDoc.setKeywords([]);
    cleanDoc.setProducer('');
    cleanDoc.setCreator('');

    const outBytes = await cleanDoc.save({ useObjectStreams: true });
    const summary = foundFields.length > 0
      ? 'Metadata PDF dibersihkan (' + foundFields.join(', ') + ')'
      : 'Dokumen PDF disalin ulang tanpa metadata identitas';

    return {
      blob: new Blob([outBytes], { type: 'application/pdf' }),
      filename: stripExt(file.name) + '_bersih.pdf',
      summary,
    };
  }

  async function handleMetadata() {
    if (files.length === 1) {
      const f = files[0];
      const info = detectFileKind(f);
      setProgress(45, 'Membersihkan metadata ' + f.name + '...');
      const out = await stripSingleFileMetadata(f, info);
      return {
        blob: out.blob,
        filename: out.filename,
        originalSize: f.size,
        finalSize: out.blob.size,
        detailNote: out.summary,
      };
    }

    const JSZip = await getJsZip();
    const zip = new JSZip();
    let totalOrig = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const info = detectFileKind(f);
      totalOrig += f.size;
      setProgress(
        15 + Math.round(((i + 1) / files.length) * 75),
        'Membersihkan (' + (i + 1) + '/' + files.length + '): ' + f.name + '...'
      );
      const out = await stripSingleFileMetadata(f, info);
      zip.file(out.filename, out.blob);
    }

    setProgress(95, 'Membungkus hasil ke ZIP...');
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    return {
      blob: zipBlob,
      filename: 'bersih_metadata_filekit.zip',
      originalSize: totalOrig,
      finalSize: zipBlob.size,
      detailNote: 'Metadata pada ' + files.length + ' file telah dibersihkan',
    };
  }

  /* ================= FITUR 7: PASSWORD PDF (KUNCI & BUKA) ================= */
  async function handlePassword() {
    const file = files[0];
    const mode = passwordMode ? passwordMode.value : 'encrypt';
    const pwd = pdfPasswordInput ? pdfPasswordInput.value : '';

    if (mode === 'encrypt') {
      if (!pwd) {
        throw new Error('Masukkan kata sandi baru untuk mengunci file PDF.');
      }
      if (pwd.length < 4) {
        throw new Error('Gunakan kata sandi minimal 4 karakter agar dokumen lebih aman.');
      }

      setProgress(10, 'Memuat modul enkripsi PDF...');
      const [pdfjsLib, JsPDF] = await Promise.all([getPdfJs(), getJsPdf()]);
      const buffer = await file.arrayBuffer();

      let pdfDoc;
      try {
        pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      } catch (err) {
        if (err && err.name === 'PasswordException') {
          throw new Error('File PDF ini sudah dikunci password. Pilih mode "Buka / Hapus Password PDF" terlebih dahulu.');
        }
        throw err;
      }

      const totalPages = pdfDoc.numPages;
      const allowPrint = allowPrintCheck ? allowPrintCheck.checked : true;
      const permissions = allowPrint ? ['print'] : [];
      let outPdf = null;

      try {
        for (let i = 1; i <= totalPages; i++) {
          setProgress(15 + Math.round((i / totalPages) * 75), 'Mengenkripsi halaman ' + i + ' dari ' + totalPages + '...');
          const page = await pdfDoc.getPage(i);
          const baseVp = page.getViewport({ scale: 1.0 });
          const vp = page.getViewport({ scale: 1.5 });
          const orient = baseVp.width > baseVp.height ? 'landscape' : 'portrait';

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.floor(vp.width));
          canvas.height = Math.max(1, Math.floor(vp.height));
          const ctx = canvas.getContext('2d', { alpha: false });
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          const imgData = canvas.toDataURL('image/jpeg', 0.9);
          canvas.width = 0;
          canvas.height = 0;
          page.cleanup();

          if (i === 1) {
            outPdf = new JsPDF({
              orientation: orient,
              unit: 'pt',
              format: [baseVp.width, baseVp.height],
              encryption: {
                userPassword: pwd,
                ownerPassword: pwd + '_filekit_owner',
                userPermissions: permissions,
              },
            });
          } else {
            outPdf.addPage([baseVp.width, baseVp.height], orient);
          }

          outPdf.addImage(imgData, 'JPEG', 0, 0, baseVp.width, baseVp.height);
        }
      } finally {
        await pdfDoc.destroy();
      }

      setProgress(95, 'Menyimpan PDF terenkripsi...');
      const outBlob = outPdf.output('blob');
      return {
        blob: outBlob,
        filename: stripExt(file.name) + '_terkunci.pdf',
        originalSize: file.size,
        finalSize: outBlob.size,
        detailNote: 'PDF dikunci dengan password (' + totalPages + ' halaman)',
      };
    }

    // Mode: Buka / Hapus Password PDF
    setProgress(10, 'Memuat modul dekripsi PDF...');
    const [PDFLib, pdfjsLib] = await Promise.all([getPdfLib(), getPdfJs()]);
    const buffer = await file.arrayBuffer();

    // Cek jika PDF hanya dikunci izin edit/print tanpa sandi buka
    if (!pwd) {
      try {
        const probeDoc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
        if (!probeDoc.isEncrypted) {
          throw new Error('File PDF ini tidak dikunci password.');
        }
        setProgress(65, 'Menghapus batasan izin dokumen...');
        const cleanDoc = await PDFLib.PDFDocument.create();
        const copied = await cleanDoc.copyPages(probeDoc, probeDoc.getPageIndices());
        copied.forEach((p) => cleanDoc.addPage(p));
        const outBytes = await cleanDoc.save({ useObjectStreams: true });
        const blob = new Blob([outBytes], { type: 'application/pdf' });
        return {
          blob,
          filename: stripExt(file.name) + '_terbuka.pdf',
          originalSize: file.size,
          finalSize: blob.size,
          detailNote: 'Batasan izin PDF berhasil dihapus (' + copied.length + ' halaman)',
        };
      } catch (err) {
        if (err instanceof Error && err.message === 'File PDF ini tidak dikunci password.') {
          throw err;
        }
        throw new Error('File PDF ini memerlukan kata sandi untuk dibuka. Masukkan password PDF terlebih dahulu.');
      }
    }

    let pdfDoc;
    try {
      pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), password: pwd }).promise;
    } catch (err) {
      if (err && err.name === 'PasswordException') {
        throw new Error('Password PDF salah. Periksa kembali huruf besar/kecil kata sandi kamu.');
      }
      throw new Error('Gagal membuka file PDF. Pastikan file tidak rusak.');
    }

    const totalPages = pdfDoc.numPages;
    const unlockedPdf = await PDFLib.PDFDocument.create();

    try {
      for (let i = 1; i <= totalPages; i++) {
        setProgress(15 + Math.round((i / totalPages) * 75), 'Membuka halaman ' + i + ' dari ' + totalPages + '...');
        const page = await pdfDoc.getPage(i);
        const baseVp = page.getViewport({ scale: 1.0 });
        const vp = page.getViewport({ scale: 1.6 });

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(vp.width));
        canvas.height = Math.max(1, Math.floor(vp.height));
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
        const jpegBytes = await jpegBlob.arrayBuffer();

        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();

        const embedded = await unlockedPdf.embedJpg(jpegBytes);
        const newPage = unlockedPdf.addPage([baseVp.width, baseVp.height]);
        newPage.drawImage(embedded, { x: 0, y: 0, width: baseVp.width, height: baseVp.height });
      }
    } finally {
      await pdfDoc.destroy();
    }

    setProgress(95, 'Menyimpan PDF tanpa password...');
    const outBytes = await unlockedPdf.save({ useObjectStreams: true });
    const blob = new Blob([outBytes], { type: 'application/pdf' });

    return {
      blob,
      filename: stripExt(file.name) + '_terbuka.pdf',
      originalSize: file.size,
      finalSize: blob.size,
      detailNote: 'Password PDF berhasil dihapus (' + totalPages + ' halaman)',
    };
  }

  /* ================= SWITCH TAB & EVENT UTAMA ================= */
  function switchTab(tabKey) {
    if (!TAB_META[tabKey] || isBusy) return;
    currentTab = tabKey;
    files = [];
    clearFeedback();

    appTabs.forEach((btn) => {
      const active = btn.dataset.tab === tabKey;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    const meta = TAB_META[tabKey];
    if (toolHeading) toolHeading.textContent = meta.heading;
    if (toolSubheading) toolSubheading.textContent = meta.sub;
    if (dropzoneHint) dropzoneHint.textContent = meta.hint;
    fileInput.accept = meta.accept;
    fileInput.multiple = meta.multiple;
    actionBtn.textContent = meta.cta;

    if (optionsCompress) optionsCompress.classList.toggle('is-hidden', tabKey !== 'compress');
    if (optionsMerge) optionsMerge.classList.toggle('is-hidden', tabKey !== 'merge');
    if (optionsSplit) optionsSplit.classList.toggle('is-hidden', tabKey !== 'split');
    if (optionsConvert) optionsConvert.classList.toggle('is-hidden', tabKey !== 'convert');
    if (optionsWatermark) optionsWatermark.classList.toggle('is-hidden', tabKey !== 'watermark');
    if (optionsMetadata) optionsMetadata.classList.toggle('is-hidden', tabKey !== 'metadata');
    if (optionsPassword) optionsPassword.classList.toggle('is-hidden', tabKey !== 'password');

    if (tabKey === 'split') {
      updateSplitModeUI();
    }
    if (tabKey === 'password') {
      updatePasswordModeUI();
    }

    renderFiles();
  }

  appTabs.forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  document.querySelectorAll('[data-jump-tab]').forEach((link) => {
    link.addEventListener('click', () => {
      switchTab(link.dataset.jumpTab);
      if (mobileMenu) mobileMenu.classList.add('is-hidden');
    });
  });

  if (compressQuality && compressQualityVal) {
    compressQuality.addEventListener('input', () => {
      compressQualityVal.textContent = compressQuality.value + '%';
    });
  }

  if (splitMode) {
    splitMode.addEventListener('change', updateSplitModeUI);
  }

  if (watermarkOpacity && watermarkOpacityVal) {
    watermarkOpacity.addEventListener('input', () => {
      watermarkOpacityVal.textContent = watermarkOpacity.value + '%';
    });
  }

  if (passwordMode) {
    passwordMode.addEventListener('change', () => {
      clearFeedback();
      updatePasswordModeUI();
    });
  }

  if (togglePdfPasswordBtn && pdfPasswordInput) {
    togglePdfPasswordBtn.addEventListener('click', () => {
      const showing = pdfPasswordInput.type === 'text';
      pdfPasswordInput.type = showing ? 'password' : 'text';
      togglePdfPasswordBtn.textContent = showing ? 'Tampilkan' : 'Sembunyikan';
    });
  }

  dropzone.addEventListener('click', (e) => {
    if (e.target !== fileInput) {
      fileInput.click();
    }
  });

  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', () => addFiles(fileInput.files));

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('is-dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('is-dragover');
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      files = [];
      clearFeedback();
      renderFiles();
    });
  }

  actionBtn.addEventListener('click', async () => {
    if (isBusy) return;
    clearFeedback();
    isBusy = true;
    updateActionState();

    try {
      let res;
      if (currentTab === 'compress') res = await handleCompress();
      else if (currentTab === 'merge') res = await handleMerge();
      else if (currentTab === 'split') res = await handleSplit();
      else if (currentTab === 'convert') res = await handleConvert();
      else if (currentTab === 'watermark') res = await handleWatermark();
      else if (currentTab === 'metadata') res = await handleMetadata();
      else res = await handlePassword();

      revokeBlob();
      activeBlobUrl = URL.createObjectURL(res.blob);
      if (downloadBtn) {
        downloadBtn.href = activeBlobUrl;
        downloadBtn.setAttribute('download', res.filename);
      }

      const saved = Math.max(0, res.originalSize - res.finalSize);
      const pct = res.originalSize > 0 ? ((saved / res.originalSize) * 100).toFixed(1) : '0.0';

      if (resultTitle) resultTitle.textContent = 'Siap diunduh: ' + res.filename;
      if (resultMeta) {
        const sizeSummary =
          saved > 0
            ? 'Ukuran awal ' + formatBytes(res.originalSize) + ' -> ' + formatBytes(res.finalSize) + ' (hemat ' + pct + '%)'
            : 'Ukuran awal ' + formatBytes(res.originalSize) + ' -> hasil ' + formatBytes(res.finalSize);
        resultMeta.textContent = res.detailNote ? res.detailNote + ' | ' + sizeSummary : sizeSummary;
      }
      if (resultBox) resultBox.classList.remove('is-hidden');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses file.');
    } finally {
      isBusy = false;
      hideProgress();
      updateActionState();
    }
  });

  /* ================= HAMBURGER MOBILE, FAQ, TOAST ================= */
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', () => {
      const hidden = mobileMenu.classList.toggle('is-hidden');
      hamburgerBtn.setAttribute('aria-expanded', hidden ? 'false' : 'true');
    });
  }

  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const plus = btn.querySelector('.faq-plus');
      if (!answer) return;
      const isHidden = answer.classList.toggle('is-hidden');
      btn.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
      if (plus) plus.textContent = isHidden ? '+' : '-';
    });
  });

  const privacyToast = document.getElementById('privacyToast');
  const closeToastBtn = document.getElementById('closeToastBtn');
  if (privacyToast && closeToastBtn) {
    closeToastBtn.addEventListener('click', () => {
      privacyToast.classList.add('is-hidden');
    });
  }

  window.addEventListener('beforeunload', revokeBlob);
  switchTab('compress');
})();
