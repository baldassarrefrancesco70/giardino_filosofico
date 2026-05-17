# Giardino Filosofico — Documentazione del progetto

**Liceo Classico G.B. Vico · Chieti**  
*Versione 1.0 — Maggio 2026*

---

## Cos'è

Un'applicazione web per la costruzione e la cura di giardini filosofici digitali. Ogni studente crea e collega note filosofiche nel proprio spazio personale; il docente può leggere tutti i giardini, lasciare annotazioni sulle singole note e feedback periodici sull'intero percorso dello studente.

La metafora dei **semi, germogli e piante** indica il grado di elaborazione di ogni nota — non il contenuto, ma la maturità del pensiero.

---

## Architettura

```
Browser (HTML + React + Babel)
        |
        | HTTPS
        v
Supabase (database + autenticazione)
        |
        | OAuth 2.0
        v
Google Workspace (account scolastici @convittogbvico.edu.it)
```

### Hosting

| Componente | Servizio | URL |
|---|---|---|
| App principale | GitHub Pages | `baldassarrefrancesco70.github.io/giardino_filosofico/` |
| Pagina pubblica giardino | GitHub Pages | `baldassarrefrancesco70.github.io/giardino_filosofico/public/` |
| Demo con dati mock | GitHub Pages | `baldassarrefrancesco70.github.io/giardino_filosofico/demo.html` |
| Database + Auth | Supabase | `qybeutztcvasdxkgqfss.supabase.co` |

### Repository GitHub

`github.com/baldassarrefrancesco70/giardino_filosofico`

```
giardino_filosofico/
├── index.html        ← app principale (login + vista studente + vista docente)
├── demo.html         ← versione demo con dati mock, nessun login richiesto
└── public/
    └── index.html    ← pagina pubblica per link condivisi del giardino
```

---

## Stack tecnologico

L'intera applicazione è contenuta in **file HTML standalone** — nessun processo di build, nessun Node.js, nessuna dipendenza da installare. Tutto viene caricato da CDN al momento dell'apertura del browser.

| Libreria | Versione | Scopo |
|---|---|---|
| React | 18.2.0 | Interfaccia utente |
| ReactDOM | 18.2.0 | Rendering |
| Babel Standalone | 7.23.2 | Trasformazione JSX nel browser |
| Supabase JS | 2.x | Database e autenticazione |

**Nota tecnica:** l'uso di Babel nel browser genera un avviso in console (`You are using the in-browser Babel transformer`). Non è un errore e non influenza il funzionamento. Per eliminarlo bisognerebbe pre-compilare il codice con un tool come Vite — operazione fattibile in futuro se necessario.

---

## Database (Supabase)

### Tabelle

**`student_profiles`** — un record per ogni studente
```
email               text PRIMARY KEY
display_name        text
classe              text  (3A | 3D | 4D)
garden_public_token text  (null = giardino privato)
created_at          date
```

**`notes`** — le note degli studenti
```
id                  text PRIMARY KEY
student_email       text → student_profiles.email
title               text
author              text
status              text  (seme | germoglio | pianta)
text                text
links               text[]  (array di id di altre note)
public_token        text  (non usato nella v1.0)
created_at          date
updated_at          date
```

**`note_feedback`** — annotazioni del docente su singola nota
```
id                  text PRIMARY KEY
note_id             text → notes.id
teacher_email       text
text                text
published           boolean  (false = bozza, true = visibile allo studente)
created_at          date
updated_at          date
```

**`garden_feedback`** — feedback periodici del docente sull'intero giardino
```
id                  text PRIMARY KEY
student_email       text → student_profiles.email
teacher_email       text
text                text
published           boolean  (false = bozza, true = visibile allo studente)
created_at          date
updated_at          date
```

### Sicurezza (Row Level Security)

Ogni tabella ha RLS abilitato. Le policy garantiscono:

- Uno **studente** legge e scrive solo i propri dati
- Uno **studente** vede i feedback solo se `published = true`
- Il **docente** (account con dominio `docente@convittogbvico.edu.it`) legge tutto, scrive solo nelle tabelle feedback
- Le **pagine pubbliche** leggono note e profili solo tramite token valido

Il riconoscimento del ruolo docente avviene tramite il suffisso dell'email: qualsiasi account `*.docente@convittogbvico.edu.it` accede alla vista docente.

---

## Autenticazione

**Provider:** Google OAuth 2.0  
**Restrizione dominio:** solo account `@convittogbvico.edu.it`  
**Flow:** implicit (configurato in Supabase)

### Configurazione Google Cloud Console

- **Progetto:** Gemini API (dominio `convittogbvico.edu.it`)
- **Client OAuth:** Giardino Filosofico (tipo Web)
- **URI di reindirizzamento autorizzati:**
  - `https://qybeutztcvasdxkgqfss.supabase.co/auth/v1/callback`
  - `https://baldassarrefrancesco70.github.io/giardino_filosofico/`
- **Schermata di consenso:** Interno (solo utenti del dominio)
- **Stato app in Google Admin Console:** Attendibile

### Primo accesso studente

Al primo login lo studente vede un form di benvenuto che chiede nome e classe. Il profilo viene creato automaticamente in `student_profiles`. Dal secondo accesso in poi entra direttamente nel suo giardino.

---

## Funzionalità

### Vista studente

- Crea, modifica ed elimina note con titolo, autore, stato e testo
- Connette note tra loro (grafo delle connessioni)
- Filtra le note per stato (seme / germoglio / pianta)
- Alterna tra vista lista e vista grafo (nodi trascinabili)
- Vede il feedback del docente sul giardino in cima alla pagina
- Vede le annotazioni del docente nelle singole note (solo se pubblicate)
- Esporta tutto il giardino in PDF o Markdown (.md)
- Esporta una singola nota in PDF o Markdown
- Genera un link pubblico per condividere l'intero giardino (sola lettura, senza login)

### Vista docente

- Vede tutti gli studenti raggruppati per classe (3A, 3D, 4D) con sezioni collassabili
- Accede al giardino di ogni studente in sola lettura
- Lascia annotazioni sulle singole note (bozza o pubblicata)
- Lascia feedback periodici sull'intero giardino (bozza o pubblicato)
- Il meccanismo bozza/pubblicazione permette di lavorare sull'annotazione prima che lo studente la veda

### Pagina pubblica

Accessibile tramite link con token, senza bisogno di account. Mostra lista e grafo del giardino in sola lettura. I feedback del docente non sono visibili nella pagina pubblica.

---

## Credenziali e configurazioni da conservare

> ⚠️ Conserva queste informazioni in un posto sicuro.

| Elemento | Dove trovarlo |
|---|---|
| Supabase Project ID | `qybeutztcvasdxkgqfss` |
| Supabase URL | `https://qybeutztcvasdxkgqfss.supabase.co` |
| Supabase Anon Key | Supabase → Settings → API Keys → Legacy anon |
| Google Client ID | Google Cloud Console → Credenziali → Giardino Filosofico |
| Google Client Secret | Stesso percorso (rigenerare se perso) |

---

## Operazioni di manutenzione

### Aggiungere o modificare una classe

Nel file `index.html` e `demo.html` la costante `CLASSI` definisce le classi disponibili:

```javascript
const CLASSI = ["3A", "3D", "4D"];
```

Modificare questo array e ricaricare il file su GitHub.

### Cambiare la classe di uno studente

Supabase → Table Editor → `student_profiles` → modifica il campo `classe` nella riga dello studente.

### Eliminare uno studente (fine anno / test)

Supabase → Table Editor → `student_profiles` → elimina la riga. Grazie al `ON DELETE CASCADE` tutte le note e i feedback associati vengono eliminati automaticamente.

### Aggiornare il codice

1. Modificare il file `giardino-filosofico.html` in locale
2. Caricarlo su GitHub come `index.html` tramite **upload diretto** (non incollare nell'editor web — causa problemi di encoding)
3. Attendere 1-2 minuti per la propagazione di GitHub Pages
4. Svuotare la cache del browser prima di testare

### Rigenerare il Client Secret Google

Se il login smette di funzionare con errore `invalid_client`:
1. Google Cloud Console → Credenziali → Giardino Filosofico → Aggiungi secret
2. Copiare il nuovo secret
3. Supabase → Authentication → Sign In / Providers → Google → aggiornare il campo Client Secret
4. Disattivare il vecchio secret su Google Cloud Console

---

## Possibili sviluppi futuri

- **Form di cambio classe:** permettere allo studente di aggiornare la propria classe direttamente dall'interfaccia, senza passare da Supabase
- **Storico dei feedback:** conservare e visualizzare tutti i feedback del docente nel tempo, non solo l'ultimo
- **Condivisione nota singola:** richiederebbe una pagina `note/index.html` analoga a `public/index.html`
- **Build ottimizzata:** eliminare Babel dal browser pre-compilando con Vite — riduce il tempo di caricamento iniziale
- **Commenti degli studenti sulle annotazioni:** possibilità di rispondere ai feedback del docente
- **Visibilità tra compagni:** opzione per rendere il proprio giardino visibile agli altri studenti della classe (da valutare pedagogicamente)

---

## Note pedagogiche

Il giardino filosofico è uno spazio di elaborazione personale. La metafora botanica è intenzionale: un seme non è una nota "sbagliata" o incompleta, ma il punto di partenza di un processo. L'interfaccia non esprime giudizi — il docente li esprime attraverso le annotazioni.

Il meccanismo bozza/pubblicazione nei feedback è pensato per dare al docente il tempo di calibrare il tono e il contenuto prima che lo studente lo legga. Non è un sistema di valutazione, ma uno strumento di orientamento.

La distinzione tra annotazione sulla nota e feedback sul giardino riflette due livelli di lettura pedagogica: il primo è puntuale e tecnico, il secondo è narrativo e orientativo.
