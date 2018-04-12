document.getElementById('pdf').addEventListener('click',  openpdf);

function canvasShiftImage(oldCanvas, shiftAmt, realPdfPageHeight){
  shiftAmt = parseInt(shiftAmt) || 0;
  if(shiftAmt <= 0){ return oldCanvas; }

  var newCanvas = document.createElement('canvas');
  newCanvas.height = Math.min(oldCanvas.height - shiftAmt, realPdfPageHeight);
  newCanvas.width = oldCanvas.width;
  var ctx = newCanvas.getContext('2d');

  var img = new Image();
  img.src = oldCanvas.toDataURL();
  ctx.drawImage(imgPreload,0,shiftAmt,imgPreload.width,imgPreload.height-shiftAmt,0,0,imgPreload.width,imgPreload.height-shiftAmt);

  return newCanvas;
}

var html2canvasSuccess = function(canvas, callback){
  var pdf = new jsPDF('p','px'),
    pdfInternals = pdf.internal,
    pdfPageSize = pdfInternals.pageSize,
    pdfScaleFactor = pdfInternals.scaleFactor,
    pdfPageWidth = pdfPageSize.width,
    pdfPageHeight = pdfPageSize.height,
    totalPdfHeight = 0,
    htmlPageHeight = canvas.height,
    htmlScaleFactor = canvas.width / (pdfPageWidth * pdfScaleFactor);

  while(totalPdfHeight < htmlPageHeight){
    var newCanvas = canvasShiftImage(canvas, totalPdfHeight, pdfPageHeight * pdfScaleFactor);
    pdf.addImage(newCanvas, 'png', 50, 15, pdfPageWidth-100, pdfPageWidth-100, null, 'NONE'); //note the format doesn't seem to do anything... I had it at 'pdf' and it didn't care

    totalPdfHeight += (pdfPageHeight * pdfScaleFactor * htmlScaleFactor);

    if(totalPdfHeight < htmlPageHeight){ pdf.addPage(); }
  }
  callback(pdf);
};

function generateTable(doc) {
  doc.autoTable(getColumns(), getData(), {
    styles: {
      overflow: 'linebreak',
      font: 'courier',
      fillStyle: 'DF',
      lineColor: [44, 62, 80],
      lineWidth: 2,
      halign: 'center', // left, center, right
      valign: 'middle' // top, middle, bottom
    },
    headerStyles: {
      fillColor: [44, 62, 80],
      fontSize: 15,
      rowHeight: 30
    },
    bodyStyles: {
      fillColor: [52, 73, 94],
      textColor: 0
    },
    columnStyles: {
      email: {
        fontStyle: 'bold'
      }
    },
    startY: 330,
    drawCell: function (cell, data) {
      var color = (data.row.raw.color).split(", ");
      data.doc.setFillColor(parseInt(color[0]), parseInt(color[1]), parseInt(color[2]));
    }
  });
  doc.save("table.pdf");
}

var getColumns = function () {
  return [
    {title: "Código", dataKey: "cod"},
    {title: "Turma", dataKey: "tur"},
    {title: "Nome", dataKey: "name"},
    {title: "Professor", dataKey: "prof"}
  ];
};

function getData() {
  var data = [];
  var active_classes = state.plans[state.activePlanIndex].activeCombination.lecturesClassroom;
  for (var i = 0; i < active_classes.length; i++) {
    var color = window.getComputedStyle(state.plans[state.activePlanIndex].combinations[state.plans[state.activePlanIndex].activeCombinationIndex].lecturesClassroom[i].parent.htmlElement, null).backgroundColor.replace(/\(|\)|rgb/g, "");
    var professors = "";
    for (var k = 0; k < active_classes[i].teachers.length; k++) {
      professors = professors + active_classes[i].teachers[k] + "\n";
    }
    data.push({
      cod: active_classes[i].parent.code,
      tur: active_classes[i].shortCode,
      name: active_classes[i].parent.name,
      prof: professors,
      color: color
    });
  }
  return data;
}

function openpdf() {
  if (state.plans[state.activePlanIndex].activeCombination == null) {
    alert("Insira uma ou mais matérias antes de gerar o arquivo pdf");
    return;
  }
  var combinations = document.getElementById("combination-controller");
  combinations.style.visibility = "hidden";
  html2canvas(document.getElementById("lecture-schedule")).then(function(canvas) {
      combinations.style.removeProperty("visibility");
      html2canvasSuccess(canvas, generateTable);
    });
}