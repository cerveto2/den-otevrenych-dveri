# Den otevřených dveří 9. 11. 2026 – rezervace pro rodiče

Webová aplikace v Google Tabulce (Apps Script). Rodiče se přihlašují bez Google účtu, administrátoři vidí přehled po zadání hesla.

## Co je v projektu

| Soubor | K čemu je |
|---|---|
| `Code.gs` | Serverová logika, menu v tabulce, rozvrh z Edookitu (9. 11. 2026, třídy 1.A–9.A) |
| `Index.html` | Stránka pro rodiče (optimalizovaná pro mobil) |
| `Admin.html` | Administrace (mobil i notebook) |
| `Styles.html` | Společný vzhled |
| `web.config.json`, `scripts/`, `.github/` | Automatické publikování stránky pro rodiče na GitHub Pages |
| `appsscript.json` | Manifest – časová zóna Praha, přístup „kdokoli“ |

## Nasazení (cca 10 minut)

1. Založte novou Google Tabulku, např. „Den otevřených dveří 2026 – rezervace“.
2. **Rozšíření → Apps Script.**
3. V editoru:
   - obsah `Code.gs` vložte do souboru `Kód.gs` (`Code.gs`),
   - přes **+ → HTML** vytvořte soubory `Index`, `Admin` a `Styles` (bez přípony) a vložte do nich obsah příslušných `.html` souborů,
   - **Nastavení projektu (ozubené kolo) → zaškrtněte „Zobrazovat soubor manifestu appsscript.json v editoru“** a jeho obsah nahraďte souborem `appsscript.json`.
4. Uložte (Ctrl/Cmd + S). Nahoře vyberte funkci **`pripravitTabulku`** a klikněte na **Spustit**. Google si vyžádá oprávnění (tabulka, odesílání e-mailů) – povolte.
   V tabulce vzniknou listy **Rozvrh**, **Rezervace** a **Nastavení**.
5. Obnovte tabulku. Objeví se menu **Den otevřených dveří → Nastavit heslo administrátorů**. Zadejte heslo (min. 8 znaků).
6. V Apps Scriptu: **Nasadit → Nové nasazení → typ Webová aplikace**
   - Spustit jako: **Já**
   - Kdo má přístup: **Kdokoli**
   - Nasadit a zkopírovat URL.
7. V tabulce **Den otevřených dveří → Zobrazit odkazy na aplikaci**:
   - odkaz pro rodiče: `…/exec`
   - odkaz pro administrátory: `…/exec?admin`

> **Školní Google Workspace:** pokud ve volbě „Kdo má přístup“ chybí možnost **Kdokoli**, správce domény zakazuje veřejné webové aplikace. Buď to povolí v Admin konzoli (Apps Script → sdílení mimo doménu), nebo tabulku a skript založte pod účtem, který to dovoluje.

> **Po každé změně kódu** je potřeba **Nasadit → Spravovat nasazení → upravit (tužka) → Verze: Nová verze**. Odkaz zůstane stejný.

## Stránka pro rodiče na GitHub Pages (řeší telefony s více Google účty)

Když je telefon přihlášený do více Google účtů, Google u webové aplikace hlásí „Je nám líto, ale soubor momentálně nelze otevřít“. Proto se stránka pro rodiče publikuje i na GitHub Pages, odkud s tabulkou komunikuje na pozadí bez přihlášení.

- Repozitář: https://github.com/cerveto2/den-otevrenych-dveri
- Stránka: https://cerveto2.github.io/den-otevrenych-dveri/
- Při každém pushi do větve `main` ji GitHub Action (`.github/workflows/pages.yml`) sama sestaví z `Index.html` + `Styles.html` (`scripts/sestavit_stranku.py`) a nasadí – stačí upravit a pushnout.
- Adresa webové aplikace (`…/exec`) je ve `web.config.json` → `apiUrl`. Lze ji upravit i přímo na GitHubu v prohlížeči.
- Adresu stránky na GitHubu mějte i v `Code.gs` → `KONFIG.verejnaAdresa`, aby osobní odkazy v e-mailech vedly sem.

Apps Script se z GitHubu neaktualizuje sám – po změně `Code.gs`, `Index.html`, `Admin.html` nebo `Styles.html` vložte nový obsah do editoru Apps Scriptu a nasaďte novou verzi.

Administrace zůstává na `…/exec?admin` (při potížích s více účty ji otevřete v anonymním okně).

## Jak to funguje pro rodiče

1. Zadají své jméno (a nepovinně e-mail – přijde jim potvrzení s odkazem).
2. Napíšou jméno dítěte, vyberou třídu a zaškrtnou hodiny. Nabízejí se jen povolené hodiny:
   - 1.–3. třída: 1.–4. hodina
   - 4.–5. třída: 1.–2. hodina
   - 6.–9. třída: 1.–6. hodina
3. Více dětí: tlačítko **Přidat další dítě** (nebo kdykoli později).
4. Po odeslání vidí blok **Jste přihlášeni** – které dítě, třída, hodina, čas, předmět, učebna. Sami si rezervaci zrušit nemůžou – rušení dělá jen administrátor (v administraci tlačítko **Zrušit**, případně **Obnovit**).
5. Prohlížeč si rodiče pamatuje. Na jiném zařízení se k rezervacím dostanou přes **osobní odkaz** (zobrazí se na stránce a přijde e-mailem).
6. Pokud vyberou dvě třídy ve stejnou hodinu, stránka je upozorní, že obě návštěvy nestihnou.

## Administrace (`…/exec?admin`)

- Souhrn: počet rodičů, dětí a návštěv.
- **Obsazenost** – tabulka třída × hodina; klepnutí na číslo ukáže, kdo přijde.
- **Podle hodin** – karta pro každou hodinu: rodič, dítě, e-mail. Tlačítko **Tisk** vytiskne seznamy pro vyučující.
- **Seznam** – všechny rezervace, řazení, hledání, filtry podle třídy/hodiny, zobrazení zrušených.
- Zrušení / obnovení rezervace.
- Tlačítko **Tabulka** otevře Google Tabulku s daty.

## Nastavení (list „Nastavení“)

| Položka | Význam |
|---|---|
| Přihlašování otevřeno | `ANO` / `NE` – uzavře nové rezervace (rodiče uvidí hlášku) |
| Max. počet rodičů na jednu hodinu ve třídě | prázdné = bez limitu; číslo = po naplnění se hodina zobrazí jako „Obsazeno“ |

## Úpravy rozvrhu

List **Rozvrh** je zdroj pravdy. Lze ručně upravit předmět, učebnu nebo sloupec **Povoleno** (ANO/NE). Změny se projeví hned, bez nového nasazení.
Pokud se rozvrh v Edookitu změní (suplování), stačí upravit řádek v listu.

**Ke kontrole:** zkratky předmětů **It**, **TH** a **TS** jsem nechal tak, jak jsou v Edookitu. Pokud chcete rodičům ukázat celý název, přepište je v listu Rozvrh.

**Menu → Vrátit list Rozvrh do původního stavu** obnoví rozvrh stažený z Edookitu (rezervací se to nedotkne).

## Data a soukromí

- Rezervace jsou v listu **Rezervace**. Zrušené se nemažou, jen mají stav „Zrušeno“.
- Sloupec **Token** (skrytý) je identifikátor rodiny – nesdílejte ho, kdo ho zná, vidí a ruší rezervace té rodiny.
- Stránka pro rodiče nikdy neukazuje jména ostatních rodičů.
- Po akci můžete tabulku archivovat nebo data smazat.
