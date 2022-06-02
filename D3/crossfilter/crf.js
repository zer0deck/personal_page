import { d3 } from './d3.v3.js';

function CRF(path) {
    d3.csv(path, function(err, games) {
        // console.log(typeof games)
        // Various formatters.
        var formatNumber = d3.format(".3n"),
            formatChange = d3.format(".2n"),
            formatDate = d3.time.format("%B %d, %Y"),
            dateFormat = d3.time.format("%Y")

        // A nest operator, for grouping the game list.
        var nestByDate = d3.nest()
            .key(function(d) { return d3.time.year(d.date); });

        // A little coercion, since the CSV is untyped.
        games.forEach(function(d, i) {
            d.index = i;
            d.date = parseDate(d.date);

            d.user = +d.user;
            d.ucs = +d.ucs;
            d.sale = +d.sale;
        });

        // Create the crossfilter for the relevant dimensions and groups.
        var game = crossfilter(games),
            all = game.groupAll(),
            date = game.dimension(function(d) { return d.date; }),
            dates = date.group(d3.time.year),
            user = game.dimension(function(d) { return Math.max(0, Math.min(11, d.ucs)); }),
            users = user.group(function(d) { return Math.floor(d / 0.25) * 0.25; }),
            ucs = game.dimension(function(d) { return Math.max(0, Math.min(11, d.ucs)); }),
            ucss = ucs.group(function(d) { return Math.floor(d / 0.25) * 0.25; }),
            sale = game.dimension(function(d) { return Math.min(22, d.sale); }),
            sales = sale.group(function(d) { return Math.floor(d / 0.5) * 0.5; });

        var charts = [

            barChart()
            .dimension(user)
            .group(users)
            .x(d3.scale.linear()
                .domain([0, 10])
                .rangeRound([0, document.querySelector('.page-header').offsetWidth * 0.9])),

            barChart()
            .dimension(ucs)
            .group(ucss)
            .x(d3.scale.linear()
                .domain([0, 10])
                .rangeRound([0, document.querySelector('.page-header').offsetWidth * 0.9]))
            .filter([0, 10]),

            barChart()
            .dimension(sale)
            .group(sales)
            .x(d3.scale.linear()
                .domain([0, 20])
                .rangeRound([0, document.querySelector('.page-header').offsetWidth * 0.9])),

            barChart()
            .dimension(date)
            .group(dates)
            .round(d3.time.year.round)
            .x(d3.time.scale()
                .domain([new Date(1984, 1, 1), new Date(2019, 1, 2)])
                .rangeRound([0, document.querySelector('.page-header').offsetWidth * 0.9]))
            .filter([new Date(1984, 1, 1), new Date(2019, 1, 2)])

        ];

        // Given our array of charts, which we assume are in the same order as the
        // .chart elements in the DOM, bind the charts to the DOM and render them.
        // We also listen to the chart's brush events to update the display.
        var chart = d3.selectAll(".chart")
            .data(charts)
            .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });

        // Render the initial lists.
        var list = d3.selectAll(".list")
            .data([gameList]);

        // // Render the total.
        // d3.selectAll("#total")
        //     .text('{} games selected'.format(formatNumber(game.size())));

        renderAll();

        // Renders the specified chart or list.
        function render(method) {
            d3.select(this).call(method);
        }

        // Whenever the brush moves, re-rendering everything.
        function renderAll() {
            chart.each(render);
            list.each(render);
            d3.select("#totals").text('{} of {} games selected'.format(formatNumber(all.value()), formatNumber(game.size())));
        }

        // Like d3.time.format, but faster.
        function parseDate(d) {
            return new Date(d.substring(0, 4) - 1,
                1,
                1,
                d.substring(4, 6),
                d.substring(6, 8));
        }

        window.filter = function(filters) {
            filters.forEach(function(d, i) { charts[i].filter(d); });
            renderAll();
        };

        window.reset = function(i) {
            charts[i].filter(null);
            renderAll();
        };

        function gameList(div) {
            var gamesByDate = nestByDate.entries(date.top(40));

            div.each(function() {
                var date = d3.select(this).selectAll(".date")
                    .data(gamesByDate, function(d) { return d.key; });

                date.enter().append("div")
                    .attr("class", "date")
                    .append("div")
                    .attr("class", "day")
                    .text(function(d) { return '{} year: '.format(dateFormat(d.values[0].date)); });

                date.exit().remove();

                var game = date.order().selectAll(".game")
                    .data(function(d) { return d.values; }, function(d) { return d.index; });

                var gameEnter = game.enter().append("div")
                    .attr("class", "game");

                gameEnter.append("div")
                    .attr("class", "time")
                    .text(function(d) { return d.name; });

                gameEnter.append("div")
                    .attr("class", "developer")
                    .classed('unknown', function(d) { return d.developer == 'Unknown'; })
                    .text(function(d) { return d.developer; });

                gameEnter.append("div")
                    .attr("class", "rating")
                    .classed('no', function(d) { return d.rating == 'no'; })
                    .text(function(d) { return d.rating; });

                gameEnter.append("div")
                    .attr("class", "ucs")
                    .classed("worst", function(d) { return d.ucs < 4; })
                    .classed("best", function(d) { return d.ucs > 8; })
                    .text(function(d) { return formatChange(d.ucs); });

                gameEnter.append("div")
                    .attr("class", "sale")
                    .text(function(d) { return formatNumber(d.sale) + " mil."; });

                game.exit().remove();

                game.order();
            });
        }

        function barChart() {
            if (!barChart.id) barChart.id = 0;

            var margin = { top: 10, right: 10, bottom: 20, left: 10 },
                x,
                y = d3.scale.linear().range([100, 0]),
                id = barChart.id++,
                axis = d3.svg.axis().orient("bottom"),
                brush = d3.svg.brush(),
                brushDirty,
                dimension,
                group,
                round;

            function chart(div) {
                var width = document.querySelector('.page-header').offsetWidth;
                height = y.range()[0];

                y.domain([0, group.top(1)[0].value]);

                div.each(function() {
                    var div = d3.select(this),
                        g = div.select("g");

                    // Create the skeletal chart.
                    if (g.empty()) {
                        div.select(".title").append("a")
                            .attr("href", "javascript:reset(" + id + ")")
                            .attr("class", "reset")
                            .text("reset")
                            .style("display", "none");

                        g = div.append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom + 20)
                            .append("g")
                            .attr("transform", "translate(" + margin.left * 2 + "," + margin.top * 2 + ")");

                        g.append("clipPath")
                            .attr("id", "clip-" + id)
                            .append("rect")
                            .attr("width", width)
                            .attr("height", height);

                        g.selectAll(".bar")
                            .data(["background", "foreground"])
                            .enter().append("path")
                            .attr("class", function(d) { return d + " bar"; })
                            .datum(group.all());

                        g.selectAll(".foreground.bar")
                            .attr("clip-path", "url(#clip-" + id + ")");

                        g.append("g")
                            .attr("class", "axis")
                            .attr("transform", "translate(0," + height + ")")
                            .call(axis);

                        // Initialize the brush component with pretty resize handles.
                        var gBrush = g.append("g").attr("class", "brush").call(brush);
                        gBrush.selectAll("rect").attr("height", height);
                        gBrush.selectAll(".resize").append("path").attr("d", resizePath);
                    }

                    // Only redraw the brush if set externally.
                    if (brushDirty) {
                        brushDirty = false;
                        g.selectAll(".brush").call(brush);
                        div.select(".title a").style("display", brush.empty() ? "none" : null);
                        if (brush.empty()) {
                            g.selectAll("#clip-" + id + " rect")
                                .attr("x", 0)
                                .attr("width", width);
                        } else {
                            var extent = brush.extent();
                            g.selectAll("#clip-" + id + " rect")
                                .attr("x", x(extent[0]))
                                .attr("width", x(extent[1]) - x(extent[0]));
                        }
                    }

                    g.selectAll(".bar").attr("d", barPath);
                });

                function barPath(groups) {
                    var path = [],
                        i = -1,
                        n = groups.length,
                        d;
                    while (++i < n) {
                        d = groups[i];
                        path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
                    }
                    return path.join("");
                }

                function resizePath(d) {
                    var e = +(d == "e"),
                        x = e ? 1 : -1,
                        y = height / 3;
                    return "M" + (.5 * x) + "," + y +
                        "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) +
                        "V" + (2 * y - 6) +
                        "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y) +
                        "Z" +
                        "M" + (2.5 * x) + "," + (y + 8) +
                        "V" + (2 * y - 8) +
                        "M" + (4.5 * x) + "," + (y + 8) +
                        "V" + (2 * y - 8);
                }
            }

            brush.on("brushstart.chart", function() {
                var div = d3.select(this.parentNode.parentNode.parentNode);
                div.select(".title a").style("display", null);
            });

            brush.on("brush.chart", function() {
                var g = d3.select(this.parentNode),
                    extent = brush.extent();
                if (round) g.select(".brush")
                    .call(brush.extent(extent = extent.map(round)))
                    .selectAll(".resize")
                    .style("display", null);
                g.select("#clip-" + id + " rect")
                    .attr("x", x(extent[0]))
                    .attr("width", x(extent[1]) - x(extent[0]));
                dimension.filterRange(extent);
            });

            brush.on("brushend.chart", function() {
                if (brush.empty()) {
                    var div = d3.select(this.parentNode.parentNode.parentNode);
                    div.select(".title a").style("display", "none");
                    div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
                    dimension.filterAll();
                }
            });

            chart.margin = function(_) {
                if (!arguments.length) return margin;
                margin = _;
                return chart;
            };

            chart.x = function(_) {
                if (!arguments.length) return x;
                x = _;
                axis.scale(x);
                brush.x(x);
                return chart;
            };

            chart.y = function(_) {
                if (!arguments.length) return y;
                y = _;
                return chart;
            };

            chart.dimension = function(_) {
                if (!arguments.length) return dimension;
                dimension = _;
                return chart;
            };

            chart.filter = function(_) {
                if (_) {
                    brush.extent(_);
                    dimension.filterRange(_);
                } else {
                    brush.clear();
                    dimension.filterAll();
                }
                brushDirty = true;
                return chart;
            };

            chart.group = function(_) {
                if (!arguments.length) return group;
                group = _;
                return chart;
            };

            chart.round = function(_) {
                if (!arguments.length) return round;
                round = _;
                return chart;
            };

            return d3.rebind(chart, brush, "on");
        }
    });
}

CRF('../data/D3/crossfilter/second_data.csv')