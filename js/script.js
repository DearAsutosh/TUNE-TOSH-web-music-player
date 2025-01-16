let currentSong = new Audio();
let songs;
let currFolder;

function secondstoMinutes(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00"; // Corrected: Handles invalid or negative inputs properly
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}`);
    let response = await a.text();
    let div = document.createElement('div');
    div.innerHTML = response;
    let as = div.getElementsByTagName('a');
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith('.mp3')) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    // Show all songs in the playlist
    let songUL = document.querySelector('.songList').getElementsByTagName('ul')[0];
    songUL.innerHTML = ''; // Corrected: Clears the playlist to avoid duplicate entries
    for (const song of songs) {
        songUL.innerHTML += `
         <li><img class="invert" src="img/music.svg" alt="">
                             <div class="info">
                                 <div>${decodeURIComponent(song)}</div>
                             </div>
                             <div class="playnow">
                                 <span>Play now</span>
                                 <img class="invert" src="img/play.svg" alt="">
                             </div>
                         </li>`;
    }

    // Attach an event listener to each song
    Array.from(document.querySelector('.songList').getElementsByTagName("li")).forEach(e => {
        e.addEventListener('click', () => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML);
        });
    });
    return songs;
}

const playMusic = (track, pause = false) => {
    if (!track) {
        console.error("No track specified to play.");
        return;
    }

    currentSong.src = `/${currFolder}/` + track; // Construct the URL for the track
    currentSong.load(); // Ensure the track loads properly

    if (!pause) {
        currentSong.play();
        document.getElementById('play').src = "img/pause.svg"; // Update play button
    }

    document.querySelector('.songinfo').innerHTML = decodeURIComponent(track); // Update UI with the current song
    document.querySelector('.songtime').innerHTML = "00:00 / 00:00"; // Reset time display
};


async function displayAlbums() {
    let a = await fetch(`/songs`);
    let response = await a.text();
    let div = document.createElement('div');
    div.innerHTML = response;
    let anchors = div.getElementsByTagName('a');
    let cardContainer = document.querySelector('.cardContainer');

    let array = Array.from(anchors); // Moved array definition outside loop for clarity
    for (let index = 0; index < array.length; index++) {
        const e = array[index];

        if (e.href.includes('/songs')) {
            let folder = e.href.split('/').slice(-2)[0];
            // Fetch folder metadata
            let a = await fetch(`/songs/${folder}/info.json`);
            let response = await a.json();

            cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#000"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141834" stroke-width="1.5"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2 class="card-title">${response.title}</h2>
                        <p class="card-description">${response.description}</p>
                    </div>`;
        }
    }

    // Load playlist on card click
    Array.from(document.getElementsByClassName('card')).forEach(card => {
        card.addEventListener('click', async () => {
            songs = await getSongs(`songs/${card.dataset.folder}`);
            console.log(card.dataset.folder);
            if (songs && songs.length > 0) {
                playMusic(songs[0], true); // Play the first song in the list
            } else {
                console.error("No songs found in the selected folder.");
            }
        });
    });

    // return songs; // Corrected: Ensures return value matches function purpose
}

async function main() {
    // Initialize songs
    await getSongs("songs/Soothing");
    playMusic(songs[0], true);

    // Display albums
    displayAlbums();

    // Attach event listeners to control buttons
    const play = document.getElementById('play');
    play.addEventListener('click', () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    // Update song time and progress
    currentSong.addEventListener('timeupdate', () => {
        document.querySelector('.songtime').innerHTML = `${secondstoMinutes(currentSong.currentTime)} / ${secondstoMinutes(currentSong.duration)}`;
        document.querySelector('.circle').style.left = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
    });

    // Seek bar functionality
    document.querySelector('.seekbar').addEventListener('click', (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector('.circle').style.left = `${percent}%`;
        currentSong.currentTime = (percent / 100) * currentSong.duration;
    });

    // Hamburger menu functionality
    document.querySelector('.hamburger').addEventListener('click', () => {
        document.querySelector('.left').style.left = "0";
    });

    document.querySelector('.close').addEventListener('click', () => {
        document.querySelector('.left').style.left = "-120%";
    });

    // Previous and Next song controls
    document.getElementById('previous').addEventListener('click', () => {
        // Normalize current track
        let currentTrack = decodeURIComponent(currentSong.src.split('/').pop());
        let normalizedSongs = songs.map(song => decodeURIComponent(song));
    
        console.log("Current Track (Decoded):", currentTrack);
        console.log("Normalized Songs Array:", normalizedSongs);
    
        // Find the current index
        let index = normalizedSongs.indexOf(currentTrack);
        console.log("Current Index:", index);
    
        if (index > 0) { // Check if there's a previous song
            playMusic(songs[index - 1]);
        } else {
            console.warn("No previous song available or index out of bounds.");
        }
    });


  
    document.getElementById('next').addEventListener('click', () => {
        // Normalize current track
        let currentTrack = decodeURIComponent(currentSong.src.split('/').pop());
        let normalizedSongs = songs.map(song => decodeURIComponent(song));
    
        console.log("Current Track (Decoded):", currentTrack);
        console.log("Normalized Songs Array:", normalizedSongs);
    
        // Get index
        let index = normalizedSongs.indexOf(currentTrack);
        console.log("Current Index:", index);
    
        if (index >= 0 && index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            console.warn("No next song available or index out of bounds.");
        }
    });
    

    // Volume and mute controls
    document.querySelector('.range input').addEventListener('change', (e) => {
        currentSong.volume = parseInt(e.currentTarget.value) / 100;
    });

    document.querySelector('.volume').getElementsByTagName('img')[0].addEventListener('click', (e) => {
        if (e.currentTarget.src.includes("img/volume.svg")) {
            e.currentTarget.src = "img/mute.svg";
            currentSong.volume = 0;
            document.querySelector('.volume').getElementsByTagName('input')[0].value = 0;
        } else {
            e.currentTarget.src = "img/volume.svg";
            document.querySelector('.volume').getElementsByTagName('input')[0].value = 10;
        }
    });


    currentSong.addEventListener('ended', () => {
    let currentTrack = decodeURIComponent(currentSong.src.split('/').pop());
    let normalizedSongs = songs.map(song => decodeURIComponent(song));
    let index = normalizedSongs.indexOf(currentTrack);

    if (index >= 0 && index + 1 < songs.length) {
        playMusic(songs[index + 1]); // Play the next song
    } else {
        console.warn("End of playlist reached.");
    }
});
}

main();
