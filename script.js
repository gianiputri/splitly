/* ===== DATA GLOBAL ===== */
var WARNA = ['#3D6AF5','#A6E22E','#FF8A5B','#B58CFF','#2EC4A6','#FFC83D','#FF6FA5','#4DD0E1'];
var TOLERANSI = 0.05;
var items = [];          // [{nama, qty, total, alokasi:[porsi tiap orang]}]
var orang = [];          // [{nama}]
var tabAktif = 'struk';
var hasilTerakhir = null;

/* ===== FUNGSI UTILITAS ===== */
function formatRupiah(angka) { return 'Rp ' + Math.round(angka).toLocaleString('id-ID'); }
function keAngka(teks) { var n = parseFloat(teks); return isNaN(n) ? 0 : n; }
function bulatkanKeAtas(angka, kelipatan) { return Math.ceil(angka / kelipatan - 1e-9) * kelipatan; }
function rapikan(angka) { return String(Math.round(angka * 100) / 100); }
function esc(teks) {
  return String(teks).replace(/[&<>"']/g, function (c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function inisial(nama, i) { return nama.trim() === '' ? String(i + 1) : nama.trim().charAt(0).toUpperCase(); }
function warnaTeks(i) { return i === 0 ? '#FFFFFF' : '#0B0A38'; }
function jumlahkan(arr) { var t = 0; for (var i = 0; i < arr.length; i++) t += keAngka(arr[i]); return t; }

/* ===== FUNGSI NAVIGASI ===== */
function tampilTab(nama) {
  var daftar = ['struk', 'orang', 'bagi', 'hasil'];
  for (var i = 0; i < daftar.length; i++) {
    var aktif = daftar[i] === nama;
    document.getElementById('v-' + daftar[i]).hidden = !aktif;
    var tombol = document.getElementById('t-' + daftar[i]);
    if (aktif) tombol.setAttribute('aria-current', 'page'); else tombol.removeAttribute('aria-current');
  }
  tabAktif = nama;
  document.getElementById('btn-plus').setAttribute('aria-label', nama === 'orang' ? 'Tambah orang' : 'Tambah item');
  if (nama === 'bagi') gambarBagi();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function tambahSesuaiTab() {
  if (tabAktif === 'orang') tambahOrang(); else { tampilTab('struk'); tambahItem(); }
}

/* ===== FUNGSI DATA: ITEM ===== */
function buatItemBaru() {
  var alokasi = [];
  for (var i = 0; i < orang.length; i++) alokasi.push('');
  return { nama: '', qty: '1', total: '', alokasi: alokasi };
}
function itemTerisi(it) { return !(it.nama.trim() === '' && it.total === ''); }
function tambahItem() { items.push(buatItemBaru()); gambarStruk(); }
function hapusItem(i) {
  items.splice(i, 1);
  if (items.length === 0) items.push(buatItemBaru());
  gambarStruk();
}
function ubahItem(i, kolom, nilai) { items[i][kolom] = nilai; perbaruiChip(); perbaruiSatuan(i); }
function hargaSatuan(it) {
  var q = keAngka(it.qty);
  return q > 0 ? keAngka(it.total) / q : 0;
}

/* ===== FUNGSI DATA: ORANG ===== */
function tambahOrang() {
  if (orang.length >= WARNA.length) { tampilkanError('Maksimal ' + WARNA.length + ' orang per tagihan.'); return; }
  orang.push({ nama: '' });
  for (var i = 0; i < items.length; i++) items[i].alokasi.push('');
  gambarOrang();
}
function hapusOrang(p) {
  orang.splice(p, 1);
  for (var i = 0; i < items.length; i++) items[i].alokasi.splice(p, 1);
  gambarOrang();
}
function ubahNama(p, nilai) {
  orang[p].nama = nilai;
  document.getElementById('ava-' + p).textContent = inisial(nilai, p);
}

/* ===== FUNGSI DATA: PEMBAGIAN ===== */
function ubahAlokasi(i, p, nilai) { items[i].alokasi[p] = nilai; perbaruiStatus(i); }
function geserAlokasi(i, p, selisih) {
  var baru = Math.max(0, Math.round((keAngka(items[i].alokasi[p]) + selisih) * 100) / 100);
  items[i].alokasi[p] = rapikan(baru);
  document.getElementById('al-' + i + '-' + p).value = items[i].alokasi[p];
  perbaruiStatus(i);
}
function bagiRataItem(i) {
  var porsi = rapikan(keAngka(items[i].qty) / orang.length);
  for (var p = 0; p < orang.length; p++) items[i].alokasi[p] = porsi;
  gambarBagi();
}
function statusItem(it) {
  var terbagi = jumlahkan(it.alokasi);
  var qty = keAngka(it.qty);
  return { terbagi: terbagi, qty: qty, ok: Math.abs(terbagi - qty) <= TOLERANSI };
}

/* ===== FUNGSI VALIDASI ===== */
function tampilkanError(pesan) {
  var el = document.getElementById('err');
  el.textContent = pesan; el.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function sembunyikanError() { document.getElementById('err').hidden = true; }
function validasiInput() {
  var adaItem = false;
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (!itemTerisi(it)) continue;
    adaItem = true;
    if (it.nama.trim() === '') return 'Nama item ke-' + (i + 1) + ' belum diisi.';
    if (!(keAngka(it.qty) > 0)) return 'Jumlah "' + it.nama + '" harus lebih dari 0.';
    if (it.total === '' || keAngka(it.total) < 0) return 'Total harga "' + it.nama + '" harus berupa angka positif.';
  }
  if (!adaItem) return 'Isi minimal satu item dari struk.';
  if (orang.length < 2) return 'Tambahkan minimal 2 orang untuk patungan.';
  for (var p = 0; p < orang.length; p++) {
    if (orang[p].nama.trim() === '') return 'Nama orang ke-' + (p + 1) + ' belum diisi.';
  }
  for (var k = 0; k < items.length; k++) {
    if (!itemTerisi(items[k])) continue;
    var s = statusItem(items[k]);
    if (!s.ok) return '"' + items[k].nama + '" baru terbagi ' + rapikan(s.terbagi) + ' dari ' + rapikan(s.qty) + ' porsi. Lengkapi di tab Bagi.';
  }
  var angka = ['pajak', 'service', 'diskon', 'ongkir'];
  for (var a = 0; a < angka.length; a++) {
    if (keAngka(document.getElementById(angka[a]).value) < 0) return 'Pengaturan ' + angka[a] + ' tidak boleh negatif.';
  }
  return '';
}

/* ===== FUNGSI PERHITUNGAN ===== */
function hitungPajak(subtotal, persen) { return subtotal * persen / 100; }
function hitungService(subtotal, persen) { return subtotal * persen / 100; }
function bagiSesuaiPesanan(subtotals, subtotalSemua, totalAkhir) {
  var hasil = [];
  for (var i = 0; i < subtotals.length; i++) hasil.push(totalAkhir * subtotals[i] / subtotalSemua);
  return hasil;
}

function hitungSemua() {
  sembunyikanError();
  var pesan = validasiInput();
  if (pesan !== '') { tampilkanError(pesan); return; }

  var subtotals = [], rincian = [];
  for (var p = 0; p < orang.length; p++) { subtotals.push(0); rincian.push([]); }

  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (!itemTerisi(it)) continue;
    var terbagi = jumlahkan(it.alokasi);
    for (var q = 0; q < orang.length; q++) {
      var porsi = keAngka(it.alokasi[q]);
      if (porsi <= 0) continue;
      var nilai = keAngka(it.total) * porsi / terbagi;
      subtotals[q] += nilai;
      rincian[q].push({ nama: it.nama, qty: porsi, nilai: nilai });
    }
  }
  var subtotalSemua = jumlahkan(subtotals);
  if (subtotalSemua <= 0) { tampilkanError('Total harga semua item masih 0.'); return; }

  var diskon = keAngka(document.getElementById('diskon').value);
  var ongkir = keAngka(document.getElementById('ongkir').value);
  var kelipatan = parseInt(document.getElementById('bulat').value, 10);
  if (diskon > subtotalSemua) { tampilkanError('Diskon tidak boleh lebih besar dari subtotal (' + formatRupiah(subtotalSemua) + ').'); return; }

  var pajak = hitungPajak(subtotalSemua - diskon, keAngka(document.getElementById('pajak').value));
  var service = hitungService(subtotalSemua - diskon, keAngka(document.getElementById('service').value));
  var totalAkhir = subtotalSemua - diskon + pajak + service + ongkir;
  var porsiBayar = bagiSesuaiPesanan(subtotals, subtotalSemua, totalAkhir);

  var bayar = [];
  for (var k = 0; k < porsiBayar.length; k++) bayar.push(bulatkanKeAtas(porsiBayar[k], kelipatan));

  hasilTerakhir = {
    subtotals: subtotals, rincian: rincian, subtotalSemua: subtotalSemua, diskon: diskon,
    pajak: pajak, service: service, ongkir: ongkir, totalAkhir: totalAkhir,
    bayar: bayar, terkumpul: jumlahkan(bayar)
  };
  tampilkanHasil(hasilTerakhir);
}

/* ===== FUNGSI TAMPILAN ===== */
function perbaruiChip() {
  var n = 0, sub = 0;
  for (var i = 0; i < items.length; i++) { if (itemTerisi(items[i])) { n++; sub += keAngka(items[i].total); } }
  document.getElementById('c-item').textContent = n + ' item';
  document.getElementById('c-sub').textContent = 'Subtotal ' + formatRupiah(sub);
}
function perbaruiSatuan(i) {
  var el = document.getElementById('sat-' + i);
  if (el) el.textContent = keAngka(items[i].qty) > 1 ? '@ ' + formatRupiah(hargaSatuan(items[i])) + ' per porsi' : '';
}
function perbaruiStatus(i) {
  var s = statusItem(items[i]);
  var el = document.getElementById('st-' + i);
  el.textContent = 'Terbagi ' + rapikan(s.terbagi) + ' / ' + rapikan(s.qty);
  el.className = 'tag ' + (s.ok ? 'lime' : 'warn');
}

function gambarStruk() {
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    html += '<div class="card"><div class="row">';
    html += '<input class="nama" placeholder="Nama item (misal: Nasi goreng)" aria-label="Nama item ' + (i + 1) + '" value="' + esc(it.nama) + '" oninput="ubahItem(' + i + ',\'nama\',this.value)">';
    html += '<button type="button" class="x" aria-label="Hapus item" onclick="hapusItem(' + i + ')">✕</button></div>';
    html += '<div class="row"><input class="qty" type="number" min="0" step="any" inputmode="decimal" placeholder="Jml" aria-label="Jumlah" value="' + esc(it.qty) + '" oninput="ubahItem(' + i + ',\'qty\',this.value)">';
    html += '<input type="number" min="0" inputmode="numeric" placeholder="Total harga item (Rp)" aria-label="Total harga" value="' + esc(it.total) + '" oninput="ubahItem(' + i + ',\'total\',this.value)"></div>';
    html += '<div class="sat" id="sat-' + i + '"></div></div>';
  }
  document.getElementById('daftar-item').innerHTML = html;
  for (var j = 0; j < items.length; j++) perbaruiSatuan(j);
  perbaruiChip();
}

function gambarOrang() {
  var html = '';
  for (var p = 0; p < orang.length; p++) {
    html += '<div class="card"><div class="row" style="margin:0"><span class="ava" id="ava-' + p + '" style="background:' + WARNA[p] + ';color:' + warnaTeks(p) + '">' + esc(inisial(orang[p].nama, p)) + '</span>';
    html += '<input class="nama" placeholder="Nama (misal: Andi)" aria-label="Nama orang ke-' + (p + 1) + '" value="' + esc(orang[p].nama) + '" oninput="ubahNama(' + p + ',this.value)">';
    html += '<button type="button" class="x" aria-label="Hapus orang ini" onclick="hapusOrang(' + p + ')">✕</button></div></div>';
  }
  document.getElementById('daftar-orang').innerHTML = html;
}

function gambarBagi() {
  var html = '', ada = false;
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (!itemTerisi(it)) continue;
    ada = true;
    html += '<div class="card"><div class="item-head"><h3>' + esc(it.nama || 'Item ' + (i + 1)) + '</h3><span id="st-' + i + '" class="tag"></span></div>';
    html += '<div class="sat" style="margin:-6px 0 10px">' + rapikan(keAngka(it.qty)) + ' porsi · ' + formatRupiah(keAngka(it.total)) + '</div>';
    for (var p = 0; p < orang.length; p++) {
      html += '<div class="alo"><span class="ava" style="background:' + WARNA[p] + ';color:' + warnaTeks(p) + '">' + esc(inisial(orang[p].nama, p)) + '</span><span class="n">' + esc(orang[p].nama || 'Orang ' + (p + 1)) + '</span>';
      html += '<div class="step"><button type="button" aria-label="Kurangi" onclick="geserAlokasi(' + i + ',' + p + ',-1)">−</button>';
      html += '<input id="al-' + i + '-' + p + '" type="number" min="0" step="any" inputmode="decimal" placeholder="0" aria-label="Porsi ' + esc(orang[p].nama) + '" value="' + esc(it.alokasi[p]) + '" oninput="ubahAlokasi(' + i + ',' + p + ',this.value)">';
      html += '<button type="button" aria-label="Tambah" onclick="geserAlokasi(' + i + ',' + p + ',1)">+</button></div></div>';
    }
    html += '<button type="button" class="pill" onclick="bagiRataItem(' + i + ')">Bagi rata</button></div>';
  }
  document.getElementById('daftar-bagi').innerHTML = ada ? html : '<div class="card kosong">Isi item struk dulu di tab Struk.</div>';
  for (var j = 0; j < items.length; j++) { if (itemTerisi(items[j])) perbaruiStatus(j); }
}

function tampilkanHasil(h) {
  var chartHtml = '', kartuHtml = '';
  var maks = Math.max.apply(null, h.bayar);
  for (var i = 0; i < orang.length; i++) {
    var tinggi = Math.max(4, Math.round(h.bayar[i] / maks * 100));
    chartHtml += '<div class="col"><i class="' + (h.bayar[i] === maks ? 'top' : '') + '" style="height:' + tinggi + '%"></i><span>' + esc(inisial(orang[i].nama, i)) + '</span></div>';

    var rinci = '';
    for (var r = 0; r < h.rincian[i].length; r++) {
      var x = h.rincian[i][r];
      rinci += '<div><dt>' + rapikan(x.qty) + '× ' + esc(x.nama) + '</dt><dd>' + formatRupiah(x.nilai) + '</dd></div>';
    }
    var rasio = h.subtotals[i] / h.subtotalSemua;
    rinci += '<div><dt>Pajak + service</dt><dd>' + formatRupiah((h.pajak + h.service) * rasio) + '</dd></div>';
    if (h.diskon > 0) rinci += '<div><dt>Diskon</dt><dd>−' + formatRupiah(h.diskon * rasio) + '</dd></div>';
    if (h.ongkir > 0) rinci += '<div><dt>Ongkir</dt><dd>' + formatRupiah(h.ongkir * rasio) + '</dd></div>';

    kartuHtml += '<div class="card"><div class="p-top"><span class="ava" style="background:' + WARNA[i] + ';color:' + warnaTeks(i) + '">' + esc(inisial(orang[i].nama, i)) + '</span><h3>' + esc(orang[i].nama) + (h.bayar[i] === maks ? ' <span class="tag">Terbesar</span>' : '') + '</h3><span class="bayar">' + formatRupiah(h.bayar[i]) + '</span></div><dl class="rinci">' + rinci + '</dl></div>';
  }
  document.getElementById('chart').innerHTML = chartHtml;
  document.getElementById('kartu').innerHTML = kartuHtml;
  document.getElementById('r-total').textContent = formatRupiah(h.totalAkhir);
  document.getElementById('r-prog').style.width = Math.min(100, Math.round(h.totalAkhir / h.terkumpul * 100)) + '%';
  document.getElementById('r-rinci').innerHTML = 'Subtotal ' + formatRupiah(h.subtotalSemua) + '<br>Pajak ' + formatRupiah(h.pajak) + '<br>Service ' + formatRupiah(h.service);
  var lebih = h.terkumpul - h.totalAkhir;
  document.getElementById('r-catatan').textContent = lebih > 0.5
    ? 'Karena pembulatan, uang terkumpul ' + formatRupiah(h.terkumpul) + ' (lebih ' + formatRupiah(lebih) + ' dari tagihan).'
    : 'Uang terkumpul pas dengan tagihan.';
  document.getElementById('kosong').hidden = true;
  document.getElementById('isi').hidden = false;
  tampilTab('hasil');
}

function salinRingkasan() {
  if (!hasilTerakhir) return;
  var teks = 'STRUK SPLIT BILL\nTotal: ' + formatRupiah(hasilTerakhir.totalAkhir) + '\n';
  for (var i = 0; i < orang.length; i++) teks += '- ' + orang[i].nama + ': ' + formatRupiah(hasilTerakhir.bayar[i]) + '\n';
  var info = document.getElementById('salin-info');
  function selesai(ok) { info.textContent = ok ? 'Tersalin!' : 'Gagal menyalin. Salin manual dari kartu di atas.'; }
  try {
    navigator.clipboard.writeText(teks).then(function () { selesai(true); }, function () { selesai(false); });
  } catch (e) { selesai(false); }
}

/* ===== PROGRAM UTAMA ===== */
function mulai() {
  orang.push({ nama: '' });
  orang.push({ nama: '' });
  items.push(buatItemBaru());
  gambarStruk();
  gambarOrang();
}
mulai();
