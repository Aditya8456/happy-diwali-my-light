/* Background song: the official YouTube video, played through the YouTube IFrame API
   (nothing is downloaded or re-hosted). Pages call window.playSong() from a tap,
   because phones only allow sound after the user touches the page.
   The position is kept in sessionStorage so the song carries on between pages. */
(function(){
  const VIDEO = '8XZ7dKan--4', TITLE = 'golden hour — JVKE';
  const store = {
    get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  const style = document.createElement('style');
  style.textContent = `
  #ytHolder{position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden}
  #music{position:fixed;right:16px;bottom:max(16px,env(safe-area-inset-bottom));z-index:75;display:flex;align-items:center;gap:10px;
    -webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
  #music .disc{width:54px;height:54px;border-radius:50%;cursor:pointer;border:0;position:relative;flex-shrink:0;touch-action:manipulation;
    background:radial-gradient(circle,#ffb02e 0 15px,#1a0d14 15.5px 17px,transparent 17.5px),
      repeating-radial-gradient(circle,#140a10 0 2px,#231520 2px 3px);
    box-shadow:0 10px 26px rgba(0,0,0,.55),0 0 0 1px rgba(255,214,140,.25);display:grid;place-items:center;font-size:15px}
  #music.on .disc{animation:discSpin 3.2s linear infinite;box-shadow:0 10px 26px rgba(0,0,0,.55),0 0 0 1px rgba(255,214,140,.4),0 0 24px rgba(246,185,29,.35)}
  #music .disc:after{content:"";position:absolute;inset:6px;border-radius:50%;background:linear-gradient(130deg,rgba(255,255,255,.12),transparent 40%)}
  #music .label{order:-1;max-width:0;overflow:hidden;white-space:nowrap;font:500 12.5px Poppins,system-ui,sans-serif;color:#ffd65a;
    background:rgba(18,9,16,.9);border:1px solid rgba(255,214,140,.2);border-radius:999px;padding:6px 0;opacity:0;transition:all .5s ease}
  #music.show-label .label{max-width:230px;padding:6px 13px;opacity:1}
  #music .bars{display:inline-flex;gap:2px;align-items:flex-end;height:10px;margin-right:6px;vertical-align:-1px}
  #music .bars i{width:2px;background:#ffd65a;height:3px}
  #music.on .bars i{animation:eq .8s ease-in-out infinite}
  #music.on .bars i:nth-child(2){animation-delay:.2s}#music.on .bars i:nth-child(3){animation-delay:.4s}
  @keyframes discSpin{to{transform:rotate(360deg)}}
  @keyframes eq{50%{height:10px}}`;
  document.head.appendChild(style);

  const holder = document.createElement('div'); holder.id = 'ytHolder';
  holder.innerHTML = '<div id="ytPlayer"></div>';
  const box = document.createElement('div'); box.id = 'music';
  box.innerHTML = `<span class="label"><span class="bars"><i></i><i></i><i></i></span><span class="txt">tap for music 🎵</span></span>
    <button class="disc" aria-label="play or pause music">🪔</button>`;
  document.body.append(holder, box);
  const txt = box.querySelector('.txt');

  let player = null, ready = false, want = false, playing = false, labelTimer;
  function flashLabel(text, ms){
    txt.textContent = text; box.classList.add('show-label');
    clearTimeout(labelTimer);
    if (ms) labelTimer = setTimeout(() => box.classList.remove('show-label'), ms);
  }
  function start(){
    const at = parseFloat(store.get('songAt')) || 0;
    player.setVolume(65);
    if (at > 1) player.seekTo(at, true);
    player.playVideo();
  }

  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('ytPlayer', {
      width: 1, height: 1, videoId: VIDEO,
      playerVars: {playsinline: 1, controls: 0, loop: 1, playlist: VIDEO, rel: 0, modestbranding: 1},
      events: {
        onReady: () => { ready = true; if (want) start(); },
        onStateChange: e => {
          const was = playing;
          playing = e.data === YT.PlayerState.PLAYING;
          box.classList.toggle('on', playing);
          if (playing && !was) flashLabel('now playing: ' + TITLE, 4500);
        },
        onError: () => box.remove()
      }
    });
  };
  const api = document.createElement('script');
  api.src = 'https://www.youtube.com/iframe_api';
  api.onerror = () => box.remove();
  document.head.appendChild(api);

  // called by the page from a tap (the gate button, the envelope)
  window.playSong = () => {
    if (store.get('songOff') === '1') return; // she turned it off, respect that
    want = true;
    if (ready) start();
  };

  box.querySelector('.disc').addEventListener('click', () => {
    if (playing){ player.pauseVideo(); store.set('songOff', '1'); flashLabel('paused', 1800); }
    else { store.set('songOff', '0'); want = true; if (ready) start(); else flashLabel('loading the song…', 2500); }
  });

  // remember where the song is, so the next page can continue from there
  const save = () => { if (ready && playing) store.set('songAt', player.getCurrentTime()); };
  setInterval(save, 1500);
  addEventListener('pagehide', save);
})();
