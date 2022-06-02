let width = document.querySelector('.page-header').offsetWidth * 0.9;
let height = width;
const colors = {
    Portable: '#FF8240',
    Console: '#FFB440',
    PC: '#4186D3',
    Mobile: '#35D4A4',
    Web: '#584CD8',
};

const generateChart = data => {
    const bubble = data => d3.pack()
        .size([width, height])
        .padding(2)(d3.hierarchy({ children: data }).sum(d => d.score));

    const svg = d3.select('#bubble-chart')
        .style('width', width)
        .style('height', height);

    const root = bubble(data);
    const tooltip = d3.select('.tooltip');

    const node = svg.selectAll()
        .data(root.children)
        .enter().append('g')
        .attr('transform', `translate(${width}, ${height})`);

    const circle = node.append('circle')
        .style('fill', d => colors[d.data.category])
        .on('mouseover', function(e, d) {
            tooltip.select('img').attr('src', d.data.img);
            tooltip.select('a').text('{} \r\n value: {}'.format(d.data.full_name, d.data.score))
            tooltip.select('tlspan').attr('class', d.data.category).text(d.data.category);
            tooltip.style('visibility', 'visible');

            d3.select(this).style('stroke', '#222');
            // console.log(d.r)
            // console.log([...d.data.name.split(".").pop().split(/(?=[A-Z][a-z])/g), d.data.value].join("\n"))
        })
        .on('mousemove', e => tooltip.style('top', `${e.pageY}px`)
            .style('left', `${e.pageX + 10}px`))
        .on('mouseout', function() {
            d3.select(this).style('stroke', 'none');
            return tooltip.style('visibility', 'hidden');
        });

    const label = node.append('text')
        .attr('dy', 0)
        .text(d => { if (d.r < 37) { return ' ' } else { return d.data.name } });
    const sublabel = node.append('text')
        .attr('dy', 27)
        .text(d => { if (d.r < 37) { return ' ' } else { return d.data.score.toLocaleString('en') } })
        // d.data.name.substring(0, d.r / 30));
        // document.getElementById(d.data.name).innerHTML = '{}<br/>{}'.format(d.data.name.split(".").pop().split(/(?=[A-Z][a-z])/g), d.data.score.toLocaleString('en'))

    node.transition()
        .ease(d3.easeExpInOut)
        .duration(1000)
        .attr('transform', d => `translate(${d.x}, ${d.y})`);

    circle.transition()
        .ease(d3.easeExpInOut)
        .duration(1000)
        .attr('r', d => d.r);

    label.transition()
        .delay(700)
        .ease(d3.easeExpInOut)
        .duration(1000)
        .style('opacity', 1)
        .style('font-size', '25px')

    sublabel.transition()
        .delay(700)
        .ease(d3.easeExpInOut)
        .duration(1000)
        .style('opacity', 1)
        .style('font-size', '20px')
};

// let labels = document.getElementById('bubble-chart').childNodes;
// for (let item of labels) {
//     item.style.textAlign = 'center'
// }

(async() => {
    data = await d3.json('../D3/chart/first_data.json').then(data => data);
    generateChart(data);
})();