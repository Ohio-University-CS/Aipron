import { Image } from "react-native";

const pancakesBerries = require("../../assets/images/recipe-heroes/pancakes-berries-maple.png");
const chickenThighsLemon = require("../../assets/images/recipe-heroes/chicken-thighs-lemon-skillet.png");

/**
 * `file://` or asset URLs from Metro, suitable for `<Image source={{ uri }} />` recipe heroes.
 */
export const localRecipeHeroUris = {
  pancakes: Image.resolveAssetSource(pancakesBerries).uri,
  chickenMain: Image.resolveAssetSource(chickenThighsLemon).uri,
} as const;
