<?php
//Script para salvar um plano no disco do usuário, simplesmente devolve os
//dados recebidos em forma de arquivo

if(!$_GET['q'] || !$_POST['ping']){
        header("HTTP/1.0 404 Not Found");
        exit;
}

$query = preg_replace('/[^\w]/', '', $_GET['q']);

header('Content-type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $query .'.json"');

echo $_POST['ping']
?>
