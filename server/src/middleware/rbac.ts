import { Request, Response, NextFunction } from 'express';

export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (req.user.roleName === 'Super Admin' || roles.includes(req.user.roleName)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: 'ທ່ານບໍ່ມີສິດເຂົ້າເຖິງການດຳເນີນການນີ້ (Forbidden: Insufficient role permissions)'
    });
  };
};

export const requirePermission = (permissionCode: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (
      req.user.roleName === 'Super Admin' ||
      req.user.permissions.includes(permissionCode) ||
      req.user.permissions.includes('ALL')
    ) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: `ທ່ານບໍ່ມີສິດໃນການດຳເນີນການ: ${permissionCode} (Forbidden: Missing permission)`
    });
  };
};
