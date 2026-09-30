import { Router } from 'express';
import { notImplemented } from '../../utils/asyncHandler';

export const packingBagsRouter = Router();

packingBagsRouter.get('/', notImplemented('Packing bags', 'list'));
packingBagsRouter.post('/', notImplemented('Packing bags', 'create batch'));
packingBagsRouter.post('/:id/use', notImplemented('Packing bags', 'use batch'));
