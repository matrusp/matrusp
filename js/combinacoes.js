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
            for (var i3 = 0; i3 < 14; i3++) {
                if (combinacao[i2][i3] && combinacao[i2][i3].horario.materia != except)
                    c2[i2][i3] = {horario:combinacao[i2][i3].horario,sala:combinacao[i2][i3].sala};
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
                        combinacao[aula.dia][aula.hora] = {horario:horario,sala:aula.sala};
                    }
                    combinacao[materia.codigo] = horario;
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
                        combinacao.horarios_combo.forEach(function(horario){
                            c2[horario.materia.codigo] = horario;
                            c2.horarios_combo.push(horario);
                        });
                        for (var k = 0; k < horario.aulas.length; k++) {
                            var aula = horario.aulas[k];
                            c2[aula.dia][aula.hora] = {horario:horario,sala:aula.sala};
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
            var peso = 0;
            var dias = 0;
            var janelas = 0;
            c.forEach(function(dia){
                var items = dia.filter(function(x){return x !== undefined;});
                if (items.length > 0) {
                    janelas += 1+dia.indexOf(items[items.length-1])-dia.indexOf(items[0])-items.length;
                    dias += 1;
                }
                dia.forEach(function(obj,hora){
                    peso += hora;
                });
            });
            c.sort_peso = peso;
            c.sort_dias = dias;
            c.sort_janelas = janelas
        });
        new_combinacoes.sort(function(a,b) {
            return a.sort_peso - b.sort_peso;
        });
        var comum = [[],[],[],[],[],[]];
        for (var i4 = 0; i4 < 6; i4++)
            for (var j = 0; j < 14; j++)
                comum[i4][j] = 1;
        for (var cc in new_combinacoes) {
            var c = new_combinacoes[cc];
            for (dia = 0; dia < 6; dia++) {
                for (hora = 0; hora < 14; hora++) {
                    if (comum[dia][hora] == 1 && c[dia][hora]) {
                        comum[dia][hora] = c[dia][hora];
                    } else if (!c[dia][hora] || !c[dia][hora].horario || !comum[dia][hora] || !comum[dia][hora].horario) {
                        comum[dia][hora] = 0;
                    } else if (c[dia][hora].horario.materia.codigo != comum[dia][hora].horario.materia.codigo) {
                        comum[dia][hora] = 0;
                    }
                }
            }
        }
        for (var cc in new_combinacoes) {
            var c = new_combinacoes[cc];
            for (dia = 0; dia < 6; dia++)
                for (hora = 0; hora < 14; hora++)
                    if (comum[dia][hora])
                        c[dia][hora].fixed = 1;
        }
        combinacoes = new_combinacoes;
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
