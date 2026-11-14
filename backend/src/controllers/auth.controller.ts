import type { Request, Response, NextFunction } from 'express'
import type { registerUserInput, loginUserInput } from '../schemas/user.schema.ts'
import type { UserRegisterResponse, UserLoginResponse } from '../types/auth.type.ts';
import { registerUser, loginUser } from '../services/auth.service.ts'

export async function login(
  req: Request<{}, {}, loginUserInput>, 
  res: Response<{message: string, user?: UserLoginResponse}>, 
  next: NextFunction
): Promise<void> {
  try {
    const user = await loginUser(req.body);
    res.status(200).json({ message: 'Login berhasil', user });
  } catch (error) {
    next(error);
  }
}

export async function register(
  req: Request<{}, {}, registerUserInput>, 
  res: Response<{message: string, user?: UserRegisterResponse}>,
  next: NextFunction
): Promise<void> { 
  try {
    const newUser = await registerUser(req.body);
    res.status(201).json({ message: 'User berhasil dibuat', user: newUser });
  } catch (error) {
    next(error);
  }
}


export async function logout(_req: Request, res: Response): Promise<void> {

}
