import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/xeno_crm');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const NUM_CUSTOMERS = 10000;
const NUM_ORDERS = 100000;

const seedData = async () => {
  await connectDB();

  try {
    console.log('Clearing existing data...');
    await Customer.deleteMany();
    await Order.deleteMany();

    console.log(`Generating ${NUM_CUSTOMERS} customers in memory...`);
    
    const customers = [];
    // Generate objectIds manually so we can assign orders to them
    const customerIds = Array.from({ length: NUM_CUSTOMERS }, () => new mongoose.Types.ObjectId());
    
    for (let i = 0; i < NUM_CUSTOMERS; i++) {
      customers.push({
        _id: customerIds[i],
        name: faker.person.fullName(),
        email: `user${i}_${Date.now()}@example.com`,
        phone: faker.phone.number(),
        gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
        age: faker.number.int({ min: 18, max: 80 }),
        location: faker.location.city(),
        clv: 0,
        totalOrders: 0,
        lastPurchaseDate: null,
        optInWhatsApp: faker.datatype.boolean({ probability: 0.8 }),
        optInEmail: faker.datatype.boolean({ probability: 0.9 }),
        optInSMS: faker.datatype.boolean({ probability: 0.7 }),
      });
    }

    console.log(`Generating ${NUM_ORDERS} orders in memory...`);
    const orders = [];
    const categories = ['Electronics', 'Beauty', 'Fashion', 'Home', 'Sports', 'Groceries'];

    for (let i = 0; i < NUM_ORDERS; i++) {
      const customerIndex = faker.number.int({ min: 0, max: NUM_CUSTOMERS - 1 });
      const customer = customers[customerIndex];
      
      const numProducts = faker.number.int({ min: 1, max: 5 });
      const products = [];
      let orderAmount = 0;

      for (let p = 0; p < numProducts; p++) {
        const price = faker.number.int({ min: 10, max: 1000 });
        const quantity = faker.number.int({ min: 1, max: 3 });
        products.push({
          name: faker.commerce.productName(),
          category: faker.helpers.arrayElement(categories),
          price,
          quantity
        });
        orderAmount += (price * quantity);
      }

      const orderDate = faker.date.recent({ days: 365 });

      orders.push({
        customerId: customer._id,
        amount: orderAmount,
        products,
        status: faker.helpers.arrayElement(['Completed', 'Completed', 'Completed', 'Refunded', 'Cancelled']),
        orderDate,
      });

      // Update customer stats
      if (orders[i].status === 'Completed') {
        customer.clv += orderAmount;
      }
      customer.totalOrders += 1;
      if (!customer.lastPurchaseDate || orderDate > customer.lastPurchaseDate) {
        customer.lastPurchaseDate = orderDate;
      }
    }

    console.log('Inserting Customers to DB in chunks...');
    const chunkSize = 2000;
    for (let i = 0; i < customers.length; i += chunkSize) {
      await Customer.insertMany(customers.slice(i, i + chunkSize));
      console.log(`Inserted customers ${i} to ${i + chunkSize}`);
    }

    console.log('Inserting Orders to DB in chunks...');
    for (let i = 0; i < orders.length; i += chunkSize) {
      await Order.insertMany(orders.slice(i, i + chunkSize));
      console.log(`Inserted orders ${i} to ${i + chunkSize}`);
    }

    console.log('Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error with seed: ${error}`);
    process.exit(1);
  }
};

seedData();
