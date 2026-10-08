const express = require("express");
const router = express.Router();
const db = require("../../../db");

// GET /productos
router.get("/", async (req, res) => {
  try {
    const resultado = await db.query(
      "SELECT id_productos AS id, nombre, precio, stock FROM productos ORDER BY id_productos"
    );
    res.status(200).json(resultado.rows);
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudieron obtener los productos" + (error.message ? `: ${error.message}` : "") });
  }
});

// GET /productos/:id
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const resultado = await db.query(
      "SELECT id_productos AS id, nombre, precio, stock FROM productos WHERE id_productos = $1",
      [id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudo obtener el producto" });
  }
});

// POST /productos
router.post("/", async (req, res) => {
  const { id_productos, nombre, precio, stock } = req.body;

  if (!nombre || precio === undefined || stock === undefined) {
    return res.status(400).json({
      mensaje: "Los campos 'nombre', 'precio' y 'stock' son obligatorios"
    });
  }

  try {
    const resultado = await db.query(
      "INSERT INTO productos (id_productos, nombre, precio, stock) VALUES ($1, $2, $3, $4) RETURNING id_productos AS id_productos, nombre, precio, stock",
      [id_productos, nombre, precio, stock]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudo crear el producto" + (error.message ? `: ${error.message}` : "") });
  }
});

// PUT /productos/:id
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, precio, stock } = req.body;

  if (!Number.isInteger(id) || !nombre || precio === undefined || stock === undefined) {
    return res.status(400).json({
      mensaje: "El id, 'nombre', 'precio' y 'stock' son obligatorios"
    });
  }

  try {
    const resultado = await db.query(
      "UPDATE productos SET nombre = $1, precio = $2, stock = $3 WHERE id_productos = $4 RETURNING id_productos AS id, nombre, precio, stock",
      [nombre, precio, stock, id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudo actualizar el producto" });
  }
});

// DELETE /productos/:id
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ mensaje: "El id del producto no es válido" });
  }

  try {
    const resultado = await db.query(
      "DELETE FROM productos WHERE id_productos = $1 RETURNING id_productos AS id, nombre, precio, stock",
      [id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    res.status(200).json({ mensaje: "Producto eliminado", producto: resultado.rows[0] });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        mensaje: "No se puede eliminar el producto porque tiene compras asociadas"
      });
    }

    res.status(500).json({ mensaje: "No se pudo eliminar el producto" });
  }
});

module.exports = router;