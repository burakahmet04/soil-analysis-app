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

export const BUNYE_LISTESI = [
  'Kumlu',
  'Tınlı',
  'Killi',
  'Killi-Tınlı',
  'Kumlu-Tınlı',
  'Siltli',
  'Diğer',
] as const;

export interface ToprakFormValues {
  urun: string;
  bunye: string;
  ph: string;
  kirec: string;
  organikMadde: string;
  ec: string;
  fosfor: string;
  potasyum: string;
}

export const BOS_FORM: ToprakFormValues = {
  urun: '',
  bunye: '',
  ph: '',
  kirec: '',
  organikMadde: '',
  ec: '',
  fosfor: '',
  potasyum: '',
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
