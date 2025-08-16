//book.route.js
// 3. Updated book.route.js - Fixed path for uploads directory
const express = require("express");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { postABook, getAllBooks, getSingleBook, updateBook, deleteABook } = require("./book.controller");
const verifyAdminToken = require("../middleware/verifyAdminToken");

const router = express.Router();

// IMPORTANT: uploads directory should be at project root, not in src
const uploadsDir = path.join(__dirname, '../../uploads'); // This goes to project root
console.log('📁 Uploads directory path:', uploadsDir);

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory at:', uploadsDir);
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('📁 Saving file to:', uploadsDir);
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'book-' + uniqueSuffix + path.extname(file.originalname);
    console.log('📝 Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log('✅ File type accepted:', file.mimetype);
    return cb(null, true);
  } else {
    console.log('❌ File type rejected:', file.mimetype);
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Debug middleware
const debugMiddleware = (req, res, next) => {
  console.log('=== 📝 REQUEST DEBUG ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Content-Type:', req.get('Content-Type'));
  next();
};

const postMulterDebug = (req, res, next) => {
  console.log('=== 📁 AFTER MULTER ===');
  console.log('Body:', req.body);
  console.log('File:', req.file ? {
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    path: req.file.path
  } : 'No file');
  console.log('====================');
  next();
};

// Error handling
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Routes
router.post("/create-book", 
  verifyAdminToken, 
  debugMiddleware,
  upload.single('coverImage'), 
  postMulterDebug,
  handleMulterError, 
  postABook
);

router.get("/", getAllBooks);
router.get("/:id", getSingleBook);

router.put("/edit/:id", 
  verifyAdminToken, 
  debugMiddleware,
  upload.single('coverImage'), 
  postMulterDebug,
  handleMulterError, 
  updateBook
);

router.delete("/:id", verifyAdminToken, deleteABook);

module.exports = router;







// const express = require("express");
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const Book = require('./book.model');
// const { postABook, getAllBooks, getSingleBook, updateBook, deleteABook } = require("./book.controller");
// const verifyAdminToken = require("../middleware/verifyAdminToken");

// const router = express.Router();

// // Ensure uploads directory exists
// const uploadsDir = path.join(__dirname, '../../uploads');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// // Multer configuration for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadsDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, 'book-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// // File filter to only allow images
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|gif|webp/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype);

//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed!'), false);
//   }
// };

// // Multer upload configuration
// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   },
//   fileFilter: fileFilter
// });

// // Debug middleware to log request data
// const debugMiddleware = (req, res, next) => {
//   console.log('=== DEBUG INFO ===');
//   console.log('Request method:', req.method);
//   console.log('Request URL:', req.url);
//   console.log('Content-Type:', req.get('Content-Type'));
//   console.log('Body before multer:', req.body);
//   next();
// };

// // Middleware to log after multer processing
// const postMulterDebug = (req, res, next) => {
//   console.log('=== AFTER MULTER ===');
//   console.log('req.body:', req.body);
//   console.log('req.file:', req.file);
//   console.log('==================');
//   next();
// };

// // Error handling middleware for multer
// const handleMulterError = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
//     }
//     return res.status(400).json({ message: `Upload error: ${err.message}` });
//   } else if (err) {
//     return res.status(400).json({ message: err.message });
//   }
//   next();
// };

// // Routes
// router.post("/create-book", 
//   verifyAdminToken, 
//   debugMiddleware,
//   upload.single('coverImage'), 
//   postMulterDebug,
//   handleMulterError, 
//   postABook
// );

// router.get("/", getAllBooks);
// router.get("/:id", getSingleBook);

// router.put("/edit/:id", 
//   verifyAdminToken, 
//   debugMiddleware,
//   upload.single('coverImage'), 
//   postMulterDebug,
//   handleMulterError, 
//   updateBook
// );

// router.delete("/:id", verifyAdminToken, deleteABook);

// module.exports = router;


// stop 5 : 3 :35