var socket = io('http://localhost:5000');
$(document).ready(()=>{
  
  $('body').height($(window).height());
  $('body').width($(window).width());
  
  
  
  
  $("#dresser").hide();
  $("#name").focus();
  
  
  $("form").submit(function(event){
    event.preventDefault();
    event.stopImmediatePropagation();
  });
  
  $("#join").click(function(){
    console.log("clicked");
    var name = $("#name").val();
    var room = $("#room").val();
    console.log("Name is",name);

    if (name != "" && room!="" ) {
      socket.emit("join", name,room);
      $("#login").detach();
      $("#dresser").show();
      ready = true;
    }
  });
  
  $("#name").keypress(function(e){
    if(e.which == 13) {
      var name = $("#name").val();
      var room = $("#room").val();
      if (name != ""&& room!="") {
        socket.emit("join", name,room);
        ready = true;
        $("#login").detach();
        $("#dresser").show();
      }
    }
  });
  
  socket.on("update", function(msg) {
    if(ready)
      $("#msgs").append('<p class="message">'+msg+'</p>');
  });
  
  socket.on("update-people", function(people){
    if(ready) {
      $("#people").empty();
      people.forEach(function(name) {
        $('#people').append("<li>"+name+"</li>");
      });
    }
  });
  
  socket.on("chat", function(who, msg){
    if(ready) {
      $("#msgs").append('<p class="message">'+who + " says: " + msg+'</p>');
    }
  });
  
  socket.on("disconnect", function(){
    $("#msgs").append("<p>The server is not available</p>");
    $("#message-field").attr("disabled", "disabled");
    $("#send-btn").attr("disabled", "disabled");
  });
  
  
  $("#send-btn").click(function(){
    console.log("send button clicked")
    var msg = $("#message-field").val();
    if(msg!==""){
      console.log(msg);
      socket.emit("send", msg);
      $("#message-field").val("");
    }
  });
  
  $("#message-field").keypress(function(e){
    console.log("Enter pressed");
    if(e.which == 13) {
      var msg = $("#message-field").val();
      console.log(msg);
      if(msd!==""){
        socket.emit("send", msg);
        $("#message-field").val("");
      }
    }
  });
  
});


(function () {
  // Set our main variables
  let scene,
  renderer,
  camera,
  model, // Our character
  neck, // Reference to the neck bone in the skeleton
  waist, // Reference to the waist bone in the skeleton
  possibleAnims, // Animations found in our file
  mixer, // THREE.js animations mixer
  idle, // Idle, the default state our character returns to
  clock = new THREE.Clock(), // Used for anims, which run to a clock instead of frame rate 
  currentlyAnimating = false, // Used to check whether characters neck is being used in another anim
  raycaster = new THREE.Raycaster(), // Used to detect the click on our character
  loaderAnim = document.getElementById('js-loader');
  const avatarWindow = $('.avatar');
  
  
  init();
  
  $("#clothes-btn").on('click',function(){
    // console.log(this.id);
    
    var texture = 'stacytop'+$('#top-select option:selected').val()+'bottom'+$('#bottom-select option:selected').val()+'foot'+$('#foot-select option:selected').val();
    socket.emit('change-clothes','stacy',texture);
    console.log(texture);
  });
  
  socket.on('clothes',function(model,texture){
    var prev = scene.getObjectByName("clothModel");
    scene.remove(prev);
    
    
    let stacy_txt = new THREE.TextureLoader().load('model/stacy/tex/'+texture+'.jpg');
    stacy_txt.flipY = false;
    
    const stacy_mtl = new THREE.MeshPhongMaterial({
      map: stacy_txt,
      color: 0xffffff,
      skinning: true });
      
      
      const MODEL_PATH = `model/${model}/${model}.glb`;
      
      var loader = new THREE.GLTFLoader();
      
      loader.load(
        MODEL_PATH,
        function (gltf) {
          model = gltf.scene;
          let fileAnimations = gltf.animations;
          
          model.traverse(o => {
            // console.log(o);
            if (o.isMesh) {
              o.castShadow = true;
              o.receiveShadow = true;
              o.material = stacy_mtl;
            }
            // Reference the neck and waist bones
            if (o.isBone && o.name === 'mixamorigNeck') {
              neck = o;
            }
            if (o.isBone && o.name === 'mixamorigSpine') {
              waist = o;
            }
          });
          
          model.scale.set(10, 10, 10);
          model.position.y = -11;
          model.name = "clothModel";
          
          scene.add(model);
          
          loaderAnim.remove();
          
          mixer = new THREE.AnimationMixer(model);
          
          let clips = fileAnimations.filter(val => val.name !== 'idle');
          possibleAnims = clips.map(val => {
            let clip = THREE.AnimationClip.findByName(clips, val.name);
            
            clip.tracks.splice(3, 3);
            clip.tracks.splice(9, 3);
            
            clip = mixer.clipAction(clip);
            return clip;
          });
          
          
          let idleAnim = THREE.AnimationClip.findByName(fileAnimations, 'idle');
          
          idleAnim.tracks.splice(3, 3);
          idleAnim.tracks.splice(9, 3);
          
          idle = mixer.clipAction(idleAnim);
          idle.play();
          
        },
        undefined, // We don't need this function
        function (error) {
          console.error(error);
        });
      });
      
      function init() {
        
        const MODEL_PATH = 'model/stacy/stacy.glb';
        const canvas = document.querySelector('#c');
        const backgroundColor = 0xf1f1f1;
        
        // Init the scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(backgroundColor);
        scene.fog = new THREE.Fog(backgroundColor, 60, 100);
        
        // Init the renderer
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.shadowMap.enabled = true;
        renderer.setPixelRatio(window.devicePixelRatio);
        avatarWindow.append(renderer.domElement);
        
        // Add a 
        
        camera = new THREE.PerspectiveCamera(
          50,
          avatarWindow.innerWidth() / avatarWindow.innerHeight(),
          0.1,
          1000);
          
          camera.position.z = 30;
          camera.position.x = 0;
          camera.position.y = -3;
          
          let stacy_txt = new THREE.TextureLoader().load('model/stacy/tex/stacytop1bottom1foot1.jpg');
          stacy_txt.flipY = false;
          
          const stacy_mtl = new THREE.MeshPhongMaterial({
            map: stacy_txt,
            color: 0xffffff,
            skinning: true });
            
            
            
            var loader = new THREE.GLTFLoader();
            
            loader.load(
              MODEL_PATH,
              function (gltf) {
                model = gltf.scene;
                let fileAnimations = gltf.animations;
                
                model.traverse(o => {
                  // console.log(o);
                  if (o.isMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                    o.material = stacy_mtl;
                  }
                  // Reference the neck and waist bones
                  if (o.isBone && o.name === 'mixamorigNeck') {
                    neck = o;
                  }
                  if (o.isBone && o.name === 'mixamorigSpine') {
                    waist = o;
                  }
                });
                
                model.scale.set(10, 10, 10);
                model.position.y = -11;
                model.name = "clothModel";
                
                scene.add(model);
                
                loaderAnim.remove();
                
                mixer = new THREE.AnimationMixer(model);
                
                let clips = fileAnimations.filter(val => val.name !== 'idle');
                possibleAnims = clips.map(val => {
                  let clip = THREE.AnimationClip.findByName(clips, val.name);
                  
                  clip.tracks.splice(3, 3);
                  clip.tracks.splice(9, 3);
                  
                  clip = mixer.clipAction(clip);
                  return clip;
                });
                
                
                let idleAnim = THREE.AnimationClip.findByName(fileAnimations, 'idle');
                
                idleAnim.tracks.splice(3, 3);
                idleAnim.tracks.splice(9, 3);
                
                idle = mixer.clipAction(idleAnim);
                idle.play();
                
              },
              undefined, // We don't need this function
              function (error) {
                console.error(error);
              });
              
              
              // Add lights
              let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
              hemiLight.position.set(0, 50, 0);
              // Add hemisphere light to scene
              scene.add(hemiLight);
              
              let d = 8.25;
              let dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
              dirLight.position.set(-8, 12, 8);
              dirLight.castShadow = true;
              dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
              dirLight.shadow.camera.near = 0.1;
              dirLight.shadow.camera.far = 1500;
              dirLight.shadow.camera.left = d * -1;
              dirLight.shadow.camera.right = d;
              dirLight.shadow.camera.top = d;
              dirLight.shadow.camera.bottom = d * -1;
              // Add directional Light to scene
              scene.add(dirLight);
              
              
              // Floor
              let floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
              let floorMaterial = new THREE.MeshPhongMaterial({
                color: 0xeeeeee,
                shininess: 0 });
                
                
                let floor = new THREE.Mesh(floorGeometry, floorMaterial);
                floor.rotation.x = -0.5 * Math.PI;
                floor.receiveShadow = true;
                floor.position.y = -11;
                scene.add(floor);
                
                let geometry = new THREE.SphereGeometry(8, 32, 32);
                let material = new THREE.MeshBasicMaterial({ color: 0x9bffaf }); // 0xf2ce2e 
                let sphere = new THREE.Mesh(geometry, material);
                
                sphere.position.z = -15;
                sphere.position.y = -2.5;
                sphere.position.x = -0.25;
                scene.add(sphere);
              }
              
              
              function update() {
                if (mixer) {
                  mixer.update(clock.getDelta());
                }
                
                if (resizeRendererToDisplaySize(renderer)) {
                  const canvas = renderer.domElement;
                  camera.aspect = canvas.clientWidth / canvas.clientHeight;
                  camera.updateProjectionMatrix();
                }
                
                renderer.render(scene, camera);
                requestAnimationFrame(update);
              }
              
              update();
              
              function resizeRendererToDisplaySize(renderer) {
                const canvas = renderer.domElement;
                let width = avatarWindow.innerWidth();
                let height = avatarWindow.innerHeight();
                
                
                
                let canvasPixelWidth = canvas.width / window.devicePixelRatio;
                let canvasPixelHeight = canvas.height / window.devicePixelRatio;
                
                // console.log(canvas.height, height-6 );
                
                const needResize = canvasPixelWidth !== width || canvasPixelHeight !== height-6;
                if (needResize) {
                  renderer.setSize(width, height, false);
                }
                return needResize;
              }
              
            })();