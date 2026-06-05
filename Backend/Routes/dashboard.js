const express = require("express");
const router = express.Router();
const db = require("../Config/Connection");
const authMiddleware = require("../Middleware/auth");

// All routes here require authentication
router.use(authMiddleware);

// 1. Get Dashboard Stats
router.get("/", async (req, res) => {
  try {
    const [[inStats]] = await db.query("SELECT COALESCE(SUM(quantityin), 0) AS totalIn FROM StockIn");
    const [[outStats]] = await db.query("SELECT COALESCE(SUM(quantityout), 0) AS totalOut FROM StockOut");
    const currentBalance = Number(inStats.totalIn) - Number(outStats.totalOut);
    const [[userStats]] = await db.query("SELECT COUNT(*) AS totalUsers FROM Users");
    
    // Get recent movements
    const [recentIn] = await db.query(
      "SELECT s.stock_id as id, s.ItemName as name, 'in' as type, s.quantityin as quantity, s.stockDate as date, u.user_name as recorder FROM StockIn s LEFT JOIN Users u ON s.user_id = u.user_id ORDER BY s.stockDate DESC, s.stock_id DESC LIMIT 5"
    );
    const [recentOut] = await db.query(
      "SELECT o.stockout_id as id, i.ItemName as name, 'out' as type, o.quantityout as quantity, o.stockoutDate as date, u.user_name as recorder FROM StockOut o JOIN StockIn i ON o.stock_id = i.stock_id LEFT JOIN Users u ON o.user_id = u.user_id ORDER BY o.stockoutDate DESC, o.stockout_id DESC LIMIT 5"
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

module.exports = router;
