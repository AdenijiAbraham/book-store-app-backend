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
    origin: ["http://localhost:5173", 'https://book-store-app-frontend-jh4k.vercel.app'],
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
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    readyState: mongoose.connection.readyState
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

// 🔥 IMPROVED: MongoDB connection with auto-reconnection
let isConnecting = false;

async function connectDB() {
  if (isConnecting) {
    console.log('⏳ Connection already in progress...');
    return;
  }
  
  try {
    if (!process.env.DB_URL) {
      console.error('❌ DB_URL environment variable is not set');
      return;
    }
    
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return;
    }

    isConnecting = true;
    console.log('🔄 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.DB_URL, {
      // Optimized for Vercel serverless + MongoDB Atlas free tier
      serverSelectionTimeoutMS: 15000,  // Increased timeout
      socketTimeoutMS: 60000,
      maxPoolSize: 10,                   // Reduced pool size for serverless
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      // ⚠️ keep authSource only if required (e.g. self-hosted MongoDB with admin auth)
      // authSource: 'admin'             
    });
    
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
  } finally {
    isConnecting = false;
  }
}

// 🔥 NEW: Middleware to ensure DB connection before each request
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Database disconnected, attempting to reconnect...');
      await connectDB();
    }
    next();
  } catch (error) {
    console.error('❌ Database reconnection failed:', error);
    next(); // Continue anyway, let the route handle the error
  }
});

// Handle mongoose connection events
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
  console.log('🔴 Mongoose disconnected from MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🚨 Mongoose connection error:', err);
});

// Initial connection
connectDB();

// Export for Vercel
module.exports = app;

// Only listen locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`The app is listening on port ${port}`);
    console.log(`Static files served at: http://localhost:${port}/uploads/`);
  });
}






// const mongoose = require('mongoose');
// const express = require('express');
// const cors = require("cors");
// const path = require('path');
// const fs = require('fs');
// const AdminRoutes = require("./src/stats/admin.stats");

// require('dotenv').config();

// const app = express();
// const port = process.env.PORT || 5000;

// // Create uploads directory if it doesn't exist
// const uploadsDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
//   console.log('📁 Created uploads directory');
// }

// // CORS configuration
// app.use(cors({
//     origin: ["http://localhost:5173", "https://book-store-app-frontend-jh4k.vercel.app"],
//     credentials: true,
// }));

// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Serve static files
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Debug middleware
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url} - Content-Type: ${req.get('Content-Type')}`);
//   next();
// });

// // Root route
// app.get('/', (req, res) => {
//   res.json({ 
//     message: 'Book store server is running!',
//     status: 'success',
//     timestamp: new Date().toISOString()
//   });
// });

// // Health check route
// app.get('/health', (req, res) => {
//   res.json({ 
//     status: 'healthy', 
//     database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
//   });
// });

// // API Routes
// const bookRoutes = require('./src/books/book.route');
// const orderRoutes = require('./src/orders/order.route');
// const userRoutes = require("./src/users/user.route");

// app.use("/api/books", bookRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/auth", userRoutes);
// app.use("/api/admin", AdminRoutes);

// // ✅ Database connection with caching for Vercel (critical)
// let isConnected = null;

// async function connectDB() {
//   if (isConnected) {
//     console.log("⚡ Using existing MongoDB connection");
//     return;
//   }

//   try {
//     if (!process.env.DB_URL) {
//       throw new Error("DB_URL environment variable is not set");
//     }

//     const db = await mongoose.connect(process.env.DB_URL, {
//       serverSelectionTimeoutMS: 5000, // Timeout after 5s
//       socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
//     });

//     isConnected = db.connections[0].readyState === 1;
//     console.log("✅ MongoDB connected successfully");
//   } catch (error) {
//     console.error("❌ MongoDB connection error:", error.message);
//     if (process.env.NODE_ENV !== "production") {
//       process.exit(1); // Only crash locally
//     }
//   }
// }

// // Connect to DB immediately
// connectDB();

// // 🔥 Export app for Vercel (serverless functions)
// module.exports = app;

// // Only start server locally
// if (process.env.NODE_ENV !== "production") {
//   app.listen(port, () => {
//     console.log(`🚀 The app is listening on port ${port}`);
//     console.log(`📂 Static files served at: http://localhost:${port}/uploads/`);
//   });
// }
 











// .env
// DB_URL ="mongodb+srv://adenijiabraham29:skdyhyowjoPFIpsE@cluster0.l1bu69e.mongodb.net/Book-store?retryWrites=true&w=majority&appName=Cluster0"

// JWT_SECRET_KEY ='d3c04a65d3223346ba17ede66f253492025eecc531e0edc287c77fa088156d6edd7785bc76010404ce93f1b772336e8c7e9f5bac34e159a0a41d3041db8c9b4f'



