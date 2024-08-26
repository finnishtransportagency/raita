export const asyncWait = async (time: number) =>
  new Promise(resolve => setTimeout(() => resolve(true), time));
