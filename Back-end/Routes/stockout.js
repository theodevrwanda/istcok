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

// 3. Update Stock Out Record
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { stock_id_fk, quantityout, stockoutDate } = req.body;

  if (stock_id_fk === undefined || quantityout === undefined || !stockoutDate) {
    return res.status(400).json({ message: "stock_id_fk, quantityout, and stockoutDate are required." });
  }

  const parsedQty = parseInt(quantityout);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ message: "Quantity out must be a positive integer." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Get current StockOut details
    const [outRecords] = await conn.query("SELECT stock_id_fk, quantityout FROM StockOut WHERE stock_id = ?", [id]);
    if (outRecords.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: "Stock Out record not found." });
    }

    const oldBatchId = outRecords[0].stock_id_fk;
    const oldQty = outRecords[0].quantityout;

    // 1. Restore old quantity to the original StockIn batch
    await conn.query("UPDATE StockIn SET totalquantityin = totalquantityin + ? WHERE stock_id = ?", [oldQty, oldBatchId]);

    // 2. Fetch target StockIn batch to verify availability
    const [batches] = await conn.query("SELECT totalquantityin FROM StockIn WHERE stock_id = ?", [stock_id_fk]);
    if (batches.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: "The target StockIn batch was not found." });
    }

    const available = batches[0].totalquantityin;
    if (available < parsedQty) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ message: `Insufficient stock in target batch. Only ${available} units available.` });
    }

    // 3. Subtract new quantity from target StockIn batch
    const newTotalRemaining = available - parsedQty;
    await conn.query("UPDATE StockIn SET totalquantityin = ? WHERE stock_id = ?", [newTotalRemaining, stock_id_fk]);

    // 4. Update StockOut record
    await conn.query(
      `UPDATE StockOut 
       SET quantityout = ?, totalquantityout = ?, stockoutDate = ?, stock_id_fk = ? 
       WHERE stock_id = ?`,
      [parsedQty, newTotalRemaining, stockoutDate, stock_id_fk, id]
    );

    await conn.commit();
    conn.release();

    const [updatedRecord] = await db.query(
      `SELECT o.*, i.ItemName, i.Description, i.supplierName, u.user_name 
       FROM StockOut o 
       JOIN StockIn i ON o.stock_id_fk = i.stock_id 
       LEFT JOIN Users u ON o.user_id = u.user_id 
       WHERE o.stock_id = ?`,
      [id]
    );

    return res.json(updatedRecord[0]);
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("Update stock-out failed:", error);
    return res.status(500).json({ message: "Error updating stock-out record." });
  }
});

// 4. Delete Stock Out Record
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Get stock out details
    const [records] = await conn.query("SELECT stock_id_fk, quantityout FROM StockOut WHERE stock_id = ?", [id]);
    if (records.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: "Stock Out record not found." });
    }

    const { stock_id_fk, quantityout } = records[0];

    // Update StockIn (return the quantity)
    await conn.query("UPDATE StockIn SET totalquantityin = totalquantityin + ? WHERE stock_id = ?", [quantityout, stock_id_fk]);

    // Delete StockOut record
    await conn.query("DELETE FROM StockOut WHERE stock_id = ?", [id]);

    await conn.commit();
    conn.release();
    return res.json({ message: "Stock Out record deleted successfully." });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("Delete stock-out failed:", error);
    return res.status(500).json({ message: "Error deleting stock-out record." });
  }
});

module.exports = router;
