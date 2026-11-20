# 🍹 IdzemeVypic

Slovenská multiplayerová party hra pre skupinu priateľov (Mobile-First PWA). Hráči sa pripájajú do lobby cez 5-znakový kód alebo QR kód a hrajú rýchle minihry priamo zo svojich mobilných telefónov v domácej Wi-Fi sieti.

Dizajn a atmosféra sú inšpirované **Miami Sunset / Vice City / GTA VI** (sýte neóny, gradienty purpurová → magenta → horúca ružová → oranžová → zlatá, tyrkysové akcenty, glassmorphism a synthwave siluety).

---

## ⚡ Rýchly štart (výhradne lokálne)

### Požiadavky
- **Node.js 18+** a **npm**
- (Voliteľne) **Docker** pre kontajnerové spustenie

### Inštalácia a spustenie

```bash
# 1. Klonovanie / otvorenie priečinka
cd c:\Users\samue\Desktop\NextRound

# 2. Inštalácia závislostí
npm install

# 3. Inicializácia databázy a kontrola otázok
npm run seed

# 4. Spustenie vývojového servera
npm run dev
```

Po spustení server počúva na `0.0.0.0:3000`, automaticky zistí tvoju lokálnu IP adresu v domácej sieti (napr. `http://192.168.1.50:3000`) a priamo do terminálu vykreslí **QR kód**, ktorý stačí naskenovať fotoaparátom mobilu!

---

## 📱 Ako hrať na viacerých telefónoch v domácej Wi-Fi

1. Uisti sa, že tvoj počítač aj mobilné telefóny sú pripojené na **rovnakú domácu Wi-Fi sieť**.
2. Na počítači spusti `npm run dev`.
3. V termináli uvidíš IP adresu v tvare:
   ```
   📡 Sieť: http://192.168.x.x:3000
   ```
4. Na prvom mobile (hostiteľ) naskenuj QR kód z terminálu alebo zadaj túto URL adresu do prehliadača (Chrome / Safari).
5. Klikni na **„Vytvoriť lobby"**, zadaj svoju prezývku a vyber si avatar.
6. Na obrazovke lobby sa zobrazí 5-znakový kód a tlačidlo s QR kódom lobby. Ostatní priatelia sa pripoja zadaním kódu na domovskej stránke alebo naskenovaním QR kódu z displeja hostiteľa.
7. (Voliteľné) Ak máš k dispozícii televízor alebo veľký monitor, otvor `http://localhost:3000/tv/[KOD]`, kde beží **TV režim** s veľkým QR kódom a reálnym stavom hry.

### 🛡️ Dôležitá poznámka k firewallu (Windows Defender / macOS)
Ak sa telefóny nevedia spojiť so serverom na počítači, Windows Firewall často blokuje prichádzajúce spojenia na porte 3000.

**Riešenie pre Windows (spustiť v PowerShell ako Administrátor):**
```powershell
New-NetFirewallRule -DisplayName "IdzemeVypic Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**Riešenie pre macOS:**
V *System Settings -> Network -> Firewall* povoľ prichádzajúce spojenia pre Node.js.

---

## 🎮 4 Herné módy (MVP)

### 1. Čo by si radšej? (Would You Rather)
- Server predloží dve možnosti (Možnosť A vs Možnosť B).
- Každý hráč tajne hlasuje za svoju preferenciu (časový limit 20 s).
- **Bonusový tip:** Každý hráč tipuje, ktorú možnosť si zvolí celá väčšina.
- Po uzavretí sa zobrazí dynamický porovnávací graf hlasov.
- **Bodovanie:** Hráč, ktorý správne tipne voľbu väčšiny, získava **+100 bodov** (pri remíze 50/50 získavajú body všetci tipujúci).

### 2. Podvodník (The Impostor / Spy)
- Všetci hráči dostanú tajné slovenské slovo okrem jedného náhodného podvodníka.
- Každý hráč napíše krátku nápovedu (max 50 znakov) v limite 60 s.
- Následne prebieha hlasovanie o tom, kto je podvodník (limit 30 s).
- Podvodník má 20 s na to, aby sa pokúsil tajné slovo uhádnuť.
- **Bodovanie:**
  - Odhalenie podvodníka: **+150 bodov** pre každého hráča, ktorý hlasoval za podvodníka.
  - Podvodník uhádol slovo: **+200 bodov** pre podvodníka.
  - Podvodník nebol odhalený a uhádol slovo: **+300 bodov**.
  - Remíza pri hlasovaní: Podvodník unikol, hráči dostávajú 0 b.

### 3. Kto by najskôr...? (Most Likely To)
- Zobrazí sa otázka zo zásobníka **500 originálnych slovenských otázok**.
- Každý hráč tajne hlasuje za jedného iného hráča v lobby (za seba hlasovať nemôže).
- Časový limit: 20 sekúnd.
- **Bodovanie & Tituly:**
  - Hráč s najviac hlasmi získava **Titul kola („Najväčší kandidát")**. Pri remíze je udelený spoločný titul.
  - Všetci hráči, ktorí hlasovali v zhode s víťaznou väčšinou, získavajú **+50 bodov**.

### 4. Mesto-štát-rieka (Scattergories)
- Server náhodne vyžrebuje povolené písmeno (s vynechaním nepraktických znakov ako Ď, Ľ, Ň, Ô, Ť, Ž, Ä, Ó, Q, W, X, Y, Ch).
- 6 kategórií: Mesto, Štát, Zviera, Meno, Vec, Jedlo / Nápoj.
- Časový limit 60 s alebo kým prvý hráč neklikne **„STOP! Mám hotovo"** (spustí 10 s odpočet pre ostatných).
- Porovnávanie odpovedí prebieha **inteligentne bez ohľadu na diakritiku a veľkosť písmen** („Žilina“ = „zilina“ = „ŽILINA“).
- **Bodovanie:**
  - Unikátna správna odpoveď (nikto iný ju nemá): **+100 bodov**.
  - Zdieľaná správna odpoveď (má ju aspoň jeden ďalší hráč): **+50 bodov**.
  - Prázdna odpoveď alebo nesprávne počiatočné písmeno: **0 bodov**.

---

## 🏆 XP a Leveling systém
- Každý získaný bod = **1 XP**.
- Výpočet levelu: $\text{Level} = \lfloor\sqrt{\text{XP} / 100}\rfloor$.
- Lokálny leaderboard ukladá hráčov a ich štatistiky (výhry, odohrané hry, win rate) do lokálnej SQLite databázy.

---

## 🔞 Režim 18+ a Obsahové módy
- **Mierne (😇):** Každodenný život, škola, práca, cestovanie, jedlo, trapasy bez pikantností.
- **Mix (🍹 - Predvolené):** Vyvážený mix zábavných spoločenských a párty otázok.
- **Odvážne (🔞):** Párty a alkoholové trapasy, vzťahy, flirt, intímne otázky a pikantné situácie.
- Pri prvom spustení aplikácia zobrazí modálne overenie veku 18+ (uložené v `localStorage`).

---

## 🧪 Testovanie herných pravidiel

Aplikácia obsahuje sadu unit testov pre pravidlá a bodovanie:

```bash
npm test
```

Testy overujú:
1. Odstraňovanie slovenskej diakritiky a normalizáciu textu.
2. Správne slovenské plurály (1 hráč / 2-4 hráči / 5+ hráčov).
3. Sanitizáciu prezývok a ochranu proti XSS.
4. Filtrovanie nevhodných a zakázaných prezývok.
5. Bodovanie a predikciu pre *Čo by si radšej?*.
6. Bodovanie, odhalenie podvodníka a hádanie slova v *Podvodníkovi*.
7. Väčšinový bonus a udelenie titulu v *Kto by najskôr...?*.
8. Porovnanie unikátnych a zdieľaných odpovedí v *Mesto-štát-rieka*.

---

## 🐳 Spustenie cez Docker (voliteľné)

```bash
# Zostavenie a spustenie kontajnera
docker compose up -d

# Zastavenie
docker compose down
```

---

## 📋 Rozhodnutia, ktoré som urobil sám

1. **Použitie `tsx` pre beh `server.js`:** Next.js vlastný Socket.IO server potrebuje importovať TypeScript moduly v `src/server/`, preto `tsx` zabezpečuje okamžitý a bezproblémový beh bez zdĺhavej manuálnej predkompilácie.
2. **Web Audio API syntetizátor tónov:** Pre zvuky tlačidiel, odpočítavania a víťazstva som použil čisté Web Audio API oscilátory namiesto ťažkých externých MP3/WAV súborov, čo zrýchľuje načítanie na mobiloch na 0 ms.
3. **Pomer otázok v „Kto by najskôr...?":** Pripravil som presne 500 originálnych otázok rozdelených na 150 miernych (30 %) a 350 odvážnych (70 %) s autentickými slovenskými reáliami.
4. **Viac ako 150 otázok pre ostatné hry:** Pre „Čo by si radšej?" som vytvoril 155 otázok a pre „Podvodníka" 150 slov/konceptov s nápovedami.
5. **Bodovanie remízy v Podvodníkovi:** Pri rovnosti hlasov sa podvodník považuje za neodhaleného (hráči získavajú 0 b), čo motivuje k jasnej dohode a diskusii.
6. **Bonus v „Čo by si radšej?":** Hráči pred hlasovaním tipujú voľbu väčšiny za +100 bodov, čo robí hru omnoho dynamickejšou a súťaživejšou.
7. **Skrátenie odpočtu pri STOP v Mesto-štát-rieka:** Keď hráč klikne STOP, ostatní majú 10 sekúnd na dopísanie, čím sa predchádza okamžitému zmareniu rozpracovaných odpovedí.
8. **Generovanie QR kódu cez interný API endpoint `/api/qr`:** Využíva natívnu knižnicu `qrcode` a vracia PNG vo farbách Vice City (hot pink na tmavomodrom pozadí), takže nevyžaduje externé internetové API.
9. **Dvojité vysielanie do Socket miestností:** Udalosti sa posielajú do miestnosti `code` aj `lobby:code`, aby bola zaručená spätná kompatibilita pre všetky klientske komponenty.
10. **8-miestny Sync kód:** Generuje sa bez znakov náchylných na zámenu (vynechané `0`, `O`, `1`, `I`) pre bezchybné prepísanie medzi mobilmi.
