# PizzaHub — Server REST API (Assignment 9 - Category: 009)

Role-Based Backend API for the PizzaHub Pizza Ordering & Delivery Platform.

## 🚀 Live Site & Repositories
- **Live Server URL**: `https://pizzahub-server.onrender.com` (or deployment URL)
- **Live Client Application**: `https://pizzahub-client.vercel.app` (or deployment URL)
- **Client GitHub Repository**: [https://github.com/nipun-roy/pizzahub-client](https://github.com/nipun-roy/pizzahub-client)
- **Server GitHub Repository**: [https://github.com/nipun-roy/pizzahub-server](https://github.com/nipun-roy/pizzahub-server)

## 👤 Admin Credentials (Live Site)
- **Admin Email**: `admin@pizzahub.com`
- **Admin Password**: `Admin@123456`

---

## 🛠️ Technology Stack
- **Runtime**: Node.js v20+ / TypeScript
- **Framework**: Express.js (`express: ^4.21.2`)
- **Database**: MongoDB Atlas (`mongodb: ^6.13.0`)
- **Authentication**: JWT token verification (`jsonwebtoken: ^9.0.2`), Better Auth compatible
- **Payments**: Stripe Checkout & Webhooks SDK (`stripe: ^17.6.0`)
- **Security & Config**: CORS (`cors: ^2.8.5`), Dotenv (`dotenv: ^16.4.7`)
- **Development**: `ts-node-dev`, `typescript`, `@types/express`, `@types/node`

---

## 🔑 Environment Variables
Create a `.env` file in the root directory modeled after `.env.example`:

| Variable Name | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `CLIENT_URL` | Frontend URL for CORS & redirects | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `DB_NAME` | Database name | `pizzahub` |
| `JWT_SECRET` | Secret key for signing and verifying JWTs | `your_secret_key` |
| `BETTER_AUTH_SECRET` | Secret key for Better Auth integration | `your_auth_secret` |
| `STRIPE_SECRET_KEY` | Stripe secret key for backend sessions | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET`| Stripe webhook signing secret | `whsec_...` |
| `INITIAL_ADMIN_EMAIL` | Default seed admin email | `admin@pizzahub.com` |
| `INITIAL_ADMIN_PASSWORD`| Default seed admin password | `Admin@123456` |

> ⚠️ **Note**: `.env` is strictly ignored by Git and will never be pushed to GitHub.

---

## 📦 Database Design (Strict 4 Business Collections)

1. **`users`**:
   - `_id`, `name`, `email`, `image`, `role` (`customer` | `vendor` | `admin`), `isBlocked`, `businessName` (vendor only), `subscriptionPlan` (`free` | `premium`), `createdAt`, `updatedAt`.
2. **`menuItems`**:
   - `_id`, `vendorId` (ref: users), `itemName`, `category`, `description`, `price`, `location`, `images`, `status` (`pending` | `approved` | `rejected` | `inactive`), `isFeatured`, `createdAt`, `updatedAt`.
3. **`orders`**:
   - `_id`, `itemId` (ref: menuItems), `vendorId` (ref: users), `customerId` (ref: users), `deliveryDate`, `deliveryAddress`, `message`, `status` (`pending` | `accepted` | `rejected` | `cancelled`), `createdAt`, `updatedAt`.
4. **`transactions`**:
   - `_id`, `vendorId` (ref: users), `plan`, `amount`, `currency`, `stripeSessionId`, `status` (`completed`), `createdAt`.

---

## 🏆 Challenge Requirements Implementation Notes

### 1. Advanced Search, Filtering, and Sorting Flow
Implemented in `GET /api/menu`:
- **Query Parameters**:
  - `search`: Case-insensitive regex match against `itemName`.
  - `category`: Exact match against category enum (Classic Pizzas, Vegetarian Pizzas, Meat Lovers, etc.).
  - `location`: Case-insensitive regex filter for restaurant area/city.
  - `sort`: `price_asc` (sorts by price: 1) or `price_desc` (sorts by price: -1).
- Only items where `status === 'approved'` are returned publicly.

### 2. JWT Verification and Role Middleware
Implemented in `src/middlewares/auth.ts` and `src/middlewares/role.ts`:
- Token is extracted from the `Authorization: Bearer <token>` header.
- Token is verified against `JWT_SECRET`. If invalid or expired, a `401 Unauthorized` response is returned.
- A fresh database query verifies that the user still exists and that `user.isBlocked !== true`. If blocked, a `403 Forbidden` response is returned immediately.
- `authorizeRoles('admin' | 'vendor' | 'customer')` verifies server-side privileges on every single protected API.

### 3. Stripe Raw Webhook Signature Verification
Implemented in `src/controllers/subscription.controller.ts`:
- Mounted using `express.raw({ type: 'application/json' })` before the global `express.json()` parser.
- Cryptographically verifies `stripe-signature` using `stripe.webhooks.constructEvent(req.body, sig, webhookSecret)`.
- Listens for `checkout.session.completed` and safely unlocks `subscriptionPlan: 'premium'` for the vendor while logging the payment in the `transactions` collection.

---

## 💻 How to Run Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nipun-roy/pizzahub-server.git
   cd pizzahub-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Fill in your MONGODB_URI and Stripe keys
   ```

4. **Seed database data**:
   ```bash
   # Seed complete sample data (Admin, Vendors, Customers, 20 Menu Items, Orders, Transactions)
   npm run seed

   # Or seed only the initial Admin account:
   npm run seed:admin
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```
