//TODO: trocar bind para ícone adequado
//document.getElementById('download').addEventListener('click', download_picture);

function download_picture() {
  html2canvas(document.getElementById("lecture-schedule"), {
    onrendered: function (canvas) {
      var element = document.createElement('a');
      element.style.display = "none";
      element.setAttribute('href', canvas.toDataURL());
      element.setAttribute('download', 'grade_matrusp');
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    background: '#ffffff'
  });
}