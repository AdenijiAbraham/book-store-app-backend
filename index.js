// 1. Updated index.js (your main server file)
const mongoose = require('mongoose');
const express = require('express');
const cors = require("cors");
const path = require('path');
const fs = require('fs'); // Add this
const AdminRoutes = require("./src/stats/admin.stats");
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}
 
// CORS must be before other middleware
app.use(cors({
    origin: ["http://localhost:5173", 'https://book-store-app-frontend-jh4k.vercel.app'],
    credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🔥 CRITICAL: Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('📁 Serving static files from:', path.join(__dirname, 'uploads'));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Content-Type: ${req.get('Content-Type')}`);
  next();
});

// Routes
const bookRoutes = require('./src/books/book.route');
const orderRoutes = require('./src/orders/order.route');
const userRoutes = require("./src/users/user.route");

app.use("/api/books", bookRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/admin", AdminRoutes);
app.use('/uploads', express.static('uploads'));

async function main() {
  await mongoose.connect(process.env.DB_URL);
  
  app.get('/', (req, res) => {
    res.send('Book store server is running!');
  }); 
}

main()
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.log(err));

app.listen(port, () => {
  console.log(`The app is listening on port ${port}`);
  console.log(`Static files served at: http://localhost:${port}/uploads/`); 
});




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

