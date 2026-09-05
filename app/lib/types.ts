export const URUN_LISTESI = [
  'Buğday',
  'Arpa',
  'Mısır',
  'Pamuk',
  'Ayçiçeği',
  'Şeker Pancarı',
  'Domates',
  'Biber',
  'Patates',
  'Soğan',
  'Sarımsak',
  'Karpuz',
  'Kavun',
  'Elma',
  'Armut',
  'Kiraz',
  'Şeftali',
  'Zeytin',
  'Fındık',
  'Antep Fıstığı',
  'Sultani Çekirdeksiz Bağ',
  'Nohut',
  'Mercimek',
  'Çeltik (Pirinç)',
  'Diğer',
] as const;

// Türkiye'deki akredite toprak laboratuvarlarının (örn. TS 8333 saturasyon
// yüzdesine dayalı) kullandığı standart 5'li bünye sınıflandırması.
export const BUNYE_LISTESI = ['Kum', 'Tınlı', 'Killi Tınlı', 'Kil', 'Ağır Kil', 'Diğer'] as const;

// Hedef Ürün dışında formda/OCR'da/analiz isteğinde yer alan, tamamı opsiyonel
// tahlil alanlarının TEK kaynağı. Yeni bir parametre eklerken sadece burayı
// güncellemek yeterli — form, OCR şeması ve analiz isteği hepsi buradan türer.
export const TAHLIL_ALAN_ADLARI = [
  'bunye',
  'ph',
  'kirec',
  'organikMadde',
  'ec',
  'azot',
  'fosfor',
  'potasyum',
  'kalsiyum',
  'magnezyum',
  'sodyum',
  'demir',
  'bakir',
  'cinko',
  'mangan',
  'bor',
] as const;

export type TahlilAlanAdi = (typeof TAHLIL_ALAN_ADLARI)[number];

export type ToprakFormValues = { urun: string } & Record<TahlilAlanAdi, string>;

export const BOS_FORM: ToprakFormValues = {
  urun: '',
  ...(Object.fromEntries(TAHLIL_ALAN_ADLARI.map((alan) => [alan, ''])) as Record<TahlilAlanAdi, string>),
};

export type Durum = 'düşük' | 'yeterli' | 'yüksek' | 'bilinmiyor';

export interface Degerlendirme {
  parametre: string;
  deger: string;
  durum: Durum;
  yorum: string;
}

export interface GubrelemeAdimi {
  donem: string;
  gubre: string;
  dozKgDa: string;
  uygulamaSekli: string;
}

export interface TicariKarsilik {
  ihtiyac: string;
  ticariUrunler: string[];
  aciklama: string;
}

export type GenelDurum = 'iyi' | 'orta' | 'kritik';

export interface ToprakKarnesi {
  genelDurum: GenelDurum;
  ozet: string;
  degerlendirmeler: Degerlendirme[];
  uyarilar: string[];
  gubrelemeTakvimi: GubrelemeAdimi[];
  ticariGubreKarsiliklari: TicariKarsilik[];
  kaynakUyarisi: string;
}
