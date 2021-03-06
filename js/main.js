let scatterplot, linePlot;
let data, geojson, regions;
let scatterplot_attribute = 'Log GDP per capita'
let map, countrySelector;
let selectedYear = 2019;
let selectedCountries = [0, 0, 0, 0];
let selectedRegion, regionColumn = '', selectedRegionPercentiles = {}, selectedRegionAverage = [];
let filteredRegionIds = [];
let yearFilteredData;
let happinessDist, attributeDist;
let myCountry = null;
let myCountryColor = "#8533af";
let confidenceLevel = 0.05;
let validCountries = [];
const regionColor = "#0057e7";
const colors = [regionColor, '#a217dc', '#fdd100', myCountryColor];
let chartIdVisible = "scatterplot";
let chartIdInvisible = "line_chart";
let binSize = 20;

//Load data from CSV file asynchronously and render chart
Promise.all([d3.csv('data/happiness_data_with_percentile.csv'), d3.json('data/map.json'), d3.csv('data/regions.csv')]).then(_data => {
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

    // Initialize variables
    validCountries = [...new Set(validCountries)];
    scatterplot_attribute = 'Log GDP per capita';
    yearFilteredData = data.filter(d => d.year === selectedYear)
    const filteredData = data.sort((a, b) => a.year - b.year);

    // Initialize charts
    countrySelector = new CountrySelector({
        parentElement: '#country-selector'
    }, data, geojson)
    countrySelector.updateVis();

    map = new GeoMap({
        parentElement: '#vis-map'
    }, data, geojson);
    map.updateVis();

    radarplot = showRadarPlot(data);
    radarplot.updateVis();

    scatterplot = new Scatterplot({
        parentElement: '#scatterplot', attribute_selected: scatterplot_attribute
        // Optional: other configurations
    }, yearFilteredData);
    scatterplot.updateVis();

    happinessDist = new HappinessDistribution({
        parentElement: '#happiness-dist', attribute_selected: scatterplot_attribute
        // Optional: other configurations
    }, yearFilteredData, colors);
    happinessDist.updateVis();

    linePlot = new LineChart({
        parentElement: '#line_chart', attribute: 'Log GDP per capita'
        // Optional: other configurations
    }, filteredData);
    linePlot.updateVis();

    attributeDist = new AttributeDistribution({
        parentElement: '#attribute-dist', attribute_selected: scatterplot_attribute
        // Optional: other configurations
    }, yearFilteredData, colors);
    attributeDist.updateVis();

    // Set visibility
    handleChartVisiblity();
    document.getElementById(chartIdInvisible).style.display = "none";
    document.getElementById(chartIdVisible).style.display = "inline-block";
});

// Handle selecting the attribute on the scatterplot
d3.selectAll('#scatter-plot-selector').on('change', e => {
    scatterplot_attribute = e.target.value;

    happinessDist.updateVis();
    scatterplot.updateVis();
    attributeDist.updateVis();

    linePlot.updateVis();
})

// Handle displaying the scatterplot or the line chart
selectChart = (selectedId, unselectedId) => {
    document.querySelectorAll("." + unselectedId).forEach(d => {
        d.style.display = "none"
    });
    document.querySelectorAll("." + selectedId).forEach(d => {
        d.style.display = "inline-block"
    });

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
        parentElement, containerWidth, containerHeight, colors
    };

    return new RadarPlot(config, data, onRadarPlotPointClicked);
}

// Hide the rest of the charts till my country is selected
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
}

// Handle update of the year selector slider
d3.select('#year-slider').on('input', function () {
    // Update visualization
    selectedYear = parseInt(this.value);

    // Update label
    d3.select('#year-value').text(this.value);
    d3.select('#year-value-dup').text(this.value);

    yearFilteredData = data.filter(d => d.year === selectedYear);

    // Update plots
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

// Update bin count of the distributions
d3.select('#bin-slider').on('input', function () {
    binSize = parseInt(this.value);
    d3.select('#bin-value').text(this.value < 10 ? "0" + this.value : this.value);
    happinessDist.updateVis();
    attributeDist.updateVis();
});

// Handle selecting primary country
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

    // Update plots
    countrySelector.updateVis();
    map.updateVis();
    scatterplot.updateVis();
    linePlot.updateVis();
    updateRadarPlot(selectedCountries, selectedYear);
}

// Handling adding countries to selected bucket
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
    clearButtonStyle();

    // Update plots
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

// Find means for the selected region for the radar chart and the line chart
function updateRegionData() {
    if (filteredRegionIds.length > 0) {
        const filteredData = yearFilteredData.filter(d => filteredRegionIds.includes(d.id))

        // Calculate means
        const meanHappiness = d3.mean(filteredData, d => d["Happiness Score"]);
        const meanGpd = d3.mean(filteredData, d => d["Log GDP per capita"]);
        const meanSocialSupport = d3.mean(filteredData, d => d["Social support"]);
        const meanLifeExpectancy = d3.mean(filteredData, d => d["Healthy life expectancy at birth"]);
        const meanFreedom = d3.mean(filteredData, d => d["Freedom to make life choices"]);
        const meanGenerosity = d3.mean(filteredData, d => d["Generosity"]);
        const meanCorruption = d3.mean(filteredData, d => d["Perceptions of corruption"]);
        const regionData = data.filter(d => filteredRegionIds.includes(d.id))
        const happinessAverage = d3.rollup(regionData, v => d3.mean(v, d => d["Happiness Score"]), d => d.year);
        const gdpAverage = d3.rollup(regionData, v => d3.mean(v, d => d["Log GDP per capita"]), d => d.year);
        const socialSupportAverage = d3.rollup(regionData, v => d3.mean(v, d => d["Social support"]), d => d.year);
        const lifeExpectancyAverage = d3.rollup(regionData, v => d3.mean(v, d => d["Healthy life expectancy at birth"]), d => d.year);
        const freedomAverage = d3.rollup(regionData, v => d3.mean(v, d => d["Freedom to make life choices"]), d => d.year);
        const generosityAverage = d3.rollup(regionData, v => d3.mean(v, d => d["Generosity"]), d => d.year);
        const corruptionAverage = d3.rollup(regionData, v => d3.mean(v, d => d["Perceptions of corruption"]), d => d.year);

        // Set label text
        let selectedRegionTitle = 'Selected Countries (Mean Of Selection)';
        const uniqueCountries = new Set(filteredData.map(d => d['Country name']));
        if (uniqueCountries.size == 1) {
            // Show name of country if the selected countries for comparison is 1
            selectedRegionTitle = uniqueCountries.values().next().value;
            map.selectedRegionPercentiles = {'Country name': selectedRegionTitle};
        }

        // Create objects
        selectedRegionAverage = [];
        for (let i = 2011; i <= 2020; i++) {
            selectedRegionAverage.push({
                'Country name': selectedRegionTitle,
                'year': i,
                'Happiness Score': happinessAverage.get(i),
                'Log GDP per capita': gdpAverage.get(i),
                'Social support': socialSupportAverage.get(i),
                'Healthy life expectancy at birth': lifeExpectancyAverage.get(i),
                'Freedom to make life choices': freedomAverage.get(i),
                'Generosity': generosityAverage.get(i),
                'Perceptions of corruption': corruptionAverage.get(i)
            })
        }

        selectedRegionPercentiles = {};
        selectedRegionPercentiles['Country name'] = selectedRegionTitle;
        selectedRegionPercentiles['Happiness Score pecentile'] = yearFilteredData.filter(d => d["Happiness Score"] <= meanHappiness).length / yearFilteredData.length * 100
        selectedRegionPercentiles['Log GDP per capita pecentile'] = yearFilteredData.filter(d => d["Log GDP per capita"] <= meanGpd).length / yearFilteredData.length * 100
        selectedRegionPercentiles['Social support pecentile'] = yearFilteredData.filter(d => d["Social support"] <= meanSocialSupport).length / yearFilteredData.length * 100
        selectedRegionPercentiles['Healthy life expectancy at birth pecentile'] = yearFilteredData.filter(d => d["Healthy life expectancy at birth"] <= meanLifeExpectancy).length / yearFilteredData.length * 100
        selectedRegionPercentiles['Freedom to make life choices pecentile'] = yearFilteredData.filter(d => d["Freedom to make life choices"] <= meanFreedom).length / yearFilteredData.length * 100
        selectedRegionPercentiles['Generosity pecentile'] = yearFilteredData.filter(d => d["Generosity"] <= meanGenerosity).length / yearFilteredData.length * 100
        selectedRegionPercentiles['Perceptions of corruption pecentile'] = yearFilteredData.filter(d => d["Perceptions of corruption"] >= meanCorruption).length / yearFilteredData.length * 100
    } else {
        selectedRegionPercentiles = null;
    }

    radarplot.selectedRegionPercentiles = selectedRegionPercentiles;
    map.selectedRegionPercentiles = selectedRegionPercentiles;

}

// Handle selecting a pre-determined region group
function selectRegion(region, column) {
    clearButtonStyle();
    selectedRegion = region;
    regionColumn = column;
    if (selectedRegion) {
        document.getElementById(selectedRegion).setAttribute("class", "btn-clicked");
    }

    let filteredRegions = regions.filter(d => d[regionColumn] === selectedRegion && validCountries.includes(d['country-code']));
    filteredRegionIds = filteredRegions.map(d => d['country-code']);

    // Update Plots
    updateRegionData();
    radarplot.updateVis();
    happinessDist.updateVis();
    scatterplot.updateVis();
    attributeDist.updateVis();
    linePlot.updateVis();
    map.updateVis();
}

// Handle removing selected region button background
function clearButtonStyle() {
    if (selectedRegion) {
        document.getElementById(selectedRegion).setAttribute("class", "btn");
    }
}