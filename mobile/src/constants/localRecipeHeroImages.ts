import { Image, Platform } from "react-native";

const pancakesBerries = require("../../assets/images/recipe-heroes/pancakes-berries-maple.png");
const chickenThighsLemon = require("../../assets/images/recipe-heroes/chicken-thighs-lemon-skillet.png");

/**
 * Metro: native `require()` is a number (resolved via `Image.resolveAssetSource`); on web, Expo
 * emits a `{ uri, width?, height? }` (or a string) — `Image.resolveAssetSource` is not available.
 */
function localAssetToUri(asset: unknown): string {
  if (Platform.OS === "web") {
    if (typeof asset === "string") return asset;
    if (asset && typeof asset === "object" && "uri" in asset && typeof (asset as { uri: string }).uri === "string") {
      return (asset as { uri: string }).uri;
    }
  }
  const resolve = (Image as typeof Image & { resolveAssetSource?: (a: unknown) => { uri: string } }).resolveAssetSource;
  if (typeof resolve === "function") {
    return resolve(asset).uri;
  }
  if (typeof asset === "string") return asset;
  if (asset && typeof asset === "object" && "uri" in asset && typeof (asset as { uri: string }).uri === "string") {
    return (asset as { uri: string }).uri;
  }
  throw new Error("Could not resolve local recipe hero image URI");
}

/**
 * `file://` or asset URLs from Metro, suitable for `<Image source={{ uri }} />` recipe heroes.
 */
export const localRecipeHeroUris = {
  pancakes: localAssetToUri(pancakesBerries),
  chickenMain: localAssetToUri(chickenThighsLemon),
} as const;
