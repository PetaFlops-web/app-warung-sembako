import type { Request, Response, NextFunction } from 'express';
import type { BodyRequest } from '../types/http.type.ts';
import type { registerUserInput, loginUserInput, refreshTokenInput } from '../schemas/user.schema.ts'
import type { UserRegisterResponse, UserLoginResponse, TokenPairResponse, UserProfileResponse } from '../types/auth.type.ts';
import { registerUser, loginUser, refreshSession, logoutSession, getCurrentUser } from '../services/auth.service.ts'

export async function login(
  req: BodyRequest<loginUserInput>, 
  res: Response<{ pengguna: UserLoginResponse }>, 
  next: NextFunction
): Promise<void> {
  try {
    const pengguna = await loginUser(req.body);
    res.status(200).json({ pengguna });
  } catch (error) {
    next(error);
  }
}

export async function register(
  req: BodyRequest<registerUserInput>, 
  res: Response<{ pengguna: UserRegisterResponse }>,
  next: NextFunction
): Promise<void> { 
  try {
    const pengguna = await registerUser(req.body);
    res.status(201).json({ pengguna });
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: BodyRequest<refreshTokenInput>,
  res: Response<{ pengguna: TokenPairResponse }>,
  next: NextFunction
): Promise<void> {
  try {
    const pengguna = await refreshSession(req.body.token_penyegaran);
    res.status(200).json({ pengguna });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: BodyRequest<refreshTokenInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await logoutSession(req.body.token_penyegaran);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function me(
  req: Request,
  res: Response<{ pengguna: UserProfileResponse }>,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.sub ?? 0;
    const pengguna = await getCurrentUser(userId);
    res.status(200).json({ pengguna });
  } catch (error) {
    next(error);
  }
}

