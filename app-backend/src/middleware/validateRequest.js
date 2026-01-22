import { validator } from '../utils/validator.js';

export const validateRequest = (validator) => {
  return (req,res,next) => {
    if(!validator(req)) {
      return res.status(400).json({message:"Invalid request data"});
    }
    next();
  }
}