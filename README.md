# Evidencija prisustva zaposlenih

Veb aplikacija za evidenciju nastavnih aktivnosti na fakultetu.

---

## Opis projekta

Sistem omogućava profesorima i asistentima da evidentiraju održane nastavne aktivnosti, dok administratori upravljaju korisnicima i predmetima.

Aplikacija je razvijena kao full-stack rešenje korišćenjem modernih web tehnologija i Docker okruženja.

---

## Uloge u sistemu

### ADMIN
- Upravljanje korisnicima
- Dodela predmeta
- Pregled svih podataka

### PROFESSOR
- Evidentiranje predavanja i vežbi
- Pregled svojih aktivnosti

### ASSISTANT
- Evidentiranje vežbi
- Nema pravo evidentiranja predavanja

---

## Tehnologije

### Frontend
- Next.js (React)
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express
- TypeScript
- Drizzle ORM

### Baza
- PostgreSQL

### DevOps
- Docker
- Docker Compose
- Swagger

---

## Bezbednost

- JWT autentifikacija
- Role-based autorizacija
- Hashovanje lozinki (bcrypt)
- CORS zaštita

---

## Pokretanje projekta (Docker)

### Build i start

```bash
docker compose up --build

## Tehničke napomene

Aplikacija se sastoji iz tri Docker servisa:

- frontend (Next.js) – port 3000
- backend (Express API) – port 4000
- PostgreSQL baza – interni Docker servis

Svi servisi se pokreću komandom:

docker compose up --build

Nakon pokretanja, aplikacija je dostupna na:

Frontend:
http://localhost:3000

Backend API:
http://localhost:4000

Swagger dokumentacija:
http://localhost:4000/api-docs

## Baza podataka

Migracije se pokreću komandom:

docker compose exec backend npm run db:migrate

Popunjavanje baze test podacima (seed):

docker compose exec backend npm run db:seed
