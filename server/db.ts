import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { Product, StoreSettings, Order, Banner } from "../src/types";

// Hostinger & Standard MySQL Database Configuration
const DB_HOST = process.env.MYSQL_HOST || process.env.DB_HOST;
const DB_PORT = parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || "3306", 10);
const DB_NAME = process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.MYSQL_DB || process.env.DB_DATABASE;
const DB_USER = process.env.MYSQL_USER || process.env.DB_USER || process.env.MYSQL_USERNAME;
const DB_PASSWORD = process.env.MYSQL_PASSWORD ?? process.env.DB_PASSWORD ?? process.env.MYSQL_PASS ?? "";
const DATABASE_URL = process.env.DATABASE_URL || process.env.MYSQL_URL;

let pool: mysql.Pool | null = null;
// Only attempt MySQL connection if real remote credentials or connection string are supplied
const isMySQLConfigured = !!(
  DATABASE_URL ||
  (DB_HOST && DB_USER && DB_NAME && DB_HOST !== "127.0.0.1" && DB_HOST !== "localhost") ||
  (process.env.ENABLE_LOCAL_MYSQL === "true" && DB_HOST && DB_USER && DB_NAME)
);

// Local JSON File Fallback configuration
// Using /tmp since container filesystems (like Cloud Run) are read-only and /tmp is a writable RAM disk.
const DATA_DIR = path.join("/tmp", "ngs_data");
const DB_FILE = path.join(DATA_DIR, "store_db.json");

// Connect / Check MySQL
export async function initializeDatabase() {
  if (!isMySQLConfigured) {
    console.log("ℹ️  Running on high-performance local JSON storage engine.");
    console.info("💡 To connect Hostinger MySQL: Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE in your environment.");
    ensureLocalDirectory();
    return false;
  }

  // Determine SSL settings
  // Remote hosting like Hostinger often supports or requires SSL, or standard TCP.
  const isRemoteHost = DB_HOST && (DB_HOST.includes("hstgr.io") || DB_HOST.includes("hosting") || DB_HOST.includes("."));
  const useSSL = process.env.MYSQL_SSL === "true" || (process.env.MYSQL_SSL !== "false" && isRemoteHost && !DB_HOST?.includes("localhost") && !DB_HOST?.includes("127.0.0.1"));

  const poolConfig: mysql.PoolOptions = DATABASE_URL
    ? {
        uri: DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeout: 20000,
        ssl: useSSL ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeout: 20000,
        ssl: useSSL ? { rejectUnauthorized: false } : undefined,
      };

  try {
    pool = mysql.createPool(poolConfig);

    // Verify connection and run table migrations
    const connection = await pool.getConnection();
    console.log(`🚀 Successfully connected to MySQL database on ${DB_HOST || 'DATABASE_URL'} (${DB_NAME || ''})!`);
    await runMigrations(connection);
    connection.release();
    return true;
  } catch (error: any) {
    console.warn("⚠️  Remote MySQL connection attempt failed:", error?.message || error);
    
    // If SSL was enabled and failed, try cleartext fallback
    if (useSSL) {
      try {
        const cleartextConfig = { ...poolConfig, ssl: undefined };
        pool = mysql.createPool(cleartextConfig);
        const connection = await pool.getConnection();
        console.log(`🚀 Successfully connected to MySQL (Standard TCP) on ${DB_HOST || 'DATABASE_URL'}!`);
        await runMigrations(connection);
        connection.release();
        return true;
      } catch (fallbackErr: any) {
        console.warn("ℹ️  Operating on durable local storage engine. Remote MySQL is unreachable.");
      }
    } else {
      console.warn("ℹ️  Operating on durable local storage engine. Remote MySQL is unreachable.");
    }

    pool = null;
    ensureLocalDirectory();
    return false;
  }
}

function ensureLocalDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// RUN MIGRATIONS
async function runMigrations(conn: mysql.PoolConnection) {
  console.log("🛠️  Initiating SQL Migration Script...");
  
  const queries = [
    `CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(128) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      hindiName VARCHAR(255),
      category VARCHAR(100) NOT NULL,
      price INT NOT NULL,
      originalPrice INT,
      unit VARCHAR(50) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      imageUrl TEXT,
      description TEXT,
      isPopular TINYINT(1) DEFAULT 0,
      isAvailable TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(50) PRIMARY KEY,
      customerName VARCHAR(255) NOT NULL,
      customerPhone VARCHAR(20) NOT NULL,
      customerAddress TEXT NOT NULL,
      customerEmail VARCHAR(255) DEFAULT NULL,
      paymentMethod VARCHAR(20) NOT NULL,
      subtotal INT NOT NULL,
      deliveryFee INT NOT NULL,
      total INT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(50) NOT NULL,
      productId VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      price INT NOT NULL,
      unit VARCHAR(50) NOT NULL,
      quantity INT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS banners (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(255),
      imageUrl TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE
    )`,
    `CREATE TABLE IF NOT EXISTS inventory (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id VARCHAR(50) NOT NULL,
      quantity INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS store_settings (
      id INT PRIMARY KEY DEFAULT 1,
      storeName VARCHAR(255) NOT NULL,
      tagline VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      pincode VARCHAR(10) NOT NULL,
      deliveryFee INT NOT NULL,
      freeDeliveryThreshold INT NOT NULL,
      announcement TEXT,
      upiId VARCHAR(255) NOT NULL,
      owners JSON
    )`
  ];

  for (const q of queries) {
    await conn.query(q);
  }

  // Attempt to add owners column if it doesn't exist (MySQL 8+ compatible)
  try {
     await conn.query("ALTER TABLE store_settings ADD COLUMN owners JSON");
  } catch (e) {
     // Ignore, likely already exists
  }


  // Insert default values if tables are empty
  const [admins] = await conn.query("SELECT COUNT(*) as count FROM admins");
  if ((admins as any)[0].count === 0) {
    await conn.query("INSERT INTO admins (email) VALUES (?)", ["dubeyavinash157@gmail.com"]);
  }

  try {
    await conn.query("ALTER TABLE orders ADD COLUMN customerEmail VARCHAR(255) DEFAULT NULL");
  } catch(e) {
    // ignore
  }

  const [settings] = await conn.query("SELECT COUNT(*) as count FROM store_settings");
  if ((settings as any)[0].count === 0) {
    await conn.query(`
      INSERT INTO store_settings (id, storeName, tagline, address, pincode, deliveryFee, freeDeliveryThreshold, announcement, upiId)
      VALUES (1, 'Neeraj General Store & Hypermarket', 'Apna Store, Swadeshi Aur Sasta! Low Prices Everyday.', 'Awadh Market, Jalalpur Panwara, Kannauj', '209727', 30, 500, '🎉 Grand Scheme Offer: Free Delivery in Jalalpur Panwara and adjacent areas for orders above ₹500!', 'store@upi')
    `);
  }

  const fallbackData = loadLocalDatabase();
  for (const p of fallbackData.products) {
    await conn.query(`
      INSERT IGNORE INTO products (id, name, hindiName, category, price, originalPrice, unit, stock, imageUrl, description, isPopular, isAvailable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [p.id, p.name, p.hindiName || null, p.category, p.price, p.originalPrice || null, p.unit, p.stock, p.imageUrl, p.description, p.isPopular ? 1 : 0, p.isAvailable ? 1 : 0]);
  }

  const [bns] = await conn.query("SELECT COUNT(*) as count FROM banners");
  if ((bns as any)[0].count === 0) {
    for (const b of fallbackData.banners) {
      await conn.query(`
        INSERT IGNORE INTO banners (id, title, subtitle, imageUrl)
        VALUES (?, ?, ?, ?)
      `, [b.id, b.title, b.subtitle || null, b.imageUrl]);
    }
  }

  console.log("✅ SQL Migrations complete!");
}

// LOCAL DATABASE LOAD / SAVE (Fallback Engine)
const defaultData = {
  products: [
    {
      id: "p_1",
      name: "Aashirvaad Shudh Chakki Atta",
      hindiName: "आशीर्वाद शुद्ध चक्की आटा",
      category: "Atta, Rice & Dal",
      price: 260,
      originalPrice: 285,
      unit: "5 kg",
      stock: 45,
      imageUrl: "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&w=400&q=80",
      description: "Premium quality whole wheat flour.",
      isPopular: true,
      isAvailable: true
    },
    {
      id: "p_2",
      name: "Fortune Kachi Ghani Mustard Oil",
      hindiName: "फॉर्च्यून कच्ची घानी सरसों का तेल",
      category: "Masala, Oil & More",
      price: 155,
      originalPrice: 175,
      unit: "1 litre",
      stock: 30,
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80",
      description: "Cold-pressed pure mustard oil from finest seeds.",
      isPopular: true,
      isAvailable: true
    },
    {
      id: "p_3",
      name: "Amul Taaza Homogenised Toned Milk",
      hindiName: "अमूल ताज़ा टोन्ड दूध",
      category: "Dairy & Breakfast",
      price: 68,
      originalPrice: 72,
      unit: "1 litre",
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80",
      description: "UHT treated homogenised toned milk.",
      isPopular: true,
      isAvailable: true
    },
    {
      id: "p_4",
      name: "Tata Salt Vacuum Evaporated",
      hindiName: "टाटा नमक",
      category: "Masala, Oil & More",
      price: 26,
      originalPrice: 28,
      unit: "1 kg",
      stock: 100,
      imageUrl: "https://images.unsplash.com/photo-1627483292120-d459021204d1?auto=format&fit=crop&w=400&q=80",
      description: "Iodised vacuum evaporated salt.",
      isPopular: true,
      isAvailable: true
    },
    {
      id: "p_5",
      name: "Fresh Potatoes",
      hindiName: "ताजा आलू",
      category: "Fruits & Vegetables",
      price: 30,
      originalPrice: 35,
      unit: "1 kg",
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1518977822588-444458f4a081?auto=format&fit=crop&w=400&q=80",
      description: "Farm fresh potatoes.",
      isPopular: true,
      isAvailable: true
    },
    {
      id: "p_6",
      name: "Fresh Onions",
      hindiName: "ताजा प्याज",
      category: "Fruits & Vegetables",
      price: 40,
      originalPrice: 50,
      unit: "1 kg",
      stock: 60,
      imageUrl: "https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?auto=format&fit=crop&w=400&q=80",
      description: "Crisp and fresh onions.",
      isPopular: true,
      isAvailable: true
    },
    {
      id: "p_7",
      name: "Haldiram's Bhujia Sev",
      hindiName: "हल्दीराम भुजिया सेव",
      category: "Snacks & Munchies",
      price: 110,
      originalPrice: 120,
      unit: "400 g",
      stock: 25,
      imageUrl: "https://images.unsplash.com/photo-1600171804245-16a8d7950c44?auto=format&fit=crop&w=400&q=80",
      description: "Classic Indian mildly spiced namkeen.",
      isPopular: true,
      isAvailable: true
    },
    {
      id: "p_8",
      name: "Coca Cola Soft Drink",
      hindiName: "कोका कोला",
      category: "Cold Drinks & Juices",
      price: 40,
      originalPrice: 45,
      unit: "750 ml",
      stock: 80,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80",
      description: "Refreshing cola cold drink.",
      isPopular: true,
      isAvailable: true
    },
    {
      id: "p_9",
      name: "Britannia Good Day Cashew Cookies",
      hindiName: "ब्रिटानिया गुड डे काजू कुकीज़",
      category: "Bakery & Biscuits",
      price: 35,
      originalPrice: 40,
      unit: "200 g",
      stock: 40,
      imageUrl: "https://images.unsplash.com/photo-1599818828987-195972589578?auto=format&fit=crop&w=400&q=80",
      description: "Butter cashew cookies.",
      isPopular: true,
      isAvailable: true
    },
    {
      id: "p_10",
      name: "Colgate MaxFresh Toothpaste",
      hindiName: "कोलगेट मैक्सफ्रेश",
      category: "Personal Care",
      price: 95,
      originalPrice: 105,
      unit: "150 g",
      stock: 30,
      imageUrl: "https://images.unsplash.com/photo-1559598467-f8b76c8155d0?auto=format&fit=crop&w=400&q=80",
      description: "Cooling crystals toothpaste.",
      isPopular: false,
      isAvailable: true
    },
    {
      id: "p_11",
      name: "Surf Excel Easy Wash Detergent",
      hindiName: "सर्फ एक्सेल ईजी वॉश",
      category: "Cleaning Essentials",
      price: 125,
      originalPrice: 135,
      unit: "1 kg",
      stock: 20,
      imageUrl: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80",
      description: "Washing powder.",
      isPopular: false,
      isAvailable: true
    },
    {
      id: "p_12",
      name: "Godrej Aer Pocket",
      hindiName: "गोदरेज एयर पॉकेट",
      category: "Home & Needs",
      price: 55,
      originalPrice: 60,
      unit: "10 g",
      stock: 15,
      imageUrl: "https://images.unsplash.com/photo-1618331326442-f288ce6ab624?auto=format&fit=crop&w=400&q=80",
      description: "Bathroom room freshener.",
      isPopular: false,
      isAvailable: true
    },
    // ELECTRONICS CATEGORY
    {
      id: "p_13",
      name: "Fast USB-C 20W Quick Charger & Cable",
      hindiName: "फास्ट 20W टाइप-C चार्जर व केबल",
      category: "Electronics",
      price: 299,
      originalPrice: 499,
      unit: "1 Set",
      stock: 35,
      imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80",
      description: "High speed 20W fast wall charger with durable braided Type-C cable.",
      isPopular: true,
      isAvailable: true
    },
    {
      id: "p_14",
      name: "Wireless Bluetooth Stereo Earbuds with Mic",
      hindiName: "वायरलेस ब्लूटूथ ईयरबड्स",
      category: "Electronics",
      price: 499,
      originalPrice: 899,
      unit: "1 Pair",
      stock: 25,
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80",
      description: "Crystal clear bass sound with 24-hour battery life & ENC mic.",
      isPopular: true,
      isAvailable: true
    },
    {
      id: "p_15",
      name: "10000mAh Ultra-Slim Fast Power Bank",
      hindiName: "10000mAh पोर्टेबल पावर बैंक",
      category: "Electronics",
      price: 749,
      originalPrice: 1299,
      unit: "1 Unit",
      stock: 20,
      imageUrl: "https://images.unsplash.com/photo-1609592424368-2895ea325601?auto=format&fit=crop&w=400&q=80",
      description: "Dual USB output with 22.5W fast charging and LED charge indicator.",
      isPopular: false,
      isAvailable: true
    },
    {
      id: "p_16",
      name: "9W Smart LED Bulb Multi-Color B22",
      hindiName: "9W स्मार्ट एलईडी बल्ब",
      category: "Electronics",
      price: 199,
      originalPrice: 299,
      unit: "1 pc",
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1550985543-f47f38aeee65?auto=format&fit=crop&w=400&q=80",
      description: "Energy saving bright smart LED bulb with standard B22 base.",
      isPopular: false,
      isAvailable: true
    },
    {
      id: "p_17",
      name: "4-Socket Heavy Duty Surge Extension Board",
      hindiName: "4-सॉकेट एक्सटेंशन बोर्ड",
      category: "Electronics",
      price: 349,
      originalPrice: 499,
      unit: "1 pc",
      stock: 18,
      imageUrl: "https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=400&q=80",
      description: "Overload surge protection with master switch and 2-meter long cord.",
      isPopular: false,
      isAvailable: true
    },
    // CLOTHING CATEGORY
    {
      id: "p_18",
      name: "Men's Premium Pure Cotton Round Neck T-Shirt",
      hindiName: "मेंस कॉटन राउंड नेक टी-शर्ट",
      category: "Clothing",
      price: 299,
      originalPrice: 499,
      unit: "1 pc (L / XL)",
      stock: 40,
      imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80",
      description: "100% breathable combed cotton fabric, soft on skin, color-fast.",
      isPopular: true,
      isAvailable: true
    },
    {
      id: "p_19",
      name: "Women's Pure Cotton Printed Straight Kurti",
      hindiName: "महिला कॉटन प्रिंटेड कुर्ती",
      category: "Clothing",
      price: 449,
      originalPrice: 799,
      unit: "1 pc (M / L / XL)",
      stock: 30,
      imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80",
      description: "Elegant traditional printed cotton daily & office wear kurti.",
      isPopular: true,
      isAvailable: true
    },
    {
      id: "p_20",
      name: "Men's Casual Stretchable Denim Jeans",
      hindiName: "मेंस स्ट्रेचेबल डेनिम जींस",
      category: "Clothing",
      price: 699,
      originalPrice: 1199,
      unit: "1 pc (32 / 34 / 36)",
      stock: 25,
      imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=400&q=80",
      description: "Comfortable regular fit stretchable denim jeans for all-day comfort.",
      isPopular: false,
      isAvailable: true
    },
    {
      id: "p_21",
      name: "Luxury 500 GSM 100% Cotton Bath Towel",
      hindiName: "प्रीमियम कॉटन बाथ टॉवल",
      category: "Clothing",
      price: 249,
      originalPrice: 399,
      unit: "1 pc (70x140 cm)",
      stock: 45,
      imageUrl: "https://images.unsplash.com/photo-1616627547584-bf28cee262db?auto=format&fit=crop&w=400&q=80",
      description: "Super absorbent soft micro-cotton large bath towel.",
      isPopular: false,
      isAvailable: true
    },
    {
      id: "p_22",
      name: "Men's Combed Cotton Ankle Socks (Pack of 3)",
      hindiName: "कॉटन मोजे (3 का पैक)",
      category: "Clothing",
      price: 149,
      originalPrice: 249,
      unit: "3 Pairs",
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=400&q=80",
      description: "Anti-odor breathable cushioning ankle length socks pack.",
      isPopular: false,
      isAvailable: true
    }
  ],
  settings: {
    storeName: "Neeraj General Store & Hypermarket",
    tagline: "Apna Store, Swadeshi Aur Sasta! Low Prices Everyday.",
    address: "Awadh Market, Jalalpur Panwara, Kannauj",
    pincode: "209727",
    owners: [
      { name: "Neeraj Kumar Dubey", phone: "9876543210" },
      { name: "Dheeraj Kumar Dubey", phone: "9876543211" }
    ],
    deliveryFee: 30,
    freeDeliveryThreshold: 500,
    announcement: "🎉 Grand Scheme Offer: Free Delivery in Jalalpur Panwara and adjacent areas for orders above ₹500!",
    upiId: "store@upi"
  },
  orders: [],
  admins: [
    { id: 1, email: "dubeyavinash157@gmail.com" }
  ],
  banners: [
    {
      id: "b_1",
      title: "Super Saver Deals",
      subtitle: "Up to 50% OFF on daily essentials",
      imageUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80"
    }
  ]
};

function loadLocalDatabase(): any {
  try {
    ensureLocalDirectory();
    if (!fs.existsSync(DB_FILE)) {
      saveLocalDatabase(defaultData);
      return defaultData;
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw);
    
    // Auto-heal: If the file was created in an older version or manually emptied, seed with default catalog
    if (!parsed.products || parsed.products.length === 0) {
      console.log("Empty catalog detected in JSON. Seeding with default dataset...");
      parsed.products = defaultData.products;
      if (!parsed.banners || parsed.banners.length === 0) {
        parsed.banners = defaultData.banners;
      }
      if (!parsed.admins) {
        parsed.admins = defaultData.admins;
      }
      saveLocalDatabase(parsed);
    } else {
      // Check if new categories (Electronics/Clothing) are missing, merge them without duplicating
      const existingIds = new Set(parsed.products.map((p: any) => p.id));
      let hasUpdates = false;
      for (const defProd of defaultData.products) {
        if (!existingIds.has(defProd.id)) {
          parsed.products.push(defProd);
          hasUpdates = true;
        }
      }
      if (hasUpdates) {
        saveLocalDatabase(parsed);
      }
    }
    
    return parsed;
  } catch (error) {
    console.error("Local database load failed", error);
    return { products: [], settings: {}, orders: [], banners: [] };
  }
}

function saveLocalDatabase(data: any) {
  try {
    ensureLocalDirectory();
    const tempFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (e) {
    console.error("Local database save failed", e);
  }
}

// ==========================================
// CRUD EXPOSED SERVICES (Unified Interface)
// ==========================================

// PRODUCTS
export async function getProducts(): Promise<Product[]> {
  if (pool) {
    const [rows] = await pool.query("SELECT * FROM products");
    return (rows as any[]).map(r => ({
      id: r.id,
      name: r.name,
      hindiName: r.hindiName || undefined,
      category: r.category,
      price: Number(r.price),
      originalPrice: r.originalPrice ? Number(r.originalPrice) : undefined,
      unit: r.unit,
      stock: Number(r.stock),
      imageUrl: r.imageUrl,
      description: r.description,
      isPopular: !!r.isPopular,
      isAvailable: !!r.isAvailable
    }));
  } else {
    return loadLocalDatabase().products;
  }
}

export async function createProduct(p: Product): Promise<Product> {
  if (pool) {
    await pool.query(`
      INSERT INTO products (id, name, hindiName, category, price, originalPrice, unit, stock, imageUrl, description, isPopular, isAvailable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [p.id, p.name, p.hindiName || null, p.category, p.price, p.originalPrice || null, p.unit, p.stock, p.imageUrl, p.description, p.isPopular ? 1 : 0, p.isAvailable ? 1 : 0]);
    return p;
  } else {
    const db = loadLocalDatabase();
    db.products.push(p);
    saveLocalDatabase(db);
    return p;
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  if (pool) {
    const [existing] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
    if ((existing as any[]).length === 0) return null;

    const current = (existing as any[])[0];
    const name = updates.name !== undefined ? updates.name : current.name;
    const hindiName = updates.hindiName !== undefined ? updates.hindiName : current.hindiName;
    const category = updates.category !== undefined ? updates.category : current.category;
    const price = updates.price !== undefined ? updates.price : current.price;
    const originalPrice = updates.originalPrice !== undefined ? updates.originalPrice : current.originalPrice;
    const unit = updates.unit !== undefined ? updates.unit : current.unit;
    const stock = updates.stock !== undefined ? updates.stock : current.stock;
    const imageUrl = updates.imageUrl !== undefined ? updates.imageUrl : current.imageUrl;
    const description = updates.description !== undefined ? updates.description : current.description;
    const isPopular = updates.isPopular !== undefined ? (updates.isPopular ? 1 : 0) : current.isPopular;
    const isAvailable = updates.isAvailable !== undefined ? (updates.isAvailable ? 1 : 0) : current.isAvailable;

    await pool.query(`
      UPDATE products 
      SET name = ?, hindiName = ?, category = ?, price = ?, originalPrice = ?, unit = ?, stock = ?, imageUrl = ?, description = ?, isPopular = ?, isAvailable = ?
      WHERE id = ?
    `, [name, hindiName, category, price, originalPrice, unit, stock, imageUrl, description, isPopular, isAvailable, id]);

    return {
      id,
      name,
      hindiName: hindiName || undefined,
      category,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      unit,
      stock: Number(stock),
      imageUrl,
      description,
      isPopular: !!isPopular,
      isAvailable: !!isAvailable
    };
  } else {
    const db = loadLocalDatabase();
    const index = db.products.findIndex((p: Product) => p.id === id);
    if (index !== -1) {
      db.products[index] = { ...db.products[index], ...updates };
      saveLocalDatabase(db);
      return db.products[index];
    }
    return null;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (pool) {
    const [res] = await pool.query("DELETE FROM products WHERE id = ?", [id]);
    return (res as any).affectedRows > 0;
  } else {
    const db = loadLocalDatabase();
    const initialLen = db.products.length;
    db.products = db.products.filter((p: Product) => p.id !== id);
    if (db.products.length < initialLen) {
      saveLocalDatabase(db);
      return true;
    }
    return false;
  }
}

// SETTINGS
export async function getSettings(): Promise<StoreSettings> {
  if (pool) {
    const [rows] = await pool.query("SELECT * FROM store_settings WHERE id = 1");
    if ((rows as any[]).length > 0) {
      const r = (rows as any[])[0];
      let ownersValue = r.owners;
      if (typeof ownersValue === "string") {
         try { ownersValue = JSON.parse(ownersValue); } catch(e) {}
      }
      return {
        storeName: r.storeName,
        tagline: r.tagline,
        address: r.address,
        pincode: r.pincode,
        owners: Array.isArray(ownersValue) ? ownersValue : [
          { name: "Neeraj Kumar Dubey", phone: "9876543210" },
          { name: "Dheeraj Kumar Dubey", phone: "9876543211" }
        ],
        deliveryFee: Number(r.deliveryFee),
        freeDeliveryThreshold: Number(r.freeDeliveryThreshold),
        announcement: r.announcement,
        upiId: r.upiId
      };
    }
  }
  return loadLocalDatabase().settings;
}

export async function updateSettings(s: StoreSettings): Promise<StoreSettings> {
  if (pool) {
    await pool.query(`
      UPDATE store_settings 
      SET storeName = ?, tagline = ?, address = ?, pincode = ?, deliveryFee = ?, freeDeliveryThreshold = ?, announcement = ?, upiId = ?, owners = ?
      WHERE id = 1
    `, [s.storeName, s.tagline, s.address, s.pincode, s.deliveryFee, s.freeDeliveryThreshold, s.announcement, s.upiId, JSON.stringify(s.owners)]);
    return s;
  } else {
    const db = loadLocalDatabase();
    db.settings = s;
    saveLocalDatabase(db);
    return s;
  }
}

// BANNERS
export async function getBanners(): Promise<Banner[]> {
  if (pool) {
    const [rows] = await pool.query("SELECT * FROM banners");
    return (rows as any[]).map(r => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle || undefined,
      imageUrl: r.imageUrl
    }));
  } else {
    return loadLocalDatabase().banners;
  }
}

export async function updateBanners(bns: Banner[]): Promise<Banner[]> {
  if (pool) {
    await pool.query("DELETE FROM banners");
    for (const b of bns) {
      await pool.query(`
        INSERT INTO banners (id, title, subtitle, imageUrl)
        VALUES (?, ?, ?, ?)
      `, [b.id, b.title, b.subtitle || null, b.imageUrl]);
    }
    return bns;
  } else {
    const db = loadLocalDatabase();
    db.banners = bns;
    saveLocalDatabase(db);
    return bns;
  }
}

// ORDERS
export async function getOrders(): Promise<Order[]> {
  if (pool) {
    const [ordersRows] = await pool.query("SELECT * FROM orders ORDER BY createdAt DESC");
    const fullOrders: Order[] = [];

    for (const o of (ordersRows as any[])) {
      const [itemRows] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [o.id]);
      fullOrders.push({
        id: o.id,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerAddress: o.customerAddress,
        customerEmail: o.customerEmail || undefined,
        paymentMethod: o.paymentMethod as any,
        subtotal: o.subtotal,
        deliveryFee: o.deliveryFee,
        total: o.total,
        status: o.status as any,
        createdAt: o.createdAt,
        items: (itemRows as any[]).map(i => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          unit: i.unit,
          quantity: i.quantity
        }))
      });
    }

    return fullOrders;
  } else {
    return loadLocalDatabase().orders;
  }
}

export async function createOrder(o: Order): Promise<Order> {
  if (pool) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Insert order record
      await conn.query(`
        INSERT INTO orders (id, customerName, customerPhone, customerAddress, customerEmail, paymentMethod, subtotal, deliveryFee, total, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [o.id, o.customerName, o.customerPhone, o.customerAddress, o.customerEmail || null, o.paymentMethod, o.subtotal, o.deliveryFee, o.total, o.status, new Date(o.createdAt)]);

      // 2. Insert items and automatically deduct stock in the same sequence
      for (const item of o.items) {
        await conn.query(`
          INSERT INTO order_items (order_id, productId, name, price, unit, quantity)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [o.id, item.productId, item.name, item.price, item.unit, item.quantity]);

        // Deduct stock
        await conn.query(`
          UPDATE products 
          SET stock = GREATEST(0, stock - ?) 
          WHERE id = ?
        `, [item.quantity, item.productId]);
      }

      await conn.commit();
      return o;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } else {
    const db = loadLocalDatabase();
    
    // Auto-update stock counts
    o.items.forEach((item) => {
      const idx = db.products.findIndex((p: Product) => p.id === item.productId);
      if (idx !== -1) {
        db.products[idx].stock = Math.max(0, db.products[idx].stock - item.quantity);
      }
    });

    db.orders.unshift(o);
    saveLocalDatabase(db);
    return o;
  }
}

export async function updateOrderStatus(id: string, status: string): Promise<Order | null> {
  if (pool) {
    await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    const orders = await getOrders();
    return orders.find(o => o.id === id) || null;
  } else {
    const db = loadLocalDatabase();
    const idx = db.orders.findIndex((o: Order) => o.id === id);
    if (idx !== -1) {
      db.orders[idx].status = status as any;
      saveLocalDatabase(db);
      return db.orders[idx];
    }
    return null;
  }
}

export async function deleteOrder(id: string): Promise<boolean> {
  if (pool) {
    const [res] = await pool.query("DELETE FROM orders WHERE id = ?", [id]);
    return (res as any).affectedRows > 0;
  } else {
    const db = loadLocalDatabase();
    const initialLen = db.orders.length;
    db.orders = db.orders.filter((o: Order) => o.id !== id);
    if (db.orders.length < initialLen) {
      saveLocalDatabase(db);
      return true;
    }
    return false;
  }
}

// ADMIN SECURITY VERIFIER (For Whitelist API Guarding)
export async function isUserAdmin(email: string | null): Promise<boolean> {
  if (!email) return false;
  const lowerEmail = email.toLowerCase().trim();
  
  if (lowerEmail === "dubeyavinash157@gmail.com") {
    return true;
  }

  if (pool) {
    const [rows] = await pool.query("SELECT * FROM admins WHERE email = ?", [lowerEmail]);
    return (rows as any[]).length > 0;
  } else {
    const db = loadLocalDatabase();
    if (!db.admins) return false;
    return !!db.admins.find((a: any) => (a.email || "").toLowerCase().trim() === lowerEmail);
  }
}

export async function syncCustomer(customer: { id: string; email: string; name: string }): Promise<any> {
  const { id, email, name } = customer;
  if (pool) {
    const [existing] = await pool.query("SELECT * FROM customers WHERE id = ?", [id]);
    if ((existing as any[]).length === 0) {
      await pool.query(
        "INSERT INTO customers (id, email, name) VALUES (?, ?, ?)",
        [id, email, name]
      );
    } else {
      await pool.query(
        "UPDATE customers SET email = ?, name = ? WHERE id = ?",
        [email, name, id]
      );
    }
    return customer;
  } else {
    const db = loadLocalDatabase();
    if (!db.customers) db.customers = [];
    const idx = db.customers.findIndex((c: any) => c.id === id);
    if (idx === -1) {
      db.customers.push({ id, email, name, createdAt: new Date().toISOString() });
    } else {
      db.customers[idx].email = email;
      db.customers[idx].name = name;
    }
    saveLocalDatabase(db);
    return customer;
  }
}
