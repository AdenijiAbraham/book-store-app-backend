const express = require('express')
const User = require('./user.model'); 
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET_KEY

// Hash Password Function (for testing/manual password generation)
async function hashPassword() {
    const password = '12345';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword);
    return hashedPassword;
}

// Uncomment the line below to generate a hashed password when server starts
// hashPassword();

// Temporary endpoint to generate hashed password (remove in production)
router.get('/hash-password', async (req, res) => {
    try {
        const hashedPassword = await hashPassword();
        res.json({ 
            originalPassword: '12345',
            hashedPassword: hashedPassword 
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to hash password' });
    }
});

// Registration endpoint (add this)  
router.post('/register', async (req, res) => {
    const { username, password, role } = req.body;

    try { 
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user (password will be hashed by the pre-save middleware)
        const newUser = new User({
            username,
            password,
            role: role || 'user' // defaults to 'user' if not specified
        });

        await newUser.save();

        return res.status(201).json({
            message: 'User created successfully',
            user: {
                username: newUser.username,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Failed to create user:', error.message);
        return res.status(500).json({ message: 'Failed to create user' });
    }
});

// Login endpoint for admin
router.post('/admin', async (req, res) => {
    const { username, password } = req.body;

    console.log("Login request:", username, password); // Check incoming data

    try {
        if (!JWT_SECRET) {
            console.error("JWT_SECRET is missing");
            return res.status(500).json({ message: 'Server config error: JWT secret missing' });
        }

        const admin = await User.findOne({ username });
        if (!admin) {
            console.log("Admin not found");
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check if user has admin role
        if (admin.role !== 'admin') {
            console.log("User is not an admin");
            return res.status(403).json({ message: 'Access denied: Admin role required' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            console.log("Invalid password");
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: admin._id, username: admin.username, role: admin.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            message: 'Authentication successful',
            token,
            user: {
                username: admin.username,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Failed to login as admin:', error.message);
        return res.status(500).json({ message: 'Failed to login' });
    }
});

module.exports = router;











// username
// "admin"
// password
// "12345"
// role
// "admin"




// const express = require('express')
// const User = require('./user.model'); 
// // const User = require("./user.model")
// const bcrypt = require('bcrypt'); 
// const jwt = require('jsonwebtoken');
// const router = express.Router();

// const JWT_SECRET = process.env.JWT_SECRET_KEY

// router.post('/admin', async (req, res) => {
//     const { username, password } = req.body;

//     console.log("Login request:", username, password); // Check incoming data

//     try {
//         if (!JWT_SECRET) {
//             console.error("JWT_SECRET is missing");
//             return res.status(500).json({ message: 'Server config error: JWT secret missing' });
//         }

//         const admin = await User.findOne({ username });
//         if (!admin) {
//             console.log("Admin not found");
//             return res.status(404).json({ message: 'Admin not found' });
//         }

//         const isMatch = await bcrypt.compare(password, admin.password); // Fails if password is plain text
//         if (!isMatch) {
//             console.log("Invalid password");
//             return res.status(401).json({ message: 'Invalid password' });
//         }

//         const token = jwt.sign(
//             { id: admin._id, username: admin.username, role: admin.role },
//             JWT_SECRET,
//             { expiresIn: '1h' }
//         );

//         return res.status(200).json({
//             message: 'Authentication successful',
//             token,
//             user: {
//                 username: admin.username,
//                 role: admin.role
//             }
//         });

//     } catch (error) {
//         console.error('Failed to login as admin:', error.message);
//         return res.status(500).json({ message: 'Failed to login' });
//     }
// });


// module.exports = router;






// router.post("/admin", async (req, res) => {
//     const {username, password} = req.body;
    
//     try {
//         const admin = await User.findOne({username})
//         if(!admin) {
//             res.status(404).send({message: "Admin not found"})
//         }
//         if(admin.password !== password) {
//             res.status(401).send({message: "Invalid password"})
//         }

//         const token = jwt.sign( 
//             {id: admin._id, username: admin.username, role: admin.role}, 
//             JWT_SECRET, 
//         {expiresIn: "1h"}
//     )

//     return res.status(200).json({
//         message: "Authentication successful",
//         token: token,
//         user: { 
//             username: admin.username,
//             role: admin.role
//         }
//     })


//     } catch (error) {
//         console.error("failed to login as admin")
//         res.status(401).send({message: "Failed to login"})
//     }
// })
