const express = require('express');

const router = express.Router();
const categories = ['electronics', 'books', 'fashion'];
const products = [];
let nextId = 1;

function validateProduct(body) {
  if (!body || typeof body.name !== 'string' || !body.name.trim()) {
    return 'กรุณาระบุชื่อสินค้า';
  }

  if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0) {
    return 'ราคาต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป';
  }

  if (body.stock !== undefined && (!Number.isInteger(body.stock) || body.stock < 0)) {
    return 'จำนวนสินค้าคงเหลือต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป';
  }

  if (body.category !== undefined && !categories.includes(body.category)) {
    return 'หมวดหมู่สินค้าที่ระบุไม่ถูกต้อง';
  }

  return null;
}

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: แสดงรายการสินค้าทั้งหมด
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: รายการสินค้า
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *   post:
 *     summary: เพิ่มสินค้า
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: เพิ่มสินค้าสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.route('/')
  .get((req, res) => {
    res.json(products);
  })
  .post((req, res) => {
    const validationError = validateProduct(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const product = {
      id: nextId++,
      name: req.body.name.trim(),
      price: req.body.price,
      stock: req.body.stock ?? 0,
      ...(req.body.category !== undefined && { category: req.body.category }),
      createdAt: new Date().toISOString(),
    };

    products.push(product);
    res.status(201).json(product);
  });

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: แสดงรายละเอียดสินค้า
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/ProductId'
 *     responses:
 *       200:
 *         description: ข้อมูลสินค้า
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: แก้ไขสินค้า
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/ProductId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: แก้ไขสินค้าสำเร็จ
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: ลบสินค้า
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/ProductId'
 *     responses:
 *       204:
 *         description: ลบสินค้าสำเร็จ
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route('/:id')
  .get((req, res) => {
    const product = products.find((item) => item.id === Number(req.params.id));
    if (!product) {
      return res.status(404).json({ error: 'ไม่พบสินค้า' });
    }
    res.json(product);
  })
  .put((req, res) => {
    const validationError = validateProduct(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const product = products.find((item) => item.id === Number(req.params.id));
    if (!product) {
      return res.status(404).json({ error: 'ไม่พบสินค้า' });
    }

    product.name = req.body.name.trim();
    product.price = req.body.price;
    product.stock = req.body.stock ?? 0;
    if (req.body.category === undefined) {
      delete product.category;
    } else {
      product.category = req.body.category;
    }

    res.json(product);
  })
  .delete((req, res) => {
    const productIndex = products.findIndex((item) => item.id === Number(req.params.id));
    if (productIndex === -1) {
      return res.status(404).json({ error: 'ไม่พบสินค้า' });
    }

    products.splice(productIndex, 1);
    res.status(204).end();
  });

module.exports = router;
