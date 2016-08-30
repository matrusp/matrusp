<?php 
//Script para salvar um plano no disco do servidor, salva no diretório data

if(!$_GET['identifier'] || !$_POST['data']){
        header("HTTP/1.0 404 Not Found");
        exit;
}

$query = preg_replace('/[^\w]/', '', $_GET['identifier']);

$arq = fopen("./../data/" . $query . ".json", "w");
fwrite($arq, $_POST['data']);
fclose($arq);

header("HTTP/1.0 200 OK");
echo 'OK'; 
?>
