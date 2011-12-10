function xml_to_json(xml) {
    var json = new Object();
    if (xml.childNodes.length == 1 && xml.childNodes[0].nodeType == 3) {
        json = xml.childNodes[0].nodeValue;
    } else {
        for(var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes[i];
            var nodeName = item.nodeName;
            if (json[nodeName] == null) {
                json[nodeName] = xml_to_json(item);
            } else {
                if (!(json[nodeName] instanceof Array)) {
                    var tmp = json[nodeName];
                    json[nodeName] = new Array();
                    json[nodeName].push(tmp);
                }
                json[nodeName].push(xml_to_json(item));
            }
        }
    }
    return json;
};
function make_array(obj1, obj2)
{
    if (!(obj1[obj2] instanceof Array)) {
        var tmp = obj1[obj2];
        obj1[obj2] = new Array();
        if (tmp != null)
            obj1[obj2].push(tmp);
    }
}
function json_fix_materia(materia)
{
    make_array(materia, "turmas");
    if (materia.selected)
        materia.selected = parseInt(materia.selected);
    if (materia.agrupar)
        materia.agrupar  = parseInt(materia.agrupar);
    for (var k = 0; k < materia.turmas.length; k++) {
        var turma = materia.turmas[k];
        if (turma.selected)
            turma.selected = parseInt(turma.selected);
        make_array(turma, "professores");
        make_array(turma, "horarios");
    }
}
function xml_to_materia(xml)
{
    var materia = xml_to_json(xml).materias;
    json_fix_materia(materia);
    return materia;
}
function xml_to_state(xml)
{
    var state = xml_to_json(xml).state;
    make_array(state, "materias");
    for (var k = 0; k < state.materias.length; k++)
        json_fix_materia(state.materias[k]);
    return state;
}
function json_to_xml(json) {
    var xml = new String();
    if (json.substring) {
        xml += json;
    } else {
        for (var i in json) {
            if (json[i] instanceof Array) {
                for (var j = 0; j < json[i].length; j++) {
                    xml += "<"  + i + ">";
                    xml += json_to_xml(json[i][j]);
                    xml += "</" + i + ">";
                }
            } else {
                xml += "<"  + i + ">";
                xml += json[i];
                xml += "</" + i + ">";
            }
        }
    }
    return xml;
}
