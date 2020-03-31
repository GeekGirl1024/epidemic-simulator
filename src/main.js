class Vector{
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }

    add(vector2){
        this.x += vector2.x;
        this.y += vector2.y;
        return this;
    }

    scale(multiplier){
        this.x *= multiplier;
        this.y *= multiplier;
        return this;
    }

    sub(vector2){
        this.x -= vector2.x;
        this.y -= vector2.y;
        return this;
    }

    set(x,y){
        this.x = x;
        this.y = y;
    }

    toString(){
        return "("+this.x+","+this.y+")";
    }

    length(){
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    static add(vector1, vector2){
        return new Vector(vector1.x + vector2.x, vector1.y + vector2.y);
    }

    static sub(vector1, vector2){
        return new Vector(vector1.x - vector2.x, vector1.y - vector2.y);
    }

    static scale(vector1, multiplier){
        return new Vector(vector1.x * multiplier, vector1.y * multiplier);
    }

    static distance(vector1, vector2){
        return Vector.sub(vector1, vector2).length();
    }
}

class Particle{
    constructor() {
        this.position = new Vector(0, 0);
        this.velocity = new Vector(0, 0);
        this.infected = false;
    }

    step(){
        this.position.add(this.velocity);
        if (this.position.x < 0){
            this.position.x *= -1;
            this.velocity.x *= -1;
        }

        if (this.position.y < 0){
            this.position.y *= -1;
            this.velocity.y *= -1;
        }

        if (this.position.x > 1){
            this.position.x = 1 - (this.position.x - 1);
            this.velocity.x *= -1;
        }

        if (this.position.y > 1){
            this.position.y = 1 - (this.position.y - 1);
            this.velocity.y *= -1;
        }
    }
}

class Connection{
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
    }

    static equals(connection1, connection2){
        if (connection1.node1 == connection2.node1 && connection1.node2 == connection2.node2){
            return true;
        }
        if (connection1.node1 == connection2.node2 && connection1.node2 == connection2.node1){
            return true;
        }
        
        return false;
    }
}

class Outbreak{
    constructor(canvasId, infectionRate, infectionRadius, particleCount){
        this.particles = [];
        this.canvasId = canvasId;
        this.canvas = document.getElementById(this.canvasId);
        this.context = this.canvas.getContext("2d");
        this.infectionRate = infectionRate;
        this.infectionRadius = infectionRadius;
        this.particleCount = particleCount;
        this.connections = [];
    }

    init(){
        for (let i=0; i < this.particleCount; i++){
            this.particles.push(this.randomParticle());
        }
    }

    step(){
        let nextStepConnections = [];
        for (var i = 0; i < this.particles.length; i++){
            this.particles[i].step();

            for (var j = 0; j < i; j++){
                if (Vector.distance(this.particles[i].position,this.particles[j].position) < this.infectionRadius){
                    if (this.particles[i].infected && !this.particles[j].infected || !this.particles[i].infected && this.particles[j].infected)
                    nextStepConnections.push(new Connection(i, j));
                }
            }
        }

        var foundCounter = 0;
        for (var i = 0; i < nextStepConnections.length; i++){
            let found = false;
            for (var j = 0; j < this.connections.length; j++){
                if (Connection.equals(nextStepConnections[i], this.connections[j])){
                    found = true;
                    break;
                }
            }

            if (found){

                foundCounter++;
                continue;
            }

            if (this.particles[nextStepConnections[i].node1].infected && !this.particles[nextStepConnections[i].node2].infected){
                let rand = Math.random();
                
                if (rand < this.infectionRate) {
                    
                    this.particles[nextStepConnections[i].node2].infected = true;
                }
            } else if (this.particles[nextStepConnections[i].node2].infected && !this.particles[nextStepConnections[i].node1].infected){
                let rand = Math.random();
                
                if (rand < this.infectionRate) {
                    
                    this.particles[nextStepConnections[i].node1].infected = true;
                }
            }
        }

        //console.log(foundCounter);

        this.connections = nextStepConnections;
    }

    draw(){
        const { width, height } = this.canvas.getBoundingClientRect();
        this.context.clearRect(0, 0, width, height);

        for (var i = 0; i< this.particles.length; i++){
            this.context.beginPath();
            this.context.arc(this.particles[i].position.x * width, this.particles[i].position.y * height,2,0,2*Math.PI);
            this.context.fillStyle = this.particles[i].infected ? "#FF0000" : "#000000";
            this.context.fill();
        }

        for (var i = 0; i < this.connections.length; i++) {
            if ((this.particles[this.connections[i].node1].infected && !this.particles[this.connections[i].node2].infected)
            || (!this.particles[this.connections[i].node1].infected && this.particles[this.connections[i].node2].infected))
            {
            this.context.beginPath();
            let x = this.particles[this.connections[i].node1].position.x * width;
            let y = this.particles[this.connections[i].node1].position.y * height;
            this.context.moveTo(x, y);
            x = this.particles[this.connections[i].node2].position.x * width;
            y = this.particles[this.connections[i].node2].position.y * height;
            this.context.lineTo(x, y);
            this.context.strokeStyle = '#000000';
            this.context.lineWidth = 1;
            this.context.stroke();
            }
        }
    }

    randomParticle(){
        let ret = new Particle();
        ret.position = new Vector(Math.random(), Math.random());
        ret.velocity = new Vector(Math.random()/100 - .005, Math.random()/100 - .005);

        return ret;
    }
}