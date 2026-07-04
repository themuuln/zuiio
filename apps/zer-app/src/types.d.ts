// CSS Modules
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Side-effect imports without types
declare module "react-native-url-polyfill/auto";
declare module "expo-sqlite/localStorage/install";

// CSS side-effect imports
declare module "*.css";
