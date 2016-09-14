function get_image(callback) {
  html2canvas(document.getElementById("lecture-schedule"), {
    onrendered: function (canvas) {
      dd.images.calendar = canvas.toDataURL("image/png");
      callback();
    },
    background: '#ffffff'
  });
}

var dd = {
  content: [
    {
      image: 'calendar'
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
  get_image(function () {
    pdfMake.createPdf(dd).open();
  });
}

document.getElementById('pdf').addEventListener('click',  open_pdf);