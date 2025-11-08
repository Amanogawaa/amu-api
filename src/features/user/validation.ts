import Joi from 'joi';

export const updateUserProfileSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  photoURL: Joi.string().uri().optional(),
});

export const uploadProfilePictureSchema = Joi.object({
  file: Joi.any().required(),
});
