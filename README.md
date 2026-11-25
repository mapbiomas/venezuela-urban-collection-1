![MapBiomas Venezuela](https://raw.githubusercontent.com/mapbiomas/venezuela-all-initiatives/main/mapbiomas-venezuela.png)

[![Back to Venezuela All Initiatives](https://img.shields.io/badge/←%20Venezuela%20All%20Initiatives-gray?style=for-the-badge)](https://github.com/mapbiomas/venezuela-all-initiatives)

# MapBiomas Venezuela

_**Urban Mapping Module — Collection 1**_

This repository contains Google Earth Engine scripts for remapping land cover within urban and peri-urban areas in Venezuela and summarizing urban area across South America.

## Repository Structure

```text
venezuela-urban-collection-1/
    ├── 01-urban-areas-from-coverage.js
    ├── stats-per-city.js
    └── stats-per-country.js
```

## Scripts

| Script | Input and processing | Output |
| --- | --- | --- |
| [Urban areas from coverage](./01-urban-areas-from-coverage.js) | Applies separate class remaps to the 2023 Venezuela Collection 2 land-cover band using rasterized UyPU boundaries and the AU/APU raster mask. Mask value 1 represents urban areas and value 2 represents peri-urban areas. | Two remapped classifications and the AU/APU mask as Earth Engine image assets at 30 m. |
| [City statistics](./stats-per-city.js) | Measures the area of class `24` within city polygons and multipolygons for every band in the 2000–2023 South America urban asset. | Area CSV and filtered city boundaries as a Shapefile in Google Drive. |
| [Country statistics](./stats-per-country.js) | Measures the area of class `24` over the configured country boundaries for every band in the same South America urban asset. | Area CSV in Google Drive. |

The two statistics scripts run independently from the Venezuela remap. They sum urban pixel area at 30 m and report it in square meters. The `year` field contains the input band name, such as `classification_2023`.

## Getting Started

1. Open the relevant script in the [Google Earth Engine Code Editor](https://code.earthengine.google.com/) and confirm access to its raster and vector assets.
2. For the Venezuela remap, review the boundary assets, `yearTo`, and export asset IDs. Update the export names if you change the year. For statistics, review the reporting boundaries and the Google Drive destination.
3. Run the script, inspect the preview or console output, and start the exports from **Tasks**.

> [!NOTE]
> The Venezuela remap passes `roi`, a feature collection, to `clip()`. Review those calls when running the script. Earth Engine documents [`clipToCollection()`](https://developers.google.com/earth-engine/apidocs/ee-image-cliptocollection) for this input type.
