
const { PrismaClient } = require("./src/generated/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require('dotenv').config();

async function testConnection() {
    const url = process.env.DATABASE_URL;
    console.log("Testing connection to:", url?.split('@')[1]);

    if (!url) {
        console.error("DATABASE_URL missing!");
        return;
    }

    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        console.log("Attempting to fetch profiles...");
        const profiles = await prisma.profile.findMany();
        console.log("Success! Found profiles:", profiles.length);
        process.exit(0);
    } catch (err) {
        console.error("Connection failed!");
        console.error(err);
        process.exit(1);
    }
}

testConnection();
