/**
 * Den otevřených dveří – rezervace návštěv výuky pro rodiče.
 * Webová aplikace nad Google Tabulkou (Apps Script). Postup nasazení viz NAVOD.md.
 *
 * Listy v tabulce:
 *   Rozvrh     – hodiny jednotlivých tříd v den akce (sloupec Povoleno = lze rezervovat)
 *   Rezervace  – co si rodiče zarezervovali (zrušené se jen označí, nemažou se)
 *   Nastavení  – otevření/uzavření přihlašování, případný limit rodičů na hodinu
 */

const KONFIG = {
  nazev: 'Den otevřených dveří',
  skola: '',
  // Adresa stránky pro rodiče na GitHub Pages (např. 'https://uzivatel.github.io/den-otevrenych-dveri/').
  // Použije se v osobních odkazech v e-mailech. Prázdné = odkaz na tuto webovou aplikaci.
  verejnaAdresa: 'https://cerveto2.github.io/den-otevrenych-dveri/',
  datumText: 'pondělí 9. listopadu 2026',
  casovaZona: 'Europe/Prague',
  // Ročník → hodiny, na které mohou rodiče přijít. Použije se při vytvoření listu Rozvrh,
  // potom už platí sloupec Povoleno v listu Rozvrh.
  povoleneHodiny: {
    1: [1, 2, 3, 4], 2: [1, 2, 3, 4], 3: [1, 2, 3, 4],
    4: [1, 2], 5: [1, 2],
    6: [1, 2, 3, 4, 5, 6], 7: [1, 2, 3, 4, 5, 6], 8: [1, 2, 3, 4, 5, 6], 9: [1, 2, 3, 4, 5, 6]
  }
};

// Rozvrh na 9. 11. 2026 stažený z Edookitu: třída, hodina, od, do, předmět, učebna, vyučující.
const ROZVRH_EDOOKIT = [
  ['1.A', 1, '08:30', '09:15', 'Český jazyk', '104', 'Ran'],
  ['1.A', 2, '09:25', '10:10', 'Matematika', '104', 'Ran'],
  ['1.A', 3, '10:30', '11:15', 'It', '104', 'Ran'],
  ['1.A', 4, '11:25', '12:10', 'Hudební výchova', '104', 'Jar'],
  ['1.A', 5, '12:20', '13:05', 'TS', 'Sportoviště', 'Beč'],
  ['1.A', 6, '13:15', '14:00', 'TS', 'Sportoviště', 'Beč'],
  ['2.A', 1, '08:30', '09:15', 'Český jazyk', '102', 'Šmí'],
  ['2.A', 2, '09:25', '10:10', 'Český jazyk', '102', 'Šmí'],
  ['2.A', 3, '10:30', '11:15', 'Prvouka', '102', 'Sin'],
  ['2.A', 4, '11:25', '12:10', 'It', '102', 'Šmí'],
  ['2.A', 5, '12:20', '13:05', 'TS', 'Sportoviště', 'Beč'],
  ['2.A', 6, '13:15', '14:00', 'TS', 'Sportoviště', 'Beč'],
  ['3.A', 1, '08:30', '09:15', 'Český jazyk', '101', 'Pav'],
  ['3.A', 2, '09:25', '10:10', 'Český jazyk', '101', 'Pav'],
  ['3.A', 3, '10:30', '11:15', 'Matematika', '101', 'Pav'],
  ['3.A', 4, '11:25', '12:10', 'Prvouka', '101', 'Pav'],
  ['3.A', 5, '12:20', '13:05', 'Pracovní činnosti / TS', '101, Sportoviště', 'Pav, Beč'],
  ['3.A', 6, '13:15', '14:00', 'TS', 'Sportoviště', 'Beč'],
  ['4.A', 1, '08:30', '09:15', 'Matematika', '103', 'Chu'],
  ['4.A', 2, '09:25', '10:10', 'Anglický jazyk', '103(1), 103(2)', 'Sin, Vot'],
  ['4.A', 3, '10:30', '11:15', 'Tělesná výchova', 'Sokol.', 'Beč, Cla'],
  ['4.A', 4, '11:25', '12:10', 'Tělesná výchova', 'Sokol.', 'Beč, Cla'],
  ['4.A', 5, '12:20', '13:05', 'Hudební výchova', '103', 'Jar'],
  ['5.A', 1, '08:30', '09:15', 'Český jazyk', '207', 'Cla'],
  ['5.A', 2, '09:25', '10:10', 'Matematika', '207', 'Cla'],
  ['5.A', 3, '10:30', '11:15', 'Tělesná výchova', 'Sokol.', 'Beč, Cla'],
  ['5.A', 4, '11:25', '12:10', 'Tělesná výchova', 'Sokol.', 'Beč, Cla'],
  ['5.A', 5, '12:20', '13:05', 'Český jazyk', '207', 'Cla'],
  ['6.A', 1, '08:30', '09:15', 'TH', '201', 'Nes'],
  ['6.A', 2, '09:25', '10:10', 'Anglický jazyk', '201(1), 201(2)', 'Nes, Chu'],
  ['6.A', 3, '10:30', '11:15', 'Zeměpis', '201', 'Nes'],
  ['6.A', 4, '11:25', '12:10', 'Český jazyk', '201', 'Tom'],
  ['6.A', 5, '12:20', '13:05', 'Matematika', '201', 'Dang'],
  ['6.A', 6, '13:15', '14:00', 'Hudební výchova', '201', 'Jar'],
  ['7.A', 1, '08:30', '09:15', 'Český jazyk', '106', 'Pid'],
  ['7.A', 2, '09:25', '10:10', 'Matematika', '106', 'Dang'],
  ['7.A', 3, '10:30', '11:15', 'Hudební výchova', '106', 'Jar'],
  ['7.A', 4, '11:25', '12:10', 'TH', '106', 'Pid'],
  ['7.A', 5, '12:20', '13:05', 'Výchova k občanství', '106', 'Nes'],
  ['7.A', 6, '13:15', '14:00', 'Zeměpis', '106', 'Rah'],
  ['8.A', 1, '08:30', '09:15', 'Chemie', '105', 'Rah'],
  ['8.A', 2, '09:25', '10:10', 'Fyzika', '105', 'Rah'],
  ['8.A', 3, '10:30', '11:15', 'Český jazyk', '105', 'Tom'],
  ['8.A', 4, '11:25', '12:10', 'Anglický jazyk', '105(1), 105(2)', 'Nes, Chu'],
  ['8.A', 5, '12:20', '13:05', 'TH', '105', 'Tom'],
  ['8.A', 6, '13:15', '14:00', 'Matematika', '105', 'Dang'],
  ['9.A', 1, '08:30', '09:15', 'Matematika', '107', 'Dang'],
  ['9.A', 2, '09:25', '10:10', 'Český jazyk', '107', 'Pid'],
  ['9.A', 3, '10:30', '11:15', 'TH', '107', 'Chu'],
  ['9.A', 4, '11:25', '12:10', 'Anglický jazyk', '107', 'Jim'],
  ['9.A', 5, '12:20', '13:05', 'Výchova ke zdraví', '107', 'Chu'],
  ['9.A', 6, '13:15', '14:00', 'Dějepis', '107', 'Nes']
];

const LIST_ROZVRH = 'Rozvrh';
const LIST_REZERVACE = 'Rezervace';
const LIST_NASTAVENI = 'Nastavení';

const SLOUPCE_ROZVRH = ['Třída', 'Hodina', 'Od', 'Do', 'Předmět', 'Učebna', 'Vyučující', 'Povoleno'];
const SLOUPCE_REZERVACE = ['ID', 'Vytvořeno', 'Rodič', 'E-mail', 'Dítě', 'Třída', 'Hodina', 'Čas', 'Předmět', 'Učebna', 'Stav', 'Změněno', 'Token'];
const R = { id: 0, vytvoreno: 1, rodic: 2, email: 3, dite: 4, trida: 5, hodina: 6, cas: 7, predmet: 8, ucebna: 9, stav: 10, zmeneno: 11, token: 12 };

const STAV_AKTIVNI = 'Aktivní';
const STAV_ZRUSENO = 'Zrušeno';

const NASTAVENI_OTEVRENO = 'Přihlašování otevřeno (ANO/NE)';
const NASTAVENI_KAPACITA = 'Max. počet rodičů na jednu hodinu ve třídě (prázdné = bez limitu)';

const VLASTNOST_HESLO = 'ADMIN_HESLO';

/* ------------------------------------------------------------------ */
/* Web a menu                                                          */
/* ------------------------------------------------------------------ */

function doGet(e) {
  const admin = !!(e && e.parameter && e.parameter.admin !== undefined);
  const sablona = HtmlService.createTemplateFromFile(admin ? 'Admin' : 'Index');
  return sablona.evaluate()
    .setTitle(admin ? KONFIG.nazev + ' – administrace' : KONFIG.nazev)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

/**
 * Rozhraní pro stránku pro rodiče hostovanou mimo Google (GitHub Pages).
 * Stránka posílá POST s textem {"fn": "...", "args": [...]}; volat jde jen funkce níže.
 * Díky tomu se stránka otevře i v prohlížeči přihlášeném do více Google účtů.
 */
function doPost(e) {
  let odpoved;
  try {
    const pozadavek = JSON.parse(e && e.postData ? e.postData.contents : '{}');
    const args = Array.isArray(pozadavek.args) ? pozadavek.args : [];
    let vysledek;
    if (pozadavek.fn === 'getUvodniData') vysledek = getUvodniData(args[0]);
    else if (pozadavek.fn === 'rezervovat') vysledek = rezervovat(args[0]);
    else throw new Error('Neznámá akce.');
    odpoved = { ok: true, vysledek: vysledek };
  } catch (err) {
    odpoved = { ok: false, chyba: err && err.message ? err.message : String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(odpoved)).setMimeType(ContentService.MimeType.JSON);
}

function include(nazev) {
  return HtmlService.createHtmlOutputFromFile(nazev).getContent();
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Den otevřených dveří')
    .addItem('Připravit tabulku', 'pripravitTabulku')
    .addItem('Nastavit heslo administrátorů', 'nastavitHeslo')
    .addItem('Zobrazit odkazy na aplikaci', 'zobrazitOdkazy')
    .addSeparator()
    .addItem('Vrátit list Rozvrh do původního stavu', 'obnovitRozvrh')
    .addToUi();
}

/** Vytvoří chybějící listy a naplní rozvrh. Lze spouštět opakovaně, nic nepřepíše. */
function pripravitTabulku() {
  const ss = SpreadsheetApp.getActive();

  let rozvrh = ss.getSheetByName(LIST_ROZVRH);
  if (!rozvrh) rozvrh = ss.insertSheet(LIST_ROZVRH);
  if (rozvrh.getLastRow() < 2) naplnRozvrh_(rozvrh);

  let rezervace = ss.getSheetByName(LIST_REZERVACE);
  if (!rezervace) {
    rezervace = ss.insertSheet(LIST_REZERVACE);
    rezervace.getRange(1, 1, 1, SLOUPCE_REZERVACE.length).setValues([SLOUPCE_REZERVACE]).setFontWeight('bold');
    rezervace.setFrozenRows(1);
    // Textové sloupce jako text, ať Tabulky nepřevádí jména nebo ID na čísla či vzorce.
    [R.id, R.rodic, R.email, R.dite, R.trida, R.cas, R.predmet, R.ucebna, R.stav, R.token].forEach(function (c) {
      rezervace.getRange(1, c + 1, rezervace.getMaxRows(), 1).setNumberFormat('@');
    });
    rezervace.getRange(1, R.vytvoreno + 1, rezervace.getMaxRows(), 1).setNumberFormat('d. M. yyyy H:mm');
    rezervace.getRange(1, R.zmeneno + 1, rezervace.getMaxRows(), 1).setNumberFormat('d. M. yyyy H:mm');
    rezervace.hideColumns(R.token + 1);
  }

  let nastaveni = ss.getSheetByName(LIST_NASTAVENI);
  if (!nastaveni) {
    nastaveni = ss.insertSheet(LIST_NASTAVENI);
    nastaveni.getRange(1, 1, 3, 2).setValues([
      ['Nastavení', 'Hodnota'],
      [NASTAVENI_OTEVRENO, 'ANO'],
      [NASTAVENI_KAPACITA, '']
    ]);
    nastaveni.getRange(1, 1, 1, 2).setFontWeight('bold');
    nastaveni.setColumnWidth(1, 460);
  }

  // Bublina místo dialogu – dialog by při spuštění z editoru blokoval skript, dokud ho někdo v tabulce nezavře.
  const zprava = 'Tabulka je připravená. Dalším krokem je nastavit heslo administrátorů a nasadit webovou aplikaci (viz návod).';
  ss.toast(zprava, KONFIG.nazev, 10);
  console.log(zprava);
}

function obnovitRozvrh() {
  const ui = SpreadsheetApp.getUi();
  const odpoved = ui.alert('Vrátit list Rozvrh do původního stavu?',
    'Ruční úpravy v listu Rozvrh se přepíšou rozvrhem z Edookitu. Rezervace zůstanou beze změny.',
    ui.ButtonSet.OK_CANCEL);
  if (odpoved !== ui.Button.OK) return;
  const list = SpreadsheetApp.getActive().getSheetByName(LIST_ROZVRH) || SpreadsheetApp.getActive().insertSheet(LIST_ROZVRH);
  list.clear();
  naplnRozvrh_(list);
}

function naplnRozvrh_(list) {
  const radky = ROZVRH_EDOOKIT.map(function (r) {
    const rocnik = parseInt(r[0], 10);
    const povoleno = (KONFIG.povoleneHodiny[rocnik] || []).indexOf(r[1]) !== -1;
    return r.concat([povoleno ? 'ANO' : 'NE']);
  });
  list.getRange(1, 1, list.getMaxRows(), SLOUPCE_ROZVRH.length).setNumberFormat('@');
  list.getRange(1, 2, list.getMaxRows(), 1).setNumberFormat('0');
  list.getRange(1, 1, 1, SLOUPCE_ROZVRH.length).setValues([SLOUPCE_ROZVRH]).setFontWeight('bold');
  list.getRange(2, 1, radky.length, SLOUPCE_ROZVRH.length).setValues(radky);
  list.setFrozenRows(1);
}

function nastavitHeslo() {
  const ui = SpreadsheetApp.getUi();
  const odpoved = ui.prompt('Heslo administrátorů',
    'Zadejte heslo pro vstup do administrace (aspoň 8 znaků). Pošlete ho jen lidem, kteří mají vidět seznam přihlášených.',
    ui.ButtonSet.OK_CANCEL);
  if (odpoved.getSelectedButton() !== ui.Button.OK) return;
  const heslo = odpoved.getResponseText().trim();
  if (heslo.length < 8) {
    ui.alert('Heslo musí mít aspoň 8 znaků. Zkuste to znovu.');
    return;
  }
  PropertiesService.getScriptProperties().setProperty(VLASTNOST_HESLO, heslo);
  ui.alert('Heslo je uložené.');
}

function zobrazitOdkazy() {
  const url = ScriptApp.getService().getUrl();
  if (!url) {
    ozname_('Aplikace ještě není nasazená. Zvolte Nasadit → Nové nasazení → Webová aplikace (viz návod).');
    return;
  }
  ozname_('Pro rodiče:\n' + url + '\n\nPro administrátory:\n' + url + '?admin');
}

function ozname_(text) {
  try {
    SpreadsheetApp.getUi().alert(text);
  } catch (e) {
    console.log(text); // spuštěno z editoru bez otevřené tabulky
  }
}

/* ------------------------------------------------------------------ */
/* Veřejné funkce pro stránku rodičů                                   */
/* ------------------------------------------------------------------ */

function getUvodniData(token) {
  const nastaveni = nactiNastaveni_();
  const rozvrh = nactiRozvrh_();
  const rezervace = nactiRezervace_();
  const obsazenost = obsazenost_(rezervace);

  const tridy = {};
  rozvrh.forEach(function (h) {
    if (!h.povoleno) return;
    if (!tridy[h.trida]) tridy[h.trida] = { trida: h.trida, hodiny: [] };
    const pocet = (obsazenost[h.trida + '|' + h.hodina] || {}).pocet || 0;
    tridy[h.trida].hodiny.push({
      hodina: h.hodina, zacatek: h.zacatek, konec: h.konec, predmet: h.predmet, ucebna: h.ucebna,
      plno: nastaveni.kapacita > 0 && pocet >= nastaveni.kapacita
    });
  });

  return {
    nazev: KONFIG.nazev,
    skola: KONFIG.skola,
    datumText: KONFIG.datumText,
    otevreno: nastaveni.otevreno,
    zakladniUrl: zakladniAdresa_(),
    tridy: Object.keys(tridy).sort(porovnejTridy_).map(function (k) {
      tridy[k].hodiny.sort(function (a, b) { return a.hodina - b.hodina; });
      return tridy[k];
    }),
    moje: platnyToken_(token) ? mojeRezervace_(rezervace, token) : null
  };
}

/**
 * data = { token?, rodic, email?, deti: [{ dite, trida, hodiny: [1, 2] }] }
 * Buď se uloží všechno, nebo nic (při chybě se nic nezapíše).
 */
function rezervovat(data) {
  data = data || {};
  const rodic = cistyText_(data.rodic, 80);
  const email = String(data.email || '').trim().slice(0, 120);
  if (rodic.length < 3) throw new Error('Zadejte své jméno a příjmení.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('E-mail nemá správný tvar. Zadejte ho třeba jako jana.novakova@email.cz, nebo pole nechte prázdné.');
  }
  const deti = Array.isArray(data.deti) ? data.deti.slice(0, 10) : [];
  if (!deti.length) throw new Error('Přidejte aspoň jedno dítě.');
  const token = platnyToken_(data.token) ? data.token : Utilities.getUuid();

  const zamek = LockService.getScriptLock();
  zamek.waitLock(20000);
  let nove = [];
  let preskoceno = 0;
  try {
    const nastaveni = nactiNastaveni_();
    if (!nastaveni.otevreno) throw new Error('Přihlašování je už uzavřené. S dotazem se obraťte přímo na školu.');

    const rozvrh = {};
    nactiRozvrh_().forEach(function (h) { rozvrh[h.trida + '|' + h.hodina] = h; });
    const rezervace = nactiRezervace_();
    const obsazenost = obsazenost_(rezervace);
    const existujici = {};
    rezervace.forEach(function (z) {
      if (z.stav === STAV_AKTIVNI && z.token === token) existujici[klicRezervace_(token, z.dite, z.trida, z.hodina)] = true;
    });

    const ted = new Date();
    deti.forEach(function (d, i) {
      const dite = cistyText_(d && d.dite, 80);
      const trida = String(d && d.trida || '').trim();
      if (dite.length < 2) throw new Error('Zadejte jméno a příjmení ' + (i + 1) + '. dítěte.');
      const hodiny = (Array.isArray(d.hodiny) ? d.hodiny : [])
        .map(Number)
        .filter(function (h, j, pole) { return h > 0 && pole.indexOf(h) === j; });
      if (!hodiny.length) throw new Error('U dítěte ' + dite + ' vyberte aspoň jednu hodinu.');

      hodiny.forEach(function (h) {
        const slot = rozvrh[trida + '|' + h];
        if (!slot || !slot.povoleno) throw new Error(h + '. hodinu ve třídě ' + trida + ' nelze rezervovat. Obnovte stránku a vyberte znovu.');
        const klic = klicRezervace_(token, dite, trida, h);
        if (existujici[klic]) { preskoceno++; return; }
        const o = obsazenost[trida + '|' + h] || (obsazenost[trida + '|' + h] = { pocet: 0, tokeny: {} });
        if (nastaveni.kapacita > 0 && !o.tokeny[token] && o.pocet >= nastaveni.kapacita) {
          throw new Error('Na ' + h + '. hodinu ve třídě ' + trida + ' už není volné místo. Vyberte prosím jinou hodinu.');
        }
        if (!o.tokeny[token]) { o.tokeny[token] = true; o.pocet++; }
        existujici[klic] = true;
        nove.push(['R-' + Utilities.getUuid().slice(0, 8), ted, rodic, email, dite, trida, h,
          slot.zacatek + '–' + slot.konec, slot.predmet, slot.ucebna, STAV_AKTIVNI, '', token]);
      });
    });

    if (nove.length) {
      const list = list_(LIST_REZERVACE);
      list.getRange(list.getLastRow() + 1, 1, nove.length, SLOUPCE_REZERVACE.length).setValues(nove);
      SpreadsheetApp.flush();
    }
  } finally {
    zamek.releaseLock();
  }

  const moje = mojeRezervace_(nactiRezervace_(), token);
  const odkaz = osobniOdkaz_(token);
  if (email && nove.length) posliPotvrzeni_(email, rodic, moje, odkaz);
  return { token: token, ulozeno: nove.length, preskoceno: preskoceno, moje: moje };
}

function getMojeRezervace(token) {
  if (!platnyToken_(token)) return null;
  return mojeRezervace_(nactiRezervace_(), token);
}

/* ------------------------------------------------------------------ */
/* Administrace                                                        */
/* ------------------------------------------------------------------ */

function adminData(heslo) {
  overHeslo_(heslo);
  const nastaveni = nactiNastaveni_();
  const tz = Session.getScriptTimeZone() || KONFIG.casovaZona;
  return {
    nazev: KONFIG.nazev,
    datumText: KONFIG.datumText,
    otevreno: nastaveni.otevreno,
    kapacita: nastaveni.kapacita,
    tabulkaUrl: SpreadsheetApp.getActive().getUrl(),
    rozvrh: nactiRozvrh_(),
    rezervace: nactiRezervace_().map(function (z) {
      return {
        id: z.id, rodic: z.rodic, email: z.email, dite: z.dite, trida: z.trida, hodina: z.hodina,
        cas: z.cas, predmet: z.predmet, ucebna: z.ucebna, stav: z.stav, rodina: z.token.slice(0, 8),
        vytvoreno: z.vytvoreno ? Utilities.formatDate(z.vytvoreno, tz, 'd. M. H:mm') : '',
        vytvorenoMs: z.vytvoreno ? z.vytvoreno.getTime() : 0
      };
    })
  };
}

function adminZmenitStav(heslo, id, stav) {
  overHeslo_(heslo);
  if (stav !== STAV_AKTIVNI && stav !== STAV_ZRUSENO) throw new Error('Neznámý stav rezervace.');
  zmenitStav_(id, stav);
  return adminData(heslo);
}

function overHeslo_(heslo) {
  const cache = CacheService.getScriptCache();
  const pokusy = Number(cache.get('neuspesnaHesla') || 0);
  if (pokusy >= 10) throw new Error('Příliš mnoho neúspěšných pokusů. Zkuste to znovu za 10 minut.');
  const spravne = PropertiesService.getScriptProperties().getProperty(VLASTNOST_HESLO);
  if (!spravne) throw new Error('Heslo administrátorů ještě není nastavené. V tabulce zvolte Den otevřených dveří → Nastavit heslo administrátorů.');
  if (String(heslo || '') !== spravne) {
    cache.put('neuspesnaHesla', String(pokusy + 1), 600);
    throw new Error('Heslo není správné. Zkontrolujte ho a zkuste to znovu.');
  }
}

/* ------------------------------------------------------------------ */
/* Práce s listy                                                       */
/* ------------------------------------------------------------------ */

function list_(nazev) {
  const list = SpreadsheetApp.getActive().getSheetByName(nazev);
  if (!list) throw new Error('V tabulce chybí list „' + nazev + '“. Spusťte Den otevřených dveří → Připravit tabulku.');
  return list;
}

function nactiNastaveni_() {
  const hodnoty = {};
  list_(LIST_NASTAVENI).getDataRange().getValues().forEach(function (r) { hodnoty[String(r[0]).trim()] = r[1]; });
  const otevreno = String(hodnoty[NASTAVENI_OTEVRENO] === undefined ? 'ANO' : hodnoty[NASTAVENI_OTEVRENO]).trim();
  const kapacita = parseInt(hodnoty[NASTAVENI_KAPACITA], 10);
  return {
    otevreno: !/^(ne|n|no|false|0)$/i.test(otevreno),
    kapacita: kapacita > 0 ? kapacita : 0
  };
}

function nactiRozvrh_() {
  return list_(LIST_ROZVRH).getDataRange().getValues().slice(1)
    .filter(function (r) { return String(r[0]).trim() !== '' && Number(r[1]) > 0; })
    .map(function (r) {
      return {
        trida: String(r[0]).trim(),
        hodina: Number(r[1]),
        zacatek: cas_(r[2]),
        konec: cas_(r[3]),
        predmet: String(r[4]).trim(),
        ucebna: String(r[5]).trim(),
        vyucujici: String(r[6]).trim(),
        povoleno: /^(ano|a|yes|true|1)$/i.test(String(r[7]).trim())
      };
    })
    .sort(function (a, b) { return porovnejTridy_(a.trida, b.trida) || a.hodina - b.hodina; });
}

function nactiRezervace_() {
  const hodnoty = list_(LIST_REZERVACE).getDataRange().getValues();
  const vysledek = [];
  for (let i = 1; i < hodnoty.length; i++) {
    const r = hodnoty[i];
    if (String(r[R.id]).trim() === '') continue;
    vysledek.push({
      radek: i + 1,
      id: String(r[R.id]),
      vytvoreno: r[R.vytvoreno] instanceof Date ? r[R.vytvoreno] : null,
      rodic: String(r[R.rodic]),
      email: String(r[R.email]),
      dite: String(r[R.dite]),
      trida: String(r[R.trida]).trim(),
      hodina: Number(r[R.hodina]),
      cas: String(r[R.cas]),
      predmet: String(r[R.predmet]),
      ucebna: String(r[R.ucebna]),
      stav: String(r[R.stav]).trim() || STAV_AKTIVNI,
      token: String(r[R.token])
    });
  }
  return vysledek;
}

/** Počet různých rodin (tokenů) na každou hodinu ve třídě. */
function obsazenost_(rezervace) {
  const o = {};
  rezervace.forEach(function (z) {
    if (z.stav !== STAV_AKTIVNI) return;
    const k = z.trida + '|' + z.hodina;
    if (!o[k]) o[k] = { pocet: 0, tokeny: {} };
    if (!o[k].tokeny[z.token]) { o[k].tokeny[z.token] = true; o[k].pocet++; }
  });
  return o;
}

function mojeRezervace_(rezervace, token) {
  const moje = rezervace.filter(function (z) { return z.token === token; });
  const posledni = moje[moje.length - 1];
  return {
    rodic: posledni ? posledni.rodic : '',
    email: posledni ? posledni.email : '',
    rezervace: moje
      .filter(function (z) { return z.stav === STAV_AKTIVNI; })
      .map(function (z) {
        return { id: z.id, dite: z.dite, trida: z.trida, hodina: z.hodina, cas: z.cas, predmet: z.predmet, ucebna: z.ucebna };
      })
      .sort(function (a, b) {
        return a.dite.localeCompare(b.dite, 'cs') || porovnejTridy_(a.trida, b.trida) || a.hodina - b.hodina;
      })
  };
}

/** Rušit a obnovovat rezervace může jen administrátor. */
function zmenitStav_(id, stav) {
  const zamek = LockService.getScriptLock();
  zamek.waitLock(20000);
  try {
    const rezervace = nactiRezervace_();
    const z = rezervace.filter(function (x) { return x.id === String(id); })[0];
    if (!z) throw new Error('Rezervaci se nepodařilo najít. Obnovte stránku.');
    if (z.stav === stav) return;

    if (stav === STAV_AKTIVNI) {
      const duplicitni = rezervace.some(function (x) {
        return x.stav === STAV_AKTIVNI && x.id !== z.id &&
          klicRezervace_(x.token, x.dite, x.trida, x.hodina) === klicRezervace_(z.token, z.dite, z.trida, z.hodina);
      });
      if (duplicitni) return;
      const nastaveni = nactiNastaveni_();
      const o = obsazenost_(rezervace)[z.trida + '|' + z.hodina] || { pocet: 0, tokeny: {} };
      if (nastaveni.kapacita > 0 && !o.tokeny[z.token] && o.pocet >= nastaveni.kapacita) {
        throw new Error('Na ' + z.hodina + '. hodinu ve třídě ' + z.trida + ' už mezitím není volné místo.');
      }
    }

    const list = list_(LIST_REZERVACE);
    list.getRange(z.radek, R.stav + 1).setValue(stav);
    list.getRange(z.radek, R.zmeneno + 1).setValue(new Date());
    SpreadsheetApp.flush();
  } finally {
    zamek.releaseLock();
  }
}

/* ------------------------------------------------------------------ */
/* Pomocné                                                             */
/* ------------------------------------------------------------------ */

function posliPotvrzeni_(email, rodic, moje, odkaz) {
  try {
    const radky = moje.rezervace.map(function (r) {
      return '<li><b>' + esc_(r.dite) + '</b> (' + esc_(r.trida) + ') – ' + r.hodina + '. hodina, ' +
        esc_(r.cas) + ', ' + esc_(r.predmet) + (r.ucebna ? ', učebna ' + esc_(r.ucebna) : '') + '</li>';
    }).join('');
    const html =
      '<p>Dobrý den,</p>' +
      '<p>děkujeme za rezervaci na ' + esc_(KONFIG.nazev.toLowerCase()) + ' – ' + esc_(KONFIG.datumText) + '. Přehled vašich návštěv:</p>' +
      '<ul>' + radky + '</ul>' +
      (odkaz ? '<p>Rezervace můžete kdykoli zkontrolovat nebo doplnit zde:<br><a href="' + esc_(odkaz) + '">' + esc_(odkaz) + '</a></p>' : '') +
      '<p>Pokud potřebujete rezervaci zrušit, obraťte se prosím na školu.</p>' +
      '<p>Těšíme se na vás.</p>';
    MailApp.sendEmail({ to: email, subject: KONFIG.nazev + ' – potvrzení rezervace', htmlBody: html, name: KONFIG.nazev });
  } catch (e) {
    console.warn('Potvrzovací e-mail se nepodařilo odeslat: ' + e);
  }
}

function zakladniAdresa_() {
  return KONFIG.verejnaAdresa || ScriptApp.getService().getUrl() || '';
}

function osobniOdkaz_(token) {
  const url = zakladniAdresa_();
  return url ? url + '?r=' + encodeURIComponent(token) : '';
}

function platnyToken_(token) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(token || ''));
}

function klicRezervace_(token, dite, trida, hodina) {
  return [token, normalizuj_(dite), trida, hodina].join('|');
}

function normalizuj_(text) {
  return String(text || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('cs');
}

/** Ořízne text a zabrání tomu, aby ho Tabulky vzaly jako vzorec. */
function cistyText_(text, maxDelka) {
  const t = String(text || '').trim().replace(/\s+/g, ' ').slice(0, maxDelka);
  return /^[=+\-@]/.test(t) ? '\u2019' + t : t;
}

function cas_(hodnota) {
  if (hodnota instanceof Date) {
    return Utilities.formatDate(hodnota, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'HH:mm');
  }
  return String(hodnota).trim();
}

function porovnejTridy_(a, b) {
  return (parseInt(a, 10) - parseInt(b, 10)) || String(a).localeCompare(String(b), 'cs');
}

function esc_(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
