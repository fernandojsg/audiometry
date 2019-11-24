import {Howl, Howler} from 'howler';
import BubbleChart from './chart.js';

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var oscillator;


class FrequencyNode {
  constructor(frequency) {
    this.frequency = frequency;
    this.volume = audioCtx.createGain();
    this.volume.connect(audioCtx.destination);
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

    this.panNode.pan.setValueAtTime(ear === 'left' ? -1: 1, audioCtx.currentTime);
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
  //{type: 'sound', frequency: 0, id: 'dog', buffer: new Howl({ src: ['../assets/samples/327666__juan-merie-venter__dog-bark.wav'] })},
  //{type: 'sound', frequency: 0, id: 'cow', buffer: new Howl({ src: ['../assets/samples/58277__benboncan__cow.wav'] })}
];

const labels = soundsDef.map(d => d.id || d.frequency);

Howler.volume(0.1);

var app = new Vue({
  components: {
    BubbleChart
  },
  el: '#app',
  data: {
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
                max : 1,
                min : 0
            }
        }]
      }
    }
  },
  methods: {
    init: function () {
      soundsDef.forEach(definition => {
        this.results.push({
          definition: definition,
          finished: false,
          left: {
            volume: {
              min: 0,
              max: 1,
              current: 0.5
            },
            finished: false
          },
          right: {
            volume: {
              min: 0,
              max: 1,
              current: 0.5
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
        return;
      }

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

      this.datacollection = {
        labels: labels,
        datasets: [
          {
            label: 'Left',
            pointStyle: 'circle',
            //backgroundColor: '#ff0000',
            pointRadius: 5,
            borderColor: '#ff0000',
            fill: false,
            data: this.leftValues
          }, {
            label: 'Right',
            //backgroundColor: '#0000ff',
            borderColor: '#0000ff',
            pointStyle: 'crossRot',
            fill: false,
            pointRadius: 5,
            data: this.rightValues
          }
        ]
      };

      let dataset = this.currentTest.ear === 'left' ? this.leftValues : this.rightValues;
      //var indexSound = labels.findIndex(d => d.frequency === indexOf(this.currentTest.test.id);
      //dataset[indexSound] = earTest.volume.current;

      if (earTest.volume.max - earTest.volume.min <= 0.02) {
        earTest.finished = true;
        this.currentTest.test.finished = this.currentTest.test.left.finished && this.currentTest.test.right.finished;
        this.nextTest();
        return;
      }

      if (this.currentTest.test.definition.type === "frequency") {
        this.currentTest.test.definition.node.play(this.currentTest.earTest.volume.current, this.currentTest.ear);
      } else {
        let soundRef = sound.play();
        this.currentTest.soundRef = soundRef;

        sound.volume(this.currentTest.earTest.volume.current, soundRef);
        sound.pos(this.currentTest.ear === 'right' ? 5 : -5, 0, 0, soundRef);
      }

      this.currentVolume = parseInt(this.currentTest.earTest.volume.current * 100);
      this.currentPanning = this.currentTest.ear === 'right' ? 1 : -1;
    },
    stopCurrentSound: function () {
      if (this.currentTest.test.definition.type === "frequency") {
        this.currentTest.test.definition.node.stop();
      } else {
        let sound = sounds[this.currentTest.test.id];
        let soundRef = this.currentTest.soundRef;
        sound.stop(soundRef);
      }
    },
    computeMinMax: function () {
      let earTest = this.currentTest.earTest;
      earTest.volume.current = earTest.volume.min + (earTest.volume.max - earTest.volume.min) / 2;
      if (earTest.volume.current > 1) {
        earTest.volume.current = 1;
      }
      if (earTest.volume.current < 0.01) {
        earTest.volume.current = 0.01;
      }
    },
    cannotHear: function() {
      this.stopCurrentSound();
      this.currentTest.earTest.volume.min = this.currentTest.earTest.volume.current;
      this.playNextSound();
    },
    canHear: function() {
      this.stopCurrentSound();
      this.currentTest.earTest.volume.max = this.currentTest.earTest.volume.current;
      this.playNextSound();
    },
    play: function() {
      let id = sound.play();
      //sound.volume(0.005, id);
      sound.volume(1, id);
      sound.pos(0,0,0, id);

      /*
        this._rain = this.sound.play('rain');
        this.sound.volume(0.2, this._rain);
        // Change the position and rate.
        this.sound.pos(x, y, -0.5, id);
        this.sound.rate(rate, id);
        this.sound.volume(1, id);
      */
    }
  }
})