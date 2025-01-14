# RAITA-järjestelmän käyttöohje

## RAITA järjestelmän yleiskuvaus

RAITA on Väyläviraston suunnittelema koneellisen radantarkastuksen raporttien hakuun tehty tietojärjestelmä ja hakutyökalu. Järjestelmä sisältää radantarkastuksessa syntyneitä raportteja, jotka on tallennettu raporttien mukana tulevien metatietojen kanssa.

Raportteja voidaan hakea kaikkien metatietojen avulla ja löytyneitä raportteja voidaan tarkastella sekä yksittäin ja raportit voidaan myös ladata yhteiseksi ZIP-tiedostoksi.

Järjestelmä on aktiivisessa kehitysvaiheessa ja uusia päivityksiä tulee kuukausittain.

## Käytön aloittaminen

Raporttien haku kannattaa aloittaa antamalla vain yksi tai kaksi hakukriteeriä pudotusvalikoiden takana oleviin kohtiin. Silloin saat listaukseen esimerkin siitä, minkälaisia tiedostoja ja mitä metatietoja raportteihin löytyy. Tämän jälkeen hakua on helppoa tarkentaa. Hakutoiminnon suoritettuasi voit järjestää tulokset tarkastusajankohdan tai ratakilometrin mukaan.

Käyttö kannattaa aloittaa kokeilevasti "yritä ja onnistu" -menetelmällä.

## Tarjolla olevat hakutoiminnot

### Pudotusvalikot

Pudotusvalikoista löytyy suodattimet

- Tarkastusajankohdan perusteella
- Sisällön osalta
  - Voit etsiä raportteja joko raporttityyppien tai raportointijärjestelmien avulla.
- Mittauspaikan perusteella (Raportointiosuudet ja tilirataosanumerot)
  - Raportointiosuudet ovat lyhenteitä, esim KOKYV on väli Kokkola Ylivieska.
  - Raportointiosuuksien tulkinta vaatii toistaiseksi lyhenteiden tuntemista, selkokieliset kuvaukset ovat kehitysjonossa
  - Voit hakea myös tilirataosan perusteella.
- Tiedostotyypin perusteella
  - Txt- ja pdf -muotoiset raportit ovat välillä samansisältöisiä
  - csv -tiedostot sisältävät tarkkaa mittausdataa

### Haku tiedostonimellä

Tiedostonimellä haku toimii siten, että listaukseen palautetaan kaikki tiedostonimet, jotka sisältävät hakutekstin. Esimerkiksi hakutermi "CW_Kilometriyhteenveto" palauttaa kaikki raportit, joiden nimessä on kyseinen teksti

### Tarkat hakukentät

Hakua on mahdollista tehdä myös kaikilla metatiedoilla. Raporteista löytyvät metatiedot toimivat hakuavaimina ja vertailu on mahdollista seuraavilla vertailutyökaluilla.

Hakuavaimet ovat tavallisesti tyyppiä tarkka osuma. Esimerkiksi järjestelmän nimi pitää kirjoittaa tarkasti, jotta hakutuloksia saadaan.

Numeroarvoille ja päivämäärille on tarjolla haku alku- ja loppupisteen mukaan. Näille hakuavaimille ilmeistyy näkyviin pudotusvalikko josta voi valita joko >= (suurempi tai yhtä suuri kuin) tai <= (pienempi tai yhtäsuuri kuin).

Hakuun voi asettaa arvon sekä alkupisteelle että loppupisteelle lisäämällä saman hakuavaimen kahteen kertaan.

Paras tapa selvittää hakukriteerien toimintoja on tehdä ensin yleisempi haku, jonka jälkeen on mahdollista tarkentaa hakua täsmällisemmillä hakukriteereillä.

### Mittausdatan hakeminen

Hakua on mahdollista rajata valitsemalla järjestelmät, raportointiosuudet ja tilirataosanumerot vasemman laidan valikosta. Jos käyttäjä ei valitse mitään näytetään kaikki järjestelmät, raportointiosuudet ja tilirataosanumerot.
Painamalla "Hae"-nappia aukeaa valikko, jossa voi suodattaa tuloksia, valita sarakkeet sekä raportit.
Painamalla "Hae mittausrivien määrä"-nappia ohjelma kerää datan ja antaa arvion tiedoston kokoluokasta.
Painamalla "Generoi CSV-tiedosto"-nappia ohjelma luo tiedoston latausvalmiiksi.
Luodun tiedoston voi ladata painamalla oikean yläkulman valkoista "Lataa ZIP"-nappia

## Käyttöoikeusasiat, ongelmat ja kehitysehdotukset

Kehitysehdotuksiin, käyttöoikeusasioihin ja ongelmatilanteisiin liittyen ole yhteydessä raide@vayla.fi
