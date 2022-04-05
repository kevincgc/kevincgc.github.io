let scatterplot, linePlot;
let data, geojson, regions;
let scatterplot_attribute = 'Happiness Score'
let map;
let selectedProjection = "geoNaturalEarth";
let selectedYear = 2020;
let selectedCountries = [0, 0, 0];
let selectedRegion, regionColumn = '';
let filteredRegionIds = [];
let yearFilteredData;
let happinessDist, attributeDist;

const colors = ['#a217dc', '#01c5a9', '#1437FF'];

//Load data from CSV file asynchronously and render chart
Promise.all([
    d3.csv('data/happiness_data_with_percentile.csv'),
    d3.json('data/map.json'),
    d3.csv('data/regions.csv')
]).then(_data => {
    data = _data[0];
    geojson = _data[1];
    regions = _data[2];
    data.forEach(d => {
        Object.keys(d).forEach(attr => {
            if (attr !== 'Country name' && attr !== 'id') {
                d[attr] = +d[attr];
            }
        });
    });

    map = new GeoMap({
        parentElement: '#vis-map'
    }, data, geojson);
    map.updateVis();

    // Radar plot
    radarplot = showRadarPlot(data);
    radarplot.updateVis();

    yearFilteredData = data.filter(d => d.year === selectedYear)

    happinessDist = new HappinessDistribution({
        parentElement: '#scatterplot',
        attribute_selected: scatterplot_attribute
        // Optional: other configurations
    }, yearFilteredData, colors);

    happinessDist.updateVis();

    scatterplot = new Scatterplot({
        parentElement: '#scatterplot',
        attribute_selected: scatterplot_attribute
        // Optional: other configurations
    }, yearFilteredData, regions);

    scatterplot.updateVis();

    attributeDist = new AttributeDistribution({
        parentElement: '#scatterplot',
        attribute_selected: scatterplot_attribute
        // Optional: other configurations
    }, yearFilteredData, colors);

    attributeDist.updateVis();

    const filteredData = data.sort((a, b) => a.year - b.year);

    linePlot = new LineChart({
        parentElement: '#line_chart_gdp',
        attribute: 'Log GDP per capita'
        // Optional: other configurations
    }, filteredData);


    linePlot.updateVis();

    selectRegion('', '');
});

d3.selectAll('#scatter-plot-selector').on('change', e => {
    scatterplot_attribute = e.target.value;

    happinessDist.updateVis();
    scatterplot.updateVis();
    attributeDist.updateVis();

    linePlot.updateVis();
})

// Draw the radar plot
function showRadarPlot(data) {
    const containerWidth = 500;
    const containerHeight = 500;

    const parentElement = '#radarplot'

    const config = {
        parentElement,
        containerWidth,
        containerHeight,
        colors
    };

    return new RadarPlot(config, data, onRadarPlotPointClicked);
}

// Update which countries and year to filter radar plot data
// countriesSelected: Array<string>
// yearSelected: string
updateRadarPlot = (countriesSelected, yearSelected) => {
    radarplot.data = data;
    radarplot.updateVis(countriesSelected, yearSelected);
}

// Called by radar plot when a point is clicked
// event: mouseclick
// d: data (entire row corresponding to data)
// metric: string (the axis of data clicked e.g. Freedom)
onRadarPlotPointClicked = (event, d, metric) => {
    event.stopPropagation();

    console.log("Radar Plot point clicked:\n", metric, d);

    // TODO update other graphs based on d (data)
}

d3.select('#projection-selector').on('change', function () {
    selectedProjection = d3.select(this).property('value');
    map.updateVis();
});

// Event slider for input slider
d3.select('#year-slider').on('input', function () {
    // Update visualization
    selectedYear = parseInt(this.value);

    // Update label
    d3.select('#year-value').text(this.value);

    yearFilteredData = data.filter(d => d.year === selectedYear)

    happinessDist.data = yearFilteredData;
    happinessDist.updateVis();

    scatterplot.data = yearFilteredData;
    scatterplot.updateVis();

    attributeDist.data = yearFilteredData;
    attributeDist.updateVis();

    updateRadarPlot(selectedCountries, selectedYear);

    map.updateVis();
});

function updateSelection(d) {
    // Update filter with value
    if (selectedCountries.includes(d)) {
    selectedCountries[selectedCountries.indexOf(d)] = 0;
} else if (selectedCountries.includes(0)) {
    selectedCountries[selectedCountries.indexOf(0)] = d;
}

    updateRadarPlot(selectedCountries, selectedYear);
    scatterplot.selectedCountries = selectedCountries;
    scatterplot.updateVis();

    linePlot.updateVis()

    updateRadarPlot(selectedCountries, selectedYear);

    map.updateVis();
}

function selectRegion(region, column) {
    selectedRegion = region;
    regionColumn = column;

    let filteredRegions = regions.filter(d => d[regionColumn] === selectedRegion);
    filteredRegionIds = filteredRegions.map(d => d['country-code']);

    happinessDist.updateVis();
    scatterplot.updateVis();
    attributeDist.updateVis();

    linePlot.updateVis();

    map.updateVis();
}