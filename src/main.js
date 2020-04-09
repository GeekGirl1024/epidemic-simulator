const HEALTH = {
    normal: "normal",
    infected: "infected",
    cured: "cured",
    died: "died"
}
Object.freeze(HEALTH);

const TESTSTATUS = {
    untested: "untested",
    positive: "positive",
    negative: "negative"
}
Object.freeze(TESTSTATUS);

class ListNode{
    constructor(data){
        this.data = data;
        this.prev = null;
        this.next = null;
    }
}

class List{
    constructor(){
        this.length = 0;
        this.head = null;
        this.end = null;
    }

    remove(node){
        let prev = node.prev;
        let next = node.next;
        if (prev) {
            prev.next = next;
        } else {
            this.head = next;
        }

        if (next){
            next.prev = prev;
        } else {
            this.end = prev;
        }

        node.prev = null;
        node.next = null;

        this.length--;
    }

    push(node){
        if (this.length === 0){
            this.head = node;
            this.end = node;
        } else {
            this.end.next = node;
            node.prev = this.end;
            this.end = node;
        }
        this.length++;
    }

    pop(){
        if (this.length === 0){
            return null;
        }
        let node = this.end;
        this.remove(this.end);
        return node;
    }
}

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
    constructor(deathRate, cureRate, testChance, testAccuracy, width, height) {
        this.position = new Vector(0, 0);
        this.velocity = new Vector(0, 0);
        this.width = width;
        this.height = height;
        this.health = HEALTH.normal;
        this.refreshState = 0;
        this.refreshRate = 30;
        this.deathRate = deathRate;
        this.cureRate = cureRate;
        this.socialDistancingVelocity = new Vector(0,0);
        this.testStatus = TESTSTATUS.untested;
        this.testChance = testChance;
        this.testAccuracy = testAccuracy;
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

    step(testStarted){
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
                this.testStatus = TESTSTATUS.untested;
            } else if(this.testStatus === TESTSTATUS.untested && testStarted){
                let testState = Math.random();
                if(testState < this.testChance) {
                    let testResult = Math.random();
                    if (testResult < this.testAccuracy) {
                        this.testStatus = TESTSTATUS.positive;
                    } else {
                        this.testStatus = TESTSTATUS.negative;
                    }
                }
            }
        }

        if(this.health === HEALTH.died || this.testStatus === TESTSTATUS.position){
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

        if (this.position.x > this.width){
            this.position.x = this.width - (this.position.x - this.width);
            this.velocity.x *= -1;
        }

        if (this.position.y > this.height){
            this.position.y = this.height - (this.position.y - this.height);
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
    constructor(canvasId, quarantineCanvasId, infectionRate, infectionRadius, particleCount, width, height, maxVelocity, deathRate, cureRate, reinfectionRate, socialDistancing, socialDistancingStart, testChance, testAccuracy, testStart){
        this.particles = new List();
        this.quarantinedParticles = new List();
        this.width = width;
        this.height = height;
        this.maxVelocity = maxVelocity;
        this.canvasId = canvasId;
        this.quarantineCanvasId = quarantineCanvasId;
        this.canvas = document.getElementById(this.canvasId);
        this.quarantineCanvas = document.getElementById(this.quarantineCanvasId);
        this.context = this.canvas.getContext("2d");
        this.quarantineContext = this.quarantineCanvas.getContext("2d");
        this.infectionRate = infectionRate;
        this.infectionRadius = infectionRadius;
        this.particleCount = particleCount;
        this.deathRate = deathRate;
        this.cureRate = cureRate;
        this.reinfectionRate = reinfectionRate;
        this.socialDistancing = socialDistancing;
        this.socialDistancingStart = socialDistancingStart;
        this.testChance = testChance;
        this.testAccuracy = testAccuracy;
        this.testStart = testStart;
        this.testStarted = false;
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
            this.particles.push(new ListNode(this.randomParticle()));
        }
    }

    recalculateCounts(){
        this.infectedCount = 0;
        this.normalCount = 0;
        this.cureCount = 0;
        this.deathCount = 0;

        let current = this.particles.head;
        while(current){
            let particle = current.data;
            particle.socialDistancingVelocity = new Vector(0,0);
            if (particle.health === HEALTH.normal){
                this.normalCount++;
            } else if (particle.health === HEALTH.infected){
                this.infectedCount++;
            } else if (particle.health === HEALTH.cured){
                this.cureCount++;
            } else if (particle.health === HEALTH.died){
                this.deathCount++;
            }
            current = current.next;
        }

        current = this.quarantinedParticles.head;
        while(current){
            let particle = current.data;
            particle.socialDistancingVelocity = new Vector(0,0);
            if (particle.health === HEALTH.normal){
                this.normalCount++;
            } else if (particle.health === HEALTH.infected){
                this.infectedCount++;
            } else if (particle.health === HEALTH.cured){
                this.cureCount++;
            } else if (particle.health === HEALTH.died){
                this.deathCount++;
            }
            current = current.next;
        }

        if (!this.testStarted && this.infectedCount + this.cureCount + this.deathCount >= this.testStart) {
            this.testStarted = true;
        }
    }

    getNextConnectionsAndCalculateSocalDistancingVelocity(){
        let nextStepConnections = [];
        let current = this.particles.head;
        while (current){
            let currentParticle = current.data;
            let otherCurrent = this.particles.head;
            while(otherCurrent !== current){
                let otherCurrentParticle = otherCurrent.data;
                let distance = Vector.distance(currentParticle.position,otherCurrentParticle.position);
                if (distance < this.infectionRadius){
                    if (currentParticle.health === HEALTH.infected && otherCurrentParticle.health === HEALTH.normal
                        || currentParticle.health === HEALTH.normal && otherCurrentParticle.health === HEALTH.infected){
                        nextStepConnections.push(new Connection(currentParticle, otherCurrentParticle));
                    } else if (currentParticle.health === HEALTH.infected && otherCurrentParticle.health === HEALTH.cured
                        || currentParticle.health === HEALTH.cured && otherCurrentParticle.health === HEALTH.infected){
                        nextStepConnections.push(new Connection(currentParticle, otherCurrentParticle));
                    }
                }

                if (distance < this.socialDistancing && (this.infectedCount + this.cureCount + this.deathCount) >= this.socialDistancingStart){
                    if (!(currentParticle.health === HEALTH.died || otherCurrentParticle.health === HEALTH.died)){
                        var repelvector = Vector.sub(currentParticle.position, otherCurrentParticle.position).unitize().scale(this.socialDistancing - distance);
                        currentParticle.socialDistancingVelocity.add(repelvector);
                        otherCurrentParticle.socialDistancingVelocity.sub(repelvector);
                    }
                }
                otherCurrent = otherCurrent.next;
            }
            current = current.next;

        }
        return nextStepConnections;
    }

    updateInfections(nextStepConnections){
        for (var i = 0; i < nextStepConnections.length; i++){
            let found = false;
            for (var j = 0; j < this.connections.length; j++){
                if (Connection.equals(nextStepConnections[i], this.connections[j])){
                    found = true;
                    break;
                }
            }

            if (found){
                continue;
            }

            let particle1 = nextStepConnections[i].node1;
            let particle2 = nextStepConnections[i].node2;

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
                if (Math.random() < this.reinfectionRate) {
                    particle2.health = HEALTH.infected;
                }
            } else if (particle1.health === HEALTH.cured && particle2.health === HEALTH.infected){
                if (Math.random() < this.reinfectionRate) {
                    particle1.health = HEALTH.infected;
                }
            }
        }

        this.connections = nextStepConnections;
    }

    quarantine(){
        let current = this.particles.head;
        while (current){
            if (current.data.testStatus === TESTSTATUS.positive){
                let next = current.next;
                this.particles.remove(current);
                this.quarantinedParticles.push(current);
                current = next;
            } else {
                current = current.next;
            }
        }

        current = this.quarantinedParticles.head;
        while (current){
            if (current.data.health === HEALTH.cured){
                let next = current.next;
                this.quarantinedParticles.remove(current);
                this.particles.push(current);
                current.data.testStatus = TESTSTATUS.untested;
                current = next;
            } else {
                current = current.next;
            }
        }
    }

    step(){
        this.refreshState++;
        let updateConnections = false;
        if (this.refreshRate <= this.refreshState){
            updateConnections = true;
            this.refreshState = 0;
        }

        this.recalculateCounts();

        this.quarantine();
        
        let nextStepConnections = [];

        if (updateConnections){
            nextStepConnections = this.getNextConnectionsAndCalculateSocalDistancingVelocity();
        }

        

        let current = this.particles.head;
        while(current){
            current.data.step(this.testStarted);
            current = current.next;
        }

        current = this.quarantinedParticles.head;
        while(current){
            current.data.step(false);
            current = current.next;
        }

        if (updateConnections){
            this.updateInfections(nextStepConnections);
        }

        
    }

    draw(){
        const { width, height } = this.canvas.getBoundingClientRect();
        this.context.clearRect(0, 0, width, height);

        let current = this.particles.head;
        while (current){
            let particle = current.data;
            this.context.beginPath();
            this.context.arc(particle.position.x / this.width * width, particle.position.y / this.height * height,2,0,2*Math.PI);
            this.context.fillStyle = particle.color();
            this.context.fill();
            current = current.next;
        }

        for (var i = 0; i < this.connections.length; i++) {
            this.context.beginPath();
            let x = this.connections[i].node1.position.x / this.width * width;
            let y = this.connections[i].node1.position.y / this.height * height;
            this.context.moveTo(x, y);
            x = this.connections[i].node2.position.x / this.width * width;
            y = this.connections[i].node2.position.y / this.height * height;
            this.context.lineTo(x, y);
            this.context.strokeStyle = '#FFFFFF';
            this.context.lineWidth = 1;
            this.context.stroke();
        }
    }

    drawQuarantine(){
        const { width, height } = this.quarantineCanvas.getBoundingClientRect();
        this.quarantineContext.clearRect(0, 0, width, height);

        let current = this.quarantinedParticles.head;
        while (current){
            let particle = current.data;
            this.quarantineContext.beginPath();
            this.quarantineContext.arc(particle.position.x / this.width * width, particle.position.y / this.height * height,2,0,2*Math.PI);
            this.quarantineContext.fillStyle = particle.color();
            this.quarantineContext.fill();
            current = current.next;
        }
    }

    randomParticle(){
        let ret = new Particle(this.deathRate, this.cureRate, this.testChance, this.testAccuracy, this.width, this.height);
        ret.position = new Vector(Math.random() * this.width, Math.random() * this.height);
        let velocity = Math.random() * this.maxVelocity * 2 - this.maxVelocity;
        let angle = Math.random()*2*Math.PI;
        ret.velocity = new Vector(velocity * Math.cos(angle), velocity * Math.sin(angle));

        return ret;
    }
}