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
        
        vis.projection = d3.geoNaturalEarth1().scale(250);
        vis.geoPath = d3.geoPath().projection(vis.projection);
        vis.pathGenerator = d3.geoPath().projection(vis.projection);
        vis.filteredData = d3.rollup(vis.data, v => d3.mean(v, d => d["Happiness Score"]), d => d.id);
        vis.happinessValue = d => d["Happiness Score"];
        vis.colorScale.domain([3.36, 7.61]);
        vis.features = topojson.feature(vis.geojson, vis.geojson.objects.countries).features;
        vis.centroids = vis.features.map(function (feature){
            return [feature.id, vis.geoPath.centroid(feature)];
        });

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
            .style('cursor', 'pointer')
            .attr("fill", (d) => {
                if (vis.filteredData.has(d.id)) {
                    return vis.colorScale(vis.filteredData.get(d.id));
                } else {
                    return "#777777";
                }
            })
            .attr("stroke", d => {
                return "#000000";
            })
            .attr("stroke-width", d => {
                return 0;
            });

        countryPath
            .on("mouseover", (event, d) => {
                let country = regions.find(e => e["country-code"] === d.id);
                if (validCountries.includes(d.id)) {
                    d3
                        .select("#tooltip")
                        .style("display", "block")
                        .style("left", event.pageX + vis.config.tooltipPadding + "px")
                        .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
                        <div style="display: flex">
                        <div class="tooltip-title">${country.name}</div>
                        </div>
                        <hr>
              <div>Happiness Score: <strong>${vis.filteredData.get(d.id).toFixed(4)}</strong></div>
            `);
                }
            })
            .on("mouseleave", () => {
                d3.select("#tooltip").style("display", "none");
            })
            .on('click', function (event, d) {
                if (validCountries.includes(d.id)) {
                    selectMyCountry(d.id);
                }
            });
        vis.country = myCountry === null ? [] : [myCountry];
        vis.marker = vis.chart.selectAll(".marker")
            .data(vis.country)
            .join("path")
            .attr("class", "marker")
            .attr("d", "M0,0l-8.8-17.7C-12.1-24.3-7.4-32,0-32h0c7.4,0,12.1,7.7,8.8,14.3L0,0z")
            .attr("transform", d => {
                let countryCentroid = vis.centroids.find(e => e[0] === d);
                return "translate(" + countryCentroid[1][0] + "," + countryCentroid[1][1] + ") scale(1.5)";
            })
            //.on('mouseover', function(d){})
        ;
    }
}
