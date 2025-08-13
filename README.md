# PartyFinder — MVP

MVP funcional para listar eventos, vender boletos con Stripe, generar QR y validar entradas.

## Requisitos
- Node.js 20+
- pnpm (o npm)
- Cuenta Supabase (DB + Auth opcional)
- Cuenta Stripe (test keys)

## Instalación
```bash
pnpm install
cp .env.example .env
# llena tus claves en .env
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

Abre http://localhost:3000

## Flujo
1. Crea eventos (POST /api/events) y tipos de boletos en DB.
2. Desde la página de detalle compra un boleto (Stripe Checkout).
3. Webhook Stripe crea tickets con secreto QR.
4. En puerta usa /app/scan (web) y valida con POST /api/checkin.
