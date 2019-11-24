import {Howl, Howler} from 'howler';
import BubbleChart from './chart.js';

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function randomInArray(array) {
  return array[Math.floor(Math.random()*array.length)];
}

var sounds = {
  dog: new Howl({ src: ['../assets/samples/327666__juan-merie-venter__dog-bark.wav'] }),
  cow: new Howl({ src: ['../assets/samples/58277__benboncan__cow.wav'] })
}

const frequencies = [
  250,
  500,
  1000,
  2000,
  4000,
  6000,
  8000,
  10000
];

function getRandomInt() {
  return parseInt(Math.random() * 10);
}

Howler.volume(0.1);

var app = new Vue({
  components: {
    BubbleChart
  },
  el: '#app',
  data: {
    finished: false,
    //leftValues: new Array(Object.keys(sounds).length).fill(0),
    //rightValues: new Array(Object.keys(sounds).length).fill(0),
    leftValues: new Array(frequencies.length).fill(0),
    rightValues: new Array(frequencies.length).fill(0),
    results: [],
    currentEar: 'left',
    currentTest: {},
    currentVolume: 0,
    currentPanning: 0,
    datacollection: {},
    options: {
      responsive: true,
      title: {
        display: true,
        text: 'Audiogram'
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
// create Oscillator node
var oscillator = audioCtx.createOscillator();

oscillator.type = 'sine';

oscillator.frequency.setValueAtTime(250, audioCtx.currentTime); // value in hertz
oscillator.connect(audioCtx.destination);
oscillator.start();

Object.keys(frequencies).forEach(id => {
  this.results.push({
    id: id,
    finished: false,
    left: {
      volume: {
        min: 0,
        max: 1,
        current: 0.5,
        prevCorrect: null
      },
      finished: false
    },
    right: {
      volume: {
        min: 0,
        max: 1,
        current: 0.5,
        prevCorrect: null
      },
      finished: false
    }
  });
});

  return;

      Object.keys(sounds).forEach(id => {
        let sound = sounds[id];
        this.results.push({
          id: id,
          finished: false,
          left: {
            volume: {
              min: 0,
              max: 1,
              current: 0.5,
              prevCorrect: null
            },
            finished: false
          },
          right: {
            volume: {
              min: 0,
              max: 1,
              current: 0.5,
              prevCorrect: null
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
        labels: Object.keys(sounds),
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
      var indexSound = Object.keys(sounds).indexOf(this.currentTest.test.id);
      dataset[indexSound] = earTest.volume.current;

      if (earTest.volume.max - earTest.volume.min <= 0.02) {
        earTest.finished = true;
        this.currentTest.test.finished = this.currentTest.test.left.finished && this.currentTest.test.right.finished;
        this.nextTest();
        return;
      }

      let sound = sounds[this.currentTest.test.id];
      let soundRef = sound.play();
      this.currentTest.soundRef = soundRef;

      this.currentVolume = parseInt(this.currentTest.earTest.volume.current * 100);
      this.currentPanning = this.currentTest.ear === 'right' ? 1 : -1;

      sound.volume(this.currentTest.earTest.volume.current, soundRef);
      sound.pos(this.currentTest.ear === 'right' ? 5 : -5, 0, 0, soundRef);
    },
    stopCurrentSound: function () {
      let sound = sounds[this.currentTest.test.id];
      let soundRef = this.currentTest.soundRef;
      sound.stop(soundRef);
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