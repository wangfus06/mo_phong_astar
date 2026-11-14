declare module '*.mjs' {
  const createModule: () => Promise<Record<string, (...args: any[]) => any>>;
  export default createModule;
}
