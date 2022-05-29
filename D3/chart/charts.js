

let width = ( window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth ) * 0.7;
let height = width;
const colors = {
    Portable: '#FF8240',
    Console: '#FFB440',
    PC: '#4186D3',
    Mobile: '#35D4A4',
    Web: '#584CD8',
};

function changeChartSize () {
    width = ( window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth ) * 0.7;
    height = width;
    svg.style('width', width)
    .style('height', height);
}

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
        .on('mouseover', function (e, d) {
            tooltip.select('img').attr('src', d.data.img);
            tooltip.select('a').text('{} \r\n value: {}'.format(d.data.full_name, d.data.score))
            tooltip.select('span').attr('class', d.data.category).text(d.data.category);
            tooltip.style('visibility', 'visible');

            d3.select(this).style('stroke', '#222');
            // console.log(d.r)
            // console.log([...d.data.name.split(".").pop().split(/(?=[A-Z][a-z])/g), d.data.value].join("\n"))
        })
        .on('mousemove', e => tooltip.style('top', `${e.pageY}px`)
                                     .style('left', `${e.pageX + 10}px`))
        .on('mouseout', function () {
            d3.select(this).style('stroke', 'none');
            return tooltip.style('visibility', 'hidden');
        })
        .on('click', (e, d) => CRF(d.data.link));
    
    const label = node.append('text')
        .attr('dy', 2)
        .text(d => {if (d.r<37) {return ' '} else {return d.data.name}});
    const sublabel = node.append('text')
        .attr('dy', 35)
        .text(d => {if (d.r<37) {return ' '} else {return d.data.score.toLocaleString('en')}})
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
        .style('font-size', '35px')

    sublabel.transition()
        .delay(700)
        .ease(d3.easeExpInOut)
        .duration(1000)
        .style('opacity', 1)
        .style('font-size', '25px')
};

(async () => {
    data = await d3.json('../D3/chart/first_data.json').then(data => data);
    generateChart(data);
})();