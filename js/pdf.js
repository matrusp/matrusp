document.getElementById('print-button').addEventListener('click',  openpdf);

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

function generateTable(doc) {
  doc.autoTable({
    body: [].concat(...state.activePlan.activeCombination.classroomGroups.map(classroomGroup => classroomGroup.map((classroom, i) => ({
      lectureCode: !i? classroom.parent.code : '',
      lectureName: !i? classroom.parent.name : '',
      classroomCode: classroom.shortCode,
      teachers: classroom.teachers.reduce((acc, str) => `${acc}\n${str}`) || 'Sem professor designado',
      color: ui.colors[classroom.parent.color],
      span: !i? classroomGroup.length : undefined
    })))),
    columns: [
      {header:'Código', dataKey: 'lectureCode'},
      {header:'Nome', dataKey: 'lectureName'},
      {header:'Turma', dataKey: 'classroomCode'},
      {header:'Professor', dataKey: 'teachers'},
    ],


    styles: {
      overflow: 'linebreak',
      fillStyle: 'DF',
      halign: 'center',
      valign: 'middle',
      minCellWidth: 0,
    },
    headStyles: {
      fillColor: 255,
      fontStyle: 'normal',
      fontSize: 11,
      textColor: tinycolor('gray').toRgb().r
    },
    bodyStyles: {
      fillColor: [52, 73, 94],
      textColor: 0,
      minCellHeight: 0.5,
    },
    columnStyles: {
      lectureCode: {
        cellWidth: 0.8
      },
      classroomCode: {
        cellWidth: 0.4
      },
      lectureName: {
        cellWidth: 2
      },
      teachers:{
        cellWidth: 2
      }
    },
    startY: 6,

    didParseCell: function(data) {
      if(data.row.section == "body") {
        if(data.column.index < 2 && data.row.raw.span) {
          data.cell.rowSpan = data.row.raw.span;
        }
      }
    },

    willDrawCell: function (data) {
      if(data.row.section == "body") {
        var color = data.row.raw.color;
        var bgColor = color.clone().lighten(20).toRgb();
        var textColor = color.clone().darken(30).toRgb();
        data.doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
        data.doc.setTextColor(textColor.r, textColor.g, textColor.b);
      }
    },

    didDrawCell: function(data) {
      if(data.row.section == "body") {
        if(!data.column.index) {
          var color = data.row.raw.color;
          var bgColor = color.clone().darken(20).toRgb();
          data.doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
          data.doc.rect(data.cell.x, data.cell.y, 0.03, data.cell.height, 'F');
        }
      }
    }
  });
  return doc;
}

async function openpdf() {
  if (state.plans[state.activePlanIndex].activeCombination == null) {
    ui.showBanner("Insira uma ou mais matérias antes de gerar o arquivo pdf",2000);
    return;
  }
  var pdf = new jsPDF('p','in','a4');
  var timeTable = document.getElementById("time-table");
  var pageWidth = pdf.internal.pageSize.getWidth();
  var scale = ((pageWidth - 1) * 300)/timeTable.getBoundingClientRect().width;
  var canvas = await html2canvas(timeTable, {allowTaint: true, scale: scale});
  /*
    pdfInternals = pdf.internal,
    pdfPageSize = pdfInternals.pageSize,
    pdfScaleFactor = pdfInternals.scaleFactor,
    pdfPageWidth = pdfPageSize.getWidth(),
    pdfPageHeight = pdfPageSize.getHeight(),
    totalPdfHeight = 0,
    htmlPageHeight = canvas.height,
    htmlScaleFactor = canvas.width / (pdfPageWidth * pdfScaleFactor);*/

  
  pdf.addImage(canvas, 'png', 0.5, 0.5, pageWidth - 1, (pageWidth - 1) / canvas.width * canvas.height, null, 'NONE');

  /*while(totalPdfHeight < htmlPageHeight){
    var newCanvas = canvasShiftImage(canvas, totalPdfHeight, pdfPageHeight * pdfScaleFactor);

    totalPdfHeight += (pdfPageHeight * pdfScaleFactor * htmlScaleFactor);

    if(totalPdfHeight < htmlPageHeight){ pdf.addPage(); }
  }*/
  pdf = generateTable(pdf);
  pdf.save("matrusp.pdf");
}