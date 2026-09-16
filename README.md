# 🛒 Neeraj General Store — Online Store

**"Apna Store, Swadeshi Aur Sasta!"**

A full-stack MERN (MongoDB, Express, React, Node.js) e-commerce app for Neeraj General Store, Jalalpur Panwara, Kannauj. Customers can browse groceries, daily essentials, electronics, mobile accessories, clothing, dairy and snacks, manage a cart, save addresses, and place orders via Cash on Delivery. Sellers/Admins can manage products and view all orders.

📞 Phone / WhatsApp: +91 99351 18811
📍 Jalalpur Panwara, Kannauj – 209727

---

## Features

### User
- Register & login using JWT & cookies
- Browse categories and products with offers
- Add/remove items in the cart
- Save delivery addresses
- Checkout with Cash on Delivery (Stripe online payment is wired up in the code but disabled by default at launch — see `server/controllers/orderController.js`)
- View order history

### Seller/Admin
- Secure login (email + password via environment vars)
- Add / edit / delete products (with images hosted on Cloudinary)
- View all customer orders with payment status

---

## Tech Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Frontend   | React + Vite, Tailwind CSS           |
| Backend    | Node.js, Express, JWT auth           |
| Database   | MongoDB Atlas with Mongoose ODM      |
| Storage    | Cloudinary for product images        |
| Payments   | Stripe Checkout & Webhooks (disabled by default; COD only at launch) |
| Hosting    | Vercel (frontend), Render (backend)  |

---

## License

This project is built on the open-source [GreenCart](https://github.com/antony-judu) template (MIT License, Copyright (c) 2025 Antony Judu), customized and rebranded for Neeraj General Store.

MIT License

Copyright (c) 2025 Antony Judu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
