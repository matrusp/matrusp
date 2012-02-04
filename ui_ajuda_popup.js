/**
 * @constructor
 */
function UI_grayout(id)
{
    var self = this;

    self.grayout = document.getElementById(id);
    self.grayout.className = "ui_grayout";
    self.grayout.onclick = function() { self.cb_onclick(); };

    /* procedures */
    self.hide = function() { self.grayout.style.display = "none"; };
    self.show = function() { self.grayout.style.display = ""; };
    self.cb_onclick = null;

    self.hide();
}

/**
 * @constructor
 */
function UI_ajuda_popup(id)
{
    var self = this;

    self.popup = document.getElementById(id);
    self.popup.className = "ui_ajuda_popup";

    function show() {
        self.popup.style.display = "";
        self.popup.style.marginLeft = "-" + (self.popup.offsetWidth /2) + "px";
    }

    /* procedures */
    self.hide         = function() { self.popup.style.display = "none"; };
    self.show         = show;

    self.hide();

    var table = document.createElement("table");
    var tbody = document.createElement("tbody");
    table.appendChild(tbody);

    table.align = "center";
    table.style.width = "90%";

    var row = document.createElement("tr");
    var data = document.createElement("td");
    data.align = "right";
    var fechar_ajuda = document.createElement("div");
    fechar_ajuda.innerHTML = "<a href=\"#\">Fechar</a></div>";
    fechar_ajuda.onclick = function() { self.cb_fechar(); };
    data.appendChild(fechar_ajuda);
    row.appendChild(data);
    tbody.appendChild(row);

    var row = document.createElement("tr");
    var data = document.createElement("td");
    data.align = "center";
    data.innerHTML =
"<br>" +
"Para qualquer comentário visite a página no Facebook:<br>" +
"<a href=\"http://www.facebook.com/MatrUFSC\">http://www.facebook.com/MatrUFSC</a><br>" +
"(ou entre em contato por email: ramiro.polla@gmail.com)" +
"<br><br>";
    row.appendChild(data);
    tbody.appendChild(row);

    var row = document.createElement("tr");
    var data = document.createElement("td");
    data.align = "justify";
    data.innerHTML =
"<br>" +
"<strong>1- Adicionando matérias do CAGR:</strong><br>" +
"Digite o código ou o nome da disciplina na caixa de busca (canto" +
"esquerdo superior). Aparecerão no máximo 10 sugestões, nas quais você" +
"pode clicar ou escolher com as teclas <strong>para baixo</strong> e <strong>para cima</strong> do" +
"teclado e apertar <strong>enter</strong>.<br>" +
"O sistema de buscas é meio burro: só são aceitos termos contínuos. Por" +
"exemplo <strong>eletronica de potencia</strong> apresentará a matéria corretamente," +
"mas <strong>eletronica potencia</strong> não apresentará resultados." +
"Você pode selecionar matérias individualmente clicando na caixa se" +
"seleção da matéria, selecionar a prioridade das matérias clicando nos botões <strong>^</strong>" +
"e <strong>v</strong> e remover matérias clicando no botão <strong>X</strong>.<br>" +
"<br>" +
"<strong>1.1- Escolhendo turmas:</strong><br>" +
"Clique na matéria para mostrar as suas turmas na caixa de turmas (lado" +
"direito do horário). Os horários de cada turma são mostrados" +
"graficamente ao passar o mouse por cima da sua linha. Selecione turmas" +
"individualmente clicando na sua linha ou na sua caixa de seleção." +
"Turmas com o mesmo horário podem ser agrupadas e consideradas como uma só" +
"para o gerador de combinações.<br>" +
"<br>" +
"<strong>2- Combinações:</strong><br>" +
"As combinações são geradas automaticamente a cada ação que mude as" +
"matérias/turmas selecionadas. Para mudar de combinação, use as teclas" +
"<strong>direita</strong> e <strong>esquerda</strong>, ou clique nas setas <strong>&nbsp;&lt;&nbsp;</strong>" +
"e <strong>&nbsp;&gt;&nbsp;</strong> na caixa de" +
"combinações, ou escreva um número na caixa de combinações e aperte" +
"<strong>enter</strong>.<br>" +
"As turmas de cada combinação serão mostradas na caixa de matérias.<br>" +
"<br>" +
"<strong>3- Criando suas próprias atividades:</strong><br>" +
"O suporte para criar sua próprias atividades ainda é meio complicado:<br>" +
"- Digite o nome da atividade na caixa de busca, por exemplo <strong>Estágio</strong>.<br>" +
"- Clique em <strong>Criar atividade nova</strong>. Uma nova atividade será adicionada" +
"na caixa de matérias (em cima do horário).<br>" +
"- Na caixa de turmas, clique em <strong>adicione turmas aqui</strong>. Uma nova turma" +
"será adicionada na caixa de turmas.<br>" +
"- Clique no botão <strong>E</strong> para editar o horário dessa turma.<br>" +
"- Especifique o horário graficamente na caixa de horário.<br>" +
"- Clique em <strong>OK</strong> ou <strong>Cancelar</strong>.<br>" +
"<br>" +
"<strong>4- Salvando/abrindo horários</strong><br>" +
"É possível salvar seus horários para que eles sejam acessadas" +
"futuramente. Escolha qualquer identificador (por exemplo sua matrícula)" +
"e clique no botão <strong>salvar</strong> no canto direito superior. Em qualquer" +
"momento é possível clicar em <strong>abrir</strong> para recarregar as combinações" +
"salvas com o identificador especificado.<br>" +
"<strong>Cuidado:</strong> qualquer um pode salvar/carregar em qualquer identificador!" +
"Se você se importa com a privacidade de seus horários, use" +
"identificadores grandes, complexos e não-previsíveis (ou simplesmente" +
"não salve seu horário).<br>" +
"<br>" +
"Essa aplicativo web funciona nos principais navegadores que eu me importo:" +
"Firefox, Safari, Google Chrome e Internet Explorer 7 ou maior. O" +
"programa fica meio devagar no Internet Explorer. Sugiro que um" +
"navegador mais eficiente como o Google Chrome seja usado.";
    row.appendChild(data);
    tbody.appendChild(row);

    self.popup.appendChild(table);
}
