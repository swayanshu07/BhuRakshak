from pathlib import Path
import math
import glob

import numpy as np
import rasterio
import geopandas as gpd
from shapely.geometry import Point


# ============================================================
# BHURAKSHAK GEOSPATIAL ENGINE
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

DATA_DIR = PROJECT_ROOT / "data"
GEODATA_DIR = DATA_DIR / "geodata"
WORLDCOVER_DIR = GEODATA_DIR / "worldcover"


DEM_PATH = GEODATA_DIR / "NER_SRTM_DEM.tif"
SLOPE_PATH = GEODATA_DIR / "NER_SRTM_SLOPE.tif"

MINING_PATH = GEODATA_DIR / "NER_mining_features.gpkg"
RIVER_PATH = GEODATA_DIR / "NER_river_features.gpkg"


# ============================================================
# GLOBAL DATA
# ============================================================

_dem = None
_slope = None
_mining = None
_river = None
_worldcover = []


# ============================================================
# INITIALIZATION
# ============================================================

def initialize_geospatial_data():
    """
    Load all geospatial layers once when the FastAPI application starts.
    """

    global _dem
    global _slope
    global _mining
    global _river
    global _worldcover

    print("\n" + "=" * 70)
    print("BHURAKSHAK GEOSPATIAL ENGINE")
    print("=" * 70)

    # --------------------------------------------------------
    # DEM
    # --------------------------------------------------------

    if not DEM_PATH.exists():
        raise FileNotFoundError(
            f"DEM not found: {DEM_PATH}"
        )

    _dem = rasterio.open(DEM_PATH)

    print("✅ DEM loaded")
    print("   ", DEM_PATH)


    # --------------------------------------------------------
    # SLOPE
    # --------------------------------------------------------

    if not SLOPE_PATH.exists():
        raise FileNotFoundError(
            f"Slope raster not found: {SLOPE_PATH}"
        )

    _slope = rasterio.open(SLOPE_PATH)

    print("✅ Slope loaded")
    print("   ", SLOPE_PATH)


    # --------------------------------------------------------
    # MINING
    # --------------------------------------------------------

    if not MINING_PATH.exists():
        raise FileNotFoundError(
            f"Mining layer not found: {MINING_PATH}"
        )

    _mining = gpd.read_file(MINING_PATH)

    if _mining.empty:
        raise RuntimeError(
            "Mining layer is empty."
        )

    if _mining.crs is None:
        raise RuntimeError(
            "Mining layer has no CRS."
        )

    print(
        f"✅ Mining features loaded: "
        f"{len(_mining):,}"
    )


    # --------------------------------------------------------
    # RIVERS
    # --------------------------------------------------------

    if not RIVER_PATH.exists():
        raise FileNotFoundError(
            f"River layer not found: {RIVER_PATH}"
        )

    _river = gpd.read_file(RIVER_PATH)

    if _river.empty:
        raise RuntimeError(
            "River layer is empty."
        )

    if _river.crs is None:
        raise RuntimeError(
            "River layer has no CRS."
        )

    print(
        f"✅ River features loaded: "
        f"{len(_river):,}"
    )


    # --------------------------------------------------------
    # WORLDCOVER
    # --------------------------------------------------------

    worldcover_paths = sorted(
        glob.glob(
            str(WORLDCOVER_DIR / "*.tif")
        )
    )

    print(
        f"WorldCover files found: "
        f"{len(worldcover_paths)}"
    )

    for path in worldcover_paths:

        try:

            src = rasterio.open(path)

            _worldcover.append(src)

            print(
                "   ✅",
                Path(path).name
            )

        except Exception as exc:

            print(
                "   ❌ Could not open:",
                path,
                exc
            )


    if len(_worldcover) == 0:

        raise RuntimeError(
            "No WorldCover tiles found."
        )


    print()
    print(
        f"✅ WorldCover loaded: "
        f"{len(_worldcover)}/10 tiles"
    )

    print("=" * 70)
    print("GEOSPATIAL ENGINE READY")
    print("=" * 70)


# ============================================================
# VALIDATE COORDINATES
# ============================================================

def validate_coordinates(lat: float, lon: float):

    if not math.isfinite(lat):
        raise ValueError("Latitude must be finite.")

    if not math.isfinite(lon):
        raise ValueError("Longitude must be finite.")

    if lat < -90 or lat > 90:
        raise ValueError(
            "Latitude must be between -90 and 90."
        )

    if lon < -180 or lon > 180:
        raise ValueError(
            "Longitude must be between -180 and 180."
        )


# ============================================================
# RASTER VALUE
# ============================================================

def _read_raster_value(src, lat: float, lon: float):

    try:

        row, col = src.index(
            lon,
            lat
        )

        if (
            row < 0
            or row >= src.height
            or col < 0
            or col >= src.width
        ):
            return None

        value = src.read(
            1,
            window=(
                (
                    row,
                    row + 1
                ),
                (
                    col,
                    col + 1
                )
            )
        )[0, 0]

        if src.nodata is not None:

            if np.isclose(
                value,
                src.nodata
            ):
                return None

        if not np.isfinite(value):
            return None

        return float(value)

    except Exception:

        return None


# ============================================================
# ELEVATION
# ============================================================

def get_elevation(lat: float, lon: float):

    validate_coordinates(
        lat,
        lon
    )

    value = _read_raster_value(
        _dem,
        lat,
        lon
    )

    if value is None:
        raise ValueError(
            "Elevation data unavailable "
            f"at {lat}, {lon}."
        )

    return value


# ============================================================
# SLOPE
# ============================================================

def get_slope(lat: float, lon: float):

    validate_coordinates(
        lat,
        lon
    )

    value = _read_raster_value(
        _slope,
        lat,
        lon
    )

    if value is None:
        raise ValueError(
            "Slope data unavailable "
            f"at {lat}, {lon}."
        )

    return value


# ============================================================
# LAND COVER
# ============================================================

def get_land_cover(lat: float, lon: float):

    validate_coordinates(
        lat,
        lon
    )

    for src in _worldcover:

        bounds = src.bounds

        if not (
            bounds.left <= lon <= bounds.right
            and
            bounds.bottom <= lat <= bounds.top
        ):
            continue

        value = _read_raster_value(
            src,
            lat,
            lon
        )

        if value is None:
            continue

        return int(round(value))

    raise ValueError(
        "WorldCover data unavailable "
        f"at {lat}, {lon}."
    )


# ============================================================
# DISTANCE TO FEATURE
# ============================================================

def _distance_to_layer(
    lat: float,
    lon: float,
    layer
):

    # Project to a metric CRS so distance is in metres.
    point = gpd.GeoDataFrame(
        geometry=[
            Point(lon, lat)
        ],
        crs="EPSG:4326"
    )

    point_metric = point.to_crs(
        "EPSG:6933"
    )

    layer_metric = layer.to_crs(
        "EPSG:6933"
    )

    # GeoPandas nearest spatial lookup.
    nearest = gpd.sjoin_nearest(
        point_metric,
        layer_metric,
        how="left",
        distance_col="_distance_m"
    )

    if nearest.empty:
        return None

    distance = nearest["_distance_m"].iloc[0]

    if distance is None:
        return None

    if not np.isfinite(distance):
        return None

    return float(distance)


# ============================================================
# DISTANCE TO MINE
# ============================================================

def get_distance_to_mine(
    lat: float,
    lon: float
):

    value = _distance_to_layer(
        lat,
        lon,
        _mining
    )

    if value is None:
        raise ValueError(
            "Mining distance unavailable."
        )

    return value


# ============================================================
# DISTANCE TO RIVER
# ============================================================

def get_distance_to_river(
    lat: float,
    lon: float
):

    value = _distance_to_layer(
        lat,
        lon,
        _river
    )

    if value is None:
        raise ValueError(
            "River distance unavailable."
        )

    return value


# ============================================================
# COMPLETE LOCATION FEATURES
# ============================================================

def extract_location_features(
    lat: float,
    lon: float
):

    validate_coordinates(
        lat,
        lon
    )

    elevation = get_elevation(
        lat,
        lon
    )

    slope = get_slope(
        lat,
        lon
    )

    land_cover = get_land_cover(
        lat,
        lon
    )

    distance_to_mine_m = get_distance_to_mine(
        lat,
        lon
    )

    distance_to_river_m = get_distance_to_river(
        lat,
        lon
    )

    return {
        "elevation": elevation,
        "slope": slope,
        "land_cover": land_cover,
        "distance_to_mine_m": distance_to_mine_m,
        "distance_to_river_m": distance_to_river_m,
    }


# ============================================================
# HEALTH CHECK
# ============================================================

def geospatial_health():

    return {
        "dem": _dem is not None,
        "slope": _slope is not None,
        "mining": _mining is not None,
        "river": _river is not None,
        "worldcover_tiles": len(_worldcover),
    }
