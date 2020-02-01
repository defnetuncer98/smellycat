import * as THREE from './src/three/build/three.module.js';
import { GLTFLoader } from './src/three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from './src/three/examples/jsm/loaders/FBXLoader.js';
import { GUI } from './src/three/examples/jsm/libs/dat.gui.module.js';
import { EffectComposer } from './src/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './src/three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './src/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutlineEffect } from './src/three/examples/jsm/effects/OutlineEffect.js';
import { Reflector } from './src/three/examples/jsm/objects/Reflector.js';

var play = false;
var gameovertime;
function onPlayClick() {
    music.play();
    music.loop=true;
    //document.getElementById('container').style.cursor = 'none';
    loading2.style.display = "none";
    container.style.display = "block";
    play=true;
    score=0;
    info.style.display="block";
    timeinfo.style.display="block";    
    scoretext.style.display="block";
    timetext.style.display="block";
    info.innerText=0;
    playbutton.style.display="none";
    gameovertime=Math.round(180+new Date()/1000);
    
}

function increaseScore(){
    score+=1;
    info.innerText=score;
}

function gameOver(isWin){
    play=false;
    if(!isWin) catpaw.innerText="Game Over. Press F5 to replay";
    else catpaw.innerText="You win! Press F5 to replay";
}

function increaseTime(){
    gameovertime+=10;
}

//function onDocumentMouseClick( event ) {
//        event.preventDefault();
//        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
//        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
//        raycaster.setFromCamera( mouse, camera );
//        var intersects = raycaster.intersectObjects( roomscene.children );
//        if ( intersects.length > 0 ) {
//                var object = intersects[ 0 ].object;
//                console.log(object.name);
//                scene.remove(scene.getObjectByName("roomscene"));//delete room from the scene
//                roomscene.remove(object);//delete the object from the room
//                scene.add(roomscene);//add the room to the scene again     
//        }
//}


function displayinstructions(){
    if(escispressed) {
        startTime();
        instructions.style.display='none';
        escispressed=false;
    }
    else{
        escispressed=true;
        stopTime();
        instructions.style.display='block';
    }
}

//////////////////////////////
// Global objects   
//////////////////////////////
var playappearedonce = false;
var info = document.getElementById('info');
var instructions = document.getElementById('instructions');
var catpaw = document.getElementById('catpaw');
var painting = document.getElementById('painting');
var timeinfo = document.getElementById('timeinfo');
var timetext = document.getElementById('timetext');
var scoretext = document.getElementById('scoretext');
var container = document.getElementById('container');
var playbutton = document.getElementById('playbutton');
var loading = document.getElementById('loading');
var loading2 = document.getElementById('loading2');
playbutton.addEventListener('click', onPlayClick);
catpaw.addEventListener('click', displayinstructions);
var hitsound = document.getElementById('hitsound');
var music = document.getElementById('music');
var breaksound = document.getElementById('breaksound');
var shelves = [];
var firsttime=true;
var gui;
var escispressed = false;
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
var pos = new THREE.Vector3();
var quat = new THREE.Quaternion();
var margin = 0.05;
var rigidBodies = [];
var roomisloaded = false;
var gravityConstant = - 9.8;
var mouseCoords = new THREE.Vector2();
var roomscene = new THREE.Group();
var paintings = new THREE.Group();
var bird;
var flying=false;
var flyingleft=true;
var stilljumping=0;
var didobjectfall = [false, false, false, false, false, false, false, false, false,
    false, false, false, false, false, false, false, false, false, false, false, false, false, false  ]; // for now there are only two objects that can fall
var vasefell=0;
var vasemixer;
var vase;
var mousemixers = [];
var starttime;
var timeleft;
var pausedstart;
var params = {
    light:false,
    night:false,
    exposure: 0.6,
    bloomStrength: 1,
    bloomThreshold: 0.3,
    shading: 'none',
    glow:false,
    toon:false,
    phong: false,
    depth: false,
    rainbow: false,
    music:true,
    sound:true,
};
var outlineeffect;
//
//////////////////////////////
// Information about our 3D models and units
//////////////////////////////
var MODELS = [
        { 
            name: "SmellyCat", 
            path: "./src/three/examples/models/fbx/cat.fbx",
            position: { x: 0, y: 0, z: 0 }, 
            rotation: { x: 0, y: 0, z: 0},
            scale: 0.0003, 
            animationName: 5 // Name of animation to run            
        },    
        { 
            name: "Redcoat-Robin", 
            path: "./src/three/examples/models/gltf/redcoat-robin/scene.gltf",
            //position: { x: -1.1, y: 1, z: -0.5 }, //on the chair
            position: { x: 0.53, y: 1.31, z: -0.22 }, //on the bed
            rotation: { x: 0, y: 0, z: 0},
            scale: 0.0002, 
            animationName: 3 // Name of animation to run            
        },         
        {
            name: "BedroomInArles", 
            path: "./src/three/examples/models/bedroom.glb",
            position: { x: 0, y: 0, z: 0 }, // Where to put the unit in the scene
            scale: 20, 
        },        
        {
            name: "Palette", 
            path: "./src/three/examples/models/palette.glb",
            position: { x: 0.7, y: 2.0, z: -1.5 }, // Where to put the unit in the scene
            shape: {x: 0.2, y: 0.02, z: 0.2},
            rotation: {x:0, y:0, z:0},
            scale: 1,
        },    
        
        {
            name: "Brush", 
            path: "./src/three/examples/models/brush.glb",
            position: { x: 0.7, y: 2.0, z: -0.8 }, // Where to put the unit in the scene
            shape: {x: 0.1, y: 0.005, z: 0.005},
            rotation: {x: 0, y:0, z:0},
            scale: 0.1, 
        },        
 
        {
            name: "Roundtable", 
            path: "./src/three/examples/models/roundtable.glb",
            position: { x:-1.0, y:0.5, z: 1.0 }, // Where to put the unit in the scene
            shape: {x: 0.02, y: 0.02, z: 0.02},
            rotation: {x: 0, y:0, z:0},
            scale: 0.008, 
        },   
        {
            name: "Vase", 
            path: "./src/three/examples/models/gltf/vase/scene.gltf",
            position: { x:-0.8, y:0.72, z: 1.1 }, // Where to put the unit in the scene
            shape: {x: 0.25, y: 0.035, z: 0.25},
            rotation: {x: 0, y:4.5, z:0},
            scale: 0.02, 
        },   
        {
            name: "Sunflower", 
            path: "./src/three/examples/models/sunflower.glb",
            position: { x:-0.81, y:0.8, z: 1.14 }, // Where to put the unit in the scene
            shape: {x: 0.06, y: 0.1, z: 0.06},
            rotation: {x: 0, y:1, z:0},
            scale: 0.0016, 
        },   
  

        {
            name: "Table", 
            path: "./src/three/examples/models/table.glb",
            position: { x:-0.95, y:0.3, z: -1.68 }, // Where to put the unit in the scene
            shape: {x: 0.0, y: 0.0, z: 0.0},
            rotation: {x: 0, y:0.0, z:0},
            scale: 1.0, 
        },
        
        {
            name: "Chair1", 
            path: "./src/three/examples/models/chair.glb",
            position: { x:-1.25, y:0.42, z: -0.45 }, // Where to put the unit in the scene
            shape: {x: 0.0, y: 0.0, z: 0.0},
            rotation: {x: 0, y:1.57, z:0},
            scale: 1.0, 
        },  
        {
            name: "Chair2", 
            path: "./src/three/examples/models/chair.glb",
            position: { x:-0.1, y:0.42, z: -2.0 }, // Where to put the unit in the scene
            shape: {x: 0.0, y: 0.0, z: 0.0},
            rotation: {x: 0, y:1, z:0},
            scale: 1.0, 
        },  
        
        {
            name: "Bed", 
            path: "./src/three/examples/models/bed.glb",
            position: { x:0, y:0.2, z: 0 }, // Where to put the unit in the scene
            shape: {x: 0.0, y: 0.0, z: 0.0},
            rotation: {x: 0, y:0, z:0},
            scale: 1.0, 
        },  
        {
            name: "Tableobject1", 
            path: "./src/three/examples/models/tableitem1.glb",
            position: {  x:-1.12, y:1, z: -1.9  }, // Where to put the unit in the scene
            shape: {x: 0.01, y: 0.01, z: 0.01},
            rotation: {x: 0, y:0.0, z:0},
            scale: 1.0, 
        },
        
        {
            name: "Tableobject3", 
            path: "./src/three/examples/models/tableitem3.glb",
            position: {  x:-0.9, y:1, z: -1.9  }, // Where to put the unit in the scene
            shape: {x: 0.01, y: 0.01, z: 0.01},
            rotation: {x: 0, y:0.0, z:0},
            scale: 0.7, 
        },
        
        
        {
            name: "Tableobject4", 
            path: "./src/three/examples/models/tableitem4.glb",
            position: { x:-1.07, y:1.2, z: -1.68  }, // Where to put the unit in the scene
            shape: {x: 0.02, y: 0.02, z: 0.02},
            rotation: {x: 0, y:0.0, z:0},
            scale: 1.0, 
        },
        
        {
            name: "Tableobject5", 
            path: "./src/three/examples/models/tableitem4.glb",
            position: { x:-0.77, y:0.8, z: -1.72 }, // Where to put the unit in the scene
            shape: {x: 0.01, y: 0.01, z: 0.01},
            rotation: {x: 0, y:0.0, z:0},
            scale: 1.0, 
        },
        
        {
            name: "Book1", 
            path: "./src/three/examples/models/book.glb",
            position: { x:0.6, y:2, z: 1.5 }, // Where to put the unit in the scene
            shape: {x: 0.2, y: 0.03, z: 0.1},
            rotation: {x: 0, y:0.0, z:1.62},
            scale: 0.01, 
        },
        
        {
            name: "Book2", 
            path: "./src/three/examples/models/book.glb",
            position: { x:0.5, y:2, z: 1.5 }, // Where to put the unit in the scene
            shape: {x: 0.2, y: 0.03, z: 0.1},
            rotation: {x: 0, y:0.0, z:1.62},
            scale: 0.01, 
        },
        
        {
            name: "Book3", 
            path: "./src/three/examples/models/book.glb",
            position: { x:0.4, y:2, z: 1.5 }, // Where to put the unit in the scene
            shape: {x: 0.2, y: 0.03, z: 0.1},
            rotation: {x: 0, y:0.0, z:1.62},
            scale: 0.01, 
        },
        
        {
            name: "Book4", 
            path: "./src/three/examples/models/book.glb",
            position: { x:-0.4, y:1.5, z: 1.5 }, // Where to put the unit in the scene
            shape: {x: 0.2, y: 0.03, z: 0.1},
            rotation: {x: 0, y:0.0, z:1.62},
            scale: 0.01, 
        },
        
        {
            name: "Book5", 
            path: "./src/three/examples/models/book.glb",
            position: { x:-0.3, y:1.5, z: 1.5 }, // Where to put the unit in the scene
            shape: {x: 0.2, y: 0.03, z: 0.1},
            rotation: {x: 0, y:0.0, z:1.62},
            scale: 0.01, 
        },
        
        
        {
            name: "Mug", 
            path: "./src/three/examples/models/mug.glb",
            position: { x:0.8, y:2, z: 1.5 }, // Where to put the unit in the scene
            shape: {x: 0.05, y: 0.01, z: 0.05},
            rotation: {x: 0, y:0.0, z:0},
            scale: 0.08, 
        },
        {
            name: "Ear", 
            path: "./src/three/examples/models/ear.glb",
            position: { x:1.3, y:0.1, z: -2 }, // Where to put the unit in the scene
            shape: {x: 0.02, y: 0.02, z: 0.04},
            rotation: {x: -1.57, y:0.0, z:0},
            scale: 0.003, 
        },
];

Ammo().then( function ( AmmoLib ) {
    Ammo = AmmoLib;
    starttime=new Date();
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

function createInvisibleCollisionBody( sx, sy, sz, pos, quat, material, sceneadded=false, name=" ") {
        var threeObject = new THREE.Mesh( new THREE.BoxBufferGeometry( sx, sy, sz, 1, 1, 1 ), material );
        threeObject.castShadow = true;
        threeObject.receiveShadow = true;                 
        var shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
        shape.setMargin( margin );
        threeObject.opacity = 1.0;
        if (sceneadded){threeObject.name=name;}
        //scene.add(threeObject);
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
        if ( mass > 0 ) {
                scene.add( threeObject );
                rigidBodies.push( threeObject );
                if(threeObject.name==="thecat"){
                    controls = new ThirdPersonControls( threeObject, renderer.domElement );       
                    camera.position.copy(new THREE.Vector3(threeObject.x,threeObject.y+1,threeObject.z-1.5));                
                }
                else if(threeObject.name==="Chair1") didobjectfall[rigidBodies.length-1] = true;
                else if(threeObject.name==="Chair2") didobjectfall[rigidBodies.length-1] = true;
                else if(threeObject.name==="Bed") didobjectfall[rigidBodies.length-1] = true;
                else if(threeObject.name==="Shoes") didobjectfall[rigidBodies.length-1] = true;
                else if(threeObject.name==="Table") didobjectfall[rigidBodies.length-1] = true;
                else if(threeObject.name==="Roundtable") didobjectfall[rigidBodies.length-1] = true;
                else if(threeObject.name==="Ear") didobjectfall[rigidBodies.length-1] = true;
        }
        else if(threeObject.name=="shelf" || threeObject.name=="dust"){
                scene.add( threeObject );
                shelves.push( threeObject );
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
        pos.set( 0, -0.5, 0 );
        quat.set( 0, 0, 0, 1 );
        createInvisibleCollisionBody( 100, 1, 100, pos, quat, new THREE.MeshStandardMaterial( {color:'#808080'} ) );
        
        for ( var i = 0; i < MODELS.length; ++ i ) {
                var m = MODELS[ i ];
                if(i===2) loadRoomModel(m);
                else if(i===0) loadCat(m);
                else if(i===1) loadBird(m);
                else loadGLTFModel( m );
        }
        
        var geometry = new THREE.PlaneBufferGeometry( 0.6,2 );
        var verticalMirror = new Reflector( geometry, {
                clipBias: 0.003,
                textureWidth: window.innerWidth * window.devicePixelRatio,
                textureHeight: window.innerHeight * window.devicePixelRatio,
                color: 0x889999,
                recursion: 1
        } );
        verticalMirror.position.y = 1.5;
        verticalMirror.position.x = 1.78;
        verticalMirror.position.z = 1.2;
        verticalMirror.rotation.y = -1.57;
        scene.add( verticalMirror );  
        
        var loader = new THREE.TextureLoader();
        var woodtex = loader.load('./src/three/examples/pics/wood-bump.jpg');            
        pos.set( 1.8, 1.5, 1.2 );
        quat.set( 0, 0, 0, 1 );
        //frame
        createInvisibleCollisionBody( 0.01, 2.1, 0.7, pos, quat, new THREE.MeshStandardMaterial( {map: woodtex} ), true); 
        
        // dust
        pos.set( 1.77, 1.5, 1.2 );        
        createInvisibleCollisionBody( 0.01, 2.1, 0.7, pos, quat, new THREE.MeshStandardMaterial( {map: woodtex, opacity:0.1, transparent:true} ), true, "dust"); 

        
}

function loadBird( model ) {
        var loader = new GLTFLoader(); 
        loader.load( model.path, function ( gltf ) {
                gltf.scene.traverse( function ( object ) {
                        if ( object.isMesh ) {
                                object.castShadow = true;
                                object.receiveShadow = true;
                }});
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
                                object.receiveShadow = true;
                                //object.material.emissiveIntensity = 5;
                                if(model.name=="Vase"){
                                    var loader = new THREE.TextureLoader();
                                    var bump = loader.load('./src/three/examples/pics/bump-map.jpg');                                    
                                    var material = new THREE.MeshStandardMaterial( { bumpMap:bump, metalness:0.9, color:new THREE.Color( 1.0,1.0,1.0), roughness:0.1} );
                                    object.material = material;
                                    object.material.flatShading=true;                                    
                                }
                                else {
                                    var material = new THREE.MeshStandardMaterial( { map:object.material.map, color:object.material.color } );
                                    object.material = material;
                                    object.material.flatShading=true;
                                }                                                                    

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
                if (model.name == "Roundtable" || model.name == "Chair1" || model.name == "Chair2" || model.name == "Table" || model.name == "Bed")
                    ballMass = 10000;
                gltf.scene.name=model.name;
                var ballShape = new Ammo.btBoxShape( new Ammo.btVector3( model.shape.x, model.shape.y, model.shape.z )  );
                ballShape.setMargin( 0.0 );
                var body = createRigidBody( gltf.scene, ballShape, ballMass, gltf.scene.position, gltf.scene.quaternion );
                body.setFriction( 0.5 );
                scene.add(gltf.scene);
                if(model.name=="Vase") vase=gltf;
        });
}
function loadRoomModel( model ) {
        var loader = new GLTFLoader(); 
        loader.load( model.path, function ( gltf ) {
                
                // bed
                pos.set( 1.1, 0.55, -1.29 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 1.25, 0.5, 2.0, pos, quat, new THREE.MeshStandardMaterial( {color:'#808080'} ) );
                
                // bedend
                pos.set( 1.12, 0.7, -0.24 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 1.25, 1.1, 0.1, pos, quat, new THREE.MeshStandardMaterial( {color:'#808080'} ) );
                
                // bedhead
                pos.set( 1.12, 0.7, -2.30 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 1.25, 1.1, 0.1, pos, quat, new THREE.MeshStandardMaterial( {color:'#808080'} ) );
                
                // roof
                pos.set( 0, 3.05, 0 );
                quat.set( 0, 0, -0.1, 1 );
                createInvisibleCollisionBody( 5, 0.1, 5, pos, quat, new THREE.MeshStandardMaterial( {color:'#808080'} ) );
                
            
                // wall near bed
                pos.set( 1.90, 1.95, 0 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 0.1, 5, 5, pos, quat, new THREE.MeshStandardMaterial( {color:'#808080'} ) );
                
                // opposite wall
                pos.set( -1.72, 1.95, 0 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 0.1, 5, 5, pos, quat, new THREE.MeshStandardMaterial( {color:'#808080'} ) );
                
            
                // wall with window
                pos.set( -0.32, 1.95, -2.65 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 1, 1.7, 0.01, pos, quat, new THREE.MeshStandardMaterial( {color:'#808080'} ) );
                
                pos.set( -1.8, 1.95, -2.65 );
                quat.set( 0, 0, 0, 1 );
                scene.add(createInvisibleCollisionBody( 2, 5, 0.01, pos, quat, new THREE.MeshStandardMaterial( {color:'#000000'} ) ));
                
                pos.set( 1.1, 1.95, -2.65 );
                quat.set( 0, 0, 0, 1 );
                scene.add(createInvisibleCollisionBody( 2, 5, 0.01, pos, quat, new THREE.MeshStandardMaterial( {color:'#000000'} ) ));
                
                pos.set( 0, 0.55, -2.65 );
                quat.set( 0, 0, 0, 1 );
                scene.add(createInvisibleCollisionBody( 5, 1.2, 0.01, pos, quat, new THREE.MeshStandardMaterial( {color:'#000000'} ) ));
                
                pos.set( 0, 5.55, -2.65 );
                quat.set( 0, 0, 0, 1 );
                scene.add(createInvisibleCollisionBody( 5, 5, 0.01, pos, quat, new THREE.MeshStandardMaterial( {color:'#000000'} ) ));
                
                // opposite wall
                pos.set( 0, 1.95, 1.82 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 10, 10, 0.1, pos, quat, new THREE.MeshStandardMaterial( {color:'#808080'} ) );

                
                var loader = new THREE.TextureLoader();
                var woodtex = loader.load('./src/three/examples/pics/wood-bump.jpg');
                
                
                // shelves          
                pos.set( 0.65, 1.8, 1.55 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 1.2, 0.05, 0.4, pos, quat, new THREE.MeshStandardMaterial( {map: woodtex} ), true, "shelf"); 
             
                pos.set( -0.75, 1.25, 1.55 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 1.2, 0.05, 0.4, pos, quat, new THREE.MeshStandardMaterial( {map: woodtex} ), true, "shelf");   
                
                
                


                // chair by the wall
                pos.set( -1.25, 0.37, -0.45 );
                quat.set( 0, 0, 0, 1 );
                createInvisibleCollisionBody( 0.42, 0.35, 0.42, pos, quat, new THREE.MeshStandardMaterial( {color:'#808080'} ) );                                 

                // chair by the bed
                pos.set( -0.09, 0.37, -1.99 );
                quat.set( 0, 0.45, 0, 1 );
                createInvisibleCollisionBody( 0.42, 0.35, 0.42, pos, quat, new THREE.MeshStandardMaterial( {color:'#808080'} ) );                                 

                 // table by the bed
                pos.set( -0.93, 0.68, -1.87 );
                quat.set( 0, -0.48, 0, 1 );
                createInvisibleCollisionBody( 0.6, 0.3, 0.6, pos, quat, new THREE.MeshStandardMaterial( {color:'#808080'} ) );  
                
                // round table
                pos.set( -1.0, 0.55, 1.0 );
                quat.set( 0, 0.0, 0, 1 );
                createInvisibleCollisionBody( 0.75, 0.1, 0.75, pos, quat, new THREE.MeshStandardMaterial( {color:'#808080'} ) );  
              
                var gltfscene = gltf.scene;
                var yey = [];
                
                // appearently these two loops are necessary
                gltfscene.traverse( function ( object ) {
                        if ( object.isMesh) {
                            object.receiveShadow = true;
                            if(object.name=="mesh_15" || object.name=="mesh_14" || object.name=="mesh_21" || object.name==="mesh_23") object.castShadow = true;
                            var material = new THREE.MeshStandardMaterial( { map:object.material.map } );                                
                            object.material = material;
                            object.material.flatShading=true;                            
                            yey.push(object);
                        }
                } );
                
                yey.forEach( function (object) {
                    roomscene.add(object);
                    if(object.name=="mesh_0" || object.name=="mesh_1" || object.name=="mesh_4" || object.name=="mesh_7" || object.name=="mesh_8" || object.name=="mesh_5") paintings.add(object);
                });
            
                roomscene.name = "roomscene";
                paintings.name = "paintings";
                scene.add(roomscene);
                scene.add(paintings);
                roomisloaded=true;            
                } );
}

function loadCat( model ) {
        var loader = new FBXLoader();
        var textureloader = new THREE.TextureLoader();        
        loader.load( model.path, function ( gltf ) {
                gltf.traverse( function ( object ) {
                        if ( object.isMesh ) {
                                object.castShadow = true;
                                object.receiveShadow = true;
                                if(Array.isArray(object.material)){
                                    if(object.material[0].name=="skin"){
                                        var cattex = textureloader.load('./src/three/examples/pics/orange.png');                                             
                                        object.material[0].map = cattex;
                                        object.material[0].shininess = 0;
                                        object.material[0].reflectivity = 0;
                                    }
                                }
                                else{
                                        object.material.color=new THREE.Color( 0.3,0.8,0.0 );                                    
                                }
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
        
        if(loading.style.display=="block") {
            var timediff=(new Date()-starttime)/1000;
            if(timediff>3){
                loading.style.display="none";
                loading2.style.display="block";
                
            }
        }
        if(roomisloaded && rigidBodies.length>6 && !play && !playappearedonce) {
            playbutton.style.display="inline-block";
            playappearedonce=true;
            
        }
        if(roomisloaded && rigidBodies.length>6 && play && !escispressed){
            timeleft=Math.round(gameovertime-(new Date()/1000));
            timeinfo.innerText=timeleft;
            if(timeleft<=0) {gameOver(false); return;}
            if(!idle) catmixer.update(delta);
            controls.update( delta );  
            if(flying)birdmixer.update(delta*0.1); // bird's animation needs to be slowed then when flying
            else birdmixer.update(delta);
            if(vasefell>0){
                vasemixer.update(delta);
                vasefell-=1;
            }
            for ( var i = 0; i < mousemixers.length; ++ i ) {
                    mousemixers[ i ].update( delta );
            }        
            if(firsttime) {catpaw.click();firsttime=false;}            
        }
        setTimeout( function() {
            requestAnimationFrame( animate );
        }, 1000 / 30 );
        if(params.glow) composer.render();
        else if(params.toon) outlineeffect.render(scene,camera);
        else renderer.render( scene, camera );
        
}

//////////////////////////////
// General Three.JS stuff
//////////////////////////////
// This part is not anyhow related to the cloning of models, it's just setting up the scene.
/**
 * Initialize ThreeJS scene renderer
 */

function stopTime(){
    pausedstart = new Date();
}
function startTime(){
    gameovertime+=(new Date()-pausedstart)/1000;
}

var composer;
var bloomPass;
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
        
        var renderScene = new RenderPass( scene, camera );
        bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );    
        bloomPass.threshold = params.bloomThreshold;
        bloomPass.strength = params.bloomStrength;
        bloomPass.radius = 0;
        composer = new EffectComposer( renderer );
        composer.addPass( renderScene );
        composer.addPass( bloomPass );
        outlineeffect = new OutlineEffect( renderer );

        //renderer.physicallyCorrectLights=true;
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
      
        scene.background = new THREE.Color( 0x000000 );
        
        var hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444, 1 );
        hemiLight.position.set( 0, 2.0, 0 );
        scene.add( hemiLight );
        
        var dirLight = new THREE.DirectionalLight( 0xffffff );
        dirLight.position.set( 0, 4.0, -5 );
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 2;
        dirLight.shadow.camera.bottom = - 2;
        dirLight.shadow.camera.left = - 2;
        dirLight.shadow.camera.right = 2;
        //dirLight.shadow.camera.near = 0.1;
        //dirLight.shadow.camera.far = 40;
        scene.add( dirLight );

        const light = new THREE.PointLight(0xFFFFFF, 10, 4, 2);
        light.castShadow = true;
        light.position.set(0, 3, 0);
        light.shadow.camera.top = 2;
        light.shadow.camera.bottom = - 2;
        light.shadow.camera.left = - 2;
        light.shadow.camera.right = 2;
        light.shadow.camera.zoom = 1;
        //light.shadow.camera.near = 0.1;
        //light.shadow.camera.far = 40;        
        scene.add(light);
        if(!params.light) light.visible = ! light.visible;
       
        function updateCamera(){light.shadow.camera.updateProjectionMatrix();}
     
        gui = new GUI();
        
        var lightsettings = gui.addFolder("light settings");
        lightsettings.add(params,'night').onChange(function(){hemiLight.visible = ! hemiLight.visible; light.visible = ! light.visible;dirLight.visible = ! dirLight.visible;});
        lightsettings.add(light, 'intensity', 0, 10, 0.01);                
        lightsettings.add(light.position, 'x', - 1.5, 1.7).onChange(updateCamera);
        lightsettings.add(light.position, 'y', 0.2, 2.8).onChange(updateCamera);
        lightsettings.add(light.position, 'z', - 2.5, 1.6).onChange(updateCamera);
        
        var musicsettings = gui.addFolder("audio settings");
        musicsettings.add(params,'music').onChange(function(){
            if(params.music) music.play();
            else music.pause();
        });
        musicsettings.add(params,'sound');
        
        gui.add(params, 'shading', ['none', 'glow', 'toon', 'phong', 'depth', 'rainbow']).onChange(function(){
            if(params.shading == 'none'){
                renderer.toneMappingExposure = 1;                 
                params.glow=false;
                params.toon=false;
                params.phong=false;
                params.depth=false;
                params.rainbow=false;
            }
            else if(params.shading == 'glow'){
                renderer.toneMappingExposure = Math.pow( 0.6, 4.0 );
                params.glow=true;
                params.toon=false;
                params.phong=false;
                params.depth=false;
                params.rainbow=false;
            }
            else if(params.shading == 'phong'){
                renderer.toneMappingExposure = 1;                                 
                params.glow=false;
                params.toon=false;
                params.phong=true;
                params.depth=false;
                params.rainbow=false;
            }
            else if(params.shading == 'toon'){
                renderer.toneMappingExposure = 1;                                 
                params.glow=false;
                params.toon=true;
                params.phong=false;
                params.depth=false;
                params.rainbow=false;
            }       
            else if(params.shading == 'depth'){
                renderer.toneMappingExposure = 1;                                 
                params.glow=false;
                params.toon=false;
                params.phong=false;
                params.depth=true;
                params.rainbow=false;
            }       
            else if(params.shading == 'rainbow'){
                renderer.toneMappingExposure = 1;                                 
                params.glow=false;
                params.toon=false;
                params.phong=false;
                params.depth=false;
                params.rainbow=true;
            }       
            
            if(params.phong || params.depth || params.rainbow) {
                roomscene.traverse( function ( object ) {
                   if(object.isMesh) {
                        //var material = new THREE.MeshToonMaterial( { map:object.material.map, gradientMap:gradientMaps.fiveTone } );
                        var material;
                        if(params.phong) material = new THREE.MeshPhongMaterial( {map:object.material.map} );
                        else if(params.rainbow) material = new THREE.MeshNormalMaterial( {map:object.material.map} );
                        else material = new THREE.MeshDepthMaterial( {map:object.material.map} );
                        object.material = material;
                        object.material.flatShading=true;
                   }
                });
                paintings.traverse( function ( object ) {
                   if(object.isMesh) {
                        //var material = new THREE.MeshToonMaterial( { map:object.material.map, gradientMap:gradientMaps.fiveTone } );
                        var material;
                        if(params.phong) material = new THREE.MeshPhongMaterial( {map:object.material.map} );
                        else if(params.rainbow) material = new THREE.MeshNormalMaterial( {map:object.material.map} );
                        else material = new THREE.MeshDepthMaterial( {map:object.material.map} );
                        object.material = material;
                        object.material.flatShading=true;
                   }
                });                
                rigidBodies.forEach( function ( somescene ) {
                    if(somescene.name!="thecat"){                    
                        somescene.traverse( function ( object ) {
                            if(object.isMesh) {
                                //var material = new THREE.MeshToonMaterial( { map:object.material.map, gradientMap:gradientMaps.fiveTone } );
                                var material;
                                if(params.phong) material = new THREE.MeshPhongMaterial( {map:object.material.map, bumpMap:object.material.bumpMap} );
                                else if(params.rainbow) material = new THREE.MeshNormalMaterial( {map:object.material.map, bumpMap:object.material.bumpMap} );
                                else material = new THREE.MeshDepthMaterial( {map:object.material.map, bumpMap:object.material.bumpMap} );
                                object.material = material;
                                object.material.flatShading=true;
                           }
                        });
                    }
                });
                shelves.forEach( function ( somescene ) {
                        somescene.traverse( function ( object ) {
                            if(object.isMesh) {
                                //var material = new THREE.MeshToonMaterial( { map:object.material.map, gradientMap:gradientMaps.fiveTone } );
                                if(somescene.name=="dust"){
                                    var material;
                                    if(params.phong) material = new THREE.MeshPhongMaterial( {map:object.material.map, opacity:0.1, transparent:true} );
                                    else if(params.rainbow) material = new THREE.MeshNormalMaterial( {map:object.material.map, opacity:0.1, transparent:true} );
                                    else material = new THREE.MeshDepthMaterial( {map:object.material.map, opacity:0.1, transparent:true} );
                                    object.material = material;
                                    object.material.flatShading=true;
                                }
                                else{
                                    var material;
                                    if(params.phong) material = new THREE.MeshPhongMaterial( {map:object.material.map} );
                                    else if(params.rainbow) material = new THREE.MeshNormalMaterial( {map:object.material.map} );
                                    else material = new THREE.MeshDepthMaterial( {map:object.material.map} );
                                    object.material = material;
                                    object.material.flatShading=true;
                                }
                           }
                        });
                    
                });                
            }
           else{
                roomscene.traverse( function ( object ) {
                   if(object.isMesh) {
                        var material = new THREE.MeshStandardMaterial( { map:object.material.map } );
                        object.material = material;
                        object.material.flatShading=true;
                   }
                });               
                paintings.traverse( function ( object ) {
                   if(object.isMesh) {
                        var material = new THREE.MeshStandardMaterial( { map:object.material.map } );
                        object.material = material;
                        object.material.flatShading=true;
                   }
                });                  
                rigidBodies.forEach( function ( somescene ) {
                    if(somescene.name!="thecat"){                    
                        somescene.traverse( function ( object ) {                    
                            if(object.isMesh) {
                                 var material = new THREE.MeshStandardMaterial( { map:object.material.map, bumpMap:object.material.bumpMap } );
                                 object.material = material;
                                 object.material.flatShading=true;
                            }
                        });
                    }
                });     
                shelves.forEach( function ( somescene ) {
                        somescene.traverse( function ( object ) {                    
                            if(object.isMesh) {
                                if(somescene.name=="dust"){
                                    var material = new THREE.MeshStandardMaterial( { map:object.material.map, opacity:0.1, transparent:true } );
                                    object.material = material;
                                    object.material.flatShading=true;
                                }
                                else{
                                    var material = new THREE.MeshStandardMaterial( { map:object.material.map } );
                                    object.material = material;
                                    object.material.flatShading=true;
                                }
                            }
                        });
                });                     
           }
        });

        gui.domElement.hidden=true;
        window.addEventListener( 'resize', onWindowResize, false );
        //window.addEventListener( 'click', onDocumentMouseClick, false );
}

/**
 * A callback that will be called whenever the browser window is resized.
 */
function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
	composer.setSize( window.innerWidth, window.innerHeight );        
	outlineeffect.setSize( window.innerWidth, window.innerHeight );        
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
                mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
                mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
                raycaster.setFromCamera( mouse, camera );
                var intersects = raycaster.intersectObjects( paintings.children );
                if ( intersects.length > 0 ) {
                        var object = intersects[ 0 ].object;
                        painting.style.top=event.pageY +10+'px';
                        painting.style.left=event.pageX +10+'px';
                        painting.style.display="block";

                        if(object.name=="mesh_4") {
                            painting.innerText="The Starry Night - 1889";
                        }
                        else if(object.name=="mesh_7") {
                            painting.innerText="Self-portrait - 1889";
                        }
                        else if(object.name=="mesh_5") {
                            painting.innerText="Cafe Terrace at Night - 1888";
                        }
                        else if(object.name=="mesh_8") {
                            painting.innerText="Portrait of Eugene Boch- 1888";
                        }
                        else if(object.name=="mesh_0") {
                            painting.innerText="Avenue of Poplars - 1884";
                        }
                        else if(object.name=="mesh_1") {
                            painting.innerText="Starry Night Over the Rhone - 1888";
                        }
                }
                else painting.style.display="none";
	};
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

	this.onKeyDown = function ( event ) {
                
		switch ( event.keyCode ) {
                        
                         case 27: /*esc*/ 
                            escispressed=!escispressed;
                            instructions.style.display='none';
                            if(escispressed) {stopTime();gui.domElement.hidden= false;}
                            else {startTime();gui.domElement.hidden=true;}
                            break;
                        
			case 38: /*up*/
			case 87: /*W*/ this.moveForward = true; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveRight = true; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = true; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveLeft = true; break;

                        case 16: /*Shift*/ event.preventDefault(); shiftisup = false; break;
                        case 32: /*Space*/ {
                                event.preventDefault();
                                space = true; break;}
		}
	};

	this.onKeyUp = function ( event ) {
                event.preventDefault();
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
                        if(!shiftisup) actualMoveSpeed = delta * this.movementSpeed * 1.5;// Increase speed when shift is down - but also increases jump velocity ??

                        var velox=0;
                        var veloz=0;
                        
                        if ( this.moveLeft) { //A
                            idle=false; 
                            rotay-=0.1;
                        }
			else if ( this.moveRight ) { //D
                            idle=false;
                            rotay+=0.1;                            
                        }
                        else { //IDLE
                            idle=true;
                        }

			if ( this.moveBackward) { //S
                            idle=false; 
                            veloz = -actualMoveSpeed*Math.cos(rotay)/2.2;
                            velox = -actualMoveSpeed*Math.sin(rotay)/2.2;
                        }
			else if ( this.moveForward ) { //W
                            idle=false;
                            veloz = actualMoveSpeed*Math.cos(rotay)/2.2;
                            velox = actualMoveSpeed*Math.sin(rotay)/2.2;
                        }
                        else{ //IDLE
                            if(!this.moveLeft && !this.moveRight) idle=true;
                        }
                        // WALK CAT
                        this.object.userData.physicsBody.setLinearVelocity(new Ammo.btVector3( velox, 0, veloz));                        
                        
                        // JUMP CAT 
                        if(space) {
                            if(stilljumping==0) {
                                stilljumping=21; // to prevent multiple jumps count down from 50
                                this.object.userData.physicsBody.setLinearVelocity(new Ammo.btVector3( 0, 10, 0));
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
                        physicsWorld.stepSimulation( delta*2.5, 10 );
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
                                            if(objThree.position.y<0.2 && !didobjectfall[i]) {
                                                didobjectfall[i]=true;
                                                increaseScore();
                                                if(score===10) {gameOver(true); return;}
                                                if(objThree.name=="Vase"){
                                                    var mixer = new THREE.AnimationMixer( vase.scene );
                                                    var action = mixer.clipAction(vase.animations[0]);
                                                    action.play();
                                                    vasefell=50;
                                                    vasemixer=mixer;
                                                    if(params.sound) breaksound.play();
                                                }
                                                else if(objThree.name!='Sunflower'){
                                                    if(params.sound) hitsound.play();
                                                }
                                            }
                                        }
                                }
                        }        
                        
                        this.object.rotation.y = rotay;

                            // UPDATE CAMERA
                        var deltacamera = new THREE.Vector3(this.object.position.x+Math.sin(Math.PI*3/2-this.mouseX*0.004)*1.5, 
                                                            this.object.position.y+1+Math.sin(this.mouseY*0.002), 
                                                            this.object.position.z+Math.cos(Math.PI*3/2-this.mouseX*0.004)*1.5)

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
                        if(!flying && Math.abs(this.object.position.x-bird.scene.position.x)<0.5 && Math.abs(this.object.position.z-bird.scene.position.z)<0.3 && Math.abs(this.object.position.y-bird.scene.position.y)<0.5){
                            changeBirdsAnimation(4); // fly
                            flying=true;
                        }
                        else if(flying){
                            if(flyingleft) { 
                                bird.scene.position.z-=0.02;
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
