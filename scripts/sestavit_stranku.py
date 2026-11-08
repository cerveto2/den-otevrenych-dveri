"""Sestaví samostatné stránky pro GitHub Pages z Index.html / Admin.html + Styles.html.

Adresa webové aplikace (…/exec) se bere z web.config.json.
Výstup: _site/index.html (rodiče) a _site/admin/index.html (administrace).
Spouští ho GitHub Action při každém pushi; lokálně: python3 scripts/sestavit_stranku.py
"""
import json
import os

KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def cti(nazev):
    with open(os.path.join(KOREN, nazev), encoding='utf-8') as f:
        return f.read()


api_url = json.loads(cti('web.config.json')).get('apiUrl', '').strip()


def sestav(zdroj, titulek, vystup):
    stranka = cti(zdroj)
    for puvodni, nove in [
        ("<?!= include('Styles'); ?>", cti('Styles.html')),
        ('  <base target="_top">\n', ''),
        ('<meta charset="utf-8">',
         '<meta charset="utf-8">\n'
         '  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
         '  <title>' + titulek + '</title>'),
        ("const API_URL = '';", 'const API_URL = ' + json.dumps(api_url) + ';'),
    ]:
        if stranka.count(puvodni) != 1:
            raise SystemExit('V ' + zdroj + ' chybí očekávaný text: ' + puvodni[:60])
        stranka = stranka.replace(puvodni, nove)
    cesta = os.path.join(KOREN, '_site', vystup)
    os.makedirs(os.path.dirname(cesta), exist_ok=True)
    with open(cesta, 'w', encoding='utf-8') as f:
        f.write(stranka)
    print('Sestaveno: _site/' + vystup + ('' if api_url else ' (POZOR: chybí apiUrl ve web.config.json)'))


sestav('Index.html', 'Den otevřených dveří – rezervace', 'index.html')
sestav('Admin.html', 'Den otevřených dveří – administrace', 'admin/index.html')
