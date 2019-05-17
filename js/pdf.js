function PrintBox() {
  this.printButton = document.getElementById('print-button');
  this.printButtonIcon = document.getElementById('print-button-icon');
  this.downloadButton = document.getElementById('download-pdf-button');  
  this.downloadButtonIcon = document.getElementById('download-pdf-button-icon');

  this.formatSelect = document.getElementById('print-format');
  this.colorSelect = document.getElementById('print-color');

  this.options = {};

  this.printIconClass = this.printButtonIcon.className;
  this.downloadIconClass = this.downloadButtonIcon.className;

  this.printButton.addEventListener('click',  e => {
    ui.closeDialog();
    if(this.savedPDF) {
      this.savedPDF.autoPrint();
      if(window.navigator && window.navigator.msSaveOrOpenBlob) {
        this.savedPDF.save(document.title + '.pdf');
      }
      window.open(this.savedPDF.output('bloburl'), '_blank');
    }
  });

  this.formatSelect.addEventListener('change', e => this.updateOptions());
  this.colorSelect.addEventListener('change', e => this.updateOptions());

  this.downloadButton.addEventListener('click', e => {
    ui.closeDialog();
    if(this.savedPDF)
      this.savedPDF.save(document.title + '.pdf');
  });
}

PrintBox.prototype.open = function() {
  if (state.activePlan.activeCombination == null) {
    ui.showBanner("Insira uma ou mais matérias antes de gerar o arquivo pdf",2000);
    return;
  }
  
  ui.openPrintDialog()
  this.updateOptions();
}

PrintBox.prototype.updateOptions = function() {
  this.options.format = this.formatSelect.value;
  this.options.color = this.colorSelect.value;

  this.generatePDF();
}

PrintBox.prototype.generateTable = function(doc) {
  doc.autoTable({
    body: [].concat(...state.activePlan.activeCombination.classroomGroups.map(classroomGroup => classroomGroup.map((classroom, i) => ({
      lectureCode: !i? classroom.parent.code : '',
      lectureName: !i? classroom.parent.name : '',
      classroomCode: classroom.shortCode,
      teachers: classroom.teachers.filter(el => el).join('\n') || 'Sem professor designado',
      color: classroom.parent.color,
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
    startY: 6.6,

    didParseCell: data => {
      if(data.row.section == "body") {
        if(data.column.index < 2 && data.row.raw.span) {
          data.cell.rowSpan = data.row.raw.span;
        }
      }
    },

    willDrawCell: data => {
      if(data.row.section == "body") {
        var color = ui.colors[data.row.raw.color];
        var bgColor = color.clone().lighten(20).toRgb();
        var textColor = color.clone().darken(35).toRgb();
        switch(this.options.color) {
          case 'eco-color':
            data.doc.setFillColor(255);
            data.doc.setTextColor(textColor.r, textColor.g, textColor.b);
            break;
          case 'grayscale':
            var gray = 255 * data.row.raw.color/5 % 255;
            data.doc.setFillColor(gray);
            if(gray > 255/2)
              data.doc.setTextColor(0);
            else
              data.doc.setTextColor(255);
            break;
          default:
            data.doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
            data.doc.setTextColor(textColor.r, textColor.g, textColor.b);
            break;
        }
      }
    },

    didDrawCell: data => {
      if(data.row.section == "body") {
        if(data.column.index == data.settings.columns.length - 1) {
          switch(this.options.color) {
            case 'eco-color':
              var color = ui.colors[data.row.raw.color];
              var bgColor = color.clone().darken(20).toRgb();              
              var lightColor = color.clone().lighten(20).toRgb();
              var borderWidth = 0.03;     
              var rowWidth = Object.values(data.row.cells).reduce((acc, cell) => acc + cell.width, 0);

              data.doc.setDrawColor(lightColor.r, lightColor.g, lightColor.b);
              data.doc.setLineWidth(borderWidth);
              
              if(data.row.raw.span)
                data.doc.rect(data.row.x - borderWidth/2, data.row.y - borderWidth/2, rowWidth + borderWidth, data.row.height*data.row.raw.span + borderWidth, 'S');

              data.doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
              data.doc.rect(data.row.x - borderWidth, data.row.y, borderWidth, data.row.height, 'F');
              data.doc.triangle(data.row.x - borderWidth, data.row.y, data.row.x, data.row.y, data.row.x - borderWidth, data.row.y - borderWidth, 'F');
              data.doc.triangle(data.row.x - borderWidth, data.row.y + data.row.height, data.row.x, data.row.y + data.row.height, data.row.x - borderWidth, data.row.y + data.row.height + borderWidth, 'F');     
              break;
            
            case 'grayscale':
              break;

            default:
              var color = ui.colors[data.row.raw.color];
              var bgColor = color.clone().darken(20).toRgb(); 
              var borderWidth = 0.03;

              data.doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
              data.doc.rect(data.row.x, data.row.y, borderWidth, data.row.height, 'F');
              break;
          }

        }
      }
    }
  });
  return doc;
}

PrintBox.prototype.generatePDF = async function() {
  this.printButton.disabled = true;
  this.downloadButton.disabled = true;
  this.printButtonIcon.className = this.downloadButtonIcon.className = 'fas fa-spinner';

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
  var canvas = await html2canvas(timeTable, {allowTaint: true, useCORS: true, scale: scale, windowWidth: 1280, windowHeight: 800, 
    onclone: clonedDoc => {
     var timeTable = clonedDoc.getElementById('time-table');
     timeTable.classList.add('print');
     if(this.options.color == 'eco-color')
      timeTable.classList.add('ecoprint');
     else if (this.options.color == 'grayscale')
      timeTable.classList.add('grayscale');
    }
  });

  pdf.setFontSize(20);
  pdf.setFontStyle('bold');
  pdf.setTextColor(142);
  pdf.text("MatrUSP",pdf.internal.pageSize.getWidth() / 2, 0.5, {align: 'center', });
 
  pdf.addImage(canvas, 'png', 0.5, 1, pageWidth - 1, (pageWidth - 1) / canvas.width * canvas.height, null, 'NONE');

  pdf = this.generateTable(pdf);
  this.savedPDF = pdf;

  this.printButtonIcon.className = this.printIconClass;
  this.downloadButtonIcon.className = this.downloadIconClass;
  this.printButton.disabled = false;
  this.downloadButton.disabled = false;
}