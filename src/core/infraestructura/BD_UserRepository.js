const UserRepository = require('../dominio/UserRepository');
const UserFactory = require('../dominio/UserFactory');
const pool = require('../infraestructura/db');

/**
 * BD_UserRepository.js
 * 
 * IMPLEMENTACIÓN CONCRETA DEL REPOSITORIO: 
 * - Implementa la interfaz del repositorio
 * - Pertenece a la capa de infraestructura
 * - Se encarga de la persistencia real del agregado
 */
class BD_UserRepository extends UserRepository {
  
  async findById(id) {
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return UserFactory.createFromData(res.rows[0]);
  }

  async findByEmail(email) {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) return null;
    return UserFactory.createFromData(res.rows[0]);
  }

  async save(user) {
    console.log('[DEBUG] User:', user);
    const res = await pool.query(`
      INSERT INTO users (name, email, password, role, department)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [
      user.name,
      user.email,
      user.password,
      user.role,
      user.department || null
    ]);

    return UserFactory.createFromData(res.rows[0]);
  }

  async update(user) {
    console.log('[DEBUG] User:', user);
    const res = await pool.query(`
      UPDATE users
      SET name = $1, email = $2, password = $3, role = $4, department = $5
      WHERE id = $6
      RETURNING *;
    `, [
      user.name,
      user.email,
      user.password,
      user.role,
      user.department || null,
      user.id
    ]);

    if (res.rowCount === 0) throw new Error('Usuario no encontrado');
    return UserFactory.createFromData(res.rows[0]);
  }

  async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }

  async findAll() {
    const res = await pool.query('SELECT * FROM users');
    return res.rows.map(row => UserFactory.createFromData(row));
  }
}
  
  module.exports = BD_UserRepository;