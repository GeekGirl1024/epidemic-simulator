class Graph{
    constructor(canvasId){
        this.canvas = document.getElementById(canvasId).getContext('2d');
        this.data = {
            labels: [],
            datasets: [{
                label: 'Normal',
                data: [],
                backgroundColor: '#00FF00'
            },
            {
                label: 'Infected',
                data: [],
                backgroundColor: '#FFA500'
            },
            {
                label: 'Cured',
                data: [],
                backgroundColor: '#A0A0FF'
            },
            {
                label: 'Died',
                data: [],
                backgroundColor: '#FF0000'
            }]
        }
        this.chart = new Chart(this.canvas, {
            type: 'bar',
            data: this.data,
            options: {
                scales: {
                    xAxes:[{
                        stacked: true
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        },
                        stacked: true
                    }]
                }
            }
        });
    }

    update(increment){
        this.data.labels.push(this.data.labels.length + 1);
        this.data.datasets[0].data.push(increment[0]);
        this.data.datasets[1].data.push(increment[1]);
        this.data.datasets[2].data.push(increment[2]);
        this.data.datasets[3].data.push(increment[3]);
        this.chart.update();
    }

    reset(){
        this.data.labels=[];
        this.data.datasets[0].data=[];
        this.data.datasets[1].data=[];
        this.data.datasets[2].data=[];
        this.data.datasets[3].data=[];
        this.chart.reset();
    }
}


            