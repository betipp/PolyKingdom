import {gltfAccessor} from './gltf_loader/accessor.js';
import {gltfBuffer} from './gltf_loader/buffer.js';
import {gltfBufferView} from './gltf_loader/buffer_view.js';
import {gltfCamera} from './gltf_loader/camera.js';
import {gltfImage} from './gltf_loader/image.js';
import {gltfLight} from './gltf_loader/light.js';
import {gltfMaterial} from './gltf_loader/material.js';
import {gltfMesh} from './gltf_loader/mesh.js';
import {gltfNode} from './gltf_loader/node.js';
import {gltfSampler} from './gltf_loader/sampler.js';
import {gltfScene} from './gltf_loader/scene.js';
import {gltfTexture} from './gltf_loader/texture.js';
import {initGlForMembers, objectsFromJsons, objectFromJson} from './gltf_loader/utils';
import {gltfAsset} from './gltf_loader/asset.js';
import {GltfObject} from './gltf_loader/gltf_object.js';
import {gltfAnimation} from './gltf_loader/animation.js';
import {gltfSkin} from './gltf_loader/skin.js';
import {vec3, mat4} from 'gl-matrix';
import {playerObject} from "./playerObject";
import {enemyObject} from "./enemyObject";
import {colliison} from "./collision";
import {Input_AttackButton, keys} from "./publicVariables";
import {backgroundMusic, playBackgroundMusic, stopCombatMusic} from "./audio";


class glTF extends GltfObject {
    constructor(file, viewer) {
        super();
        this.asset = undefined;
        this.accessors = [];
        this.nodes = [];
        this.scene = undefined; // the default scene to show.
        this.scenes = [];
        this.cameras = [];
        this.lights = [];
        this.textures = [];
        this.images = [];
        this.samplers = [];
        this.meshes = [];
        this.buffers = [];
        this.bufferViews = [];
        this.materials = [];
        this.animations = [];
        this.skins = [];
        this.path = file;
        this.player = null;
        this.viewer = viewer;
        this.playerDirectionVector = 0;
        this.playerDirection = "up";
        this.setUpAABB = true;
        this.enemies = [];
        this.killedEnemies = 0;
        this.awakeEnemies = 0;
    }

    initGl() {
        initGlForMembers(this, this);
    }

    fromJson(json) {
        super.fromJson(json);

        this.asset = objectFromJson(json.asset, gltfAsset);
        this.cameras = objectsFromJsons(json.cameras, gltfCamera);
        this.accessors = objectsFromJsons(json.accessors, gltfAccessor);
        this.meshes = objectsFromJsons(json.meshes, gltfMesh);
        this.samplers = objectsFromJsons(json.samplers, gltfSampler);
        this.materials = objectsFromJsons(json.materials, gltfMaterial);
        this.buffers = objectsFromJsons(json.buffers, gltfBuffer);
        this.bufferViews = objectsFromJsons(json.bufferViews, gltfBufferView);
        this.scenes = objectsFromJsons(json.scenes, gltfScene);
        this.textures = objectsFromJsons(json.textures, gltfTexture);
        this.nodes = objectsFromJsons(json.nodes, gltfNode);
        this.lights = objectsFromJsons(getJsonLightsFromExtensions(json.extensions), gltfLight);
        this.images = objectsFromJsons(json.images, gltfImage);
        this.animations = objectsFromJsons(json.animations, gltfAnimation);
        this.skins = objectsFromJsons(json.skins, gltfSkin);

        this.materials.push(gltfMaterial.createDefault());
        this.samplers.push(gltfSampler.createDefault());

        if (json.scenes !== undefined) {
            if (json.scene === undefined && json.scenes.length > 0) {
                this.scene = 0;
            } else {
                this.scene = json.scene;
            }
        }
        this.initPlayerAndEnemies();
    }

    initPlayerAndEnemies() {
        let tempHurtPlayerNode;
        let tempHurtEnemyNode;
        this.nodes.forEach(function (node) {
            //save player
            if (node.name === "player") {
                let primitive = this.meshes[node.mesh].primitives[0];
                let material = primitive.material;
                this.player = new playerObject(node, this, material);

            } else if (node.name.includes("enemy")) {
                let primitive = this.meshes[node.mesh].primitives[0];
                let material = primitive.material;
                this.enemies.push(new enemyObject(node, this, material));
            }
            else if (node.name === "player_hurt_floor"){
                tempHurtPlayerNode = node;
                node.alive = false;
            }
            else if (node.name === "Goblin_hurt_floor"){
                tempHurtEnemyNode = node;
                node.alive = false;
            }

        }.bind(this));

        //save red player
        let primitive = this.meshes[tempHurtPlayerNode.mesh].primitives[0];
        this.player.hurtMaterialIndex = primitive.material;

        //save red enemy
        primitive = this.meshes[tempHurtEnemyNode.mesh].primitives[0];
        this.enemies.forEach(function (enemy) {
            enemy.hurtMaterialIndex = primitive.material;
        }.bind(this));


    }

    initAABB() {
        let weaponScalingFactor = 2.2;     //for weapon collsion
        this.nodes.forEach(function (node2) {
            // copy AABB
            if (typeof this.meshes[node2.mesh] !== 'undefined' && this.meshes[node2.mesh].primitives !== 'undefined') {
                let accesorNumber = this.meshes[node2.mesh].primitives[0].attributes.POSITION;
                node2.aabbmin = this.accessors[accesorNumber].min;
                node2.aabbmax = this.accessors[accesorNumber].max;
                //setup wepon aabb
                //weapon has a range equal to boundingbox * weaponScalingFactor
                vec3.scale(node2.aabbWeaponMin, this.accessors[accesorNumber].min, weaponScalingFactor);
                vec3.scale(node2.aabbWeaponMax, this.accessors[accesorNumber].max, weaponScalingFactor);
                this.setUpAABB = false;

            }
        }.bind(this));


    }


    updateEnemies(dt) {
        for (var i = 0, len = this.enemies.length; i < len; i++) {
            let enemy = this.enemies[i];
            if (!enemy.playerDetection) {
                colliison.resolveEnemyDetectionRange(this.player, enemy, this);
            } else if (enemy.node.alive) {
                enemy.update( dt);
            }


        }
        keys[Input_AttackButton] = false;
    }


    update(dt) {

        if (this.setUpAABB) {
            this.initAABB();
        }

        this.player.update(dt);
        this.updateEnemies(dt);
    }

    subEnemies(){
        if (--this.awakeEnemies === 0){
            playBackgroundMusic();
        }
    }




}

function getJsonLightsFromExtensions(extensions) {
    if (extensions === undefined) {
        return [];
    }
    if (extensions.KHR_lights_punctual === undefined) {
        return [];
    }
    return extensions.KHR_lights_punctual.lights;
}


export {glTF};
