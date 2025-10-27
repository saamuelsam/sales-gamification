import { pool } from '../../config/database';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../config/jwt';

// Função utilitária para converter UUID para string ltree válida
function uuidToLtree(uuid: string) {
  return uuid.replace(/-/g, '_');
}

export class AuthService {
  async register(data: { name: string; email: string; password: string; parent_id?: string }) {
    const { name, email, password, parent_id } = data;

    // Verificar se email já existe
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir usuário
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, parent_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword, 'consultant', parent_id || null]
    );

    const userId = result.rows[0].id;
    const myLtreeId = uuidToLtree(userId);

    // Atualizar path hierárquico
    if (parent_id) {
      // Buscar path do parent
      const parentResult = await pool.query('SELECT path FROM users WHERE id = $1', [parent_id]);
      const parentPath: string = parentResult.rows[0]?.path || '';
      const fullPath = parentPath ? `${parentPath}.${myLtreeId}` : myLtreeId;

      await pool.query(
        `UPDATE users SET path = $1::ltree WHERE id = $2`,
        [fullPath, userId]
      );
    } else {
      // user root
      await pool.query(
        `UPDATE users SET path = $1::ltree WHERE id = $2`,
        [myLtreeId, userId]
      );
    }

    return result.rows[0];
  }

  async login(email: string, password: string) {
    // Buscar usuário
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Email ou senha inválidos');
    }

    const user = result.rows[0];

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Email ou senha inválidos');
    }

    // Gerar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remover senha do retorno
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken: token,
    };
  }
}
