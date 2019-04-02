document.getElementById("contact").addEventListener('click', e => {
   var msg =
`\n
===========================================================\n
Deixe aqui sua dúvida ou sugestão.\n\n
Em caso de problemas, tente explicar da forma mais completa possível para que possamos identificar a causa. Tente acrescentar o que estava fazendo no momento, quais disciplinas estavam selecionadas e o passo a passo para causar o problema. Obrigado.\n
===========================================================\n\n
Informações úteis para nós: ${btoa(state.toJSON())}\n
===========================================================\n\n`;

   location.href = "mailto:apoiobcc@linux.ime.usp.br?subject=D%C3%BAvida/Sugest%C3%A3o%20MatrUSP&body=" + encodeURI(msg); 

   e.preventDefault();
});