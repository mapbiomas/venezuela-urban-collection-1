/**
 * @fileoverview Remap MapBiomas Venezuela land cover within urban and peri-urban areas.
 * Build one classification from vector boundaries and another from the AU/APU raster
 * mask. Preview both products and export them with the raster mask at 30 m.
 */

// ==========================
// CONFIGURACIÓN INICIAL
// ==========================
/** @type {string} Asset ID of the urban and peri-urban boundary features. */
var regionAsset = "projects/ee-14-10697/assets/Areas_UyPU_DPT_23052025_ID";
var regionS = ee.FeatureCollection(regionAsset);
var roi = ee.FeatureCollection(regionAsset);

/** @type {ee.Image} Annual land-cover bands from the Venezuela Collection 2 integration. */
var mapbiomasImage = ee.Image(
  "projects/mapbiomas-public/assets/venezuela/collection2/mapbiomas_venezuela_collection2_integration_v1",
);
var palettes = require("users/mapbiomas/modules:Palettes.js");

/** @type {number} Year selected for the input classification band and reference mosaic. */
var yearTo = 2023;
var visYearBand = "classification_" + yearTo;
var baseImage = mapbiomasImage.select(visYearBand);
var proyBase = baseImage.projection();

// ==========================
// MOSAICO DE REFERENCIA
// ==========================
/** @type {ee.Image} Median reference mosaic for the selected year, region, and version. */
var mosaico = ee
  .ImageCollection("projects/mapbiomas-raisg/MOSAICOS/mosaics-pathrow-2")
  .filterMetadata("region_code", "equals", 912)
  .filterMetadata("version", "equals", "5")
  .filterMetadata("year", "equals", yearTo)
  .median();

// ==========================
// MÁSCARA 1: UyPU VECTORIAL RASTERIZADA
// ==========================
/**
 * Rasterized ID_Tipo values on the source classification projection and scale.
 * Value 1 selects urban areas and value 2 selects peri-urban areas.
 * @type {ee.Image}
 */
var mascaraUyPU = roi
  .reduceToImage({
    properties: ["ID_Tipo"],
    reducer: ee.Reducer.first(),
  })
  .clip(roi)
  .reproject({
    crs: proyBase.crs(),
    scale: proyBase.nominalScale(),
  })
  .selfMask();

var palettes = require("users/mapbiomas/modules:Palettes.js");

// ==========================
// MÁSCARA 2: APU-Urbano desde RASTER
// ==========================
/** @type {ee.Image} AU/APU raster aligned to the source projection and scale. */
var mascaraRaster = ee
  .Image("projects/ee-14-10697/assets/AU_APU_2023_RASTER")
  .reproject({ crs: proyBase.crs(), scale: proyBase.nominalScale() })
  .selfMask();

// ==========================
// REMAPEO DE CLASES
// ==========================
/** @type {number[]} Source class IDs shared by both remap lists. */
var originales = [
  3, 4, 5, 6, 9, 11, 12, 13, 15, 18, 21, 23, 24, 25, 27, 29, 30, 31, 32, 33, 50,
  66, 68,
];
/** @type {number[]} Urban destination classes in the order of originales. */
var reclasUrbano = [
  3, 3, 6, 6, 3, 11, 12, 3, 21, 21, 21, 68, 24, 25, 27, 68, 25, 26, 68, 26, 12,
  3, 68,
];
/** @type {number[]} Peri-urban destination classes in the order of originales. */
var reclasPeri = [
  3, 3, 6, 6, 4, 11, 12, 3, 15, 18, 21, 68, 24, 25, 27, 68, 30, 31, 68, 26, 12,
  3, 68,
];

// Remapeo para la máscara UyPU vectorial
var imagenUrbano1 = baseImage
  .remap(originales, reclasUrbano)
  .updateMask(mascaraUyPU.eq(1));
var imagenPeri1 = baseImage
  .remap(originales, reclasPeri)
  .updateMask(mascaraUyPU.eq(2));
/** @type {ee.Image} Remapped land cover within the rasterized vector boundaries. */
var imagenFinal1 = imagenUrbano1.blend(imagenPeri1).selfMask();

// Remapeo para la máscara AU_APU_2023_RASTER
var imagenUrbano2 = baseImage
  .remap(originales, reclasUrbano)
  .updateMask(mascaraRaster.eq(1));
var imagenPeri2 = baseImage
  .remap(originales, reclasPeri)
  .updateMask(mascaraRaster.eq(2));
/** @type {ee.Image} Remapped land cover within the AU/APU raster mask. */
var imagenFinal2 = imagenUrbano2.blend(imagenPeri2).selfMask();

// ==========================
// PALETAS DE COLORES
// ==========================
var coloresUrbano = [
  "#1f8d49",
  "#04381d",
  "#519799",
  "#d6bc74",
  "#ffefc3",
  "#d4271e",
  "#db4d4f",
  "#2532e4",
  "#9c0027",
  "#ffa07a",
];
var coloresPeriurbano = [
  "#a1d8a7",
  "#b2e0b9",
  "#6c977f",
  "#a6c9ce",
  "#f1e6bd",
  "#fff5d6",
  "#fff5d6",
  "#fff5d6",
  "#e79491",
  "#f2b1b3",
  "DBF1FF",
  "#a8aef4",
  "#de7a94",
  "#a3a8dc",
  "#ffd3c6",
];
var colores = coloresUrbano.concat(coloresPeriurbano);

// ==========================
// VISUALIZACIÓN
// ==========================
Map.addLayer(
  mosaico.clip(roi),
  { bands: ["swir1_median", "nir_median", "red_median"], min: 0, max: 4000 },
  "Mosaico Satélite " + yearTo,
);

Map.addLayer(
  baseImage.clip(roi),
  { min: 0, max: 34, palette: palettes.get("classification2") },
  "MapBiomas " + yearTo,
);

Map.addLayer(
  mascaraUyPU,
  { min: 1, max: 2, palette: ["red", "pink"] },
  "Máscara UyPU (vectorial)",
);
Map.addLayer(
  imagenFinal1,
  { min: 0, max: 34, palette: palettes.get("classification2") },
  "Clasificación con UyPU",
);

Map.addLayer(
  mascaraRaster,
  { min: 1, max: 2, palette: ["blue", "lightblue"] },
  "Máscara AU_APU (raster)",
);
Map.addLayer(
  imagenFinal2,
  { min: 0, max: 34, palette: palettes.get("classification2") },
  "Clasificación con AU_APU",
);
Map.addLayer(
  imagenUrbano2,
  { min: 0, max: 34, palette: palettes.get("classification2") },
  "Clasificación Urbano con AU_APU",
);
Map.addLayer(
  imagenPeri2,
  { min: 0, max: 34, palette: palettes.get("classification2") },
  "Clasificación Periurbano con AU_APU",
);

Map.addLayer(roi, { color: "black" }, "UU DPT");

// ==========================
// EXPORTACIÓN
// ==========================
Export.image.toAsset({
  image: imagenFinal1,
  description: "Clasificacion_UyPU_Vectorial_2023",
  assetId:
    "projects/ee-13-10250/assets/MAPBIOMAS-VENEZUELA/Urbano/Urbano/Clasificacion_UyPU_Vectorial",
  scale: 30,
  maxPixels: 1e13,
});

Export.image.toAsset({
  image: imagenFinal2,
  description: "Clasificacion_AU_APU_Raster_2023",
  assetId:
    "projects/ee-13-10250/assets/MAPBIOMAS-VENEZUELA/Urbano/Urbano/Clasificacion_AU_APU_Raster",
  scale: 30,
  maxPixels: 1e13,
});

Export.image.toAsset({
  image: mascaraRaster,
  description: "MascaraAU_APU_Raster",
  assetId:
    "projects/ee-13-10250/assets/MAPBIOMAS-VENEZUELA/Urbano/Urbano/MascaraAU_APU_Raster_2023",
  scale: 30,
  maxPixels: 1e13,
});

print(palettes.get("classification2"));
