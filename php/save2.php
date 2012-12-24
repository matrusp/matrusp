<?php 
//Script para salvar um plano no disco do servidor, salva no diretório data

if(!$_GET['q'] || !$_POST['data']){
        header("HTTP/1.0 404 Not Found");
        exit;
}

$arq = fopen("./data/" . $_GET['q'] . ".txt", "w");
fwrite($arq, $_POST['data']);
fclose($arq);

header("HTTP/1.0 200 OK");
echo 'OK'; 
?>
