import {Howl, Howler} from 'howler';
import BubbleChart from './chart.js';

const MAIN_VOLUME = 0.05;
const INITIAL_VOLUME = 0.5;

const MIN_VOLUME = 0.05;
const MAX_VOLUME = 0.1;

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var mainVolume = audioCtx.createGain();
mainVolume.gain.value = MAIN_VOLUME;
mainVolume.connect(audioCtx.destination);

function log10(x) {
  return Math.log(x)/Math.LN10;
}

function value2decibel(x) {
  return 20 * log10( x );
}

function decibel2value(x) {
  return Math.pow(10, (x / 20));
}

Howler.volume(MAIN_VOLUME);

class FrequencyNode {
  constructor(frequency) {
    this.frequency = frequency;
    this.volume = audioCtx.createGain();
    this.volume.connect(mainVolume);
    this.panNode = audioCtx.createStereoPanner();
    this.panNode.connect(this.volume);

    this.oscillator = audioCtx.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    this.oscillator.connect(this.panNode);

    this.isPlaying = false;
  }

  play(volume, ear) {
    if (!this.isPlaying) {
      this.oscillator.start();
      this.isPlaying = true;
    }

    this.panNode.pan.value = ear === 'left' ? -1: 1;
    this.volume.gain.value = volume;
  }

  stop() {
    this.volume.gain.value = 0;
  }
}

function randomInArray(array) {
  return array[Math.floor(Math.random()*array.length)];
}

const soundsDef = [

  {type: 'frequency', frequency: 250, id: 250, node: new FrequencyNode(250)},
  {type: 'frequency', frequency: 500, id: 500, node: new FrequencyNode(500)},
  {type: 'frequency', frequency: 1000, id: 1000, node: new FrequencyNode(1000)},
  {type: 'frequency', frequency: 2000, id: 2000, node: new FrequencyNode(2000)},
  {type: 'frequency', frequency: 4000, id: 4000, node: new FrequencyNode(4000)},
  {type: 'frequency', frequency: 6000, id: 6000, node: new FrequencyNode(6000)},
  {type: 'frequency', frequency: 8000, id: 8000, node: new FrequencyNode(8000)},
  {type: 'frequency', frequency: 10000, id: 10000, node: new FrequencyNode(1000)},

  {type: 'sound', frequency: 0, id: 'cat', buffer: new Howl({ src: ['../assets/samples/110011__tuberatanka__cat-meow.wav'], loop: true })},
  {type: 'sound', frequency: 0, id: 'claxon', buffer: new Howl({ src: ['../assets/samples/185730__enric592__claxon.wav'], loop: true })},
  {type: 'sound', frequency: 0, id: 'pianomelody', buffer: new Howl({ src: ['../assets/samples/186942__lemoncreme__piano-melody.wav'], loop: true })},
  {type: 'sound', frequency: 0, id: 'dog', buffer: new Howl({ src: ['../assets/samples/327666__juan-merie-venter__dog-bark.wav'], loop: true })},
  {type: 'sound', frequency: 0, id: 'blackbird', buffer: new Howl({ src: ['../assets/samples/34074__dobroide__20070415-funny-blackbird.wav'], loop: true })},
  {type: 'sound', frequency: 0, id: 'nightingale', buffer: new Howl({ src: ['../assets/samples/34112__dobroide__20070418-nightingale.wav'], loop: true })},
  {type: 'sound', frequency: 0, id: 'alarm', buffer: new Howl({ src: ['../assets/samples/34159__dobroide__20070424-alarm-coot-01.wav'], loop: true })},
  {type: 'sound', frequency: 0, id: 'rooster', buffer: new Howl({ src: ['../assets/samples/439472__inspectorj__rooster-calling-close-a.wav'], loop: true })},
  {type: 'sound', frequency: 0, id: 'pianjingle', buffer: new Howl({ src: ['../assets/samples/460261__ddmyzik__piano-jingle.wav'], loop: true })},
  {type: 'sound', frequency: 0, id: 'cow', buffer: new Howl({ src: ['../assets/samples/58277__benboncan__cow.wav'], loop: true })},
  {type: 'sound', frequency: 0, id: 'bear', buffer: new Howl({ src: ['../assets/samples/70333__mrbubble110__bear-roar.wav'], loop: true })}

];

const labels = soundsDef.map(d => d.id || d.frequency);

var app = new Vue({
  components: {
    BubbleChart
  },
  computed: {
    progress: function () {
      return parseInt(this.results.reduce((a, c) => a + (c.left.finished ? 1 : 0) + (c.right.finished ? 1 : 0), 0) / (this.results.length * 2)*100);
    }
  },
  el: '#app',
  data: {
    steps: 0,
    finished: false,
    leftValues: new Array(soundsDef.length).fill(0),
    rightValues: new Array(soundsDef.length).fill(0),
    results: [],
    currentEar: 'left',
    currentTest: {},
    currentVolume: 0,
    currentPanning: 0,
    datacollection: {},
    optionsChart: {
      responsive: true,
      title: {
        display: true,
        text: 'Frequencies audiogram'
      },
      legend: {
        display: false
      },
      elements: {
        point: {
          pointStyle: 'crossRot'
        }
      },
      scales: {
        yAxes : [{
            ticks : {
              max : 100,
              min : -10,
              reverse: true
            }
        }]
      },
      annotation: {
        drawTime: "afterDraw",
        events: ['dblclick'],
        annotations: [{
          type: 'box',
          mode: 'horizontal',
          xScaleID: 'x-axis-0',
          yScaleID: 'y-axis-0',
          yMin: -10,
          yMax: 20,
          backgroundColor: 'rgba(255, 0, 0, 0.3)',
          //borderColor: 'rgb(255, 0, 0)',
          borderWidth: 1
        },
        {
          type: 'box',
          mode: 'horizontal',
          xScaleID: 'x-axis-0',
          yScaleID: 'y-axis-0',
          yMin: 20,
          yMax: 40,
          backgroundColor: 'rgba(0, 255, 0, 0.3)',
          //borderColor: 'rgb(255, 0, 0)',
          borderWidth: 1
        },
        {
          type: 'box',
          mode: 'horizontal',
          xScaleID: 'x-axis-0',
          yScaleID: 'y-axis-0',
          yMin: 40,
          yMax: 70,
          backgroundColor: 'rgba(0, 0, 255, 0.3)',
          //borderColor: 'rgb(255, 0, 0)',
          borderWidth: 1
        },
        {
          type: 'box',
          mode: 'horizontal',
          xScaleID: 'x-axis-0',
          yScaleID: 'y-axis-0',
          yMin: 70,
          yMax: 90,
          backgroundColor: 'rgba(0, 255, 255, 0.3)',
          //borderColor: 'rgb(255, 0, 0)',
          borderWidth: 1
        },
        {
          type: 'box',
          mode: 'horizontal',
          xScaleID: 'x-axis-0',
          yScaleID: 'y-axis-0',
          yMin: 90,
          yMax: 120,
          backgroundColor: 'rgba(255, 0, 255, 0.3)',
          //borderColor: 'rgb(255, 0, 0)',
          borderWidth: 1
        }
        ]
      }
    }
  },
  methods: {
    init: function () {
      this.initialized = true;
      window.addEventListener('keydown', evt => {
        // right
        if (evt.which === 39) {
          this.canHear();
        } else if (evt.which === 37) {
          this.cannotHear();
        }
      });
      soundsDef.forEach(definition => {
        this.results.push({
          definition: definition,
          finished: false,
          left: {
            volume: {
              min: 0,
              max: MAX_VOLUME,
              current: INITIAL_VOLUME
            },
            finished: false
          },
          right: {
            volume: {
              min: 0,
              max: MAX_VOLUME,
              current: INITIAL_VOLUME
            },
            finished: false
          }
        });
      });

      this.nextTest();
    },
    nextTest: function() {
      let results = this.results.filter(e => !e.finished);
      let test = randomInArray(results);

      if (!test) {
        console.log('FINISHED');
        this.finished = true;
        this.output();
        return;
      }

      this.steps++;

      var ear;
      if (!test.left.finished && !test.right.finished) {
        ear = Math.random() > 0.5 ? 'left' : 'right';
      } else {
        if (test.left.finished) ear = 'right';
        if (test.right.finished) ear = 'left';
      }

      this.currentTest = {
        test: test,
        ear: ear,
        soundRef: null,
        earTest: test[ear]
      }

      this.playNextSound();
    },
    playNextSound: function () {
      this.computeMinMax();
      let earTest = this.currentTest.earTest;

      let dataset = this.currentTest.ear === 'left' ? this.leftValues : this.rightValues;

      var indexSound = labels.findIndex(d => d === this.currentTest.test.definition.id);
      dataset[indexSound] = earTest.volume.current;

      this.updateDataCollection();

      if (earTest.volume.max - earTest.volume.min <= 0.02) {
        earTest.finished = true;
        this.currentTest.test.finished = this.currentTest.test.left.finished && this.currentTest.test.right.finished;
        this.nextTest();
        return;
      }

      if (this.currentTest.test.definition.type === "frequency") {
        this.currentTest.test.definition.node.play(this.currentTest.earTest.volume.current, this.currentTest.ear);
      } else {
        let sound = this.currentTest.test.definition.buffer;
        let soundRef = sound.play();
        this.currentTest.soundRef = soundRef;

        sound.volume(this.currentTest.earTest.volume.current, soundRef);
        sound.pos(this.currentTest.ear === 'right' ? 5 : -5, 0, 0, soundRef);
      }

      this.currentVolume = parseInt(this.currentTest.earTest.volume.current * 100);
      console.log(this.currentVolume, value2decibel(this.currentVolume));
      this.currentPanning = this.currentTest.ear === 'right' ? 1 : -1;
    },
    output: function () {
      let output = {};
      soundsDef.forEach((d, i) => {
        output[d.id] = [
          this.leftValues[i], this.rightValues[i]
        ]
      });
      console.log(output);
    },
    stopCurrentSound: function () {
      if (this.currentTest.test.definition.type === "frequency") {
        this.currentTest.test.definition.node.stop();
      } else {
        let sound = this.currentTest.test.definition.buffer;
        let soundRef = this.currentTest.soundRef;
        sound.stop(soundRef);
      }
    },
    computeMinMax: function () {
      let volume = this.currentTest.earTest.volume;
      console.log(volume.min, volume.current, volume.max);
      volume.current = volume.min + (volume.max - volume.min) / 2;
      if (volume.current > 1) {
        volume.current = 1;
      }
      if (volume.current < 0.01) {
        volume.current = 0.01;
      }
    },
    cannotHear: function() {
      this.stopCurrentSound();
      this.currentTest.earTest.volume.min = this.currentTest.earTest.volume.current;
      this.nextTest();
      //this.playNextSound();
    },
    canHear: function() {
      this.stopCurrentSound();
      this.currentTest.earTest.volume.max = this.currentTest.earTest.volume.current;
      this.nextTest();
      //this.playNextSound();
    },
    parseJSON: function(json) {
      //let json = JSON.parse(string);

      Object.keys(json).forEach(k => {
        var indexSound = labels.findIndex(d => d == k);
        if (indexSound !== -1) {
          this.leftValues[indexSound] = json[k][0];
          this.rightValues[indexSound] = json[k][1];
        }
      });

      this.updateDataCollection();
    },
    updateDataCollection: function() {
      let left = this.leftValues.map(v => value2decibel(v*100));
      let right = this.rightValues.map(v => value2decibel(v*100));

      this.datacollection = {
        labels: labels,
        datasets: [
          {
            label: 'Left',
            pointStyle: 'crossRot',
            //backgroundColor: '#ff0000',
            pointRadius: 5,
            borderColor: '#0000ff',
            fill: false,
            data: left
          }, {
            label: 'Right',
            //backgroundColor: '#0000ff',
            borderColor: '#ff0000',
            pointStyle: 'circle',
            fill: false,
            pointRadius: 5,
            data: right
          }
        ]
      };
    }
  }
});

window.app = app;