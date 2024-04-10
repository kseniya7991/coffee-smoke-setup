import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";

import smokeVertexShader from "./shaders/coffeeSmoke/smokeVertexShader.glsl";
import smokeFragmentShader from "./shaders/coffeeSmoke/smokeFragmentShader.glsl";

/**
 * Base
 */
// Debug
const gui = new GUI();
const global = {};
const debugObj = {
    playTime: false,
};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const textureLoader = new THREE.TextureLoader();
const smokeNoise = textureLoader.load("./perlin.png");
smokeNoise.wrapS = THREE.RepeatWrapping;
smokeNoise.wrapT = THREE.RepeatWrapping;
const gltfLoader = new GLTFLoader();

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100);
camera.position.x = 8;
camera.position.y = 10;
camera.position.z = 12;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.y = 3;
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1;

/**
 * Model
 */

gltfLoader.load("./bakedModel.glb", (gltf) => {
    gltf.scene.getObjectByName("baked").material.map.anisotropy = 8;
    scene.add(gltf.scene);
});

let marshmallows = [];
gltfLoader.load("./marshmallow4.glb", (gltf) => {
    const size = 0.2;

    let marshmallow = gltf.scene;
    marshmallow.position.set(0, 4.0, 0);
    marshmallow.scale.setScalar(size);

    const numCopies = 20;
    for (let i = 0; i < numCopies; i++) {
        const marshmallowCopy = marshmallow.clone();

        let positionX = Math.sin(i) * 2.5 + (Math.random() - 0.5) * 2.0;
        let positionY = 2 + Math.random();
        let positionZ = Math.cos(i) * 2.5 + (Math.random() - 0.5) * 2.0;

        marshmallowCopy.position.set(positionX, positionY, positionZ);
        let rotationX = Math.random() * 2.0;
        let rotationY = Math.random() * 2.0;
        let rotationZ = Math.random() * 2.0;

        marshmallowCopy.rotation.set(rotationX, rotationY, rotationZ);

        scene.add(marshmallowCopy); // Добавление копии модели в сцену

        //Physics
        const shape = new CANNON.Cylinder(size, size, 0.35, 16);
        const body = new CANNON.Body({
            position: new CANNON.Vec3(positionX, positionY, positionZ),
            mass: 1,
        });

        body.addShape(shape);

        const euler = new CANNON.Vec3(rotationX, rotationY, rotationZ);
        const quaternion = new CANNON.Quaternion();
        quaternion.setFromEuler(euler.x, euler.y, euler.z);
        body.quaternion.copy(quaternion);
        world.addBody(body);

        marshmallows.push({
            mesh: marshmallowCopy,
            body,
        });
    }
});

/**
 * Physics
 */

const world = new CANNON.World();

gui.add(debugObj, "playTime").name("Play time");

//optimization
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;

world.gravity.set(0, -9.82, 0);

//Materials
const defaultMaterial = new CANNON.Material("default");
const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
    friction: 1,
    restitution: 0.7,
});

world.addContactMaterial(defaultContactMaterial);
world.defaultContactMaterial = defaultContactMaterial;

//Physics Plane
const planeShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 5));
const planeBody = new CANNON.Body({
    position: new CANNON.Vec3(0, -0.5, 0),
});
planeBody.addShape(planeShape);
world.addBody(planeBody);

//Physics Cup
const cupShape = new CANNON.Cylinder(0.97, 0.97, 2.3, 40);
const cupBody = new CANNON.Body({
    position: new CANNON.Vec3(0, 1.0, 0),
    mass: 0,
});
cupBody.addShape(cupShape);
world.addBody(cupBody);

//Physics Cup Handle
const cupHandleShape = new CANNON.Box(new CANNON.Vec3(0.4, 0.8, 0.2));
const cupHandleBody = new CANNON.Body({
    position: new CANNON.Vec3(1.3, 1.1, 0),
    mass: 0,
});
cupHandleBody.addShape(cupHandleShape);
world.addBody(cupHandleBody);

/**
 * Smoke
 */

const smokeGeometry = new THREE.PlaneGeometry(1, 1, 180, 64);
const smokeMaterial = new THREE.ShaderMaterial({
    vertexShader: smokeVertexShader,
    fragmentShader: smokeFragmentShader,
    // wireframe: true,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    uniforms: {
        uTime: new THREE.Uniform(0),
        uTexture: new THREE.Uniform(smokeNoise),
    },
});

const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
smokeGeometry.translate(0, 0.5, 0);
smoke.position.y = 1.83;
smoke.scale.set(1.5, 6.0, 1.5);
scene.add(smoke);

/**
 * Light
 */
const light = new THREE.AmbientLight();
scene.add(light);

const directionalLight = new THREE.DirectionalLight("#fff", 1.9);
directionalLight.position.set(-4, 10, 4);

directionalLight.castShadow = true;
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.normalBias = 0.05;
directionalLight.shadow.bias = 0;
scene.add(directionalLight);

directionalLight.target.position.set(0, 0, 0);
//@ts-ignore
directionalLight.target.updateWorldMatrix();

/**
 * Debugger
 */

debugObj.debugger = false;
gui.add(debugObj, "debugger");

const debugOptions = {
    scale: 1,
    onUpdate: (body, mesh) => {
        mesh.visible = debugObj.debugger;
    },
};
const cannonDebugger = CannonDebugger(scene, world, debugOptions);

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    if (debugObj.playTime) {
        //Update uniforms
        smokeMaterial.uniforms.uTime.value = elapsedTime;

        //Update Physics
        world.step(1 / 60, deltaTime, 3);

        for (const object of marshmallows) {
            object.mesh.position.copy(object.body.position);
            object.mesh.quaternion.copy(object.body.quaternion);
        }
    }

    //Update Debugger
    cannonDebugger.update();

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();
