# PizzaHub Server

Backend REST API for PizzaHub built with Express.js, MongoDB, Better Auth, and Stripe.

## Features
- Role-based access control (Admin, Vendor, Customer)
- Secure JWT/token verification middleware
- Stripe Checkout & verified raw webhook handling
- Menu item management with free tier limits (max 3 items)
- Order lifecycle management (Pending, Accepted, Rejected, Cancelled)
- Admin user and menu moderation
