<?php 
//Script para salvar um plano no disco do servidor, salva no diretório data

if(!$_GET['q'] || !$_POST['data']){
        header("HTTP/1.0 404 Not Found");
        exit;
}

$query = preg_replace('/[^\w]/', '', $_GET['q']);

$arq = fopen("./data/" . $query . ".txt", "w");
fwrite($arq, $_POST['data']);
fclose($arq);

header("HTTP/1.0 200 OK");
echo 'OK'; 
?>
