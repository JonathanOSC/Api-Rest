const express = require("express");
const router = express.Router();
const db = require("../../../db");
const { obtenerCliente } = require("../services/clienteService");
const { obtenerProducto } = require("../services/productoService");

// GET /compras
router.get("/", async (req, res) => {
  try {
    const resultado = await db.query(
      "SELECT id_compras AS id, id_clientes AS \"clienteId\", id_productos AS \"productoId\", total, fecha_compra AS fecha FROM compras ORDER BY id_compras"
    );
    res.status(200).json(resultado.rows);
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudieron obtener las compras" });
  }
});

// GET /compras/:id
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const resultado = await db.query(
      "SELECT id_compras AS id, id_clientes AS \"clienteId\", id_productos AS \"productoId\", total, fecha_compra AS fecha FROM compras WHERE id_compras = $1",
      [id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudo obtener la compra" });
  }
});

// POST /compras
router.post("/", async (req, res) => {
  const { clienteId, productoId, cantidad } = req.body;

  if (!clienteId || !productoId || !cantidad) {
    return res.status(400).json({
      mensaje: "Los campos 'clienteId', 'productoId' y 'cantidad' son obligatorios"
    });
  }

  let cliente;
  let producto;

  try {
    cliente = await obtenerCliente(clienteId);
    producto = await obtenerProducto(productoId);
  } catch (error) {
    return res.status(503).json({
      mensaje: "No se pudo validar la compra porque uno de los servicios no respondió",
      detalle: error.message
    });
  }

  if (!cliente) {
    return res.status(404).json({ mensaje: `El cliente ${clienteId} no existe` });
  }

  if (!producto) {
    return res.status(404).json({ mensaje: `El producto ${productoId} no existe` });
  }

  if (producto.stock < cantidad) {
    return res.status(400).json({
      mensaje: `Stock insuficiente. Disponible: ${producto.stock}, solicitado: ${cantidad}`
    });
  }

  try {
    const resultado = await db.query(
      "INSERT INTO compras (id_clientes, id_productos, total, fecha_compra) VALUES ($1, $2, $3, $4) RETURNING id_compras AS id, id_clientes AS \"clienteId\", id_productos AS \"productoId\", total, fecha_compra AS fecha",
      [clienteId, productoId, producto.precio * cantidad, new Date()]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudo crear la compra"+ (error.message ? `: ${error.message}` : "") });
  }
});

// PUT /compras/:id
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { clienteId, productoId, total } = req.body;

  if (!Number.isInteger(id) || !clienteId || !productoId || total === undefined) {
    return res.status(400).json({
      mensaje: "El id, 'clienteId', 'productoId' y 'total' son obligatorios"
    });
  }

  try {
    const resultado = await db.query(
      "UPDATE compras SET id_clientes = $1, id_productos = $2, total = $3 WHERE id_compras = $4 RETURNING id_compras AS id, id_clientes AS \"clienteId\", id_productos AS \"productoId\", total, fecha_compra AS fecha",
      [clienteId, productoId, total, id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    if (error.code === "23503") {
      return res.status(400).json({
        mensaje: "El cliente o producto indicado no existe"
      });
    }

    res.status(500).json({ mensaje: "No se pudo actualizar la compra" });
  }
});

// DELETE /compras/:id
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ mensaje: "El id de la compra no es válido" });
  }

  try {
    const resultado = await db.query(
      "DELETE FROM compras WHERE id_compras = $1 RETURNING id_compras AS id, id_clientes AS \"clienteId\", id_productos AS \"productoId\", total, fecha_compra AS fecha",
      [id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    res.status(200).json({ mensaje: "Compra eliminada", compra: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudo eliminar la compra" });
  }
});

module.exports = router;