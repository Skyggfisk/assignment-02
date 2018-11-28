// global song obj used to pass info from upload handler to hidden audio
// I did this because I have no idea how to get the file name from a blob / HTMLAudioElement's src
let song = { title: "", data: "", duration: "" };
let db;

// setup wavesurfer
const wavesurfer = WaveSurfer.create({
  container: "#waveform",
  waveColor: "darkorchid",
  progressColor: "purple",
  responsive: true
});

window.onload = function() {
  // idb functionality
  // https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Client-side_storage
  // request to open db called playlist v1.0
  let req = window.indexedDB.open("playlist", 1);

  // print to console in case of error
  req.onerror = function() {
    console.log("Failed to open database.");
  };

  // set db object in case of success
  req.onsuccess = function() {
    console.log("Opened database successfully.");
    db = req.result;
  };

  // Setup object store
  req.onupgradeneeded = function(e) {
    let db = e.target.result;

    let objectStore = db.createObjectStore("songs", {
      keyPath: "id",
      autoIncrement: true
    });

    // create indexes defining the 'schema'
    objectStore.createIndex("title", "title", { unique: false });
    objectStore.createIndex("duration", "duration", { unique: false });
    objectStore.createIndex("data", "data", { unique: false });

    console.log("Database setup complete");
  };

  // set event handlers
  uploadTrackEventHandler();
  hiddenAudioEventHandler();
  playPauseEventHandler();
  muteEventHandler();
  stopButtonEventHandler();
  volumeEventHandler();
};

// upload track event handler
function uploadTrackEventHandler() {
  document
    .querySelector("#upload-track")
    .addEventListener("change", function() {
      let songObj = URL.createObjectURL(this.files[0]);
      wavesurfer.load(songObj);
      console.log(this.files[0]);

      song.data = this.files[0];
      song.title = this.files[0].name;

      // add file to playlist, refer to hidden audio event handler for more details
      let audio = document.getElementById("hidden-audio");
      audio.src = songObj;
      audio.load();
    });
}

// opens a transaction and adds the given track to the "songs" store
function addToIDB(track) {
  let trx = db.transaction(["songs"], "readwrite");
  let objStore = trx.objectStore("songs");
  objStore.add(track);

  // log transaction completion
  trx.oncomplete = () => {
    console.log(`Transaction completed. Added ${track.title}.`);
  };

  // log transaction error
  trx.onerror = () => {
    console.log("Transaction error.");
  };
}

// hidden audio event-handler, used to get song duration
// modified version of https://jsfiddle.net/derickbailey/s4P2v/
function hiddenAudioEventHandler() {
  document
    .getElementById("hidden-audio")
    .addEventListener("canplaythrough", function() {
      let seconds = this.duration;
      let duration = moment.duration(seconds, "seconds");

      let time = "";
      let hours = duration.hours();
      if (hours > 0) {
        time = hours + ":";
      }

      time = time + duration.minutes() + ":" + duration.seconds();
      song.duration = time;

      // add to song store, now that we have all the data
      addToIDB(song);

      console.log("LOADED FILE: " + this.src + "\n DURATION: " + time);

      // insert new track in the playlist
      document.getElementById("playlist").insertAdjacentHTML(
        "beforeend",
        `<div class="song" id="${1}">
          <p class="song-name">${song.title}</p>
          <p class="song-length">${time}</p>
        </div>`
      );
    });
}

// play-pause event handler
function playPauseEventHandler() {
  document
    .querySelector(".play-pause-button")
    .addEventListener("click", function() {
      if (!wavesurfer.isPlaying()) {
        this.classList.remove("fa-play");
        this.classList.add("fa-pause");
      } else {
        this.classList.remove("fa-pause");
        this.classList.add("fa-play");
      }
      wavesurfer.playPause();
    });
}

// mute-unmute event handler
function muteEventHandler() {
  document
    .querySelector(".mute-unmute-button")
    .addEventListener("click", function() {
      if (!wavesurfer.getMute()) {
        this.classList.remove("fa-volume-down");
        this.classList.add("fa-volume-mute");
      } else {
        this.classList.remove("fa-volume-mute");
        this.classList.add("fa-volume-down");
      }
      wavesurfer.toggleMute();
    });
}

// stop-button event handler
function stopButtonEventHandler() {
  document.querySelector(".stop-button").addEventListener("click", function() {
    wavesurfer.stop();
    if (wavesurfer.isPlaying()) {
      // TODO this doesnt change pause to play when stop button is clicked
      let pp = document.querySelector(".play-pause-button");
      pp.classList.remove("fa-pause");
      pp.classList.add("fa-play");
    }
  });
}

// volume-slider event handler
function volumeEventHandler() {
  document
    .querySelector(".volume-slider")
    .addEventListener("change", function() {
      wavesurfer.setVolume(this.value / 100);
      let voltext = document.querySelector(".volume-text");
      voltext.innerHTML = `${this.value}%`;
    });
}
