'use client';

import { useState } from 'react';

export default function Home() {
  const [form, setForm] = useState({
    urun: 'Sultani Çekirdeksiz Bağ',
    bunye: 'Killi-Tın',
    ph: '7.9',
    kirec: '12',
    organikMadde: '1.2',
    ec: '0.8',
    fosfor: '6',
    potasyum: '140',
  });

  const [rapor, setRapor] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setYukleniyor(true);
    setRapor('');

    try {
      const res = await fetch('/api/toprak-analiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setRapor(data.rapor);
      } else {
        setRapor('Hata: ' + data.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setRapor('Bağlantı hatası: ' + message);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-12 text-slate-900">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow border">
        <h1 className="text-2xl font-bold text-emerald-800 mb-2">Toprak Tahlili ve Gübreleme Motoru</h1>
        <p className="text-sm text-slate-500 mb-6">Değerleri girip butona basın.</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Hedef Ürün</label>
            <input type="text" name="urun" value={form.urun} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Toprak Bünyesi</label>
            <input type="text" name="bunye" value={form.bunye} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">pH</label>
            <input type="number" step="0.1" name="ph" value={form.ph} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Kireç (%)</label>
            <input type="number" step="0.1" name="kirec" value={form.kirec} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Organik Madde (%)</label>
            <input type="number" step="0.1" name="organikMadde" value={form.organikMadde} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">EC (dS/m)</label>
            <input type="number" step="0.1" name="ec" value={form.ec} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Fosfor (P₂O₅ ppm)</label>
            <input type="number" step="0.1" name="fosfor" value={form.fosfor} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Potasyum (K₂O ppm)</label>
            <input type="number" step="0.1" name="potasyum" value={form.potasyum} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
          </div>

          <div className="md:col-span-2 mt-2">
            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2.5 rounded transition disabled:opacity-50"
            >
              {yukleniyor ? 'Hesaplanıyor...' : 'Reçeteyi Oluştur'}
            </button>
          </div>
        </form>

        {rapor && (
          <div className="mt-6 p-4 bg-slate-50 rounded border text-sm whitespace-pre-wrap leading-relaxed">
            {rapor}
          </div>
        )}
      </div>
    </main>
  );
}