import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// MySQL connection pool
// MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'valilik_yonetim',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export async function POST(request: NextRequest) {
    let connection;
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { message: "Kullanıcı adı ve şifre gerekli" },
                { status: 400 }
            );
        }

        // Veritabanından kullanıcıyı bul
        connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM kullanicilar WHERE kadi = ? LIMIT 1',
            [username]
        );

        const users = rows as any[];
        if (!users || users.length === 0) {
            return NextResponse.json(
                { message: "Kullanıcı bulunamadı" },
                { status: 401 }
            );
        }

        const user = users[0];

        // Şifre kontrolü - MD5 veya bcrypt olabilir
        let isValid = false;

        // Önce MD5 hash kontrolü (eski PHP sistemi)
        const md5Hash = crypto.createHash("md5").update(password).digest("hex");
        if (user.sifre === md5Hash) {
            isValid = true;
        } else {
            // bcrypt kontrolü (yeni sistem)
            try {
                isValid = await bcrypt.compare(password, user.sifre);
            } catch (error) {
                // bcrypt hatası, şifre muhtemelen MD5
                isValid = false;
            }
        }

        if (!isValid) {
            return NextResponse.json(
                { message: "Şifre hatalı" },
                { status: 401 }
            );
        }

        // Başarılı - kullanıcı bilgilerini döndür
        return NextResponse.json({
            id: user.id.toString(),
            name: user.kadi.toLocaleUpperCase('tr-TR'),
            username: user.kadi,
            role: user.yetki,
            customPermissions: user.ozel_yetkiler,
        });
    } catch (error) {
        console.error("Auth verify error:", error);
        return NextResponse.json(
            { message: "Sunucu hatası" },
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
