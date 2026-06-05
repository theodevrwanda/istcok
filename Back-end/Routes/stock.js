const express = require("express");
const router = express.Router();
const db = require("../Config/Connection");
const authMiddleware = require("../Middleware/auth");

// All routes here require authentication
router.use(authMiddleware);

// 1. Get Dashboard Stats
router.get("/stats", async (req, res) => {
  try {
    const [[inStats]] = await db.query("SELECT COALESCE(SUM(quantityin), 0) AS totalIn FROM StockIn");
    const [[outStats]] = await db.query("SELECT COALESCE(SUM(quantityout), 0) AS totalOut FROM StockOut");
    const currentBalance = Number(inStats.totalIn) - Number(outStats.totalOut);
    const [[userStats]] = await db.query("SELECT COUNT(*) AS totalUsers FROM Users");
    
    // Also get recent movements
    const [recentIn] = await db.query(
      "SELECT s.stock_id as id, s.ItemName as name, 'in' as type, s.quantityin as quantity, s.stockDate as date, u.user_name as recorder FROM StockIn s LEFT JOIN Users u ON s.user_id = u.user_id ORDER BY s.stockDate DESC, s.stock_id DESC LIMIT 5"
    );
    const [recentOut] = await db.query(
      "SELECT o.stock_id as id, i.ItemName as name, 'out' as type, o.quantityout as quantity, o.stockoutDate as date, u.user_name as recorder FROM StockOut o JOIN StockIn i ON o.stock_id_fk = i.stock_id LEFT JOIN Users u ON o.user_id = u.user_id ORDER BY o.stockoutDate DESC, o.stock_id DESC LIMIT 5"
    );

    const recentMovements = [...recentIn, ...recentOut]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return res.json({
      totalIn: Number(inStats.totalIn),
      totalOut: Number(outStats.totalOut),
      currentBalance: currentBalance,
      totalUsers: Number(userStats.totalUsers),
      recentMovements
    });
  } catch (error) {
    console.error("Stats query failed:", error);
    return res.status(500).json({ message: "Error loading statistics." });
  }
});

// 2. Get All Stock In Entries
router.get("/in", async (req, res) => {
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

// 3. Record Stock In
router.post("/in", async (req, res) => {
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

// 4. Get All Stock Out Entries
router.get("/out", async (req, res) => {
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

// 5. Record Stock Out
router.post("/out", async (req, res) => {
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
