import { Router } from 'express';
import { notImplemented } from '../../utils/asyncHandler';

export const rollIntakeRouter = Router();

rollIntakeRouter.get('/', notImplemented('Roll intake', 'list'));
rollIntakeRouter.post('/', notImplemented('Roll intake', 'create'));
