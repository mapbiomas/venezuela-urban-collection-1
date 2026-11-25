/**
 * @fileoverview Calculate urban area by country from the South America urban collection.
 * Sum the area of class 24 pixels over the configured boundaries for every band at 30 m
 * and export the statistics to Google Drive as CSV.
 */

// =================================================================
// 1. CARGA DE ACTIVOS (ASSETS)
// =================================================================

// Asset mapbiomas Urbano (Raster)
/** @type {ee.Image} Multiband South America urban classification for 2000–2023. */
var imageUrban = ee.Image(
  "projects/mapbiomas-global/assets/SOUTH_AMERICA/COLLECTION1/sulamerica_v8_urban_2000_to_2023_v3",
);

// NUEVO Asset de Países (Vector)
/** @type {ee.FeatureCollection} Boundary features used as the country reporting units. */
var paises = ee.FeatureCollection(
  "projects/ee-lauraugas/assets/Suramerica_level1_Project",
);

// =================================================================
// 2. PROCESAMIENTO DE ESTADÍSTICAS POR PAÍS
// =================================================================

/** @type {ee.List} Classification band names used to iterate through the input image. */
var bands = imageUrban.bandNames();

/**
 * Urban area measurements in square meters by boundary feature and classification band.
 * The year property stores the input band name.
 * @type {ee.FeatureCollection}
 */
var areas = ee
  .FeatureCollection(
    bands.map(function (b) {
      // Filtramos el valor 24 (Urbano) para el año/banda actual
      var urban = imageUrban.select([b]).eq(24);

      // Calculamos el área de cada píxel (en m²) y aplicamos la máscara urbana
      var areaImage = ee.Image.pixelArea().updateMask(urban);

      // Reducimos las regiones (ahora nivel país)
      // Nota: Si el script falla por memoria, podrías subir el scale a 100 o 300
      return areaImage
        .reduceRegions({
          collection: paises,
          reducer: ee.Reducer.sum(),
          scale: 30,
        })
        .map(function (f) {
          return f.set("year", b);
        });
    }),
  )
  .flatten();

// Imprimir muestra en consola
print("Procesando datos por país...", areas.limit(5));

// Limpiamos geometrías para que el CSV no sea gigante
/** @type {ee.FeatureCollection} Export table with the area and boundary properties. */
var areas_noGeom = areas.map(function (f) {
  return ee.Feature(null, f.toDictionary());
});

// =================================================================
// 3. EXPORTACIÓN
// =================================================================

Export.table.toDrive({
  collection: areas_noGeom,
  description: "Stats_Urbano_Paises_Suramerica",
  folder: "GEE_Export_Paises",
  fileNamePrefix: "Stats_Urbano_Paises_v1",
  fileFormat: "CSV",
});

// =================================================================
// 4. VISUALIZACIÓN EN EL MAPA
// =================================================================

// Visualizamos el año 2023
var urban2023 = imageUrban.select("classification_2023");

Map.addLayer(
  urban2023.updateMask(urban2023.eq(24)),
  { palette: "red" },
  "Capa Urbana 2023",
);
Map.addLayer(
  paises,
  { color: "000000", strokeWidth: 1 },
  "Límites de Países",
  true,
  0.5,
);

Map.centerObject(paises, 3);
Map.setOptions("SATELLITE");
