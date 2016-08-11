//TODO: trocar bind para ícone adequado
window.onload = function () {
  document.getElementById('download').addEventListener('click', function () {
    download_picture();
  });
};

function download_picture() {
  html2canvas(document.getElementById("lecture-schedule"), {
    onrendered: function (canvas) {
      var element = document.createElement('a');
      element.setAttribute('href', canvas.toDataURL());
      element.setAttribute('download', 'grade_matrusp.jpeg');
      element.click();
    }
  });
}