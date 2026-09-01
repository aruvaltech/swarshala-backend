import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

export class AuthController {
    async signup(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.signup(req.body);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.login(req.body, req.tenant!.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async adminLogin(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.adminLogin(req.body.email, req.body.password);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.refresh(req.body.refreshToken);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            await authService.logout(req.body.refreshToken);
            res.json({ message: 'Logged out' });
        } catch (err) {
            next(err);
        }
    }

    async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.forgotPassword(req.body.email, req.tenant!.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.resetPassword(req.body.token, req.body.newPassword);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async inviteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.inviteUser(req.body, req.tenant!.id, req.user!.id);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }
}

export const authController = new AuthController();
