const express = require("express");
const router = express.Router();
const db = require("../Config/Connection");
const authMiddleware = require("../Middleware/auth");

// All routes here require authentication
router.use(authMiddleware);

// 1. Get All Stock In Entries
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.user_name 
       FROM StockIn s 
       LEFT JOIN Users u ON s.user_id = u.user_id 
       ORDER BY s.stockDate DESC, s.stock_id DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error("Fetch stock-in failed:", error);
    return res.status(500).json({ message: "Error fetching stock-in data." });
  }
});

// 2. Record Stock In
router.post("/", async (req, res) => {
  const { ItemName, Description, quantityin, supplierName, stockDate } = req.body;

  if (!ItemName || quantityin === undefined || !supplierName || !stockDate) {
    return res.status(400).json({ message: "ItemName, quantityin, supplierName, and stockDate are required." });
  }

  const parsedQty = parseInt(quantityin);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ message: "Quantity in must be a positive integer." });
  }

  try {
    const user_id = req.user.user_id;

    // Insert StockIn. Initial totalquantityin equals quantityin.
    const [result] = await db.query(
      `INSERT INTO StockIn (ItemName, Description, quantityin, totalquantityin, stockDate, supplierName, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ItemName, Description || "", parsedQty, parsedQty, stockDate, supplierName, user_id]
    );

    const [newRecord] = await db.query(
      `SELECT s.*, u.user_name FROM StockIn s LEFT JOIN Users u ON s.user_id = u.user_id WHERE s.stock_id = ?`,
      [result.insertId]
    );

    return res.status(201).json(newRecord[0]);
  } catch (error) {
    console.error("Insert stock-in failed:", error);
    return res.status(500).json({ message: "Error recording stock-in." });
  }
});

module.exports = router;
