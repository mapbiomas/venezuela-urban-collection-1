/**
 * @fileoverview Calculate urban area by city from the South America urban collection.
 * Sum the area of class 24 pixels in each city polygon for every input band at 30 m.
 * Export the statistics as CSV and the filtered city boundaries as a Shapefile.
 */

// =========================================================================
// 1. CARGA DE ASSETS (IMAGEN RÁSTER Y VECTORES)
// =========================================================================

// Asset mapbiomas Urbano
/** @type {ee.Image} Multiband South America urban classification for 2000–2023. */
var imageUrban = ee.Image(
  "projects/mapbiomas-global/assets/SOUTH_AMERICA/COLLECTION1/sulamerica_v8_urban_2000_to_2023_v3",
);

// Asset of regions - from vector to raster
/** @type {ee.FeatureCollection} Input city boundaries before filtering geometry types. */
var ciudadesRaw = ee.FeatureCollection(
  "projects/mapbiomasurbanosmesachica/assets/ciudades_suramerica",
);

// --- CORRECCIÓN DEL FILTRO DE GEOMETRÍA ---
// Evaluamos el tipo de geometría de cada elemento y filtramos solo polígonos
/** @type {ee.FeatureCollection} Polygon and multipolygon features used as reporting units. */
var ciudades = ciudadesRaw
  .map(function (f) {
    return f.set("geom_type", f.geometry().type());
  })
  .filter(
    ee.Filter.or(
      ee.Filter.eq("geom_type", "Polygon"),
      ee.Filter.eq("geom_type", "MultiPolygon"),
    ),
  );

// =========================================================================
// 2. PROCESAMIENTO DE ESTADÍSTICAS DE ÁREA URBANA
// =========================================================================

/** @type {ee.List} Classification band names used to iterate through the input image. */
var bands = imageUrban.bandNames();

/**
 * Urban area measurements in square meters by city and input classification band.
 * The year property stores the band name, such as classification_2023.
 * @type {ee.FeatureCollection}
 */
var areas = ee
  .FeatureCollection(
    bands.map(function (b) {
      var urban = imageUrban.select([b]).eq(24);

      var areaImage = ee.Image.pixelArea().updateMask(urban);

      return areaImage
        .reduceRegions({
          collection: ciudades,
          reducer: ee.Reducer.sum(),
          scale: 30,
        })
        .map(function (f) {
          return f.set("year", b);
        });
    }),
  )
  .flatten();

// Imprimir una muestra en la consola para verificación
print("Muestra de estadísticas (primeros 2 elementos):", areas.limit(2));

// Quitar la geometría para optimizar la exportación del CSV
/** @type {ee.FeatureCollection} City statistics with properties retained and geometry removed. */
var areas_noGeom = areas.map(function (f) {
  return ee.Feature(null, f.toDictionary());
});

// =========================================================================
// 3. SECCIÓN DE EXPORTACIÓN A GOOGLE DRIVE
// =========================================================================

// Exportar el archivo CSV con las estadísticas de las áreas urbanas
Export.table.toDrive({
  collection: areas_noGeom,
  description: "Stats_v3_RMs",
  folder: "GEE_Export_AmSul",
  fileNamePrefix: "Stats_v3_RMs",
  fileFormat: "CSV",
});

// Exportar la capa vectorial limpia en formato Shapefile (SHP)
Export.table.toDrive({
  collection: ciudades,
  description: "Export_Ciudades_SHP",
  folder: "GEE_Export_AmSul",
  fileNamePrefix: "ciudades_suramerica_vector",
  fileFormat: "SHP",
});

// =========================================================================
// 4. SECCIÓN DE VISUALIZACIÓN EN EL MAPA
// =========================================================================

// Centrar el mapa en la colección de ciudades de Sudamérica (Zoom 4)
Map.centerObject(ciudades, 4);

// Visualizar las Ciudades (Vectores) con bordes azules y fondo transparente
var ciudadesEstilo = ciudades.style({
  color: "blue",
  fillColor: "00000000",
  width: 2,
});
Map.addLayer(ciudadesEstilo, {}, "Límites de Ciudades");

// Visualizar la Mancha Urbana (Ráster) para el año más reciente (2023)
var ultimaBanda = imageUrban.select(["classification_2023"]);
var urban2023 = ultimaBanda.eq(24).selfMask();

// Añadir la mancha urbana al mapa con una paleta de color naranja/rojo
Map.addLayer(urban2023, { palette: ["#ff4500"] }, "Mancha Urbana 2023");
