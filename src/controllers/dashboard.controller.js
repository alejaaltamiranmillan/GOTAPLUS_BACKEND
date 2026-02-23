const Credit = require('../models/Credit');

exports.getCartera = async (req, res) => {
  try {
    const cartera = await Credit.find({ estado: 'pendiente' })
      .populate('cliente')
      .populate('cobrador');

    res.json(cartera);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUtilidadTotal = async (req, res) => {
  try {

    const result = await Credit.aggregate([
      {
        $group: {
          _id: null,
          totalPrestado: { $sum: "$montoPrestado" },
          totalCobrar: { $sum: "$montoTotal" }
        }
      }
    ]);

    const totalPrestado = result[0]?.totalPrestado || 0;
    const totalCobrar = result[0]?.totalCobrar || 0;

    res.json({
      totalPrestado,
      totalCobrar,
      utilidad: totalCobrar - totalPrestado
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUtilidadDiaria = async (req, res) => {
  try {

    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const result = await Credit.aggregate([
      {
        $match: {
          createdAt: { $gte: hoy }
        }
      },
      {
        $group: {
          _id: null,
          totalPrestado: { $sum: "$montoPrestado" },
          totalCobrar: { $sum: "$montoTotal" }
        }
      }
    ]);

    const totalPrestado = result[0]?.totalPrestado || 0;
    const totalCobrar = result[0]?.totalCobrar || 0;

    res.json({
      utilidadDiaria: totalCobrar - totalPrestado
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDesempenoCobrador = async (req, res) => {
  try {

    const result = await Credit.aggregate([
      {
        $group: {
          _id: "$cobrador",
          totalCreditos: { $sum: 1 },
          totalPrestado: { $sum: "$montoPrestado" }
        }
      }
    ]);

    res.json(result);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
    