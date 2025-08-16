const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET_KEY;

const verifyAdminToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access Denied, no token provided' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid credentials' });
        }

        // Attach user info to request
        req.user = decoded;

        // Optional: check for admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied, admin only' });
        }

        next();
    });
};

module.exports = verifyAdminToken;
 



// const jwt = require('jsonwebtoken');
// const JWT_SECRET = process.env.JWT_SECRET_KEY

// const verifyAdminToken = (req, res, next) => {
//     const token = req.headers['authorization']?.split('')[1];

//     if(!token) {
//          return res.status(401).json({ message: 'Access Denied, no token provided'});
// }
//  jwt.verify(token, JWT_SECRET, (err, user) => {
//     if (err) {
//         return res.status(403).json({ message: 'invalid credentials'})
//     }
//  })
// } 

// module.exports = verifyAdminToken; 

