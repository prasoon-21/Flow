import bcrypt from 'bcryptjs';
import { UserRepository } from '@/server/adapters/repositories/user.repository';
import { User } from '@/lib/types/tenant';

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
}

export class UserServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export class UserService {
  private userRepo = new UserRepository();

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UserServiceError('User not found', 404);
    }

    const updates: Partial<User> = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) {
        throw new UserServiceError('Name is required', 400);
      }
      updates.name = name;
    }

    if (input.email !== undefined) {
      const email = input.email.trim();
      if (!email) {
        throw new UserServiceError('Email is required', 400);
      }
      if (email !== user.email) {
        const existing = await this.userRepo.findByEmail(email);
        if (existing && existing.id !== user.id) {
          throw new UserServiceError('Email is already in use', 409);
        }
      }
      updates.email = email;
    }

    if (input.password) {
      if (user.passwordHash) {
        if (!input.currentPassword) {
          throw new UserServiceError('Current password is required', 400);
        }
        const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!isMatch) {
          throw new UserServiceError('Invalid current password', 401);
        }
      }
      updates.passwordHash = await bcrypt.hash(input.password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return user;
    }

    return this.userRepo.update(userId, updates);
  }
}
