
const RECORD_PREFIX = "GkXf"
var parseWorker
var initialData

class GunStreamer {
  constructor(config) {
    this.dbRecord = config.dbRecord;
    this.streamId = config.streamId;
    this.gunDB = config.gun;
    this.debug = config.debug;
    this.startWorker();
  }

  onDataAvailable(event) {
    if (event.data.size > 0) {
      var blob = event.data;
      var response = new Response(blob).arrayBuffer().then(function (arrayBuffer) {
        blob = null;
        if (parseWorker != undefined) {
          parseWorker.postMessage(arrayBuffer);
        }
      });
      response = null;
    } else {
      this.debugLog("data not available")
    }
  }

  startWorker() {
    if (typeof (Worker) !== "undefined") {
      if (typeof (parseWorker) == "undefined") {
        parseWorker = new Worker("js/parser_worker.js");
      }
      parseWorker.onmessage = e => {
        const message = e.data;
        this.writeToGun(message);
      };
    } else {
      LOG("Sorry! No Web Worker support.");
    }
  }

  stopWorker() {
    parseWorker.terminate();
    parseWorker = undefined;
  }

  writeToGun(base64data) {
    this.debugLog("Write to GUN::" + base64data.substring(0, 100));
    let lastUpdate = new Date().getTime();
    let user;
    if (initialData == undefined && base64data.startsWith(RECORD_PREFIX)) {
      this.debugLog("INITIAL");
      var n = base64data.indexOf("wIEB");
      this.debugLog("RAW::" + n + "::" + base64data.substring(0, 252));
      initialData = base64data.substring(0, 252);
    } else {
      var n = base64data.indexOf("H0O2dQH");
      this.debugLog("RAW::" + n + "::" + base64data);
    }

    //Probably has to be changed to different data structure
    user = gunDB.get(this.streamId).put({ initial: initialData, name: base64data, id: this.streamId, timestamp: lastUpdate, isSpeaking: false });
    gunDB.get(this.dbRecord).set(user);
  }

  debugLog(logData) {
    if (this.debug) {
      console.log(logData);
    }
  }

}