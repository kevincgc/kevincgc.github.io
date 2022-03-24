let scatterplot, lineplotGdp, lineplotSocial, lineplotLife, lineplotFreedom, lineplotGenerosity, lineplotCorruption, radarplot;
let data;
let scatterplot_attribute = 'Log GDP per capita'
let country_selected = "Canada"

const colors = ['#a217dc', '#01c5a9', '#fd440c'];

//Load data from CSV file asynchronously and render chart
d3.csv('data/happiness_data_with_percentile.csv').then(_data => {
    data = _data
    _data.forEach(d => {
        d['Life Ladder'] = +d['Life Ladder'];
        d['Log GDP per capita'] = +d['Log GDP per capita']
    });

    // Radar plot
    radarplot = showRadarPlot(data);
    radarplot.updateVis();

    // updateRadarPlot(['Canada', 'Afghanistan'], '2011');
    // TODO delete this when map click calls radar plot
    debugRadarPlot();


    scatterplot = new Scatterplot({
        parentElement: '#scatterplot',
        attribute_selected: scatterplot_attribute
        // Optional: other configurations
    }, data);

    scatterplot.updateVis();


    const filteredData = data.filter(d => d["Country name"] === country_selected).sort((a, b) => a.year - b.year);

    lineplotGdp = new LineChart({
        parentElement: '#line_chart_gdp',
        attribute: 'Log GDP per capita'
        // Optional: other configurations
    }, filteredData);


    lineplotGdp.updateVis();

    lineplotSocial = new LineChart({
        parentElement: '#line_chart_social',
        attribute: 'Social support'
        // Optional: other configurations
    }, filteredData);


    lineplotSocial.updateVis();

    lineplotLife = new LineChart({
        parentElement: '#line_chart_life',
        attribute: 'Healthy life expectancy at birth'
        // Optional: other configurations
    }, filteredData);


    lineplotLife.updateVis();

    lineplotFreedom = new LineChart({
        parentElement: '#line_chart_freedom',
        attribute: 'Freedom to make life choices'
        // Optional: other configurations
    }, filteredData);

    lineplotFreedom.updateVis();

    lineplotGenerosity = new LineChart({
        parentElement: '#line_chart_generosity',
        attribute: 'Generosity'
        // Optional: other configurations
    }, filteredData);

    lineplotGenerosity.updateVis();

    lineplotCorruption = new LineChart({
        parentElement: '#line_chart_corruption',
        attribute: 'Perceptions of corruption'
        // Optional: other configurations
    }, filteredData);

    lineplotCorruption.updateVis();


});

d3.selectAll('#scatter-plot-selector').on('change', e => {
    scatterplot_attribute = e.target.value;
    updateScatterPlot();
})

updateScatterPlot = () => {

    // Remove the old chart and create a new one
    scatterplot = new Scatterplot({
        parentElement: '#scatterplot',
        attribute_selected: scatterplot_attribute
        // Optional: other configurations
    }, data);
    scatterplot.updateVis();
}

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

// Rotate through pre-selected country and year combos
// TODO delete this after map click calls updateRadarPlot()
debugRadarPlot = () => {
    const maxCount = 4;
    let current = 0;

    setInterval(() => {
        switch (current) {
            case 0:
                updateRadarPlot(['Canada', 'Afghanistan'], '2011');
                break;
            case 1:
                updateRadarPlot(['Canada'], '2011');
                break;
            case 2:
                updateRadarPlot(['Canada', 'Afghanistan'], '2013');
                break;
            case 3:
                updateRadarPlot(['Afghanistan'], '2012');
                break;

            default:
                break;
        }
        current += 1;
        if (current >= maxCount) {
            current = 0;
        }
    }, 2000)
}