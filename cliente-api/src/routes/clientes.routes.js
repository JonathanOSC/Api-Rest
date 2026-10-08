const express = require("express");
const router = express.Router();
const db = require("../../../db");

// GET /clientes
router.get("/", async (req, res) => {
  try {
    const resultado = await db.query(
      "SELECT id_clientes AS id, nombre, email FROM clientes ORDER BY id_clientes"
    );
    res.status(200).json(resultado.rows);
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudieron obtener los clientes" });
  }
});

// GET /clientes/:id
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const resultado = await db.query(
      "SELECT id_clientes AS id, nombre, email FROM clientes WHERE id_clientes = $1",
      [id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudo obtener el cliente" });
  }
});

// POST /clientes
router.post("/", async (req, res) => {
  const { id_clientes, nombre, email } = req.body;

  if (!nombre || !email) {
    return res
      .status(400)
      .json({ mensaje: "Los campos 'nombre' y 'email' son obligatorios" });
  }

  try {
    const resultado = await db.query(
      "INSERT INTO clientes (id_clientes, nombre, email) VALUES ($1, $2, $3) RETURNING id_clientes AS id, nombre, email",
      [id_clientes, nombre, email]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudo crear el cliente" + (error.message ? `: ${error.message}` : "") });
  }
});

// PUT /clientes/:id
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, email } = req.body;

  if (!Number.isInteger(id) || !nombre || !email) {
    return res.status(400).json({
      mensaje: "El id, 'nombre' y 'email' son obligatorios"
    });
  }

  try {
    const resultado = await db.query(
      "UPDATE clientes SET nombre = $1, email = $2 WHERE id_clientes = $3 RETURNING id_clientes AS id, nombre, email",
      [nombre, email, id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudo actualizar el cliente" + (error.message ? `: ${error.message}` : "") });
  }
});

// DELETE /clientes/:id
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ mensaje: "El id del cliente no es válido" });
  }

  try {
    const resultado = await db.query(
      "DELETE FROM clientes WHERE id_clientes = $1 RETURNING id_clientes AS id, nombre, email",
      [id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    res.status(200).json({ mensaje: "Cliente eliminado", cliente: resultado.rows[0] });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        mensaje: "No se puede eliminar el cliente porque tiene compras asociadas"
      });
    }

    res.status(500).json({ mensaje: "No se pudo eliminar el cliente" });
  }
});

module.exports = router;
