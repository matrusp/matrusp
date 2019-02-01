function PrintBox() {
  this.printButton = document.getElementById('print-button');
  this.printButtonIcon = document.getElementById('print-button-icon');

  this.printButton.addEventListener('click',  e => {
    if(this.savedPDF) {
      if(window.navigator && window.navigator.msSaveOrOpenBlob) {
        this.savedPDF.save('matrusp.pdf');
      }
      window.open(this.savedPDF.output('bloburl'), '_blank');
    }
  });
}

function generateTable(doc) {
  doc.autoTable({
    body: [].concat(...state.activePlan.activeCombination.classroomGroups.map(classroomGroup => classroomGroup.map((classroom, i) => ({
      lectureCode: !i? classroom.parent.code : '',
      lectureName: !i? classroom.parent.name : '',
      classroomCode: classroom.shortCode,
      teachers: classroom.teachers.length? classroom.teachers.filter(el => el).reduce((acc, str) => `${acc}\n${str}`) : 'Sem professor designado',
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

PrintBox.prototype.generatePDF = async function() {
  this.printButton.disabled = true;
  this.printButtonIcon.className = 'fas fa-spinner';

  var pdf = new jsPDF('p','in','a4');
  var timeTable = document.getElementById("time-table");
  var pageWidth = pdf.internal.pageSize.getWidth();
  var scale = ((pageWidth - 1) * 300)/timeTable.getBoundingClientRect().width;
 
  var svgBgs = Array.from(document.querySelectorAll(".column-bg svg"));
  svgBgs.forEach(svg => {
    var bounds = svg.getBoundingClientRect();
    svg.setAttribute('width',bounds.width);
    svg.setAttribute('height',bounds.height);
    Array.from(svg.childNodes).forEach(line => {
      var style = window.getComputedStyle(line);
      line.setAttribute('stroke',style.stroke);
      line.setAttribute('stroke-width',style.strokeWidth);
    })
  })
  
  //Generate the timetable canvas
  //Window width and height are needed to get consistent timetable size in every device
  var canvas = await html2canvas(timeTable, {allowTaint: true, useCORS: true, scale: scale, windowWidth: 1280, windowHeight: 800});

  pdf.setFontSize(20);
  pdf.setFontStyle('bold');
  pdf.setTextColor(142);
  pdf.text("MatrUSP",pdf.internal.pageSize.getWidth() / 2, 0.5, {align: 'center', });
 
  pdf.addImage(canvas, 'png', 0.5, 1, pageWidth - 1, (pageWidth - 1) / canvas.width * canvas.height, null, 'NONE');

  pdf = generateTable(pdf);
  pdf.autoPrint();
  this.savedPDF = pdf;

  this.printButtonIcon.className = 'fas fa-print';
  this.printButton.disabled = false;
}