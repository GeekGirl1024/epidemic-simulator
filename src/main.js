const HEALTH = {
    normal: "normal",
    infected: "infected",
    cured: "cured",
    died: "died"
}
Object.freeze(HEALTH);

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

    unitize(){
        let length = Math.sqrt(this.x * this.x + this.y * this.y);
        this.x /= length;
        this.y /= length;
        return this;
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
    constructor(deathRate, cureRate) {
        this.position = new Vector(0, 0);
        this.velocity = new Vector(0, 0);
        this.health = HEALTH.normal;
        this.refreshState = 0;
        this.refreshRate = 30;
        this.deathRate = deathRate;
        this.cureRate = cureRate;
        this.socialDistancingVelocity = new Vector(0,0);
    }

    color(){
        if (this.health === HEALTH.normal){
            return "#00FF00";
        }
        if (this.health === HEALTH.infected){
            return "#FFA500";
        }
        if (this.health === HEALTH.cured){
            return "#A0A0FF";
        }
        if (this.health === HEALTH.died){
            return "#FF0000";
        }
    }

    step(){
        this.refreshState++;
        let updateState = false;
        if (this.refreshRate <= this.refreshState){
            updateState = true;
            this.refreshState = 0;
        }

        if (updateState && this.health === HEALTH.infected){
            let stateChange = Math.random();
            if (stateChange < this.deathRate){
                this.health = HEALTH.died;
            } else if(stateChange < this.deathRate + this.cureRate){
                this.health = HEALTH.cured;
            }
        }

        if(this.health === HEALTH.died){
            return;
        }

        this.position.add(this.velocity).add(this.socialDistancingVelocity);
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
    constructor(canvasId, infectionRate, infectionRadius, particleCount, deathRate, cureRate, reinfectionRate, socialDistancing, socialDistancingStart){
        this.particles = [];
        this.canvasId = canvasId;
        this.canvas = document.getElementById(this.canvasId);
        this.context = this.canvas.getContext("2d");
        this.infectionRate = infectionRate;
        this.infectionRadius = infectionRadius;
        this.particleCount = particleCount;
        this.deathRate = deathRate;
        this.cureRate = cureRate;
        this.reinfectionRate = reinfectionRate;
        this.socialDistancing = socialDistancing;
        this.socialDistancingStart = socialDistancingStart;
        this.connections = [];
        this.refreshRate = 5;
        this.refreshState = 0;
        this.normalCount = 0;
        this.infectedCount = 0;
        this.cureCount = 0;
        this.deathCount = 0;
    }

    init(){
        for (let i=0; i < this.particleCount; i++){
            this.particles.push(this.randomParticle());
        }
    }

    step(){
        this.refreshState++;
        let updateConnections = false;
        if (this.refreshRate <= this.refreshState){
            updateConnections = true;
            this.refreshState = 0;
        }
        let nextStepConnections = [];
        this.infectedCount = 0;
        this.normalCount = 0;
        this.cureCount = 0;
        this.deathCount = 0;

        for (var i = 0; i < this.particles.length; i++){
            this.particles[i].socialDistancingVelocity = new Vector(0,0);
            if (this.particles[i].health === HEALTH.normal){
                this.normalCount++;
            } else if (this.particles[i].health === HEALTH.infected){
                this.infectedCount++;
            } else if (this.particles[i].health === HEALTH.cured){
                this.cureCount++;
            } else if (this.particles[i].health === HEALTH.died){
                this.deathCount++;
            }
        }

        for (var i = 0; i < this.particles.length; i++){
            if (updateConnections) {
                for (var j = 0; j < i; j++){
                    let distance = Vector.distance(this.particles[i].position,this.particles[j].position);
                    if (distance < this.infectionRadius){
                        if (this.particles[i].health === HEALTH.infected && this.particles[j].health === HEALTH.normal
                            || this.particles[i].health === HEALTH.normal && this.particles[j].health === HEALTH.infected){
                            nextStepConnections.push(new Connection(i, j));
                        }
                        if (this.particles[i].health === HEALTH.infected && this.particles[j].health === HEALTH.cured
                            || this.particles[i].health === HEALTH.cured && this.particles[j].health === HEALTH.infected){
                            nextStepConnections.push(new Connection(i, j));
                        }
                    }

                    if (distance < this.socialDistancing && (this.infectedCount + this.cureCount + this.deathCount) >= this.socialDistancingStart){
                        if (!(this.particles[i].health === HEALTH.died || this.particles[j].health === HEALTH.died)){
                            var repelvector = Vector.sub(this.particles[i].position, this.particles[j].position).unitize().scale(this.socialDistancing - distance);
                            this.particles[i].socialDistancingVelocity.add(repelvector);
                            this.particles[j].socialDistancingVelocity.sub(repelvector);
                        }
                    }
                }
            }


        }

        for (var i = 0; i < this.particles.length; i++){
            this.particles[i].step();
        }

        if (!updateConnections){
            return;
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

            let particle1 = this.particles[nextStepConnections[i].node1];
            let particle2 = this.particles[nextStepConnections[i].node2];

            if (particle1.health === HEALTH.infected && particle2.health === HEALTH.normal){
                if (Math.random() < this.infectionRate) {
                    particle2.health = HEALTH.infected;
                }
            } else if (particle1.health === HEALTH.normal && particle2.health === HEALTH.infected){
                if (Math.random() < this.infectionRate) {
                    particle1.health = HEALTH.infected;
                }
            }

            if (particle1.health === HEALTH.infected && particle2.health === HEALTH.cured){
                if (Math.random() < this.infectionRate) {
                    particle2.health = HEALTH.infected;
                }
            } else if (particle1.health === HEALTH.cured && particle2.health === HEALTH.infected){
                if (Math.random() < this.infectionRate) {
                    particle1.health = HEALTH.infected;
                }
            }
        }

        this.connections = nextStepConnections;
    }

    draw(){
        const { width, height } = this.canvas.getBoundingClientRect();
        this.context.clearRect(0, 0, width, height);

        for (var i = 0; i< this.particles.length; i++){
            this.context.beginPath();
            this.context.arc(this.particles[i].position.x * width, this.particles[i].position.y * height,2,0,2*Math.PI);
            this.context.fillStyle = this.particles[i].color();
            this.context.fill();
        }

        for (var i = 0; i < this.connections.length; i++) {
            this.context.beginPath();
            let x = this.particles[this.connections[i].node1].position.x * width;
            let y = this.particles[this.connections[i].node1].position.y * height;
            this.context.moveTo(x, y);
            x = this.particles[this.connections[i].node2].position.x * width;
            y = this.particles[this.connections[i].node2].position.y * height;
            this.context.lineTo(x, y);
            this.context.strokeStyle = '#FFFFFF';
            this.context.lineWidth = 1;
            this.context.stroke();
        }
    }

    randomParticle(){
        let ret = new Particle(this.deathRate, this.cureRate);
        ret.position = new Vector(Math.random(), Math.random());
        ret.velocity = new Vector(Math.random()/100 - .005, Math.random()/100 - .005);

        return ret;
    }
}