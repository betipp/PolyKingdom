import { gltfAccessor } from './accessor.js';
import { gltfBuffer } from './buffer.js';
import { gltfBufferView } from './buffer_view.js';
import { gltfCamera } from './camera.js';
import { gltfImage } from './image.js';
import { gltfLight } from './light.js';
import { gltfMaterial } from './material.js';
import { gltfMesh } from './mesh.js';
import { gltfNode } from './node.js';
import { gltfSampler } from './sampler.js';
import { gltfScene } from './scene.js';
import { gltfTexture } from './texture.js';
import { initGlForMembers, objectsFromJsons, objectFromJson } from './utils';
import { gltfAsset } from './asset.js';
import { GltfObject } from './gltf_object.js';
import { gltfAnimation } from './animation.js';
import { gltfSkin } from './skin.js';
import { keys } from './publicVariables.js';
import { vec3, mat4 } from 'gl-matrix';
import { playerWeaponAudio, playerHurtAudio, zombieHurtAudio, enemyDeathAudio, enemyDetectionSounds } from './audio.js';
import {playerObject} from "./playerObject";
import {colliison} from "./collision";


class enemyObject {
    constructor(node, gltf) {
        this.node = node;
        this.gltf = gltf;
        this.lives = 3;
        //enemy movement speed
        this.movementSpeed = 0.005;
        //if enemy detected player
        this.playerDetection = false;

    }

    update(){
        this.rotate();
        this.move();
        colliison.checkIfEnemyCaughtPlayer(this, this.gltf.player);
        //player attack
        if (keys['Space']) {
            colliison.resolveWeaponCollision(this.gltf.player, this);
        }
        this.gltf.nodes.forEach(function (node2) {
            if (this.node !== node2 && !node2.name.includes("_floor") && node2.alive){
                colliison.resolveCollision(this.node, node2)
            }


        }.bind(this));
    }



    move() {
        // console.log("moving")
        let enemyVector = this.node.translation;
        let playerVector = this.gltf.player.node.translation;
        let vectorFromEnemyToPlayer = vec3.create();
        vec3.set(vectorFromEnemyToPlayer, playerVector[0] - enemyVector[0], 0, playerVector[2] - enemyVector[2]);
        vec3.scaleAndAdd(this.node.translation, this.node.translation, vectorFromEnemyToPlayer, this.movementSpeed);
        this.node.applyTranslation(this.node.translation);


    }



    rotate(){
        let enemyVector = this.node.translation;
        let playerVector = this.gltf.player.node.translation;
        let newAngle = getAngleBetweenVertices(enemyVector, playerVector);
        this.node.rotate(newAngle);

    }

    subLives(){
        if (--this.lives <= 0){
            console.log(this.node.name+" dead");
            this.node.alive = false;
            enemyDeathAudio.play();
        }
    }



}

function normalizeAngle(angle){
    if (angle > 360) return angle - 360;
    if (angle < 0) return 360 + angle;
    else return angle;
}

function getAngleBetweenPoints(cx, cy, ex, ey){
    let dy = ey - cy;
    let dx = ex - cx;
    let theta = Math.atan2(dy, dx);
    theta *= 180 / Math.PI;
    return theta;
}

function getAngleBetweenVertices(vert1, vert2){
    return normalizeAngle(getAngleBetweenPoints(vert1[2], vert1[0], vert2[2], vert2[0])) * (Math.PI / 180);
}




export { enemyObject };