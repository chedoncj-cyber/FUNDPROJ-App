// Allow CSS side-effect imports in TypeScript (e.g. import './globals.css')
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
