(() => {
  'use strict';

  /* ================= KONFIGURASI CDN ================= */
  const CDN = {
    pdfLib: 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    pdfjs: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
    pdfWorker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
    jszip: 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
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
  const optionsConvert = document.getElementById('optionsConvert');

  const compressQuality = document.getElementById('compressQuality');
  const compressQualityVal = document.getElementById('compressQualityVal');
  const convertTarget = document.getElementById('convertTarget');

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
      multiple: false,
      minFiles: 1,
      cta: 'Kompres Sekarang',
    },
    merge: {
      heading: 'Gabung PDF & Gambar',
      sub: 'Satukan beberapa file PDF (atau kumpulan gambar) menjadi satu dokumen PDF utuh.',
      hint: 'Pilih 2 atau lebih file PDF, atau kumpulan gambar JPG/PNG/WebP',
      accept: '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp',
      multiple: true,
      minFiles: 2,
      cta: 'Gabungkan',
    },
    convert: {
      heading: 'Konversi Format File',
      sub: 'Ubah Gambar ke PDF, PDF ke Gambar (ZIP), atau tukar format JPG, PNG, dan WebP.',
      hint: 'Pilih 1 atau lebih gambar (JPG/PNG/WebP), atau 1 file PDF',
      accept: '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf',
      multiple: true,
      minFiles: 1,
      cta: 'Konversi',
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
    return `${(bytes / Math.pow(1024, i)).toFixed(i >= 2 ? 2 : 0)} ${units[i]}`;
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
    progressBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
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

  /* ================= RENDER DAFTAR FILE ================= */
  function renderFiles() {
    fileList.textContent = '';
    if (files.length === 0) {
      fileList.classList.add('is-hidden');
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
      nameEl.textContent = canReorder ? `${idx + 1}. ${file.name}` : file.name;

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
      if (!info) {
        showError(`Format "${f.name}" tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.`);
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
        reject(new Error(`Gagal membaca gambar "${file.name}".`));
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
        filename: `${stripExt(file.name)}_kompres.${ext}`,
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
        setProgress(15 + Math.round((i / totalPages) * 75), `Mengompres halaman ${i} dari ${totalPages}...`);
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
      filename: `${stripExt(file.name)}_kompres.pdf`,
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
      setProgress(15 + Math.round(((i + 1) / files.length) * 75), `Menggabungkan ${f.name}...`);

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

  /* ================= FITUR 3: KONVERSI ================= */
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
            filename: `${stripExt(first.name)}_hal1.${target}`,
            originalSize: first.size,
            finalSize: blob.size,
          };
        }

        const JSZip = await getJsZip();
        const zip = new JSZip();
        for (let i = 1; i <= totalPages; i++) {
          setProgress(15 + Math.round((i / totalPages) * 75), `Merender halaman ${i} dari ${totalPages}...`);
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
          zip.file(`${stripExt(first.name)}_hal_${String(i).padStart(2, '0')}.${target}`, imgBlob);
        }

        setProgress(95, 'Membungkus gambar ke ZIP...');
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        return {
          blob: zipBlob,
          filename: `${stripExt(first.name)}_gambar.zip`,
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
      setProgress(50, `Mengonversi ke ${target.toUpperCase()}...`);
      const blob = await processImageCanvas(first, outMime, 0.9);
      return {
        blob,
        filename: `${stripExt(first.name)}.${target}`,
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
      setProgress(15 + Math.round(((i + 1) / files.length) * 75), `Mengonversi ${f.name}...`);
      const blob = await processImageCanvas(f, outMime, 0.9);
      zip.file(`${stripExt(f.name)}.${target}`, blob);
    }

    setProgress(95, 'Membungkus hasil ke ZIP...');
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    return {
      blob: zipBlob,
      filename: `konversi_${target}.zip`,
      originalSize: totalOrig,
      finalSize: zipBlob.size,
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
    if (optionsConvert) optionsConvert.classList.toggle('is-hidden', tabKey !== 'convert');

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
      compressQualityVal.textContent = `${compressQuality.value}%`;
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
      else res = await handleConvert();

      revokeBlob();
      activeBlobUrl = URL.createObjectURL(res.blob);
      if (downloadBtn) {
        downloadBtn.href = activeBlobUrl;
        downloadBtn.setAttribute('download', res.filename);
      }

      const saved = Math.max(0, res.originalSize - res.finalSize);
      const pct = res.originalSize > 0 ? ((saved / res.originalSize) * 100).toFixed(1) : '0.0';

      if (resultTitle) resultTitle.textContent = `Siap diunduh: ${res.filename}`;
      if (resultMeta) {
        resultMeta.textContent =
          saved > 0
            ? `Ukuran awal ${formatBytes(res.originalSize)} -> ${formatBytes(res.finalSize)} (hemat ${pct}%)`
            : `Ukuran awal ${formatBytes(res.originalSize)} -> hasil ${formatBytes(res.finalSize)}`;
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
      if (plus) plus.textContent = isHidden ? '+' : '−';
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