require("dotenv").config();

const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env");
  process.exit(1);
}

const cardNicknames = [
  "Costco Visa",
  "Amazon Visa",
  "Travel Master",
  "Blue Amex",
  "Discover Cashback",
  "Everyday Card"
];

const cardTypes = [
  "Visa",
  "Master",
  "Amex",
  "Discover"
];

const comments = [
  "Gas",
  "Groceries",
  "Restaurant",
  "Coffee",
  "Flight",
  "Hotel",
  "Books",
  "Online Purchase",
  "Utilities",
  "Streaming Service",
  "Pharmacy",
  "Electronics"
];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function randomDateWithinLast90Days() {
  const now = new Date();

  const daysAgo = Math.floor(Math.random() * 90);

  const date = new Date(now);

  date.setDate(now.getDate() - daysAgo);

  return date;
}

function generateTransaction(index) {
  const amendment = Math.random() < 0.1;

  const amount = amendment
    ? -randomAmount(5, 250)
    : randomAmount(5, 250);

  return {
    creditCardNickname: randomElement(cardNicknames),

    cardType: randomElement(cardTypes),

    date: randomDateWithinLast90Days(),

    amount,

    amendment,

    comment: amendment
      ? "Amendment Transaction"
      : randomElement(comments),

    createdAt: new Date()
  };
}

async function seed() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();

    console.log("Connected to MongoDB");

    const db = client.db();

    const transactionsCollection =
      db.collection("transactions");

    const transactions = [];

    for (let i = 0; i < 100; i++) {
      transactions.push(generateTransaction(i));
    }

    const result =
      await transactionsCollection.insertMany(transactions);

    console.log(
      `Inserted ${result.insertedCount} transactions`
    );

  } catch (error) {
    console.error(error);
  } finally {
    await client.close();

    console.log("Disconnected from MongoDB");
  }
}

seed();