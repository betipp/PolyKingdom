import {keys} from './publicVariables.js';
import {vec3, mat4} from 'gl-matrix';
import {enemyDeathAudio} from './audio.js';
import {colliison} from "./collision";
import {Input_AttackButton} from "./publicVariables";


class enemyObject {
    constructor(node, gltf, normalMaterialIndex) {
        this.node = node;
        this.gltf = gltf;
        this.lives = 3;
        //enemy movement speed
        this.movementSpeed = 0.18;
        //if enemy detected player
        this.playerDetection = false;
        this.moveBackFactor = 50;
        this.detectionEscapeRange = 60;
        this.detectionRange = 40;
        this.normalMaterialIndex = normalMaterialIndex;
        this.hurtMaterialIndex = undefined;
        this.numberOfHits = 0;

    }

    update(dt) {
        if (this.playerDetection) {
            this.rotate();
            this.move(dt);
            colliison.checkIfEnemyCaughtPlayer(this, this.gltf.player);
            colliison.checkIfPlayerEscaped(this, this.gltf.player, this.gltf);
            this.gltf.nodes.forEach(function (node2) {
                if (this.node !== node2 && !node2.name.includes("_floor") && node2.alive) {
                    colliison.resolveCollision(this.node, node2);
                }


            }.bind(this));
        }

        //player attack
        if (keys[Input_AttackButton]) {
            colliison.resolveWeaponCollision(this.gltf.player, this, dt);

        }

    }


    move(dt) {
        // console.log("moving")
        let enemyVector = this.node.translation;
        let playerVector = this.gltf.player.node.translation;
        let vectorFromEnemyToPlayer = vec3.create();
        vec3.set(vectorFromEnemyToPlayer, playerVector[0] - enemyVector[0], 0, playerVector[2] - enemyVector[2]);
        vec3.scaleAndAdd(this.node.translation, this.node.translation, vectorFromEnemyToPlayer, dt * this.movementSpeed);
        this.node.applyTranslation(this.node.translation);


    }

    moveBack(dt) {
        // console.log("moving")
        let enemyVector = this.node.translation;
        let playerVector = this.gltf.player.node.translation;
        let vectorFromEnemyToPlayer = vec3.create();
        vec3.set(vectorFromEnemyToPlayer, playerVector[0] - enemyVector[0], 0, playerVector[2] - enemyVector[2]);
        vec3.negate(vectorFromEnemyToPlayer, vectorFromEnemyToPlayer);
        vec3.scaleAndAdd(this.node.translation, this.node.translation, vectorFromEnemyToPlayer, dt * this.movementSpeed * this.moveBackFactor);
        this.node.applyTranslation(this.node.translation);


    }


    rotate() {
        let enemyVector = this.node.translation;
        let playerVector = this.gltf.player.node.translation;
        let newAngle = getAngleBetweenVertices(enemyVector, playerVector);
        this.node.rotate(newAngle);

    }

    subLives() {
        if (--this.lives <= 0) {
            // console.log(this.node.name+" dead");
            this.node.alive = false;
            this.gltf.subEnemies();
            enemyDeathAudio.play();
            if (++this.gltf.killedEnemies === this.gltf.enemies.length) {
                window.location.replace("Victory.html");
            }
        }
        this.showHurtMaterial();
    }

    showNormalMaterial() {
        if (--this.numberOfHits === 0) {
            this.gltf.meshes[this.node.mesh].primitives[0].material = this.normalMaterialIndex;
        }

    }

    showHurtMaterial() {
        this.gltf.meshes[this.node.mesh].primitives[0].material = this.hurtMaterialIndex;
        this.numberOfHits++;
        setTimeout(this.showNormalMaterial.bind(this), 2000);
    }


}

function normalizeAngle(angle) {
    if (angle > 360) return angle - 360;
    if (angle < 0) return 360 + angle;
    else return angle;
}

function getAngleBetweenPoints(cx, cy, ex, ey) {
    let dy = ey - cy;
    let dx = ex - cx;
    let theta = Math.atan2(dy, dx);
    theta *= 180 / Math.PI;
    return theta;
}

function getAngleBetweenVertices(vert1, vert2) {
    return normalizeAngle(getAngleBetweenPoints(vert1[2], vert1[0], vert2[2], vert2[0])) * (Math.PI / 180);
}


export {enemyObject};
