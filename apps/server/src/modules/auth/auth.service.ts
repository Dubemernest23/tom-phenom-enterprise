import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
// import { UnauthorizedError } from '../../utils/errors.js'; // use whatever your errorHandler already understands
import type { AdminRepository } from './auth.repo.js';
import { UnauthorizedError } from '../../shared/appError.js';

export interface LoginDto {
  username: string;
  password: string;
}

// Compared against when the username doesn't exist, so response time
// doesn't reveal which usernames are real. Cost 12 matches your seeded hash.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async login({ username, password }: LoginDto) {
    const admin = await this.adminRepository.findByUsername(username);
    const isMatch = await bcrypt.compare(password, admin?.password ?? DUMMY_HASH);

    if (!admin || !isMatch) {
      throw new UnauthorizedError('Invalid username or password.');
    }

    const token = jwt.sign(
      { sub: String(admin.id), username: admin.username, role: admin.role },
      env.jwtSecret,
      { expiresIn: '12h' },
    );

    return {
      token,
      user: { id: admin.id, username: admin.username, role: admin.role },
    };
  }
}