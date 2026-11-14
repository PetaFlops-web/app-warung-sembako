import type { Request, Response, NextFunction } from 'express'
import type { CreateUserInput } from '../schemas/user.schema.ts'
import type { UserResponse } from '../types/auth.type.ts';
import { createUser } from '../services/auth.service.ts'

export async function login(req: Request, res: Response): Promise<void> {

}

export async function register(
  req: Request<{}, {}, CreateUserInput>, 
  res: Response<{message: string, user?: UserResponse}>,
  next: NextFunction
): Promise<void> { 
  try {
    const newUser = await createUser(req.body);
    res.status(201).json({ message: 'User berhasil dibuat', user: newUser });
  } catch (error) {
    next(error);
  }
}


export async function logout(_req: Request, res: Response): Promise<void> {

}
