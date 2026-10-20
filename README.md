# Pokoj — lo-fi kavárna

Hotová stránka a původní hudba jsou v adresáři [`cafe`](./cafe/README.md).

```sh
cd cafe
npm run dev
```

Potom otevři http://127.0.0.1:4173.

Složku `cafe/dist` lze obsluhovat libovolným statickým webovým serverem.
Obsahuje devět původních skladeb a animovanou kavárnu, takže nepotřebuje
externí hudební API.

Pro Vercel nastav **Root Directory `cafe`**, **Framework Other**,
prázdný **Build Command** a **Output Directory `dist`**.
Produkční větev je `main`, další push spustí automatické nasazení.
Podrobnosti a ověření jsou v [README aplikace](./cafe/README.md).
