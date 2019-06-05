# Synth Wave JS
This is a tiny web (*modular-like*) synthesizer with drum machine. Drum machine has 4 different sounds which are kick drum, closed hi-hat, clap & snare.
Modularity of synthesizer means it's consisting of separate specialized modules. Main modules are:
* Synth type (*AM, FM, Membrane & regular*)
* Wave shape (*sine, square, triangle & sawtooth*)
* Effects (*Reverb, Chorus & Tremolo*)

The way it works is pretty straightforward: 
__synth type -> wave shape -> effects__.

You can play the synth using the keyboard. Several controls such as _Play/Stop_ button, _BPM_,  _sequencer & synth gains_ are aveilable in the control panel.

# Run application
To run the application you would need to have `npm` installed on your computer. Then go to app directory and type `npm run start` in your console.
The app will start the server running on `:8080` port. Now you're ready to use the application by typing `localhost:8080` in the address bar of your browser.

