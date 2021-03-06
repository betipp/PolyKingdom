import {vec3} from 'gl-matrix';
import {gltfCamera} from './gltf_loader/camera.js';
import {jsToGl, clamp} from './gltf_loader/utils.js';

const VecZero = vec3.create();

class UserCamera extends gltfCamera {
    constructor(
        viewer,
        position = [0, 0, 0],
        target = [0, 0, 0],
        up = [0, 1, 0],
        xRot = 0,
        yRot = 0,
        //how much we zoom in
        zoom) {
        super();

        this.position = jsToGl(position);
        this.target = jsToGl(target);
        this.up = jsToGl(up);
        this.xRot = xRot;
        this.yRot = yRot;
        //zoom at the begining
        this.initialZoom = 0.022;
        this.zoom = this.initialZoom;
        this.zoomFactor = 1.04;
        this.rotateSpeed = 1 / 180;
        this.scaleFactor = 100;
        this.viewer = viewer;
        //scaler for player translation
        this.scale = 0.00183;
    }

    updatePosition() {

        this.moveTarget();
        //camera direction
        const direction = vec3.fromValues(1, 0.3, 0);
        this.toLocalRotation(direction);

        const position = vec3.create();
        vec3.scale(position, direction, this.zoom);
        vec3.add(position, position, this.target);

        this.position = position;
    }

    reset() {
        this.xRot = 0;
        this.yRot = 0;
        this.zoom = this.initialZoom;
    }

    zoomIn(value) {
        if (value > 0) {
            this.zoom *= this.zoomFactor;
        } else {
            this.zoom /= this.zoomFactor;
        }
    }

    rotate(x, y) {
        const yMax = Math.PI / 2 - 0.01;
        this.xRot += (x * this.rotateSpeed);
        this.yRot += (y * this.rotateSpeed);
        this.yRot = clamp(this.yRot, -yMax, yMax);
    }


    fitViewToScene() {
        this.moveTarget();
    }

    toLocalRotation(vector) {
        vec3.rotateX(vector, vector, VecZero, -this.yRot);
        vec3.rotateY(vector, vector, VecZero, -this.xRot);
    }

    getLookAtTarget() {
        return this.target;
    }

    getPosition() {
        return this.position;
    }


    moveTarget() {
        ///move camera as player moves
        vec3.scale(this.target, this.viewer.gltf.player.node.translation, this.scale);
    }


}

export {UserCamera};
