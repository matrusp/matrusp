function Combinacoes()
{
    var self = this;

    var deselected = new Array();
    var combinacoes = null;
    var current_int = 0;
    var overlay = null;

    function clear_overlay() {
        overlay = new Array();
        for (var i = 0; i < 6; i++)
            overlay[i] = new Array();
    }
    clear_overlay();
    function closest() {
        return 1;
    }
    function valor_combinacao(c) {
        var sum = 0;
        for (dia = 0; dia < 6; dia++) {
            for (hora = 0; hora < 14; hora++) {
                if (c[dia][hora]) {
                    sum += hora;
                }
            }
        }
        return sum;
    }
    function comparar_combinacoes(a, b) {
        var va = valor_combinacao(a);
        var vb = valor_combinacao(b);
        return va - vb;
    }
    var generate = function(materias) {
/* TODO tentar manter selecao anterior (ou mais semelhante) */
        var new_combinacoes = new Array();
        var new_deselected = new Array();
        for (var i = 0; i < materias.length; i++) {
            var materia = materias[i];
            var ok = 0;

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
                new_deselected[materia.codigo] = materia;
                continue;
            }

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
                    var combinacao = new Array();
                    for (var i2 = 0; i2 < 6; i2++) {
                        combinacao[i2] = new Array();
                    }
                    for (var k in horario.aulas) {
                        var aula = horario.aulas[k];
                        var dia  = aula.dia;
                        var hora = aula.hora;
                        var n    = aula.n;
                        for (var i3 = 0; i3 < n; i3++) {
                            combinacao[dia][hora+i3] = new Object();
                            combinacao[dia][hora+i3].horario = horario;
                        }
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
                        for (var k in horario.aulas) {
                            var aula = horario.aulas[k];
                            var dia  = aula.dia;
                            var hora = aula.hora;
                            var n    = aula.n;
                            for (var i3 = 0; i3 < n; i3++) {
                                if (combinacao[dia][hora+i3]) {
                                    ok = 0;
                                    break;
                                }
                            }
                            if (!ok) {
                                break;
                            }
                        }
                        if (!ok)
                            continue;
                        var c2 = new Array();
                        for (var i2 = 0; i2 < 6; i2++) {
                            c2[i2] = new Array();
                            for (var i3 = 0; i3 < 14; i3++) {
                                if (combinacao[i2][i3]) {
                                    c2[i2][i3] = new Object();
                                    c2[i2][i3].horario = combinacao[i2][i3].horario;
                                }
                            }
                        }
                        c2[materia.codigo] = horario;
                        c2.horarios_combo = new Array();
                        for (var k in combinacao.horarios_combo) {
                            c2[combinacao.horarios_combo[k].materia.codigo] = combinacao.horarios_combo[k];
                            c2.horarios_combo.push(combinacao.horarios_combo[k]);
                        }
                        for (var k in horario.aulas) {
                            var aula = horario.aulas[k];
                            var dia  = aula.dia;
                            var hora = aula.hora;
                            var n    = aula.n;
                            for (var i3 = 0; i3 < n; i3++) {
                                c2[dia][hora+i3] = new Object();
                                c2[dia][hora+i3].horario = horario;
                            }
                        }
                        c2.horarios_combo.push(horario);
                        combinacoes2.push(c2);
                        ok2 = 1;
                        ok3 = 1;
                    }
                    if (!ok2) {
                        if (navigator.userAgent.toLowerCase().indexOf("msie") < 0)
                        console.log("choque de horario, horario nao pode ser adicionado em nenhuma combinacao");
                    }
                }
                if (!ok3) {
                    if (navigator.userAgent.toLowerCase().indexOf("msie") < 0)
                    console.log("choque de horario, materia ", materia.codigo, " nao pode ser adicionado em nenhuma combinacao");
                    new_deselected[materia.codigo] = materia;
                    /* TODO dar essa informacao ao usuario */
                } else {
                    new_combinacoes = combinacoes2;
                }
            }
        }
        var comum = new Array();
        for (var i4 = 0; i4 < 6; i4++) {
            comum[i4] = new Array();
            for (var j = 0; j < 14; j++) {
                comum[i4][j] = 1;
            }
        }
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
            for (dia = 0; dia < 6; dia++) {
                for (hora = 0; hora < 14; hora++) {
                    if (comum[dia][hora]) {
                        c[dia][hora].fixed = 1;
                    }
                }
            }
        }
        new_combinacoes.sort(comparar_combinacoes);
        combinacoes = new_combinacoes;
        deselected = new_deselected;
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
    self.deselected  = function( ) { return deselected; };
    self.length      = function( ) { return combinacoes ? combinacoes.length : 0; };
    self.closest     = closest;
}
