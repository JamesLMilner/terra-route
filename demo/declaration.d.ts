declare module "*.css" {
  const mapping: Record<string, string>;
  export default mapping;
}

declare module "*.png" {
  const mapping: string;
  export default mapping;
}
