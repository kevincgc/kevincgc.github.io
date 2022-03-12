let scatterplot;
let data;
let scatterplot_attribute = 'Log GDP per capita'

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
