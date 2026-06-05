const express = require("express");
const router = express.Router();
const db = require("../Config/Connection");
const authMiddleware = require("../Middleware/auth");

// All routes here require authentication
router.use(authMiddleware);

// 1. Get All Stock Out Entries
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.*, i.ItemName, i.Description, i.supplierName, u.user_name 
       FROM StockOut o 
       JOIN StockIn i ON o.stock_id_fk = i.stock_id 
       LEFT JOIN Users u ON o.user_id = u.user_id 
       ORDER BY o.stockoutDate DESC, o.stock_id DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error("Fetch stock-out failed:", error);
    return res.status(500).json({ message: "Error fetching stock-out data." });
  }
});

// 2. Record Stock Out
router.post("/", async (req, res) => {
  const { stock_id_fk, quantityout, stockoutDate } = req.body;

  if (stock_id_fk === undefined || quantityout === undefined || !stockoutDate) {
    return res.status(400).json({ message: "stock_id_fk, quantityout, and stockoutDate are required." });
  }

  const parsedQty = parseInt(quantityout);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ message: "Quantity out must be a positive integer." });
  }

  try {
    const user_id = req.user.user_id;

    // Check availability from the target StockIn batch
    const [batches] = await db.query("SELECT * FROM StockIn WHERE stock_id = ?", [stock_id_fk]);
    if (batches.length === 0) {
      return res.status(404).json({ message: "The referenced StockIn batch was not found." });
    }

    const batch = batches[0];
    if (batch.totalquantityin < parsedQty) {
      return res.status(400).json({
        message: `Insufficient stock. Only ${batch.totalquantityin} units remaining in this batch.`
      });
    }

    // Calculate remaining quantity
    const newTotalRemaining = batch.totalquantityin - parsedQty;

    // Begin Transaction to ensure both update and insert succeed
    await db.query("START TRANSACTION");

    // Update the StockIn batch remaining quantity
    await db.query("UPDATE StockIn SET totalquantityin = ? WHERE stock_id = ?", [newTotalRemaining, stock_id_fk]);

    // Insert StockOut record
    const [result] = await db.query(
      `INSERT INTO StockOut (quantityout, totalquantityout, stockoutDate, stock_id_fk, user_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [parsedQty, newTotalRemaining, stockoutDate, stock_id_fk, user_id]
    );

    await db.query("COMMIT");

    const [newRecord] = await db.query(
      `SELECT o.*, i.ItemName, i.Description, i.supplierName, u.user_name 
       FROM StockOut o 
       JOIN StockIn i ON o.stock_id_fk = i.stock_id 
       LEFT JOIN Users u ON o.user_id = u.user_id 
       WHERE o.stock_id = ?`,
      [result.insertId]
    );

    return res.status(201).json(newRecord[0]);
  } catch (error) {
    // Rollback on database failure
    await db.query("ROLLBACK");
    console.error("Record stock-out failed:", error);
    return res.status(500).json({ message: "Error recording stock-out transaction." });
  }
});

module.exports = router;
