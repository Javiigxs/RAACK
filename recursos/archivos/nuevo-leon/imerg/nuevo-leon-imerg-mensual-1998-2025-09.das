Attributes {
  time {
    String _CoordinateAxisType "Time";
    Float64 actual_range 8.836128e+8, 1.7566848e+9;
    String axis "T";
    String ioos_category "Time";
    String long_name "Time";
    String standard_name "time";
    String time_origin "01-JAN-1970 00:00:00";
    String units "seconds since 1970-01-01T00:00:00Z";
  }
  latitude {
    String _CoordinateAxisType "Lat";
    Float32 actual_range -89.95, 89.95;
    String axis "Y";
    String ioos_category "Location";
    String long_name "Latitude";
    String standard_name "latitude";
    String units "degrees_north";
  }
  longitude {
    String _CoordinateAxisType "Lon";
    Float32 actual_range -179.95, 179.95;
    String axis "X";
    String ioos_category "Location";
    String long_name "Longitude";
    String standard_name "longitude";
    String units "degrees_east";
  }
  precipitation {
    String colorBar "BlueWhiteRed";
    Float64 colorBarMaximum 500.0;
    Float64 colorBarMinimum 0.0;
    String colorBarScale "Linear";
    String ioos_category "Meteorology";
    String long_name "precipitation";
    String Product "monthly accumulated precipitation";
    String standard_name "monthly accumulated precipitation";
    String units "mm";
  }
  precipitationQualityIndex {
    String colorBar "BlueWhiteRed";
    Float64 colorBarMaximum 200.0;
    Float64 colorBarMinimum 0.0;
    String colorBarScale "Linear";
    String ioos_category "Meteorology";
    String long_name "Precipitation Quality Index";
    String Product "precipitation quality index";
    String units "none";
  }
  randomError {
    String colorBar "BlueWhiteRed";
    Float64 colorBarMaximum 100.0;
    Float64 colorBarMinimum 0.0;
    String colorBarScale "Linear";
    String ioos_category "Meteorology";
    String long_name "Monthly Accumulated Precipitation Random Error";
    String Product "Accumulated Random Error";
    String units "mm";
  }
  NC_GLOBAL {
    String _NCProperties "version=2,netcdf=4.7.4,hdf5=1.8.12";
    String cdm_data_type "Grid";
    String Composite_date "20250901";
    String contact "Dan Otis - dotis@usf.edu";
    String Conventions "COARDS, CF-1.6, ACDD-1.3";
    String CreationDate "02/09/2026 20:48:16";
    String creator_email "dotis@usf.edu";
    String creator_name "DOTIS";
    String creator_type "institution";
    Float64 Easternmost_Easting 179.95;
    Float64 geospatial_lat_max 89.95;
    Float64 geospatial_lat_min -89.95;
    Float64 geospatial_lat_resolution 0.1;
    String geospatial_lat_units "degrees_north";
    Float64 geospatial_lon_max 179.95;
    Float64 geospatial_lon_min -179.95;
    Float64 geospatial_lon_resolution 0.09999999999999999;
    String geospatial_lon_units "degrees_east";
    String history "2026-11-15T00:53:47Z (local files)
2026-11-15T00:53:47Z https://erddap.marine.usf.edu/erddap/griddap/IMERG_monthly_global_precip.das";
    String Image_size "1800 pixels(N-S) x 3600 pixels(E-W)";
    String infoUrl "imars.usf.edu";
    String institution "NASA Global Precipitation Measurement Mission";
    String keywords "GPM, IMERG, NASA, precipitation";
    String keywords_vocabulary "GCMD Science Keywords";
    String Lat_Lon_Limits "-90N to 90N -180E to 180E";
    String license "The data may be used and redistributed for free but is not intended
for legal use, since it may contain inaccuracies. Neither the data
Contributor, ERD, NOAA, nor the United States Government, nor any
of their employees or contractors, makes any warranty, express or
implied, including warranties of merchantability and fitness for a
particular purpose, or assumes any legal liability for the accuracy,
completeness, or usefulness, of this information.";
    Float64 Northernmost_Northing 89.95;
    String Original_Image_Format "HDF5";
    String Original_Image_Source "NASA GPM group at Goddard Space Flight Center";
    String Processing_and_binning "USF IMaRS";
    String Product_URL "https://gpm.nasa.gov/resources/documents/imerg-v07-technical-documentation";
    String Projection "Equidistant Cylindrical";
    String Region "global";
    String Sensor "Various";
    String sourceUrl "(local files)";
    Float64 Southernmost_Northing -89.95;
    String standard_name_vocabulary "CF Standard Name Table v70";
    String summary "NASA GPM IMERG Global Monthly Precipitation";
    String time_coverage_end "2025-09-01T00:00:00Z";
    String time_coverage_start "1998-01-01T00:00:00Z";
    String Time_interval "Monthly";
    String title "Global Monthly Precipitation (NASA GPM IMERG)";
    Float64 Westernmost_Easting -179.95;
  }
}
