let scatterplot, linePlot;
let data, geojson, regions;
let scatterplot_attribute = 'Happiness Score'
let map, countrySelector;
let selectedProjection = "geoNaturalEarth";
let selectedYear = 2020;
let selectedCountries = [0, 0, 0, 0];
let selectedRegion, regionColumn = '', selectedRegionPercentiles = {};
let filteredRegionIds = [];
let yearFilteredData;
let happinessDist, attributeDist;
let myCountry = null;
let myCountryColor = "#FFA500";
let confidenceLevel = 0.05;

const colors = ['#a217dc', '#01c5a9', '#1437FF', myCountryColor];

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

    scatterplot_attribute = 'Log GDP per capita';

    countrySelector = new CountrySelector({
        parentElement: '#country-selector'
    }, data, geojson)

    countrySelector.updateVis();

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

    handleChartVisiblity();
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

handleChartVisiblity = () => {
    if (myCountry) {
        document.getElementById("charts").style.display = "inline";
    } else {
        document.getElementById("charts").style.display = "none";
    }
}

// Update which countries and year to filter radar plot data
// countriesSelected: Array<string>
// yearSelected: string
updateRadarPlot = (countriesSelected, yearSelected) => {
    radarplot.data = data;
    radarplot.countriesSelected = countriesSelected || [];
    radarplot.yearSelected = yearSelected != null ? yearSelected.toString() : null;
    radarplot.updateVis();
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

    yearFilteredData = data.filter(d => d.year === selectedYear);

    updateRegionData();

    happinessDist.data = yearFilteredData;
    happinessDist.updateVis();

    scatterplot.data = yearFilteredData;
    scatterplot.updateVis();

    attributeDist.data = yearFilteredData;
    attributeDist.updateVis();

    updateRadarPlot(selectedCountries, selectedYear);

    map.updateVis();
});

// Event slider for input slider
d3.select('#ci-slider').on('input', function () {
    // Update visualization
    confidenceLevel = (100 - parseFloat(this.value)) / 100;
    d3.select('#ci-value').text(parseFloat(this.value).toFixed(1));
    scatterplot.updateVis();
});

selectMyCountry = (d) => {
    if (myCountry === d) {
        selectedCountries[3] = 0;
        myCountry = null;
    } else {
        myCountry = d;
        selectedCountries[3] = myCountry;
        document.getElementById("charts").style.display = "inline";
        document.getElementById('unpacking-happiness').scrollIntoView({
            behavior: 'smooth'
        });
    }

    handleChartVisiblity();

    countrySelector.updateVis();
    map.updateVis();
    scatterplot.updateVis();
    linePlot.updateVis();
    updateRadarPlot(selectedCountries, selectedYear);
}

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

function updateRegionData() {
    let filteredRegions = regions.filter(d => d[regionColumn] === selectedRegion);
    filteredRegionIds = filteredRegions.map(d => d['country-code']);

    if (filteredRegions.length > 0) {
        const filteredData = yearFilteredData.filter(d => filteredRegionIds.includes(d.id))

        const meanHappiness = d3.mean(filteredData, d => d["Happiness Score"]);
        const meanGpd = d3.mean(filteredData, d => d["Log GDP per capita"]);
        const meanSocialSupport = d3.mean(filteredData, d => d["Social support"]);
        const meanLifeExpectancy = d3.mean(filteredData, d => d["Healthy life expectancy at birth"]);
        const meanFreedom = d3.mean(filteredData, d => d["Freedom to make life choices"]);
        const meanGenerosity = d3.mean(filteredData, d => d["Generosity"]);
        const meanCorruption = d3.mean(filteredData, d => d["Perceptions of corruption"]);

        selectedRegionPercentiles = {};
        selectedRegionPercentiles['Country name'] = selectedRegion;
        selectedRegionPercentiles['Happiness Score pecentile'] = data.filter(d => d["Happiness Score"] <= meanHappiness).length / data.length * 100
        selectedRegionPercentiles['Log GDP per capita pecentile'] = data.filter(d => d["Log GDP per capita"] <= meanGpd).length / data.length * 100
        selectedRegionPercentiles['Social support pecentile'] = data.filter(d => d["Social support"] <= meanSocialSupport).length / data.length * 100
        selectedRegionPercentiles['Healthy life expectancy at birth pecentile'] = data.filter(d => d["Healthy life expectancy at birth"] <= meanLifeExpectancy).length / data.length * 100
        selectedRegionPercentiles['Freedom to make life choices pecentile'] = data.filter(d => d["Freedom to make life choices"] <= meanFreedom).length / data.length * 100
        selectedRegionPercentiles['Generosity pecentile'] = data.filter(d => d["Generosity"] <= meanGenerosity).length / data.length * 100
        selectedRegionPercentiles['Perceptions of corruption pecentile'] = data.filter(d => d["Perceptions of corruption"] >= meanCorruption).length / data.length * 100
    } else {
        selectedRegionPercentiles = null;
    }

    radarplot.selectedRegionPercentiles = selectedRegionPercentiles;
    map.selectedRegionPercentiles = selectedRegionPercentiles;

}

function selectRegion(region, column) {
    selectedRegion = region;
    regionColumn = column;

    updateRegionData();

    radarplot.updateVis();

    happinessDist.updateVis();
    scatterplot.updateVis();
    attributeDist.updateVis();

    linePlot.updateVis();

    map.updateVis();
}