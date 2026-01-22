import bcryptjs from "bcryptjs";

export const hashPassword = async (password) => {
  return await bcryptjs.hash(password,12);
};

export const comparePassword = async (password,hashPassword) => {
  return await bcryptjs.compare(password,hashPassword);
};