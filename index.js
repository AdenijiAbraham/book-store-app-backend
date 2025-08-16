const mongoose = require('mongoose');
const express = require('express');
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const AdminRoutes = require("./src/stats/admin.stats");

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// CORS configuration
app.use(cors({
    origin: ["http://localhost:5173", "https://book-store-app-frontend-jh4k.vercel.app"],
    credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Content-Type: ${req.get('Content-Type')}`);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Book store server is running!',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

// API Routes
const bookRoutes = require('./src/books/book.route');
const orderRoutes = require('./src/orders/order.route');
const userRoutes = require("./src/users/user.route");

app.use("/api/books", bookRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/admin", AdminRoutes);

// ✅ Database connection with caching for Vercel (critical)
let isConnected = null;

async function connectDB() {
  if (isConnected) {
    console.log("⚡ Using existing MongoDB connection");
    return;
  }

  try {
    if (!process.env.DB_URL) {
      throw new Error("DB_URL environment variable is not set");
    }

    const db = await mongoose.connect(process.env.DB_URL, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    isConnected = db.connections[0].readyState === 1;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    if (process.env.NODE_ENV !== "production") {
      process.exit(1); // Only crash locally
    }
  }
}

// Connect to DB immediately
connectDB();

// 🔥 Export app for Vercel (serverless functions)
module.exports = app;

// Only start server locally
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`🚀 The app is listening on port ${port}`);
    console.log(`📂 Static files served at: http://localhost:${port}/uploads/`);
  });
}
 











// // 1. Updated index.js (your main server file)
// const mongoose = require('mongoose');
// const express = require('express');
// const cors = require("cors");
// const path = require('path');
// const fs = require('fs'); // Add this
// const AdminRoutes = require("./src/stats/admin.stats");
// const app = express();
// const port = process.env.PORT || 5000;
// require('dotenv').config();

// // Create uploads directory if it doesn't exist
// const uploadsDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
//   console.log('📁 Created uploads directory');
// }
 
// // CORS must be before other middleware
// app.use(cors({
//     origin: ["http://localhost:5173", 'https://book-store-app-frontend-jh4k.vercel.app'],
//     credentials: true,
// }));

// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // 🔥 CRITICAL: Serve static files from uploads directory
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// console.log('📁 Serving static files from:', path.join(__dirname, 'uploads'));

// // Debug middleware
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url} - Content-Type: ${req.get('Content-Type')}`);
//   next();
// });

// // Routes
// const bookRoutes = require('./src/books/book.route');
// const orderRoutes = require('./src/orders/order.route');
// const userRoutes = require("./src/users/user.route");

// app.use("/api/books", bookRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/auth", userRoutes);
// app.use("/api/admin", AdminRoutes);
// app.use('/uploads', express.static('uploads'));

// async function main() {
//   await mongoose.connect(process.env.DB_URL);
  
//   app.get('/', (req, res) => {
//     res.send('Book store server is running!');
//   }); 
// }

// main()
//   .then(() => console.log("MongoDB connected successfully"))
//   .catch(err => console.log(err));

// app.listen(port, () => {
//   console.log(`The app is listening on port ${port}`);
//   console.log(`Static files served at: http://localhost:${port}/uploads/`); 
// });




// //indexe.js

// const mongoose = require('mongoose');
// const express = require('express')
// const cors = require("cors")
// const AdminRoutes = require("./src/stats/admin.stats")

// const app = express()
// const port = process.env.PORT||5000;
// require('dotenv').config()

// //middleware'
// app.use(express.json());
// app.use(cors({
//     origin: ["http://localhost:5173"],
//     credentials : true, 
 
// })) 
   
// // routes
//  const bookRoutes = require('./src/books/book.route')
//  const orderRoutes = require('./src/orders/order.route')
// const userRoutes = require("./src/users/user.route")

//  app.use("/api/books", bookRoutes)
//  app.use("/api/orders", orderRoutes)
//  app.use("/api/auth", userRoutes)
//   app.use("/api/admin", AdminRoutes)

// async function main() {
//   await mongoose.connect(process.env.DB_URL);
//   //password : 6C0QcVeKqb5KvAgO  
//   // username : adenijiabraham29

//   // password 4 bookstore :  skdyhyowjoPFIpsE
// app.use('/', (req, res) => {
//   res.send('Book store server is running !')
// })  

// }

// main().then(() => console.log("Mongodb connected successfully")).catch(err => console.log(err));


// app.listen(port, () => {
//   console.log(`The app is listening on port ${port}`)
// })




// const express = require('express')
// const app = express()
// const port = 3000

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })

