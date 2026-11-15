Attributes {
  time {
    String _CoordinateAxisType "Time";
    Float64 actual_range 3.471552e+8, 1.738368e+9;
    String axis "T";
    String calendar "gregorian";
    String ioos_category "Time";
    String long_name "Time";
    String standard_name "time";
    String time_origin "01-JAN-1970 00:00:00";
    String units "seconds since 1970-01-01T00:00:00Z";
  }
  latitude {
    String _CoordinateAxisType "Lat";
    Float32 actual_range -49.975, 49.975;
    String axis "Y";
    String ioos_category "Location";
    String long_name "Latitude";
    String standard_name "latitude";
    String units "degrees_north";
  }
  longitude {
    String _CoordinateAxisType "Lon";
    Float32 actual_range -179.975, 179.975;
    String axis "X";
    String ioos_category "Location";
    String long_name "Longitude";
    String standard_name "longitude";
    String units "degrees_east";
  }
  precip {
    Float32 _FillValue -9999.0;
    Float64 colorBarMaximum 400.0;
    Float64 colorBarMinimum 0.0;
    String ioos_category "Meteorology";
    String long_name "Precipitation";
    Float32 missing_value -9999.0;
    String standard_name "lwe_precipitation_rate";
    String time_step "month";
    String units "mm/month";
  }
  NC_GLOBAL {
    String acknowledgements "The Climate Hazards Group InfraRed Precipitation with Stations development process was carried out through U.S. Geological Survey (USGS) cooperative agreement #G09AC000001 \"Monitoring and Forecasting Climate, Water and Land Use for Food Production in the Developing World\" with funding from: U.S. Agency for International Development Office of Food for Peace, award #AID-FFP-P-10-00002 for \"Famine Early Warning Systems Network Support,\" the National Aeronautics and Space Administration Applied Sciences Program, Decisions award #NN10AN26I for \"A Land Data Assimilation System for Famine Early Warning,\" SERVIR award #NNH12AU22I for \"A Long Time-Series Indicator of Agricultural Drought for the Greater Horn of Africa,\" The National Oceanic and Atmospheric Administration award NA11OAR4310151 for \"A Global Standardized Precipitation Index supporting the US Drought Portal and the Famine Early Warning System Network,\" and the USGS Land Change Science Program.";
    String cdm_data_type "Grid";
    String Conventions "CF-1.6, COARDS, ACDD-1.3";
    String creator_email "pete@geog.ucsb.edu";
    String creator_name "Pete Peterson";
    String creator_type "person";
    String documentation "https://pubs.usgs.gov/ds/832/";
    Float64 Easternmost_Easting 179.975;
    String faq "https://wiki.chc.ucsb.edu/CHIRPS_FAQ";
    Float64 geospatial_lat_max 49.975;
    Float64 geospatial_lat_min -49.975;
    String geospatial_lat_units "degrees_north";
    Float64 geospatial_lon_max 179.975;
    Float64 geospatial_lon_min -179.975;
    String geospatial_lon_units "degrees_east";
    String history "Created by Climate Hazards Group, University of California at Santa Barbara
erd.data@noaa.gov periodically downloads the latest data files from https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_monthly/netcdf/ to NOAA NMFS SWFSC ERD
2026-11-15T00:53:47Z (local files)
2026-11-15T00:53:47Z https://coastwatch.pfeg.noaa.gov/erddap/griddap/chirps20GlobalMonthlyP05.das";
    String infoUrl "https://www.chc.ucsb.edu/data/chirps";
    String institution "UCSB Climate Hazards Group";
    String keywords "barbara, california, chirps, climate, convective, convective precipitation rate, data, group, hazards, infrared, latitude, longitude, meteorology, monthly, precipitation, rain, rainfall, rate, santa, stations, time, university, version, with";
    String license "To the extent possible under the law, Pete Peterson has waived all copyright and related or neighboring rights to CHIRPS. CHIRPS data is in the public domain as registered with Creative Commons. 

The data may be used and redistributed for free but is not intended
for legal use, since it may contain inaccuracies. Neither the data
Contributor, ERD, NOAA, nor the United States Government, nor any
of their employees or contractors, makes any warranty, express or
implied, including warranties of merchantability and fitness for a
particular purpose, or assumes any legal liability for the accuracy,
completeness, or usefulness, of this information.";
    Float64 Northernmost_Northing 49.975;
    String references "Funk, C.C., Peterson, P.J., Landsfeld, M.F., Pedreros, D.H., Verdin, J.P., Rowland, J.D., Romero, B.E., Husak, G.J., Michaelsen, J.C., and Verdin, A.P., 2014, A quasi-global precipitation time series for drought monitoring: U.S. Geological Survey Data Series 832, 4 p., https://dx.doi.org/110.3133/ds832.  Available at https://pubs.usgs.gov/ds/832/";
    String sourceUrl "(local files)";
    Float64 Southernmost_Northing -49.975;
    String standard_name_vocabulary "CF Standard Name Table v70";
    String summary "This dataset has monthly averages of the Climate Hazards Group InfraRed Precipitation with Station data (CHIRPS), which is quasi-global rainfall data set. Spanning 50°;S-50°;N (and all longitudes) and ranging from 1981 to near-present, CHIRPS incorporates our in-house climatology, CHPclim, 0.05°; resolution satellite imagery, and in-situ station data to create a gridded rainfall time series for trend analysis and seasonal drought monitoring. Since 1999, USGS and CHC scientists (supported by funding from USAID, NASA, and NOAA) have developed techniques for producing rainfall maps, especially in areas where surface data is sparse. Estimating rainfall variations in space and time is a key aspect of drought early warning and environmental monitoring. See https://www.nature.com/articles/sdata201566 . See the FAQ at https://wiki.chc.ucsb.edu/CHIRPS_FAQ .";
    String time_coverage_end "2025-02-01T00:00:00Z";
    String time_coverage_start "1981-01-01T00:00:00Z";
    String title "CHIRPS Version 2.0, Precipitation, Global, 0.05°;, Monthly, 1981-present";
    String version "2.0";
    Float64 Westernmost_Easting -179.975;
  }
}
