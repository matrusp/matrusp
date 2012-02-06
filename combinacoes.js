/**
 * @constructor
 */
function Combinacoes()
{
    var self = this;

    var combinacoes = null;
    var current_int = 0;
    var overlay = null;

    function clear_overlay() {
        overlay = [[],[],[],[],[],[]];
    }
    clear_overlay();
    function closest(orig) {
        if (!orig)
            return 1;
        var best_c = null;
        var best_p = 0;
        combinacoes.forEach(function(c,j){
            var sum = 0;
            c.horarios_combo.forEach(function(horario){
                var t = horario.turma_representante;
                var t2 = null;
                if (orig.horarios_combo.some(function(horario2){
                        t2 = horario2.turma_representante;
                        return t.materia == t2.materia;
                    }))
                    sum += 10;
                if (t2 && t == t2)
                    sum += 100;
            });
            if (best_p < sum) {
                best_p = sum;
                best_c = j;
            }
        });
        return best_c+1;
    }
    function copy(combinacao, except) {
        var c2 = new Array();
        for (var i2 = 0; i2 < 6; i2++) {
            c2[i2] = new Array();
            for (var i3 = 0; i3 < 14; i3++) {
                if (combinacao[i2][i3] && combinacao[i2][i3].horario.materia != except)
                    c2[i2][i3] = {horario:combinacao[i2][i3].horario};
            }
        }
        return c2;
    }
    var generate = function(materias) {
        var new_combinacoes = new Array();
        for (var i = 0; i < materias.length; i++) {
            var materia = materias[i];
            var ok = 0;

            if (materia.selected == 0)
                continue;
            /* se nenhuma turma de nenhum horario da materia esta
             * selecionada, pular materia */
            for (var j in materia.horarios) {
                var horario = materia.horarios[j];
                for (var k in horario.turmas) {
                    if (horario.turmas[k].selected) {
                        ok = 1;
                        break;
                    }
                }
                if (ok)
                    break;
            }
            if (!ok) {
                materia.selected = 0;
                continue;
            }

            materia.selected = 1;
            if (!new_combinacoes.length) {
                for (var j in materia.horarios) {
                    var horario = materia.horarios[j];
                    var ok = 0;
                    for (var k in horario.turmas) {
                        if (horario.turmas[k].selected) {
                            ok = 1;
                            break;
                        }
                    }
                    if (!ok)
                        continue;
                    var combinacao = [[],[],[],[],[],[]];
                    for (var k = 0; k < horario.aulas.length; k++) {
                        var aula = horario.aulas[k];
                        combinacao[aula.dia][aula.hora] = {horario:horario};
                    }
                    combinacao[materia.codigo] = horario;
                    combinacao.horarios_combo = new Array();
                    combinacao.horarios_combo.push(horario);
                    new_combinacoes.push(combinacao);
                }
            } else {
                var ok3 = 0;
                var combinacoes2 = new Array();
                for (var c in new_combinacoes) {
                    var combinacao = new_combinacoes[c];
                    var ok2 = 0;

                    for (var j in materia.horarios) {
                        var horario = materia.horarios[j];
                        var ok = 0;
                        for (var k in horario.turmas) {
                            if (horario.turmas[k].selected)
                                ok = 1;
                        }
                        if (!ok)
                            continue;
                        for (var k = 0; k < horario.aulas.length; k++) {
                            var aula = horario.aulas[k];
                            var dia  = aula.dia;
                            var hora = aula.hora;
                            if (combinacao[dia][hora]) {
                                ok = 0;
                                break;
                            }
                            if (!ok) {
                                break;
                            }
                        }
                        if (!ok)
                            continue;
                        var c2 = copy(combinacao);
                        c2[materia.codigo] = horario;
                        c2.horarios_combo = new Array();
                        for (var k in combinacao.horarios_combo) {
                            c2[combinacao.horarios_combo[k].materia.codigo] = combinacao.horarios_combo[k];
                            c2.horarios_combo.push(combinacao.horarios_combo[k]);
                        }
                        for (var k = 0; k < horario.aulas.length; k++) {
                            var aula = horario.aulas[k];
                            c2[aula.dia][aula.hora] = {horario:horario};
                        }
                        c2.horarios_combo.push(horario);
                        combinacoes2.push(c2);
                        ok2 = 1;
                        ok3 = 1;
                    }
//                    if (!ok2) {
//                        if (navigator.userAgent.toLowerCase().indexOf("msie") < 0)
//                        console.log("choque de horario, horario nao pode ser adicionado em nenhuma combinacao");
//                    }
                }
                if (!ok3) {
//                    if (navigator.userAgent.toLowerCase().indexOf("msie") < 0)
//                    console.log("choque de horario, materia ", materia.codigo, " nao pode ser adicionado em nenhuma combinacao");
                    materia.selected = -1;
                } else {
                    new_combinacoes = combinacoes2;
                }
            }
        }
        new_combinacoes.forEach(function(c){
            var sum = 0;
            c.forEach(function(dia){
                dia.forEach(function(obj,hora){
                    sum += hora;
                });
            });
            c.sum = sum;
        });
        new_combinacoes.sort(function(a,b) {
            return a.sum - b.sum;
        });
        combinacoes = new_combinacoes;
    }

    /* procedures */
    self.generate    = generate;
    self.set_current = function(n) { current_int = n; };
    self.clear_overlay= clear_overlay;
    /* functions */
    self.get         = function(n) { if (combinacoes && n >= 1 && n <= combinacoes.length) return combinacoes[n-1]; };
    self.get_current = function( ) { if (current_int) return self.get(current_int); };
    self.get_overlay = function( ) { return overlay; };
    self.current     = function( ) { return current_int; };
    self.length      = function( ) { return combinacoes ? combinacoes.length : 0; };
    self.copy        = function(c, e) { return copy(c, e); };
    self.closest     = closest;
}
