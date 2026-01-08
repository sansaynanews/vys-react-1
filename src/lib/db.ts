import mysql from "mysql2/promise";

// MySQL connection pool - PHP db.php ile aynı
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'valilik_yonetim',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

export default pool;
