/**
 * @constructor
 */
function UI_horario(id)
{
    var self = this;
    var dias  = [ "Segunda", "Ter\u00e7a", "Quarta", "Quinta", "Sexta", "S\u00e1bado" ];
    var horas = [ "07:30", "08:20", "09:10", "10:10", "11:00",
                    "13:30", "14:20", "15:10", "16:20", "17:10",
                    "18:30", "19:20", "20:20", "21:10", "22:00"];

    //td_day[0] é a célula da tabela correspondente à segunda feira
    var td_day = [];
    //materias[dia + "-" + hora_inicio + "-" + hora_fim] é o div da matéria
    var materias = {};
    
    var horario = document.getElementById(id);
    horario.className = "ui_horario";

    var table = document.createElement("table");
    var thead = document.createElement("thead");
    
    //Cabeçalho da tabela com os dias da semana
    var row = document.createElement("tr");
    row.appendChild(document.createElement("th"));
    for (var i = 0; i < dias.length; i++) {
        var head = document.createElement("th");
        head.innerHTML = dias[i];
        row.appendChild(head);
    }
    thead.appendChild(row);
    table.appendChild(thead);
    
    //Corpo da tabela: Uma única linha onde serão inseridas as matérias como divs
    var tbody = document.createElement("tbody");
    var row_content = document.createElement("tr");
    
    var td_hour = document.createElement("td");
    row_content.appendChild(td_hour);

	/*
	    
    for (var i = 0; i < dias.length; i++) {
        td_day[i] = document.createElement("td");
        td_day[i].className = "ui_horario_celula";
        td_day[i].innerHTML = "&nbsp;";
        row_content.appendChild(td_day[i]);
    }
    
    */
        
    for (var i = 0; i < dias.length; i++) {
    	var td = document.createElement("td");
        td.className = "ui_horario_celula";
        td_day[i] = document.createElement("div");
        td_day[i].className = "ui_horario_container";
        td.appendChild(td_day[i]);
        row_content.appendChild(td);
    }
    
    tbody.appendChild(row_content);

    //Linhas tracejadas das horas
    for (var i = 0; i <= 18; i++){
        var div_hour = document.createElement("div");
        div_hour.className = "ui_horario_hora";
        var hour = ((i + 6) % 24).toString();
        if (hour.length == 1)
            hour = "0" + hour;
        div_hour.innerHTML = hour + ":00";
        td_hour.appendChild(div_hour);
        
        var div_line = document.createElement("div");
        div_line.className = "ui_horario_linha";
        div_line.style.top = i * 23 + 15 + "px";
        
        for (var j = 0; j < dias.length; j++) {
            td_day[j].appendChild(div_line.cloneNode(true));
        }
    }
    
    table.appendChild(tbody);
    horario.appendChild(table);
    
    var hash_materia = function(dia, hora_inicio, hora_fim) {
        return dia + "-" + hora_inicio + "-" + hora_fim;
    }
    
    var remove_node = function(hash) {
        var cell = materias[hash];
        if (cell != null && cell != undefined && cell.parentNode != null) {
            cell.parentNode.removeChild(cell);
            delete materias[hash];
        }
    }
    
    var reset = function() {
        for (var m in materias){
            remove_node(m);
        }
    }
    
    var clear_cell2 = function(dia, hora_inicio, hora_fim) {
        remove_node(hash_materia(dia, hora_inicio, hora_fim));
    }

	var clear_materia = function(codigo){
		var to_remove = []
    	for (var m in materias){
    		if(materias[m].innerHTML.indexOf(codigo) != -1)
    			to_remove.push(m);
    	}
    	
    	to_remove.forEach(function(r) { 
    		remove_node(r);	
    	});
	}

    //hora_inicio e hora_fim devem ter o formato "hh:mm"
    var display_cell2 = function(dia, inicio, fim, info) {
        var str_inicio = inicio;
        var str_fim = fim;
        var hash = hash_materia(dia, inicio, fim);
        var cell = materias[hash];
        
        if(cell == null){
            cell = document.createElement("div");
            cell.className = "ui_horario_materia";
            
            inicio = inicio.split(":");
            fim = fim.split(":");
            inicio = +inicio[0] + 1.0 * +inicio[1]/60;
            fim = +fim[0] + 1.0 * +fim[1]/60;
            
            cell.style.top = (inicio - 6) * 23 + 15 + "px";
            cell.style.height = (fim - inicio) * 23 + "px";

            td_day[dia].appendChild(cell);
            materias[hash] = cell;
        }
        
        cell.innerHTML = 
            "<div class=\"ui_horario_inicio\">" + str_inicio + "</div>" + 
            "<div>" + info.text + "</div>" + 
            "<div class=\"ui_horario_fim\">" + str_fim + "</div>";
        cell.style.backgroundColor = info.bgcolor;
        cell.style.color = info.color;
    }
    
    //TODO: Remover após troca das chamadas antigas para clear_cell2
    var clear_cell = function(dia, hora) {
        clear_cell2(dia, horas[hora], horas[hora + 1]);
    }

    //TODO: Remover após troca das chamadas antigas para display_cell2
    var display_cell = function(dia, hora, data) {
        display_cell2(dia, horas[hora], horas[hora + 1], data);
    }
    
    //TODO: Implementar
    function set_toggle(func, onover, onout) {
        
/*
        for (var dia = 0; dia < 6; dia++) {
            for (var hora = 0; hora < 14; hora++) {
                var materia = materias[dia + "-" + hora];
                if (func) {
                    materia.style.cursor = "pointer";
                    materia.onclick     = function() { func(this.dia, this.hora); };
                    materia.onmouseover = function() { onover(this.dia, this.hora); };
                    materia.onmouseout  = function() { onout(this.dia, this.hora); };
                } else {
                    materia.style.cursor = "";
                    materia.onclick = null;
                    materia.onmouseover = null;
                    materia.onmouseout = null;
                }
                materia.dia = dia;
                materia.hora = hora;
            }
        }
        if (func) {
            horario.style.zIndex = "2000";
        } else {
            horario.style.zIndex = "0";
        }
*/
    }

    /* procedures */
    self.set_toggle    = set_toggle;
    self.reset         = reset;
    self.remove_node   = remove_node;
    self.display_cell2 = display_cell2;
    self.clear_cell2   = clear_cell2;
    self.display_cell  = display_cell;
    self.clear_cell    = clear_cell;
    self.clear_materia = clear_materia;
    
    /* functions */
    self.height        = function() { return horario.offsetHeight; };
    self.hash_materia  = hash_materia;
}

var Cell = {
    normal: function(  d) { return {text:d.horario.materia.codigo,bgcolor:d.horario.materia.cor,color:"black"}; },
    red   : function(str) { return {text:str,bgcolor:"red",color:"black"}; },
    black : function(str) { return {text:str,bgcolor:"black",color:"white"}; }
};
