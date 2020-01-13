import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from './node_modules/three/examples/jsm/loaders/FBXLoader.js';

//////////////////////////////
// Game controls 
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

function increaseScore(){
    score+=1;
    info.innerText='Score: '+score;
}

function onDocumentMouseClick( event ) {
        event.preventDefault();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        var intersects = raycaster.intersectObjects( roomscene.children );
        if ( intersects.length > 0 ) {
                var object = intersects[ 0 ].object;
                console.log(object.name);
                if(object.name!=="mesh_1"){ // dont blow up the ground when clicked
                      increaseScore();
                      if(score===10) {
                          playbutton.style.display="block";
                          play=false;
                          playbutton.innerHTML = "Smelly Cat WINS! Play Again?";
                      }
                      scene.remove(scene.getObjectByName("roomscene"));//delete room from the scene
                      roomscene.remove(object);//delete the object from the room
                      scene.add(roomscene);//add the room to the scene again
            }
        }
}
//////////////////////////////
// Global objects   
//////////////////////////////
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
var scene = null;
var renderer = null;
var camera = null;
var clock = null;
var birdmixer;
var catmixer;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var direction = new THREE.Vector3();
var prevTime = performance.now();
var controls = null;
var shiftisup = true;
var idle = true;
var transformAux1;
var physicsWorld;
var raycaster = new THREE.Raycaster();
var ballMaterial = new THREE.MeshPhongMaterial( { color: 0x202020 } );
var pos = new THREE.Vector3();
var quat = new THREE.Quaternion();
var margin = 0.05;
var rigidBodies = [];
var roomisloaded = false;
var gravityConstant = - 20;
var mouseCoords = new THREE.Vector2();
var roomscene = new THREE.Group();  // all room is in here
var bird;
var flying=false;
var flyingleft=true;
var stilljumping=0;
var didobjectfall = [false, false, false, false, false, false, false, false, false ]; // for now there are only two objects that can fall

//
//////////////////////////////
// Information about our 3D models and units
//////////////////////////////
var MODELS = [
        { 
            name: "SmellyCat", 
            loader:"fbx",
            path: "./node_modules/three/examples/models/fbx/cat.fbx",
            position: { x: 0, y: 0, z: 0 }, 
            rotation: { x: 0, y: 0, z: 0},
            scale: 0.0003, 
            animationName: 5 // Name of animation to run            
        },    
        { 
            name: "Redcoat-Robin", 
            loader:"gltf",
            path: "./node_modules/three/examples/models/gltf/redcoat-robin/scene.gltf",
            //position: { x: -1.1, y: 1, z: -0.5 }, //on the chair
            position: { x: 0.4, y: 1.32, z: -0.22 }, //on the bed
            rotation: { x: 0, y: 0, z: 0},
            scale: 0.0002, 
            animationName: 3 // Name of animation to run            
        },         
        {
            name: "BedroomInArles", 
            loader: "gltf",
            path: "./node_modules/three/examples/models/gltf/BedroomInArles/bedroom.glb",
            position: { x: 0, y: 0, z: 0 }, // Where to put the unit in the scene
            scale: 20, 
        },
        {
            name: "Palette", 
            loader: "gltf",
            path: "./node_modules/three/examples/models/palette.glb",
            position: { x: 1.0, y: 2.0, z: -1.7 }, // Where to put the unit in the scene
            shape: {x: 0.2, y: 0.02, z: 0.1},
            rotation: {x:0, y:0, z:0},
            scale: 1,
        },    
        {
            name: "Brush", 
            loader: "gltf",
            path: "./node_modules/three/examples/models/brush.glb",
            position: { x: 1.0, y: 2.0, z: -1 }, // Where to put the unit in the scene
            shape: {x: 0.1, y: 0.2, z: 0.02},
            rotation: {x: 0, y:0, z:1},
            scale: 0.1, 
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
}    

function initPhysics() {
        // Physics configuration
        var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        var dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
        var broadphase = new Ammo.btDbvtBroadphase();
        var solver = new Ammo.btSequentialImpulseConstraintSolver();
        physicsWorld = physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
        physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
        transformAux1 = new Ammo.btTransform();
}

function createInvisibleCollisionBody( sx, sy, sz, pos, quat, material ) {
        var threeObject = new THREE.Mesh( new THREE.BoxBufferGeometry( sx, sy, sz, 1, 1, 1 ), material );
        var shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
        shape.setMargin( margin );
        createRigidBody( threeObject, shape, 0, pos, quat ); // has zero mass
        return threeObject;
}

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
                if(threeObject.name==="thecat"){
                    controls = new ThirdPersonControls( threeObject, renderer.domElement );       
                    camera.position.copy(new THREE.Vector3(threeObject.x,threeObject.y+1,threeObject.z-1.5));                
                }
        }
        // Disable deactivation
        body.setActivationState( 4 );
        physicsWorld.addRigidBody( body );
        return body;
}

/**
 * Function that starts loading process for the next model in the queue. The loading process is
 * asynchronous: it happens "in the background". Therefore we don't load all the models at once. We load one,
 * wait until it is done, then load the next one. When all models are loaded, we call loadUnits().
 */
function loadModels() {
        // create ground
        pos.set( 0, -0.4, 0 );
        quat.set( 0, 0, 0, 1 );
        createInvisibleCollisionBody( 100, 1, 100, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );
        
        for ( var i = 0; i < MODELS.length; ++ i ) {
                var m = MODELS[ i ];
                if(i===2) loadRoomModel(m);
                else if(i===0) loadCat(m);
                else if(i===1) loadBird(m);
                else if(m.loader==="fbx") loadFBXModel( m );
                else loadGLTFModel( m );
        }
}

function loadBird( model ) {
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

function loadGLTFModel( model ) {
        var loader = new GLTFLoader(); 
        loader.load( model.path, function ( gltf ) {
                gltf.scene.traverse( function ( object ) {
                        if ( object.isMesh ) {
                                object.castShadow = true;
                        }
                } );
                if ( model.position ) {
                        gltf.scene.position.copy(  new THREE.Vector3( model.position.x, model.position.y, model.position.z ));
                }
                if ( model.scale ) {
                        gltf.scene.scale.copy(  new THREE.Vector3( model.scale, model.scale, model.scale ));
                }
                if ( model.rotation ) {
                        gltf.scene.rotation.copy( new THREE.Euler( model.rotation.x,model.rotation.y,model.rotation.z));
                }
                var ballMass = 10;
                var ballShape = new Ammo.btBoxShape( new Ammo.btVector3( model.shape.x, model.shape.y, model.shape.z )  );
                ballShape.setMargin( 0.0 );
                var body = createRigidBody( gltf.scene, ballShape, ballMass, gltf.scene.position, gltf.scene.quaternion );
                body.setFriction( 0.5 );
                scene.add(gltf.scene);
        });
}
function loadRoomModel( model ) {
        var loader = new GLTFLoader(); 
        loader.load( model.path, function ( gltf ) {
                
                // bed
                pos.set( 0.8, 0, -1.6 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 1.2, 1.63, 3, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );
                
                // bedend
                pos.set( 0.8, 0, 0.0 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 1.2, 3, 0.01, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );
                
                // bedhead
                pos.set( 0.8, 0, -2.26 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 1.2, 3, 0.01, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );
                
                // roof
                // bazen kedi çatıya ışınlanıyor
                pos.set( 0, 3, 0 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 5, 0.1, 5, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );
                
            
                // wall near bed
                pos.set( 2, 0, 3 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 1, 10, 10, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );
                // opposite wall
                pos.set( -2.1, 0, 0 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 1, 15, 10, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );
                
                
                // wall with window
                pos.set( 0, 0, -3.3 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 10, 10, 1, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );
                // opposite wall
                pos.set( 0, 0, 2.5 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 10, 10, 1, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );                


                // chair by the wall
                pos.set( -1.3, 0, -0.4 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 0.5, 1.1, 0.5, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );                                 

                // chair by the bed
                pos.set( 0, 0, -2 );
                quat.set( 0, 1, 0, 1 );
                createInvisibleCollisionBody( 0.5, 1.1, 0.5, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );                                 

            
                // table by the bed
                pos.set( -0.5, 1, -2 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 1, 0.2, 1, pos, quat, new THREE.MeshPhongMaterial( {color:'#808080'} ) );                                 
            
                var gltfscene = gltf.scene;
                var yey = [];
                
                // appearently these two loops are necessary
                gltfscene.traverse( function ( object ) {
                        if ( object.isMesh) {
                            yey.push(object);
                            object.receiveShadow = true;
                            //object.castShadow = true;
                        }
                } );
                
                yey.forEach( function (object) {
                    roomscene.add(object);
                });
            
                roomscene.name = "roomscene";
                roomisloaded=true;
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
                gltf.traverse( function ( object ) {
                        if ( object.isMesh ) {
                                object.castShadow = true;
                        }
                } );
                if ( model.position ) {
                        gltf.position.copy(  new THREE.Vector3( model.position.x, model.position.y, model.position.z ));
                }
                if ( model.scale ) {
                        gltf.scale.copy(  new THREE.Vector3( model.scale, model.scale, model.scale ));
                }
                if ( model.rotation ) {
                        gltf.rotation.copy( new THREE.Euler( model.rotation.x,model.rotation.y,model.rotation.z));
                }
                var ballMass = 10;
                var ballShape = new Ammo.btBoxShape( new Ammo.btVector3( model.shape.x, model.shape.y, model.shape.z )  );
                ballShape.setMargin( 0.0 );
                var body = createRigidBody( gltf, ballShape, ballMass, gltf.position, gltf.quaternion );
                body.setFriction( 0.5 );
                scene.add(gltf);
        } );
}

function loadCat( model ) {
        var loader = new FBXLoader();
        loader.load( model.path, function ( gltf ) {
                gltf.traverse( function ( object ) {
                        if ( object.isMesh ) {
                                object.castShadow = true;
                        }
                } );
                if ( model.position ) {
                        gltf.position.copy(  new THREE.Vector3( model.position.x, model.position.y, model.position.z ));
                }
                if ( model.scale ) {
                        gltf.scale.copy(  new THREE.Vector3( model.scale, model.scale, model.scale ));
                }
                if ( model.rotation ) {
                        gltf.rotation.copy( new THREE.Euler( model.rotation.x,model.rotation.y,model.rotation.z));
                }
                var mixer = new THREE.AnimationMixer( gltf );
                var action = mixer.clipAction(gltf.animations[model.animationName]);
                action.play();
                catmixer=mixer;                
                var catMass = 10;
                var catShape = new Ammo.btBoxShape( new Ammo.btVector3( 0.1,0.1,0.4 )  );
                catShape.setMargin( 0.0 );
                gltf.name="thecat";
                var body = createRigidBody( gltf, catShape, catMass, gltf.position, gltf.quaternion );
                body.setFriction( 0.5 );
        } );
}
/**
 * Render loop. Renders the next frame of all animations
 */
function animate() {
        // Get the time elapsed since the last frame
        var delta = clock.getDelta();

        // models are loaded and play is pressed
        if(roomisloaded && rigidBodies.length>2 && play){
            if(!idle) catmixer.update(delta);
            controls.update( delta );  
            if(flying)birdmixer.update(delta*0.1); // bird's animation needs to be slowed then when flying
            else birdmixer.update(delta);
        }

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

        this.movementSpeed = 25;

        this.mouseX = 0;
	this.mouseY = 0;

	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;

	this.viewHalfX = 0;
	this.viewHalfY = 0;


	if ( this.domElement !== document ) {
		this.domElement.setAttribute( 'tabindex', - 1 );
	}

	this.handleResize = function () {

		if ( this.domElement === document ) {
			this.viewHalfX = window.innerWidth / 2;
			this.viewHalfY = window.innerHeight / 2;
		} else {
			this.viewHalfX = this.domElement.offsetWidth / 2;
			this.viewHalfY = this.domElement.offsetHeight / 2;
		}

	};

	this.onMouseMove = function ( event ) {
		if ( this.domElement === document ) {
			this.mouseX = event.pageX - this.viewHalfX;
			this.mouseY = event.pageY - this.viewHalfY;
		} else {
			this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
			this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;
		}

	};

	this.onKeyDown = function ( event ) {
		switch ( event.keyCode ) {
			case 38: /*up*/
			case 87: /*W*/ this.moveForward = true; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveRight = true; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = true; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveLeft = true; break;

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

                        case 16: /*Shift*/ shiftisup = true; break;
		}
	};

	this.update = function () {
		return function update( delta ) {

                        var actualMoveSpeed  = delta * this.movementSpeed;
                        
                        if(!shiftisup) actualMoveSpeed = delta * this.movementSpeed * 3;// Increase speed when shift is down - but also increases jump velocity ??

                        var velox=0;
                        var veloz=0;
                        
                        if ( this.moveLeft) { //A
                            idle=false; 
                            rotay-=0.05;
                        }
			else if ( this.moveRight ) { //D
                            idle=false;
                            rotay+=0.05;                            
                        }
                        else { //IDLE
                            idle=true;
                        }

			if ( this.moveBackward) { //S
                            idle=false; 
                            veloz = -actualMoveSpeed*Math.cos(rotay);
                            velox = -actualMoveSpeed*Math.sin(rotay);
                        }
			else if ( this.moveForward ) { //W
                            idle=false;
                            veloz = actualMoveSpeed*Math.cos(rotay);
                            velox = actualMoveSpeed*Math.sin(rotay);
                        }
                        else{ //IDLE
                            if(!this.moveLeft && !this.moveRight) idle=true;
                        }
                        // WALK CAT
                        this.object.userData.physicsBody.setLinearVelocity(new Ammo.btVector3( velox, 0, veloz));                        
                        
                        // JUMP CAT 
                        if(space) {
                            if(stilljumping==0) {
                                stilljumping=50; // to prevent multiple jumps count down from 50
                                this.object.userData.physicsBody.setLinearVelocity(new Ammo.btVector3( 0, actualMoveSpeed*10, 0));
                            }
                            space=false;
                        }
                        if(stilljumping!==0){
                            stilljumping-=1; 
                           if(stilljumping<3) stilljumping=0;
                        }
                        
                        // UPDATE RIGID BODIES
                        // CAT IS IN THE RIGIDBODIES ARRAY WITH NAME "thecat"
                        // Don't update cats quaternion since cats land on its legs.
                        // if an object other than cat falls to the ground, increase score and mark it in the array didobjectfall
                        physicsWorld.stepSimulation( delta, 10 );
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
                                        if(objThree.name!="thecat") {
                                            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
                                            if(objThree.position.y<0.5 && !didobjectfall[i]) {
                                                didobjectfall[i]=true;
                                                increaseScore();                                        
                                            }
                                        }
                                }
                        }        
                        
                        this.object.rotation.y = rotay;

                        // UPDATE CAMERA
                        var deltacamera = new THREE.Vector3(this.object.position.x+Math.sin(Math.PI*3/2-this.mouseX*0.002)*1.5, 
                                                            this.object.position.y+1+Math.sin(this.mouseY*0.002), 
                                                            this.object.position.z+Math.cos(Math.PI*3/2-this.mouseX*0.002)*1.5)
                        
                        // avoid camera from going out of the room
//                        deltacamera.x=Math.max(deltacamera.x,-1.0);
//                        deltacamera.x=Math.min(deltacamera.x,1.0);
//                        deltacamera.z=Math.max(deltacamera.z,-1.0);
//                        deltacamera.z=Math.min(deltacamera.z,1.0);
                        
                        camera.position.copy(deltacamera);
                        camera.lookAt(new THREE.Vector3(this.object.position.x,
                                                        this.object.position.y-this.mouseY*0.002,
                                                        this.object.position.z));

                        
                        // UPDATE BIRD
                        function changeBirdsAnimation(number){
                            var mixer = new THREE.AnimationMixer( bird.scene );
                            var action = mixer.clipAction(bird.animations[number]);
                            action.play();
                            birdmixer=mixer;                            
                        }
                        // Fly bird if cat got too close
                        if(!flying && Math.abs(this.object.position.x-bird.scene.position.x)<0.3 && Math.abs(this.object.position.z-bird.scene.position.z)<0.3 && Math.abs(this.object.position.y-bird.scene.position.y)<0.3){
                            changeBirdsAnimation(4); // fly
                            flying=true;
                        }
                        else if(flying){
                            if(flyingleft) { 
                                bird.scene.position.z-=0.01;
                                if(bird.scene.position.z<-2){
                                    flying=false;
                                    changeBirdsAnimation(3); // stop
                                    bird.scene.position.z=-2.26;
                                    bird.scene.rotation.y = 3;                                    
                                    flyingleft=false;
                                }                                
                            }
                            else {
                                bird.scene.position.z+=0.02;
                                if(bird.scene.position.z>-0.2){
                                    flying=false;
                                    changeBirdsAnimation(3); // stop
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

	window.addEventListener( 'keydown', _onKeyDown, false );
	window.addEventListener( 'keyup', _onKeyUp, false );

	function bind( scope, fn ) {
		return function () {
			fn.apply( scope, arguments );
		};
	}
	this.handleResize();
};
