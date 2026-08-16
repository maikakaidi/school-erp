# API-SCHOOL — Feuille de route (ROADMAP)

Ce document permet à n'importe quel·le développeur·se (même sans contexte) de **continuer**, **finir** ou **améliorer** le projet. Il décrit l'état actuel, les décisions d'architecture, les pièges connus et, priorité par priorité, la marche à suivre.

> Branche de travail : `master` (les travaux `feature/espace-parent` ont été fusionnés, commit `f12e7ad`)
> Dépôt racine : `C:\xampp8.2\htdocs\api.csp` (backend + frontend dans le même dépôt).

---

## 1. Vue d'ensemble

Application de gestion scolaire multi-tenant (SaaS) : chaque **école** a son espace, ses données sont isolées par `schoolId`. Deux espaces UI :

| Espace | Route | Auth |
|---|---|---|
| École (admin) | `/` et sous-routes (`/eleves`, `/absences`, `/annonces`…) | JWT `schoolId` |
| Parent | `/parent` et sous-routes | JWT `actorType='parent'`, `actorId`/`parentId` |
| Super Admin | `/super-admin` | JWT `superAdminId` |

---

## 2. Stack & architecture

### Backend — `backend-csp/`
- **Node.js (ESM)** + **Express 5** (module : `"type": "module"`).
- **Prisma 5.22** + PostgreSQL (base Neon : pooler `ep-wandering-math-aqkp9dm9-pooler…`).
- **JWT** (`jsonwebtoken`) : deux familles de tokens —
  - école/super-admin : payload `{ schoolId }` ou `{ superAdminId }` ;
  - acteurs métier : payload `{ schoolId, actorType, actorId, role }`.
- Validation **Zod** dans chaque module (`*.validation.js`).
- Middlewares dans `src/middlewares/` :
  - `auth.middleware.js` — vérifie le token ET revalide l'acteur en base (`parent` supporté ; `enseignant`/`eleve` à brancher). Construit `req.user = { schoolId, role, actorId, parentId? }`.
  - `school.middleware.js` (`requireSchool`), `parent.middleware.js` (`requireParent`), `checkSubscription.middleware.js` (abonnement actif).
- Organisation par **modules métier** : `src/modules/<domaine>/` avec `service.js`, `controller.js`, `routes.js`, `validation.js`. Montés dans `src/app.js` sous `/api/<domaine>`.
- Notifications : `src/modules/notifications/notifications.service.js` — **la seule source** de création (`createNotification`, `createNotificationsMany`).

### Frontend — `frontend-csp/`
- **React 18 + Vite** + `react-router-dom` + `react-i18next` (fr/en/ar).
- `lucide-react` **version 0.263.1** : les icônes très récentes (`UsersRound`…) n'existent **pas**. Remplacer par l'équivalent ancien (`UserCheck2`…).
- Thème sombre : constante `T` en haut de chaque page (`T.card`, `T.border`, `T.accent: '#d4921a'`, `T.muted`…).
- API : `src/api/fetchWithAuth.js` (fetch + token + cache offline + file d'attente hors-ligne). Pas d'`axios`.
- Espace parent : `ParentLayout` (`src/components/ParentLayout.jsx`) = barre supérieure + onglets horizontaux (pas de sidebar).
- **Les libellés de la Sidebar et de ParentLayout sont codés en dur en français** (l'i18n ne couvre que les sections). Les pages parent sont en français codé en dur également — convention actuelle, à améliorer progressivement.
- i18n : `src/locales/{fr,en,ar}.json`. Structure plate : `annonces.*`, `absences.*`, `parentAnnonces.*`, `parentNotifications.*`…

---

## 3. État d'avancement

| # | Priorité | Statut | Notes |
|---|---|---|---|
| 1 | Espace parent | ✅ Terminé | Login parent, `/api/parent/*`, pages parent, admin Parents |
| 2 | Absences & retards | ✅ Terminé | Table `absences`, `/api/absences` (CRUD + bulk + export), page admin, page parent |
| 3 | Notifications ciblées | ✅ Terminé | `Notification.recipientType/recipientId`, notifs parent (absence, annonce), endpoints parent |
| 4 | Annonces | ✅ Terminé | Table `annonces` + `annonce_reads`, `/api/annonces` (CRUD), génération de notifs parent, pages admin + parent |
| 5 | Espace enseignant | ✅ Terminé | Login prof, `/api/prof/*`, layout `EnseignantLayout`, pages (dashboard, notes, absences, emploi du temps) |
| 6 | Bulletins / reçus PDF | ✅ Terminé | Backend PDF + exports Excel/PDF des rapports |
| 7 | Emploi du temps | ✅ Terminé | `/api/horaires` (admin) + `/api/horaires/classe` + `/api/prof/emploi-du-temps` |
| 8 | Espace élève | ✅ Terminé | Login élève (matricule), `/api/eleve/*`, layout `EleveLayout` |
| 9 | Messagerie + rapports | ✅ Terminé | `Messages`/`MessagesInbox`/`Rapports`, badges non-lus, rapports assiduité + paiements |
| 10 | Durcissement prod — Phase A (sécurité) | ✅ Terminé | Mots de passe durcis, refresh tokens révocables (table `sessions`), rate limit super admin, audit log (`audit_logs`) |
| 10 | Durcissement prod — Phases B–D | ⏳ À faire | Voir §10 (clôture/export, offline, échelle) |

**Carte métier « acteurs » actuelle :** parent, enseignant et élève activés (`actorType` reconnu dans `auth.middleware.js`), super admin verrouillé sur `/super-admin`.

---

## 4. Lancer le projet localement

### Base de données (Neon — instable au premier appel)
Le pooler met du temps à « se réveiller » (cold start). Pour les commandes Prisma, forcer un timeout :

```powershell
# depuis backend-csp
$line = (Get-Content -LiteralPath ".env" | Select-String -Pattern '^DATABASE_URL="?([^"\r\n]+)' ).Matches[0].Groups[1].Value
$sep = if ($line -match '\?') { '&' } else { '?' }
$env:DATABASE_URL = "$line${sep}connect_timeout=30"
```

### Commandes utiles
```powershell
cd backend-csp
npx prisma validate                 # schéma OK ?
npx prisma migrate deploy           # applique les migrations (additives uniquement)
npx prisma generate                 # régénère le client (voir piège DLL ci-dessous)
node --test src/__tests__           # tests backend (Node test runner, sans Jest)
node src/server.js                  # démarre le backend (port 5000, sert aussi le frontend buildé)

cd frontend-csp
npm run build                       # build de prod (dist/)
npm run dev                         # dev serveur (port 3000) — nécessite VITE_API_URL
```

### Base d'essai (seed)
`prisma/seed.js` : école de test `690000000` / `Ecole123!` (CSP Molière), super admin `691234567` / `SuperAdmin123!`. Les deux comptes ont `mustChangePassword=true` → au premier login, l'UI force le changement de mot de passe (page `/change-password`). Un parent de test a été créé lors des vérifications : `Test E2E` — téléphone `699000001` / `parent123`.

---

## 5. Pièges & gotchas (IMPORTANT)

1. **`prisma generate` bloqué par le serveur** : le backend qui tourne (sur port 5000) verrouille le DLL du client Prisma (Windows). **Arrêter le serveur avant `prisma generate`, le relancer après.**
   ```powershell
   Get-NetTCPConnection -LocalPort 5000 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }
   Start-Process -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory "C:\xampp8.2\htdocs\api.csp\backend-csp" -WindowStyle Hidden
   ```
2. **`prisma migrate dev` refuse le mode non-interactif** (P1011/input). Utiliser : créer le dossier `prisma/migrations/<timestamp>_nom/migration.sql` à la main puis `prisma migrate deploy`. Pour générer le SQL : `npx prisma migrate diff --from-url $env:DATABASE_URL --to-schema-datamodel prisma/schema.prisma --script`.
3. **Migrations strictement additives** : jamais de `ALTER … DROP`, jamais de `UPDATE` destructif sur les données existantes. Multi-tenant : **toute nouvelle table porte `schoolId` + index sur `schoolId`**.
4. **Neon cold start** : un premier appel peut renvoyer `P1001 Can't reach database server`. Réessayer (retry), c'est normal.
5. **Dates** : stockées à **midi UTC** (`new Date(\`${date}T12:00:00.000Z\`)`) pour éviter les décalages de fuseau à l'affichage. Toujours suivre ce pattern pour une date « jour seulement ».
6. **`req.user` côté école** n'a PAS `schoolName` (seulement `schoolId` + `role`). Le nom d'école vient de `/api/settings` ou du payload login.
7. **Swagger** : les blocs `/** @swagger */` commentés devant les routes cassent la génération YAML s'ils sont trop verbeux — les routes du projet utilisent un format commentaire simple et sûr.
8. **CSP** (`helmet`) : `connect-src`/`img-src` limités à `self`, `data:`, `blob:`, `res.cloudinary.com`. Toute nouvelle source externe (CDN…) doit être ajoutée dans `src/app.js`.
9. **Icônes lucide** : vérifier l'existence de l'icône avant usage (version 0.263.1). En cas de doute, utiliser une icône connue (`Megaphone`, `Bell`, `CalendarX` existent).
10. **Tests** : Node test runner (`node:test`). Les tests touchent la vraie base (school findFirst) — ils ne sont pas isolés ; ne pas lancer en parallèle d'un autre processus qui manipule les notifications de la 1re école (le test `notifications` vérifie l'ordre par `createdAt desc`).

---

## 6. Comment ajouter une fonctionnalité (recette standard)

1. **Schéma** : modifier `backend-csp/prisma/schema.prisma` → `npx prisma validate` → créer la migration (voir §5.2) → `prisma migrate deploy` → arrêter serveur → `prisma generate` → relancer serveur.
2. **Module backend** : créer `src/modules/<nom>/{service,controller,routes,validation}.js` → monter dans `src/app.js` → protéger avec `authenticate` + `requireSchool` (école) ou `requireParent` (parent) + `checkSubscription`.
3. **Tests** : ajouter `src/__tests__/<nom>.test.js` (au minimum : exports des fonctions). `node --test src/__tests__`.
4. **Frontend admin** : page dans `frontend-csp/src/pages/<Nom>.jsx` → route dans `src/App.jsx` → entrée Sidebar `src/components/Sidebar.jsx` (libellé français codé en dur).
5. **Frontend parent** : page dans `src/pages/parent/<ParentNom>.jsx` → route dans `App.jsx` → onglet dans `ParentLayout.jsx`.
6. **i18n** : ajouter les clés dans `fr.json`, `en.json`, `ar.json` (conserver l'accentuation correcte en UTF-8).
7. **Vérifier** : `npm run build` (frontend), `node --test src/__tests__` (backend), test de bout en bout via API (voir §4 base d'essai).

---

## 7. Prochaines étapes détaillées

### 7.1 Priorité 5 — Espace enseignant
**Objectif** : l'enseignant se connecte, voit ses classes/matières, saisit notes, absences, consultables par le parent.

1. **Schéma** : actuellement `Enseignant` existe (`schoolId`, nom, tél, `matieres` ?). Vérifier `schema.prisma`. Ajouter si besoin : `login`, `password` (hash bcrypt), `isActive`. Table d'affectation `EnseignantClasse` (enseignant ↔ classe/matière) si absente.
2. **Auth** : dans `auth.middleware.js`, brancher `actorType === 'enseignant'` (charger l'enseignant, vérifier `isActive`, poser `req.user = { schoolId, actorType, actorId, enseignantId, role: 'enseignant' }`). Ajouter `POST /api/auth/login-enseignant` (téléphone école + tél/login enseignant + mot de passe) en copiant `loginParent`.
3. **Routes** : `src/modules/enseignants/` (module école déjà existant) ; côté acteur : `src/modules/prof/` ou ajouter des routes dans un module dédié : `GET /api/prof/me`, `/classes`, `/notes?classeId&matiereId`, `POST /api/prof/notes` (réutiliser la logique du module notes), `GET /api/prof/absences`, `POST /api/prof/absences` (réutiliser `absences.service`), `GET /api/prof/emploi-du-temps`.
4. **Frontend** : nouveau layout `EnseignantLayout` (copier `ParentLayout`), pages `EnseignantDashboard`, `EnseignantNotes`, `EnseignantAbsences`, `EnseignantEmploiDuTemps`. Routes `/enseignant/*` dans `App.jsx` (`user.actorType === 'enseignant'`). Ne PAS réutiliser la Sidebar école.
5. **Notification** : quand l'enseignant saisit une note → pas de notif ; quand il signale une absence → notifier les parents (le code `notifyParents` existe déjà dans `absences.service.js` — l'absence créée par l'enseignant notifiera automatiquement).

### 7.2 Priorité 6 — Bulletins / reçus PDF
- Le module `bulletins` backend existe déjà (`/api/bulletins`). Améliorer : génération PDF (bibliothèque à choisir — le projet n'en utilise pas encore ; `pdfkit` ou `puppeteer`). Vérifier le build Render (`render-build.sh`) avant d'ajouter une dépendance native.
- Reçus de paiement : route `GET /api/versements/:id/recu.pdf` (ou endpoint réutilisable) et bouton « Télécharger le reçu » dans `Versements.jsx` (admin) + `ParentPaiements.jsx`.
- Espace parent : ajouter le bulletin dans le dashboard (`getDashboard`) si un bulletin est publié.

### 7.3 Priorité 7 — Emploi du temps
- Le modèle `HoraireEnseignant` et la page admin `Horaires` existent. Brancher côté parent/élève : `GET /parent/emploi-du-temps?childId=` (utiliser `getChildOwned` + `inscription.classeId` → horaires de la classe), page `ParentEmploiDuTemps.jsx` + onglet.
- Modèle `Horaire` (par classe) si besoin en complément de `HoraireEnseignant`.

### 7.4 Priorité 8 — Espace élève
- Même recette que l'enseignant : JWT `actorType='eleve'` (login par matricule + mot de passe), `auth.middleware.js`, layout `EleveLayout`, pages (notes, absences, emploi du temps, annonces).
- Annonces : étendre `cible` (`eleve`, `classe` vue élève) et `AnnonceRead.readerType='eleve'`. Le service `buildParentWhere` peut servir de modèle pour un `buildEleveWhere`.

### 7.5 Priorité 9 — Messagerie + rapports
- Messagerie : table `Message` (schoolId, senderType/senderId, recipientType/recipientId, sujet, contenu, lu) + conversations. S'inspirer du pattern notifications (`recipientType`/`recipientId`).
- Rapports : exporter les statistiques existantes (`/api/statistiques`) en PDF/Excel ; ajouter des rapports (assiduité par classe, paiements en retard) réutilisant `absences.service` et `versements.service`.

### 7.6 Améliorations transverses
- **i18n complète** : sortir les libellés codés en dur (Sidebar, ParentLayout, pages parent) vers `locales/*.json`.
- **Notifications école → annonces** : la page admin Notifications affiche déjà les notifs ciblées ; ajouter un filtre `recipientType`.
- **Tests d'API de bout en bout** : script dans `backend-csp/scripts/` (le pattern du smoke test fait manuellement est dans les notes de la branche) utilisant la base d'essai.
- **Code splitting** : le bundle est à ~946 kB ; `React.lazy` sur les pages admin améliorera le premier chargement (avertissement Vite).

---

## 8. Conventions à respecter

- **Pas de commentaires dans le code** sauf nécessité (documentation, sections).
- ESM partout (`import`/`export`), nommage de fichiers en **anglais** pour la logique (sauf pages/UI françaises).
- Erreurs applicatives : `new Error('message')` + `error.status` (404/400/…), remontées via `next(error)` ; le gestionnaire central d'erreurs les transforme en JSON.
- Zéro librairie ajoutée sans vérification (certaines ne sont pas dans `package.json`).
- Multi-tenant : toujours scoper par `schoolId` (et l'id de l'acteur) dans les `where` Prisma.

---

## 9. État du dépôt

Travaux P1–P9 commités et poussés : `feature/espace-parent` fusionné sur `master` (commit `f12e7ad`, 86 fichiers, +5880/−304) → déploiement Render déclenché. Base Neon nettoyée (16 écoles de test supprimées, 7 écoles restantes), 10 migrations appliquées.

---

## 10. Priorités 10+ — Durcissement production (plan d'attaque)

Ordre recommandé : **Phase A (sécurité) → Phase B (clôture/export) → Phase C (offline) → Phase D (échelle).**

### Phase A — Sécurité ✅ Terminé (migration `20260816000000_add_security_hardening`)

| # | Point | Statut | Actions réalisées |
|---|---|---|---|
| A.1 | Mots de passe par défaut | ✅ | `seed.js` : `SuperAdmin123!` / `Ecole123!` + `mustChangePassword=true` (les comptes existants encore sous l'ancien mot de passe sont durcis au prochain seed). Politique min 8 car. + 1 maj. + 1 chiffre (`src/utils/passwordPolicy.js`) appliquée sur `register-school`, `reset-password` super admin et `change-password`. Login renvoie `mustChangePassword` ; le frontend force le passage par `/change-password` |
| A.2 | Refresh token révocable | ✅ | Table `sessions` (tokenId=jti, actorType, actorId, schoolId, expiresAt, revoked). Chaque login crée une session ; `/auth/refresh` fait la rotation (révoque l'ancien, émet le nouveau) ; `/auth/logout` révoque ; `/auth/change-password` révoque toutes les sessions de l'acteur. `fetchWithAuth` rejoue la requête après refresh |
| A.3 | Rate limit super admin | ✅ | `superAdminLimiter` (60 req / 15 min) sur `/api/super-admin/*` (en plus du global) |
| A.4 | Audit log | ✅ | Table `audit_logs` + `src/modules/audit/audit.service.js`. Traces : paiements (versements), dépenses (create/update/delete), suppression élève, actions super admin (activate/deactivate/renew/add-days/reset-password/delete school). Ne bloque jamais l'action métier |
| A.5 | Vérification finale | ✅ | `src/__tests__/security.test.js` + smoke E2E réel : login mdp durci, brute-force rejeté, refresh rotation, logout révocation, CORS origine inconnue → 403, accès inter-écoles scoped par `schoolId` |

### Phase B — Clôture d'année & archivage

| # | Point | Actions concrètes |
|---|---|---|
| B.1 | Clôture d'année scolaire | Module : crée la nouvelle année, copie classes/frais/coefficients, fige l'ancienne (lecture seule) |
| B.2 | Export annuel | Endpoint école + super admin : export complet JSON/CSV/Excel par année (élèves, notes, versements, absences, bulletins) |
| B.3 | Sauvegardes | Activer PITR/backups Neon (payant) ; vérifier que tous les uploads passent par Cloudinary en prod (le disque Render est éphémère) |
| B.4 | Rétention / RGPD | Suppression propre école (existe) + purge données élève sans casser les historiques archivés |
| B.5 | Supervision stockage | Écran super admin « Stockage par école » pour anticiper le remplissage (0,5 Go Neon free) |

### Phase C — Offline & synchronisation robuste

| # | Point | Actions concrètes |
|---|---|---|
| C.1 | Idempotence | `clientId` (UUID) généré par écriture offline, `@@unique` côté serveur → rejeu sans doublons |
| C.2 | Retry périodique | Retry toutes les ~60 s si file non vide + sync au chargement (au lieu du seul événement `online`) |
| C.3 | Cache de lecture durable | Remplacer le TTL 5 min par lecture IndexedDB en premier, rafraîchissement réseau ensuite, indicateur « données de X » |
| C.4 | État visible | Badge « X modifications en attente » par écran |
| C.5 | Scénarios testés | E2E : coupure réseau → saisies → reconnexion → 0 doublon, ordre respecté, conflits signalés |

### Phase D — Échelle & monitoring

| # | Point | Actions concrètes |
|---|---|---|
| D.1 | Passer en plan payant | Render always-on + RAM ≥ 1 Go ; Neon stockage ≥ 1 Go (au-delà de ~50–200 écoles actives/jour) |
| D.2 | Index & pagination | Vérifier les `findMany` gros : index `schoolId+anneeScolaire` (notes, versements, absences), pagination des listes admin |
| D.3 | Monitoring | Logs structurés + alertes sur le `/health` ; surveiller error rate |
| D.4 | (Phase 2) | Cache Redis pour stats/dashboards ; lecture réplicas Neon si montée en charge |
