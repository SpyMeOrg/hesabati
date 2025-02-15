const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const port = process.env.PORT || 3000;

// إعداد CORS
app.use(cors());
app.use(express.json());

// تحديد مسار قاعدة البيانات بناءً على بيئة التشغيل
const isVercel = process.env.VERCEL === '1';
const dbPath = isVercel ? ':memory:' : path.join(__dirname, 'data', 'database.sqlite');
const db = new Database(dbPath);

// إنشاء الجداول وإضافة بيانات افتراضية في بيئة Vercel
function initializeDatabase() {
    // إنشاء الجداول
    db.exec(`CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        isSubcategory INTEGER DEFAULT 0,
        parentId TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        categoryId TEXT,
        unitId TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoryId) REFERENCES categories(id),
        FOREIGN KEY (unitId) REFERENCES units(id)
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS movements (
        id TEXT PRIMARY KEY,
        productId TEXT,
        type TEXT NOT NULL,
        quantity REAL NOT NULL,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (productId) REFERENCES products(id)
    )`);

    if (isVercel) {
        // إضافة بيانات افتراضية للاختبار في بيئة Vercel
        try {
            db.exec(`INSERT INTO categories (id, name) VALUES 
                ('cat1', 'تصنيف 1'),
                ('cat2', 'تصنيف 2')`);
            
            db.exec(`INSERT INTO units (id, name) VALUES 
                ('unit1', 'قطعة'),
                ('unit2', 'كيلو')`);
        } catch (err) {
            console.log('تم تجاهل إضافة البيانات الافتراضية: قد تكون موجودة بالفعل');
        }
    }
}

// تهيئة قاعدة البيانات
initializeDatabase();

// الراوترز
app.get('/api/categories', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM categories').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/categories', (req, res) => {
    try {
        const stmt = db.prepare('INSERT INTO categories (id, name, isSubcategory, parentId) VALUES (?, ?, ?, ?)');
        const result = stmt.run(req.body.id, req.body.name, req.body.isSubcategory ? 1 : 0, req.body.parentId);
        res.json({ id: req.body.id, changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/units', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM units').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/units', (req, res) => {
    try {
        const stmt = db.prepare('INSERT INTO units (id, name) VALUES (?, ?)');
        const result = stmt.run(req.body.id, req.body.name);
        res.json({ id: req.body.id, changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/units/:id', (req, res) => {
    try {
        const stmt = db.prepare('UPDATE units SET name = ? WHERE id = ?');
        const result = stmt.run(req.body.name, req.params.id);
        res.json({ changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/units/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM units WHERE id = ?');
        const result = stmt.run(req.params.id);
        res.json({ changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM products').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', (req, res) => {
    try {
        const stmt = db.prepare('INSERT INTO products (id, name, categoryId, unitId) VALUES (?, ?, ?, ?)');
        const result = stmt.run(req.body.id, req.body.name, req.body.categoryId, req.body.unitId);
        res.json({ id: req.body.id, changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/products/:id', (req, res) => {
    try {
        const stmt = db.prepare('UPDATE products SET name = ?, categoryId = ?, unitId = ? WHERE id = ?');
        const result = stmt.run(req.body.name, req.body.categoryId, req.body.unitId, req.params.id);
        res.json({ changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM products WHERE id = ?');
        const result = stmt.run(req.params.id);
        res.json({ changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/movements', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM movements').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/movements', (req, res) => {
    try {
        const stmt = db.prepare('INSERT INTO movements (id, productId, type, quantity, notes) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run(req.body.id, req.body.productId, req.body.type, req.body.quantity, req.body.notes);
        res.json({ id: req.body.id, changes: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/movements/product/:productId', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM movements WHERE productId = ? ORDER BY date DESC').all(req.params.productId);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products/stats', (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT 
                p.id,
                p.name,
                p.categoryId,
                p.unitId,
                COALESCE(SUM(CASE WHEN m.type = 'in' THEN m.quantity ELSE -m.quantity END), 0) as currentStock
            FROM products p
            LEFT JOIN movements m ON p.id = m.productId
            GROUP BY p.id
        `).all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// تقديم الملفات الثابتة
if (process.env.VERCEL) {
    // في بيئة Vercel
    app.use(express.static(path.join(__dirname)));
} else {
    // في البيئة المحلية
    app.use(express.static(path.join(__dirname, 'dist')));
}

// توجيه كل المسارات الأخرى إلى index.html
app.get('*', (req, res) => {
    // التحقق من أن المسار ليس API
    if (!req.path.startsWith('/api')) {
        console.log('توجيه إلى index.html:', req.path);
        const indexPath = process.env.VERCEL 
            ? path.join(__dirname, 'index.html')
            : path.join(__dirname, 'dist', 'index.html');
            
        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error('خطأ في إرسال الملف:', err);
                res.status(500).send('خطأ في تحميل الصفحة');
            }
        });
    }
});

// إغلاق قاعدة البيانات عند إيقاف التطبيق
process.on('SIGINT', () => {
    db.close();
    process.exit();
});

app.listen(port, () => {
    console.log(`الخادم يعمل على المنفذ ${port}`);
}); 