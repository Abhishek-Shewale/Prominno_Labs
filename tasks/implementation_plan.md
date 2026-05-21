# Node.js REST API — Implementation Plan
> Reference UI: https://reactinterviewtask.codetentaclestechnologies.in/

---

## 📌 Project Overview

Build a RESTful API backend using **Node.js + Express.js + MongoDB (Mongoose)** that supports:
- An **Admin** who can log in, create Sellers, and list Sellers.
- A **Seller** who can log in, manage their own Products (add / list / delete), and generate a **PDF** for each product.

---

## 🗂️ Project Structure

```
Prominno_Labs/
├── tasks/
│   └── implementation_plan.md        ← you are here
├── src/
│   ├── config/
│   │   └── db.js                     ← MongoDB connection
│   ├── middlewares/
│   │   ├── auth.middleware.js         ← JWT verification + role guard
│   │   └── validate.middleware.js     ← Joi/express-validator wrapper
│   ├── models/
│   │   ├── Admin.model.js
│   │   ├── Seller.model.js
│   │   └── Product.model.js
│   ├── controllers/
│   │   ├── admin/
│   │   │   ├── auth.controller.js    ← Admin login
│   │   │   └── seller.controller.js  ← Create seller, List sellers
│   │   └── seller/
│   │       ├── auth.controller.js    ← Seller login
│   │       └── product.controller.js ← Add / List / Delete / PDF
│   ├── routes/
│   │   ├── admin.routes.js
│   │   └── seller.routes.js
│   ├── utils/
│   │   ├── jwt.util.js               ← sign / verify helpers
│   │   ├── hash.util.js              ← bcrypt helpers
│   │   ├── response.util.js          ← standard API response wrapper
│   │   └── pdf.util.js               ← PDF generation (pdfkit / puppeteer)
│   └── app.js                        ← Express app setup
├── .env
├── .gitignore
├── package.json
└── server.js                         ← Entry point
```

---

## 🛠️ Tech Stack

| Layer | Library / Tool |
|---|---|
| Runtime | Node.js (v18+) |
| Framework | Express.js |
| Database | MongoDB via Mongoose |
| Auth | JSON Web Tokens (`jsonwebtoken`) |
| Password hashing | `bcryptjs` |
| Validation | `joi` |
| File uploads (brand images) | `multer` + local storage or Cloudinary |
| PDF generation | `pdfkit` (lightweight, no headless browser needed) |
| Environment | `dotenv` |
| Dev tools | `nodemon`, `morgan` |

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "express": "^4.18",
    "mongoose": "^8.x",
    "bcryptjs": "^2.4",
    "jsonwebtoken": "^9.x",
    "joi": "^17.x",
    "multer": "^1.4",
    "pdfkit": "^0.15",
    "dotenv": "^16.x",
    "morgan": "^1.10",
    "cors": "^2.8"
  },
  "devDependencies": {
    "nodemon": "^3.x"
  }
}
```

---

## 🔐 Authentication Strategy

- Both **Admin** and **Seller** use **JWT Bearer tokens**.
- Token payload: `{ id, role }` where role is `"admin"` or `"seller"`.
- Token expiry: `7d` (configurable via `.env`).
- Middleware checks `Authorization: Bearer <token>` header, verifies the token, and attaches `req.user` to the request.
- Role-based guard: `requireRole("admin")` / `requireRole("seller")`.

---

## 🗄️ Data Models

### Admin (`admins` collection)
```
{
  _id        : ObjectId
  name       : String (required)
  email      : String (required, unique, lowercase)
  password   : String (hashed, required)
  role       : String (default: "admin")
  createdAt  : Date
  updatedAt  : Date
}
```
> A **seed script** (`npm run seed`) will create the default admin on first run.

### Seller (`sellers` collection)
```
{
  _id        : ObjectId
  name       : String (required)
  email      : String (required, unique, lowercase)
  mobileNo   : String (required, 10 digits)
  country    : String (required)
  state      : String (required)
  skills     : [String] (required, min 1)
  password   : String (hashed, required)
  role       : String (default: "seller")
  createdAt  : Date
  updatedAt  : Date
}
```

### Product (`products` collection)
```
{
  _id          : ObjectId
  sellerId     : ObjectId (ref: "Seller", required)
  productName  : String (required)
  description  : String (required)
  brands       : [
    {
      brandName : String (required)
      detail    : String (required)
      image     : String (file path / URL, required)
      price     : Number (required, min 0)
    }
  ]
  createdAt    : Date
  updatedAt    : Date
}
```

---

## 🔌 API Endpoints

### Admin Routes — prefix `/api/admin`

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| 1 | POST | `/login` | ❌ Public | Admin login → returns JWT + role |
| 2 | POST | `/sellers` | ✅ Admin JWT | Create a new seller |
| 3 | GET | `/sellers?page=1&limit=10` | ✅ Admin JWT | Paginated list of all sellers |

### Seller Routes — prefix `/api/seller`

| # | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| 1 | POST | `/login` | ❌ Public | Seller login → returns JWT + role |
| 2 | POST | `/products` | ✅ Seller JWT | Add product (with brand images via multipart) |
| 3 | GET | `/products?page=1&limit=10` | ✅ Seller JWT | Paginated list of own products |
| 4 | GET | `/products/:id/pdf` | ✅ Seller JWT | Stream PDF for a product |
| 5 | DELETE | `/products/:id` | ✅ Seller JWT | Delete own product |

---

## 📋 Detailed API Specifications

### 1. POST `/api/admin/login`
**Request Body:**
```json
{ "email": "admin@example.com", "password": "Admin@123" }
```
**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "<JWT>",
    "role": "admin"
  }
}
```
**Errors:** 400 (validation), 401 (invalid credentials), 500 (server error)

---

### 2. POST `/api/admin/sellers`
**Headers:** `Authorization: Bearer <admin_token>`
**Request Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobileNo": "9876543210",
  "country": "India",
  "state": "Maharashtra",
  "skills": ["React", "Node.js"],
  "password": "Seller@123"
}
```
**Success Response (201):**
```json
{
  "success": true,
  "message": "Seller created successfully",
  "data": { /* seller object (password excluded) */ }
}
```
**Errors:** 400 (validation), 401 (missing/invalid token), 403 (not admin), 409 (email already exists)

---

### 3. GET `/api/admin/sellers?page=1&limit=10`
**Headers:** `Authorization: Bearer <admin_token>`
**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "sellers": [ /* array of seller objects */ ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

### 4. POST `/api/seller/login`
**Request Body:**
```json
{ "email": "john@example.com", "password": "Seller@123" }
```
**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "<JWT>",
    "role": "seller"
  }
}
```

---

### 5. POST `/api/seller/products`
**Headers:** `Authorization: Bearer <seller_token>`
**Content-Type:** `multipart/form-data`
**Fields:**
```
productName        : "Mouse"
description        : "Test description"
brands[0][brandName] : "Dell"
brands[0][detail]    : "Test"
brands[0][image]     : <file>
brands[0][price]     : 1000
brands[1][brandName] : "HP"
brands[1][detail]    : "Test"
brands[1][image]     : <file>
brands[1][price]     : 2000
```
**Success Response (201):**
```json
{
  "success": true,
  "message": "Product added successfully",
  "data": { /* product object */ }
}
```
**Errors:** 400 (validation), 401, 403

---

### 6. GET `/api/seller/products?page=1&limit=10`
**Headers:** `Authorization: Bearer <seller_token>`
**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "...",
        "productName": "Mouse",
        "description": "Test",
        "brands": [
          { "brandName": "Dell", "detail": "Test", "image": "/uploads/...", "price": 1000 },
          { "brandName": "HP",   "detail": "Test", "image": "/uploads/...", "price": 2000 }
        ],
        "pdfUrl": "/api/seller/products/<id>/pdf"
      }
    ],
    "pagination": { "total": 5, "page": 1, "limit": 10, "totalPages": 1 }
  }
}
```

---

### 7. GET `/api/seller/products/:id/pdf`
**Headers:** `Authorization: Bearer <seller_token>`
**Response:** Binary PDF stream (`Content-Type: application/pdf`)
**PDF Content:**
- Product Name (heading)
- Product Description
- Table per brand: Brand Name | Brand Image | Price
- **Total Price** = sum of all brand prices

**Errors:** 401, 403 (not their product), 404 (product not found)

---

### 8. DELETE `/api/seller/products/:id`
**Headers:** `Authorization: Bearer <seller_token>`
**Success Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```
**Errors:** 401, 403 (not their product), 404

---

## ✅ Validation Rules

### Admin Login
| Field | Rule |
|---|---|
| email | required, valid email |
| password | required, min 6 chars |

### Create Seller
| Field | Rule |
|---|---|
| name | required, string, min 2 |
| email | required, valid email, unique |
| mobileNo | required, 10 digits |
| country | required, string |
| state | required, string |
| skills | required, array, min 1 item |
| password | required, min 8 chars |

### Add Product
| Field | Rule |
|---|---|
| productName | required, string, min 2 |
| description | required, string |
| brands | required, array, min 1 item |
| brands[].brandName | required, string |
| brands[].detail | required, string |
| brands[].image | required, valid file (jpg/png/webp, max 5 MB) |
| brands[].price | required, number, min 0 |

---

## ⚠️ Exception Handling

All errors follow this standard envelope:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [ /* field-level details if validation error */ ]
}
```

| Scenario | HTTP Code |
|---|---|
| Validation failure | 400 |
| Invalid credentials | 401 |
| Missing / expired JWT | 401 |
| Insufficient role | 403 |
| Resource not found | 404 |
| Email already exists | 409 |
| Internal server error | 500 |

A global Express error-handling middleware will catch all unhandled errors and ensure no stack traces are leaked in production.

---

## 🔑 Environment Variables (`.env`)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/prominno_labs
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
NODE_ENV=development
```

---

## 🌱 Seed Script

`npm run seed` will:
1. Connect to MongoDB.
2. Check if an admin already exists.
3. If not, insert a default admin:
   - Email: `admin@prominno.com`
   - Password: `Admin@123` (hashed)

---

## 📂 Implementation Task Checklist

### Phase 0 — Project Bootstrap
- [ ] `npm init -y`
- [ ] Install all dependencies
- [ ] Setup `server.js`, `src/app.js`, `.env`, `.gitignore`
- [ ] Setup MongoDB connection (`src/config/db.js`)
- [ ] Setup global response util and error handler

### Phase 1 — Models
- [ ] `Admin.model.js`
- [ ] `Seller.model.js`
- [ ] `Product.model.js`

### Phase 2 — Utilities
- [ ] JWT sign/verify (`jwt.util.js`)
- [ ] Bcrypt hash/compare (`hash.util.js`)
- [ ] Standard API response wrapper (`response.util.js`)
- [ ] PDF generator (`pdf.util.js`)

### Phase 3 — Middleware
- [ ] Auth middleware (verify JWT, attach `req.user`)
- [ ] Role guard middleware (`requireRole`)
- [ ] Multer config for image uploads

### Phase 4 — Admin APIs
- [ ] Admin login controller + route
- [ ] Create seller controller + route (with validation)
- [ ] List sellers controller + route (with pagination)

### Phase 5 — Seller APIs
- [ ] Seller login controller + route
- [ ] Add product controller + route (multipart, with validation)
- [ ] List products controller + route (pagination, own products only)
- [ ] View PDF controller + route
- [ ] Delete product controller + route

### Phase 6 — Seed & Testing
- [ ] Write seed script for default admin
- [ ] Test all endpoints with Postman / curl
- [ ] Verify PDF output

### Phase 7 — Git & Delivery
- [ ] Initialize git repo: `git init`
- [ ] Add `.gitignore` (exclude `node_modules`, `.env`, `uploads/`)
- [ ] Initial commit with all source code
- [ ] Push to GitHub and share repo link

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Seed default admin
npm run seed

# Start development server
npm run dev

# Server runs at http://localhost:5000
```

---

## 📬 Postman Collection Structure (for testing)

```
Prominno Labs API
├── Admin
│   ├── Login
│   ├── Create Seller
│   └── List Sellers
└── Seller
    ├── Login
    ├── Add Product
    ├── List Products
    ├── View Product PDF
    └── Delete Product
```

---

*Plan created: 2026-05-21*
