# Pokoj — lo-fi kavárna

Hotová stránka a původní hudba jsou v adresáři [`cafe`](./cafe/README.md).

```sh
cd cafe
npm run dev
```

Potom otevři http://127.0.0.1:4173.

Složku `cafe/dist` lze obsluhovat libovolným statickým webovým serverem.
Obsahuje i tři původní skladby, takže nepotřebuje externí hudební API.

Soukromý projekt Sites je zaregistrovaný v `cafe/.openai/hosting.json`.
Publikace není dokončená: síťový přístup ke zdrojovému Git serveru byl
v pracovním prostředí zablokovaný. Při pokračování je potřeba zachovat
existující ID projektu, obnovit krátkodobé oprávnění a dokončit běžný
Sites workflow; nevytvářet další Site.
