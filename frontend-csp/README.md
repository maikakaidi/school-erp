# API-SCHOOL — Application Web de Gestion Scolaire

SaaS multi-ecoles pour la gestion scolaire. Backend Node.js/Express/Prisma/PostgreSQL, Frontend React/Vite.

---

## Modules

| Module | Statut |
|--------|--------|
| Tableau de bord | Disponible |
| Eleves | Disponible |
| Inscriptions | Disponible |
| Notes & Devoirs | Disponible |
| Bulletins (PDF) | Disponible |
| Versements (3 tranches) | Disponible |
| Frais scolaires | Disponible |
| Examens blancs | Disponible |
| Enseignants | Disponible |
| Horaires | Disponible |
| Salaires | Disponible |
| Parametres | Disponible |
| Super Admin | Disponible |
| Depenses | En cours |
| Statistiques | En cours |

---

## Installation

### Backend

```bash
cd api-school-backend
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

### Frontend

```bash
cd api-school-frontend
npm install
npm run dev
```

Frontend sur **http://localhost:3000**, Backend sur **http://localhost:5000**.

## Super Admin par defaut

- Telephone: 691234567
- Mot de passe: SuperAdmin123

## API Docs

`http://localhost:5000/api-docs`
