let scatterplot, linePlot;
let data, geojson, regions;
let scatterplot_attribute = 'Log GDP per capita'
let map, countrySelector;
let selectedYear = 2019;
let selectedCountries = [0, 0, 0, 0];
let selectedRegion, regionColumn = '', selectedRegionPercentiles = {}, selectedRegionAverage = {};
let filteredRegionIds = [];
let yearFilteredData;
let happinessDist, attributeDist;
let myCountry = null;
let myCountryColor = "#8533af";
let confidenceLevel = 0.05;
let validCountries = [];
const regionColor = "#0057e7";
//const myCountryColor = "#01c5a9";
const colors = ['#ff0048', '#a217dc', '#fdd100', myCountryColor];
let chartIdVisible = "scatterplot";
let chartIdInvisible = "line_chart";
let binSize = 20;

// const colors = ['#a217dc', '#01c5a9', '#1437FF', myCountryColor];

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
        validCountries.push(d.id);
        Object.keys(d).forEach(attr => {
            if (attr !== 'Country name' && attr !== 'id') {
                d[attr] = +d[attr];
            }
        });
    });
    validCountries = [...new Set(validCountries)];

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

    scatterplot = new Scatterplot({
        parentElement: '#scatterplot',
        attribute_selected: scatterplot_attribute
        // Optional: other configurations
    }, yearFilteredData);

    scatterplot.updateVis();

    happinessDist = new HappinessDistribution({
        parentElement: '#happiness-dist',
        attribute_selected: scatterplot_attribute
        // Optional: other configurations
    }, yearFilteredData, colors);

    happinessDist.updateVis();



    attributeDist = new AttributeDistribution({
        parentElement: '#attribute-dist',
        attribute_selected: scatterplot_attribute
        // Optional: other configurations
    }, yearFilteredData, colors);

    attributeDist.updateVis();

    const filteredData = data.sort((a, b) => a.year - b.year);

    linePlot = new LineChart({
        parentElement: '#line_chart',
        attribute: 'Log GDP per capita'
        // Optional: other configurations
    }, filteredData);


    linePlot.updateVis();

    handleChartVisiblity();
    document.getElementById(chartIdInvisible).style.display = "none";
    document.getElementById(chartIdVisible).style.display = "inline-block";

    // document.getElementById(chartIdVisible).style.visibility = "visible";
    // document.getElementById(chartIdInvisible).style.visibility = "hidden";

});

d3.selectAll('#scatter-plot-selector').on('change', e => {
    scatterplot_attribute = e.target.value;

    happinessDist.updateVis();
    scatterplot.updateVis();
    attributeDist.updateVis();

    linePlot.updateVis();
})

selectChart = (selectedId, unselectedId) => {
    // document.getElementById(selectedId).style.visibility = "visible";
    // document.getElementById(unselectedId).style.visibility = "hidden";

    document.querySelectorAll("." + unselectedId).forEach(d => {d.style.display = "none"});
    document.querySelectorAll("." + selectedId).forEach(d => {d.style.display = "inline-block"});

    chartIdVisible = selectedId;
    chartIdInvisible = unselectedId;

    if (chartIdVisible === "line_chart") {
        document.getElementById("happiness-score").hidden = false;
        document.getElementById("scatterplot-control").style.visibility = "hidden";

    } else {
        if (document.getElementById('scatter-plot-selector').value === "Happiness Score") {
            document.getElementById('scatter-plot-selector').value = "Log GDP per capita";
            scatterplot_attribute = "Log GDP per capita";
            happinessDist.updateVis();
            scatterplot.updateVis();
            attributeDist.updateVis();
            linePlot.updateVis();
        }
        document.getElementById("happiness-score").hidden = true;
        document.getElementById("scatterplot-control").style.visibility = "visible";
    }
}

// Draw the radar plot
function showRadarPlot(data) {
    const containerWidth = 500;
    const containerHeight = 420;

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

// Event slider for input slider
d3.select('#year-slider').on('input', function () {
    // Update visualization
    selectedYear = parseInt(this.value);

    // Update label
    d3.select('#year-value').text(this.value);
    d3.select('#year-value-dup').text(this.value);

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

// Update Confidence Level on Scatterplot
d3.select('#ci-slider').on('input', function () {
    confidenceLevel = (100 - parseFloat(this.value)) / 100;
    d3.select('#ci-value').text(parseFloat(this.value).toFixed(1));
    scatterplot.updateVis();
});

// Update Confidence Level on Scatterplot
d3.select('#bin-slider').on('input', function () {
    binSize = parseInt(this.value);
    d3.select('#bin-value').text(this.value < 10 ? "0" + this.value : this.value);
    happinessDist.updateVis();
    attributeDist.updateVis();
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
    if (d !== 0) {
        if (filteredRegionIds.includes(d)) {
            filteredRegionIds = filteredRegionIds.filter(e => e !== d);
        } else {
            filteredRegionIds.push(d);
        }
    }
    updateRegionData();

    map.selectedRegionPercentiles = {'Country name': 'Selected Countries (Mean Of Selection)'};

    clearButtonStyle();

    updateRadarPlot(selectedCountries, selectedYear);
    scatterplot.selectedCountries = selectedCountries;
    scatterplot.updateVis();
    happinessDist.updateVis();
    attributeDist.updateVis();

    linePlot.updateVis()

    updateRadarPlot(selectedCountries, selectedYear);

    map.updateVis();
    radarplot.updateVis();

    // Update tooltip for map
    d3.select("#tooltip-colordiv")
        .style('background-color', map.fillColor({id: d}))
        .style('opacity', map.fillColor({id: d}) === "#000" ? 0.15 : 1);

}

function updateRegionData() {
    if (filteredRegionIds.length > 0) {
        const filteredData = yearFilteredData.filter(d => filteredRegionIds.includes(d.id))

        const meanHappiness = d3.mean(filteredData, d => d["Happiness Score"]);
        const meanGpd = d3.mean(filteredData, d => d["Log GDP per capita"]);
        const meanSocialSupport = d3.mean(filteredData, d => d["Social support"]);
        const meanLifeExpectancy = d3.mean(filteredData, d => d["Healthy life expectancy at birth"]);
        const meanFreedom = d3.mean(filteredData, d => d["Freedom to make life choices"]);
        const meanGenerosity = d3.mean(filteredData, d => d["Generosity"]);
        const meanCorruption = d3.mean(filteredData, d => d["Perceptions of corruption"]);

        selectedRegionAverage = {};
        selectedRegionAverage['Happiness Score'] = meanHappiness;
        selectedRegionAverage['Log GDP per capita'] = meanGpd;
        selectedRegionAverage['Social support'] = meanSocialSupport;
        selectedRegionAverage['Healthy life expectancy at birth'] = meanLifeExpectancy;
        selectedRegionAverage['Freedom to make life choices'] = meanFreedom;
        selectedRegionAverage['Generosity'] = meanGenerosity;
        selectedRegionAverage['Perceptions of corruption'] = meanCorruption;

        selectedRegionPercentiles = {};
        selectedRegionPercentiles['Country name'] = selectedRegion + ' (Regional Mean)';
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
    clearButtonStyle();
    selectedRegion = region;
    regionColumn = column;
    if (selectedRegion) {
        document.getElementById(selectedRegion).setAttribute("class", "btn-clicked");
    }


    let filteredRegions = regions.filter(d => d[regionColumn] === selectedRegion && validCountries.includes(d['country-code']));
    filteredRegionIds = filteredRegions.map(d => d['country-code']);

    updateRegionData();

    radarplot.updateVis();
    happinessDist.updateVis();
    scatterplot.updateVis();
    attributeDist.updateVis();
    linePlot.updateVis();
    map.updateVis();
}

function clearButtonStyle() {
    if (selectedRegion) {
        document.getElementById(selectedRegion).setAttribute("class", "btn");
    }
}