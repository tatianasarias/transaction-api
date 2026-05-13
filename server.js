require("dotenv").config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in environment.");
  process.exit(1);
}

let db;
let transactionsCollection;

const validCardTypes = ["Visa", "Master", "Amex", "Discover", "Other"];

function isValidTransaction(body) {
  if (!body.creditCardNickname) return "creditCardNickname is required.";
  if (!body.cardType) return "cardType is required.";

  if (!validCardTypes.includes(body.cardType)) {
    return "Invalid card type.";
  }

  if (!body.date) return "date is required.";

  if (Number.isNaN(Date.parse(body.date))) {
    return "Invalid date.";
  }

  if (body.amount === undefined) {
    return "amount is required.";
  }

  if (typeof body.amount !== "number") {
    return "amount must be numeric.";
  }

  return null;
}

app.get("/", (req, res) => {
  res.json({
    message: "Transactions API is running"
  });
});

app.post("/transactions", async (req, res) => {
  const error = isValidTransaction(req.body);

  if (error) {
    return res.status(400).json({ error });
  }

  const transaction = {
    creditCardNickname: req.body.creditCardNickname,
    cardType: req.body.cardType,
    date: new Date(req.body.date),
    amount: req.body.amount,
    amendment: req.body.amendment === true,
    comment: req.body.comment || null,
    createdAt: new Date()
  };

  const result = await transactionsCollection.insertOne(transaction);

  res.status(201).json({
    ...transaction,
    id: result.insertedId
  });
});

app.get("/transactions", async (req, res) => {
  const filter = {};

  const { date, startDate, endDate, creditCardNickname } = req.query;

  if (creditCardNickname) {
    filter.creditCardNickname = creditCardNickname;
  }

  if (date) {
    const start = new Date(date);
    const end = new Date(date);

    end.setDate(end.getDate() + 1);

    filter.date = {
      $gte: start,
      $lt: end
    };
  }

  if (startDate || endDate) {
    filter.date = {};

    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);

      filter.date.$lt = end;
    }
  }

  const transactions = await transactionsCollection
    .find(filter)
    .sort({ date: -1 })
    .toArray();

  res.json(transactions);
});

app.get("/transactions/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "Invalid id."
    });
  }

  const transaction = await transactionsCollection.findOne({
    _id: new ObjectId(id)
  });

  if (!transaction) {
    return res.status(404).json({
      error: "Transaction not found."
    });
  }

  res.json(transaction);
});

async function startServer() {
  const client = new MongoClient(MONGODB_URI);

  await client.connect();

  db = client.db();

  transactionsCollection = db.collection("transactions");

  console.log("Connected to MongoDB");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});