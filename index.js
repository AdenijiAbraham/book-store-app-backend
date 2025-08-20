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
  

// CORS configuration - Updated to allow all Vercel deployments
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'https://book-store-app-frontend-jh4k.vercel.app',
        // Allow all Vercel preview deployments
        /^https:\/\/book-store-app-frontend-jh4k-.*\.vercel\.app$/
    ],
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

// Debug middleware (logs response content type instead of request)
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} - Response Content-Type: ${res.get('Content-Type') || 'unknown'}`);
  });
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

// Health check route with detailed connection info
app.get('/health', (req, res) => {
  const connectionDuration = connectionStartTime 
    ? Math.round((new Date() - connectionStartTime) / 1000 / 60) 
    : 'unknown';
    
  res.json({ 
    status: 'healthy', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    readyState: mongoose.connection.readyState,
    connectionDuration: `${connectionDuration} minutes`,
    lastConnected: connectionStartTime ? connectionStartTime.toISOString() : 'never',
    reconnectAttempts: reconnectAttempts
  });
});

// 🆕 Atlas connection keep-alive endpoint
app.get('/keep-alive', async (req, res) => {
  try {
    // Simple ping to keep connection alive
    await mongoose.connection.db.admin().ping();
    res.json({ 
      status: 'alive', 
      timestamp: new Date().toISOString(),
      connectionState: mongoose.connection.readyState 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      connectionState: mongoose.connection.readyState 
    });
  }
});

// ✅ Enhanced debug route for Atlas troubleshooting
app.get('/debug-env', (req, res) => {
  const dbUrl = process.env.DB_URL;
  let dbInfo = "❌ Missing";
  
  if (dbUrl) {
    // Parse Atlas connection string for debugging (safely)
    const isAtlas = dbUrl.includes('mongodb+srv://');
    const hasCredentials = dbUrl.includes('@');
    const cluster = isAtlas ? dbUrl.match(/@([^/]+)/)?.[1] : 'local';
    
    dbInfo = {
      status: "✅ Loaded",
      type: isAtlas ? "MongoDB Atlas" : "Local/Self-hosted",
      cluster: cluster || "unknown",
      hasCredentials: hasCredentials ? "✅ Yes" : "❌ No"
    };
  }
  
  res.json({
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY ? "✅ Loaded" : "❌ Missing",
    DB_URL: dbInfo,
    NODE_ENV: process.env.NODE_ENV || "not set",
    mongooseState: mongoose.connection.readyState,
    connectionStates: {
      0: "disconnected",
      1: "connected", 
      2: "connecting",
      3: "disconnecting"
    }
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

// 🔥 ENHANCED: Robust MongoDB connection with better reconnection logic
let isConnecting = false;
let reconnectTimeout = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectInterval = 5000; // 5 seconds

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
    
    // Clear any existing reconnect timeout
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    isConnecting = true;
    console.log('🔄 Connecting to MongoDB...');
    
    // Close existing connection if it exists
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(process.env.DB_URL, {
      // Optimized for MongoDB Atlas
      serverSelectionTimeoutMS: 5000,     // Atlas responds quickly
      socketTimeoutMS: 45000,             // Atlas timeout is ~30s, so buffer it
      heartbeatFrequencyMS: 10000,        // Regular health checks for Atlas
      maxPoolSize: 5,                     // Atlas M0 has connection limits
      minPoolSize: 1,                     // Keep at least 1 connection alive
      maxIdleTimeMS: 30000,               // Atlas closes idle connections
      waitQueueTimeoutMS: 5000,           // Don't wait too long for Atlas
      retryWrites: true,                  // Essential for Atlas replica sets
      connectTimeoutMS: 10000,            // Atlas connects fast
      family: 4,                          // Force IPv4 (Atlas sometimes has IPv6 issues)
    });
    
    console.log("✅ MongoDB connected successfully");
    reconnectAttempts = 0; // Reset attempts on successful connection
    
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    
    // Implement exponential backoff for reconnection
    reconnectAttempts++;
    if (reconnectAttempts <= maxReconnectAttempts) {
      const delay = reconnectInterval * Math.pow(2, reconnectAttempts - 1);
      console.log(`🔄 Retrying connection in ${delay / 1000} seconds (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
      
      reconnectTimeout = setTimeout(() => {
        isConnecting = false;
        connectDB();
      }, delay);
    } else {
      console.error(`❌ Max reconnection attempts (${maxReconnectAttempts}) reached. Stopping reconnection attempts.`);
      reconnectAttempts = 0; // Reset for next manual attempt
    }
  } finally {
    if (!reconnectTimeout) {
      isConnecting = false;
    }
  }
}

// 🔥 Enhanced middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1 && !isConnecting) {
      console.log('🔄 Database disconnected, attempting to reconnect...');
      connectDB(); // Don't await here to avoid blocking requests
    }
    next();
  } catch (error) {
    console.error('❌ Database reconnection failed:', error);
    next(); // Continue anyway
  }
});

// 🔥 Enhanced mongoose connection event handlers with detailed logging
let connectionStartTime = null;

mongoose.connection.on('connected', () => {
  connectionStartTime = new Date();
  console.log('🟢 Mongoose connected to MongoDB Atlas');
  console.log(`🕐 Connection established at: ${connectionStartTime.toISOString()}`);
  reconnectAttempts = 0; // Reset attempts on successful connection
});

mongoose.connection.on('disconnected', () => {
  const disconnectTime = new Date();
  const connectionDuration = connectionStartTime 
    ? Math.round((disconnectTime - connectionStartTime) / 1000 / 60) 
    : 'unknown';
    
  console.log('🔴 Mongoose disconnected from MongoDB Atlas');
  console.log(`🕐 Disconnected at: ${disconnectTime.toISOString()}`);
  console.log(`⏱️  Connection lasted: ${connectionDuration} minutes`);
  
  // Auto-reconnect on disconnection
  if (!isConnecting && reconnectAttempts < maxReconnectAttempts) {
    console.log('🔄 Attempting to reconnect to MongoDB Atlas...');
    setTimeout(() => {
      if (mongoose.connection.readyState === 0) { // Only if still disconnected
        connectDB();
      }
    }, reconnectInterval);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('🚨 Mongoose connection error:', err.message);
  console.error('🔍 Error type:', err.name);
  
  // Log specific Atlas-related errors
  if (err.message.includes('Server selection timed out')) {
    console.error('💡 Tip: This might be a network or Atlas cluster issue');
  }
  if (err.message.includes('Authentication failed')) {
    console.error('💡 Tip: Check your Atlas database user credentials');
  }
  if (err.message.includes('IP not in whitelist')) {
    console.error('💡 Tip: Add your IP to Atlas Network Access whitelist');
  }
});

mongoose.connection.on('reconnected', () => {
  connectionStartTime = new Date();
  console.log('🟡 Mongoose reconnected to MongoDB Atlas');
  console.log(`🕐 Reconnection established at: ${connectionStartTime.toISOString()}`);
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT. Gracefully shutting down...');
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  await mongoose.connection.close();
  process.exit(0);
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



