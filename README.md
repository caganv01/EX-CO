# EX-CO

Ülke tahmin kart oyunu — gizemli ipuçlarından hangi ülkeden bahsedildiğini tahmin et.

## Dosya yapısı

- `index.html` — markup (lobby fan, modal, quiz, end screen)
- `styles.css` — tüm görsel stiller
- `app.js` — quiz mantığı, state, event'ler
- `questions.json` — 30 soruluk havuz + 5 troll soru

## Çalıştırma

`app.js` `questions.json`'u `fetch()` ile yüklediği için **`file://` üzerinden açmayın** — local server gerekli:

```powershell
# Python varsa
python -m http.server 8000

# veya Node varsa
npx serve .
```

Sonra `http://localhost:8000` adresinden açın.

VS Code kullanıyorsanız "Live Server" eklentisi de çalışır.

## Oyun akışı

1. Lobby'de 4 kart yelpaze — herhangi birine dokun
2. "Oyuna Başlamak İster misin?" modal → **Evet, Başla**
3. 10 soru: pool'dan rastgele 9 + troll'den rastgele 1 (toplam 10), karıştırılmış sırayla
4. Her soru 4 şıklı, doğru cevap altın highlight, yanlış cevap kırmızı + doğru cevap altın
5. Cevap sonrası ülke siluetli reveal şeridi + puan animasyonu
6. Bitiş ekranı: skora göre 4 farklı mesaj

## Soru havuzunu özelleştirme

`questions.json` içindeki `pool` veya `troll` dizisine yeni nesne ekleyin:

```json
{
  "cat": "Kategori",
  "title": "Başlık",
  "clue": "İpucu metni...",
  "prompt": "Sence hangi ülke?",
  "answer": "Doğru cevap",
  "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
  "silh": "<svg>...</svg>",
  "facts": [["Başkent", "..."], ["İlginç", "..."]],
  "pts": 3
}
```

`options` içindeki sıra her oyunda karıştırılır. `answer` `options`'ın içinde olmalı.
