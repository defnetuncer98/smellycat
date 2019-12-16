import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from './node_modules/three/examples/jsm/loaders/FBXLoader.js';
import { RGBELoader } from './node_modules/three/examples/jsm/loaders/RGBELoader.js';

//////////////////////////////
// Global objects
//////////////////////////////
var scene = null; // THREE.Scene where it all will be rendered
var renderer = null;
var camera = null;
var clock = null;
var mixers = []; // All the THREE.AnimationMixer objects for all the animations in the scene
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var prevTime = performance.now();
var models = [];
var canJump = false;
var controls = null;
var shiftisup = true;
var idle = true;
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
            path: "./node_modules/three/examples/models/gltf/cat/cat.fbx",
            position: { x: 15, y: 20, z: -15 }, // Where to put the unit in the scene
            rotation: { x: 0, y: 0, z: 0},
            scale: 0.007, // Scaling of the unit. 1.0 means: use original size, 0.1 means "10 times smaller", etc.
            animationName: 5 // Name of animation to run            
        },    
        {
            name: "BedroomInArles", 
            loader: "gltf",
            path: "./node_modules/three/examples/models/gltf/BedroomInArles/scene.gltf",
            position: { x: 0, y: 0, z: 0 }, // Where to put the unit in the scene
            scale: 20, // Scaling of the unit. 1.0 means: use original size, 0.1 means "10 times smaller", etc.
        },            
/*    
        { 
            name: "Bot", 
            path: "./node_modules/three/examples/models/gltf/sketchbot/scene.gltf",
            modelName: "Bot",
            meshName: "bot",
            position: { x: 0, y: 0, z: 0 },
            scale: 0.2,
            animationName: "Love"            
        },
    
        { 
            name: "Soldier", 
            path: "./node_modules/three/examples/models/gltf/Soldier.glb",
            modelName: "Soldier", // Will use the 3D model from file models/gltf/Soldier.glb
            meshName: "vanguard_Mesh", // Name of the main mesh to animate
            position: { x: 0, y: 0, z: 0 }, // Where to put the unit in the scene
            scale: 2, // Scaling of the unit. 1.0 means: use original size, 0.1 means "10 times smaller", etc.
            animationName: "Run" // Name of animation to run            
        },
        { 
            name: "Parrot", 
            path: "./node_modules/three/examples/models/gltf/Parrot.glb",
            modelName: "Parrot",
            meshName: "mesh_0",
            position: { x: - 2, y: 4, z: 0 },
            rotation: { x: 0, y: Math.PI, z: 0 },
            scale: 0.012,
            animationName: "parrot_A_"            
        },
    */
];

//////////////////////////////
// The main setup happens here
//////////////////////////////
var numLoadedModels = 0;
initScene();
initRenderer();
loadModels();
animate();
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
                if(m.loader==="fbx") loadFBXModel( m );
                else loadGLTFModel( m );
                
        }
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
                // Enable Shadows
                var gltfscene = gltf.scene;
                gltf.scene.traverse( function ( object ) {
                        if ( object.isMesh ) {
                                object.castShadow = true;
                        }
                } );
                // Different models can have different configurations of armatures and meshes. Therefore,
                // We can't set position, scale or rotation to individual mesh objects. Instead we set
                // it to the whole cloned scene and then add the whole scene to the game world
                // Note: this may have weird effects if you have lights or other items in the GLTF file's scene!
                if ( model.position ) {
                        gltfscene.position.copy(  new THREE.Vector3( model.position.x, model.position.y, model.position.z ));
                }
                if ( model.scale ) {
                        gltfscene.scale.copy(  new THREE.Vector3( model.scale, model.scale, model.scale ));
                }
                if ( model.rotation ) {
                        gltfscene.rotation.copy( new THREE.Euler( model.rotation.x,model.rotation.y,model.rotation.z));
                }
                //startAnimation( gltfscene, gltf.animations, model.animationName );
                scene.add( gltfscene );
                models.push( gltfscene );
                console.log( "Done loading model", model.name );
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
                scene.add( gltf );
                models.push( gltf );
                console.log( "Done loading model", model.name );
                } );
}
/**
 * Render loop. Renders the next frame of all animations
 */
function animate() {
        requestAnimationFrame( animate );
/*        
        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 20.0 * delta; // 100.0 = mass
        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveRight ) - Number( moveLeft );
        direction.normalize(); // this ensures consistent movements in all directions
        if ( moveForward || moveBackward ) velocity.z -= direction.z * 100.0 * delta;
        if ( moveLeft || moveRight ) velocity.x -= direction.x * 100.0 * delta;
*/
        
//        if(models.length!=0){
//            models[0].position.copy(  new THREE.Vector3( models[0].position.x- velocity.x * delta, models[0].position.y+(velocity.y * delta), models[0].position.z+velocity.z * delta ));                
//            //models[0].position.copy(  new THREE.Vector3( models[0].position.x- velocity.x * delta, models[0].position.y, models[0].position.z+velocity.z * delta ));
//            if ( models[0].position.y < 1 ) {
//                    velocity.y = 0;
//                    models[0].position.copy(  new THREE.Vector3( models[0].position.x, 1, models[0].position.z));                
//                    canJump = true;
//            }
//            prevTime = time;
//            //scene.add(models[1]);
//            scene.add(models[0]);
//        }
        
        // Get the time elapsed since the last frame
        var delta = clock.getDelta();
        // Update all the animation frames
//        for ( var i = 0; i < mixers.length; ++ i ) {
//                mixers[ i ].update( delta );
//        }
        
        if(!idle) mixers[0].update(delta);
        
        if(models.length==1){
            controls = new ThirdPersonControls( models[0], renderer.domElement );
            controls.movementSpeed = 5;
            controls.lookSpeed = 0.1;
            controls.constrainVertical = true;
            controls.verticalMax = 2.1;
            controls.verticalMin = 1.9;
            controls.constrainHorizontal = true;
            controls.horizontalMax = 5;
            controls.horizontalMin = 4.5;            
        }
        else if(models.length>1){
            controls.update( delta );            
        }
        
        //https://stackoverflow.com/questions/11636887/camera-lookat-vector?noredirect=1&lq=1
        //https://stackoverflow.com/questions/14813902/three-js-get-the-direction-in-which-the-camera-is-looking
        //var vector = camera.getWorldDirection();
        //var theta = Math.atan2(vector.x,vector.z);
        //models[0].rotation.copy(  new THREE.Euler(theta, 0, theta ));
        //scene.add(models[0]);        
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
        var container = document.getElementById( 'container' );
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
        camera.position.set( 30, 30, -10 );
        clock = new THREE.Clock();
        scene = new THREE.Scene();
/*
        new RGBELoader()
        .setDataType( THREE.UnsignedByteType )
        .setPath( './node_modules/three/examples/textures/equirectangular/grandcanyon/' )
        .load( 'grandcanyon_3k.hdr', function ( texture ) {
            //var pmremGenerator = new PMREMGenerator( renderer );
            //envMap = pmremGenerator.fromEquirectangular( texture ).texture;
            //pmremGenerator.dispose();
            //background = envMap;

            var options = {
                minFilter: texture.minFilter,
                magFilter: texture.magFilter
            };
            
            scene.background = new THREE.WebGLRenderTargetCube( 1024, 1024, options ).fromEquirectangularTexture( renderer, texture );
            var pmremGenerator = new PMREMGenerator( scene.wbackground.texture );
            pmremGenerator.update( renderer );
            pmremGenerator.dispose();
        });
*/        
        scene.background = new THREE.Color( 0xa0a0a0 );
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
        // ground
//        
//        var groundMesh = new THREE.Mesh(
//                new THREE.PlaneBufferGeometry( 40, 40 ),
//                new THREE.MeshPhongMaterial( {
//                        color: 0x999999,
//                        depthWrite: false
//                } )
//        );
//    
//        groundMesh.rotation.x = - Math.PI / 2;
//        groundMesh.receiveShadow = true;
//        scene.add( groundMesh );
//    
        window.addEventListener( 'resize', onWindowResize, false );
        var axesHelper = new THREE.AxesHelper( 100 );
        scene.add( axesHelper );
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

	this.movementSpeed = 1.0;
	this.lookSpeed = 0.005;
	this.lookVertical = true;
	this.autoForward = false;

	this.activeLook = true;

	this.heightSpeed = false;
	this.heightCoef = 1.0;
	this.heightMin = 0.0;
	this.heightMax = 1.0;

	this.constrainVertical = false;
	this.verticalMin = 0;
	this.verticalMax = Math.PI;

	this.constrainHorizontal = false;
	this.horizontalMin = 0;
	this.horizontalMax = Math.PI;
        
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
			case 87: /*W*/ this.moveBackward = true; break;

//			case 37: /*left*/
//			case 65: /*A*/ this.moveRight = true; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveForward = true; break;

//			case 39: /*right*/
//			case 68: /*D*/ this.moveLeft = true; break;

//			case 82: /*R*/ this.moveUp = true; break;
//			case 70: /*F*/ this.moveDown = true; break;

                        case 16: /*Shift*/ shiftisup = false; break;
                            

		}

	};

	this.onKeyUp = function ( event ) {

		switch ( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveBackward = false; break;

//			case 37: /*left*/
//			case 65: /*A*/ this.moveRight = false; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveForward = false; break;

//			case 39: /*right*/
//			case 68: /*D*/ this.moveLeft = false; break;

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


                        // obj - your object (THREE.Object3D or derived)
                        // point - the point of rotation (THREE.Vector3)
                        // axis - the axis of rotation (normalized THREE.Vector3)
                        // theta - radian value of rotation
                        // pointIsWorld - boolean indicating the point is in world coordinates (default = false)
                        function rotateAboutPoint(obj, point, axis, theta, pointIsWorld){
                            pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;

                            if(pointIsWorld){
                                obj.parent.localToWorld(obj.position); // compensate for world coordinate
                            }

                            obj.position.sub(point); // remove the offset
                            obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
                            obj.position.add(point); // re-add the offset

                            if(pointIsWorld){
                                obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
                            }

                            obj.rotateOnAxis(axis, theta); // rotate the OBJECT
                        }

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


                        lookVertical=false;
                        if(lookVertical) lon -= this.mouseX * actualLookSpeed * horizontalLookRatio;
			lon = Math.max( - 0, Math.min( 0, lon ) );
                        var theta = THREE.Math.degToRad( lon );

			if ( this.constrainVertical ) {
				phi = THREE.Math.mapLinear( phi, 0, Math.PI, this.verticalMin, this.verticalMax );
			}

			if ( this.constrainHorizontal ) {
				theta = THREE.Math.mapLinear( theta, 0, Math.PI, this.horizontalMin, this.horizontalMax );
			}

			if ( this.moveForward || ( this.autoForward && ! this.moveBackward ) ) {
                            idle=false;
                            this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
                            //camera.lookAt(this.object.position);
                        }
			else if ( this.moveBackward ) {
                            idle=false;
                            this.object.translateZ( actualMoveSpeed );
                            //camera.lookAt(this.object.position);
                        }
                        else{
                            idle=true;
                            //camera.lookAt(this.object.position);
                        }
                        camera.position.copy(new THREE.Vector3(this.object.position.x+15,this.object.position.y+10,this.object.position.z));                        
                        camera.lookAt(new THREE.Vector3().setFromSphericalCoords( 1, phi, theta ).add( camera.position ));
                            
                        this.object.rotation.y = 4.4+(-this.mouseX*0.001);
                        rotateAboutPoint(models[1], this.object.position, new THREE.Vector3(0,1,0).normalize(), this.mouseDeltaX*0.00005*Math.abs(this.mouseX), true);
                        this.mouseDeltaX=0.0;
                        this.mouseDeltaY=0.0;
                        
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
	this.domElement.addEventListener( 'mousedown', _onMouseDown, false );
	this.domElement.addEventListener( 'mouseup', _onMouseUp, false );

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