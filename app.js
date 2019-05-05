// Instruments
const kickDrum = new Tone.Player('./sounds/Kick.ogg').toMaster();
const closedHat = new Tone.Player('./sounds/ClosedHat.ogg').toMaster();
const snare = new Tone.Player('./sounds/Snare.ogg').toMaster();
const clap = new Tone.Player('./sounds/Clap.ogg').toMaster();

// Effects
let reverb = new Tone.Reverb(4).toMaster();
reverb.generate();
let chorus = new Tone.Chorus(2, 3.5, 0.5).toMaster();
let tremolo = new Tone.Tremolo(5, 0,75).toMaster().start();

const effects = {
  chorus,
  tremolo,
  reverb
};

// keyboard -> piano key
const keys = {
  a: 'C3',
  w: 'C#3',
  s: 'D3',
  e: 'D#3',
  d: 'E3',
  f: 'F3',
  t: 'F#3',
  g: 'G3',
  y: 'G#3',
  h: 'A3',
  u: 'A#3',
  j: 'B3',
  k: 'C4',
  o: 'C#4',
  l: 'D4',
  p: 'D#4'
};

// Start playing on click
document.querySelector('#allowAudio').addEventListener('click', () => {
  if (Tone.context.state !== 'running'){
    Tone.context.resume();
  }
  document.body.classList.remove('noscroll');
  let prompt = document.querySelector('.prompt_wrapper');
  prompt.classList.add('hidden');
});

// Transport BPM
Tone.Transport.bpm.value = 128;

let bpmInput = document.querySelector('#bpm');
bpmInput.addEventListener('change', (event) => {
  console.log(event.target.value);
  Tone.Transport.bpm.value = event.target.value;
});

// Sequence output gain
let sequenceGain = new Tone.Gain(0.6).toMaster();

// Main synthesizer
class Synthesizer {
  constructor({ chorus, tremolo, reverb }) {
    this.synth = null;
    this.wavetype = 'sine';
    this.gain = new Tone.Gain(0.7);
    this.gain.toMaster();
    this.chorus = chorus;
    this.tremolo = tremolo;
    this.reverb = reverb;
  }

  play(note) {
    this.synth.triggerAttack(note);
    this.synth.triggerRelease("+0.5");
    shapeNoiseAnimation.restart();
    shapeAnimation.restart();
    waveAnimation.restart();
  }

  updateSynthType(synthType) {
    // if synth is already defined
    if (this.synth) {
      this.synth.disconnect(this.gain);
      this.synth.dispose();
    }
    // new synth
    let settings = this.defaultSettings[synthType] || {};
    let newSynth = new Tone[synthType](settings);
    this.synth = newSynth;
    this.synth.oscillator.type = this.wavetype;
    this.synth.fan(this.reverb, this.chorus, this.tremolo, this.gain, FFT);
  }

  updateOscillatorType(oscType) {
    this.wavetype = oscType;
    this.synth.oscillator.type = oscType;
  }

  updateGain(value) {
    this.synth.disconnect(this.gain);
    this.gain.dispose();
    this.gain = new Tone.Gain(value);
    this.gain.toMaster();
    this.synth.fan(this.reverb, this.chorus, this.tremolo, this.gain);
  }

  playFromKey(charCode) {
    let character = String.fromCharCode(charCode).toLowerCase();
    if (!(character in keys)) return;
    this.play(keys[character]);
  }

  effectChange(effect) {
    switch (effect.id) {
      case 'reverb_decay':
        let newReverb = new Tone.Reverb(effect.value).toMaster();
        newReverb.generate().then(() => {
          this.reverb.dispose();
          this.reverb = newReverb;
          this.synth.connect(this.reverb);            
        });
        break;
      case 'tremolo_frequency':
        let newTremolo = new Tone.Tremolo(effect.value, 0.75).toMaster().start();
        this.tremolo.dispose();
        this.tremolo = newTremolo;
        this.synth.connect(this.tremolo);
        break;
      case 'chorus_frequency':
        let newChorus = new Tone.Chorus(effect.value, 4, 0.9).toMaster();
        this.chorus.dispose();
        this.chorus = newChorus;
        this.synth.connect(this.chorus);
        break;
      default:
        console.log('none');
        break;
    }
  }

  get defaultSettings() {
    return {
      Synth: {
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.005,
          decay: 0.1,
          sustain: 0.3,
          release: 1
        }
      },
      FMSynth: {
        harmonicity: 3,
        modulationIndex: 10,
        detune: 0,
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.01,
          decay: 0.01,
          sustain: 1,
          release: 0.5
        },
        modulation: {
          type: 'square'
        },
        modulationEnvelope: {
          attack: 0.5,
          decay: 0,
          sustain: 1,
          release: 0.5
        }
      },
      AMSynth: {
        harmonicity: 3,
        detune: 0,
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.01,
          decay: 0.01,
          sustain: 1,
          release: 0.5
        },
        modulation: {
         type: 'square'
        },
        modulationEnvelope: {
          attack: 0.5,
          decay: 0,
          sustain: 1,
          release: 0.5
        }
      },
      MembraneSynth: {
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.005,
          decay: 0.4,
          sustain: 0.01,
          release: 1.4,
          attackCurve: 'exponential'
        }
      }        
    }
  }
}

// init new Synth
let mainSynth = new Synthesizer(effects);
mainSynth.updateSynthType('Synth');

const synthTypes = document.querySelectorAll('.synth_type');
synthTypes.forEach(synth => {
  synth.addEventListener('change', () => {
    mainSynth.updateSynthType(synth.value);
  });
});

const oscillatorTypes = document.querySelectorAll('.oscillator_type');
oscillatorTypes.forEach(oscillator => {
  oscillator.addEventListener('change', () => {
    mainSynth.updateOscillatorType(oscillator.value);
  });
});

const synthGain = document.querySelector('#synth_gain');
synthGain.addEventListener('change', (e) => {
  mainSynth.updateGain(e.target.value);
});

// Drum event listeners & init
const drumSquares = document.querySelectorAll('.square');

drumSquares.forEach((drum) => {
  drum.addEventListener('click', () => {
    drum.classList.toggle('active');
  })
});

const drums = [
  kickDrum,
  closedHat,
  snare,
  clap
];

const clearButton = document.querySelector('#clear');
clearButton.addEventListener('click', () => {
  drumSquares.forEach(drum => {
    drum.classList.remove('active');
  });
});

// Settings
drums.forEach(drum => drum.connect(sequenceGain);

Tone.Transport.scheduleRepeat(drumSequence, '8n');

const playSequenceButton = document.querySelector('#play_sequence');
playSequenceButton.addEventListener('click', (e) => {
  if (Tone.Transport.state == 'stopped' || Tone.Transport.state === 'paused') {
    e.target.classList.add('stop');
    e.target.innerHTML = 'Stop';
    Tone.Transport.start();
  } else {
    e.target.classList.remove('stop');
    e.target.innerHTML = 'Play';
    Tone.Transport.pause();
  }
});

// variables for sequence playing
const rows = document.body.querySelectorAll('.pads > .drum');
let sequenceIndex = 0;

function drumSequence(time) {
  let step = sequenceIndex % 16;
  for (let i = 0; i < rows.length; i++) {
    console.log(step);
    let drum = drums[i];
    let row = rows[i];
    let beat = row.querySelector(`.square:nth-child(${step + 1})`);

    if (beat.classList.contains('active')) {
      drum.start();
      let drumType = beat.parentElement.classList[0];
      switch(drumType) {
        case 'kick':
          kickAnimation.restart()
          break;
        case 'closed_hat':
          hihatAnimation.restart()
          break;
        case 'snare':
          snareAnimation.restart()
          break;
        case 'clap':
          clapAnimation.restart()
          break;
      }
    }
  }
  sequenceIndex++;
}

const sequenceGainRange = document.querySelector('#sequncer_gain');
sequenceGainRange.addEventListener('change', (e) => {
  sequenceGain.dispose();
  sequenceGain = new Tone.Gain(e.target.value);
  sequenceGain.toMaster();
  drums.forEach(drum => drum.connect(sequenceGain));
});

// Modular synth
document.addEventListener('keydown', (event) => {
  mainSynth.playFromKey(event.which);
});

let tremoloFrequency = document.querySelector('#tremolo_frequency');
tremoloFrequency.addEventListener('change', (event) => {
  mainSynth.effectChange(event.target);
});

let reverbDecay = document.querySelector('#reverb_decay');
reverbDecay.addEventListener('change', (event) => {
  mainSynth.effectChange(event.target);
});

let chorusFrequency = document.querySelector('#chorus_frequency');
chorusFrequency.addEventListener('change', (event) => {
  mainSynth.effectChange(event.target);
});

let chorusDelay = document.querySelector('#chorus_delay');
chorusDelay.addEventListener('change', (event) => {
  mainSynth.effectChange(event.target);
});

let chorusDepth = document.querySelector('#chorus_depth');
chorusDepth.addEventListener('change', (event) => {
  mainSynth.effectChange(event.target);
});


// ANIMATION
window.onload = () => {
  setTimeout(() => {
    let loader = document.querySelector('.loader_wrapper');
    loader.classList.remove('active');
  }, 1500);
}

let circle1 = anime({
  targets: '.circle_1',
  scale: 1.5,
	direction: 'alternate',
  loop: true,
  elasticity: 400,
	easing: 'easeInOutQuad',
	duration: 600,
	delay: 100
})

let circle2 = anime({
  targets: '.circle_2',
  scale: 2,
	direction: 'alternate',
  loop: true,
  elasticity: 400,
	easing: 'easeInOutQuad',
	duration: 600,
	delay: 200
})

let circle3 = anime({
  targets: '.circle_3',
  scale: 3,
	direction: 'alternate',
  loop: true,
  elasticity: 400,
	easing: 'easeInOutQuad',
	duration: 600,
	delay: 300
})

let circle4 = anime({
  targets: '.circle_4',
  scale: 4,
	direction: 'alternate',
  loop: true,
  elasticity: 400,
	easing: 'easeInOutQuad',
	duration: 600,
	delay: 400
})

let kickAnimation = anime({
  targets: 'svg .kick_circle',
  autoplay: false,
  direction: 'alternate',
  fill: '#FAD02C',
  easing: 'easeInOutSine',
  duration: 500,
})

let hihatAnimation = anime({
  targets: 'svg .hihat_circle',
  autoplay: false,
  direction: 'alternate',
  fill: '#FFF5D6',
  easing: 'easeInOutSine',
  duration: 400,
})

let snareAnimation = anime({
  targets: 'svg .snare_circle',
  autoplay: false,
  direction: 'alternate',
  fill: '#D1370A',
  easing: 'easeInOutSine',
  duration: 400,
})

let clapAnimation = anime({
  targets: 'svg .clap_circle',
  autoplay: false,
  direction: 'alternate',
  fill: '#4A00FF',
  easing: 'easeInOutSine',
  duration: 400,
})

let shapeNoiseAnimation = anime({
  targets: ['feTurbulence', 'feDisplacementMap'],
  autoplay: false,
  baseFrequency: 0.15,
  easing: 'easeInOutSine',
  duration: 300,
})

let shapeAnimation = anime({
  targets: 'svg .shape',
  autoplay: false,
  scale: 0.85,
  easing: 'easeInOutSine',
  duration: 400,
})

let waveAnimation = anime({
  targets: '#waveline',
  autoplay: false,
  duration: 700,
  easing: 'easeInOutSine',
  direction: 'alternate'
})
