class CountrySelector {
    pathGenerator;

    /**
     * Class constructor with basic configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _geojson) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1300,
            containerHeight: _config.containerHeight || 800,
            margin: _config.margin || {top: 0, right: 0, bottom: 0, left: 0},
            tooltipPadding: 10,
            legendBottom: 50,
            legendLeft: 50,
            legendRectHeight: 12,
            legendRectWidth: 150
        };
        this.data = _data;
        this.geojson = _geojson;
        this.initVis();
    }

    /**
     * We initialize scales/axes and append static elements, such as axis titles.
     */
    initVis() {
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width =
            vis.config.containerWidth -
            vis.config.margin.left -
            vis.config.margin.right;
        vis.height =
            vis.config.containerHeight -
            vis.config.margin.top -
            vis.config.margin.bottom;

        // Define size of SVG drawing area
        vis.svg = d3
            .select(vis.config.parentElement)
            .append("svg")
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

        // Initialize projection and background
        vis.projection = d3.geoNaturalEarth1();
        vis.background = vis.svg.append("g");
        vis.background.append('path')
            .attr('class', 'background')
            .attr('fill', '#ffffff')
            .attr('transform', `translate(100, 100)`);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chart = vis.svg
            .append("g")
            .attr('transform', `translate(100, 100)`);

        // Scales
        vis.colorScale = d3.scaleLinear()
            .range(['#FFF7F3', '#FF1812'])
            .interpolate(d3.interpolateHcl);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        switch (selectedProjection) {
            case "geoNaturalEarth":
                vis.projection = d3.geoNaturalEarth1().scale(250);
                break;
            case "geoEquirectangular":
                vis.projection = d3.geoEquirectangular().scale(250);
                break;
            case "geoConicEqualArea":
                vis.projection = d3.geoConicEqualArea().scale(250);
                break;
        }

        vis.geoPath = d3.geoPath().projection(vis.projection);
        vis.pathGenerator = d3.geoPath().projection(vis.projection);
        vis.filteredData = vis.data.filter(d => d.year === selectedYear);
        vis.happinessValue = d => d["Happiness Score"];
        vis.colorScale.domain(d3.extent(vis.filteredData, vis.happinessValue));

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        // Convert compressed TopoJSON to GeoJSON format
        const countries = topojson.feature(vis.geojson, vis.geojson.objects.countries);

        // Defines the scale of the projection so that the geometry fits within the SVG area
        //vis.projection.fitSize([vis.width, vis.height], countries);
        d3.selectAll(".background")
            .attr("d", vis.pathGenerator({type: 'Sphere'}));

        // Append world map
        const countryPath = vis.chart
            .selectAll(".country")
            .data(countries.features)
            .join("path")
            .attr("class", "country")
            .attr("d", vis.geoPath)
            .attr("fill", (d) => {
                let country = vis.filteredData.filter(e => e.id === d.id);
                if (country.length > 0) {
                    return vis.colorScale(country[0]["Happiness Score"]);
                } else {
                    return "#777777";
                }
            })
            .attr("stroke", d => {
                if (selectedCountries.includes(d.id)) {
                    return colors[selectedCountries.indexOf(d.id)];
                } else if (filteredRegionIds.includes(d.id)) {
                    return "#004488";
                } else {
                    return "#000000";
                }
            })
            .attr("stroke-width", d => {
                if (myCountry === d.id) {
                    return 5;
                } else {
                    return 0;
                }
            });

        countryPath
            .on("mouseover", (event, d) => {
                let country = vis.filteredData.filter(e => e.id === d.id);
                if (country.length > 0) {
                    d3
                        .select("#tooltip")
                        .style("display", "block")
                        .style("left", event.pageX + vis.config.tooltipPadding + "px")
                        .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
              <div class="tooltip-title">${country[0]["Country name"]}</div>
              <div>Happiness Score: <strong>${country[0]["Happiness Score"]}</strong></div>
            `);
                }
            })
            .on("mouseleave", () => {
                d3.select("#tooltip").style("display", "none");
            })
            .on('click', function (event, d) {
                let country = vis.filteredData.filter(e => e.id === d.id);
                if (country.length > 0) {
                    selectMyCountry(d.id);
                }
            });
    }
}