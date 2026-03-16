/**
 * Script para crear usuarios iniciales en la base de datos
 * Uso: node src/seeds/createUser.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Tenant = require("../models/Tenant");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB conectado");
  } catch (error) {
    console.error("✗ Error conectando a MongoDB:", error.message);
    process.exit(1);
  }
};

const createSuperAdmin = async () => {
  try {
    // Verificar si ya existe un superadmin
    const existingSuperAdmin = await User.findOne({ role: "superadmin" });
    if (existingSuperAdmin) {
      console.log("✓ Ya existe un SuperAdmin:", existingSuperAdmin.username);
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    const superAdmin = new User({
      username: "superadmin",
      password: hashedPassword,
      role: "superadmin",
      tenant: null,
    });

    await superAdmin.save();
    console.log("✓ SuperAdmin creado exitosamente");
    console.log(`  📧 Usuario: superadmin`);
    console.log(`  🔑 Contraseña: admin123`);
  } catch (error) {
    console.error("✗ Error creando SuperAdmin:", error.message);
  }
};

const createAdminWithTenant = async (
  tenantName,
  tenantCode,
  adminUsername,
  adminPassword,
) => {
  try {
    // Crear o obtener el Tenant
    let tenant = await Tenant.findOne({ codigo: tenantCode.toUpperCase() });
    if (!tenant) {
      tenant = new Tenant({
        nombre: tenantName,
        codigo: tenantCode.toUpperCase(),
        activo: true,
      });
      await tenant.save();
      console.log(
        `✓ Tenant creado: ${tenantName} (${tenantCode.toUpperCase()})`,
      );
    } else {
      console.log(`✓ Usando Tenant existente: ${tenant.nombre}`);
    }

    // Verificar si ya existe un admin para este tenant
    const existingAdmin = await User.findOne({
      username: adminUsername,
      tenant: tenant._id,
    });

    if (existingAdmin) {
      console.log(
        `✓ Ya existe Admin para este Tenant: ${existingAdmin.username}`,
      );
      return;
    }

    // Crear el admin
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = new User({
      username: adminUsername,
      password: hashedPassword,
      role: "admin",
      tenant: tenant._id,
    });

    await admin.save();
    console.log(`✓ Admin creado exitosamente`);
    console.log(`  📧 Usuario: ${adminUsername}`);
    console.log(`  🔑 Contraseña: ${adminPassword}`);
    console.log(`  🏢 Empresa: ${tenantCode.toUpperCase()}`);
  } catch (error) {
    console.error("✗ Error creando Admin:", error.message);
  }
};

const main = async () => {
  await connectDB();

  console.log("\n🔨 Creando usuarios iniciales...\n");

  // Crear SuperAdmin
  await createSuperAdmin();

  // Crear Tenant y Admin
  await createAdminWithTenant(
    "GotaPlus Demo",
    "DEMO001",
    "admin_demo",
    "admin123",
  );

  console.log("\n✓ Proceso completado\n");
  process.exit(0);
};

main().catch((error) => {
  console.error("✗ Error fatal:", error);
  process.exit(1);
});
