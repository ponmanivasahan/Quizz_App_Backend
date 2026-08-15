const mysql = require("mysql2/promise");
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true"   
        ? { rejectUnauthorized: true}
        : undefined
});
db.connect((err)=>{
    if(err){
        console.log(err)
    }
    else {
        console.log("Database connected")
    }
});
module.exports = db;