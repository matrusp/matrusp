<?php 
//Script para salvar um plano no disco do servidor, salva no diretório data
define("MAX_DATA_SIZE", 5e5);

if(!$_GET['identifier'] || !$_POST['data']){
        header("HTTP/1.0 404 Not Found");
        exit;
}

if(strlen($_POST['data']) > MAX_DATA_SIZE || is_null(json_decode($_POST['data']))){
        header("HTTP/1.0 400 Bad Request");
        exit;
}

$query = preg_replace('/[^\w]/', '', $_GET['identifier']);

$arq = fopen("./../data/" . $query . ".json", "w");
fwrite($arq, $_POST['data']);
fclose($arq);

header("HTTP/1.0 200 OK");
echo 'OK'; 
?>
