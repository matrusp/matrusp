var hexDigits = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];

function rgb2hex(rgb) {
  rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

function hex(x) {
  return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
}

function get_image(callback) {
  var combinations = document.getElementById("combination-controller");
  combinations.style.display = "none";
  html2canvas(document.getElementById("lecture-schedule"), {
    onrendered: function (canvas) {
      combinations.style.removeProperty("display");
      dd.images.calendar = canvas.toDataURL("image/png");
      callback();
    },
    background: '#ffffff'
  });
}

function get_subtitle(callback) {
  var active_classes = state.plans[state.activePlanIndex].combinations[state.plans[state.activePlanIndex].activeCombinationIndex].lecturesClassroom;
  for (var i = 0; i < active_classes.length; i++) {
    var professors = "";
    var lecture_color = rgb2hex(window.getComputedStyle(state.plans[state.activePlanIndex].combinations[state.plans[state.activePlanIndex].activeCombinationIndex].lecturesClassroom[i].parent.htmlElement, null).backgroundColor);
    for (var j = 0; j < active_classes[i].teachers.length; j++) {
      for (var k = 0; k < active_classes[i].teachers[j].length; k++) {
        professors = professors + active_classes[i].teachers[j][k] + "\n";
      }
    }
    var array_of_objects = [
      {
        text: active_classes[i].parent.code,
        color: '#000000',
        fillColor: lecture_color
      },
      {
        text: active_classes[i].classroomCode,
        color: '#000000',
        fillColor: lecture_color
      },
      {
        text: active_classes[i].parent.name,
        color: '#000000',
        fillColor: lecture_color
      },
      {
        text: professors,
        color: '#000000',
        fillColor: lecture_color
      }
    ];
    dd.content[1].table.body.push(array_of_objects);
  }
  callback();
}

var dd = {
  content: [
    {
      image: 'calendar',
      width: 480,
      height: 480
    },
    {
      style: 'section',
      table: {
        widths: [ '12%',  '7%',  '*',  '35%'],
        body: [
          [
            {
              text: 'Código',
              color: '#000000',
              fillColor: '#FFFFFF'
            },
            {
              text: 'Turma',
              color: '#000000',
              fillColor: '#FFFFFF'
            },
            {
              text: 'Nome',
              color: '#000000',
              fillColor: '#FFFFFF'
            },
            {
              text: 'Professor',
              color: '#000000',
              fillColor: '#FFFFFF'
            }
          ]
        ]
      }
    }
  ],
  images: {
    calendar: ''
  },
  defaultStyle: {
    alignment: 'center'
  }
};

function open_pdf() {
  dd.content[1].table.body.splice(1, dd.content[1].table.body.length-1);
  get_image(function () {
    get_subtitle(function () {
      pdfMake.createPdf(dd).open();
    });
  });
}

document.getElementById('pdf').addEventListener('click',  open_pdf);