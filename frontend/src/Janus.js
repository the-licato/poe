const websocketURI = process.env.NODE_ENV === "development" ? "ws://localhost:5000/" : "wss://poe-dtlab.herokuapp.com";
const config = {"iceServers": [{urls: "stun:stun.l.google.com:19302"},{urls: "turn:numb.viagenie.ca", username: "webrtc@live.com", credential: "muazkh"}]}
var pc_constraints = {"optional": [{"DtlsSrtpKeyAgreement": true}]};
			
class Janus {
  constructor() {
    this.websocket = undefined;
    this.publisherConn = undefined;
    this.subscriberConn = {};
    this.streams = {};
    this.mystream = undefined;
    this.course = undefined;
	
    this.candidates = [];
    this.SDP = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      let socket = new WebSocket(websocketURI);
      socket.onopen = () => {
        resolve(socket);
      };
      socket.onerror = (err) => {
        reject(err);
      };
    });
  }

  async init(course) {
    this.course = course
    if(!this.websocket){
      this.websocket = await this.connect();
      this.websocket.onmessage = this.onMessageHandler.bind(this);   
      this.websocket.onclose = this.onCloseHandler.bind(this);
    }
  }

  //Method for static declaration. Unused 
  static async create() {
    const o = new Janus();
    await o.init();
    return o;
  }

  onCloseHandler(){
    console.log("WebSocket closed")
    this.publisherConn.close();
    Object.keys(this.subscriberConn).forEach((subscriberID) => {
      this.subscriberConn[subscriberID].close();
    })
  }

  async onMessageHandler(ev){
    let object = JSON.parse(ev.data);

    if (object.message === "answer") { //The user is a student or a teacher who needs to send its audio/video stream
      console.log("Got an answer")
      console.log(object.jsep)
      console.log(this.publisherConn)
      this.publisherConn.setRemoteDescription(object.jsep);
      console.log(this.publisherConn)
    }
    else if(object.message === "offer"){ //The user is a teacher who needs to get all audio/video streams

      this.subscriberConn[object.subscriberID] = new RTCPeerConnection(config,pc_constraints);      

      this.subscriberConn[object.subscriberID].ontrack = (ev) => {
        this.onTrackHandler(ev,object.subscriberID);
      }
      
      this.subscriberConn[object.subscriberID].onicecandidate = (ev) => {
	      this.onIceCandidateHandler2(ev,object.subscriberID)
      }

      this.subscriberConn[object.subscriberID].setRemoteDescription(object.jsep);
	    var mediaConstraints = {
	    	offerToReceiveAudio: true,
		    offerToReceiveVideo: true
      }

	  
      let answer = await this.subscriberConn[object.subscriberID].createAnswer(mediaConstraints);
      this.subscriberConn[object.subscriberID].setLocalDescription(answer)
      
      var jsep = {
		    "type": answer.type,
	    	"sdp": answer.sdp
	     };
      let body = {
        "message": "subscribe",
        "jsep": jsep,
        "subscriberID": object.subscriberID,
        "course": this.course
      }
      this.websocket.send(JSON.stringify(body)) 
	  

    } 
    else if(object.message === "started"){
      console.log("Received started message")
      this.SDP = true
    }
    else {
      console.log("Received msg from server");
      console.log(object);
    }
  }

  publish(){
    let body = {
      "message": "start",
      "course": this.course
    };
    this.websocket.send(JSON.stringify(body));
	
    this.publisherConn = new RTCPeerConnection(config,pc_constraints);
    this.publisherConn.onicecandidate = this.onIceCandidateHandler.bind(this);
    this.publisherConn.onnegotiationneeded = this.onNegotiationNeededHandler.bind(this);	
    this.userMediaSetup()
  }

  subscribe(){
    let body = {
      "message": "getFeeds",
      "course": this.course
    };
    this.websocket.send(JSON.stringify(body))
  }

  async userMediaSetup() {
    var media = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    if(this.publisherConn.iceConnectionState !== 'closed'){
      this.mystream = media;
      media.getTracks().forEach((track) => {
          this.publisherConn.addTrack(track, media)
      });
    }
  }

  async onIceCandidateHandler(ev) {
    console.log("onIceCandidateHandler");
  	console.log("Printing candidate....")
  	console.log(ev.candidate)
    if(ev.candidate){
      let candidate = {
        "candidate": ev.candidate.candidate,
        "sdpMid": ev.candidate.sdpMid,
        "sdpMLineIndex": ev.candidate.sdpMLineIndex
      };
      let body = {
        "message": "trickle",
        "candidate": candidate,
        "course": this.course
      };
      this.websocket.send(JSON.stringify(body));
    }
    else{
      console.log("No candidate")
      let body = {
        "message": "trickle",
        "completed": true,
        "course": this.course
      }
      this.websocket.send(JSON.stringify(body));
    }
  }
  
  async onIceCandidateHandler2(ev,subscriberID) {
	  
    console.log("onIceCandidateHandler");
    console.log("Printing candidate....")
    console.log(ev.candidate)
    if(this.SDP){
      if(ev.candidate && ev.candidate.candidate.length > 0){

        let candidate = {
          "candidate": ev.candidate.candidate,
          "sdpMid": ev.candidate.sdpMid,
          "sdpMLineIndex": ev.candidate.sdpMLineIndex
        };
        let body = {
          "message": "trickle",
          "candidate": candidate,
          "subscriberID": subscriberID,
          "course": this.course
        };
        this.websocket.send(JSON.stringify(body));
      }
      else{
        console.log("No candidate")
        let body = {
          "message": "trickle",
          "completed": true,
          "subscriberID": subscriberID,
          "course": this.course
        }
        this.websocket.send(JSON.stringify(body))
      }
      if(this.candidates.length>0){
        console.log("this.candidates.length:", this.candidates.length);
        for(let i = 0; i<this.candidates.length; i++){
          console.log("sending saved candidate number: ",i+1)
          let body = {
            "message": "trickle",
            "candidate": this.candidates[i],
            "subscriberID": subscriberID,
            "course": this.course
          };
          this.websocket.send(JSON.stringify(body))
        }
        console.log("Cleaning candidates array")	
        this.candidates = [];
      }
    }
    else if(ev.candidate){
      console.log("SDP not sent yet")
      let candidate = {
        "candidate": ev.candidate.candidate,
        "sdpMid": ev.candidate.sdpMid,
        "sdpMLineIndex": ev.candidate.sdpMLineIndex
      };
      this.subscriberConn[subscriberID].addIceCandidate(candidate)
      this.candidates.push(candidate);
    }
  }  

  async onNegotiationNeededHandler(ev) {
    console.log("onNegotiationNeededHandler");

    let offer = await this.publisherConn.createOffer();
    console.log("Printing offer...")
    console.log(offer)
    this.publisherConn.setLocalDescription(offer);

    let body = {
      "message": "publish",
      "offer": offer,
      "audio": true, //@TO-D: Not true by default!
      "video": true, //@TO-D: Not true by default!
      "course": this.course
    };
    this.websocket.send(JSON.stringify(body));
  }

  onTrackHandler(ev, subscriberID){
    console.log("On Add Stream event")
    this.streams[subscriberID]=ev.streams[0] 
  }
}

var JanusInstance = new Janus();

export default JanusInstance;