import * as THREE from 'three';
import {SimplexNoise} from 'three/examples/jsm/math/SimplexNoise.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import * as dat from "three/addons/libs/lil-gui.module.min.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
camera.position.setZ(30);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#canvas')
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);
renderer.render(scene, camera);


const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(20, 20, 20);

const ambientLight = new THREE.AmbientLight(0xffffff);

scene.add(pointLight, ambientLight);


////////////////////////////
// Creates the plane
////////////////////////////

const planeGeometry = new THREE.PlaneGeometry(25, 25, 256, 256);
let planeVertices = planeGeometry.attributes.position.array;

const planeMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = +1;

scene.add(plane);

console.log(planeVertices);


///////////////////////////
// Adds 2D noise to the plane geometry so that realistic terrain can be created
///////////////////////////


const lightHelper = new THREE.PointLightHelper(pointLight);
const gridHelper = new THREE.GridHelper(200, 50);
scene.add(lightHelper, gridHelper);
scene.add(lightHelper);

const controls = new OrbitControls(camera, renderer.domElement);

function updatePlaneGeometry() {
    planeGeometry.dispose();
    plane.geometry = new THREE.PlaneGeometry(
        planeGeometry.parameters.width,
        planeGeometry.parameters.height,
        planeGeometry.parameters.widthSegments,
        planeGeometry.parameters.heightSegments
    );
    plane.geometry.attributes.position.array = new Float32Array(plane.geometry.attributes.position.array);
    planeVertices = plane.geometry.attributes.position.array;
    modifyVerticesWithBumpMap();
}


//add a gui to control the tesselation of the plane
const gui = new dat.GUI();
const segmentsControl = gui.addFolder('Segments');
segmentsControl.add(planeGeometry.parameters, 'widthSegments', 1, 256).name('Width').onChange(() => {
    updatePlaneGeometry();
});
segmentsControl.add(planeGeometry.parameters, 'heightSegments', 1, 256).name('Height').onChange(() => {
    updatePlaneGeometry();
});



const simplex = new SimplexNoise();
const noiseParams = {
    numOctaves: 6, // The number of noise layers (higher values create more detailed terrain)
    persistence: 0.5, // Controls the decrease in amplitude of each subsequent octave (0 < persistence <= 1)
    lacunarity: 2.0, // Controls the increase in frequency of each subsequent octave
    maxHeight: 20, // The maximum height of the terrain
    baseScale: 0.05, // The scale for the first noise layer (smaller values create larger terrain features)
    exponent: 0.8
};

const noiseControls = gui.addFolder('Noise');
noiseControls.add(noiseParams, 'numOctaves', 1, 10).name('Octaves').onChange(() => {
    updatePlaneGeometry();
});
noiseControls.add(noiseParams, 'persistence', 0.1, 1).name('Persistence').onChange(() => {
    updatePlaneGeometry();
});
noiseControls.add(noiseParams, 'lacunarity', 1, 3).name('Lacunarity').onChange(() => {
    updatePlaneGeometry();
});
noiseControls.add(noiseParams, 'maxHeight', 1, 100).name('Max Height').onChange(() => {
    updatePlaneGeometry();
});
noiseControls.add(noiseParams, 'baseScale', 0.01, 0.1).name('Base Scale').onChange(() => {
    updatePlaneGeometry();
});
noiseControls.add(noiseParams, 'exponent', 0.1, 3).name('Exponent').onChange(() => {
    updatePlaneGeometry();
});

function modifyVerticesWithBumpMap() {
    for (let i = 0; i < planeVertices.length / 3; i++) {
        const x = planeVertices[i * 3];
        const y = planeVertices[i * 3 + 1];
        let noiseValue = 0;
        let amplitude = 1;
        let frequency = noiseParams.baseScale;

        for (let j = 0; j < noiseParams.numOctaves; j++) {
            noiseValue += simplex.noise(x * frequency, y * frequency) * amplitude;
            amplitude *= noiseParams.persistence;
            frequency *= noiseParams.lacunarity;
        }

        // Normalize the noise value to the range [0, 1]
        noiseValue = (noiseValue + 1) / 2;
        noiseValue = Math.pow(noiseValue, noiseParams.exponent);
        // Update the z-coordinate of the vertex based on the noise value
        planeVertices[i * 3 + 2] = noiseValue * noiseParams.maxHeight;
    }

    planeGeometry.attributes.position.needsUpdate = true;
}


renderer.render(scene, camera);

function animate() {
    requestAnimationFrame(animate);
    modifyVerticesWithBumpMap();
    plane.rotation.z += 0.01;


    controls.update();

    renderer.render(scene, camera);
}

animate();
