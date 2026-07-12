# VállorCalc – Telepítési útmutató

## Fly.io + Neon PostgreSQL

### 1. Előkészítés
```bash
npm install -g flyctl
fly auth login
```

### 2. Neon adatbázis
- Menj ide: https://neon.tech
- Hozz létre egy projektet (pl. `vallorcalc`)
- Másold a connection string-et (postgresql://...)

### 3. Fly.io alkalmazás létrehozása
```bash
fly apps create vallorcalc
```

### 4. Titkok beállítása
```bash
fly secrets set DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"
fly secrets set NEXTAUTH_SECRET="$(openssl rand -base64 32)"
fly secrets set NEXTAUTH_URL="https://vallorcalc.fly.dev"
```

### 5. Adatbázis inicializálása
```bash
# Lokálisan, Neon connection string-gel:
DATABASE_URL="postgresql://..." npx prisma db push
DATABASE_URL="postgresql://..." npm run db:seed
```

### 6. Deploy
```bash
fly deploy
```

### 7. Első belépés
- URL: https://vallorcalc.fly.dev
- Email: admin@vallor.ro
- Jelszó: Admin1234!

**FONTOS: Első belépés után azonnal változtasd meg a jelszót!**

## Frissítés
```bash
fly deploy
```

## Adatbázis migrálás (ha séma változott)
```bash
fly ssh console -C "npx prisma db push"
```
