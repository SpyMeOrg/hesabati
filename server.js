const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { Database } = require('sqlite3');

const app = express();
const port = process.env.PORT || 3000;

// إعداد CORS
app.use(cors());
app.use(express.json());

// إنشاء مجلد البيانات إذا لم يكن موجوداً
if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

// إنشاء قاعدة البيانات
const db = new Database('data/database.sqlite', (err) => {
    if (err) {
        console.error('خطأ في الاتصال بقاعدة البيانات:', err);
    } else {
        console.log('تم الاتصال بقاعدة البيانات بنجاح');
        
        // إنشاء الجداول
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                isSubcategory INTEGER DEFAULT 0,
                parentId TEXT,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS units (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                categoryId TEXT,
                unitId TEXT,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (categoryId) REFERENCES categories(id),
                FOREIGN KEY (unitId) REFERENCES units(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS movements (
                id TEXT PRIMARY KEY,
                productId TEXT,
                type TEXT NOT NULL,
                quantity REAL NOT NULL,
                date TEXT DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (productId) REFERENCES products(id)
            )`);
        });
    }
});

// الراوترز
app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/categories', (req, res) => {
    const stmt = db.prepare('INSERT INTO categories (id, name, isSubcategory, parentId) VALUES (?, ?, ?, ?)');
    stmt.run([req.body.id, req.body.name, req.body.isSubcategory ? 1 : 0, req.body.parentId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: req.body.id, changes: this.changes });
    });
    stmt.finalize();
});

app.get('/api/units', (req, res) => {
    db.all('SELECT * FROM units', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/units', (req, res) => {
    const stmt = db.prepare('INSERT INTO units (id, name) VALUES (?, ?)');
    stmt.run([req.body.id, req.body.name], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: req.body.id, changes: this.changes });
    });
    stmt.finalize();
});

app.put('/api/units/:id', (req, res) => {
    const stmt = db.prepare('UPDATE units SET name = ? WHERE id = ?');
    stmt.run([req.body.name, req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
    stmt.finalize();
});

app.delete('/api/units/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM units WHERE id = ?');
    stmt.run([req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
    stmt.finalize();
});

app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/products', (req, res) => {
    const stmt = db.prepare('INSERT INTO products (id, name, categoryId, unitId) VALUES (?, ?, ?, ?)');
    stmt.run([req.body.id, req.body.name, req.body.categoryId, req.body.unitId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: req.body.id, changes: this.changes });
    });
    stmt.finalize();
});

app.put('/api/products/:id', (req, res) => {
    const stmt = db.prepare('UPDATE products SET name = ?, categoryId = ?, unitId = ? WHERE id = ?');
    stmt.run([req.body.name, req.body.categoryId, req.body.unitId, req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
    stmt.finalize();
});

app.delete('/api/products/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run([req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
    stmt.finalize();
});

app.get('/api/movements', (req, res) => {
    db.all('SELECT * FROM movements', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/movements', (req, res) => {
    const stmt = db.prepare('INSERT INTO movements (id, productId, type, quantity, notes) VALUES (?, ?, ?, ?, ?)');
    stmt.run([req.body.id, req.body.productId, req.body.type, req.body.quantity, req.body.notes], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: req.body.id, changes: this.changes });
    });
    stmt.finalize();
});

app.get('/api/movements/product/:productId', (req, res) => {
    db.all('SELECT * FROM movements WHERE productId = ? ORDER BY date DESC', [req.params.productId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/products/stats', (req, res) => {
    db.all(`
        SELECT 
            p.id,
            p.name,
            p.categoryId,
            p.unitId,
            COALESCE(SUM(CASE WHEN m.type = 'in' THEN m.quantity ELSE -m.quantity END), 0) as currentStock
        FROM products p
        LEFT JOIN movements m ON p.id = m.productId
        GROUP BY p.id
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// تقديم الملفات الثابتة
app.use(express.static(path.join(__dirname, 'dist')));

// توجيه كل المسارات الأخرى إلى index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`الخادم يعمل على المنفذ ${port}`);
}); 