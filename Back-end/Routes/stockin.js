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

// 3. Update Stock In Record
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { ItemName, Description, quantityin, supplierName, stockDate } = req.body;

  if (!ItemName || quantityin === undefined || !supplierName || !stockDate) {
    return res.status(400).json({ message: "ItemName, quantityin, supplierName, and stockDate are required." });
  }

  const parsedQty = parseInt(quantityin);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ message: "Quantity in must be a positive integer." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Get current StockIn record to check quantities
    const [records] = await conn.query("SELECT quantityin, totalquantityin FROM StockIn WHERE stock_id = ?", [id]);
    if (records.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: "Stock In record not found." });
    }

    const oldQty = records[0].quantityin;
    const currentTotal = records[0].totalquantityin;
    const qtyDiff = parsedQty - oldQty;
    const newTotal = currentTotal + qtyDiff;

    if (newTotal < 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ message: "Cannot reduce quantity in below what has already been issued." });
    }

    await conn.query(
      `UPDATE StockIn 
       SET ItemName = ?, Description = ?, quantityin = ?, totalquantityin = ?, stockDate = ?, supplierName = ? 
       WHERE stock_id = ?`,
      [ItemName, Description || "", parsedQty, newTotal, stockDate, supplierName, id]
    );

    await conn.commit();
    conn.release();

    const [updatedRecord] = await db.query(
      `SELECT s.*, u.user_name FROM StockIn s LEFT JOIN Users u ON s.user_id = u.user_id WHERE s.stock_id = ?`,
      [id]
    );

    return res.json(updatedRecord[0]);
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("Update stock-in failed:", error);
    return res.status(500).json({ message: "Error updating stock-in record." });
  }
});

// 4. Delete Stock In Record
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Deleting a StockIn will trigger ON DELETE CASCADE for StockOut in MySQL.
    const [result] = await db.query("DELETE FROM StockIn WHERE stock_id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Stock In record not found." });
    }
    return res.json({ message: "Stock In record deleted successfully." });
  } catch (error) {
    console.error("Delete stock-in failed:", error);
    return res.status(500).json({ message: "Error deleting stock-in record." });
  }
});

module.exports = router;
