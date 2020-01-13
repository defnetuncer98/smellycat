import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from './node_modules/three/examples/jsm/loaders/FBXLoader.js';

//////////////////////////////
// Global objects   
//////////////////////////////
var play = false;

function onPlayClick() {
    loading.style.display = "none";
    container.style.display = "block";
    
    play=true; score=0;
    info.style.display="block";
    info.innerText='Score: '+score;
    playbutton.style.display="none";
}

function onDocumentMouseClick( event ) {
        event.preventDefault();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        var intersects = raycaster.intersectObjects( roomscene.children );
        if ( intersects.length > 0 ) {
                var object = intersects[ 0 ].object;
                if(object.name!="mesh_1"){
                      score+=1;
                      if(score==10) {
                          playbutton.style.display="block";
                          play=false;
                          playbutton.innerHTML = "Smelly Cat WINS! Play Again?";
                      }
                      info.innerText='Score: '+score;
                      scene.remove(scene.getObjectByName("roomscene"));
                      roomscene.remove(object);
                      scene.add(roomscene);


//                    var helper = new THREE.BoxHelper(object);
//                    helper.geometry.computeBoundingBox();
//                    var width = (helper.geometry.boundingBox.max.x - helper.geometry.boundingBox.min.x);
//                    var height = (helper.geometry.boundingBox.max.y - helper.geometry.boundingBox.min.y);
//                    var depth = (helper.geometry.boundingBox.max.z - helper.geometry.boundingBox.min.z);                
//                    var ballShape = new Ammo.btBoxShape( new Ammo.btVector3( width,height,depth) );
//                    ballShape.setMargin( 0.0 );
//                    var ballMass = 1;
//                    var ballBody = createRigidBody( object, ballShape, ballMass, object.position, object.quaternion );
//                    ballBody.setFriction( 0.5 );
            }
        }
}
var info = document.getElementById('info');
var container = document.getElementById('container');
var playbutton = document.getElementById('playbutton');
var loading = document.getElementById('loading');
playbutton.addEventListener('click', onPlayClick);
var score = 0;
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var rotay=2;
var space = false;
var scene = null; // THREE.Scene where it all will be rendered
var renderer = null;
var camera = null;
var clock = null;
var mixers = []; // All the THREE.AnimationMixer objects for all the animations in the scene
var birdmixer; // All the THREE.AnimationMixer objects for all the animations in the scene
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var prevTime = performance.now();
var controls = null;
var shiftisup = true;
var idle = true;
var transformAux1;
var softBodyHelpers;
var physicsWorld;
var raycaster = new THREE.Raycaster();
var ballMaterial = new THREE.MeshPhongMaterial( { color: 0x202020 } );
var pos = new THREE.Vector3();
var quat = new THREE.Quaternion();
var margin = 0.05;
var rigidBodies = [];  // hold cat in the first index, and rest is balls
var softBodies = [];
const gravityConstant = - 20;
var clickRequest = false;
var mouseCoords = new THREE.Vector2();
var roomscene = new THREE.Group();  // all room is in here
var bird;
var flying=false;
var flyingleft=true;
function createRigidBody( threeObject, physicsShape, mass, pos, quat ) {
        threeObject.position.copy( pos );
        threeObject.quaternion.copy( quat );
        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
        transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
        var motionState = new Ammo.btDefaultMotionState( transform );
        var localInertia = new Ammo.btVector3( 0, 0, 0 );
        physicsShape.calculateLocalInertia( mass, localInertia );
        var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
        var body = new Ammo.btRigidBody( rbInfo );
        threeObject.userData.physicsBody = body;
        threeObject.castShadow = true;
        threeObject.receiveShadow = true;         
        if ( mass > 0 ) {
                scene.add( threeObject );
                rigidBodies.push( threeObject );
                // Disable deactivation
                //body.setActivationState( 4 );
        }
        //else {
            //roomscene.add(threeObject);
        //}
        //else console.log('no mass mesh');
        
        physicsWorld.addRigidBody( body );
        return body;
}

//
//////////////////////////////
// Information about our 3D models and units
//////////////////////////////
// The names of the 3D models to load. One-per file.
// A model may have multiple SkinnedMesh objects as well as several rigs (armatures). Units will define which
// meshes, armatures and animations to use. We will load the whole scene for each object and clone it for each unit.
var MODELS = [
        { 
            name: "SmellyCat", 
            loader:"fbx",
            path: "./node_modules/three/examples/models/fbx/cat.fbx",
            //position: { x: -1.1, y: 1, z: -0.5 }, //on the chair
            position: { x: 0, y: 0, z: 0 }, //on the bed
            rotation: { x: 0, y: 0, z: 0},
            scale: 0.0003, // Scaling of the unit. 1.0 means: use original size, 0.1 means "10 times smaller", etc.
            animationName: 5 // Name of animation to run            
        },    
        { 
            name: "Redcoat-Robin", 
            loader:"gltf",
            path: "./node_modules/three/examples/models/gltf/redcoat-robin/scene.gltf",
            //position: { x: -1.1, y: 1, z: -0.5 }, //on the chair
            position: { x: 0.4, y: 1.32, z: -0.22 }, //on the bed
            rotation: { x: 0, y: 0, z: 0},
            scale: 0.0002, // Scaling of the unit. 1.0 means: use original size, 0.1 means "10 times smaller", etc.
            animationName: 3 // Name of animation to run            
        },         
        {
            name: "BedroomInArles", 
            loader: "gltf",
            path: "./node_modules/three/examples/models/gltf/BedroomInArles/bedroom.glb",
            position: { x: 0, y: 0, z: 0 }, // Where to put the unit in the scene
            scale: 20, // Scaling of the unit. 1.0 means: use original size, 0.1 means "10 times smaller", etc.
        },
];

Ammo().then( function ( AmmoLib ) {
    Ammo = AmmoLib;
    init();
    animate();
} );

function init() {
    initScene();
    initRenderer();
    initPhysics();
    loadModels();
    //initInput();
}    

function initPhysics() {
        // Physics configuration
//        var collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
//        var dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
//        var broadphase = new Ammo.btDbvtBroadphase();
//        var solver = new Ammo.btSequentialImpulseConstraintSolver();
//        var softBodySolver = new Ammo.btDefaultSoftBodySolver();
//        physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver );
//        physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
//        physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
//        transformAux1 = new Ammo.btTransform();
//        softBodyHelpers = new Ammo.btSoftBodyHelpers();
        var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        var dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
        var broadphase = new Ammo.btDbvtBroadphase();
        var solver = new Ammo.btSequentialImpulseConstraintSolver();
        var softBodySolver = new Ammo.btDefaultSoftBodySolver();
        physicsWorld = physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
        physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
        //physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
        transformAux1 = new Ammo.btTransform();
        softBodyHelpers = new Ammo.btSoftBodyHelpers();
}
//////////////////////////////
//////////////////////////////
// Function implementations
//////////////////////////////
/**
 * Function that starts loading process for the next model in the queue. The loading process is
 * asynchronous: it happens "in the background". Therefore we don't load all the models at once. We load one,
 * wait until it is done, then load the next one. When all models are loaded, we call loadUnits().
 */
function loadModels() {
        for ( var i = 0; i < MODELS.length; ++ i ) {
                var m = MODELS[ i ];
                if(i===2) {loadRoomModel(m); continue;}
                if(m.loader==="fbx") loadFBXModel( m );
                else loadGLTFModel( m );
        }
        pos.set( 0, -0.4, 0 );
        quat.set( 0, 0, 0, 1 );
        var ground = createParalellepiped( 100, 1, 100, 0, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );
        ground.castShadow = true;
        ground.receiveShadow = true;        
}

function createParalellepiped( sx, sy, sz, mass, pos, quat, material ) {
        var threeObject = new THREE.Mesh( new THREE.BoxBufferGeometry( sx, sy, sz, 1, 1, 1 ), material );
        var shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
        shape.setMargin( margin );
        createRigidBody( threeObject, shape, mass, pos, quat );
        return threeObject;
}

/**
 * Start animation for a specific mesh object. Find the animation by name in the 3D model's animation array
 * @param skinnedMesh {THREE.SkinnedMesh} The mesh to animate
 * @param animations {Array} Array containing all the animations for this model
 * @param animationName {string} Name of the animation to launch
 * @return {THREE.AnimationMixer} Mixer to be used in the render loop
 */
function startAnimation( skinnedMesh, animations, animationName ) {
        var mixer = new THREE.AnimationMixer( skinnedMesh );
        //var clip = THREE.AnimationClip.findByName( animations, animationName );
        //if ( clip ) {
        //        var action = mixer.clipAction( clip );
        //        action.play();
        //}
        var action = mixer.clipAction(animations[animationName]);
        action.play();
        mixers.push(mixer);
}

/**
 * Find a model object by name
 * @param name
 * @returns {object|null}
 */
function getModelByName( name ) {
        for ( var i = 0; i < MODELS.length; ++ i ) {
                if ( MODELS[ i ].name === name ) {
                        return MODELS[ i ];
                }
        }
        return null;
}


function loadGLTFModel( model ) {
        var loader = new GLTFLoader(); 
        loader.load( model.path, function ( gltf ) {
                if ( model.position ) {
                        gltf.scene.position.copy(  new THREE.Vector3( model.position.x, model.position.y, model.position.z ));
                }
                if ( model.scale ) {
                        gltf.scene.scale.copy(  new THREE.Vector3( model.scale, model.scale, model.scale ));
                }
                if ( model.rotation ) {
                        gltf.scene.rotation.copy( new THREE.Euler( model.rotation.x,model.rotation.y,model.rotation.z));
                }
                var mixer = new THREE.AnimationMixer( gltf.scene );
                var action = mixer.clipAction(gltf.animations[model.animationName]);
                action.play();
                birdmixer= mixer;
                scene.add(gltf.scene);
                bird=gltf;
        });
}
function loadRoomModel( model ) {
        var loader = new GLTFLoader(); 
        loader.load( model.path, function ( gltf ) {
                // Enable Shadows
                var gltfscene = gltf.scene;
                var yey = [];
                var i=0;
                //console.log(gltfscene);
                //scene.add(gltfscene);
                
                // bed
                pos.set( 0.8, 0, -1.6 );
                quat.set( 0, 0, 0, 1 );
                createParalellepiped( 1.2, 1.63, 3, 0, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );
                
                // wall near bed
                pos.set( 2, 0, 3 );
                quat.set( 0, 0, 0, 1 );
                createParalellepiped( 1, 10, 10, 0, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );
                // opposite wall
                pos.set( -2.1, 0, 0 );
                quat.set( 0, 0, 0, 1 );
                createParalellepiped( 1, 15, 10, 0, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );
                
                
                // wall with window
                pos.set( 0, 0, -3.3 );
                quat.set( 0, 0, 0, 1 );
                createParalellepiped( 10, 10, 1, 0, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );
                // opposite wall
                pos.set( 0, 0, 2.5 );
                quat.set( 0, 0, 0, 1 );
                createParalellepiped( 10, 10, 1, 0, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );                

                // chair by the wall
                pos.set( -1.3, 0, -0.4 );
                quat.set( 0, 0, 0, 1 );
                createParalellepiped( 0.5, 1.1, 0.5, 0, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );                                 

            
                // chair by the bed
                pos.set( 0, 0, -2 );
                quat.set( 0, 1, 0, 1 );
                createParalellepiped( 0.5, 1.1, 0.5, 0, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );                                 

            
                // table by the bed
                pos.set( -0.5, 1, -2 );
                quat.set( 0, 0, 0, 1 );
                createParalellepiped( 1, 0.2, 1, 0, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );                                 
            
            
                gltfscene.traverse( function ( object ) {
                        if ( object.isMesh) {
                            yey.push(object);
                        }
                        i++;
                } );
                var i = 0;
                
                yey.forEach( function (object) {
                    var objecttemp = object;
                    
//                    //this
//                    var width = (objecttemp.geometry.boundingBox.max.x - objecttemp.geometry.boundingBox.min.x);
//                    var height = (objecttemp.geometry.boundingBox.max.y - objecttemp.geometry.boundingBox.min.y);
//                    var depth = (objecttemp.geometry.boundingBox.max.z - objecttemp.geometry.boundingBox.min.z);
//                    console.log(object.geometry.boundingBox);
//                    console.log('width: '+width, 'height: '+height, 'depth: '+depth);
//
//                    // or this (but probably this)
//                    var helper = new THREE.BoxHelper(object);
//                    helper.geometry.computeBoundingBox();
//                    var width = (helper.geometry.boundingBox.max.x - helper.geometry.boundingBox.min.x);
//                    var height = (helper.geometry.boundingBox.max.y - helper.geometry.boundingBox.min.y);
//                    var depth = (helper.geometry.boundingBox.max.z - helper.geometry.boundingBox.min.z);
//                    console.log(helper.geometry.boundingBox);
//                    console.log('width: '+width, 'height: '+height, 'depth: '+depth);                    
                    
                    
                    // or this
//                    var boundingBox = new THREE.Box3();
//                    boundingBox.copy(objecttemp.geometry.boundingBox);
//                    objecttemp.updateMatrixWorld(true);
//                    boundingBox.applyMatrix4(object.matrixWorld);
//                    var width = boundingBox.max.x - boundingBox.min.x;
//                    var height = boundingBox.max.y - boundingBox.min.y;
//                    var depth = boundingBox.max.z - boundingBox.min.z;
                    //console.log(objecttemp.geometry.boundingBox);
                    //console.log('width: '+width, 'height: '+height, 'depth: '+depth);

                    //console.log("whaa");
                    
                    
                    //var ballMass = width.toFixed(2)*height.toFixed(2)*depth.toFixed(2);
//                    var ballMass=0;
//                    if(depth<3.5){
//                        var ballShape = new Ammo.btBoxShape( new Ammo.btVector3( width, height, depth ) );
//                        ballShape.setMargin( 0.0 );
//                        var ballBody = createRigidBody( objecttemp, ballShape, ballMass, objecttemp.position, objecttemp.quaternion );
//                        ballBody.setFriction( 0.5 );
//                        console.log(i);
//                    }
//                    else{
                        roomscene.add(objecttemp);
//                    }
                });
            
                console.log( "Done loading model", model.name );
                roomscene.name = "roomscene";
                scene.add(roomscene);
            
                } );
}

/**
 * Load a 3D model from a FBX file. Use the FBXLoader.
 * @param model {object} Model config, one item from the MODELS array. It will be updated inside the function!
 */
function loadFBXModel( model ) {
        var loader = new FBXLoader();
        loader.load( model.path, function ( gltf ) {
                // Enable Shadows
                gltf.traverse( function ( object ) {
                        if ( object.isMesh ) {
                                object.castShadow = true;
                        }
                } );
                // Different models can have different configurations of armatures and meshes. Therefore,
                // We can't set position, scale or rotation to individual mesh objects. Instead we set
                // it to the whole cloned scene and then add the whole scene to the game world
                // Note: this may have weird effects if you have lights or other items in the GLTF file's scene!
                if ( model.position ) {
                        gltf.position.copy(  new THREE.Vector3( model.position.x, model.position.y, model.position.z ));
                }
                if ( model.scale ) {
                        gltf.scale.copy(  new THREE.Vector3( model.scale, model.scale, model.scale ));
                }
                if ( model.rotation ) {
                        gltf.rotation.copy( new THREE.Euler( model.rotation.x,model.rotation.y,model.rotation.z));
                }
                startAnimation( gltf, gltf.animations, model.animationName );
                var ballMass = 10;
                var ballShape = new Ammo.btBoxShape( new Ammo.btVector3( 0.1,0.1,0.4 )  );
                ballShape.setMargin( 0.0 );
                var body = createRigidBody( gltf, ballShape, ballMass, gltf.position, gltf.quaternion );
                body.setFriction( 0.5 );
                body.setActivationState( 4 );
                console.log( "Done loading model", model.name );
                controls = new ThirdPersonControls( rigidBodies[0], renderer.domElement );       
                camera.position.copy(new THREE.Vector3(rigidBodies[0].x,rigidBodies[0].y+1,rigidBodies[0].z-1.5));
        } );
}
/**
 * Render loop. Renders the next frame of all animations
 */
function animate() {
        // Get the time elapsed since the last frame
        var delta = clock.getDelta();
        
        // Update all the animation frames
//        for ( var i = 0; i < mixers.length; ++ i ) {
//                mixers[ i ].update( delta );
//        }
        
        if(rigidBodies.length>0 && play){
            if(!idle) mixers[0].update(delta);
            controls.update( delta );  
            if(flying)birdmixer.update(delta*0.1);
            else birdmixer.update(delta);
        }
        
        //https://stackoverflow.com/questions/11636887/camera-lookat-vector?noredirect=1&lq=1
        //https://stackoverflow.com/questions/14813902/three-js-get-the-direction-in-which-the-camera-is-looking
        //var vector = camera.getWorldDirection();
        //var theta = Math.atan2(vector.x,vector.z);
        //models[0].rotation.copy(  new THREE.Euler(theta, 0, theta ));
        //scene.add(models[0]);        
        //updatePhysics( delta );
	//processClick();
        requestAnimationFrame( animate );
        renderer.render( scene, camera );
}

//////////////////////////////
// General Three.JS stuff
//////////////////////////////
// This part is not anyhow related to the cloning of models, it's just setting up the scene.
/**
 * Initialize ThreeJS scene renderer
 */
function initRenderer() {
        var canvas = document.createElement( 'canvas' );
        var context = canvas.getContext( 'webgl2', { alpha: false } );
        renderer = new THREE.WebGLRenderer( { canvas: canvas, context: context } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.gammaOutput = true;
        renderer.gammaFactor = 2.2;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild( renderer.domElement );
}
/**
 * Initialize ThreeJS THREE.Scene
 */
function initScene() {
        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.set( 0, 100, 0 );
        camera.lookAt(0,0,0);
        clock = new THREE.Clock();
        scene = new THREE.Scene();
      
        scene.background = new THREE.Color( 0x3744ff );
        //scene.fog = new THREE.Fog( 0xa0a0a0, 10, 22 );
        var hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
        hemiLight.position.set( 0, 20, 0 );
        scene.add( hemiLight );
        var dirLight = new THREE.DirectionalLight( 0xffffff );
        dirLight.position.set( - 3, 10, - 10 );
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 10;
        dirLight.shadow.camera.bottom = - 10;
        dirLight.shadow.camera.left = - 10;
        dirLight.shadow.camera.right = 10;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 40;
        scene.add( dirLight );
        window.addEventListener( 'resize', onWindowResize, false );
        window.addEventListener( 'click', onDocumentMouseClick, false );
        var axesHelper = new THREE.AxesHelper( 100 );
        //scene.add( axesHelper );
        var size = 10;
        var divisions = 10;

        var gridHelper = new THREE.GridHelper( size, divisions );
        //scene.add( gridHelper );
}

/**
 * A callback that will be called whenever the browser window is resized.
 */
function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
        controls.handleResize();
}

function ThirdPersonControls ( object, domElement ) {

	this.object = object;
	this.domElement = domElement;

	// API

	this.enabled = true;

	this.lookVertical = true;
	this.autoForward = false;

	this.activeLook = true;

	this.heightSpeed = false;
	this.heightCoef = 1.0;
	this.heightMin = 0.0;
	this.heightMax = 1.0;

        this.movementSpeed = 25;
        this.lookSpeed = 0.1;

        this.constrainVertical = true;
        this.verticalMax = 2.1; //default Math.PI
        this.verticalMin = 1.9; //default 0
        
        this.constrainHorizontal = true;
        this.horizontalMax = 5;
        this.horizontalMin = 4.5;       
    
	this.mouseDragOn = false;

	// internals

	this.autoSpeedFactor = 0.0;

	this.mouseX = 0;
	this.mouseY = 0;
        
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        
	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;

	this.viewHalfX = 0;
	this.viewHalfY = 0;

	// private variables

	var lat = 0;
	var lon = 0;

	var lookDirection = new THREE.Vector3();
	var spherical = new THREE.Spherical();
	var target = new THREE.Vector3();

	//

	if ( this.domElement !== document ) {
		this.domElement.setAttribute( 'tabindex', - 1 );
	}

	//

	this.handleResize = function () {

		if ( this.domElement === document ) {
			this.viewHalfX = window.innerWidth / 2;
			this.viewHalfY = window.innerHeight / 2;
		} else {
			this.viewHalfX = this.domElement.offsetWidth / 2;
			this.viewHalfY = this.domElement.offsetHeight / 2;
		}

	};
/*
	this.onMouseDown = function ( event ) {

		if ( this.domElement !== document ) {

			this.domElement.focus();

		}

		event.preventDefault();
		event.stopPropagation();

		if ( this.activeLook ) {

			switch ( event.button ) {

				case 0: this.moveForward = true; break;
				case 2: this.moveBackward = true; break;

			}

		}

		this.mouseDragOn = true;

	};

	this.onMouseUp = function ( event ) {

		event.preventDefault();
		event.stopPropagation();

		if ( this.activeLook ) {

			switch ( event.button ) {

				case 0: this.moveForward = false; break;
				case 2: this.moveBackward = false; break;

			}

		}

		this.mouseDragOn = false;

	};
*/
	this.onMouseMove = function ( event ) {
                this.mouseDeltaX = event.movementX;
                this.mouseDeltaY = event.movementY;

		if ( this.domElement === document ) {
			this.mouseX = event.pageX - this.viewHalfX;
			this.mouseY = event.pageY - this.viewHalfY;
		} else {
			this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
			this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;
		}

	};

	this.onKeyDown = function ( event ) {

		//event.preventDefault();

		switch ( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = true; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveRight = true; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = true; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveLeft = true; break;

//			case 82: /*R*/ this.moveUp = true; break;
//			case 70: /*F*/ this.moveDown = true; break;

                        case 16: /*Shift*/ shiftisup = false; break;
                        case 32: /*Space*/ space = true; break;
                            

		}

	};

	this.onKeyUp = function ( event ) {

		switch ( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = false; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveRight = false; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = false; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveLeft = false; break;

//			case 82: /*R*/ this.moveUp = false; break;
//			case 70: /*F*/ this.moveDown = false; break;
                        
                        case 16: /*Shift*/ shiftisup = true; break;
		}

	};

	this.update = function () {

		return function update( delta ) {

			if ( this.enabled === false ) return;

			if ( this.heightSpeed ) {
				var y = THREE.Math.clamp( this.object.position.y, this.heightMin, this.heightMax );
				var heightDelta = y - this.heightMin;
				this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );
			} else {
				this.autoSpeedFactor = 0.0;
			}

                        if ( ! this.activeLook ) actualLookSpeed = 0;


			var actualLookSpeed = delta * this.lookSpeed;
                        var actualMoveSpeed  = delta * this.movementSpeed;
                        if(!shiftisup) actualMoveSpeed = delta * this.movementSpeed * 3;


			var verticalLookRatio = 1;
			if ( this.constrainVertical ) verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );
                        var horizontalLookRatio = 1;
			if ( this.constrainHorizontal ) horizontalLookRatio = Math.PI / ( this.horizontalMax - this.horizontalMin );

			lat -= this.mouseY * actualLookSpeed * verticalLookRatio;
			lat = Math.max( - 85, Math.min( 85, lat ) );
			var phi = THREE.Math.degToRad( 90 - lat );


                        this.lookVertical=false;
                        if(this.lookVertical) lon -= this.mouseX * actualLookSpeed * horizontalLookRatio;
			lon = Math.max( - 0, Math.min( 0, lon ) );
                        var theta = THREE.Math.degToRad( lon );

			if ( this.constrainVertical ) {
				phi = THREE.Math.mapLinear( phi, 0, Math.PI, this.verticalMin, this.verticalMax );
			}

			if ( this.constrainHorizontal ) {
				theta = THREE.Math.mapLinear( theta, 0, Math.PI, this.horizontalMin, this.horizontalMax );
			}

                        var velox=0;
                        var veloz=0;
                        
                        if ( this.moveLeft) { //A
                            idle=false; 
                            rotay-=0.05;
                           // velox = -actualMoveSpeed;
                        }
			else if ( this.moveRight ) { //D
                            idle=false;
                            rotay+=0.05;                            
                           // velox = actualMoveSpeed;
                        }
                        else {
                            idle=true;
                        }

			if ( this.moveBackward) { //S
                            idle=false; 
                            veloz = -actualMoveSpeed*Math.cos(rotay);
                            velox = -actualMoveSpeed*Math.sin(rotay);
                            //this.object.userData.physicsBody.setLinearVelocity(new Ammo.btVector3( 0, 0, -actualMoveSpeed));
                            
                            //this.object.translateZ( - ( actualMoveSpeed ) );
                            //camera.lookAt(this.object.position);
                        }
			else if ( this.moveForward ) { //W
                            idle=false;
                            veloz = actualMoveSpeed*Math.cos(rotay);
                            velox = actualMoveSpeed*Math.sin(rotay);
                            //this.object.userData.physicsBody.setLinearVelocity(new Ammo.btVector3( 0, 0, actualMoveSpeed));
                            
                            //this.object.translateZ( actualMoveSpeed );
                        }
                        else{
                            if(!this.moveLeft && !this.moveRight) idle=true;
                            //this.object.userData.physicsBody.setLinearVelocity(new Ammo.btVector3( 0, 0, 0));                            
                        }
                        
                        this.object.userData.physicsBody.setLinearVelocity(new Ammo.btVector3( velox, 0, veloz));                        
                    if(space) {
                            this.object.userData.physicsBody.setLinearVelocity(new Ammo.btVector3( 0, actualMoveSpeed*10, 0));
                            space=false;
                        }                        
                        
                        // Step world
                        physicsWorld.stepSimulation( delta, 10 );
                        // Update rigid bodies
                        for ( var i = 0, il = rigidBodies.length; i < il; i ++ ) {
                                var objThree = rigidBodies[ i ];
                                var objPhys = objThree.userData.physicsBody;
                                objThree.userData.physicsBody.setActivationState( 4 );
                                var ms = objPhys.getMotionState();
                                if ( ms ) {
                                        ms.getWorldTransform( transformAux1 );
                                        var p = transformAux1.getOrigin();
                                        var q = transformAux1.getRotation();
                                        objThree.position.set( p.x(), p.y(), p.z() );
                                        if(i!=0) objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
                                        //objThree.rotation.y = 0.44+(-this.mouseX*0.001);
                                }
                        }        
                        
                        this.object.rotation.y = rotay;

                        var deltacamera = new THREE.Vector3(this.object.position.x+Math.sin(Math.PI*3/2-this.mouseX*0.002)*1.5, 
                                                            this.object.position.y+1+Math.sin(this.mouseY*0.002), 
                                                            this.object.position.z+Math.cos(Math.PI*3/2-this.mouseX*0.002)*1.5)
                        camera.position.copy(deltacamera);
                        
                        // look at the cat
                        camera.lookAt(new THREE.Vector3(this.object.position.x,
                                                        this.object.position.y-this.mouseY*0.002,
                                                        this.object.position.z));
                        
                        // look also up and down
                        //camera.lookAt(new THREE.Vector3().setFromSphericalCoords( 1, phi, theta ).add( camera.position ));
                                     
                        //this.object.rotation.y = 4.4+(-this.mouseX*0.001);
                        
                        //rotateAboutPoint(roomscene, this.object.position, new THREE.Vector3(0,1,0).normalize(), this.mouseDeltaX*0.000005*Math.abs(this.mouseX), true);
                        
                        this.mouseDeltaX=0.0;
                        this.mouseDeltaY=0.0;
                        
                        if(!flying && Math.abs(this.object.position.x-bird.scene.position.x)<0.3 && Math.abs(this.object.position.z-bird.scene.position.z)<0.3 && Math.abs(this.object.position.y-bird.scene.position.y)<0.3){
                            var mixer = new THREE.AnimationMixer( bird.scene );
                            var action = mixer.clipAction(bird.animations[4]);
                            action.play();
                            birdmixer=mixer;
                            flying=true;
                        }
                        if(flying){
                            if(flyingleft) {
                                bird.scene.position.z-=0.01;
                                if(bird.scene.position.z<-2){
                                    flying=false;
                                    var mixer = new THREE.AnimationMixer( bird.scene );
                                    var action = mixer.clipAction(bird.animations[3]);
                                    action.play();
                                    birdmixer=mixer; 
                                    bird.scene.position.z=-2.26;
                                    bird.scene.rotation.y = 3;                                    
                                    flyingleft=false;
                                }                                
                            }
                            else {
                                bird.scene.position.z+=0.02;
                                if(bird.scene.position.z>-0.2){
                                    flying=false;
                                    var mixer = new THREE.AnimationMixer( bird.scene );
                                    var action = mixer.clipAction(bird.animations[3]);
                                    action.play();
                                    birdmixer=mixer;   
                                    bird.scene.position.z=-0.22;
                                    bird.scene.rotation.y = 0;                                                                        
                                    flyingleft=true;
                                }                                    
                                
                            }

                        }
		};
	}();

	function contextmenu( event ) {
		event.preventDefault();
	}

	var _onMouseMove = bind( this, this.onMouseMove );
	var _onMouseDown = bind( this, this.onMouseDown );
	var _onMouseUp = bind( this, this.onMouseUp );
	var _onKeyDown = bind( this, this.onKeyDown );
	var _onKeyUp = bind( this, this.onKeyUp );

	this.domElement.addEventListener( 'contextmenu', contextmenu, false );
	this.domElement.addEventListener( 'mousemove', _onMouseMove, false );
	//this.domElement.addEventListener( 'mousedown', _onMouseDown, false );
	//this.domElement.addEventListener( 'mouseup', _onMouseUp, false );

	window.addEventListener( 'keydown', _onKeyDown, false );
	window.addEventListener( 'keyup', _onKeyUp, false );

	function bind( scope, fn ) {
		return function () {
			fn.apply( scope, arguments );
		};
	}

	function setOrientation( ) {

		var quaternion = camera.quaternion;

		lookDirection.set( 0, 0, - 1 ).applyQuaternion( quaternion );
		spherical.setFromVector3( lookDirection );

		lat = 90 - THREE.Math.radToDeg( spherical.phi );
		lon = THREE.Math.radToDeg( spherical.theta );

	}

	this.handleResize();

	setOrientation( );

};

//function initInput() {
//        window.addEventListener( 'mousedown', function ( event ) {
//                if ( ! clickRequest ) {
//                        mouseCoords.set(
//                                ( event.clientX / window.innerWidth ) * 2 - 1,
//                                - ( event.clientY / window.innerHeight ) * 2 + 1
//                        );
//                        clickRequest = true;
//                }
//        }, false );
//}
//function processClick() {
//        if ( clickRequest ) {
//                raycaster.setFromCamera( mouseCoords, camera );
//                // Creates a ball
//                var ballMass = 1;
//                var ballRadius = 0.05;
//                var ball = new THREE.Mesh( new THREE.SphereBufferGeometry( ballRadius, 18, 16 ), ballMaterial );
//                ball.castShadow = true;
//                ball.receiveShadow = true;
//                var ballShape = new Ammo.btSphereShape( ballRadius );
//                ballShape.setMargin( margin );
//                pos.copy( raycaster.ray.direction );
//                pos.add( raycaster.ray.origin );
//                quat.set( 0, 0, 0, 1 );
//                var ballBody = createRigidBody( ball, ballShape, ballMass, pos, quat );
//                ballBody.setFriction( 0.5 );
//                ballBody.setActivationState( 4 );                
//                pos.copy( raycaster.ray.direction );
//                pos.multiplyScalar( 1 );
//                ballBody.setLinearVelocity( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
//                clickRequest = false;
//        }
//}
