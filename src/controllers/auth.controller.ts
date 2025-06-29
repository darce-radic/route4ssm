import { Request, Response, NextFunction } from 'express';
import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { AppError } from '../utils/error';
import { logger } from '../utils/logger';
import { AppDataSource } from '../config/database';

export class AuthController {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  public createOrUpdateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id, email, firstName, lastName, role } = req.body;

      let user = await this.userRepository.findOne({ where: { email } });

      if (user) {
        // Update existing user
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.role = role || user.role;
        await this.userRepository.save(user);
      } else {
        // Create new user
        user = this.userRepository.create({
          id,
          email,
          firstName,
          lastName,
          role
        });
        await this.userRepository.save(user);
      }

      res.status(201).json({
        message: user ? 'User updated successfully' : 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('User management error:', error);
      next(error);
    }
  };

  public getUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.params.id;
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Get user error:', error);
      next(error);
    }
  };
} 