/**
 * @constructor
 */
function Combinacoes()
{
    var self = this;

    var combinacoes = null;
    var current_int = 0;

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
            for (var i3 in combinacao[i2]) {
                c2[i2].push(combinacao[i2][i3]);
            }
        }
        return c2;
    }
    
    var generate = function(materias) {
        var new_combinacoes = new Array();
        for (var i = 0; i < materias.length; i++) {
            var materia = materias[i];

            materia.selected = ((materia.selected != 0) &&
                                materia.turmas.some(function(turma){
                                    return turma.selected;
                                })) ? 1 : 0;
            if (!materia.selected)
                continue;

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
                        combinacao[aula.dia].push(aula);
//                        combinacao[aula.dia].horario = [horario];
                    }
                    combinacao["'" + materia.codigo + "'"] = horario;
                    combinacao.horarios_combo = new Array();
                    combinacao.horarios_combo.push(horario);
                    new_combinacoes.push(combinacao);
                }
                
            } else {
                var ok3 = 0;
                var combinacoes2 = new Array();
                new_combinacoes.forEach(function(combinacao){
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
                            
                            if (aula.tem_conflito(combinacao[dia])) {
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
                        c2["'" + materia.codigo + "'"] = horario;
                        c2.horarios_combo = new Array();
                        combinacao.horarios_combo.forEach(function(horario){
                            c2["'" + horario.materia.codigo + "'"] = horario;
                            c2.horarios_combo.push(horario);
                        });
                        for (var k = 0; k < horario.aulas.length; k++) {
                            var aula = horario.aulas[k];
    	                    c2[aula.dia].push(aula);
                        }
                        c2.horarios_combo.push(horario);
                        combinacoes2.push(c2);
                        ok3 = 1;
                    }
                });
                if (!ok3) {
                    materia.selected = -1;
                } else {
                    new_combinacoes = combinacoes2;
                }
            }
        }
        new_combinacoes.forEach(function(c){
            var sum = 0;
            c.forEach(function(dia){
               	sum += dia.length;
            });
            c.sum = sum;
        });
        new_combinacoes.sort(function(a,b) {
            return a.sum - b.sum;
        });
        combinacoes = new_combinacoes;
        console.log(combinacoes);
    }

    /* procedures */
    self.generate    = generate;
    self.set_current = function(n) { current_int = n; };
    /* functions */
    self.get         = function(n) { if (combinacoes && n >= 1 && n <= combinacoes.length) return combinacoes[n-1]; };
    self.get_current = function( ) { if (current_int) return self.get(current_int); };
    self.current     = function( ) { return current_int; };
    self.length      = function( ) { return combinacoes ? combinacoes.length : 0; };
    self.copy        = function(c, e) { return copy(c, e); };
    self.closest     = closest;
}
