let scatterplot, lineplotGdp, lineplotSocial, lineplotLife, lineplotFreedom, lineplotGenerosity, lineplotCorruption;
let data;
let scatterplot_attribute = 'Log GDP per capita'
let country_selected = "Canada"

//Load data from CSV file asynchronously and render chart
d3.csv('data/happiness_data_with_percentile.csv').then(_data => {
    data = _data
    _data.forEach(d => {
        d['Life Ladder'] = +d['Life Ladder'];
        d['Log GDP per capita'] = +d['Log GDP per capita']
    });

    scatterplot = new Scatterplot({
        parentElement: '#scatterplot',
        attribute_selected: scatterplot_attribute
        // Optional: other configurations
    }, data);

    scatterplot.updateVis();


    const filteredData = data.filter(d => d["Country name"] === country_selected ).sort((a, b)  => a.year - b.year)
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
