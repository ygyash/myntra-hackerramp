// Common
var socket = io.connect();
var room = null;

// Video Call
let mic_switch = true;
let video_switch = true;
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var usersAlreadyPresent;
var userIndex = -1;
var remoteUser;
var currentUser;
var localVideo;
var constraints = {
  audio: true,
  video: {
    width: 320,
    height: 240,
    frameRate: 5,
  },
};

// Chat + Model
$(document).ready(() => {
  $("body").height($(window).height());
  $("body").width($(window).width());

  $("#dresser").hide();
  $("#name").focus();

  $("form").submit(function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  });

  $("#join").click(function () {
    console.log("clicked");
    var name = $("#name").val();
    room = $("#room").val();

    if ($('#radioBut1').is(':checked')) {
      console.log("Name is", name);

      if (name != "" && room != "") {
        socket.emit("join", name, room);
        $("#login").detach();
        $("#dresser").show();
        ready = true;
      }
    }
    else {
      if (name != "" && room != "") {
        socket.emit("create", name, room,$('#selectModelForm option:selected').val());
        $("#login").detach();
        $("#dresser").show();
        ready = true;
      }
    }

    
  });

  $("#name").keypress(function (e) {
    if (e.which == 13) {
      var name = $("#name").val();
      var room = $("#room").val();
      if (name != "" && room != "") {
        socket.emit("join", name, room);
        ready = true;
        $("#login").detach();
        $("#dresser").show();
      }
    }
  });

  socket.on('room-not-found',function(){
    alert('Sorry, room you are looking for not found!');
    window.location.reload();
  })

  socket.on('room-already-exists',function(){
    alert('Sorry, room you are creating already exists!');
    window.location.reload();
  })

  socket.on("update", function (msg) {
    if (ready) $("#msgs").append('<p class="message">' + msg + "</p>");
  });

  socket.on("update-people", function (people) {
    if (ready) {
      $("#people").empty();
      people.forEach(function (name) {
        $("#people").append("<li>" + name + "</li>");
      });
    }
  });

  socket.on("chat", function (who, msg) {
    if (ready) {
      $("#msgs").append('<p class="message">' + who + " says: " + msg + "</p>");
    }
  });

  socket.on("disconnect", function () {
    $("#msgs").append("<p>The server is not available</p>");
    $("#message-field").attr("disabled", "disabled");
    $("#send-btn").attr("disabled", "disabled");
  });

  $("#send-btn").click(function () {
    console.log("send button clicked");
    var msg = $("#message-field").val();
    if (msg !== "") {
      console.log(msg);
      socket.emit("send", msg);
      $("#message-field").val("");
    }
  });

  $("#message-field").keypress(function (e) {
    console.log("Enter pressed");
    if (e.which == 13) {
      var msg = $("#message-field").val();
      console.log(msg);
      if (msd !== "") {
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
    loaderAnim = document.getElementById("js-loader");
  const avatarWindow = $(".avatar");

  init();

  $("#clothes-btn").on("click", function () {
    // console.log(this.id);

    var texture =
      $("#top-select option:selected").val() +
      "bottom" +
      $("#bottom-select option:selected").val() +
      "foot" +
      $("#foot-select option:selected").val();
    socket.emit("change-clothes", texture);
    console.log(texture);
  });



  socket.on("loadClothes", function (model, texture) {
    console.log(model,texture);
    var prev = scene.getObjectByName("clothModel");
    scene.remove(prev);

    let stacy_txt = new THREE.TextureLoader().load(
      `model/${model}/tex/${texture}.jpg`
    );
    console.log(`model/${model}/tex/${texture}.jpg`);
    stacy_txt.flipY = false;

    const stacy_mtl = new THREE.MeshPhongMaterial({
      map: stacy_txt,
      color: 0xffffff,
      skinning: true,
    });

    const MODEL_PATH = `model/${model}/${model}.glb`;

    var loader = new THREE.GLTFLoader();

    loader.load(
      MODEL_PATH,
      function (gltf) {
        model = gltf.scene;
        let fileAnimations = gltf.animations;

        model.traverse((o) => {
          // console.log(o);
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            o.material = stacy_mtl;
          }
          // Reference the neck and waist bones
          if (o.isBone && o.name === "mixamorigNeck") {
            neck = o;
          }
          if (o.isBone && o.name === "mixamorigSpine") {
            waist = o;
          }
        });

        model.scale.set(10, 10, 10);
        model.position.y = -11;
        model.name = "clothModel";

        scene.add(model);


        mixer = new THREE.AnimationMixer(model);

        let clips = fileAnimations.filter((val) => val.name !== "idle");
        possibleAnims = clips.map((val) => {
          let clip = THREE.AnimationClip.findByName(clips, val.name);

          clip.tracks.splice(3, 3);
          clip.tracks.splice(9, 3);

          clip = mixer.clipAction(clip);
          return clip;
        });

        let idleAnim = THREE.AnimationClip.findByName(fileAnimations, "idle");

        idleAnim.tracks.splice(3, 3);
        idleAnim.tracks.splice(9, 3);

        idle = mixer.clipAction(idleAnim);
        idle.play();
      },
      undefined, // We don't need this function
      function (error) {
        console.error(error);
      }
    );
  });

  function init() {
    // const MODEL_PATH = "model/stacy/stacy.glb";
    const canvas = document.querySelector("#c");
    const backgroundColor = 0xc7c7d6;

    // Init the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    scene.fog = new THREE.Fog(backgroundColor, 80, 100);

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
      1000
    );

    camera.position.z = 30;
    camera.position.x = 0;
    camera.position.y = -3;

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
      shininess: 0,
    });

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

    loaderAnim.remove();
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

    const needResize =
      canvasPixelWidth !== width || canvasPixelHeight !== height - 6;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  // Video Conferencing code.
  localVideo = document.querySelector("#localVideo");
  socket.on("connect", function () {
    currentUser = socket.id;
  });

  socket.on("created", function (room) {
    console.log("Created room " + room);
    isInitiator = true;
    setupEvents();
  });

  socket.on("join", function (room) {
    console.log("Another peer made a request to join room " + room);
    console.log("This peer is the initiator of room " + room + "!");
    isChannelReady = true;
  });

  socket.on("joined", function (room, socketId, sockets) {
    console.log("joined: " + room);
    usersAlreadyPresent = sockets;
    usersAlreadyPresent = usersAlreadyPresent.slice(
      0,
      usersAlreadyPresent.length - 1
    );
    isChannelReady = true;
    setupEvents();
  });

  socket.on("disconnected", function (socketId) {
    var videoElement = document.getElementById("user-" + socketId);
    if (videoElement) {
      videoElement.remove();
    }
  });

  function sendMessage(message) {
    if (
      isInitiator === false &&
      usersAlreadyPresent &&
      usersAlreadyPresent.length > 0
    ) {
      message.sendToRemoteUser = true;
    }
    message.fromInitiator = isInitiator;
    message.from = currentUser;
    message.to = remoteUser;
    console.log("Client sending message: ", message);
    socket.emit("message", message);
  }

  // This client receives a message
  socket.on("message", function (message) {
    remoteUser = message.from ? message.from : remoteUser;
    console.log(remoteUser);
    console.log("Client received message:", message);
    if (message.type === "init") {
      maybeStart();
    } else if (
      message.type === "offer" &&
      !isInitiator &&
      !(message.fromInitiator && isInitiator)
    ) {
      if (!isInitiator && !isStarted) {
        maybeStart();
      }
      pc.setRemoteDescription(new RTCSessionDescription(message));
      doAnswer();
    } else if (
      message.type === "answer" &&
      isStarted &&
      !(message.fromInitiator && isInitiator)
    ) {
      pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === "candidate" && isStarted) {
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate,
      });
      pc.addIceCandidate(candidate);
    } else if (message === "bye" && isStarted) {
      handleRemoteHangup();
    }
  });

  // Wait for socket to get it's id.
  function setupEvents() {
    navigator.mediaDevices.getUserMedia(constraints).then(gotStream);
  }

  function gotStream(stream) {
    console.log("Adding local stream.");
    localStream = stream;
    localVideo.srcObject = stream;
    interactUser();
    sendMessage({ type: "init" });
    if (isInitiator) {
      maybeStart();
    }
  }

  function interactUser() {
    userIndex++;
    console.log(userIndex);
    if (usersAlreadyPresent && usersAlreadyPresent.length > userIndex) {
      remoteUser = usersAlreadyPresent[userIndex];
    }
  }

  function maybeStart() {
    console.log(
      ">>>>>>> maybeStart() ",
      isStarted,
      localStream,
      isChannelReady
    );
    if (!isStarted && typeof localStream !== "undefined" && isChannelReady) {
      console.log(">>>>>> creating peer connection");
      createPeerConnection();
      pc.addStream(localStream);
      isStarted = true;
      console.log("isInitiator", isInitiator);
      if (isInitiator) {
        doCall();
      }
    }
  }

  window.onbeforeunload = function () {
    sendMessage("bye");
  };

  function createPeerConnection() {
    try {
      pc = new RTCPeerConnection({
        iceServers: [
          // Information about ICE servers. outlook account
          // TODO Delete Self Server.
          {
            urls: "turn:myntra.westus.cloudapp.azure.com:5349",
            username: "myntratest",
            credential: "test12345",
          },
        ],
      });
      pc.onicecandidate = handleIceCandidate;
      pc.onaddstream = handleRemoteStreamAdded;
      pc.onremovestream = handleRemoteStreamRemoved;
      console.log("Created RTCPeerConnnection");
    } catch (e) {
      console.log("Failed to create PeerConnection, exception: " + e.message);
      alert("Cannot create RTCPeerConnection object.");
      return;
    }
  }

  function handleIceCandidate(event) {
    console.log("icecandidate event: ", event);
    if (event.candidate) {
      sendMessage({
        type: "candidate",
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
      });
    } else {
      console.log("End of candidates.");

      maybeEnd();
    }
  }

  // Super Janky function, find a better way to do it.
  // This will be exponentially poor.
  function maybeEnd() {
    // Assuming this will be called after the last step.
    setTimeout(function () {
      if (isInitiator) {
        isInitiator = true;
        isStarted = false;
        isChannelReady = false;
      } else if (userIndex + 1 === usersAlreadyPresent.length) {
        isInitiator = true;
        isStarted = false;
        isChannelReady = false;
      } else {
        isInitiator = false;
        isStarted = false;
        isChannelReady = true;
        interactUser();
        sendMessage({ type: "init" });
      }
    }, 3000);
  }

  function handleCreateOfferError(event) {
    console.log("createOffer() error: ", event);
  }

  function doCall() {
    console.log("Sending offer to peer");
    pc.createOffer()
      .then(function (offer) {
        return pc.setLocalDescription(offer);
      })
      .then(function () {
        var offer = pc.localDescription;
        offer.fromInitiator = isInitiator;
        sendMessage(offer);
      })
      .catch(handleCreateOfferError);
  }

  function doAnswer() {
    console.log("Sending answer to peer.");
    pc.createAnswer()
      .then(function (answer) {
        return pc.setLocalDescription(answer);
      })
      .then(function () {
        var answer = pc.localDescription;
        answer.fromInitiator = isInitiator;
        sendMessage(answer);
      })
      .catch(onCreateSessionDescriptionError);
  }

  function onCreateSessionDescriptionError(error) {
    trace("Failed to create session description: " + error.toString());
  }

  function handleRemoteStreamAdded(event) {
    console.log("Remote stream added.");
    remoteStream = event.stream;

    var remoteVideo = document.createElement("video");
    remoteVideo.setAttribute("id", "user-" + remoteUser);
    remoteVideo.autoplay = true;
    remoteVideo.playsinline = true;
    remoteVideo.srcObject = remoteStream;

    document.getElementById("videos").appendChild(remoteVideo);
  }

  // TODO This function hasn't fired in testing yet, so the variables change might be buggy.
  function handleRemoteStreamRemoved(event) {
    // console.error("Triggered??");
    console.log("Remote stream removed. Event: ", event);
    // isInitiator = false;
    // isChannelReady = false;
    // isStarted = false;
  }

  function hangup() {
    console.log("Hanging up.");
    stop();
    sendMessage("bye");
  }

  function handleRemoteHangup() {
    console.log("Session terminated.");
    stop();
  }

  function stop() {
    isInitiator = false;
    isStarted = false;
    isChannelReady = false;
    usersAlreadyPresent = undefined;
    userIndex = -1;
    remoteUser = undefined;
    currentUser = undefined;

    pc.close();
    pc = null;
  }
})();

function toggleVideo() {
  if (localStream != null && localStream.getVideoTracks().length > 0) {
    video_switch = !video_switch;

    localStream.getVideoTracks()[0].enabled = video_switch;

    if ($("#videoOn").css("display") == "none") {
      $("#videoOn").css({ display: "block" });
      $("#videoOff").css({ display: "none" });
    } else {
      $("#videoOn").css({ display: "none" });
      $("#videoOff").css({ display: "block" });
    }
  }
}

function toggleMic() {
  if (localStream != null && localStream.getAudioTracks().length > 0) {
    mic_switch = !mic_switch;

    localStream.getAudioTracks()[0].enabled = mic_switch;
  }

  if ($("#micOn").css("display") == "none") {
    $("#micOn").css({ display: "block" });
    $("#micOff").css({ display: "none" });
  } else {
    $("#micOn").css({ display: "none" });
    $("#micOff").css({ display: "block" });
  }
}
