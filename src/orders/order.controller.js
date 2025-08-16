const Order = require('./order.model.js');

const createAOrder = async  (req, res) => {
    try {
        //const newOrder = new Order(req.body);
         const newOrder = await Order(req.body);
        const savedOrder = await newOrder.save();
        res.status(200).json(savedOrder)
    } catch (error) {
      console.error("Error creating order", error)
      res.status(500).json({ message: "Failed to create order"})
    } 

} 

  const getOrderByEmail = async (req, res) => {
    try {
       const {email} = req.params;
       const orders = await Order.find({email}).sort({createdAt: -1})
       if(!orders) {
        return res.status(404).json({ message: "Order not found"})
       }
       res.status(200).json(orders);
          } catch (error) {
      console.error("Error fetching order", error)
      res.status(500).json({ message: "Failed to fetch order"})
    } 

}  
    
module.exports = { 
    createAOrder,  
    getOrderByEmail
 };

 
 





// // 3. FIXED order.controller.js
// const Order = require('./order.model.js');

// const createAOrder = async (req, res) => {
//     try {
//         const newOrder = new Order(req.body); // Fixed: Added 'new' keyword
//         const savedOrder = await newOrder.save();
//         res.status(200).json(savedOrder)
//     } catch (error) {
//         console.error("Error creating order", error)
//         res.status(500).json({ message: "Failed to create order"})
//     }
// }

// const getOrderByEmail = async (req, res) => {
//     try {
//         const {email} = req.params;
//         const orders = await Order.find({email}).sort({createdAt: -1})
//         if(!orders || orders.length === 0) { // Fixed: Check for empty array too
//             return res.status(404).json({ message: "Order not found"})
//         }
//         res.status(200).json(orders);
//     } catch (error) {
//         console.error("Error fetching order", error)
//         res.status(500).json({ message: "Failed to fetch order"})
//     }
// }

// module.exports = {
//     createAOrder,
//     getOrderByEmail
// };








